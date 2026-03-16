using CvIa.Application;
using CvIa.Application.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace CvIa.Api.Controllers;

[ApiController]
[Route("api/v1/chat/completions")]
public sealed class ChatController(IChatCompletionService chatCompletionService, ILogger<ChatController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ChatResponseDto>> Complete(
        [FromBody] ChatRequestDto request,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            return BadRequest(new ErrorResponse("invalid_request", "Request body is required."));
        }

        if (request.Lang is not ("en" or "es"))
        {
            logger.LogWarning("Invalid lang value on POST /api/v1/chat/completions: {Lang}", request.Lang);
            return BadRequest(new ErrorResponse("invalid_request", "The 'lang' field must be 'en' or 'es'."));
        }

        if (request.Messages is null || request.Messages.Count == 0)
        {
            return BadRequest(new ErrorResponse("invalid_request", "The 'messages' field must contain at least one message."));
        }

        logger.LogInformation("Processing chat completion request with {MessageCount} message(s)", request.Messages.Count);
        var response = await chatCompletionService.CompleteAsync(request, cancellationToken);
        return Ok(response);
    }
}

