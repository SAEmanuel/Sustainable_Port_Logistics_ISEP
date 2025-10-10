using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.PhysicalResources;

public class PhysicalResourceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPhysicalResourceRepository _repo;
    private readonly IQualificationRepository _qualificationRepository;

    public PhysicalResourceService(IUnitOfWork unitOfWork, IPhysicalResourceRepository repo,
        IQualificationRepository repoQualification)
    {
        _unitOfWork = unitOfWork;
        _repo = repo;
        _qualificationRepository = repoQualification;
    }

    public async Task<List<PhysicalResourceDTO>> GetAllAsync()
    {
        var list = await _repo.GetAllAsync();
        return list.ConvertAll(MapToDto);
    }

    public async Task<PhysicalResourceDTO> GetByIdAsync(PhysicalResourceId id)
    {
        var physicalResource = await _repo.GetByIdAsync(id);

        if (physicalResource == null)
            return null;

        return MapToDto(physicalResource);
    }

    public async Task<PhysicalResourceDTO> AddAsync(CreatingPhysicalResourceDTO dto)
    {
        
        if (dto.QualificationID is not null)
        {
            await CheckQualificationIdAsync(new QualificationId(dto.QualificationID.Value));
        }

        var physicalResource = new EntityPhysicalResource(
            dto.Code,
            dto.Description,
            dto.OperationalCapacity,
            dto.SetupTime,
            dto.PhysicalResourceType,
            dto.PhysicalResourceStatus,
            new QualificationId(dto.QualificationID.Value)
        );

        await _repo.AddAsync(physicalResource);
        await _unitOfWork.CommitAsync();

        return MapToDto(physicalResource);
    }

    /*public async Task<ProductDto> UpdateAsync(ProductDto dto)
    {
        await checkCategoryIdAsync(dto.CategoryId);
        var product = await this._repo.GetByIdAsync(new ProductId(dto.Id));

        if (product == null)
            return null;

        // change all fields
        product.ChangeDescription(dto.Description);
        product.ChangeCategoryId(dto.CategoryId);

        await this._unitOfWork.CommitAsync();

        return new ProductDto(product.Id.AsGuid(),product.Description,product.CategoryId);
    }*/

    private async Task CheckQualificationIdAsync(QualificationId id)
    {
        var exist = await _qualificationRepository.ExistQualificationID(id);

        if (!exist)
            throw new BusinessRuleValidationException("Qualification ID does not exist");
    }

    private static PhysicalResourceDTO MapToDto(EntityPhysicalResource entityPhysicalResource)
    {
        return new PhysicalResourceDTO(
            entityPhysicalResource.Id.AsGuid(),
            entityPhysicalResource.Code,
            entityPhysicalResource.Description,
            entityPhysicalResource.OperationalCapacity,
            entityPhysicalResource.SetupTime,
            entityPhysicalResource.Type,
            entityPhysicalResource.Status,
            entityPhysicalResource.QualificationID?.AsGuid());
    }
}