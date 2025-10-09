using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests;

public class CargoManifestService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICargoManifestRepository _repo;
    private readonly IContainerRepository _repoContainer;
    private readonly ICargoManifestEntryRepository _repoCargoManifestEntry;

    public CargoManifestService(IUnitOfWork unitOfWork, ICargoManifestRepository repo,
        IContainerRepository repoContainer, ICargoManifestEntryRepository repoCargoManifestEntry)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _repoCargoManifestEntry = repoCargoManifestEntry;
        _repoContainer = repoContainer;
    }

    public async Task<List<CargoManifestDto>> GetAllAsync()
    {
        var manifests = await _repo.GetAllAsync();
        return manifests.Select(MapToDto).ToList();
    }

    public async Task<CargoManifestDto> GetByIdAsync(CargoManifestId id)
    {
        var manifest = await _repo.GetByIdAsync(id);
        if (manifest == null)
            throw new BusinessRuleValidationException("CargoManifest not found.");
        return MapToDto(manifest);
    }

    public async Task<CargoManifestDto> GetByCodeAsync(string code)
    {
        var manifest = await _repo.GetByCodeAsync(code);
        if (manifest == null)
            throw new BusinessRuleValidationException("CargoManifest not found.");
        return MapToDto(manifest);
    }

    public async Task<CargoManifestDto> AddAsync(CreatingCargoManifestDto dto)
    {
        var genCode = await GenerateNextCargoManifestCodeAsync();

        var entries = new List<CargoManifestEntry>();
        foreach (var entryDto in dto.Entries)
        {
            var container = await _repoContainer.GetByIsoNumberAsync(new Iso6346Code(entryDto.Container.IsoCode))
                            ?? new EntityContainer(entryDto.Container.IsoCode, entryDto.Container.Description,
                                entryDto.Container.Type, entryDto.Container.WeightKg);

            if (container.Id != null)
                await _repoContainer.AddAsync(container);

            var entry = new CargoManifestEntry(container, entryDto.StorageAreaId, entryDto.Bay, entryDto.Row,
                entryDto.Tier);
            entries.Add(entry);
        }

        var cargoManifest =
            new CargoManifest(entries, genCode, dto.Type, DateTime.UtcNow, dto.CreatedBy);

        await _repo.AddAsync(cargoManifest);
        await _unitOfWork.CommitAsync();
        return MapToDto(cargoManifest);
    }


    private static CargoManifestDto MapToDto(CargoManifest cargo)
    {
        return new CargoManifestDto(
            cargo.Id.AsGuid(),
            cargo.Code,
            cargo.Type,
            cargo.CreatedAt,
            cargo.SubmittedBy,
            cargo.ContainerEntries.Select(entry =>
                new CargoManifestEntryDto(
                    entry.Id.AsGuid(),
                    entry.Bay,
                    entry.Row,
                    entry.Tier,
                    entry.StorageAreaId.AsGuid(),
                    new ContainerDto(
                        entry.Container.Id.AsGuid(),
                        entry.Container.ISOId,
                        entry.Container.Description,
                        entry.Container.Type,
                        entry.Container.Status,
                        entry.Container.WeightKg
                    )
                )
            ).ToList()
        );
    }

    private async Task<string> GenerateNextCargoManifestCodeAsync()
    {
        var count = await _repo.CountAsync();
        int nextNumber = count + 1;
        return $"CGM-{nextNumber.ToString("D4")}";
    }
}