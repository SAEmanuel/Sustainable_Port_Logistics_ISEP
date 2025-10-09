using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;

namespace SEM5_PI_WEBAPI.Infraestructure.ShippingAgentRepresentatives
{
    internal class ShippingAgentRepresentativeEntityTypeConfiguration : IEntityTypeConfiguration<ShippingAgentRepresentative>
    {
        public void Configure(EntityTypeBuilder<ShippingAgentRepresentative> builder)
        {
            builder.HasKey(b => b.Id);

            builder.Property(b => b.Name)
                .IsRequired();

            builder.Property(b => b.CitizenId)
                .IsRequired();

            builder.Property(b => b.Nationality)
                .IsRequired();

            builder.Property(b => b.Email)
                .IsRequired();

            builder.Property(b => b.PhoneNumber)
                .IsRequired();

            builder.Property(b => b.Status)
                .IsRequired();

            builder.HasIndex(b => b.Name).IsUnique();
        }
    }
}