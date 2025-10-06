using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;
using SEM5_PI_WEBAPI.Domain.StaffMembers.DTOs;

namespace SEM5_PI_WEBAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class StaffMembersController : ControllerBase
{
    private readonly StaffMemberService _service;

    public StaffMembersController(StaffMemberService serivce)
    {
        _service = serivce;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StaffMemberDto>>> GetAll()
    {
        return await _service.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StaffMemberDto>> GetById(Guid id)
    {
        var staff = await _service.GetByIdAsync(new StaffMemberId(id));

        if (staff == null)
        {
            return NotFound();
        }

        return staff;
    }
    
    [HttpGet("mec/{mec}")]
    public async Task<ActionResult<StaffMemberDto>> GetByMecanographicNumber(string mec)
    {
        var staff = await _service.GetByMecNumberAsync(mec);
        if (staff == null)
            return NotFound();
        return Ok(staff);
    }
    
    [HttpGet("name/{name}")]
    public async Task<ActionResult<StaffMemberDto>> GetByName(string name)
    {
        var staff = await _service.GetByNameAsync(name);
        if (staff == null)
            return NotFound();
        return Ok(staff);
    }
    
    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<StaffMemberDto>>> GetByStatus(bool status)
    {
        var staffList = await _service.GetByStatusAsync(status);
        return Ok(staffList);
    }

    [HttpPost]
    public async Task<ActionResult<StaffMemberDto>> Create(CreatingStaffMemberDto dto)
    {
        try
        {
            var staff = await _service.AddAsync(dto);

            return CreatedAtAction(nameof(GetById), new { id = staff.Id }, staff);
        }
        catch (BusinessRuleValidationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
    
    [HttpPatch("{id}")]
    public async Task<ActionResult<StaffMemberDto>> Update(Guid id, UpdateStaffMemberDto dto)
    {
        var updatedStaff = await _service.UpdateAsync(new StaffMemberId(id), dto);
        if (updatedStaff == null)
            return NotFound();
        return Ok(updatedStaff);
    }
    
    [HttpPatch("{id}/toggle")]
    public async Task<ActionResult<StaffMemberDto>> ToggleStatus(Guid id)
    {
        var updatedStaff = await _service.ToggleAsync(new StaffMemberId(id));
        if (updatedStaff == null)
            return NotFound();
        return Ok(updatedStaff);
    }
    
    
}