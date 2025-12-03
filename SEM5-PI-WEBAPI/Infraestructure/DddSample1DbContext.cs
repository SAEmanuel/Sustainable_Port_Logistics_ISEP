using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Infraestructure.CargoManifestEntries;
using SEM5_PI_WEBAPI.Infraestructure.CargoManifests;
using SEM5_PI_WEBAPI.Infraestructure.ConfirmationsPrivacyPolicies;
using SEM5_PI_WEBAPI.Infraestructure.Containers;
using SEM5_PI_WEBAPI.Infraestructure.CrewManifests;
using SEM5_PI_WEBAPI.Infraestructure.CrewMembers;
using SEM5_PI_WEBAPI.Infraestructure.Docks;
using SEM5_PI_WEBAPI.Infraestructure.PhysicalResources;
using SEM5_PI_WEBAPI.Infraestructure.PrivatePolicies;
using SEM5_PI_WEBAPI.Infraestructure.Qualifications;
using SEM5_PI_WEBAPI.Infraestructure.StaffMembers;
using SEM5_PI_WEBAPI.Infraestructure.StorageAreas;
using SEM5_PI_WEBAPI.Infraestructure.Vessels;
using SEM5_PI_WEBAPI.Infraestructure.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Infraestructure.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Infraestructure.Tasks;
using SEM5_PI_WEBAPI.Infraestructure.Users;
using SEM5_PI_WEBAPI.Infraestructure.VVN;

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
        public DbSet<EntityContainer> Container { get; set; }
        public DbSet<StorageArea> StorageArea { get; set; }
        public DbSet<EntityDock> Dock { get; set; }
        public DbSet<CargoManifest> CargoManifest { get; set; }
        public DbSet<CargoManifestEntry> CargoManifestEntry { get; set; }
        public DbSet<EntityPhysicalResource> PhysicalResources { get; set; }
        public DbSet<CrewManifest> CrewManifests { get; set; }
        public DbSet<CrewMember> CrewMembers { get; set; }
        public DbSet<EntityTask> Tasks { get; set; }
        public DbSet<VesselVisitNotification> VesselVisitNotification { get; set; }
        public DbSet<PrivacyPolicy>  PrivacyPolicy { get; set; }
        public DbSet<ConfirmationPrivacyPolicy>  ConfirmationPrivacyPolicies { get; set; }
        public DbSet<User> Users { get; set; }


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
            modelBuilder.ApplyConfiguration(new DockEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new CargoManifestEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new CargoManifestEntryEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new PhysicalResourceEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new CrewManifestEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new CrewMemberEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new VesselVisitNotificationEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new TaskEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new UserEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new PrivacyPolicyEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new ConfirmationEntityTypeConfiguration());
        }
    }
}