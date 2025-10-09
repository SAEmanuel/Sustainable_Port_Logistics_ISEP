using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CargoManifestController : ControllerBase
{
    private readonly CargoManifestService _service;

    public CargoManifestController(CargoManifestService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CargoManifestDto>>> GetAll()
    {
        return await _service.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CargoManifestDto>> GetById(Guid id)
    {
        var cargo = await _service.GetByIdAsync(new CargoManifestId(id));

        if (cargo == null)
            return NotFound();

        return cargo;
    }
    
    [HttpGet("code/{code}")]
    public async Task<ActionResult<CargoManifestDto>> GetByCode(string code)
    {
        var cargo = await _service.GetByCodeAsync(code);

        if (cargo == null)
            return NotFound();

        return cargo;
    }
    
    
    [HttpPost]
    public async Task<ActionResult<CargoManifestDto>> Create([FromBody]CreatingCargoManifestDto dto)
    {
        try
        {
            var cargo = await _service.AddAsync(dto);

            return CreatedAtAction(nameof(GetById), new { id = cargo.Id }, cargo);
        }
        catch (BusinessRuleValidationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
    
}