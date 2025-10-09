using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.StorageAreas;

namespace SEM5_PI_WEBAPI.Infraestructure.CargoManifestEntries
{
    public class CargoManifestEntryEntityTypeConfiguration : IEntityTypeConfiguration<CargoManifestEntry>
    {
        public void Configure(EntityTypeBuilder<CargoManifestEntry> builder)
        {
            builder.ToTable("CargoManifestEntries");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Bay).IsRequired();
            builder.Property(c => c.Row).IsRequired();
            builder.Property(c => c.Tier).IsRequired();

            builder.HasOne<StorageArea>()
                .WithMany()
                .HasForeignKey("StorageAreaId")
                .IsRequired();
            
            builder.HasOne(c => c.Container)
                .WithMany()
                .HasForeignKey("ContainerId")
                .IsRequired();
        }
    }
}