using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

namespace SEM5_PI_WEBAPI.Infraestructure.PrivatePolicies;

public class PrivacyPolicyEntityTypeConfiguration : IEntityTypeConfiguration<PrivacyPolicy>
{
    public void Configure(EntityTypeBuilder<PrivacyPolicy> builder)
    {
        // Nome da tabela (opcional, mas costuma ser boa prática)
        builder.ToTable("PrivacyPolicies");

        // Chave primária
        builder.HasKey(p => p.Id);

        // Version – obrigatório e ÚNICO
        builder.Property(p => p.Version)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.Version)
            .IsUnique();

        // Titles
        builder.Property(p => p.TitleEn)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.TitlePT)
            .IsRequired()
            .HasMaxLength(200);

        // Contents
        builder.Property(p => p.ContentEn)
            .IsRequired();

        builder.Property(p => p.ContentPT)
            .IsRequired();

        // CreatedByAdmin
        builder.Property(p => p.CreatedByAdmin)
            .IsRequired()
            .HasMaxLength(100);

        // IsCurrent
        builder.Property(p => p.IsCurrent)
            .IsRequired();

        // Owned value object for CreatedAt
        builder.OwnsOne(p => p.CreatedAt, owned =>
        {
            owned.Property(ct => ct.Value)
                .HasColumnName("CreatedAt")
                .IsRequired();
        });

        // Owned value object for EffectiveFrom (opcional)
        builder.OwnsOne(p => p.EffectiveFrom, owned =>
        {
            owned.Property(ct => ct.Value)
                .HasColumnName("EffectiveFrom")
                .IsRequired(false);
        });
    }
}