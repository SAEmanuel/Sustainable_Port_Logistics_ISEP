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

    
    [HttpGet("daily/optimal")]
    public async Task<IActionResult> GetDailyScheduleOptimal([FromQuery] DateOnly day)
    {
        try
        {
            var schedule = await _schedulingService.ComputeDailyScheduleAsync(day);
            var prologResponse = await _schedulingService.SendScheduleToPrologOptimal(schedule);

            return Ok(new
            {
                algorithm = "optimal",
                schedule,
                prolog = prologResponse
            });
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

   
    [HttpGet("daily/greedy")]
    public async Task<IActionResult> GetDailyScheduleGreedy([FromQuery] DateOnly day)
    {
        try
        {
            var schedule = await _schedulingService.ComputeDailyScheduleAsync(day);
            var prologResponse = await _schedulingService.SendScheduleToPrologGreedy(schedule);

            return Ok(new
            {
                algorithm = "greedy",
                schedule,
                prolog = prologResponse
            });
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    
    [HttpGet("daily/local-search")]
    public async Task<IActionResult> GetDailyScheduleLocalSearch([FromQuery] DateOnly day)
    {
        try
        {
            var schedule = await _schedulingService.ComputeDailyScheduleAsync(day);
            var prologResponse = await _schedulingService.SendScheduleToPrologLocalSearch(schedule);

            return Ok(new
            {
                algorithm = "local_search",
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
