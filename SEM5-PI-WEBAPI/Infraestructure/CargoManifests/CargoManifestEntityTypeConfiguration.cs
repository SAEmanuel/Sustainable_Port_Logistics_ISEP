using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.CargoManifests;

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

            builder.HasMany(c => c.ContainerEntries)
                .WithOne()
                .HasForeignKey("CargoManifestId")
                .IsRequired();

            builder.Navigation(c => c.ContainerEntries)
                .UsePropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}