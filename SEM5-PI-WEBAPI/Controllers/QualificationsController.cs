using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Qualifications;
using SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers;

[Authorize(Roles = "LogisticsOperator")]
[Route("api/[controller]")]
[ApiController]
public class QualificationsController : ControllerBase
{
    private readonly IQualificationService _service;
    private readonly ILogger<QualificationsController> _logger;
    private readonly IResponsesToFrontend _refrontend;

    public QualificationsController(
        IQualificationService service, 
        ILogger<QualificationsController> logger,
        IResponsesToFrontend refrontend)
    {
        _service = service;
        _logger = logger;
        _refrontend = refrontend;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QualificationDto>>> GetAll()
    {
        try
        {
            _logger.LogInformation("API Request: Get all Qualifications");
            var qualifications = await _service.GetAllAsync();
            _logger.LogInformation("API Response (200): Returning {Count} Qualifications", qualifications?.Count() ?? 0);
            return Ok(qualifications);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Response (404): No Qualifications found");
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
    
    [HttpGet("id/{id}")]
    public async Task<ActionResult<QualificationDto>> GetById(Guid id)
    {
        _logger.LogInformation("API Request: Get Qualification by ID = {Id}", id);
        
        try
        {
            var q = await _service.GetByIdAsync(new QualificationId(id));
            _logger.LogInformation("API Response (200): Qualification with ID = {Id} -> FOUND", id);
            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (404): Qualification with ID = {Id} -> NOT FOUND", id);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<QualificationDto>> GetByCode(string code)
    {
        _logger.LogInformation("API Request: Get Qualification by Code = {Code}", code);
        
        try
        {
            var q = await _service.GetByCodeAsync(code);
            _logger.LogInformation("API Response (200): Qualification with Code = {Code} -> FOUND", code);
            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (404): Qualification with Code = {Code} -> NOT FOUND", code);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }
    
    [HttpGet("name/{name}")]
    public async Task<ActionResult<QualificationDto>> GetByName(string name)
    {
        _logger.LogInformation("API Request: Get Qualification by Name = {Name}", name);
        
        try
        {
            var q = await _service.GetByNameAsync(name);
            _logger.LogInformation("API Response (200): Qualification with Name = {Name} -> FOUND", name);
            return Ok(q);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (404): Qualification with Name = {Name} -> NOT FOUND", name);
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
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
            return CreatedAtAction(nameof(GetById), new { id = q.Id }, q);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Failed to create Qualification. Reason: {Message}", e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
    }
    
    [HttpPatch("{id}")]
    public async Task<ActionResult<QualificationDto>> Update(Guid id, UpdateQualificationDto dto)
    {
        _logger.LogInformation("API Request: Update Qualification with ID = {Id} and data {@Dto}", id, dto);
        
        try
        {
            var updatedQualification = await _service.UpdateAsync(new QualificationId(id), dto);
            _logger.LogInformation("API Response (200): Qualification with ID = {Id} updated successfully", id);
            return Ok(updatedQualification);
        }
        catch (BusinessRuleValidationException e)
        {
            _logger.LogWarning("API Error (400): Failed to update Qualification with ID = {Id}. Reason: {Message}", id, e.Message);
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
    }
    
    [Authorize(Roles = "LogisticsOperator")]
    [HttpGet("test-role")]
    public IActionResult TestRole()
    {
        var userName = User.Identity?.Name ?? "Unknown";
        var userId = User.FindFirst("sub")?.Value;
        var email = User.FindFirst("email")?.Value;
    
        // ✅ Buscar roles corretamente
        var userRoles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role || c.Type == "roles")
            .Select(c => c.Value)
            .ToList();

        Console.WriteLine($"👤 User authenticated: {userName}");
        Console.WriteLine($"📧 Email: {email}");
        Console.WriteLine($"🎭 Roles: {string.Join(", ", userRoles)}");

        return Ok(new
        {
            Message = "Access granted to LogisticsOperator role!",
            UserName = userName,
            UserId = userId,
            Email = email,
            Roles = userRoles,
            AllClaims = User.Claims.Select(c => new { c.Type, c.Value })
        });
    }
    
}