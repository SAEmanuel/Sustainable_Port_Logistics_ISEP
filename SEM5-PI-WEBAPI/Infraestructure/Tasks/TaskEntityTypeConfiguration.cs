using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.VVN;
using Task = SEM5_PI_WEBAPI.Domain.Tasks.Task;

namespace SEM5_PI_WEBAPI.Infraestructure.Tasks;

public class TaskEntityTypeConfiguration : IEntityTypeConfiguration<Task>
{
    public void Configure(EntityTypeBuilder<Task> builder)
    {
        builder.HasKey(t => t.Id);

        builder.OwnsOne(t => t.Code, code =>
        {
            code.Property(c => c.Value)
                .HasColumnName("Code")
                .IsRequired();
        });

        builder.Property(t => t.StartTime)
            .HasColumnType("datetime2")
            .IsRequired(false);

        builder.Property(t => t.EndTime)
            .HasColumnType("datetime2")
            .IsRequired(false);

        builder.Property(t => t.Description)
            .HasMaxLength(255)
            .IsRequired(false);

        builder.Property(t => t.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(t => t.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.HasOne<VesselVisitNotification>()
            .WithMany(v => v.Tasks)
            .HasForeignKey("VesselVisitNotificationId")
            .IsRequired();
    }
}