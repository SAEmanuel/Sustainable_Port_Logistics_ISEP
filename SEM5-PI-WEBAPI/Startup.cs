using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Newtonsoft.Json.Converters;
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
using SEM5_PI_WEBAPI.Infraestructure.VVN;

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
            services.AddDbContext<DddSample1DbContext>(opt =>
                opt.UseSqlite(Configuration.GetConnectionString("DefaultConnection"))
                    .ReplaceService<IValueConverterSelector, StronglyEntityIdValueConverterSelector>());

            ConfigureMyServices(services);

            services.AddControllers()
                .AddNewtonsoftJson(options =>
                {
                    options.SerializerSettings.Converters.Add(new StringEnumConverter());
                });
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

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseMiddleware<RequestLogsMiddleware>();

            app.UseAuthorization();

            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }

        private void ConfigureMyServices(IServiceCollection services)
        {
            services.AddTransient<IUnitOfWork, UnitOfWork>();

            services.AddTransient<IQualificationRepository, QualificationRepository>();
            services.AddTransient<QualificationService>();

            services.AddTransient<IVesselTypeRepository, VesselTypeRepository>();
            services.AddScoped<IVesselTypeService,VesselTypeService>();

            services.AddTransient<IStaffMemberRepository, StaffMemberRepository>();
            services.AddTransient<StaffMemberService>();

            services.AddTransient<IVesselRepository, VesselRepository>();
            services.AddScoped<IVesselService,VesselService>();

            services.AddTransient<IShippingAgentOrganizationRepository, ShippingAgentOrganizationRepository>();
            services.AddTransient<ShippingAgentOrganizationService>();

            services.AddTransient<IShippingAgentRepresentativeRepository, ShippingAgentRepresentativeRepository>();
            services.AddTransient<ShippingAgentRepresentativeService>();


            services.AddTransient<IStorageAreaRepository, StorageAreaRepository>();
            services.AddScoped<IStorageAreaService, StorageAreaService>();

            services.AddTransient<IDockRepository, DockRepository>();
            services.AddTransient<DockService>();

            services.AddTransient<ICargoManifestRepository, CargoManifestRepository>();
            services.AddTransient<IContainerRepository, ContainerRepository>();
            
            services.AddTransient<ICargoManifestEntryRepository, CargoManifestEntryRepository>();
            services.AddTransient<CargoManifestService>();
            
            services.AddTransient<IPhysicalResourceRepository, PhysicalResourceRepository>();
            services.AddTransient<PhysicalResourceService>();
            
            services.AddTransient<IVesselVisitNotificationRepository, VesselVisitNotificationRepository>();
            services.AddScoped<IVesselVisitNotificationService,VesselVisitNotificationService>();
            
            services.AddTransient<ICrewMemberRepository,CrewMemberRepository>();

            services.AddTransient<ICrewManifestRepository, CrewManifestRepository>();

            services.AddTransient<ITaskRepository,TaskRepository>();
        }
    }
}