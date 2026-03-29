using CvIa.Api;
using CvIa.Api.Models;
using CvIa.Application.Configuration;
using CvIa.Application.Rag;
using CvIa.Domain.Rag;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CvIa.Api.Controllers;

[ApiController]
[Route("internal/v1/rag")]
public sealed class InternalRagController(
    IOptions<RagOptions> ragOptions,
    RagIngestionSingleFlightGate gate,
    IRagIngestionService ingestionService,
    ILogger<InternalRagController> logger) : ControllerBase
{
    [HttpPost("reindex")]
    public async Task<IActionResult> Reindex([FromBody] ReindexRequestDto? body, CancellationToken cancellationToken)
    {
        var options = ragOptions.Value;
        if (string.IsNullOrWhiteSpace(options.IngestionApiKey))
        {
            return StatusCode(503, new { code = "rag_ingestion_not_configured" });
        }

        if (!Request.Headers.TryGetValue("X-Rag-Ingestion-Key", out var provided) ||
            !string.Equals(provided.ToString(), options.IngestionApiKey, StringComparison.Ordinal))
        {
            return Unauthorized(new { code = "rag_ingestion_unauthorized" });
        }

        if (!gate.TryEnter())
        {
            return Conflict(new { code = "rag_ingestion_in_progress" });
        }

        try
        {
            var mode = (body?.Mode ?? "incremental").Trim().ToLowerInvariant();
            var parsedMode = mode switch
            {
                "incremental" => RagIngestionMode.Incremental,
                "full" => RagIngestionMode.Full,
                _ => throw new ArgumentException("mode must be 'incremental' or 'full'")
            };

            var request = new RagReindexRequest(parsedMode, body?.SourceIds);
            var result = await ingestionService.ReindexAsync(request, cancellationToken);

            logger.LogInformation("RAG reindex done: mode={Mode} sources={Sources}", parsedMode, body?.SourceIds is null ? "*" : string.Join(",", body.SourceIds));

            return Ok(new
            {
                mode = parsedMode.ToString().ToLowerInvariant(),
                chunksWrittenBySource = result.ChunksWrittenBySource,
                durationMs = (long)result.Duration.TotalMilliseconds
            });
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "RAG ingestion is not available");
            return StatusCode(503, new { code = "rag_ingestion_unavailable", message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { code = "rag_invalid_request", message = ex.Message });
        }
        finally
        {
            gate.Exit();
        }
    }
}
