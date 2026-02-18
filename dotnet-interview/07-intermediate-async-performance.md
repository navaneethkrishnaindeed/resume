# .NET Interview Guide - Intermediate Level
## Part 7: Async & Performance (Questions 41-80)

---

### 41. What happens when you call await?

When you `await`, the method returns control to the caller and resumes when the awaited task completes.

```csharp
public async Task<string> GetDataAsync()
{
    Console.WriteLine("1. Before await");
    
    await Task.Delay(1000);  // Returns control here
    
    Console.WriteLine("2. After await");  // Resumes here
    return "Done";
}

// What happens internally:
// 1. Method runs until await
// 2. If task not complete, captures current context
// 3. Returns incomplete Task to caller
// 4. When awaited task completes, continuation scheduled
// 5. Resumes execution after await
// 6. Returns completed Task with result
```

**State machine generated:**
```csharp
// Compiler transforms async method into state machine
[AsyncStateMachine(typeof(GetDataAsyncStateMachine))]
public Task<string> GetDataAsync()
{
    var stateMachine = new GetDataAsyncStateMachine();
    stateMachine.builder = AsyncTaskMethodBuilder<string>.Create();
    stateMachine.state = -1;
    stateMachine.builder.Start(ref stateMachine);
    return stateMachine.builder.Task;
}
```

---

### 42. What is SynchronizationContext?

`SynchronizationContext` captures the current "context" and posts continuations back to it.

```csharp
// In UI apps (WPF, WinForms)
button.Click += async (s, e) =>
{
    // On UI thread
    var data = await FetchDataAsync();
    // Back on UI thread (SynchronizationContext restored)
    label.Text = data;  // Safe to update UI
};

// ASP.NET Core has NO SynchronizationContext
// Continuations run on any thread pool thread

// Check current context
var context = SynchronizationContext.Current;
if (context == null)
{
    Console.WriteLine("No synchronization context");
}
```

**UI Thread Flow:**
```
UI Thread: [Start] → await → [returns]
                         ↓
Thread Pool:    [FetchDataAsync runs]
                         ↓
UI Thread:              [Continuation runs, UI update safe]
```

---

### 43. What is ConfigureAwait(false)?

`ConfigureAwait(false)` tells await NOT to capture and restore the SynchronizationContext.

```csharp
// In library code - don't need original context
public async Task<Data> GetDataAsync()
{
    var response = await _httpClient.GetAsync(url)
        .ConfigureAwait(false);  // Continue on any thread
    
    return await response.Content.ReadAsAsync<Data>()
        .ConfigureAwait(false);
}

// When to use:
// ✓ Library code that doesn't touch UI
// ✓ When you don't need the original context
// ✓ Performance-sensitive code

// When NOT to use:
// ✗ UI event handlers (need UI thread)
// ✗ ASP.NET Core (no SyncContext anyway)
// ✗ When accessing HttpContext after await
```

**Performance benefit:**
- Avoids context capture/restore overhead
- Avoids potential deadlocks
- Allows continuation on any thread

---

### 44. What is thread starvation?

**Thread starvation** occurs when no threads are available to process work.

```csharp
// ❌ Causes thread starvation - blocking thread pool threads
public void ProcessAll()
{
    Parallel.ForEach(items, item =>
    {
        var result = GetDataAsync().Result;  // Blocks thread!
    });
}

// ❌ Blocking in async code
public async Task<Data> GetDataAsync()
{
    var client = new HttpClient();
    return client.GetAsync(url).Result;  // Don't do this!
}

// ✓ Proper async - threads return to pool during await
public async Task ProcessAllAsync()
{
    var tasks = items.Select(ProcessItemAsync);
    await Task.WhenAll(tasks);
}

public async Task ProcessItemAsync(Item item)
{
    var result = await GetDataAsync();  // Thread returns to pool
}
```

**Signs of starvation:**
- Request timeouts
- Slow response times
- Thread pool queue growing

---

### 45. What is ThreadPool?

**ThreadPool** manages a pool of worker threads for executing tasks.

```csharp
// Queue work to thread pool
ThreadPool.QueueUserWorkItem(state =>
{
    Console.WriteLine($"Running on thread {Thread.CurrentThread.ManagedThreadId}");
});

// Modern approach - Task.Run
await Task.Run(() => DoWork());

// Check thread pool stats
ThreadPool.GetAvailableThreads(out int workerThreads, out int ioThreads);
ThreadPool.GetMinThreads(out int minWorker, out int minIo);
ThreadPool.GetMaxThreads(out int maxWorker, out int maxIo);

// Configure thread pool
ThreadPool.SetMinThreads(workerThreads: 50, completionPortThreads: 50);

// Thread pool behavior:
// - Starts with Min threads
// - Creates new threads as needed (slowly!)
// - Max ~32,767 threads
// - Reuses threads (no creation overhead)
```

---

### 46. What is Task.Run misuse?

**Task.Run** should wrap CPU-bound work, not I/O operations.

