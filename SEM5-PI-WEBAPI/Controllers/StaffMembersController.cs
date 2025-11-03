using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class StaffMembersController : ControllerBase
{
    private readonly IStaffMemberService _service;
    private readonly ILogger<StaffMembersController> _logger;

    public StaffMembersController(IStaffMemberService service, ILogger<StaffMembersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StaffMemberDto>>> GetAll()
    {
        _logger.LogInformation("API Request: Get all Staff Members");
        var list = await _service.GetAllAsync();
        _logger.LogInformation("API Response (200): Returning {Count} Staff Members", list.Count);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StaffMemberDto>> GetById(Guid id)
    {
        _logger.LogInformation("API Request: Get Staff Member by ID = {Id}", id);
        try
        {
            var staff = await _service.GetByIdAsync(new StaffMemberId(id));
            if (staff == null)
            {
                _logger.LogWarning("API Response (404): Staff Member with ID = {Id} not found", id);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Staff Member with ID = {Id} found", id);
            return Ok(staff);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): Failed to get Staff Member with ID = {Id}. Reason: {Message}", id, ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("by-qualifications")]
    public async Task<ActionResult<List<StaffMemberDto>>> GetByQualifications([FromQuery(Name = "codes")] List<string> qualificationCodes)
    {
        _logger.LogInformation("API Request: Get Staff Members by Qualification Codes");
        try
        {
            if (qualificationCodes == null || !qualificationCodes.Any())
            {
                _logger.LogWarning("API Response (400): No qualification codes provided");
                return BadRequest("At least one qualification code must be provided.");
            }
            var staffList = await _service.GetByQualificationsAsync(qualificationCodes);
            _logger.LogInformation("API Response (200): Returning {Count} Staff Members for provided qualifications", staffList.Count);
            return Ok(staffList);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("by-exact-qualifications")]
    public async Task<ActionResult<List<StaffMemberDto>>> GetByAllQualifications([FromQuery(Name = "codes")] List<string> qualificationCodes)
    {
        _logger.LogInformation("API Request: Get Staff Members by Exact Qualification Codes");
        try
        {
            if (qualificationCodes == null || !qualificationCodes.Any())
            {
                _logger.LogWarning("API Response (400): No exact qualification codes provided");
                return BadRequest("At least one qualification code must be provided.");
            }
            var staffList = await _service.GetByExactQualificationsAsync(qualificationCodes);
            _logger.LogInformation("API Response (200): Returning {Count} Staff Members for provided exact qualifications", staffList.Count);
            return Ok(staffList);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("mec/{mec}")]
    public async Task<ActionResult<StaffMemberDto>> GetByMecanographicNumber(string mec)
    {
        _logger.LogInformation("API Request: Get Staff Member by Mecanographic Number = {Mec}", mec);
        try
        {
            var staff = await _service.GetByMecNumberAsync(mec);
            if (staff == null)
            {
                _logger.LogWarning("API Response (404): Staff Member with Mecanographic Number = {Mec} not found", mec);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Staff Member with Mecanographic Number = {Mec} found", mec);
            return Ok(staff);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("name/{name}")]
    public async Task<ActionResult<List<StaffMemberDto>>> GetByName(string name)
    {
        _logger.LogInformation("API Request: Get Staff Members by Name = {Name}", name);
        try
        {
            var staff = await _service.GetByNameAsync(name);
            if (staff == null || staff.Count == 0)
            {
                _logger.LogWarning("API Response (404): No Staff Members found with Name = {Name}", name);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Returning {Count} Staff Members with Name = {Name}", staff.Count, name);
            return Ok(staff);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<StaffMemberDto>>> GetByStatus(bool status)
    {
        _logger.LogInformation("API Request: Get Staff Members by Status = {Status}", status);
        try
        {
            var staffList = await _service.GetByStatusAsync(status);
            _logger.LogInformation("API Response (200): Returning {Count} Staff Members with Status = {Status}", staffList.Count, status);
            return Ok(staffList);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<StaffMemberDto>> Create(CreatingStaffMemberDto dto)
    {
        _logger.LogInformation("API Request: Create new Staff Member with data {@Dto}", dto);
        try
        {
            var staff = await _service.AddAsync(dto);
            _logger.LogInformation("API Response (201): Staff Member created with ID = {Id}", staff.Id);
            return CreatedAtAction(nameof(GetById), new { id = staff.Id }, staff);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("update/")]
    public async Task<ActionResult<StaffMemberDto>> Update(UpdateStaffMemberDto dto)
    {
        _logger.LogInformation("API Request: Update Staff Member with data {@Dto}", dto);
        try
        {
            var updatedStaff = await _service.UpdateAsync(dto);
            if (updatedStaff == null)
            {
                _logger.LogWarning("API Response (404): Staff Member to update not found with Mecanographic Number = {MecNumber}", dto.MecNumber);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Staff Member updated with Mecanographic Number = {MecNumber}", dto.MecNumber);
            return Ok(updatedStaff);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("toggle/{mec}")]
    public async Task<ActionResult<StaffMemberDto>> ToggleStatus(string mec)
    {
        _logger.LogInformation("API Request: Toggle status of Staff Member with Mecanographic Number = {Mec}", mec);
        try
        {
            var updatedStaff = await _service.ToggleAsync(mec);
            if (updatedStaff == null)
            {
                _logger.LogWarning("API Response (404): Staff Member to toggle status not found with Mecanographic Number = {Mec}", mec);
                return NotFound();
            }
            _logger.LogInformation("API Response (200): Status toggled for Staff Member with Mecanographic Number = {Mec}", mec);
            return Ok(updatedStaff);
        }
        catch (BusinessRuleValidationException ex)
        {
            _logger.LogWarning("API Error (400): {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
    }
}
