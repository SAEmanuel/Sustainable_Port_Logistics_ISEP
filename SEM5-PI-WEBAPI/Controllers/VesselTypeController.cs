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
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VesselTypeDto>> GetById(Guid id)
        {
            try
            {
                var vesselTypeDto = await _service.GetByIdAsync(new VesselTypeId(id));
                return Ok(vesselTypeDto);
            }
            catch (BusinessRuleValidationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<ActionResult<VesselTypeDto>> Create(CreatingVesselTypeDto dto)
        {
            try
            {
                var vesselTypeDto = await _service.AddAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = vesselTypeDto.Id }, vesselTypeDto);
            }
            catch (BusinessRuleValidationException e)
            {
                return BadRequest(e.Message);
            }
        }
        
        
        
        
    }
}