```csharp
// ❌ WRONG - wrapping I/O in Task.Run
public async Task<Data> GetDataAsync()
{
    return await Task.Run(async () =>
    {
        return await _httpClient.GetAsync(url);  // Already async!
    });
}
// Burns a thread pool thread unnecessarily

// ✓ CORRECT - just await the async operation
public async Task<Data> GetDataAsync()
{
    return await _httpClient.GetAsync(url);
}

// ✓ Task.Run for CPU-bound work
public async Task<int> CalculateAsync(int[] data)
{
    return await Task.Run(() =>
    {
        // CPU-bound work
        return data.Select(x => HeavyCalculation(x)).Sum();
    });
}

// ❌ Task.Run in ASP.NET for I/O
// Wastes thread pool thread, no benefit
public async Task<IActionResult> Get()
{
    var data = await Task.Run(() => _dbContext.Users.ToListAsync());
    return Ok(data);
}
```

---

### 47. What is IAsyncEnumerable<T>?

`IAsyncEnumerable<T>` enables asynchronous streaming of data.

```csharp
// Producer - yields items asynchronously
public async IAsyncEnumerable<int> GetNumbersAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; i < 100; i++)
    {
        await Task.Delay(100, ct);  // Simulate async work
        yield return i;
    }
}

// Consumer - processes items as they arrive
await foreach (var number in GetNumbersAsync())
{
    Console.WriteLine(number);
}

// With cancellation
var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
await foreach (var number in GetNumbersAsync().WithCancellation(cts.Token))
{
    Console.WriteLine(number);
}

// EF Core streaming
await foreach (var user in _context.Users.AsAsyncEnumerable())
{
    // Process one user at a time, not all in memory
    await ProcessUserAsync(user);
}

// API streaming response
[HttpGet]
public async IAsyncEnumerable<Product> GetProductsStream()
{
    await foreach (var product in _repo.GetAllAsync())
    {
        yield return product;
    }
}
```

---

### 48. What is ValueTask?

`ValueTask<T>` avoids heap allocation when result is often synchronously available.

```csharp
// Task<T> always allocates on heap
public Task<int> GetCachedValueAsync(string key)
{
    if (_cache.TryGetValue(key, out int value))
    {
        return Task.FromResult(value);  // Still allocates!
    }
    return FetchFromDatabaseAsync(key);
}

// ValueTask<T> - no allocation for sync path
public ValueTask<int> GetCachedValueAsync(string key)
{
    if (_cache.TryGetValue(key, out int value))
    {
        return new ValueTask<int>(value);  // Stack allocation
    }
    return new ValueTask<int>(FetchFromDatabaseAsync(key));
}

// Rules for ValueTask:
// 1. Await only once
// 2. Don't await concurrently
// 3. Don't block on it (.Result, .Wait())
// 4. Don't use with Task.WhenAll

// ❌ DON'T do this
var vt = GetValueAsync();
await vt;
await vt;  // Invalid!

// Use ValueTask when:
// - Method often completes synchronously
// - High-performance path
// - IAsyncEnumerable.MoveNextAsync
```

---

### 49. When to use Parallel.ForEach?

Use `Parallel.ForEach` for CPU-bound work, NOT for I/O.

```csharp
// ✓ Good - CPU-bound work
Parallel.ForEach(images, image =>
{
    var processed = ApplyFilters(image);  // CPU work
    SaveImage(processed);
});

// ✓ With options
var options = new ParallelOptions
{
    MaxDegreeOfParallelism = Environment.ProcessorCount,
    CancellationToken = cancellationToken
};

Parallel.ForEach(data, options, item =>
{
    Process(item);
});

// ❌ Bad - I/O bound (use async instead)
Parallel.ForEach(urls, url =>
{
    var result = httpClient.GetAsync(url).Result;  // Blocks!
});

// ✓ Better for I/O
var tasks = urls.Select(url => httpClient.GetAsync(url));
await Task.WhenAll(tasks);

// ✓ With concurrency limit for I/O
await Parallel.ForEachAsync(urls, 
    new ParallelOptions { MaxDegreeOfParallelism = 10 },
    async (url, ct) =>
    {
        await httpClient.GetAsync(url, ct);
    });
```

---

### 50. What is lock?

`lock` provides exclusive access to a code section (mutual exclusion).

```csharp
public class Counter
{
    private int _count;
    private readonly object _lock = new();
    
    public void Increment()
    {
        lock (_lock)  // Only one thread at a time
        {
            _count++;
        }
    }
    
    public int GetCount()
    {
        lock (_lock)
        {
            return _count;
        }
    }
}

// Lock rules:
// 1. Lock on private readonly object
// 2. Never lock on 'this', Type, or string
// 3. Keep locked code minimal
// 4. Avoid calling external code while locked

// ❌ DON'T lock on these
lock (this) { }           // External code can lock same object
lock (typeof(MyClass)) { } // Type object shared globally
lock ("literal") { }       // Interned strings shared

// ❌ DON'T do async inside lock
lock (_lock)
{
    await DoSomethingAsync();  // Compile error!
}

// ✓ Use SemaphoreSlim for async
private readonly SemaphoreSlim _semaphore = new(1, 1);
await _semaphore.WaitAsync();
try
{
    await DoSomethingAsync();
}
finally
{
    _semaphore.Release();
}
```

---

### 51. What is Monitor?

`Monitor` is what `lock` compiles to. Provides more control than lock.

