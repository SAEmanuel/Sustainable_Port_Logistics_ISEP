using Microsoft.AspNetCore.Mvc;
using SEM5_PI_DecisionEngineAPI.Services;

namespace SEM5_PI_DecisionEngineAPI.Controllers;

[ApiController]
[Route("api/schedule")]
public class ScheduleController : ControllerBase
{
    private readonly PrologClient _prologClient;
    private readonly DockServiceClient _dockClient;
    private readonly StaffMemberServiceClient _staffMemberServiceClient;
    private readonly VesselServiceClient _vesselServiceClient;
    private readonly PhysicalResourceServiceClient _physicalResourceServiceClient;
    private readonly VesselVisitNotificationServiceClient _vesselVisitNotificationServiceClient;


    public ScheduleController(PrologClient prologClient ,DockServiceClient dockClient,
        StaffMemberServiceClient staffMemberServiceClient,
        VesselServiceClient vesselServiceClient,
        PhysicalResourceServiceClient physicalResourceServiceClient,
        VesselVisitNotificationServiceClient vesselVisitNotificationServiceClient)
    {
        _prologClient = prologClient;
        _dockClient = dockClient;
        _staffMemberServiceClient = staffMemberServiceClient;
        _vesselServiceClient = vesselServiceClient;
        _physicalResourceServiceClient = physicalResourceServiceClient;
        _vesselVisitNotificationServiceClient = vesselVisitNotificationServiceClient;
    }

    [HttpGet("assign-dock")]
    public async Task<IActionResult> AssignDock()
    {
        var docks = await _dockClient.GetAvailableDocksAsync();

        // Prolog 
        return Ok(docks);
    }
    
    [HttpGet("check-staff")]
    public async Task<IActionResult> CheckStaff([FromQuery(Name = "codes")] List<string> qualificationCodes)
    {
        var staff = await _staffMemberServiceClient.GetStaffWithQualifications(qualificationCodes);
        //Prolog
        return Ok(staff);
    }
    
    [HttpGet("vessel-details")]
    public async Task<IActionResult> VesselDetails(string imo)
    {
        var vessel = await _vesselServiceClient.GetVesselByImo(imo);

        // Prolog 
        return Ok(vessel);
    }
    
    [HttpGet("physicalResource-details")]
    public async Task<IActionResult> PhysicalResourceDetails(string code)
    {
        var resource = await _physicalResourceServiceClient.GetPhysicalResourceByCode(code);
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
    
    [HttpGet("all-vvn")]
    public async Task<IActionResult> GetVvns()
    {
        var docks = await _vesselVisitNotificationServiceClient.GetVisitNotifications();

        // Prolog 
        return Ok(docks);
    }
}