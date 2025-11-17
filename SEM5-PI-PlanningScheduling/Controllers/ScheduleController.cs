using Microsoft.AspNetCore.Mvc;
using SEM5_PI_DecisionEngineAPI.Exceptions;
using SEM5_PI_DecisionEngineAPI.Services;

namespace SEM5_PI_DecisionEngineAPI.Controllers;

[ApiController]
[Route("api/schedule")]
public class ScheduleController : ControllerBase
{
    private readonly SchedulingService _schedulingService;

    public ScheduleController(SchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailySchedule([FromQuery] DateOnly day)
    {
        try
        {
            var result = await _schedulingService.ComputeDailyScheduleAsync(day);
            return Ok(result);
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
}