```csharp
// lock is syntactic sugar for Monitor
lock (_lock)
{
    // Critical section
}

// Equivalent to:
Monitor.Enter(_lock);
try
{
    // Critical section
}
finally
{
    Monitor.Exit(_lock);
}

// TryEnter - with timeout
if (Monitor.TryEnter(_lock, TimeSpan.FromSeconds(5)))
{
    try
    {
        // Got the lock
    }
    finally
    {
        Monitor.Exit(_lock);
    }
}
else
{
    // Couldn't acquire lock in time
}

// Wait and Pulse - producer/consumer
Monitor.Wait(_lock);     // Release lock and wait
Monitor.Pulse(_lock);    // Wake one waiting thread
Monitor.PulseAll(_lock); // Wake all waiting threads
```

---

### 52. What is SemaphoreSlim?

`SemaphoreSlim` limits concurrent access and supports async waiting.

```csharp
// Limit to 3 concurrent operations
private readonly SemaphoreSlim _semaphore = new(3, 3);

public async Task ProcessAsync(Item item)
{
    await _semaphore.WaitAsync();  // Async wait!
    try
    {
        await DoWorkAsync(item);
    }
    finally
    {
        _semaphore.Release();
    }
}

// Process many items with concurrency limit
public async Task ProcessAllAsync(IEnumerable<Item> items)
{
    var tasks = items.Select(async item =>
    {
        await _semaphore.WaitAsync();
        try
        {
            await ProcessAsync(item);
        }
        finally
        {
            _semaphore.Release();
        }
    });
    
    await Task.WhenAll(tasks);
}

// Use as async lock (single access)
private readonly SemaphoreSlim _asyncLock = new(1, 1);

public async Task<T> GetOrCreateAsync<T>()
{
    await _asyncLock.WaitAsync();
    try
    {
        // Exclusive async access
    }
    finally
    {
        _asyncLock.Release();
    }
}
```

---

### 53. What is race condition?

**Race condition** occurs when output depends on timing of uncontrolled events.

```csharp
// ❌ Race condition
public class BankAccount
{
    public decimal Balance { get; private set; }
    
    public void Transfer(BankAccount to, decimal amount)
    {
        if (Balance >= amount)  // Check
        {
            // Another thread could change Balance here!
            Balance -= amount;   // Act
            to.Balance += amount;
        }
    }
}

// ✓ Fixed with lock
private readonly object _lock = new();

public void Transfer(BankAccount to, decimal amount)
{
    lock (_lock)
    {
        if (Balance >= amount)
        {
            Balance -= amount;
            to.Balance += amount;
        }
    }
}

// ✓ Or with Interlocked for simple operations
private int _counter;

public void Increment()
{
    Interlocked.Increment(ref _counter);
}

public bool TryDeduct(int amount)
{
    int current, updated;
    do
    {
        current = _counter;
        if (current < amount) return false;
        updated = current - amount;
    } while (Interlocked.CompareExchange(ref _counter, updated, current) != current);
    return true;
}
```

---

### 54. What is deadlock?

**Deadlock** occurs when threads wait on each other indefinitely.

```csharp
// ❌ Deadlock scenario
var lockA = new object();
var lockB = new object();

// Thread 1
lock (lockA)
{
    Thread.Sleep(100);
    lock (lockB)  // Waits for Thread 2
    {
        // Never reached
    }
}

// Thread 2
lock (lockB)
{
    Thread.Sleep(100);
    lock (lockA)  // Waits for Thread 1
    {
        // Never reached
    }
}

// ✓ Fix: Always acquire locks in same order
lock (lockA)
{
    lock (lockB)
    {
        // Thread 2 must also acquire A before B
    }
}

// ❌ Async deadlock (UI/ASP.NET Framework)
public void Button_Click()
{
    var data = GetDataAsync().Result;  // Blocks UI thread
}

public async Task<Data> GetDataAsync()
{
    await Task.Delay(100);  // Needs UI thread to continue!
    return new Data();
}

// ✓ Fix: Use await properly
public async void Button_Click()
{
    var data = await GetDataAsync();
}

// ✓ Or ConfigureAwait(false) in library
public async Task<Data> GetDataAsync()
{
    await Task.Delay(100).ConfigureAwait(false);
    return new Data();
}
```

---

### 55. What is memory leak in .NET?

**Memory leak** in .NET occurs when objects are kept alive unintentionally.

```csharp
// 1. Event handler leak
public class Subscriber
{
    public Subscriber(Publisher pub)
    {
        pub.OnEvent += HandleEvent;  // Leak! Publisher holds reference
    }
    // ~Subscriber never called while Publisher lives
}

// Fix: Unsubscribe
public void Dispose()
{
    _publisher.OnEvent -= HandleEvent;
}

// 2. Static collections
public static class Cache
{
    private static Dictionary<string, object> _cache = new();
    
    public static void Add(string key, object value)
    {
        _cache[key] = value;  // Never removed!
    }
}

// 3. Closure capturing
public void CreateTimers()
{
    for (int i = 0; i < 1000; i++)
    {
        var bigData = new byte[1000000];
        var timer = new Timer(_ => 
        {
            Console.WriteLine(bigData.Length);  // Captures bigData!
        }, null, 0, 1000);
    }
}

// 4. Not disposing IDisposable
var stream = new FileStream("file.txt", FileMode.Open);
// Never disposed - handles leak
```

