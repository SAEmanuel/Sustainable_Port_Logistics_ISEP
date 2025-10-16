using System.Text.Json;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations.DTOs;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Vessels;
using SEM5_PI_WEBAPI.Domain.Vessels.DTOs;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;

namespace SEM5_PI_WEBAPI.Seed;

public class Bootstrap
{
    private readonly IVesselTypeService _vesselTypeService;
    private readonly IVesselService _vesselService;
    private readonly IShippingAgentOrganizationService _shippingAgentOrganizationService;
    private readonly IQualificationService _qualificationService;
    private readonly IStaffMemberService _staffMemberService;
    private readonly ILogger<Bootstrap> _logger;

    //################## VESSEL TYPES ##################
    private readonly List<string> _vesselsTypesNames = new() { "Panamax", "Post-Panamax", "Handymax", "Feedermax", "ULCV" };
    private readonly List<string> _vesselsTypesDescription = new()
    {
        "Medium-sized vessel capable of passing through the original Panama Canal locks",
        "Large vessel exceeding Panamax dimensions, used in major global routes",
        "Versatile mid-size cargo vessel suitable for smaller ports",
        "Small regional vessel optimized for feeder and coastal operations",
        "Ultra Large Container Vessel used for high-capacity intercontinental shipping"
    };
    private readonly List<int> _vesselsTypesMaxBays = new() { 20, 24, 16, 12, 26 };
    private readonly List<int> _vesselsTypesMaxRows = new() { 15, 18, 12, 10, 22 };
    private readonly List<int> _vesselsTypesMaxTiers = new() { 10, 12, 8, 6, 14 };
    private readonly List<VesselTypeDto> _vesselsTypes = new();

    //################## VESSELS ##################
    private readonly List<string> _vesselImoNumbers = new() { "IMO 9234563", "IMO 9823455", "IMO 9345673", "IMO 9456783", "IMO 9999993" };
    private readonly List<string> _vesselNames = new() { "Ocean Spirit", "Global Titan", "Sea Voyager", "Atlantic Trader", "Ever Majesty" };
    private readonly List<string> _vesselOwners = new() { "BlueWave Shipping Ltd.", "Oceanic Logistics Co.", "Maritime Ventures SA", "Atlantic Marine Group", "Evergreen Marine Corp." };

    //################## SHIPPING AGENT ORGANIZATIONS ##################
    private readonly List<string> _saoCodes = new() { "1234567891", "1234567892", "1234567893", "1234567894", "1234567895" };
    private readonly List<string> _legalName = new() { "Atlantic Shipping Co.", "BlueWave Logistics", "Oceanic Transport Group", "PortLine Maritime Services", "Global Marine Alliance" };
    private readonly List<string> _altName = new() { "Atlantic Ship", "BlueWave", "Oceanic TG", "PortLine", "GMA Shipping" };
    private readonly List<string> _address = new()
    {
        "R. Dr. António Bernardino de Almeida 431, 4249-015 Porto, Portugal",
        "Av. da Boavista 101, 4100-128 Porto, Portugal",
        "Rua das Oliveiras 65, 4050-449 Porto, Portugal",
        "Rua do Campo Alegre 823, 4150-180 Porto, Portugal",
        "Rua Júlio Dinis 728, 4050-012 Porto, Portugal"
    };
    private readonly List<string> _taxNumber = new() { "PT501234567", "PT509876543", "PT502468135", "PT507531246", "PT503579864" };
    private readonly List<ShippingAgentOrganizationDto> _saoList = new();

    //################################################
    public Bootstrap(
        ILogger<Bootstrap> logger,
        IVesselTypeService vesselTypeService,
        IVesselService vesselService,
        IShippingAgentOrganizationService shippingAgentOrganizationService,IQualificationService qualificationService,
        IStaffMemberService staffMemberService)
    {
        _logger = logger;
        _vesselTypeService = vesselTypeService;
        _vesselService = vesselService;
        _shippingAgentOrganizationService = shippingAgentOrganizationService;
        _qualificationService = qualificationService;
        _staffMemberService = staffMemberService;
        
    }

    public async Task SeedAsync()
    {
        _logger.LogInformation("[BoostTrap] Starting data seeding...");
        await AddVesselTypeAsync();
        await AddVesselsAsync();
        await AddSaoAsync();
        await AddQualificationsFromJsonAsync("Seed/Qualifications.json");
        await AddStaffMembersFromJsonAsync("Seed/StaffMembers.json");

        _logger.LogInformation("[BoostTrap] Data seeding completed successfully.");
    }

    //################################################

