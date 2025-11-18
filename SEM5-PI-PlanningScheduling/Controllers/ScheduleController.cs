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
            var schedule = await _schedulingService.ComputeDailyScheduleAsync(day);
            
            var prologResponse = await _schedulingService.SendScheduleToProlog(schedule);

            return Ok(new
            {
                schedule,
                prolog = prologResponse
            });
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
}