namespace CvIa.Tests.Infrastructure.OpenAiChat;

internal static class OpenAiChatCompletionServiceSampleBodies
{
    internal const string SuccessfulChatCompletion =
        """
        {"id":"chatcmpl_test","created":1700000000,"choices":[{"message":{"role":"assistant","content":"Hello from CV"}}]}
        """;

    internal const string ErrorMissingScopes =
        """
        {"error":{"message":"Missing scopes: model.request","type":"invalid_request_error"}}
        """;

    internal const string ErrorInsufficientPermissionsModelRequest =
        """
        {"error":{"message":"You have insufficient permissions for this operation. Missing scopes: model.request","type":"invalid_request_error"}}
        """;
}
