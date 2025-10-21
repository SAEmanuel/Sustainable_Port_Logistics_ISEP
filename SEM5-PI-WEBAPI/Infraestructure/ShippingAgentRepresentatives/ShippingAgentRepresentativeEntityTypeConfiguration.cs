using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.ValueObjects;


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
                .HasConversion(
                    id => id.PassportNumber,              
                    str => new CitizenId(str) 
                )
                .IsRequired();

            builder.Property(b => b.Nationality)
                .IsRequired();

            builder.Property(b => b.Email)
                .HasConversion(
                    e => e.Address,
                    str=> new EmailAddress(str)
                )
                .IsRequired();

            builder.Property(b => b.PhoneNumber)
                .HasConversion(
                    nr => nr.Number,
                    str => new PhoneNumber(str)
                )
                .IsRequired();
                
            builder.Property(b => b.Status)
                .IsRequired();

            builder.OwnsOne(b => b.SAO, shippingOrganizationCode =>
            {
                shippingOrganizationCode.Property(p => p.Value)
                    .HasColumnName("ShippingOrganizationCode")
                    .IsRequired();
            });

            //cria tabela intermediária para fazer tracking de que VVNs o SAR tem
            builder.OwnsMany(b => b.Notifs, notif =>
            {
                notif.ToTable("Sar_Vvn");

                notif.WithOwner().HasForeignKey("ShippingAgentRepresentativeId");

                notif.Property<int>("Id");
                notif.HasKey("Id");

                notif.Property(v => v.Code)
                    .HasColumnName("VVNCode")
                    .IsRequired();

                notif.Property(v => v.SequenceNumber)
                    .IsRequired();

                notif.Property(v => v.YearNumber)
                    .IsRequired();
            });

            

            builder.HasIndex(b => b.Name).IsUnique();
        }
    }
}