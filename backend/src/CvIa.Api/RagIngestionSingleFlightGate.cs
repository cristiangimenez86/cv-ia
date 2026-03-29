namespace CvIa.Api;

public sealed class RagIngestionSingleFlightGate : IAsyncDisposable
{
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public bool TryEnter() => _semaphore.Wait(0);

    public void Exit() => _semaphore.Release();

    public ValueTask DisposeAsync()
    {
        _semaphore.Dispose();
        return ValueTask.CompletedTask;
    }
}

