using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.Dock;

namespace SEM5_PI_WEBAPI.Infraestructure.Docks
{
    public class DockEntityTypeConfiguration : IEntityTypeConfiguration<EntityDock>
    {
        public void Configure(EntityTypeBuilder<EntityDock> builder)
        {
            builder.HasKey(d => d.Id);

            builder.OwnsOne(d => d.Code, code =>
            {
                code.Property(p => p.Value)
                    .HasColumnName("Code")
                    .IsRequired();
                code.HasIndex(p => p.Value).IsUnique();
            });

            builder.Property(d => d.Location)
                .HasMaxLength(150)
                .IsRequired();

            builder.Property(d => d.LengthM).IsRequired();
            builder.Property(d => d.DepthM).IsRequired();
            builder.Property(d => d.MaxDraftM).IsRequired();

            // NOVO: mapear o enum Status como string
            builder.Property(d => d.Status)
                   .HasConversion<string>()
                   .HasMaxLength(20)
                   .IsRequired();

            builder.OwnsMany(d => d.PhysicalResourceCodes, prc =>
            {
                prc.ToTable("DockPhysicalResourceCodes");
                prc.WithOwner().HasForeignKey("DockId");
                prc.Property(p => p.Value)
                    .HasColumnName("PhysicalResourceCode")
                    .IsRequired();
                prc.HasKey("DockId", "Value");
                prc.HasIndex(p => p.Value).IsUnique();
            });

            builder.OwnsMany(d => d.AllowedVesselTypeIds, a =>
            {
                a.ToTable("DockAllowedVesselTypes");
                a.WithOwner().HasForeignKey("DockId");
                a.Property(v => v.Value)
                    .HasColumnName("VesselTypeId")
                    .IsRequired();
                a.HasKey("DockId", "Value");
            });

            builder.Navigation(d => d.PhysicalResourceCodes)
                .UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.Navigation(d => d.AllowedVesselTypeIds)
                .UsePropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}
