using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class QualificationsController : ControllerBase
{
    private readonly QualificationService _service;

    public QualificationsController(QualificationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QualificationDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<QualificationDto>> GetGetById(Guid id)
    {
        var q = await _service.GetByIdAsync(new QualificationId(id));

        if (q == null)
        {
            return NotFound();
        }

        return q;
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<QualificationDto>> GetQualificationByCode(string code)
    {
        try
        {
            var q = await _service.GetByCodeAsync(code);

            if (q is null)
            {
                return NotFound(new { error = "Qualification not found." }); 
            }

            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpGet("name/{name}")]
    public async Task<ActionResult<QualificationDto>> GetQualificationByName(string name)
    {
        try
        {
            var q = await _service.GetByNameAsync(name);

            if (q is null)
            {
                return NotFound(new { error = "Qualification not found." }); 
            }

            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<QualificationDto>> Create(CreatingQualificationDto dto)
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
    
    [HttpPatch("{id}")]
    public async Task<ActionResult<QualificationDto>> Update(Guid id, CreatingQualificationDto dto)
    {
        try
        {
            var qualy = await _service.UpdateAsync(new QualificationId(id), dto);
                
            if (qualy == null)
            {
                return NotFound();
            }
            return Ok(qualy);
        }
        catch(BusinessRuleValidationException ex)
        {
            return BadRequest(new {Message = ex.Message});
        }
    }
}