using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.OpenAi;

/// <summary>
/// Validates OpenAI chat options once at startup when OpenAI is enabled (not stub / empty key).
/// Fails fast with an <see cref="OpenAiChatException"/> when a project key is missing the required project id.
/// </summary>
public sealed class OpenAiChatConfigurationStartupValidator(IOptions<OpenAiChatOptions> options) : IHostedService
{
    private const string ProjectKeyPrefix = "sk-proj-";

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var snapshot = options.Value;
        if (!ShouldValidate(snapshot))
        {
            return Task.CompletedTask;
        }

        EnsureProjectIdForProjectKey(snapshot);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static bool ShouldValidate(OpenAiChatOptions options) =>
        !options.UseStubChatService && !string.IsNullOrWhiteSpace(options.ApiKey);

    private static void EnsureProjectIdForProjectKey(OpenAiChatOptions options)
    {
        var key = options.ApiKey.Trim();
        var isProjectKey = key.StartsWith(ProjectKeyPrefix, StringComparison.OrdinalIgnoreCase);
        if (!isProjectKey || !string.IsNullOrWhiteSpace(options.OpenAiProjectId))
        {
            return;
        }

        throw new OpenAiChatException(
            StatusCodes.Status400BadRequest,
            new ErrorResponse(
                "openai_project_required",
                "Project API keys (sk-proj-...) require OpenAiChat:OpenAiProjectId (proj_... from OpenAI → Projects)."));
    }
}
