using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VesselTypeController : ControllerBase
    {
        
        private readonly VesselTypeService _service;
        private readonly ILogger<VesselTypeController> _logger;

        public VesselTypeController(VesselTypeService service,ILogger<VesselTypeController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<VesselTypeDto>>> GetAll()
        {
            _logger.LogInformation("API Request: Get All Vessels Types on DataBase");
            
            var listVesselTypeDtos = await _service.GetAllAsync();
            
            if (listVesselTypeDtos.Count > 0) 
                _logger.LogWarning("API Response (200): A total of {count} were found -> {@VesselTypes}", listVesselTypeDtos.Count, listVesselTypeDtos);
            else 
                _logger.LogWarning("API Response (400): No Vessels found on DataBase"); 
            
            return Ok(listVesselTypeDtos);
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
            catch (BusinessRuleValidationException ex)
            {
                _logger.LogWarning("API Error (404): Vessel Type with ID = {Id} -> NOT FOUND", id);
                return NotFound(ex.Message);
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
            catch (BusinessRuleValidationException ex)
            {
                _logger.LogWarning("API Error (404): Vessel Type with Name = {Id} -> NOT FOUND", name);
                return NotFound(ex.Message);
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
            catch (BusinessRuleValidationException ex)
            {
                _logger.LogWarning("API Error (404): Vessel/s Type/s with Description = {Description} -> NOT FOUND", description);
                return NotFound(ex.Message);
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
                _logger.LogWarning("API Error (404): {Message}", e.Message);
                return BadRequest(e.Message);
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
                return NotFound(e.Message);
            }
            
        }
        
        
        
    }
}

