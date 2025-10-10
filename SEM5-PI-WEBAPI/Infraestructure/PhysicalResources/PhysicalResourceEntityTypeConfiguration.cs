using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Qualifications;

namespace SEM5_PI_WEBAPI.Infraestructure.PhysicalResources
{
    public class PhysicalResourceEntityTypeConfiguration : IEntityTypeConfiguration<EntityPhysicalResource>
    {
        public void Configure(EntityTypeBuilder<EntityPhysicalResource> builder)
        {
            builder.HasKey(r => r.Id);

            builder.Property(r => r.Code)
                .HasMaxLength(10)
                .IsRequired();

            builder.Property(r => r.Description)
                .HasMaxLength(80)
                .IsRequired();

            builder.Property(r => r.OperationalCapacity)
                .IsRequired();

            builder.Property(r => r.SetupTime)
                .IsRequired();

            builder.Property(r => r.Type)
                .HasConversion<string>() // salva o enum como texto no BD
                .IsRequired();

            builder.Property(r => r.Status)
                .HasConversion<string>() // idem para status
                .IsRequired();

            // Configuração da relação opcional com Qualification
            builder.Property(r => r.QualificationID)
                .HasConversion(id => id.Value, value => new QualificationId(value))
                .IsRequired(false);
            
        }
    }
}