using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Converters;
using SEM5_PI_WEBAPI.Controllers;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Infraestructure;
using SEM5_PI_WEBAPI.Infraestructure.CargoManifestEntries;
using SEM5_PI_WEBAPI.Infraestructure.CargoManifests;
using SEM5_PI_WEBAPI.Infraestructure.Containers;
using SEM5_PI_WEBAPI.Infraestructure.CrewManifests;
using SEM5_PI_WEBAPI.Infraestructure.CrewMembers;
using SEM5_PI_WEBAPI.Infraestructure.Docks;
using SEM5_PI_WEBAPI.Infraestructure.PhysicalResources;
using SEM5_PI_WEBAPI.Infraestructure.Qualifications;
using SEM5_PI_WEBAPI.Infraestructure.Shared;
using SEM5_PI_WEBAPI.Infraestructure.StaffMembers;
using SEM5_PI_WEBAPI.Infraestructure.Vessels;
using SEM5_PI_WEBAPI.Infraestructure.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Infraestructure.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Infraestructure.StorageAreas;
using SEM5_PI_WEBAPI.Infraestructure.Tasks;
using SEM5_PI_WEBAPI.Infraestructure.Users;
using SEM5_PI_WEBAPI.Infraestructure.VVN;
using SEM5_PI_WEBAPI.Seed;
using SEM5_PI_WEBAPI.utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Domain.ValueObjects;


namespace SEM5_PI_WEBAPI
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            var domain = $"https://{Configuration["Auth0:Domain"]}";
            var audience = Configuration["Auth0:Audience"];

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.Authority = domain;
                    options.Audience = audience;
                    options.RequireHttpsMetadata = false;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        NameClaimType = ClaimTypes.NameIdentifier,
                        RoleClaimType = ClaimTypes.Role
                    };
                });

            services.AddAuthorization(options =>
            {
                options.AddPolicy("AdminOnly", policy => policy.RequireRole(Roles.Administrator.ToString()));
            });

            services.AddCors(options =>
            {
                options.AddPolicy("AllowSPA", builder =>
                {
                    builder
                        .WithOrigins(
                            "http://localhost:5173",
                            "http://localhost:3000",
                            "http://10.9.23.188",
                            "http://10.9.23.188:5173"
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });
            services.AddHealthChecks();


            services.AddDbContext<DddSample1DbContext>(opt =>
                opt.UseNpgsql(Configuration.GetConnectionString("DefaultConnection"))
                    .ReplaceService<IValueConverterSelector, StronglyEntityIdValueConverterSelector>());


            ConfigureMyServices(services);


            services.AddControllers()
                .AddNewtonsoftJson(options => { options.SerializerSettings.Converters.Add(new StringEnumConverter()); })
                .AddJsonOptions(o => { o.JsonSerializerOptions.PropertyNameCaseInsensitive = true; });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseHsts();
            }

            
            app.UseRouting();

            
            app.UseCors("AllowSPA");

            app.UseMiddleware<RequestLogsMiddleware>();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHealthChecks("/api/health");
            });
        }


        private void ConfigureMyServices(IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("AllowSPA", builder =>
                    builder
                        .WithOrigins(
                            "http://localhost:5173", 
                            "http://localhost:3000", 
                            "http://10.9.23.188", 
                            "http://10.9.23.188:5173" 
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                );
            });

            services.AddTransient<IUnitOfWork, UnitOfWork>();

            services.AddTransient<IQualificationRepository, QualificationRepository>();
            services.AddScoped<IQualificationService, QualificationService>();

            services.AddTransient<IVesselTypeRepository, VesselTypeRepository>();
            services.AddScoped<IVesselTypeService, VesselTypeService>();

            services.AddTransient<IStaffMemberRepository, StaffMemberRepository>();
            services.AddScoped<IStaffMemberService, StaffMemberService>();

            services.AddTransient<IVesselRepository, VesselRepository>();
            services.AddScoped<IVesselService, VesselService>();

            services.AddTransient<IShippingAgentOrganizationRepository, ShippingAgentOrganizationRepository>();
            services.AddScoped<IShippingAgentOrganizationService, ShippingAgentOrganizationService>();

            services.AddTransient<IShippingAgentRepresentativeRepository, ShippingAgentRepresentativeRepository>();
            services.AddScoped<IShippingAgentRepresentativeService, ShippingAgentRepresentativeService>();


            services.AddTransient<IStorageAreaRepository, StorageAreaRepository>();
            services.AddScoped<IStorageAreaService, StorageAreaService>();

            services.AddTransient<IDockRepository, DockRepository>();
            services.AddScoped<IDockService, DockService>();

            services.AddTransient<ICargoManifestRepository, CargoManifestRepository>();

            services.AddTransient<IContainerRepository, ContainerRepository>();
            services.AddScoped<IContainerService, ContainerService>();

            services.AddTransient<ICargoManifestEntryRepository, CargoManifestEntryRepository>();

            services.AddTransient<IPhysicalResourceRepository, PhysicalResourceRepository>();
            services.AddScoped<IPhysicalResourceService, PhysicalResourceService>();

            services.AddTransient<IVesselVisitNotificationRepository, VesselVisitNotificationRepository>();
            services.AddScoped<IVesselVisitNotificationService, VesselVisitNotificationService>();

            services.AddTransient<ICrewMemberRepository, CrewMemberRepository>();

            services.AddTransient<ICrewManifestRepository, CrewManifestRepository>();

            services.AddTransient<ITaskRepository, TaskRepository>();

            services.AddTransient<Bootstrap>();

            services.AddScoped<IResponsesToFrontend, ResponsesToFrontend>();

            services.AddTransient<IUserRepository, UserRepository>();
            services.AddScoped<IUserService, UserService>();

            services.AddTransient<IEmailSender, EmailSender>();
        }
    }
}