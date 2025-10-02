using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Infraestructure.Qualifications;
using SEM5_PI_WEBAPI.Infraestructure.StaffMembers;
using SEM5_PI_WEBAPI.Infraestructure.VesselsTypes;

namespace SEM5_PI_WEBAPI.Infraestructure
{
    public class DddSample1DbContext : DbContext
    {
        public DbSet<Qualification> Qualifications { get; set; }
        public DbSet<VesselType> VesselType { get; set; }
        public DbSet<StaffMember> StaffMember { get; set; }
        

        public DddSample1DbContext(DbContextOptions options) : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfiguration(new QualificationEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new VesselTypeEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new StaffMemberEntityTypeConfiguration());
        }
    }
}