    private async Task AddVesselTypeAsync()
    {
        _logger.LogInformation("[BoostTrap] Seeding Vessel Types...");
    
        for (int i = 0; i < _vesselsTypesNames.Count; i++)
        {
            var dto = new CreatingVesselTypeDto(
                _vesselsTypesNames[i],
                _vesselsTypesDescription[i],
                _vesselsTypesMaxBays[i],
                _vesselsTypesMaxRows[i],
                _vesselsTypesMaxTiers[i]
            );

            try
            {
                var created = await _vesselTypeService.AddAsync(dto);
                _vesselsTypes.Add(created);
                _logger.LogInformation("[BoostTrap] Vessel Type '{Name}' created successfully.", dto.Name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[BoostTrap] Could not add Vessel Type '{Name}': {Message}", dto.Name, ex.Message);

                try
                {
                    var existing = await _vesselTypeService.GetByNameAsync(dto.Name);
                    if (existing != null)
                    {
                        _vesselsTypes.Add(existing);
                        _logger.LogInformation("[BoostTrap] Retrieved existing Vessel Type '{Name}' from database.", dto.Name);
                    }
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "[BoostTrap] Failed to recover existing Vessel Type '{Name}'.", dto.Name);
                }
            }
        }
    }


    private async Task AddVesselsAsync()
    {
        _logger.LogInformation("[BoostTrap] Seeding Vessels...");
        for (int i = 0; i < _vesselImoNumbers.Count; i++)
        {
            var type = _vesselsTypes.ElementAtOrDefault(i % _vesselsTypes.Count);
            if (type == null)
            {
                _logger.LogWarning("[BoostTrap] Skipping vessel '{Name}' — no VesselType available.", _vesselNames[i]);
                continue;
            }

            var dto = new CreatingVesselDto(_vesselImoNumbers[i], _vesselNames[i], _vesselOwners[i], type.Id.ToString());

            try
            {
                await _vesselService.CreateAsync(dto);
                _logger.LogInformation("[BoostTrap] Vessel '{Name}' ({IMO}) created successfully.", dto.Name, dto.ImoNumber);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[BoostTrap] Could not add Vessel '{IMO}': {Message}", dto.ImoNumber, ex.Message);
            }
        }
    }

    private async Task AddSaoAsync()
    {
        _logger.LogInformation("[BoostTrap] Seeding Shipping Agent Organizations...");
        for (int i = 0; i < _saoCodes.Count; i++)
        {
            var dto = new CreatingShippingAgentOrganizationDto(
                _saoCodes[i],
                _legalName[i],
                _altName[i],
                _address[i],
                _taxNumber[i]
            );

            try
            {
                var saoDto = await _shippingAgentOrganizationService.CreateAsync(dto);
                _saoList.Add(saoDto);
                _logger.LogInformation("[BoostTrap] SAO '{AltName}' ({TaxNumber}) created successfully.", dto.AltName, dto.Taxnumber);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[BoostTrap] Could not add SAO '{TaxNumber}': {Message}", dto.Taxnumber, ex.Message);

                try
                {
                    var existing = await _shippingAgentOrganizationService.GetByTaxNumberAsync(new TaxNumber(dto.Taxnumber));
                    if (existing != null)
                    {
                        _saoList.Add(existing);
                        _logger.LogInformation("[BoostTrap] Retrieved existing SAO '{AltName}' from database.", dto.AltName);
                    }
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "[BoostTrap] Failed to recover existing SAO '{AltName}'.", dto.AltName);
                }
            }
        }
    }
    
    private async Task AddQualificationsFromJsonAsync(string filePath)
    {
        var qualifications = await LoadJsonAsync<CreatingQualificationDto>(filePath);
        if (qualifications == null) return;

        foreach (var qual in qualifications)
        {
            try
            {
                await _qualificationService.AddAsync(qual);
                _logger.LogInformation("[BoostTrap] Qualification '{Name}' created.", qual.Name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[BoostTrap] Could not add Qualification '{Name}': {Message}", qual.Name, ex.Message);
            }
        }
    }

    private async Task AddStaffMembersFromJsonAsync(string filePath)
    {
        var staffMembers = await LoadJsonAsync<CreatingStaffMemberDto>(filePath);
        if (staffMembers == null) return;

        foreach (var staff in staffMembers)
        {
            try
            {
                await _staffMemberService.AddAsync(staff);
                _logger.LogInformation("[BoostTrap] Staff Member '{ShortName}' created.", staff.ShortName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[BoostTrap] Could not add Staff Member '{ShortName}': {Message}", staff.ShortName, ex.Message);
            }
        }
    }

    private async Task<List<T>?> LoadJsonAsync<T>(string path)
    {
        using var stream = File.OpenRead(path);
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        return await JsonSerializer.DeserializeAsync<List<T>>(stream, options);
    }
    
}
