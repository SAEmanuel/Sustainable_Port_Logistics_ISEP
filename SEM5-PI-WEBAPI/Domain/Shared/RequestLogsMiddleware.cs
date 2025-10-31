namespace SEM5_PI_WEBAPI.Domain.Shared
{
    public class RequestLogsMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLogsMiddleware> _logger;

        public RequestLogsMiddleware(RequestDelegate next, ILogger<RequestLogsMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }
        
        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Path.StartsWithSegments("/api/health"))
            {
                await _next(context);
                return;
            }
            _logger.LogInformation("┌───────────────────────────────────────────────");
            _logger.LogInformation("│ HTTP {Method} {Path}", context.Request.Method, context.Request.Path);
            _logger.LogInformation("│ From IP: {Ip}", context.Connection.RemoteIpAddress?.ToString());
            _logger.LogInformation("└───────────────────────────────────────────────");

            var start = DateTime.UtcNow;

            await _next(context);

            var elapsedMs = (DateTime.UtcNow - start).TotalMilliseconds;
            _logger.LogInformation("──────│ ✔ COMPLETED {Method} {Path} with {StatusCode} in {Elapsed} ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                elapsedMs);
        }

    }
}

