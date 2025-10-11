using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.VVN;

namespace SEM5_PI_WEBAPI.Infraestructure.VVN;

public class VesselVisitNotificationTypeConfiguration : IEntityTypeConfiguration<VesselVisitNotification>
{
    public void Configure(EntityTypeBuilder<VesselVisitNotification> builder)
    {
        builder.HasKey(b => b.Id);
    }
}