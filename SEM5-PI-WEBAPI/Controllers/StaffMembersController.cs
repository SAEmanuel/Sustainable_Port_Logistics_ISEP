using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.StaffMembers;

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
}