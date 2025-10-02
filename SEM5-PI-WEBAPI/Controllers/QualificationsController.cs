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

    // GET: api/Products/5
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
}