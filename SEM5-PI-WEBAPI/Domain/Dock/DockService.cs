using SEM5_PI_WEBAPI.Domain.Dock.DTOs;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Dock 
{
    public class DockService : IDockService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDockRepository _dockRepository;
        private readonly IVesselTypeRepository _vesselTypeRepository;
        private readonly IPhysicalResourceRepository _physicalResourceRepository;
        private readonly ILogger<DockService> _logger;

        public DockService(
            IUnitOfWork unitOfWork,
            IDockRepository dockRepository,
            IVesselTypeRepository vesselTypeRepository,
            IPhysicalResourceRepository physicalResourceRepository,
            ILogger<DockService> logger)
        {
            _unitOfWork = unitOfWork;
            _dockRepository = dockRepository;
            _vesselTypeRepository = vesselTypeRepository;
            _physicalResourceRepository = physicalResourceRepository;
            _logger = logger;
        }

        public async Task<List<DockDto>> GetAllAsync()
        {
            _logger.LogInformation("Fetch all docks");
            var docks = await _dockRepository.GetAllAsync();
            return docks.Select(DockMapper.RegisterDockDto).ToList();
        }

        public async Task<DockDto> CreateAsync(RegisterDockDto dto)
        {
            _logger.LogInformation("Create dock {Code}", dto.Code);

            var code = new DockCode(dto.Code);
            var existing = await _dockRepository.GetByCodeAsync(code);
            if (existing is not null) throw new BusinessRuleValidationException($"Dock with code '{code.Value}' already exists.");
            List<PhysicalResourceCode> prcList = new List<PhysicalResourceCode>();
            foreach (var raw in dto.PhysicalResourceCodes) 
            {
                    var prc = new PhysicalResourceCode(raw);
                    var physicalResource = await _physicalResourceRepository.GetByCodeAsync(prc);
                    if (physicalResource == null) throw new BusinessRuleValidationException($"PhysicalResource with code '{prc.Value}' does not exist in DB.");
                    var existingPrc = await _dockRepository.GetByPhysicalResourceCodeAsync(prc);
                    if (existingPrc is not null)
                        throw new BusinessRuleValidationException($"Dock with PhysicalResourceCode '{prc.Value}' already exists in DB.");
                    prcList.Add(physicalResource.Code);
            }
            
            
            List<VesselTypeId> vesselsTypes = new List<VesselTypeId>();
            foreach (var raw in dto.AllowedVesselTypeNames)
            {
                var vt = await _vesselTypeRepository.GetByNameAsync(raw);
                if (vt == null)
                    throw new BusinessRuleValidationException($"VesselType '{raw}' does not exist in DB.");
                vesselsTypes.Add(new VesselTypeId(vt.Id.Value));
            }

            dto.VesselsTypesObjs = vesselsTypes;

            var dock = DockFactory.RegisterDock(dto, prcList);
            await _dockRepository.AddAsync(dock);
            await _unitOfWork.CommitAsync();

            return DockMapper.RegisterDockDto(dock);
        }

        public async Task<DockDto> GetByIdAsync(DockId id)
        {
            _logger.LogInformation("Get dock by Id {Id}", id.Value);
            var dock = await _dockRepository.GetByIdAsync(id)
                       ?? throw new BusinessRuleValidationException($"No dock found with Id {id.Value}");
            return DockMapper.RegisterDockDto(dock);
        }

        public async Task<DockDto> GetByCodeAsync(string codeString)
        {
            var code = new DockCode(codeString);
            _logger.LogInformation("Get dock by Code {Code}", code.Value);
            var dock = await _dockRepository.GetByCodeAsync(code)
                       ?? throw new BusinessRuleValidationException($"No dock found with Code {code.Value}");
            return DockMapper.RegisterDockDto(dock);
        }

        public async Task<DockDto> GetByPhysicalResourceCodeAsync(string codeString)
        {
            var prc = new PhysicalResourceCode(codeString);
            _logger.LogInformation("Get dock by PhysicalResourceCode {Code}", prc.Value);
            var dock = await _dockRepository.GetByPhysicalResourceCodeAsync(prc)
                       ?? throw new BusinessRuleValidationException($"No dock found with PhysicalResourceCode {prc.Value}");
            return DockMapper.RegisterDockDto(dock);
        }

        public async Task<List<DockDto>> GetByVesselTypeAsync(string vesselTypeId)
        {
            if (!Guid.TryParse(vesselTypeId, out var g) || g == Guid.Empty)
                throw new BusinessRuleValidationException("Invalid VesselTypeId.");

            var docks = await _dockRepository.GetByVesselTypeAsync(new VesselTypeId(g));
            return docks.Select(DockMapper.RegisterDockDto).ToList();
        }

        public async Task<List<DockDto>> GetFilterAsync(
            string? code,
            string? vesselTypeId,
            string? location,
            string? query,
            string? status)
        {
            DockCode? dockCode = null;
            if (!string.IsNullOrWhiteSpace(code))
                dockCode = new DockCode(code);

            VesselTypeId? vtId = null;
            if (!string.IsNullOrWhiteSpace(vesselTypeId))
            {
                if (!Guid.TryParse(vesselTypeId, out var g) || g == Guid.Empty)
                    throw new BusinessRuleValidationException("Invalid VesselTypeId.");
                vtId = new VesselTypeId(g);
            }

            DockStatus? st = null;
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DockStatus>(status, true, out var parsed))
                st = parsed;

            var docks = await _dockRepository.GetFilterAsync(
                dockCode,
                vtId,
                location,
                query,
                st
            );

            return docks.Select(DockMapper.RegisterDockDto).ToList();
        }

        public async Task<List<DockDto>> GetByLocationAsync(string location)
        {
            if (string.IsNullOrWhiteSpace(location))
                throw new BusinessRuleValidationException("location is required.");

            _logger.LogInformation("Get docks by location: {Loc}", location);

            var docks = await _dockRepository.GetByLocationAsync(location);
            return docks.Select(DockMapper.RegisterDockDto).ToList();
        }

        public async Task<DockDto> PatchByCodeAsync(string codeString, UpdateDockDto dto)
        {
            var code = new DockCode(codeString);

            var dock = await _dockRepository.GetByCodeAsync(code)
                       ?? throw new BusinessRuleValidationException($"No dock found with Code {code.Value}");

            if (!string.IsNullOrWhiteSpace(dto.Code))
            {
                var newCode = new DockCode(dto.Code);
                var duplicate = await _dockRepository.GetByCodeAsync(newCode);
                if (duplicate is not null && duplicate.Id.AsGuid() != dock.Id.AsGuid())
                    throw new BusinessRuleValidationException($"Dock with code '{newCode.Value}' already exists.");
                dock.SetCode(newCode);
            }

            if (dto.PhysicalResourceCodes is not null)
            {
                var prcs = new List<PhysicalResourceCode>();
                foreach (var raw in dto.PhysicalResourceCodes)
                {
                    var newPrc = new PhysicalResourceCode(raw);
                    var duplicatePrc = await _dockRepository.GetByPhysicalResourceCodeAsync(newPrc);
                    if (duplicatePrc is not null && duplicatePrc.Id.AsGuid() != dock.Id.AsGuid())
                        throw new BusinessRuleValidationException($"Dock with PhysicalResourceCode '{newPrc.Value}' already exists.");
                    prcs.Add(newPrc);
                }
                dock.ReplacePhysicalResourceCodes(prcs);
            }

            if (!string.IsNullOrWhiteSpace(dto.Location))
                dock.SetLocation(dto.Location);
            if (dto.LengthM.HasValue)   dock.SetLength(dto.LengthM.Value);
            if (dto.DepthM.HasValue)    dock.SetDepth(dto.DepthM.Value);
            if (dto.MaxDraftM.HasValue) dock.SetMaxDraft(dto.MaxDraftM.Value);

            if (dto.AllowedVesselTypeIds is not null)
            {
                if (!dto.AllowedVesselTypeIds.Any())
                    throw new BusinessRuleValidationException("At least one VesselTypeId is required.");

                var ids = new List<VesselTypeId>();

                foreach (var raw in dto.AllowedVesselTypeIds)
                {
                    if (!Guid.TryParse(raw, out var g) || g == Guid.Empty)
                        throw new BusinessRuleValidationException("Invalid VesselTypeId in update.");

                    var vt = await _vesselTypeRepository.GetByIdAsync(new VesselTypeId(g));
                    if (vt == null)
                        throw new BusinessRuleValidationException($"Vessel Type '{g}' doesn't exist.");

                    ids.Add(new VesselTypeId(g));
                }

                dock.ReplaceAllowedVesselTypes(ids);
            }

            if (dto.Status.HasValue)
                dock.SetStatus(dto.Status.Value);

            dock.EnsureHasAllowedVesselTypes();
            await _unitOfWork.CommitAsync();
            return DockMapper.RegisterDockDto(dock);
        }

        public async Task<List<string>> GetAllDockCodesAsync()
        {
            var codes = await _dockRepository.GetAllDockCodesAsync();
            return codes.Select(c => c.Value).ToList();
        }
    }
}
