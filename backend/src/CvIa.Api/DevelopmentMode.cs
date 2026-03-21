using CvIa.Application.Configuration;

namespace CvIa.Api
{
    public static class DevelopmentMode
    {
        /// <summary>
        /// In Development, logs a safe summary when live OpenAI is configured (key prefix only, never the secret).
        /// </summary>
        public static void LogOpenAiDevelopmentSummary(IHostEnvironment environment, IConfiguration configuration, ILogger logger)
        {
            if (!environment.IsDevelopment())
            {
                return;
            }

            var options = configuration.GetSection(OpenAiChatOptions.SectionName).Get<OpenAiChatOptions>();
            if (options is null)
            {
                return;
            }

            var usingLiveOpenAi = !options.UseStubChatService && !string.IsNullOrWhiteSpace(options.ApiKey);
            if (!usingLiveOpenAi)
            {
                return;
            }

            var key = options.ApiKey!.Trim();
            var keyPrefixForLog = key.Length >= 10 ? key[..10] : key;

            logger.LogInformation(
                "OpenAI config (dev): key prefix={KeyPrefix}…, projectId set={HasProjectId}, orgId set={HasOrgId}, stub={UseStub}",
                keyPrefixForLog,
                !string.IsNullOrWhiteSpace(options.OpenAiProjectId),
                !string.IsNullOrWhiteSpace(options.OpenAiOrganizationId),
                options.UseStubChatService);
        }
    }
}
