using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN;

namespace SEM5_PI_WEBAPI.Infraestructure.VVN
{
    public class VesselVisitNotificationEntityTypeConfiguration 
        : IEntityTypeConfiguration<VesselVisitNotification>
    {
        public void Configure(EntityTypeBuilder<VesselVisitNotification> builder)
        {
            builder.HasKey(v => v.Id);

            // Converter timestamps para UTC
            var utcConverter = new ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );

            // ---------------------------
            //   CODE (Owned)
            // ---------------------------
            builder.OwnsOne(v => v.Code, code =>
            {
                code.Property(c => c.Code)
                    .HasColumnName("Code")
                    .IsRequired();

                code.WithOwner();
            });

            // ---------------------------
            //   DATAS (Owned)
            // ---------------------------
            builder.OwnsOne(v => v.EstimatedTimeArrival, eta =>
            {
                eta.Property(e => e.Value)
                    .HasColumnName("EstimatedTimeArrival")
                    .HasColumnType("timestamp with time zone")
                    .HasConversion(utcConverter)
                    .IsRequired();

                eta.WithOwner();
            });

            builder.OwnsOne(v => v.EstimatedTimeDeparture, etd =>
            {
                etd.Property(e => e.Value)
                    .HasColumnName("EstimatedTimeDeparture")
                    .HasColumnType("timestamp with time zone")
                    .HasConversion(utcConverter)
                    .IsRequired();

                etd.WithOwner();
            });

            builder.OwnsOne(v => v.ActualTimeArrival, ata =>
            {
                ata.Property(e => e.Value)
                    .HasColumnName("ActualTimeArrival")
                    .HasColumnType("timestamp with time zone")
                    .HasConversion(utcConverter);

                ata.WithOwner();
            });

            builder.OwnsOne(v => v.ActualTimeDeparture, atd =>
            {
                atd.Property(e => e.Value)
                    .HasColumnName("ActualTimeDeparture")
                    .HasColumnType("timestamp with time zone")
                    .HasConversion(utcConverter);

                atd.WithOwner();
            });

            builder.OwnsOne(v => v.AcceptenceDate, acc =>
            {
                acc.Property(e => e.Value)
                    .HasColumnName("AcceptanceDate")
                    .HasColumnType("timestamp with time zone")
                    .HasConversion(utcConverter);

                acc.WithOwner();
            });

            builder.OwnsOne(v => v.SubmittedDate, sub =>
            {
                sub.Property(e => e.Value)
                    .HasColumnName("SubmittedDate")
                    .HasColumnType("timestamp with time zone")
                    .HasConversion(utcConverter);

                sub.WithOwner();
            });

            // ---------------------------
            //   VESSEL IMO (Owned) — FIX
            // ---------------------------
            builder.Property(v => v.VesselImo)
                .HasConversion(
                    v => v.Value,
                    v => new ImoNumber(v)
                )
                .HasColumnName("VesselImo")
                .IsRequired();

            // ---------------------------
            //   DOCK (Owned)
            // ---------------------------
            builder.OwnsOne(v => v.Dock, dock =>
            {
                dock.Property(d => d.Value)
                    .HasColumnName("Dock");

                dock.WithOwner();
            });

            builder.Property(v => v.Volume)
                .IsRequired();

            // ---------------------------
            //   STATUS (Enum <-> string)
            // ---------------------------
            var statusConverter = new ValueConverter<Status, string>(
                v => v.ToString(),
                v => new Status(Enum.Parse<VvnStatus>(v.Replace("Status: ", "")), null)
            );

            builder
                .Property(v => v.Status)
                .HasConversion(statusConverter)
                .IsRequired();

            // ---------------------------
            //   RELAÇÕES
            // ---------------------------
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