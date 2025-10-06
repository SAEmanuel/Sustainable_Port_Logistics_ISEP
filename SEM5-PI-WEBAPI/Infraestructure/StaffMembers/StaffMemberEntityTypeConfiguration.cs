using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.StaffMembers;

namespace SEM5_PI_WEBAPI.Infraestructure.StaffMembers;

public class StaffMemberEntityTypeConfiguration : IEntityTypeConfiguration<StaffMember>
{
    public void Configure(EntityTypeBuilder<StaffMember> builder)
    {
        builder.HasKey(k => k.Id);

        builder.Property(s => s.ShortName)
            .IsRequired();

        builder.Property(s => s.MecanographicNumber)
            .IsRequired();

        builder.Property(s => s.IsActive)
            .IsRequired();

        builder.OwnsOne(s => s.Email, email =>
        {
            email.Property(e => e.Address)
                .HasColumnName("Email")
                .IsRequired();
        });

        builder.OwnsOne(s => s.Phone, phone =>
        {
            phone.Property(p => p.Number)
                .HasColumnName("Phone")
                .IsRequired();
        });

        builder.OwnsOne(s => s.Schedule, schedule =>
        {
            schedule.Property(sch => sch.Shift)
                .HasColumnName("Shift")
                .IsRequired();

            schedule.Property(sch => sch.Days)
                .HasColumnName("Days")
                .IsRequired();
        });
        
        builder
            .HasMany(s => s.Qualifications)
            .WithMany() 
            .UsingEntity(join => join.ToTable("StaffMemberQualifications"));
    }
}