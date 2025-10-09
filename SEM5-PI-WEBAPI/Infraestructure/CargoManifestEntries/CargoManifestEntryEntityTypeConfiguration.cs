using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;

namespace SEM5_PI_WEBAPI.Infraestructure.CargoManifestEntries;

public class CargoManifestEntryEntityTypeConfiguration : IEntityTypeConfiguration<CargoManifestEntry>
{
    public void Configure(EntityTypeBuilder<CargoManifestEntry> builder)
    {
    }
}