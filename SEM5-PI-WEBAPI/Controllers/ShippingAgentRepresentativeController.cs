using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ShippingAgentRepresentativeController : ControllerBase
{
    private readonly IShippingAgentRepresentativeService _service;
    private readonly ILogger<ShippingAgentRepresentativeController> _logger;

    public ShippingAgentRepresentativeController(IShippingAgentRepresentativeService service, ILogger<ShippingAgentRepresentativeController> logger)
    {
        _logger = logger;
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShippingAgentRepresentativeDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

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
    public async Task<ActionResult<ShippingAgentRepresentativeDto>> GetByEmailAsync(EmailAddress email)
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
    public async Task<ActionResult<ShippingAgentRepresentativeDto>> Create([FromBody] CreatingShippingAgentRepresentativeDto dto)
    {
        try
        {
            var q = await _service.AddAsync(dto);
            _logger.LogInformation("API Response (200): Representative with  email = {EMAIL} created successfully", dto.Email);
            return CreatedAtAction(nameof(GetGetById), new { id = q.Id }, q);
        }
        catch (BusinessRuleValidationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPatch("update/{email}")]
    public async Task<ActionResult<ShippingAgentRepresentativeDto>> UpdateAsync(string email, [FromBody] UpdatingShippingAgentRepresentativeDto? dto)
    {
        if (dto == null) return BadRequest("No changes provided.");

        EmailAddress address = new EmailAddress(email);

        try
        {
            _logger.LogInformation("API Request: Partial update for Shipping AgentRepresentative with email = {EMAIL}", address);

            var updatedDto = await _service.PatchByEmailAsync(address, dto);
            _logger.LogInformation("API Response (200): Representative with  email = {EMAIL} patched successfully", address);
            return Ok(updatedDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(e.Message);
        }
    }
    
    [HttpPost("{name}/notifications")]
    public async Task<ActionResult<ShippingAgentRepresentativeDto>> AddNotificationAsync(string name, [FromBody] string vvnCode)
    {
        try
        {
            _logger.LogInformation("API Request: Adding notification {vvnCode} to SAR {name}", vvnCode, name);

            var updatedRepresentative = await _service.AddNotificationAsync(name, vvnCode);

            _logger.LogInformation("API Response (200): Notification added successfully to SAR {name}", name);
            return Ok(updatedRepresentative);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): {Message}", e.Message);
            return BadRequest(new { Message = e.Message });
        }
    }

}