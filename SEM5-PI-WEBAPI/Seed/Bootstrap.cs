using System.Text.Json;
using System.Text.Json.Serialization;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.Dock.DTOs;
using SEM5_PI_WEBAPI.Domain.PhysicalResources;
using SEM5_PI_WEBAPI.Domain.PhysicalResources.DTOs;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations.DTOs;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using SEM5_PI_WEBAPI.Domain.StorageAreas;
using SEM5_PI_WEBAPI.Domain.StorageAreas.DTOs;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;
using SEM5_PI_WEBAPI.Domain.VVN;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;

namespace SEM5_PI_WEBAPI.Seed;

public class Bootstrap
{
    private readonly IVesselTypeService _vesselTypeService;
    private readonly IVesselService _vesselService;
    private readonly IShippingAgentOrganizationService _shippingAgentOrganizationService;
    private readonly IQualificationService _qualificationService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly IVesselVisitNotificationService _vesselVisitNotificationService;
    private readonly IShippingAgentRepresentativeService _shippingAgentRepresentativeService;
    private readonly IPhysicalResourceService _physicalResourceService;
    private readonly IStorageAreaService _storageAreaService;
    private readonly IDockService _dockService;
    private readonly ILogger<Bootstrap> _logger;
    
    public Bootstrap(
        ILogger<Bootstrap> logger,
        IVesselTypeService vesselTypeService,
        IVesselService vesselService,
        IShippingAgentOrganizationService shippingAgentOrganizationService,
        IShippingAgentRepresentativeService shippingAgentRepresentativeService,
        IVesselVisitNotificationService vesselVisitNotificationService,
        IDockService dockService,
        IQualificationService qualificationService,
        IPhysicalResourceService physicalResourceService,
        IStorageAreaService storageAreaService,
        IStaffMemberService staffMemberService)
    {
        _logger = logger;
        _vesselTypeService = vesselTypeService;
        _vesselService = vesselService;
        _shippingAgentOrganizationService = shippingAgentOrganizationService;
        _qualificationService = qualificationService;
        _staffMemberService = staffMemberService;
        _vesselVisitNotificationService = vesselVisitNotificationService;
        _shippingAgentRepresentativeService = shippingAgentRepresentativeService;
        _storageAreaService = storageAreaService;
        _physicalResourceService = physicalResourceService;
        _dockService = dockService;
    }

    public async Task SeedAsync()
    {
        _logger.LogInformation("|_________   [Bootstrap] Starting JSON-based data seeding  _________|");

        await SeedVesselTypesAsync("Seed/VesselsTypes.json");
        await SeedVesselsAsync("Seed/Vessels.json");
        
        await SeedShippingAgentOrganizationsAsync("Seed/ShippingAgentsOrganizations.json");
        await SeedShippingAgentRepresentativesAsync("Seed/ShippingAgentsRepresentative.json");
        
        await SeedQualificationsAsync("Seed/Qualifications.json");
        await SeedStaffMembersAsync("Seed/StaffMembers.json");
        await SeedPhysicalResourcesAsync("Seed/PhysicalResource.json");
        await SeedDockAsync("Seed/Docks.json");
        await SeedStorageAreaNotificationsAsync("Seed/StorageAreas.json");
        //await SeedStaffMembersAsync("Seed/StaffMembers.json");
        
        await SeedVesselVisitNotificationsAsync("Seed/VesselVisitNotifications.json");
        
        _logger.LogInformation("|_________[Bootstrap] JSON data seeding completed successfully_________|");
    }


    // ===============================================================
    // JSON SEED HELPERS

    private async Task SeedVesselTypesAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Vessel Types from {Path}", filePath);

        var vesselTypes = await LoadJsonAsync<CreatingVesselTypeDto>(filePath);
        if (vesselTypes == null) return;

        foreach (var dto in vesselTypes)
        {
            try
            {
                var created = await _vesselTypeService.AddAsync(dto);
                _logger.LogInformation("[Bootstrap] Vessel Type '{Name}' created successfully.", dto.Name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not update Vessel Type'{IMO}': {Message}", dto.Name, ex.Message);
            }
        }
    }

    private async Task SeedVesselsAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Vessels from {Path}", filePath);

        var vessels = await LoadJsonAsync<CreatingVesselDto>(filePath);
        if (vessels == null) return;

