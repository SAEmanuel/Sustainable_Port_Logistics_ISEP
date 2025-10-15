using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Containers.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests;

public class CargoManifestService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICargoManifestRepository _repo;
    private readonly IContainerRepository _repoContainer;
    private readonly ICargoManifestEntryRepository _repoCargoManifestEntry;
    private readonly IStorageAreaRepository _repoStorageArea;

    public CargoManifestService(IUnitOfWork unitOfWork, ICargoManifestRepository repo,
        IContainerRepository repoContainer, ICargoManifestEntryRepository repoCargoManifestEntry,
        IStorageAreaRepository repoStorageArea)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _repoCargoManifestEntry = repoCargoManifestEntry;
        _repoContainer = repoContainer;
        _repoStorageArea = repoStorageArea;
    }

    public async Task<List<CargoManifestDto>> GetAllAsync()
    {
        var manifests = await _repo.GetAllAsync();
        var dtoTasks = manifests.Select(manifest => MapToDtoAsync(manifest));
        return (await Task.WhenAll(dtoTasks)).ToList();
    }

    public async Task<CargoManifestDto> GetByIdAsync(CargoManifestId id)
    {
        var manifest = await _repo.GetByIdAsync(id);
        if (manifest == null)
            throw new BusinessRuleValidationException("CargoManifest not found.");
        return await MapToDtoAsync(manifest);
    }

    public async Task<CargoManifestDto> GetByCodeAsync(string code)
    {
        var manifest = await _repo.GetByCodeAsync(code);
        if (manifest == null)
            throw new BusinessRuleValidationException("CargoManifest not found.");
        return await MapToDtoAsync(manifest);
    }

    public async Task<CargoManifestDto> AddAsync(CreatingCargoManifestDto dto)
    {
        var genCode = await GenerateNextCargoManifestCodeAsync();

        var entries = new List<CargoManifestEntry>();
        foreach (var entryDto in dto.Entries)
        {
            var container = await _repoContainer.GetByIsoNumberAsync(new Iso6346Code(entryDto.Container.IsoCode))
                            ?? new EntityContainer(
                                entryDto.Container.IsoCode,
                                entryDto.Container.Description,
                                entryDto.Container.Type,
                                entryDto.Container.WeightKg
                            );

            if (container.Id == null)
                await _repoContainer.AddAsync(container);

            var entry = new CargoManifestEntry(container, new StorageAreaId(entryDto.StorageAreaId), entryDto.Bay,
                entryDto.Row, entryDto.Tier);
            entries.Add(entry);
        }

        var cargoManifest = new CargoManifest(entries, genCode, dto.Type, DateTime.UtcNow, new Email(dto.CreatedBy));

        await _repo.AddAsync(cargoManifest);
        await _unitOfWork.CommitAsync();
        return await MapToDtoAsync(cargoManifest);
    }


    private async Task<CargoManifestDto> MapToDtoAsync(CargoManifest cargo)
    {
        var entryDtos = new List<CargoManifestEntryDto>();
        foreach (var entry in cargo.ContainerEntries)
        {
            var storageArea = await _repoStorageArea.GetByIdAsync(entry.StorageAreaId);
            entryDtos.Add(new CargoManifestEntryDto(
                entry.Id.AsGuid(),
                entry.Bay,
                entry.Row,
                entry.Tier,
                storageArea.Name,
                new ContainerDto(
                    entry.Container.Id.AsGuid(),
                    entry.Container.ISOId,
                    entry.Container.Description,
                    entry.Container.Type,
                    entry.Container.Status,
                    entry.Container.WeightKg
                )
            ));
        }

        return new CargoManifestDto(
            cargo.Id.AsGuid(),
            cargo.Code,
            cargo.Type,
            cargo.CreatedAt,
            cargo.SubmittedBy.ToString(),
            entryDtos
        );
    }


    private async Task<string> GenerateNextCargoManifestCodeAsync()
    {
        var count = await _repo.CountAsync();
        int nextNumber = count + 1;
        return $"CGM-{nextNumber.ToString("D4")}";
    }
}