---

### 56. What is GC pressure?

**GC pressure** is when excessive allocations cause frequent garbage collection.

```csharp
// ❌ High GC pressure
public void ProcessItems(List<Item> items)
{
    foreach (var item in items)
    {
        var result = new ProcessResult();  // Allocation each iteration
        var temp = item.ToString();        // String allocation
        var list = new List<int>();        // Collection allocation
    }
}

// ✓ Reduce allocations
public void ProcessItems(List<Item> items)
{
    var result = new ProcessResult();  // Reuse
    var builder = new StringBuilder(); // Reuse
    
    foreach (var item in items)
    {
        result.Reset();
        builder.Clear();
        // Process without new allocations
    }
}

// ✓ Use structs for small, short-lived data
public readonly struct Point
{
    public int X { get; }
    public int Y { get; }
}

// ✓ Use Span<T> for slicing without allocation
Span<char> span = stackalloc char[100];

// ✓ Use ArrayPool
var buffer = ArrayPool<byte>.Shared.Rent(1024);
try
{
    // Use buffer
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}
```

---

### 57. What is Span<T>?

`Span<T>` provides type-safe access to contiguous memory without allocation.

```csharp
// Span can point to:
// - Arrays
// - Stack memory
// - Native memory

// Array slicing without allocation
int[] array = { 1, 2, 3, 4, 5 };
Span<int> slice = array.AsSpan(1, 3);  // [2, 3, 4]
slice[0] = 20;  // Modifies original array

// Stack allocation
Span<int> stackSpan = stackalloc int[100];

// String parsing without substring allocations
string text = "Hello,World,Test";
ReadOnlySpan<char> span = text.AsSpan();

foreach (var range in span.Split(','))
{
    var word = span[range];  // No allocation!
    Console.WriteLine(word.ToString());
}

// Span limitations:
// - Cannot be stored on heap (no class fields)
// - Cannot be boxed
// - Cannot be used in async methods
// - ref struct

// Use Memory<T> when you need heap storage
Memory<byte> memory = new byte[100];
await ProcessAsync(memory);  // Works in async
```

---

### 58. What is Memory<T>?

`Memory<T>` is like `Span<T>` but can be stored on the heap and used in async.

```csharp
public class Buffer
{
    private Memory<byte> _buffer;  // Can be a field
    
    public async Task ProcessAsync()
    {
        // Can use in async
        await ReadIntoAsync(_buffer);
    }
}

// Memory to Span conversion
Memory<int> memory = new int[100];
Span<int> span = memory.Span;  // Get span for synchronous work

// ReadOnlyMemory for read-only scenarios
public async Task<int> ParseAsync(ReadOnlyMemory<char> input)
{
    // Process input asynchronously
    return int.Parse(input.Span);
}

// Common pattern
public async Task ProcessAsync(Stream stream)
{
    var buffer = new byte[4096];
    Memory<byte> memory = buffer;
    
    int read = await stream.ReadAsync(memory);
    var data = memory.Slice(0, read);
    
    // Process data
}
```

---

### 59. What is pooling?

**Pooling** reuses objects to avoid allocation overhead.

```csharp
// ArrayPool - built-in array pooling
var buffer = ArrayPool<byte>.Shared.Rent(minimumLength: 1024);
try
{
    // Use buffer (may be larger than requested)
    var actualLength = DoWork(buffer);
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
}

// ObjectPool - generic object pooling
public class ExpensiveObjectPool
{
    private readonly ObjectPool<ExpensiveObject> _pool;
    
    public ExpensiveObjectPool()
    {
        _pool = new DefaultObjectPool<ExpensiveObject>(
            new DefaultPooledObjectPolicy<ExpensiveObject>());
    }
    
    public ExpensiveObject Rent() => _pool.Get();
    public void Return(ExpensiveObject obj) => _pool.Return(obj);
}

// Custom pool with Microsoft.Extensions.ObjectPool
services.AddSingleton<ObjectPoolProvider, DefaultObjectPoolProvider>();
services.AddSingleton(sp =>
{
    var provider = sp.GetRequiredService<ObjectPoolProvider>();
    return provider.Create(new StringBuilderPooledObjectPolicy());
});

// StringBuilder pooling
var sb = _stringBuilderPool.Get();
try
{
    sb.Append("Hello");
    return sb.ToString();
}
finally
{
    _stringBuilderPool.Return(sb);
}
```

---

### 60. What is connection pooling?

**Connection pooling** reuses database connections instead of creating new ones.

```csharp
// Connection pooling is automatic with ADO.NET
// Connection string controls pool behavior
var connectionString = @"
    Server=localhost;
    Database=MyDb;
    User Id=sa;
    Password=password;
    Min Pool Size=5;
    Max Pool Size=100;
    Connection Timeout=30;
    Pooling=true";

// Connections are pooled per connection string
using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();  // Gets from pool or creates new
// ... use connection
// connection.Dispose() returns to pool, doesn't close

// EF Core uses connection pooling automatically
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Best practices:
// 1. Always dispose connections promptly
// 2. Use consistent connection strings
// 3. Don't hold connections open longer than needed
// 4. Monitor pool exhaustion

// Check pool statistics (SQL Server)
var stats = SqlConnection.GetPoolStatistics();
```

