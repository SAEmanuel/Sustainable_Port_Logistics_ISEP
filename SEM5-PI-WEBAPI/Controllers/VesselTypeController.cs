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

        [HttpGet("{id}")]
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

        [HttpPost]
        public async Task<ActionResult<VesselTypeDto>> Create(CreatingVesselTypeDto dto)
        {
            _logger.LogInformation("API Request: Add Vessel Type with body = {@Dto}", dto);
            
            try
            {
                var vesselTypeDto = await _service.AddAsync(dto);
                _logger.LogInformation("API Response (201): VesselType created with ID = {Id}", vesselTypeDto.Id);
                return CreatedAtAction(nameof(GetById), new { id = vesselTypeDto.Id }, vesselTypeDto);
            }
            catch (BusinessRuleValidationException e)
            {
                _logger.LogWarning("API Error (404): {Message}", e.Message);
                return BadRequest(e.Message);
            }
        }
        
        
        
        
    }
}

