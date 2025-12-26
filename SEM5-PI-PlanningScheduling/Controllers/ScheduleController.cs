using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SEM5_PI_DecisionEngineAPI.DTOs;
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

    [HttpGet("daily/basic")]
    public async Task<ActionResult<DailyScheduleResultDto>> GetDailySchedule([FromQuery] DateOnly day)
    {
        try
        {
            var schedule = await _schedulingService.ComputeDailyScheduleAsync(day);
            return Ok(schedule);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("daily/{algorithm}")]
    public async Task<IActionResult> GetDailySchedule(string algorithm, [FromQuery] DateOnly day)
    {
        try
        {
            var validAlgorithms = new[] { "greedy", "optimal", "local_search" };
            if (!validAlgorithms.Contains(algorithm.ToLower()))
            {
                return BadRequest(new
                    { error = $"Invalid algorithm. Supported: {string.Join(", ", validAlgorithms)}" });
            }
            
            var result = await _schedulingService.ComputeScheduleWithAlgorithmAsync(day, algorithm);

            return Ok(new
            {
                algorithm = algorithm,
                schedule = result.Schedule,
                prolog = result.Prolog
            });
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }


    [HttpGet("daily/multi-crane-comparison")]
    public async Task<ActionResult<MultiCraneComparisonResultDto>> GetMultiCraneComparison(
        [FromQuery] DateOnly day,
        [FromQuery] string algorithm = "greedy")
    {
        try
        {
            var result = await _schedulingService.ComputeDailyScheduleWithPrologComparisonAsync(day, algorithm);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    
    [HttpGet("daily/genetic")]
    public async Task<ActionResult<GeneticScheduleResultDto>> GetDailyGeneticSchedule(
        [FromQuery] DateOnly day,
        [FromQuery] int? populationSizeOverride,
        [FromQuery] int? generationsOverride,
        [FromQuery] double? mutationRateOverride,
        [FromQuery] double? crossoverRateOverride)
    {
        try
        {
            var result = await _schedulingService
                .ComputeDailyScheduleGeneticAsync(
                    day,
                    populationSizeOverride,
                    generationsOverride,
                    mutationRateOverride,
                    crossoverRateOverride
                );

            return Ok(result);
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
    
    [HttpGet("daily/smart")]
    public async Task<ActionResult<SmartScheduleResultDto>> GetSmartSchedule(
        [FromQuery] DateOnly day,
        [FromQuery] int? maxComputationSeconds)
    {
        try
        {
            var result = await _schedulingService
                .ComputeDailyScheduleSmartAsync(day, maxComputationSeconds);

            return Ok(result);
        }
        catch (PlanningSchedulingException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
}