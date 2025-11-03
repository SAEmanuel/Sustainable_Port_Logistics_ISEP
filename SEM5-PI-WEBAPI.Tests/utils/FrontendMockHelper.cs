using Microsoft.AspNetCore.Mvc;
using SEM5_PI_WEBAPI.utils;

namespace SEM5_PI_WEBAPI.Tests.utils;

public static class FrontendMockHelper
{
    public static IResponsesToFrontend MockFrontend()
    {
        var mock = new Moq.Mock<IResponsesToFrontend>();

        mock.Setup(m => m.ProblemResponse(
                Moq.It.IsAny<string>(),
                Moq.It.IsAny<string>(),
                Moq.It.IsAny<int>()))
            .Returns((string title, string detail, int status) =>
                new ObjectResult(new { title, detail, status }) { StatusCode = status });

        return mock.Object;
    }
}