---

### 61. What is object pooling?

**Object pooling** reuses expensive objects to reduce allocation and initialization costs.

```csharp
// Built-in ObjectPool
public class ReportGenerator
{
    private readonly ObjectPool<StringBuilder> _pool;
    
    public ReportGenerator(ObjectPoolProvider poolProvider)
    {
        _pool = poolProvider.Create<StringBuilder>();
    }
    
    public string GenerateReport(Data data)
    {
        var sb = _pool.Get();
        try
        {
            sb.AppendLine("Report");
            // Build report...
            return sb.ToString();
        }
        finally
        {
            sb.Clear();  // Reset before returning
            _pool.Return(sb);
        }
    }
}

// Custom pooled object policy
public class MyObjectPolicy : IPooledObjectPolicy<MyExpensiveObject>
{
    public MyExpensiveObject Create()
    {
        return new MyExpensiveObject();  // Expensive creation
    }
    
    public bool Return(MyExpensiveObject obj)
    {
        obj.Reset();  // Clean up for reuse
        return true;  // Return true to keep in pool
    }
}
```

---

### 62. What is rate limiting?

**Rate limiting** controls how many requests can be processed in a time period.

```csharp
// ASP.NET Core 7+ built-in rate limiting
builder.Services.AddRateLimiter(options =>
{
    // Fixed window
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
        opt.QueueLimit = 10;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
    
    // Sliding window
    options.AddSlidingWindowLimiter("sliding", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;
        opt.PermitLimit = 100;
    });
    
    // Token bucket
    options.AddTokenBucketLimiter("token", opt =>
    {
        opt.TokenLimit = 100;
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        opt.TokensPerPeriod = 10;
    });
    
    // Per-user rate limiting
    options.AddPolicy("per-user", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User.Identity?.Name ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromMinutes(1)
            }));
});

app.UseRateLimiter();

[EnableRateLimiting("fixed")]
public class ApiController : ControllerBase { }
```

---

### 63. How to implement caching?

```csharp
// In-memory caching
public class ProductService
{
    private readonly IMemoryCache _cache;
    private readonly IProductRepository _repo;
    
    public async Task<Product?> GetByIdAsync(int id)
    {
        var cacheKey = $"product:{id}";
        
        if (!_cache.TryGetValue(cacheKey, out Product? product))
        {
            product = await _repo.GetByIdAsync(id);
            
            if (product != null)
            {
                var options = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                    SlidingExpiration = TimeSpan.FromMinutes(2),
                    Priority = CacheItemPriority.Normal
                };
                
                _cache.Set(cacheKey, product, options);
            }
        }
        
        return product;
    }
}

// GetOrCreate pattern
var product = await _cache.GetOrCreateAsync(cacheKey, async entry =>
{
    entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
    return await _repo.GetByIdAsync(id);
});

// Cache invalidation
_cache.Remove(cacheKey);
```

---

### 64. What is IMemoryCache?

`IMemoryCache` provides in-memory caching for a single application instance.

```csharp
// Registration
builder.Services.AddMemoryCache();

// Usage
public class CacheService
{
    private readonly IMemoryCache _cache;
    
    public CacheService(IMemoryCache cache)
    {
        _cache = cache;
    }
    
    public T GetOrSet<T>(string key, Func<T> factory, TimeSpan duration)
    {
        return _cache.GetOrCreate(key, entry =>
        {
            entry.SetAbsoluteExpiration(duration);
            entry.SetPriority(CacheItemPriority.Normal);
            entry.RegisterPostEvictionCallback((key, value, reason, state) =>
            {
                Console.WriteLine($"Cache evicted: {key}, Reason: {reason}");
            });
            return factory();
        });
    }
}

// Cache options
var options = new MemoryCacheEntryOptions()
    .SetAbsoluteExpiration(TimeSpan.FromHours(1))
    .SetSlidingExpiration(TimeSpan.FromMinutes(10))
    .SetSize(1)  // For size-limited cache
    .SetPriority(CacheItemPriority.High);

// Size-limited cache
services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000;
});
```

---

### 65. What is distributed cache?

**Distributed cache** shares cached data across multiple application instances.

```csharp
// Register distributed cache (Redis example)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
    options.InstanceName = "myapp:";
});

// Usage
public class DistributedCacheService
{
    private readonly IDistributedCache _cache;
    
    public async Task<T?> GetAsync<T>(string key)
    {
        var data = await _cache.GetStringAsync(key);
        return data == null ? default : JsonSerializer.Deserialize<T>(data);
    }
    
    public async Task SetAsync<T>(string key, T value, TimeSpan duration)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = duration
        };
        
        var json = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, json, options);
    }
    
    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(key);
    }
}

// Distributed cache providers:
// - Redis (AddStackExchangeRedisCache)
// - SQL Server (AddDistributedSqlServerCache)
// - NCache (AddNCacheDistributedCache)
```

---

### 66. What is Redis?

**Redis** is an in-memory data store used for caching, sessions, and pub/sub.

