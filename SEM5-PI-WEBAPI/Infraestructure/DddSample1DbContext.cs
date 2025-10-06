using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Infraestructure.Containers;
using SEM5_PI_WEBAPI.Infraestructure.Qualifications;
using SEM5_PI_WEBAPI.Infraestructure.StaffMembers;
using SEM5_PI_WEBAPI.Infraestructure.StorageAreas;
using SEM5_PI_WEBAPI.Infraestructure.Vessels;
using SEM5_PI_WEBAPI.Infraestructure.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Infraestructure.ShippingAgentRepresentatives;

namespace SEM5_PI_WEBAPI.Infraestructure
{
    public class DddSample1DbContext : DbContext
    {
        public DbSet<Qualification> Qualifications { get; set; }
        public DbSet<VesselType> VesselType { get; set; }
        public DbSet<Vessel> Vessel { get; set; }
        public DbSet<StaffMember> StaffMember { get; set; }
        public DbSet<ShippingAgentOrganization> ShippingAgentOrganization { get; set; }
        public DbSet<ShippingAgentRepresentative> ShippingAgentRepresentative { get; set; }
        public DbSet<EntityContainer> Container {get; set;}
        public DbSet<StorageArea> StorageArea {get; set;}
        

        public DddSample1DbContext(DbContextOptions options) : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfiguration(new QualificationEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new VesselTypeEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new StaffMemberEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new VesselEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new ShippingAgentOrganizationEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new ShippingAgentRepresentativeEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new ContainerEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new StorageAreaEntityTypeConfiguration());
        }
    }
}