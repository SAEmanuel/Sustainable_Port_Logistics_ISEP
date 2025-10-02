using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure;
using SEM5_PI_WEBAPI.Infraestructure.Qualifications;
using SEM5_PI_WEBAPI.Infraestructure.Shared;
using SEM5_PI_WEBAPI.Infraestructure.StaffMembers;
using SEM5_PI_WEBAPI.Infraestructure.VesselsTypes;

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

            services.AddControllers().AddNewtonsoftJson();
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

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }

        private void ConfigureMyServices(IServiceCollection services)
        {
            services.AddTransient<IUnitOfWork, UnitOfWork>();

            services.AddTransient<IQualificationRepository, QualificationRepository>();
            services.AddTransient<QualificationService>();
            
            services.AddTransient<IVesselTypeRepository, VesselTypeRepository>();
            services.AddTransient<VesselTypeService>();
            
            services.AddTransient<IStaffMemberRepository, StaffMemberRepository>();
            services.AddTransient<StaffMemberService>();
        }
    }
}