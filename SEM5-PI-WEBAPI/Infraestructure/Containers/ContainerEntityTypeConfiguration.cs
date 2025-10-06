using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Infraestructure.Containers;

public class ContainerEntityTypeConfiguration : IEntityTypeConfiguration<EntityContainer>
{
    public void Configure(EntityTypeBuilder<EntityContainer> builder)
    {
        builder.ToTable("Containers");
        
        builder.HasKey(c => c.Id);

        builder.OwnsOne(c => c.ISOId, iso =>
        {
            iso.Property(i => i.Value)
                .HasColumnName("IsoCode")
                .IsRequired();
            
        });

        builder.Property(c => c.Description)
            .IsRequired();

        builder.Property(c => c.Type)
            .IsRequired();

        builder.Property(c => c.Status)
            .IsRequired();
        
        builder.Property(c => c.WeightKg)
            .IsRequired();

    }
}