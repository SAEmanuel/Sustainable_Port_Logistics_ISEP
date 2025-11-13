using SEM5_PI_WEBAPI.Seed;
using Serilog;

namespace SEM5_PI_WEBAPI
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            try
            {
                CreateLogsConfigurations();
                
                var host = CreateHostBuilder(args).Build();

                if (args.Contains("--seed"))
                {
                    using (var scope = host.Services.CreateScope())
                    {
                        var bootstrap = scope.ServiceProvider.GetRequiredService<Bootstrap>();
                        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                        var env = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();

                        if (env.IsProduction())
                        {
                            logger.LogWarning("[Bootstrap] Skipping seeding: Production environment detected.");
                            return;
                        }

                        logger.LogInformation("[Bootstrap] Running database seeding via --seed flag...");
                        await bootstrap.SeedAsync();
                        logger.LogInformation("[Bootstrap] Seeding completed successfully. Exiting...");
                    }

                    return; // termina após o seed
                }

                // Caso contrário, inicia o servidor normalmente
                await host.RunAsync();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Host terminated unexpectedly");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        //                      LOG CONFIGURATIONS
        // ===============================================================
        public static void CreateLogsConfigurations()
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Error)
                .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Information)
                .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
                
                //General logs
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

                //Bootstrap logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") &&
                        e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Seed")
                    )
                    .WriteTo.File("Logs/Bootstrap/bootstrap-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //VesselTypes logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.VesselsTypes") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.VesselTypeController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/VesselsTypes/vesseltype-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //Vessels logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Vessels") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.VesselController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/Vessels/vessel-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //StorageArea logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.StorageAreas") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.StorageAreaController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/StorageArea/storageArea-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //Containers logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Containers") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.ContainerController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/Containers/container-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //Dock logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Dock") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.DockController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/Dock/dock-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //Vessel Visit Notification logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.VVN") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.VesselVisitNotificationController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/VesselVisitNotification/vvn-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //Qualifications logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Qualifications") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.QualificationsController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/Qualification/qualification-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )

                //StaffMember logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.StaffMembers") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.StaffMemberController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/StaffMember/staffMember-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-55} - {Message:lj}{NewLine}{Exception}")
                )
                
                // Network (US 3.5.2 – network access + request logs)
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Api.Middleware.NetworkRestrictionMiddleware") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.Shared.RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/Network/networkLog-.log",
                        rollingInterval: RollingInterval.Day,
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext,-70} - {Message:lj}{NewLine}{Exception}")
                )

                //PhysicalResource logs
                .WriteTo.Logger(lc => lc
                    .Filter.ByIncludingOnly(e =>
                        e.Properties.ContainsKey("SourceContext") && (
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Domain.PhysicalResources") ||
                            e.Properties["SourceContext"].ToString().Contains("SEM5_PI_WEBAPI.Controllers.PhysicalResourceController") ||
                            e.Properties["SourceContext"].ToString().Contains("RequestLogsMiddleware")
                        )
                    )
                    .WriteTo.File("Logs/PhysicalResource/physicalResource-.log",
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