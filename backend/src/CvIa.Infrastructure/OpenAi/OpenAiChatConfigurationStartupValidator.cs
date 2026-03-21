using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.OpenAi;

/// <summary>
/// Validates OpenAI chat options once at startup when OpenAI is enabled (not stub / empty key).
/// </summary>
public sealed class OpenAiChatConfigurationStartupValidator : IHostedService
{
    private readonly IOptions<OpenAiChatOptions> _options;

    public OpenAiChatConfigurationStartupValidator(IOptions<OpenAiChatOptions> options)
    {
        _options = options;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var o = _options.Value;
        if (o.UseStubChatService || string.IsNullOrWhiteSpace(o.ApiKey))
        {
            return Task.CompletedTask;
        }

        Validate(o);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private void Validate(OpenAiChatOptions options)
    {
        var key = options.ApiKey.Trim();
        if (string.IsNullOrEmpty(key))
        {
            return;
        }

        if (key.StartsWith("sk-proj-", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(options.OpenAiProjectId))
        {
            throw new OpenAiChatException(
                StatusCodes.Status400BadRequest,
                new ErrorResponse(
                    "openai_project_required",
                    "Project API keys (sk-proj-...) require OpenAiChat:OpenAiProjectId (proj_... from OpenAI → Projects)."));
        }
    }
}
