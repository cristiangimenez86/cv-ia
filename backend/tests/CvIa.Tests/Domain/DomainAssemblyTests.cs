using Xunit;

namespace CvIa.Tests.Domain;

public sealed class DomainAssemblyTests
{
    [Fact]
    public void DomainAssembly_ShouldLoad()
    {
        var assembly = typeof(CvIa.Domain.AssemblyMarker).Assembly;
        Assert.NotNull(assembly);
    }
}

