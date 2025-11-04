using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly IUserService _service;
    private readonly ILogger<UserController> _logger;
    
    public UserController(IUserService service, ILogger<UserController> logger)
    {
        _service = service;
        _logger = logger;
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        _logger.LogInformation("API Request: Get all Users");
        var list = await _service.GetAllAsync();
        _logger.LogInformation("API Response (200): Returning {Count} Users", list.Count);
        return Ok(list);
    }
    
    [HttpGet("NonAuthorized")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllNonAuthorized()
    {
        _logger.LogInformation("API Request: Get all Non Authorized Users");
        var list = await _service.GetAllNonAuthorizedAsync();
        _logger.LogInformation("API Response (200): Returning {Count} Non Authorized Users", list.Count);
        return Ok(list);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        _logger.LogInformation("API Request: Get User by ID = {Id}", id);
        try
        {
            var user = await _service.GetByIdAsync(new UserId(id));
            if (user == null)
            {
                _logger.LogWarning("API Response (404): User with ID = {Id} not found", id);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): User with ID = {Id} found", id);
            return Ok(user);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Failed to get User with ID = {Id}. Reason: {Message}", id, ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }
    
    [HttpGet("email/{email}")]
    public async Task<ActionResult<UserDto>> GetByEmail(string email)
    {
        _logger.LogInformation("API Request: Get User by email = {Email}", email);
        try
        {
            var user = await _service.GetByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("API Response (404): User with Email = {Email} not found", email);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): User with Email = {Email} found", email);
            return Ok(user);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Failed to get User with Email = {Email}. Reason: {Message}", email, ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }
    
    [HttpPut("toggle/{email}")]
    public async Task<ActionResult<UserDto>> ToggleStatus(Guid id)
    {
        _logger.LogInformation("API Request: Toggle status of User with email = {Id}", id);
        try
        {
            var updatedUser = await _service.ToggleAsync(new UserId(id));
            if (updatedUser == null)
            {
                _logger.LogWarning("API Response (404): User to toggle status not found with email = {Id}", id);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Status toggled for User with email = {Id}", id);
            return Ok(updatedUser);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }
    
    [HttpPut("changeRole/{id}")]
    public async Task<ActionResult<UserDto>> ChangeRole(Guid id, Roles role)
    {
        _logger.LogInformation("API Request: Toggle status of User with id = {ID}", id);
        try
        {
            var updatedUser = await _service.ChangeRoleAsync(new UserId(id), role);
            if (updatedUser == null)
            {
                _logger.LogWarning("API Response (404): User to change role not found with email = {Id}", id);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Role changed for User with email = {Id}", id);
            return Ok(updatedUser);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }
}
    