using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies.DTOs;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrivacyPolicyController: ControllerBase
{
    private readonly IPrivacyPolicyService _privacyPolicyService;
    private readonly IResponsesToFrontend _refrontend;
    
    public PrivacyPolicyController(IPrivacyPolicyService privacyPolicyService,IResponsesToFrontend refrontend)
    {
        _privacyPolicyService = privacyPolicyService;
        _refrontend = refrontend;
    }


    [HttpGet]
    public async Task<ActionResult<List<PrivacyPolicyDto>>> GetPrivacyPolicyAsync()
    {
        try
        {
            var listPolicies = await _privacyPolicyService.GetAllPrivacyPolicies();
            return Ok(listPolicies);
        }
        catch (Exception e)
        {
            return _refrontend.ProblemResponse("Not Found", e.Message, 404);
        }
    }


    [HttpPost]
    public async Task<ActionResult<PrivacyPolicyDto>> CreatePrivacyPolicyAsync(CreatePrivacyPolicyDto dto)
    {
        try
        {
            var createdDto = await _privacyPolicyService.CreatePrivacyPolicy(dto);
            return Ok(createdDto);
        }
        catch (Exception e)
        {
            return _refrontend.ProblemResponse("Validation Error", e.Message, 400);
        }
    }
}