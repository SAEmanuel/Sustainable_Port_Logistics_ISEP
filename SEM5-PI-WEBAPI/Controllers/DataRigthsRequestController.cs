using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.DataRigthsRequests;
using SEM5_PI_WEBAPI.Domain.DataRigthsRequests.DTOs;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DataRigthsRequestController : ControllerBase
{
    private readonly IDataRightRequestService _service;
    private readonly ResponsesToFrontend _responsesToFrontend;
    
    public DataRigthsRequestController(IDataRightRequestService service,  ResponsesToFrontend responsesToFrontend)
    {
        _service = service;
        _responsesToFrontend = responsesToFrontend;
    }

    // --- Users
    
    [HttpPost]
    public async Task<ActionResult<DataRightsRequestDto>> CreateDataRightsRequestAsync(DataRightsRequestDto dto)
    {
        try
        {
            var createdRequestDto = await _service.CreateDataRightRequest(dto);
            return Ok(createdRequestDto);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse("Problem Creating DataRightsRequest", e.Message, StatusCodes.Status400BadRequest);
        }
    }

    
    
    
    // ----- For Admin
    [HttpGet("requests/status/waitingforassignment")]
    public async Task<ActionResult<List<DataRightsRequestDto>>> WaitingForAssignment()
    {
        try
        {
            var listRequests = await _service.GetAllDataRightRequestsWithStatusWaitingForAssignment();
            return Ok(listRequests);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse("Problem", e.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpPatch("assignResponsible/{email}")]
    public async Task<ActionResult<DataRightsRequestDto>> AssignResponsibleToRequestAsync(string requestId,
        string responsibleEmail)
    {
        try
        {
            var updatedRequestDto = await _service.AssignResponsibleToDataRightRequestAsync(requestId, responsibleEmail);
            return Ok(updatedRequestDto);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse("Problem Assigning resposible to Request", e.Message, StatusCodes.Status400BadRequest);
        }
    }
    
}