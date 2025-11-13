using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ShippingAgentRepresentatives.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.utils;
namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ShippingAgentRepresentativeController : ControllerBase
{
    private readonly IShippingAgentRepresentativeService _service;
    private readonly ILogger<ShippingAgentRepresentativeController> _logger;
    private readonly IResponsesToFrontend _refrontend;

    public ShippingAgentRepresentativeController(IShippingAgentRepresentativeService service, ILogger<ShippingAgentRepresentativeController> logger,IResponsesToFrontend refrontend)
    {
        _logger = logger;
        _service = service;
        _refrontend = refrontend;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShippingAgentRepresentativeDto>>> GetAll()
    {
        try
        {
            return Ok(await _service.GetAllAsync());
        }catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): No SARs found on DataBase");
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ShippingAgentRepresentativeDto>> GetGetById(Guid id)
    {
        try
        {
            var q = await _service.GetByIdAsync(new ShippingAgentRepresentativeId(id));

            if (q == null)
            {
                return NotFound();
            }

            return q;
        }catch (BusinessRuleValidationException e)
        {
             _logger.LogWarning("API Response (404): No SAR with ID = {id} found on DataBase",id);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
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
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
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
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
    
    
    
    [HttpGet("id/email/{email}")]
    public async Task<ActionResult<Guid>> GetIdByEmailAsync(string email)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching SAR ID with email = {NAME}", email);
            
            var shippingAgentRepresentativeDto = await _service.GetByEmailAsync(new EmailAddress(email));
            
            _logger.LogWarning("API Response (200): SAR ID with email = {NAME} {ID}-> FOUND", shippingAgentRepresentativeDto.Name,shippingAgentRepresentativeDto.Id);
            
            return Ok(shippingAgentRepresentativeDto.Id.ToString());

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
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
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
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
        catch (BusinessRuleValidationException e)
        {
           _logger.LogWarning("API Error (400): {Message}", e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
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
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
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
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
    }

}