using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;

namespace SEM5_PI_WEBAPI.Infraestructure.ConfirmationsPrivacyPolicies;

public class ConfirmationEntityTypeConfiguration : IEntityTypeConfiguration<ConfirmationPrivacyPolicy>
{
    public void Configure(EntityTypeBuilder<ConfirmationPrivacyPolicy> builder)
    {
        builder.ToTable("ConfirmationsReservasRestauranteAsiatico");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserEmail)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.HasIndex(x => x.UserEmail).IsUnique();
        
        builder.Property(x => x.VersionPrivacyPolicy)
            .IsRequired();
        
        
        builder.Property(x => x.IsAcceptedPrivacyPolicy)
            .IsRequired();

        builder.OwnsOne(x => x.AcceptedAtTime, owned =>
        {
            owned.Property(ct => ct.Value)
                .HasColumnName("AcceptedAtTime");
        });
    }
}