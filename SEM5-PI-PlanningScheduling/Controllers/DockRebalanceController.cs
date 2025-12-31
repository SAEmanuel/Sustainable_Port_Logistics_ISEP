using Microsoft.AspNetCore.Mvc;
using SEM5_PI_DecisionEngineAPI.DTOs;
using SEM5_PI_DecisionEngineAPI.Exceptions;
using SEM5_PI_DecisionEngineAPI.Services;

namespace SEM5_PI_DecisionEngineAPI.Controllers;

[ApiController]
[Route("api/rebalance/docks")]
public class DockRebalanceController : ControllerBase
{
    private readonly SchedulingService _schedulingService;

    public DockRebalanceController(SchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
    }


    [HttpGet("candidates")]
    public async Task<ActionResult<List<DockRebalanceCandidateDto>>> GetCandidates(
        [FromQuery] DateOnly day)
    {
        try
        {
            var result = await _schedulingService
                .BuildDockRebalanceCandidatesAsync(day);

            return Ok(result);
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }


    [HttpGet("plan")]
    public async Task<ActionResult<DockRebalanceResultDto>> GetRebalancePlan(
        [FromQuery] DateOnly day)
    {
        try
        {
            var result = await _schedulingService
                .BuildDockRebalancePlanAsync(day);

            return Ok(result);
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
}