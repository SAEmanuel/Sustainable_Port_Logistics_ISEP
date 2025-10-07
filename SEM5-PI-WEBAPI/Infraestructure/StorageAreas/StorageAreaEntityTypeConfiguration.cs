using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Infraestructure.StorageAreas;

public class StorageAreaEntityTypeConfiguration : IEntityTypeConfiguration<StorageArea>
{
    public void Configure(EntityTypeBuilder<StorageArea> builder)
    {
        builder.ToTable("StorageAreas");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name)
            .IsRequired();

        builder.Property(b => b.Description);

        builder.Property(b => b.Type)
            .IsRequired();

        builder.Property(b => b.MaxBays).IsRequired();
        builder.Property(b => b.MaxRows).IsRequired();
        builder.Property(b => b.MaxTiers).IsRequired();
        builder.Property(b => b.CurrentCapacityTeu).IsRequired();

        builder.OwnsMany(sa => sa.DistancesToDocks, d =>
        {
            d.ToTable("StorageAreaDockDistances");

            d.WithOwner().HasForeignKey("StorageAreaId");

            d.Property(p => p.Dock)
                .HasConversion(
                    v => v.Value,         // DockCode -> string
                    v => new DockCode(v))     // string -> DockCode
                .HasColumnName("DockCode")
                .IsRequired();

            d.Property(p => p.Distance)
                .IsRequired();

            d.HasKey("StorageAreaId", "DockCode");
        });

        builder.Ignore(b => b.MaxCapacityTeu);
        builder.Ignore("_grid");
    }
}