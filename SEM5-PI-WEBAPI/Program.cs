using SEM5_PI_WEBAPI.Seed;
using Serilog;

namespace SEM5_PI_WEBAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            try
            {
                CreateLogsConfigurations();
                
                var host = CreateHostBuilder(args).Build();

                using (var scope = host.Services.CreateScope())
                {
                    var bootstrap = scope.ServiceProvider.GetRequiredService<Bootstrap>();
                    bootstrap.SeedAsync().Wait(); //  await se mudares o Main para async
                }
                
                
                host.Run();
            }
            catch(Exception ex)
            {
                Log.Fatal(ex, "Host terminated unexpectedly");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        public static void CreateLogsConfigurations()
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Error)

                .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Information)
                .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
                .WriteTo.Logger(lc => 
                    lc.Filter.ByExcluding(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Seed")
                            )
                        )
                        .WriteTo.Console(
                            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-70} - {Message:lj}{NewLine}{Exception}"
                            )
                    )
                .WriteTo.File("Logs/GeneralLogs/general-.log",
                    rollingInterval: RollingInterval.Day,
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-70} - {Message:lj}{NewLine}{Exception}"
                    )
                
                
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e=>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Seed")
                            )
                    )
                    .WriteTo.File("Logs/Bootstrap/bootstrap-.log",
                        rollingInterval: RollingInterval.Minute,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e=>
                        e.Properties.ContainsKey("SourceContext") &&(
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.VesselsTypes")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.VesselTypeController")
                            )
                        )
                    .WriteTo.File("Logs/VesselsTypes/vesseltype-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )
                
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e=>
                        e.Properties.ContainsKey("SourceContext") &&(
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Vessels")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.VesselController")
                        )
                    )
                    .WriteTo.File("Logs/Vessels/vessel-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )
                
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e=>
                        e.Properties.ContainsKey("SourceContext") &&(
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.StorageAreas")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.StorageAreaController")
                        )
                    )
                    .WriteTo.File("Logs/StorageArea/storageArea-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e=>
                        e.Properties.ContainsKey("SourceContext") &&(
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Containers")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.ContainerController")
                        )
                    )
                    .WriteTo.File("Logs/Containers/container-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )
                
                
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e=>
                        e.Properties.ContainsKey("SourceContext") &&(
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Dock")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.DockController")
                        )
                    )
                    .WriteTo.File("Logs/Dock/dock-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )
                
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e=>
                        e.Properties.ContainsKey("SourceContext") &&(
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.VVN")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                            ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.VesselVisitNotificationController")
                        )
                    )
                    .WriteTo.File("Logs/VesselVisitNotification/vvn-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )
                
                .CreateLogger();


            Log.Information("Starting web host");
        }
        
        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseSerilog()
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}