using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SEM5_PI_WEBAPI.Domain.VVN;

namespace SEM5_PI_WEBAPI.Infraestructure.VVN
{
    public class VesselVisitNotificationEntityTypeConfiguration : IEntityTypeConfiguration<VesselVisitNotification>
    {
        public void Configure(EntityTypeBuilder<VesselVisitNotification> builder)
        {
            builder.HasKey(v => v.Id);

            builder.OwnsOne(v => v.Code, code =>
            {
                code.Property(c => c.Code)
                    .HasColumnName("Code")
                    .IsRequired();
            });

            builder.OwnsOne(v => v.EstimatedTimeArrival, eta =>
            {
                eta.Property(e => e.Value)
                    .HasColumnName("EstimatedTimeArrival")
                    .IsRequired();
            });

            builder.OwnsOne(v => v.EstimatedTimeDeparture, etd =>
            {
                etd.Property(e => e.Value)
                    .HasColumnName("EstimatedTimeDeparture")
                    .IsRequired();
            });

            builder.OwnsOne(v => v.ActualTimeArrival, ata =>
            {
                ata.Property(e => e.Value)
                    .HasColumnName("ActualTimeArrival");
            });

            builder.OwnsOne(v => v.ActualTimeDeparture, atd =>
            {
                atd.Property(e => e.Value)
                    .HasColumnName("ActualTimeDeparture");
            });

            builder.OwnsOne(v => v.AcceptenceDate, acc =>
            {
                acc.Property(e => e.Value)
                    .HasColumnName("AcceptanceDate");
            });

            builder.OwnsOne(v => v.VesselImo, imo =>
            {
                imo.Property(i => i.Value)
                    .HasColumnName("VesselImo")
                    .IsRequired();
            });

            
            builder.OwnsOne(v => v.Dock, dock =>
            {
                dock.Property(d => d.Value)
                    .HasColumnName("Dock")
                    .IsRequired(false);
            });

            builder.Property(v => v.Volume)
                .IsRequired();

            var statusConverter = new ValueConverter<Status, string>(
                v => v.ToString(),
                v => new Status(Enum.Parse<VvnStatus>(v.Replace("Status: ", "")), null));
            
            builder.Property(v => v.Status)
                .HasConversion(statusConverter)
                .IsRequired();

            builder.HasOne(v => v.CrewManifest)
                .WithMany()
                .HasForeignKey("CrewManifestId")
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.LoadingCargoManifest)
                .WithMany()
                .HasForeignKey("LoadingCargoManifestId")
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.UnloadingCargoManifest)
                .WithMany()
                .HasForeignKey("UnloadingCargoManifestId")
                .OnDelete(DeleteBehavior.Restrict);

            builder.ToTable("VesselVisitNotifications");
        }
    }
}
