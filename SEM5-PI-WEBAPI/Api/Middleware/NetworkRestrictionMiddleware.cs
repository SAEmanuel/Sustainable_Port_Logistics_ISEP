using System.Net;
using Microsoft.Extensions.Options;
using SEM5_PI_WEBAPI.Api.Config; 

namespace SEM5_PI_WEBAPI.Api.Middleware
{
    public class NetworkRestrictionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<NetworkRestrictionMiddleware> _logger;
        private readonly bool _enforce;
        private readonly List<CidrRange> _allowedRanges = new();
        private readonly string _environmentName;

        private sealed record CidrRange(IPAddress Network, int PrefixLength)
        {
            public bool Contains(IPAddress address)
            {
                var addrBytes = address.GetAddressBytes();
                var netBytes = Network.GetAddressBytes();

                if (addrBytes.Length != netBytes.Length)
                    return false;

                int fullBytes = PrefixLength / 8;
                int remainingBits = PrefixLength % 8;

                for (int i = 0; i < fullBytes; i++)
                {
                    if (addrBytes[i] != netBytes[i]) return false;
                }

                if (remainingBits == 0) return true;

                int mask = (byte)~(0xFF >> remainingBits);
                return (addrBytes[fullBytes] & mask) == (netBytes[fullBytes] & mask);
            }
        }

        public NetworkRestrictionMiddleware(RequestDelegate next, ILogger<NetworkRestrictionMiddleware> logger, IOptions<NetworkAccessOptions> options, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _environmentName = env.EnvironmentName;

            var cfg = options.Value;
 
            _enforce = cfg.EnforceForEnvironments.Contains(env.EnvironmentName, StringComparer.OrdinalIgnoreCase);

            if (!_enforce)
            {
                _logger.LogInformation("NetworkRestrictionMiddleware disabled for environment {Env}.", env.EnvironmentName);
                return;
            }

            if (cfg.AllowedCidrs is null || cfg.AllowedCidrs.Length == 0)
            {
                _logger.LogWarning("NetworkRestrictionMiddleware enabled for environment {Env} but no AllowedCidrs configured. All requests will be denied.", env.EnvironmentName);
                return;
            }

            foreach (var entry in cfg.AllowedCidrs)
            {
                if (TryParseCidr(entry, out var range))
                {
                    _allowedRanges.Add(range!);
                }
                else
                {
                    _logger.LogWarning("Invalid CIDR entry in NetworkAccess.AllowedCidrs: '{Entry}' (environment {Env}).", entry, env.EnvironmentName);
                }
            }

            _logger.LogInformation("NetworkRestrictionMiddleware enabled for environment {Env}. Loaded {Count} CIDR rules.", env.EnvironmentName, _allowedRanges.Count);
        }

        
        
        
        
        
        
        public async Task InvokeAsync(HttpContext context)
        {
            if (!_enforce)
            {
                await _next(context);
                return;
            }

            var clientIp = GetClientIp(context);

            if (clientIp is null)
            {
                _logger.LogWarning("Unable to determine client IP in environment {Env}. Denying access to {Path}.", _environmentName, context.Request.Path);
                
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Access restricted to DEI internal network / VPN.");
                return;
            }

            bool allowed = _allowedRanges.Any(r =>
                r.Network.AddressFamily == clientIp.AddressFamily &&
                r.Contains(clientIp));

            if (!allowed)
            {
                string userName = context.User?.Identity?.Name ?? "anonymous";

                _logger.LogWarning(
                    "Unauthorized external access attempt from IP {Ip} to {Path} by {User} in {Env}.",
                    clientIp, context.Request.Path, userName, _environmentName);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Access restricted to DEI internal network / VPN.");
                return;
            }

            {
                string userName = context.User?.Identity?.Name ?? "anonymous";
                _logger.LogInformation(
                    "Network access granted for IP {Ip} to {Path} by {User} in {Env}.",
                    clientIp, context.Request.Path, userName, _environmentName);
            }

            await _next(context);
        }

        
        
        
        
        
        
        private static IPAddress? GetClientIp(HttpContext context)
        {
            // Proxy / load balancer (X-Forwarded-For)
            if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var headerValues))
            {
                var raw = headerValues.FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(raw))
                {
                    var firstIp = raw.Split(',').First().Trim();
                    if (IPAddress.TryParse(firstIp, out var ipFromHeader))
                        return ipFromHeader;
                }
            }

            // Caso contrário, IP direto da conexão
            return context.Connection.RemoteIpAddress;
        }

        
        
        
        
        private static bool TryParseCidr(string entry, out CidrRange? range)
        {
            range = null;
            if (string.IsNullOrWhiteSpace(entry)) return false;

            string trimmed = entry.Trim();

            try
            {
                if (!trimmed.Contains('/'))
                {
                    // IP único -> /32 (IPv4) ou /128 (IPv6)
                    var ip = IPAddress.Parse(trimmed);
                    int prefixx = ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork
                        ? 32
                        : 128;
                    range = new CidrRange(ip, prefixx);
                    return true;
                }

                var parts = trimmed.Split('/', 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length != 2) return false;

                var baseIp = IPAddress.Parse(parts[0]);

                if (!int.TryParse(parts[1], out int prefix))
                    return false;

                int maxPrefix = baseIp.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork
                    ? 32
                    : 128;

                if (prefix < 0 || prefix > maxPrefix)
                    return false;

                range = new CidrRange(baseIp, prefix);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
