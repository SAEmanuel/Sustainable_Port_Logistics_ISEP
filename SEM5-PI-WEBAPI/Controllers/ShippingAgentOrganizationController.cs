using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ShippingAgentOrganizationController : ControllerBase
{
    private readonly ILogger<ShippingAgentOrganizationController> _logger;

    private readonly ShippingAgentOrganizationService _service;

    public ShippingAgentOrganizationController(ShippingAgentOrganizationService service,ILogger<ShippingAgentOrganizationController> logger)
    {
        _logger = logger;
        _service = service;

    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShippingAgentOrganizationDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    // GET: api/Products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ShippingAgentOrganizationDto>> GetGetById(Guid id)
    {
        var q = await _service.GetByIdAsync(new ShippingAgentOrganizationId(id));

        if (q == null)
        {
            return NotFound();
        }

        return q;
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<ShippingAgentOrganizationDto>> GetByCodeAsync(string Code)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching SAO with Code = {code}", Code);
            
            var shippingAgentOrganizationDto = await _service.GetByCodeAsync(new ShippingOrganizationCode(Code));
            
            _logger.LogWarning("API Response (200): SAO with Code = {code} -> FOUND", Code);
            
            return Ok(shippingAgentOrganizationDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }
    
    [HttpGet("legalName/{legalName}")]
    public async Task<ActionResult<ShippingAgentOrganization>> GetByLegalNameAsync(string LegalName)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching SAO with Legal Name = {name}", LegalName);
            
            var shippingAgentOrganizationDto = await _service.GetByLegalNameAsync(LegalName);
            
            _logger.LogWarning("API Response (200): SAO with Legal Name = {name} -> FOUND", LegalName);
            
            return Ok(shippingAgentOrganizationDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }


    [HttpGet("taxnumber/{taxnumber}")]
    public async Task<ActionResult<ShippingAgentOrganization>> GetByTaxNumberAsync(TaxNumber taxnumber)
    {
        try
        {
            _logger.LogInformation("API Request: Fetching SAO with Tax Number = {taxnumber}", taxnumber.Value);
            
            var shippingAgentOrganizationDto = await _service.GetByTaxNumberAsync(taxnumber);
            
            _logger.LogWarning("API Response (200): SAO with Tax Number = {taxnumber} -> FOUND", taxnumber.Value);
            
            return Ok(shippingAgentOrganizationDto);

        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): {Message}", e.Message);
            return NotFound(e.Message);
        }
    }


    [HttpPost]
    public async Task<ActionResult<ShippingAgentOrganizationDto>> Create([FromBody] CreatingShippingAgentOrganizationDto dto)
    {
        try
        {
            var q = await _service.CreateAsync(dto);

            return CreatedAtAction(nameof(GetGetById), new { id = q.Id }, q);
        }
        catch (BusinessRuleValidationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}