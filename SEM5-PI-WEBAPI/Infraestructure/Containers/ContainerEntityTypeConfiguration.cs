using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.Containers;

namespace SEM5_PI_WEBAPI.Infraestructure.Containers;

public class ContainerEntityTypeConfiguration : IEntityTypeConfiguration<EntityContainer>
{
    public void Configure(EntityTypeBuilder<EntityContainer> builder)
    {
        //builder.ToTable("Qualifications", SchemaNames.DDDSample1);
        builder.HasKey(b => b.Id);
    }
}