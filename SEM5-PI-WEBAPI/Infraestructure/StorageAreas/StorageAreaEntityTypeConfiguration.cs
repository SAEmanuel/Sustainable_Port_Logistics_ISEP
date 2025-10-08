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

        builder.OwnsMany(sa => sa.DistancesToDocks, nav =>
        {
            nav.WithOwner().HasForeignKey("StorageAreaId"); 
            nav.Property<Guid>("Id");
            nav.HasKey("Id");

            nav.OwnsOne(d => d.Dock, dock =>
            {
                dock.Property(p => p.Value)
                    .HasColumnName("DockCode")
                    .IsRequired();
            });

            nav.Property(d => d.Distance)
                .HasColumnName("DistanceKm")
                .IsRequired();
        });

        builder.Ignore(b => b.MaxCapacityTeu);
        builder.Ignore("_grid");
    }
}