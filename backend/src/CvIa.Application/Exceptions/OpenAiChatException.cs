using CvIa.Application.Contracts;

namespace CvIa.Application.Exceptions;

/// <summary>
/// Thrown when the chat completion pipeline fails in a way that should return a specific HTTP status and <see cref="ErrorResponse"/>.
/// </summary>
public sealed class OpenAiChatException : Exception
{
    public int StatusCode { get; }

    public ErrorResponse Error { get; }

    public OpenAiChatException(int statusCode, ErrorResponse error, Exception? innerException = null)
        : base(error.Message, innerException)
    {
        StatusCode = statusCode;
        Error = error;
    }
}
