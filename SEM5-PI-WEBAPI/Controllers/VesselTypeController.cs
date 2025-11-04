using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;
using SEM5_PI_WEBAPI.Domain.VesselsTypes.DTOs;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers
{
    [Authorize(Roles = "PortAuthorityOfficer")]
    [ApiController]
    [Route("api/[controller]")]
    public class VesselTypeController : ControllerBase
    {
        
        private readonly IVesselTypeService _service;
        private readonly ILogger<VesselTypeController> _logger;
        private readonly IResponsesToFrontend _refrontend;

        public VesselTypeController(IVesselTypeService service,ILogger<VesselTypeController> logger,IResponsesToFrontend refrontend)
        {
            _service = service;
            _logger = logger;
            _refrontend = refrontend;
        }
        
        
        
        [HttpGet]
        public async Task<ActionResult<List<VesselTypeDto>>> GetAll()
        {
            try
            {
                _logger.LogInformation("API Request: Get All Vessels Types on DataBase");
                var listVesselTypeDtos = await _service.GetAllAsync();
                _logger.LogWarning("API Response (200): A total of {count} were found -> {@VesselTypes}", listVesselTypeDtos.Count, listVesselTypeDtos);

                return Ok(listVesselTypeDtos);

            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Response (404): No Vessels Types found on DataBase");
                return _refrontend.ProblemResponse("Not Found", e.Message, 404);
            }
        }

        [HttpGet("id/{id:guid}")]
        public async Task<ActionResult<VesselTypeDto>> GetById(Guid id)
        {
            _logger.LogInformation("API Request: Fetching Vessel Type with ID = {Id}", id);
            
            try
            {
                var vesselTypeDto = await _service.GetByIdAsync(new VesselTypeId(id));
                _logger.LogWarning("API Response (200): Vessel Type with ID = {Id} -> FOUND", id);
                return Ok(vesselTypeDto);
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Error (404): Vessel Type with ID = {Id} -> NOT FOUND", id);
                return _refrontend.ProblemResponse("Not Found", e.Message, 404);
            }
        }

        [HttpGet("name/{name}")]
        public async Task<ActionResult<VesselTypeDto>> GetByName(string name)
        {
            try
            {
                _logger.LogInformation("API Request: Fetching Vessel Type with Name = {Name}", name);
                
                var vesselTypeDto = await _service.GetByNameAsync(name);
                _logger.LogWarning("API Response (200): Vessel Type with Name = {Name} -> FOUND", name);
                return Ok(vesselTypeDto);
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Error (404): Vessel Type with Name = {Id} -> NOT FOUND", name);
                return _refrontend.ProblemResponse("Not Found", e.Message, 404);
            }
        }
        
        [HttpGet("description/{description}")]
        public async Task<ActionResult<List<VesselTypeDto>>> GetByDescription(string description)
        {
            try
            {
                _logger.LogInformation("API Request: Fetching Vessel/s Type/s with Description = {Description}", description);
                
                var listVesselTypeDto = await _service.GetByDescriptionAsync(description);
                _logger.LogWarning("API Response (200): Vessel/s Type/s with requested Description where found: {@vesselTypeDto}",listVesselTypeDto);
                return Ok(listVesselTypeDto);
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Error (404): Vessel/s Type/s with Description = {Description} -> NOT FOUND", description);
                return _refrontend.ProblemResponse("Not Found", e.Message, 404);
            }
        }

        [HttpPost]
        public async Task<ActionResult<VesselTypeDto>> Create(CreatingVesselTypeDto dto)
        {
            _logger.LogInformation("API Request: Add Vessel Type with body = {@Dto}", dto);
            
            try
            {
                var vesselTypeDto = await _service.AddAsync(dto);
                _logger.LogInformation("API Response (201): Vessel Type created with ID = {Id}", vesselTypeDto.Id);
                return CreatedAtAction(nameof(GetById), new { id = vesselTypeDto.Id }, vesselTypeDto);
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Error (400): {Message}", e.Message);
                return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
            }
        }


        [HttpGet("filter")]
        public async Task<ActionResult<List<VesselTypeDto>>> Filter(string? name, string? description,
            string? query)
        {
            _logger.LogInformation("API Request: Filtering Vessel/s Type/s with filters -> Name = {Name}, Description = {Description}, Query = {Query}", name, description, query);

            try
            {
                var listVesselsTypes = await _service.FilterAsync(name,description,query);
                
                _logger.LogInformation("API Response (200): Found {Count} Vessel/s Type/s -> {@Vessels}", listVesselsTypes.Count,listVesselsTypes);
                
                return Ok(listVesselsTypes);
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Response (404): No Vessel/s Type/s matched filters.");
                return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
            }
            
        }
        
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<VesselTypeDto>> Update(Guid id, UpdateVesselTypeDto dto)
        {
            _logger.LogInformation("API Request: Update Vessel Type with ID = {Id} and body = {@Dto}", id, dto);
            try
            {
                var updatedVesselType = await _service.UpdateAsync(new VesselTypeId(id), dto);
                _logger.LogInformation("API Response (200): Vessel Type with ID = {Id} updated successfully.", id);
                return Ok(updatedVesselType);
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Response (400): Update failed for Vessel Type with ID = {Id}. Reason: {Message}", id, e.Message);
                return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
            }
        }
        
        [HttpDelete("{id:guid}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            _logger.LogInformation("API Request: Delete Vessel Type with ID = {Id}", id);

            try
            {
                await _service.DeleteAsync(new VesselTypeId(id));
                _logger.LogInformation("API Response (200): Vessel Type with ID = {Id} deleted successfully.", id);
                return Ok($"Vessel Type with ID = {id} deleted successfully.");
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Error (404): Vessel Type with ID = {Id} -> NOT FOUND", id);
                return _refrontend.ProblemResponse("Not Found", e.Message, 404);
            }
        }

        
    }
}

