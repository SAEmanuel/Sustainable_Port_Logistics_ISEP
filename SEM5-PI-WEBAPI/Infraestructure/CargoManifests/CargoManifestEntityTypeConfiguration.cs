using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;

namespace SEM5_PI_WEBAPI.Infraestructure.CargoManifests
{
    public class CargoManifestEntityTypeConfiguration : IEntityTypeConfiguration<CargoManifest>
    {
        public void Configure(EntityTypeBuilder<CargoManifest> builder)
        {
            builder.ToTable("CargoManifests");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Code)
                .HasMaxLength(8)
                .IsRequired();

            builder.Property(c => c.Type)
                .IsRequired();

            builder.Property(c => c.CreatedAt)
                .IsRequired();

            builder.Property(c => c.SubmittedBy)
                .IsRequired();
            
            builder.HasMany(typeof(CargoManifestEntry), "_containerEntries")
                .WithOne()
                .HasForeignKey("CargoManifestId")
                .IsRequired();
            
            builder.Metadata.FindNavigation(nameof(CargoManifest.ContainerEntries))
                .SetPropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}