using System.Data;
using CvIa.Api.Models;
using CvIa.Application.Configuration;
using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CvIa.Api.Controllers;

[ApiController]
[Route("")]
public sealed class HealthController(
    IConfiguration configuration,
    IOptions<RagOptions> ragOptions,
    ILogger<HealthController> logger,
    RagDbContext? ragDbContext = null) : ControllerBase
{
    [HttpGet("health")]
    public async Task<ActionResult<HealthResponse>> GetHealth()
    {
        var serviceName = configuration["SERVICE_NAME"] ?? "cv-ia-backend";
        var now = DateTimeOffset.UtcNow;

        if (ragOptions.Value.Enabled)
        {
            if (ragDbContext is null)
            {
                logger.LogWarning("Health check failed: RAG enabled but no database configured");
                return StatusCode(503, new HealthResponse("unhealthy", serviceName, now));
            }

            try
            {
                var conn = ragDbContext.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open)
                {
                    await conn.OpenAsync(HttpContext.RequestAborted);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Health check failed: PostgreSQL unreachable");
                return StatusCode(503, new HealthResponse("unhealthy", serviceName, now));
            }
            finally
            {
                ragDbContext.Database.CloseConnection();
            }
        }

        logger.LogInformation("Health endpoint requested for service {Service}", serviceName);
        return Ok(new HealthResponse("healthy", serviceName, now));
    }
}
