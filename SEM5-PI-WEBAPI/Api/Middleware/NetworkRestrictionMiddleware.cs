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
        private readonly object _rangesLock = new();

        private readonly string _environmentName;
        private readonly string? _allowedCidrsFilePath;
        private DateTimeOffset _lastFileReadUtc = DateTimeOffset.MinValue;

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

        public NetworkRestrictionMiddleware(
            RequestDelegate next,
            ILogger<NetworkRestrictionMiddleware> logger,
            IOptions<NetworkAccessOptions> options,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _environmentName = env.EnvironmentName;

            var cfg = options.Value;

            _enforce = cfg.EnforceForEnvironments
                .Contains(env.EnvironmentName, StringComparer.OrdinalIgnoreCase);

            if (!_enforce)
            {
                _logger.LogInformation(
                    "NetworkRestrictionMiddleware disabled for environment {Env}.",
                    env.EnvironmentName);
                return;
            }

            // 1) Construir ranges a partir do AllowedCidrs inline (fallback)
            if (cfg.AllowedCidrs is { Length: > 0 })
            {
                foreach (var entry in cfg.AllowedCidrs)
                {
                    if (TryParseCidr(entry, out var range))
                    {
                        lock (_rangesLock)
                        {
                            _allowedRanges.Add(range!);
                        }
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Invalid CIDR entry in NetworkAccess.AllowedCidrs: '{Entry}' (environment {Env}).",
                            entry, env.EnvironmentName);
                    }
                }
            }

            // 2) Guardar caminho do ficheiro, se existir
            if (!string.IsNullOrWhiteSpace(cfg.AllowedCidrsFile))
            {
                _allowedCidrsFilePath = Path.IsPathRooted(cfg.AllowedCidrsFile)
                    ? cfg.AllowedCidrsFile
                    : Path.Combine(env.ContentRootPath, cfg.AllowedCidrsFile);

                _logger.LogInformation(
                    "NetworkRestrictionMiddleware configured to load CIDRs from file: {File} (environment {Env}).",
                    _allowedCidrsFilePath, env.EnvironmentName);

                // Leitura inicial (se o ficheiro existir)
                ReloadFromFileIfNeeded(force: true);
            }

            _logger.LogInformation(
                "NetworkRestrictionMiddleware enabled for environment {Env}. Loaded {Count} CIDR rules.",
                env.EnvironmentName, _allowedRanges.Count);
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (!_enforce)
            {
                await _next(context);
                return;
            }

            // Garante que se o ficheiro mudar, fazemos reload sem restart
            ReloadFromFileIfNeeded(force: false);

            var clientIp = GetClientIp(context);

            if (clientIp is null)
            {
                _logger.LogWarning(
                    "Unable to determine client IP in environment {Env}. Denying access to {Path}.",
                    _environmentName, context.Request.Path);
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Access restricted to DEI internal network/VPN.\n");
                return;
            }

            List<CidrRange> snapshot;
            lock (_rangesLock)
            {
                snapshot = _allowedRanges.ToList();
            }

            bool allowed = snapshot.Any(r =>
                r.Network.AddressFamily == clientIp.AddressFamily &&
                r.Contains(clientIp));

            if (!allowed)
            {
                string userName = context.User?.Identity?.Name ?? "anonymous";

                _logger.LogWarning("Unauthorized external access attempt from IP {Ip} to {Path} by {User} in {Env}.", clientIp, context.Request.Path, userName, _environmentName);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Access restricted to DEI internal network/VPN.\n");
                return;
            }

            // Log de sucesso (auditoria)
            {
                string userName = context.User?.Identity?.Name ?? "anonymous";
                _logger.LogInformation("Network access granted for IP {Ip} to {Path} by {User} in {Env}.", clientIp, context.Request.Path, userName, _environmentName);
            }

            await _next(context);
        }

        private void ReloadFromFileIfNeeded(bool force)
        {
            if (_allowedCidrsFilePath is null)
                return;

            try
            {
                var info = new FileInfo(_allowedCidrsFilePath);
                if (!info.Exists)
                {
                    if (force)
                    {
                        _logger.LogWarning("AllowedCidrsFile '{File}' not found. Using only inline AllowedCidrs (environment {Env}).", _allowedCidrsFilePath, _environmentName);
                    }
                    return;
                }

                var lastWrite = info.LastWriteTimeUtc;

                if (!force && lastWrite <= _lastFileReadUtc)
                {
                    // ficheiro não mudou desde o último reload
                    return;
                }

                // Ler todas as linhas
                var lines = File.ReadAllLines(_allowedCidrsFilePath);
                var newRanges = new List<CidrRange>();

                foreach (var line in lines)
                {
                    var trimmed = line.Trim();
                    if (string.IsNullOrEmpty(trimmed)) continue;
                    if (trimmed.StartsWith("#") || trimmed.StartsWith("//")) continue;

                    if (TryParseCidr(trimmed, out var range))
                    {
                        newRanges.Add(range!);
                    }
                    else
                    {
                        _logger.LogWarning("Invalid CIDR entry '{Entry}' in file {File} (environment {Env}).", trimmed, _allowedCidrsFilePath, _environmentName);
                    }
                }

                lock (_rangesLock)
                {
                    _allowedRanges.Clear();
                    _allowedRanges.AddRange(newRanges);
                    _lastFileReadUtc = lastWrite;
                }

                _logger.LogInformation("Reloaded {Count} CIDR entries from file {File} (environment {Env}).", newRanges.Count, _allowedCidrsFilePath, _environmentName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to reload network access list from file {File}. Keeping previous configuration (environment {Env}).",
                    _allowedCidrsFilePath, _environmentName);
            }
        }

        private static IPAddress? GetClientIp(HttpContext context)
        {
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
                    var ip = IPAddress.Parse(trimmed);
                    int prefix = ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork
                        ? 32
                        : 128;
                    range = new CidrRange(ip, prefix);
                    return true;
                }

                var parts = trimmed.Split('/', 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length != 2) return false;

                var baseIp = IPAddress.Parse(parts[0]);

                if (!int.TryParse(parts[1], out int prefixBits))
                    return false;

                int maxPrefix = baseIp.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork
                    ? 32
                    : 128;

                if (prefixBits < 0 || prefixBits > maxPrefix)
                    return false;

                range = new CidrRange(baseIp, prefixBits);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
