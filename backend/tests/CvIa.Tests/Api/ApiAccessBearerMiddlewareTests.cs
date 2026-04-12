using CvIa.Api.Middleware;
using Xunit;

namespace CvIa.Tests.Api;

public sealed class ApiAccessBearerMiddlewareTests
{
    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("Basic xyz", null)]
    [InlineData("Bearer", null)]
    [InlineData("Bearer ", "")]
    [InlineData("bearer abc", "abc")]
    [InlineData("Bearer secret-token", "secret-token")]
    public void ExtractBearerToken_ShouldParse(string? header, string? expected)
    {
        var actual = ApiAccessBearerMiddleware.ExtractBearerToken(header);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void ConstantTimeTokenEquals_ShouldMatchWhenEqual()
    {
        Assert.True(ApiAccessBearerMiddleware.ConstantTimeTokenEquals("same", "same"));
    }

    [Fact]
    public void ConstantTimeTokenEquals_ShouldRejectNullOrDifferent()
    {
        Assert.False(ApiAccessBearerMiddleware.ConstantTimeTokenEquals("a", null!));
        Assert.False(ApiAccessBearerMiddleware.ConstantTimeTokenEquals("a", "b"));
    }
}
