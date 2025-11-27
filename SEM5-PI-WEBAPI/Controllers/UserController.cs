using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Users;
using SEM5_PI_WEBAPI.Domain.Users.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.utils;
using SEM5_PI_WEBAPI.utils.EmailTemplates;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly IUserService _service;
    private readonly ILogger<UserController> _logger;
    private readonly IEmailSender _emailSender;

    public UserController(IUserService service, ILogger<UserController> logger, IEmailSender emailSender)
    {
        _service = service;
        _logger = logger;
        _emailSender = emailSender;
    }

    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        _logger.LogInformation("API Request: Get all Users");
        var list = await _service.GetAllAsync();
        _logger.LogInformation("API Response (200): Returning {Count} Users", list.Count);
        return Ok(list);
    }

    
    [HttpGet("NotEliminated")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllNotEliminated()
    {
        _logger.LogInformation("API Request: Get not eliminated all Users");
        var list = await _service.GetAllNotEliminatedAsync();
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
            _logger.LogWarning("API Error (400): Failed to get User with Email = {Email}. Reason: {Message}", email,
                ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    
    [HttpPut("toggle/{id}")]
    public async Task<ActionResult<UserDto>> ToggleStatus(Guid id)
    {
        _logger.LogInformation("API Request: Toggle status of User with id = {Id}", id);
        try
        {
            var updatedUser = await _service.ToggleAsync(new UserId(id));
            if (updatedUser == null)
            {
                _logger.LogWarning("API Response (404): User to toggle status not found with id = {Id}", id);
                return NotFound();
            }

            _logger.LogInformation("API Response (200): Status toggled for User with id = {Id}", id);
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

    [HttpPost("sync")]
    public async Task<ActionResult<UserDto>> SyncUser([FromBody] CreatingUserDto userDto)
    {
        _logger.LogInformation("API Request: Sync user with email = {Email}", userDto.Email);

        try
        {
            if (string.IsNullOrWhiteSpace(userDto.Email))
                return BadRequest("Email is required");
            
            var existing = await _service.TryGetByEmailAsync(userDto.Email);
            if (existing != null)
            {
                _logger.LogInformation("User already exists, returning existing user");
                return Ok(existing);
            }
            
            var newUser = await _service.AddAsync(userDto);
            _logger.LogInformation("New user created successfully: {Email}", userDto.Email);
            
            try
            {
                var subject = "Ativação da Conta / Account Activation";
                var message = ActivationEmailTemplate.Build(userDto.Name, userDto.Email);

                await _emailSender.SendEmailAsync(userDto.Email!, subject, message);
                _logger.LogInformation("Activation email sent to {Email}", userDto.Email);
            }
            catch (Exception mailEx)
            {
                _logger.LogError(mailEx, "Failed to send activation email to {Email}", userDto.Email);
            }

            return CreatedAtAction(nameof(GetByEmail), new { email = userDto.Email }, newUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API Error: Failed to sync user {Email}", userDto.Email);
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    
    [HttpPut("activate")]
    public async Task<IActionResult> ActivateUser([FromQuery] string email)
    {
        _logger.LogInformation("Activation request received for {Email}", email);

        var user = await _service.TryGetByEmailAsync(email);
        if (user == null)
            return NotFound("User not found");

        if (user.IsActive)
            return Ok("User is already active");

        await _service.ActivateUserAsync(new UserId(user.Id));

        return Ok("Account activated successfully");
    }

    
    [HttpPut("eliminate")]
    public async Task<IActionResult> EliminateUser([FromQuery] string email)
    {
        _logger.LogInformation("Elimination request received for {Email}", email);

        var user = await _service.TryGetByEmailAsync(email);
        if (user == null)
            return NotFound("User not found");

        if (user.Eliminated)
            return Ok("User is already eliminated");

        await _service.EliminateUserAsync(new UserId(user.Id));

        return Ok("Account eliminated successfully");
    }
}