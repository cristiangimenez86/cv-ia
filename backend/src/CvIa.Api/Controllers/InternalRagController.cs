using CvIa.Api.Models;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
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
            return ServiceUnavailable("rag_ingestion_not_configured", "RAG ingestion is not configured.");
        }

        if (!HasValidIngestionKey(options.IngestionApiKey))
        {
            return Unauthorized(new ErrorResponse("rag_ingestion_unauthorized", "Missing or invalid ingestion key."));
        }

        if (!gate.TryEnter())
        {
            return Conflict(new ErrorResponse("rag_ingestion_in_progress", "Another ingestion is already running."));
        }

        try
        {
            return await RunReindexAsync(body, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "RAG ingestion is not available");
            return ServiceUnavailable("rag_ingestion_unavailable", ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse("rag_invalid_request", ex.Message));
        }
        finally
        {
            gate.Exit();
        }
    }

    private async Task<IActionResult> RunReindexAsync(ReindexRequestDto? body, CancellationToken cancellationToken)
    {
        var mode = ParseMode(body?.Mode);
        var request = new RagReindexRequest(mode, body?.SourceIds);
        var result = await ingestionService.ReindexAsync(request, cancellationToken);

        logger.LogInformation(
            "RAG reindex done: mode={Mode} sources={Sources}",
            mode,
            body?.SourceIds is null ? "*" : string.Join(",", body.SourceIds));

        return Ok(new
        {
            mode = mode.ToString().ToLowerInvariant(),
            chunksWrittenBySource = result.ChunksWrittenBySource,
            durationMs = (long)result.Duration.TotalMilliseconds
        });
    }

    private bool HasValidIngestionKey(string expected) =>
        Request.Headers.TryGetValue(ApiConstants.RagIngestionKeyHeader, out var provided) &&
        string.Equals(provided.ToString(), expected, StringComparison.Ordinal);

    private static RagIngestionMode ParseMode(string? raw)
    {
        var mode = (raw ?? "incremental").Trim().ToLowerInvariant();
        return mode switch
        {
            "incremental" => RagIngestionMode.Incremental,
            "full" => RagIngestionMode.Full,
            _ => throw new ArgumentException("mode must be 'incremental' or 'full'")
        };
    }

    private ObjectResult ServiceUnavailable(string code, string message) =>
        StatusCode(StatusCodes.Status503ServiceUnavailable, new ErrorResponse(code, message));
}