```csharp
// Install: StackExchange.Redis

// Basic connection
var redis = ConnectionMultiplexer.Connect("localhost:6379");
var db = redis.GetDatabase();

// String operations
await db.StringSetAsync("key", "value", TimeSpan.FromMinutes(10));
var value = await db.StringGetAsync("key");

// Hash operations
await db.HashSetAsync("user:1", new HashEntry[]
{
    new("name", "Alice"),
    new("email", "alice@example.com")
});
var name = await db.HashGetAsync("user:1", "name");

// Lists
await db.ListRightPushAsync("queue", "item1");
var item = await db.ListLeftPopAsync("queue");

// Sets
await db.SetAddAsync("tags", "dotnet");
var members = await db.SetMembersAsync("tags");

// Pub/Sub
var sub = redis.GetSubscriber();
await sub.SubscribeAsync("channel", (channel, message) =>
{
    Console.WriteLine($"Received: {message}");
});
await sub.PublishAsync("channel", "Hello!");

// With ASP.NET Core
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
});
```

---

### 67. What is response compression?

**Response compression** reduces response size for faster transmission.

```csharp
// Enable compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        new[] { "application/json", "text/plain" });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.SmallestSize;
});

var app = builder.Build();

// Must be before other middleware that writes to response
app.UseResponseCompression();

// Client sends: Accept-Encoding: gzip, br
// Server responds: Content-Encoding: br (or gzip)
```

---

### 68. What is output caching?

**Output caching** caches entire HTTP responses.

```csharp
// ASP.NET Core 7+ Output Caching
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Expire(TimeSpan.FromMinutes(10)));
    
    options.AddPolicy("Products", builder =>
        builder.Expire(TimeSpan.FromMinutes(5))
               .SetVaryByQuery("category"));
    
    options.AddPolicy("ByUser", builder =>
        builder.SetVaryByHeader("Authorization")
               .Expire(TimeSpan.FromMinutes(1)));
});

app.UseOutputCache();

// Apply to endpoints
app.MapGet("/products", async (IProductService service) =>
{
    return await service.GetAllAsync();
}).CacheOutput("Products");

// Attribute on controllers
[OutputCache(PolicyName = "Products")]
public class ProductsController : ControllerBase { }

// Invalidation
public class ProductsController : ControllerBase
{
    private readonly IOutputCacheStore _cache;
    
    [HttpPost]
    public async Task<IActionResult> Create(ProductDto dto)
    {
        // Create product...
        await _cache.EvictByTagAsync("products", default);
        return Ok();
    }
}
```

---

### 69. What is HTTP client lifetime issue?

Improper `HttpClient` usage can cause **socket exhaustion**.

```csharp
// ❌ BAD - creates new HttpClient each time
public async Task<string> GetDataAsync()
{
    using var client = new HttpClient();  // Socket not released immediately
    return await client.GetStringAsync("https://api.example.com/data");
}
// Sockets stay in TIME_WAIT, eventually exhausted

// ❌ BAD - static client doesn't respect DNS changes
private static readonly HttpClient _client = new HttpClient();
// DNS changes won't be picked up

// ✓ GOOD - IHttpClientFactory manages lifetime
builder.Services.AddHttpClient("api", client =>
{
    client.BaseAddress = new Uri("https://api.example.com/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

public class ApiService
{
    private readonly IHttpClientFactory _factory;
    
    public async Task<string> GetDataAsync()
    {
        var client = _factory.CreateClient("api");
        return await client.GetStringAsync("data");
    }
}
```

---

### 70. What is socket exhaustion?

**Socket exhaustion** occurs when all available sockets are in use or TIME_WAIT state.

```csharp
// Problem: Each HttpClient creates new connection
for (int i = 0; i < 10000; i++)
{
    using var client = new HttpClient();
    await client.GetAsync(url);
}
// Sockets remain in TIME_WAIT for ~4 minutes

// Symptoms:
// - SocketException: "Only one usage of each socket address is permitted"
// - Cannot connect to services
// - High number of TIME_WAIT connections

// Check sockets: netstat -an | grep TIME_WAIT

// Solution: IHttpClientFactory
builder.Services.AddHttpClient();

// Or pooled connection lifetime
builder.Services.AddHttpClient("api")
    .SetHandlerLifetime(TimeSpan.FromMinutes(5));
```

---

### 71. What is IHttpClientFactory?

`IHttpClientFactory` manages `HttpClient` instances and their underlying handlers.

```csharp
// Basic registration
builder.Services.AddHttpClient();

// Named clients
builder.Services.AddHttpClient("github", client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
    client.DefaultRequestHeaders.Add("User-Agent", "MyApp");
});

// Typed clients
builder.Services.AddHttpClient<IGitHubService, GitHubService>(client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
});

public class GitHubService : IGitHubService
{
    private readonly HttpClient _client;
    
    public GitHubService(HttpClient client)
    {
        _client = client;  // Injected, managed by factory
    }
}

// With Polly for resilience
builder.Services.AddHttpClient("api")
    .AddTransientHttpErrorPolicy(p =>
        p.WaitAndRetryAsync(3, _ => TimeSpan.FromMilliseconds(300)));

// Benefits:
// - Proper connection pooling
// - Handler rotation (respects DNS)
// - Centralized configuration
// - Integration with Polly
```

