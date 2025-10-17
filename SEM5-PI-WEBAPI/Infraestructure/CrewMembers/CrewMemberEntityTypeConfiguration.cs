using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Infraestructure.CrewMembers;

public class CrewMemberEntityTypeConfiguration : IEntityTypeConfiguration<CrewMember>
{
    public void Configure(EntityTypeBuilder<CrewMember> builder)
    {
        builder.ToTable("CrewMembers");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired();

        builder.Property(c => c.Role)
            .IsRequired();

        builder.Property(c => c.Nationality)
            .IsRequired();

        builder.Property(c => c.CitizenId)
            .HasConversion(
                id => id.PassportNumber,      
                str => new CitizenId(str)) 
            .IsRequired();
    }
}