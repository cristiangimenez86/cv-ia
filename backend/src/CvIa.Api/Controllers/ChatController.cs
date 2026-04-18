using CvIa.Application;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CvIa.Api.Controllers;

[ApiController]
[Route("api/v1/chat/completions")]
public sealed class ChatController(
    IChatCompletionService chatCompletionService,
    ILogger<ChatController> logger) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting(ApiConstants.ChatRateLimitPolicy)]
    public async Task<ActionResult<ChatResponseDto>> Complete([FromBody] ChatRequestDto? request, CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        logger.LogInformation("Processing chat completion request with {MessageCount} message(s)", request!.Messages.Count);

        try
        {
            var response = await chatCompletionService.CompleteAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (OpenAiChatException ex)
        {
            return StatusCode(ex.StatusCode, ex.Error);
        }
    }

    private ErrorResponse? ValidateRequest(ChatRequestDto? request)
    {
        if (request is null)
        {
            return new ErrorResponse("invalid_request", "Request body is required.");
        }

        if (SupportedLanguages.TryNormalize(request.Lang) is null)
        {
            logger.LogWarning("Invalid lang value on POST /api/v1/chat/completions: {Lang}", request.Lang);
            return new ErrorResponse("invalid_request", "The 'lang' field must be 'en' or 'es'.");
        }

        if (request.Messages is null || request.Messages.Count == 0)
        {
            return new ErrorResponse("invalid_request", "The 'messages' field must contain at least one message.");
        }

        return null;
    }
}
