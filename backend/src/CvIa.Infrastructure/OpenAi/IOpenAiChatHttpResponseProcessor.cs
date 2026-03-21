using System.Diagnostics;
using CvIa.Application.Contracts;

namespace CvIa.Infrastructure.OpenAi;

/// <summary>Maps OpenAI HTTP responses to <see cref="ChatResponseDto"/>; throws <see cref="CvIa.Application.Exceptions.OpenAiChatException"/> on provider errors or malformed success payloads.</summary>
public interface IOpenAiChatHttpResponseProcessor
{
    ChatResponseDto MapResponseOrThrow(string raw, HttpResponseMessage response, string correlationId, Stopwatch elapsed);
}
