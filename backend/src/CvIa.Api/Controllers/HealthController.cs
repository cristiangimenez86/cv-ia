using Microsoft.AspNetCore.Mvc;

namespace CvIa.Api.Controllers;

[ApiController]
[Route("")]
public sealed class HealthController(IConfiguration configuration, ILogger<HealthController> logger) : ControllerBase
{
    [HttpGet("health")]
    public ActionResult<HealthResponse> GetHealth()
    {
        var serviceName = configuration["SERVICE_NAME"] ?? "cv-ia-backend";
        var response = new HealthResponse("healthy", serviceName, DateTimeOffset.UtcNow);
        logger.LogInformation("Health endpoint requested for service {Service}", serviceName);
        return Ok(response);
    }
}

public sealed record HealthResponse(string Status, string Service, DateTimeOffset TimestampUtc);
