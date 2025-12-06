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
    private readonly IResponsesToFrontend _responsesToFrontend;
    
    public DataRigthsRequestController(IDataRightRequestService service,  IResponsesToFrontend responsesToFrontend)
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

    [HttpGet("request/all/user/{userEmail}")]
    public async Task<ActionResult<List<DataRightsRequestDto>>> AllDataRightsRequestsForUser(string userEmail)
    {
        try
        {
            var listRequestDto = await _service.GetAllDataRightsRequestsForUser(userEmail);
            return Ok(listRequestDto);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse(
                "Problem fetching DataRightsRequests for user", 
                e.Message, 
                StatusCodes.Status400BadRequest);
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

    [HttpGet("request/all/responsible/{email}")]
    public async Task<ActionResult<List<DataRightsRequestDto>>> AllDataRightsRequestsForResponsible(string email)
    {
        try
        {
            var listRequestDto = await _service.GetAllDataRightRequestsForResponsible(email);
            return Ok(listRequestDto);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse(
                "Problem fetching DataRightsRequests for responsible", 
                e.Message, 
                StatusCodes.Status400BadRequest);        }
    }

    
    [HttpPatch("assignResponsible/{requestId}")]
    public async Task<ActionResult<DataRightsRequestDto>> AssignResponsibleToRequestAsync(
        [FromRoute] string requestId,
        [FromQuery] string responsibleEmail)
    {
        try
        {
            var updatedRequestDto = await _service.AssignResponsibleToDataRightRequestAsync(requestId, responsibleEmail);
            return Ok(updatedRequestDto);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse(
                "Problem Assigning responsible to Request", 
                e.Message, 
                StatusCodes.Status400BadRequest);
        }
    }


    [HttpPatch("response/request/type/access/{requestId}")]
    public async Task<ActionResult<DataRightsRequestDto>> ResponseDataRightRequestTypeAccessAsync(string requestId)
    {
        try
        {
            var updatedRequestDto = await _service.ResponseDataRightRequestTypeAccessAsync(requestId);
            return Ok(updatedRequestDto);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse(
                "Problem responding to Access DataRightsRequest", 
                e.Message, 
                StatusCodes.Status400BadRequest);
        }
    }

    [HttpDelete("response/request/type/deletion/{requestId}")]
    public async Task<ActionResult> DeleteDataRightRequestTypeAsync([FromRoute] string requestId)
    {
        try
        {
            await _service.DeleteDataRightRequestAsync(requestId);
            return NoContent();
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse(
                "Problem deleting Data Rights Request", 
                e.Message, 
                StatusCodes.Status400BadRequest);
        }
    }

    [HttpPatch("response/request/status/retification")]
    public async Task<ActionResult<DataRightsRequestDto>> ResponseDataRightRequestStatusRetificationAsync(RectificationApplyDto dto)
    {
        try
        {
            var response = await _service.ResponseDataRightRequestTypeRectificationAsync(dto);
            return Ok(response);
        }
        catch (Exception e)
        {
            return _responsesToFrontend.ProblemResponse(
                "Problem ratification Data Rights Request", 
                e.Message, 
                StatusCodes.Status400BadRequest);
        }
    }
}