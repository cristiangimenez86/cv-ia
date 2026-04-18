using System.Data;
using CvIa.Api.Models;
using CvIa.Application.Configuration;
using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CvIa.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController(
    IConfiguration configuration,
    IOptions<RagOptions> ragOptions,
    ILogger<HealthController> logger,
    RagDbContext? ragDbContext = null) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<HealthResponse>> GetHealth()
    {
        var serviceName = configuration["SERVICE_NAME"] ?? "cv-ia-backend";
        var now = DateTimeOffset.UtcNow;

        if (ragOptions.Value.Enabled && !await IsRagDatabaseReachableAsync(serviceName))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new HealthResponse("unhealthy", serviceName, now));
        }

        logger.LogInformation("Health endpoint requested for service {Service}", serviceName);
        return Ok(new HealthResponse("healthy", serviceName, now));
    }

    private async Task<bool> IsRagDatabaseReachableAsync(string serviceName)
    {
        if (ragDbContext is null)
        {
            logger.LogWarning("Health check failed for {Service}: RAG enabled but no database configured", serviceName);
            return false;
        }

        var connection = ragDbContext.Database.GetDbConnection();
        var openedHere = false;

        try
        {
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync(HttpContext.RequestAborted);
                openedHere = true;
            }

            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Health check failed for {Service}: PostgreSQL unreachable", serviceName);
            return false;
        }
        finally
        {
            if (openedHere)
            {
                ragDbContext.Database.CloseConnection();
            }
        }
    }
}