        foreach (var dto in vessels)
        {
            try
            {
                await _vesselService.CreateAsync(dto);
                _logger.LogInformation("[Bootstrap] Vessel '{Name}' ({IMO}) created successfully.", dto.Name,
                    dto.ImoNumber);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not update Vessel '{IMO}': {Message}", dto.ImoNumber, ex.Message);
            }
        }
    }

    private async Task SeedShippingAgentOrganizationsAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Shipping Agents Organizations from {Path}", filePath);

        var agents = await LoadJsonAsync<CreatingShippingAgentOrganizationDto>(filePath);
        if (agents == null) return;

        foreach (var dto in agents)
        {
            try
            {
                var created = await _shippingAgentOrganizationService.CreateAsync(dto);
                _logger.LogInformation("[Bootstrap] SAO '{AltName}' ({TaxNumber}) created successfully.", dto.AltName,
                    dto.Taxnumber);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not update SAO '{AltName}': {Message}", dto.AltName, ex.Message);
            }
        }
    }

    private async Task SeedShippingAgentRepresentativesAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Shipping Agents Representatives from {Path}", filePath);

        var agents = await LoadJsonAsync<CreatingShippingAgentRepresentativeDto>(filePath);
        if (agents == null) return;

        foreach (var dto in agents)
        {
            try
            {
                var created = await _shippingAgentRepresentativeService.AddAsync(dto);
                _logger.LogInformation("[Bootstrap] SAR '{AltName}' ({Email}) created successfully.", dto.Name, dto.Email);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not update SAR '{AltName}': {Message}", dto.Name, ex.Message);
            }
        }
    }
    

    private async Task SeedQualificationsAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Qualifications from {Path}", filePath);

        var qualifications = await LoadJsonAsync<CreatingQualificationDto>(filePath);
        if (qualifications == null) return;

        foreach (var dto in qualifications)
        {
            try
            {
                await _qualificationService.AddAsync(dto);
                _logger.LogInformation("[Bootstrap] Qualification '{Name}' created successfully.", dto.Name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not add Qualification '{Name}': {Message}", dto.Name, ex.Message);
            }
        }
    }
    
    private async Task SeedPhysicalResourcesAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Physical Resource from {Path}", filePath);

        var physicalResources = await LoadJsonAsync<CreatingPhysicalResourceDto>(filePath);
        if (physicalResources == null) return;

        foreach (var dto in physicalResources)
        {
            try
            {
                await _physicalResourceService.AddAsync(dto);
                _logger.LogInformation("[Bootstrap] Physical Resource '{Name}' created successfully.", dto.QualificationCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not add Physical Resource '{Name}': {Message}", dto.QualificationCode, ex.Message);
            }
        }
    }
    
    private async Task SeedDockAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Dock from {Path}", filePath);

        var docks = await LoadJsonAsync<RegisterDockDto>(filePath);
        if (docks == null) return;

        foreach (var dto in docks)
        {
            try
            {
                await _dockService.CreateAsync(dto);
                _logger.LogInformation("[Bootstrap] Dock with code : '{Code}' created successfully.", dto.Code);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not add Dock with code : '{Code}': {Message}", dto.Code, ex.Message);
            }
        }
    }
    
    private async Task SeedStaffMembersAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Staff Members from {Path}", filePath);

        var staff = await LoadJsonAsync<CreatingStaffMemberDto>(filePath);
        if (staff == null) return;

        foreach (var dto in staff)
        {
            try
            {
                await _staffMemberService.AddAsync(dto);
                _logger.LogInformation("[Bootstrap] Staff Member '{ShortName}' created successfully.", dto.ShortName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not add Staff Member '{ShortName}': {Message}", dto.ShortName,
                    ex.Message);
            }
        }
    }
    private async Task SeedVesselVisitNotificationsAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Vessel Visit Notifications from {Path}", filePath);

        var vvn = await LoadJsonAsync<CreatingVesselVisitNotificationDto>(filePath);
        if (vvn == null) return;

        foreach (var v in vvn)
        {
            try
            {
                var r = await _vesselVisitNotificationService.AddAsync(v);
                _logger.LogInformation("[Bootstrap] Vessel Visit Notification '{id}' created successfully.", r.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not add Vessel Visit Notification: {Message}",
                    ex.Message);
            }
        }
    }
    
    private async Task SeedStorageAreaNotificationsAsync(string filePath)
    {
        _logger.LogInformation("[Bootstrap] Loading Storage Areas from {Path}", filePath);

        var dto = await LoadJsonAsync<CreatingStorageAreaDto>(filePath);
        if (dto == null) return;

        foreach (var sa in dto)
        {
            try
            {
                await _storageAreaService.CreateAsync(sa);
                _logger.LogInformation("[Bootstrap] StorageArea '{name}' created successfully.", sa.Name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Bootstrap] Could not add StorageArea '{name}': {Message}", sa.Name,
                    ex.Message);
            }
        }
    }


    // ===============================================================
    // GENERIC JSON LOADER

    private async Task<List<T>?> LoadJsonAsync<T>(string path)
    {
        if (!File.Exists(path))
        {
            _logger.LogWarning("[Bootstrap] JSON file not found: {Path}", path);
            return null;
        }

        try
        {
            using var stream = File.OpenRead(path);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true, 
                AllowTrailingCommas = true,        
                ReadCommentHandling = JsonCommentHandling.Skip,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)
                }
            };

            var result = await JsonSerializer.DeserializeAsync<List<T>>(stream, options);

            if (result == null || result.Count == 0)
            {
                _logger.LogWarning("[Bootstrap] JSON file parsed but returned no records: {Path}", path);
                return null;
            }

            _logger.LogInformation("[Bootstrap] Loaded {Count} records from {Path}", result.Count, path);
            return result;
        }
        catch (JsonException jsonEx)
        {
            _logger.LogError(jsonEx, "[Bootstrap] Invalid JSON format in file: {Path}", path);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Bootstrap] Failed to parse JSON file: {Path}", path);
            return null;
        }
    }

}