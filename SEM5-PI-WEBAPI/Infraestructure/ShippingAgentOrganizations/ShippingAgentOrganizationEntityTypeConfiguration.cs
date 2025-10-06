using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;

namespace SEM5_PI_WEBAPI.Infraestructure.ShippingAgentOrganizations
{
    internal class ShippingAgentOrganizationEntityTypeConfiguration : IEntityTypeConfiguration<ShippingAgentOrganization>
    {
        public void Configure(EntityTypeBuilder<ShippingAgentOrganization> builder)
        {
            builder.ToTable("ShippingAgentOrganizations");

            builder.HasKey(b => b.Id);

            builder.Property(b => b.Code)
                .IsRequired();

            builder.Property(b => b.LegalName)
                .IsRequired();

            builder.Property(b => b.AltName)
                .IsRequired();

            builder.Property(b => b.Address)
                .IsRequired();

            builder.OwnsOne(b => b.Taxnumber, tax =>
            {
                tax.Property(t => t.Value)
                    .HasColumnName("TaxNumber")
                    .IsRequired();
            });

            builder.HasIndex(b => b.Code).IsUnique();
        }
    }
}