---

### 72. What is minimal API?

**Minimal APIs** are a simplified way to build APIs with less ceremony.

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IProductService, ProductService>();

var app = builder.Build();

// Route handlers
app.MapGet("/", () => "Hello World");

app.MapGet("/products", async (IProductService service) =>
    await service.GetAllAsync());

app.MapGet("/products/{id}", async (int id, IProductService service) =>
    await service.GetByIdAsync(id) is Product p
        ? Results.Ok(p)
        : Results.NotFound());

app.MapPost("/products", async (ProductDto dto, IProductService service) =>
{
    var product = await service.CreateAsync(dto);
    return Results.Created($"/products/{product.Id}", product);
});

app.MapPut("/products/{id}", async (int id, ProductDto dto, IProductService service) =>
{
    await service.UpdateAsync(id, dto);
    return Results.NoContent();
});

app.MapDelete("/products/{id}", async (int id, IProductService service) =>
{
    await service.DeleteAsync(id);
    return Results.NoContent();
});

app.Run();
```

---

### 73. What is streaming response?

**Streaming** sends data incrementally instead of all at once.

```csharp
// Stream large file
app.MapGet("/download", async (HttpContext context) =>
{
    context.Response.ContentType = "application/octet-stream";
    context.Response.Headers.Append("Content-Disposition", "attachment; filename=large.dat");
    
    await using var stream = File.OpenRead("large.dat");
    await stream.CopyToAsync(context.Response.Body);
});

// IAsyncEnumerable streaming
app.MapGet("/stream", async (IProductService service) =>
{
    return Results.Ok(StreamProducts(service));
});

async IAsyncEnumerable<Product> StreamProducts(IProductService service)
{
    await foreach (var product in service.GetAllStreamAsync())
    {
        yield return product;
    }
}

// Server-Sent Events
app.MapGet("/events", async (HttpContext context) =>
{
    context.Response.Headers.Append("Content-Type", "text/event-stream");
    
    for (int i = 0; i < 10; i++)
    {
        await context.Response.WriteAsync($"data: Event {i}\n\n");
        await context.Response.Body.FlushAsync();
        await Task.Delay(1000);
    }
});
```

---

### 74. What is backpressure?

**Backpressure** is when consumers slow down producers to prevent overwhelming.

```csharp
// Channel with bounded capacity (built-in backpressure)
var channel = Channel.CreateBounded<Message>(new BoundedChannelOptions(100)
{
    FullMode = BoundedChannelFullMode.Wait  // Block when full
});

// Producer slows down when channel is full
public async Task ProduceAsync()
{
    while (true)
    {
        var message = await GetNextMessageAsync();
        await channel.Writer.WriteAsync(message);  // Waits if full
    }
}

// Consumer processes at its own pace
public async Task ConsumeAsync()
{
    await foreach (var message in channel.Reader.ReadAllAsync())
    {
        await ProcessAsync(message);  // Take your time
    }
}

// SignalR backpressure
app.MapHub<MyHub>("/hub", options =>
{
    options.MaximumReceiveMessageSize = 32 * 1024;
    options.StreamBufferCapacity = 10;  // Backpressure for streams
});
```

---

### 75. What is performance profiling?

**Performance profiling** identifies bottlenecks in your application.

```csharp
// Built-in diagnostics
using System.Diagnostics;

var sw = Stopwatch.StartNew();
await DoWorkAsync();
sw.Stop();
Console.WriteLine($"Elapsed: {sw.ElapsedMilliseconds}ms");

// Activity for distributed tracing
using var activity = new ActivitySource("MyApp").StartActivity("ProcessOrder");
activity?.SetTag("orderId", orderId);
// Do work
activity?.SetStatus(ActivityStatusCode.Ok);

// dotnet-counters (runtime)
// dotnet counters monitor -n MyApp

// dotnet-trace
// dotnet trace collect -n MyApp

// dotnet-dump
// dotnet dump collect -n MyApp

// Tools:
// - Visual Studio Profiler
// - JetBrains dotTrace
// - PerfView
// - Application Insights
```

---

### 76. What is BenchmarkDotNet?

**BenchmarkDotNet** is a library for accurate .NET benchmarking.

```csharp
// Install: dotnet add package BenchmarkDotNet

[MemoryDiagnoser]
[Orderer(SummaryOrderPolicy.FastestToSlowest)]
public class StringBenchmarks
{
    private readonly string[] _items = Enumerable.Range(0, 1000)
        .Select(i => i.ToString()).ToArray();
    
    [Benchmark(Baseline = true)]
    public string StringConcat()
    {
        string result = "";
        foreach (var item in _items)
            result += item;
        return result;
    }
    
    [Benchmark]
    public string StringBuilder()
    {
        var sb = new StringBuilder();
        foreach (var item in _items)
            sb.Append(item);
        return sb.ToString();
    }
    
    [Benchmark]
    public string StringJoin()
    {
        return string.Join("", _items);
    }
}

// Run
// dotnet run -c Release

