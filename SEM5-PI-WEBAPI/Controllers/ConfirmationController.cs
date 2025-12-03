using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs;
using SEM5_PI_WEBAPI.Domain.ConfirmationsUserReadPPs.DTOs;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfirmationController: ControllerBase
{
    private readonly IConfirmationService  _confirmationService;
    private readonly IResponsesToFrontend _refrontend;

    public ConfirmationController(IConfirmationService confirmationService, IResponsesToFrontend refrontend)
    {
        _confirmationService = confirmationService;
        _refrontend = refrontend;
    }

    [HttpGet("user/email/{email}")]
    public async Task<ActionResult<ConfirmationDto>> GetConfirmationByUserEmail(string email)
    {
        try
        {
            var confirmationByUser = await _confirmationService.GetConfirmationByUserEmailAsync(email);
            return Ok(confirmationByUser);
        }
        catch (Exception ex)
        {
            return _refrontend.ProblemResponse("Not Found", ex.Message, 404);
        }
    }

    [HttpPatch("confirmation/accept/pp/user/email/{email}")]
    public async Task<ActionResult<ConfirmationDto>> AcceptPrivacyPolicyConfirmation(string email)
    {
        try
        {
            var confirmationDto = await _confirmationService.AcceptConfirmationAsync(email);
            return Ok(confirmationDto);
        }
        catch (Exception e)
        {                
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);

        }
    }


    [HttpPatch("confirmation/reject/pp/user/email/{email}")]
    public async Task<ActionResult<ConfirmationDto>> RejectPrivacyPolicyConfirmation(string email)
    {
        try
        {
            var confirmationDto = await _confirmationService.RejectConfirmationAsync(email);
            return Ok(confirmationDto);
        }
        catch (Exception e)
        {
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }

    }
}