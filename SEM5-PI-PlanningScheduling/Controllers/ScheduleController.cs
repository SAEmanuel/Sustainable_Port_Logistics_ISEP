using Microsoft.AspNetCore.Mvc;
using SEM5_PI_DecisionEngineAPI.Exceptions;
using SEM5_PI_DecisionEngineAPI.Services;

namespace SEM5_PI_DecisionEngineAPI.Controllers;

[ApiController]
[Route("api/schedule")]
public class ScheduleController : ControllerBase
{
    private readonly SchedulingService _schedulingService;
    private readonly PhysicalResourceServiceClient _physicalResourceService;
    private readonly PrologClient _prologClient;

    public ScheduleController(SchedulingService schedulingService, 
        PhysicalResourceServiceClient physicalResourceService,
        PrologClient prologClient)
    {
        _schedulingService = schedulingService;
        _physicalResourceService = physicalResourceService;
        _prologClient = prologClient;
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
    
    [HttpGet("physicalResource-details")]
    public async Task<IActionResult> PhysicalResourceDetails(string code)
    {
        var vessel = await _physicalResourceService.GetPhysicalResourceByCode(code);
        var resource = await _physicalResourceService.GetPhysicalResourceByCode(code);
        if (resource == null)
            return NotFound("Physical resource not found");
        
        var prologResponse = await _prologClient.SendToPrologAsync<object>(
            "/process_resource",
            resource
        );

        return Ok(new {
            sentToProlog = resource,
            prologReturned = prologResponse
        });
    }
}