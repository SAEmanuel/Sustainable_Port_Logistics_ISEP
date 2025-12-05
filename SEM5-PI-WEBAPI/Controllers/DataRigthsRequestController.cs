using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.Domain.DataRigthsRequests;
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
    
    
    
    
}