// Output:
// |        Method |      Mean |    Allocated |
// |-------------- |----------:|-------------:|
// |    StringJoin |  5.234 μs |      7.82 KB |
// | StringBuilder |  8.123 μs |     15.64 KB |
// |  StringConcat | 89.456 μs |    512.00 KB |
```

---

### 77. What is health check?

**Health checks** verify application dependencies are functioning.

```csharp
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString, name: "database")
    .AddRedis("localhost:6379", name: "redis")
    .AddUrlGroup(new Uri("https://api.example.com/health"), name: "external-api")
    .AddCheck<CustomHealthCheck>("custom");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration
            })
        }));
    }
});

// Custom health check
public class CustomHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct = default)
    {
        try
        {
            // Check something
            return HealthCheckResult.Healthy("All good");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Failed", ex);
        }
    }
}
```

---

### 78. What is circuit breaker?

**Circuit breaker** prevents cascading failures by stopping calls to failing services.

```csharp
// States:
// Closed → errors occur → Open → timeout → Half-Open → success → Closed
//                          ↑________________failure____|

// With Polly
builder.Services.AddHttpClient("api")
    .AddTransientHttpErrorPolicy(policy =>
        policy.CircuitBreakerAsync(
            handledEventsAllowedBeforeBreaking: 3,
            durationOfBreak: TimeSpan.FromSeconds(30)));

// Manual circuit breaker
public class CircuitBreaker
{
    private int _failures;
    private DateTime _lastFailure;
    private bool _isOpen;
    
    public async Task<T> ExecuteAsync<T>(Func<Task<T>> action)
    {
        if (_isOpen && DateTime.UtcNow - _lastFailure < TimeSpan.FromSeconds(30))
            throw new CircuitBreakerOpenException();
        
        try
        {
            var result = await action();
            _failures = 0;
            _isOpen = false;
            return result;
        }
        catch
        {
            _failures++;
            _lastFailure = DateTime.UtcNow;
            if (_failures >= 3)
                _isOpen = true;
            throw;
        }
    }
}
```

---

### 79. What is Polly?

**Polly** is a resilience and transient-fault-handling library.

```csharp
// Install: Microsoft.Extensions.Http.Polly

// Retry policy
builder.Services.AddHttpClient("api")
    .AddTransientHttpErrorPolicy(p =>
        p.WaitAndRetryAsync(3, retryAttempt =>
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))));

// Circuit breaker
builder.Services.AddHttpClient("api")
    .AddTransientHttpErrorPolicy(p =>
        p.CircuitBreakerAsync(5, TimeSpan.FromMinutes(1)));

// Timeout
builder.Services.AddHttpClient("api")
    .AddPolicyHandler(Policy.TimeoutAsync<HttpResponseMessage>(10));

// Combined policies
builder.Services.AddHttpClient("api")
    .AddPolicyHandler(GetRetryPolicy())
    .AddPolicyHandler(GetCircuitBreakerPolicy())
    .AddPolicyHandler(Policy.TimeoutAsync<HttpResponseMessage>(30));

// Bulkhead (limit concurrent calls)
var bulkhead = Policy.BulkheadAsync<HttpResponseMessage>(
    maxParallelization: 10,
    maxQueuingActions: 100);

// Fallback
var fallback = Policy<string>
    .Handle<Exception>()
    .FallbackAsync("default value");
```

---

### 80. What is retry policy?

**Retry policy** automatically retries failed operations.

```csharp
// Simple retry
var retryPolicy = Policy
    .Handle<HttpRequestException>()
    .RetryAsync(3);

// Retry with delay
var retryWithDelay = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(new[]
    {
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(2),
        TimeSpan.FromSeconds(4)
    });

// Exponential backoff with jitter
var retryWithJitter = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(3, retryAttempt =>
        TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)) +
        TimeSpan.FromMilliseconds(Random.Shared.Next(0, 1000)));

// With callback
var retryWithLogging = Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(3,
        sleepDurationProvider: _ => TimeSpan.FromSeconds(1),
        onRetry: (exception, timeSpan, retryCount, context) =>
        {
            _logger.LogWarning("Retry {Count} after {Exception}",
                retryCount, exception.Message);
        });

// Usage
await retryPolicy.ExecuteAsync(async () =>
{
    await _httpClient.GetAsync(url);
});
```

---

## Summary

| Concept | Purpose |
|---------|---------|
| async/await | Non-blocking asynchronous code |
| ConfigureAwait(false) | Avoid context capture |
| SynchronizationContext | Post continuations to context |
| ThreadPool | Manages worker threads |
| ValueTask | Reduce allocations for sync paths |
| Span<T>/Memory<T> | Zero-allocation memory access |
| lock/Monitor | Mutual exclusion |
| SemaphoreSlim | Async-compatible limiting |
| Race Condition | Timing-dependent bugs |
| Deadlock | Circular waiting |
| GC Pressure | Excessive allocations |
| Object Pooling | Reuse expensive objects |
| Connection Pooling | Reuse database connections |
| IMemoryCache | In-process caching |
| Distributed Cache | Cross-instance caching |
| Rate Limiting | Control request rate |
| IHttpClientFactory | Managed HttpClient lifecycle |
| Health Checks | Monitor dependencies |
| Circuit Breaker | Stop cascading failures |
| Polly | Resilience policies |

---

*Next: [Part 8 - Security & Real Backend](08-intermediate-security.md)*
