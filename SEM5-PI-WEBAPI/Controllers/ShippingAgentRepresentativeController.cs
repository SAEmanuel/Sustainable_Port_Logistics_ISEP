using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ShippingAgentRepresentativesController : ControllerBase
{
    private readonly ShippingAgentRepresentativeService _service;
    private readonly ILogger<ShippingAgentRepresentativesController> _logger;

    public ShippingAgentRepresentativesController(ShippingAgentRepresentativeService service, ILogger<ShippingAgentRepresentativesController> logger)
    {
        _logger = logger;
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShippingAgentRepresentativeDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    // GET: api/Products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ShippingAgentRepresentativeDto>> GetGetById(Guid id)
    {
        var q = await _service.GetByIdAsync(new ShippingAgentRepresentativeId(id));

        if (q == null)
        {
            return NotFound();
        }

        return q;
    }

    [HttpGet("name/{name}")]
    public async Task<ActionResult<List<ShippingAgentRepresentativeDto>>> GetByNameAsync(string name)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching SAR with Name = {NAME}", name);
            
            var shippingAgentRepresentativeDto = await _service.GetByNameAsync(name);
            
            _logger.LogWarning("API Response (200): SAR with Name = {NAME} -> FOUND", name);
            
            return Ok(shippingAgentRepresentativeDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }

    [HttpGet("email/{email}")]
    public async Task<ActionResult<List<ShippingAgentRepresentativeDto>>> GetByEmailAsync(string email)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching SAR with email = {NAME}", email);
            
            var shippingAgentRepresentativeDto = await _service.GetByEmailAsync(email);
            
            _logger.LogWarning("API Response (200): SAR with email = {NAME} -> FOUND", email);
            
            return Ok(shippingAgentRepresentativeDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }

        [HttpGet("status/{status}")]
    public async Task<ActionResult<List<ShippingAgentRepresentativeDto>>> GetByStatusAsync(Status status)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching SAR with status = {NAME}", status);
            
            var shippingAgentRepresentativeDto = await _service.GetByStatusAsync(status);
            
            _logger.LogWarning("API Response (200): SAR with email = {NAME} -> FOUND", status);
            
            return Ok(shippingAgentRepresentativeDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }

    [HttpPost]
    public async Task<ActionResult<ShippingAgentRepresentativeDto>> Create(CreatingShippingAgentRepresentativeDto dto)
    {
        try
        {
            var q = await _service.AddAsync(dto);

            return CreatedAtAction(nameof(GetGetById), new { id = q.Id }, q);
        }
        catch (BusinessRuleValidationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}