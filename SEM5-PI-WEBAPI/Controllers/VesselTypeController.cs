using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VesselTypeController
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
            return await _service.GetAllAsync();
        }
    }
}

