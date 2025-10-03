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
            _logger.LogInformation("===============================================");
            _logger.LogInformation("New HTTP Request {Method} {Path} from {Ip}",
                context.Request.Method,
                context.Request.Path,
                context.Connection.RemoteIpAddress?.ToString());

            await _next(context); 

            _logger.LogInformation("End of Request {Method} {Path}", 
                context.Request.Method,
                context.Request.Path);
            _logger.LogInformation("===============================================");
        }
    }
}

