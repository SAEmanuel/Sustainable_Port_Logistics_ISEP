using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class QualificationsController : ControllerBase
{
    private readonly IQualificationService _service;
    private readonly ILogger<QualificationsController> _logger;

    public QualificationsController(IQualificationService service, ILogger<QualificationsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QualificationDto>>> GetAll()
    {
        _logger.LogInformation("API Request: Get all Qualifications");
        var qualifications = await _service.GetAllAsync();
        _logger.LogInformation("API Response (200): Returning {Count} Qualifications", qualifications?.ToString() ?? "0");
        return Ok(qualifications);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<QualificationDto>> GetGetById(Guid id)
    {
        _logger.LogInformation("API Request: Get Qualification by ID = {Id}", id);
        try
        {
            var q = await _service.GetByIdAsync(new QualificationId(id));
            if (q == null)
            {
                _logger.LogWarning("API Response (404): Qualification with ID = {Id} not found", id);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Qualification with ID = {Id} found", id);
            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Failed to get Qualification with ID = {Id}. Reason: {Message}", id, e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<QualificationDto>> GetQualificationByCode(string code)
    {
        _logger.LogInformation("API Request: Get Qualification by Code = {Code}", code);
        try
        {
            var q = await _service.GetByCodeAsync(code);
            if (q is null)
            {
                _logger.LogWarning("API Response (404): Qualification with Code = {Code} not found", code);
                return NotFound(new { error = "Qualification not found." }); 
            }
            _logger.LogInformation("API Response (200): Qualification with Code = {Code} found", code);
            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Failed to get Qualification with Code = {Code}. Reason: {Message}", code, e.Message);
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpGet("name/{name}")]
    public async Task<ActionResult<QualificationDto>> GetQualificationByName(string name)
    {
        _logger.LogInformation("API Request: Get Qualification by Name = {Name}", name);
        try
        {
            var q = await _service.GetByNameAsync(name);
            if (q is null)
            {
                _logger.LogWarning("API Response (404): Qualification with Name = {Name} not found", name);
                return NotFound(new { error = "Qualification not found." }); 
            }
            _logger.LogInformation("API Response (200): Qualification with Name = {Name} found", name);
            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Failed to get Qualification with Name = {Name}. Reason: {Message}", name, e.Message);
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<QualificationDto>> Create(CreatingQualificationDto dto)
    {
        _logger.LogInformation("API Request: Create new Qualification with data {@Dto}", dto);
        try
        {
            var q = await _service.AddAsync(dto);
            _logger.LogInformation("API Response (201): Qualification created with ID = {Id}", q.Id);
            return CreatedAtAction(nameof(GetGetById), new { id = q.Id }, q);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Failed to create Qualification. Reason: {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }
    
    [HttpPatch("{id}")]
    public async Task<ActionResult<QualificationDto>> Update(Guid id, CreatingQualificationDto dto)
    {
        _logger.LogInformation("API Request: Update Qualification with ID = {Id} and data {@Dto}", id, dto);
        try
        {
            var qualy = await _service.UpdateAsync(new QualificationId(id), dto);
            if (qualy == null)
            {
                _logger.LogWarning("API Response (404): Qualification to update not found with ID = {Id}", id);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Qualification with ID = {Id} updated successfully", id);
            return Ok(qualy);
        }
        catch(BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Failed to update Qualification with ID = {Id}. Reason: {Message}", id, ex.Message);
            return BadRequest(new {Message = ex.Message});
        }
    }
}
