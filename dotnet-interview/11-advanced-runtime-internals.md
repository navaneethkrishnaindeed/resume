# .NET Interview Guide - Advanced Level
## Part 11: Runtime Internals (Questions 51-100)

---

### 51. How GC works internally?

The .NET Garbage Collector uses a **generational, mark-sweep-compact** algorithm.

```
┌──────────────────────────────────────────────────────────┐
│                    Managed Heap                          │
├────────────┬────────────────┬───────────────────────────┤
│   Gen 0    │     Gen 1      │          Gen 2            │
│  (256 KB)  │    (~2 MB)     │        (Large)            │
│ Short-lived│   Survived     │       Long-lived          │
└────────────┴────────────────┴───────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  Large Object Heap  │
                              │    (>= 85,000 B)    │
                              └─────────────────────┘
```

**GC Phases:**

1. **Mark Phase**: Identify reachable objects
```csharp
// GC starts from roots:
// - Static fields
// - Local variables on stack
// - CPU registers
// - Finalizer queue
// Traverses object graph, marks live objects
```

2. **Sweep Phase**: Identify unreachable objects

3. **Compact Phase**: Move objects to eliminate fragmentation
```csharp
// Before compaction: [A][  ][B][  ][  ][C]
// After compaction:  [A][B][C][  ][  ][  ]
// Updates all references
```

**Generation Collection:**
```csharp
// Gen 0 collection (~10ms, frequent)
GC.Collect(0);

// Gen 1 collection (includes Gen 0)
GC.Collect(1);

// Gen 2 collection (full collection, expensive)
GC.Collect(2);

// Check generation
var obj = new object();
Console.WriteLine(GC.GetGeneration(obj));  // 0
GC.Collect();
Console.WriteLine(GC.GetGeneration(obj));  // 1 (survived)
```

---

### 52. How ThreadPool scales?

The ThreadPool dynamically adjusts thread count based on workload.

```
┌─────────────────────────────────────────────────────────┐
│                    ThreadPool                            │
├─────────────────────────────────────────────────────────┤
│  Min Threads → Current Threads → Max Threads            │
│      4            8-12              32767                │
│                                                         │
│  Work Items Queue: [Task1][Task2][Task3][...]           │
│                          ↓                               │
│  Worker Threads:    [T1] [T2] [T3] [T4] ...             │
└─────────────────────────────────────────────────────────┘
```

**Hill-climbing algorithm:**
```csharp
// ThreadPool uses hill-climbing to find optimal thread count
// - Adds threads when throughput increases
// - Removes threads when throughput decreases
// - New thread added every ~500ms when queue is backed up

// Check current state
ThreadPool.GetMinThreads(out int minWorker, out int minIO);
ThreadPool.GetMaxThreads(out int maxWorker, out int maxIO);
ThreadPool.GetAvailableThreads(out int availWorker, out int availIO);

// Configure minimum (for faster warmup)
ThreadPool.SetMinThreads(50, 50);

// Thread injection rate: 1-2 threads per second
// This is why blocking ThreadPool threads is bad!
```

---

### 53. How async state machine generated?

The compiler transforms `async` methods into state machines.

```csharp
// Original code
public async Task<int> GetDataAsync()
{
    var data = await FetchAsync();
    return data.Length;
}

// Compiler generates (simplified):
[AsyncStateMachine(typeof(GetDataAsyncStateMachine))]
public Task<int> GetDataAsync()
{
    var stateMachine = new GetDataAsyncStateMachine
    {
        _this = this,
        _builder = AsyncTaskMethodBuilder<int>.Create(),
        _state = -1
    };
    stateMachine._builder.Start(ref stateMachine);
    return stateMachine._builder.Task;
}

private struct GetDataAsyncStateMachine : IAsyncStateMachine
{
    public int _state;
    public AsyncTaskMethodBuilder<int> _builder;
    public object _this;
    
    private TaskAwaiter<Data> _awaiter;
    private Data _data;
    
    public void MoveNext()
    {
        switch (_state)
        {
            case -1:  // Initial state
                _awaiter = FetchAsync().GetAwaiter();
                if (!_awaiter.IsCompleted)
                {
                    _state = 0;
                    _builder.AwaitUnsafeOnCompleted(ref _awaiter, ref this);
                    return;  // Suspend here
                }
                goto case 0;
                
            case 0:  // After await
                _data = _awaiter.GetResult();
                _builder.SetResult(_data.Length);
                return;
        }
    }
}
```

---

### 54. How Kestrel handles requests?

Kestrel uses an **event-driven, non-blocking I/O** model.

```
┌─────────────────────────────────────────────────────────┐
│                      Kestrel                             │
├─────────────────────────────────────────────────────────┤
│  Connection Listener (Socket/libuv/IO_Uring)            │
│              │                                          │
│              ▼                                          │
│  ┌────────────────────────────────────────┐            │
│  │        I/O Thread Pool                  │            │
│  │  [Listen] [Accept] [Read] [Write]       │            │
│  └────────────────────────────────────────┘            │
│              │                                          │
│              ▼                                          │
│  ┌────────────────────────────────────────┐            │
│  │      Connection Pipeline                │            │
│  │  [TLS] [HTTP Parser] [HTTP/2 Frames]    │            │
│  └────────────────────────────────────────┘            │
│              │                                          │
│              ▼                                          │
│  ┌────────────────────────────────────────┐            │
│  │    Application Pipeline (Middleware)    │            │
│  └────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

```csharp
// Kestrel configuration
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 100;
    options.Limits.MaxConcurrentUpgradedConnections = 100;
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
    options.Limits.MinRequestBodyDataRate = new MinDataRate(
        bytesPerSecond: 100, gracePeriod: TimeSpan.FromSeconds(10));
});

// Request processing:
// 1. Socket accept (I/O thread)
// 2. TLS handshake (if HTTPS)
// 3. HTTP parsing
// 4. Headers complete → middleware pipeline starts
// 5. Body reading (on-demand)
// 6. Response writing
// 7. Connection keep-alive or close
```

---

### 55. How middleware pipeline built?

The middleware pipeline is built using **delegates and closures**.

```csharp
// Simplified middleware pipeline construction
public class ApplicationBuilder
{
    private readonly List<Func<RequestDelegate, RequestDelegate>> _components = new();
    
    public IApplicationBuilder Use(Func<RequestDelegate, RequestDelegate> middleware)
    {
        _components.Add(middleware);
        return this;
    }
    
    public RequestDelegate Build()
    {
        RequestDelegate app = context =>
        {
            context.Response.StatusCode = 404;
            return Task.CompletedTask;
        };
        
        // Build pipeline in reverse order
        for (int i = _components.Count - 1; i >= 0; i--)
        {
            app = _components[i](app);
        }
        
        return app;
    }
}

// When you write:
app.UseMiddleware<LoggingMiddleware>();
app.UseMiddleware<AuthMiddleware>();
app.UseRouting();

// It creates:
// LoggingMiddleware(
//     AuthMiddleware(
//         RoutingMiddleware(
//             EndpointMiddleware(404))))
```

---

### 56. How dependency injection container resolves?

The DI container uses **reflection and compiled expressions** for resolution.

```csharp
// Service registration
services.AddScoped<IService, ServiceImpl>();

// Internally stored as:
// ServiceDescriptor {
//     ServiceType: typeof(IService),
//     ImplementationType: typeof(ServiceImpl),
//     Lifetime: ServiceLifetime.Scoped
// }

// Resolution process:
// 1. Look up ServiceType in dictionary
// 2. Check lifetime scope (singleton cache, scoped cache)
// 3. If not cached, create instance

// Instance creation:
// - Find constructor with most resolvable parameters
// - Recursively resolve all parameters
// - Invoke constructor (or compiled factory)

// Compiled factory for performance:
var ctor = typeof(ServiceImpl).GetConstructor(new[] { typeof(IDep1), typeof(IDep2) });
var param1 = Expression.Parameter(typeof(IServiceProvider));
var body = Expression.New(ctor,
    Expression.Call(/* resolve IDep1 */),
    Expression.Call(/* resolve IDep2 */));
var factory = Expression.Lambda<Func<IServiceProvider, object>>(body, param1).Compile();
```

---

### 57. How reflection works internally?

Reflection accesses **metadata stored in assemblies**.

```csharp
// Assembly structure:
// ┌─────────────────────────────────────┐
// │  PE Header                          │
// ├─────────────────────────────────────┤
// │  CLI Header                         │
// ├─────────────────────────────────────┤
// │  Metadata Tables                    │
// │  - TypeDef, TypeRef                 │
// │  - MethodDef, FieldDef              │
// │  - AssemblyRef, ModuleRef           │
// ├─────────────────────────────────────┤
// │  IL Code                            │
// └─────────────────────────────────────┘

// Reflection API reads these tables:
var type = typeof(MyClass);
var methods = type.GetMethods();  // Reads MethodDef table
var fields = type.GetFields();    // Reads FieldDef table

// Method invocation via reflection:
var method = type.GetMethod("DoWork");
method.Invoke(instance, new object[] { arg1, arg2 });

// Performance: ~100x slower than direct call
// Optimize with compiled delegates:
var func = (Func<MyClass, int, int>)Delegate.CreateDelegate(
    typeof(Func<MyClass, int, int>), method);
func(instance, arg);  // Fast as direct call
```

---

### 58. What happens during startup?

```
Application Startup Timeline:
────────────────────────────────────────────────────────────────
1. Host build
   └── Load configuration (appsettings.json, env vars)
   └── Configure logging
   └── Configure services (DI container)

2. Application build
   └── Build middleware pipeline
   └── Configure endpoints
   └── Initialize services

3. Host start
   └── Start hosted services (IHostedService)
   └── Start Kestrel (bind to ports)
   └── Begin accepting connections

Timeline (typical):
[0ms]     Process start
[50ms]    CLR initialization
[100ms]   Assembly loading
[200ms]   DI container build
[300ms]   Middleware pipeline build
[400ms]   Kestrel start
[500ms]   Ready for requests
────────────────────────────────────────────────────────────────
```

```csharp
// Startup hooks
builder.Services.AddHostedService<WarmupService>();

public class WarmupService : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        // Warm up caches, connections, etc.
        await _cache.WarmupAsync();
        await _dbContext.Database.OpenConnectionAsync();
    }
    
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
```

---

### 59. How .NET loads assemblies?

```csharp
// Assembly resolution order:
// 1. Already loaded assemblies
// 2. Application directory
// 3. deps.json specified paths
// 4. NuGet package cache
// 5. Framework directories
// 6. Custom AssemblyLoadContext

// Default loading
var assembly = Assembly.Load("MyLibrary");

// Load from path
var assembly = Assembly.LoadFrom("/path/to/MyLibrary.dll");

// Custom AssemblyLoadContext (isolation)
public class PluginLoadContext : AssemblyLoadContext
{
    private readonly AssemblyDependencyResolver _resolver;
    
    public PluginLoadContext(string pluginPath) : base(isCollectible: true)
    {
        _resolver = new AssemblyDependencyResolver(pluginPath);
    }
    
    protected override Assembly Load(AssemblyName assemblyName)
    {
        var path = _resolver.ResolveAssemblyToPath(assemblyName);
        return path != null ? LoadFromAssemblyPath(path) : null;
    }
}

// Load plugin in isolated context
var context = new PluginLoadContext(pluginPath);
var assembly = context.LoadFromAssemblyPath(pluginPath);
// Can unload context to unload assemblies
context.Unload();
```

---

### 60. How tiered compilation works?

**Tiered compilation** produces faster code over time.

```
┌─────────────────────────────────────────────────────────┐
│                Tiered Compilation                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tier 0 (Quick JIT):                                    │
│  - Fast compilation (~1ms per method)                   │
│  - No optimizations                                     │
│  - Used for first calls                                 │
│                                                         │
│  Tier 1 (Optimized JIT):                                │
│  - After ~30 calls (hot method)                         │
│  - Full optimizations (inlining, etc.)                  │
│  - Background recompilation                             │
│                                                         │
│  R2R (ReadyToRun):                                      │
│  - Pre-compiled, lower quality                          │
│  - Can be tiered up to Tier 1                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

```csharp
// Disable tiered compilation for specific method
[MethodImpl(MethodImplOptions.AggressiveOptimization)]
public void HotPath()
{
    // Will be fully optimized from start
}

// Configuration
// <TieredCompilation>true</TieredCompilation>
// <TieredCompilationQuickJit>true</TieredCompilationQuickJit>
```

---

### 61. What is R2R?

**ReadyToRun (R2R)** is ahead-of-time compilation for faster startup.

```bash
# Publish with R2R
dotnet publish -c Release -r win-x64 --self-contained -p:PublishReadyToRun=true

# R2R images contain:
# 1. IL code (for portability)
# 2. Native code (for fast startup)
```

```
┌─────────────────────────────────────────┐
│          R2R Assembly                    │
├─────────────────────────────────────────┤
│  IL Code (always present)               │
│  +                                      │
│  Pre-compiled native code               │
│  (Windows-x64 specific)                 │
└─────────────────────────────────────────┘

Execution:
- First call: Use pre-compiled code (fast)
- Hot methods: Recompiled with full optimizations (tiered up)
```

**Tradeoffs:**
- Faster startup
- Larger file size (~2x)
- Platform-specific

---

### 62. What is AOT?

**AOT (Ahead-Of-Time)** compilation produces native executables.

```bash
# Native AOT publish
dotnet publish -c Release -r win-x64 -p:PublishAot=true

# Produces single native executable
# - No .NET runtime needed
# - ~10ms startup (vs ~100ms with JIT)
# - Smaller memory footprint
```

**Limitations:**
```csharp
// These don't work with AOT:

// ❌ Dynamic code generation
var type = Type.GetType(typeName);
Activator.CreateInstance(type);

// ❌ Unrestricted reflection
typeof(MyClass).GetMethod("Secret").Invoke(...);

// ✓ Must use source generators or explicit preservation
[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)]
public Type MyType { get; set; }
```

---

### 63. What is trimming?

**Trimming** removes unused code to reduce application size.

```bash
# Enable trimming
dotnet publish -c Release -r win-x64 --self-contained -p:PublishTrimmed=true
```

```csharp
// Trimming levels
// <TrimMode>link</TrimMode>  // Aggressive (member-level)
// <TrimMode>copyused</TrimMode>  // Conservative (assembly-level)

// Preserve members from trimming
[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)]
public class MyClass { }

// Preserve entire type
[Preserve]
public class DoNotTrim { }

// Warnings for unsafe patterns
[RequiresUnreferencedCode("Calls Type.GetType")]
public void UnsafeMethod()
{
    var type = Type.GetType(someString);  // Trimmer can't analyze
}
```

---

### 64. What is memory fragmentation?

**Fragmentation** occurs when free memory is scattered in small chunks.

```
Before (fragmented):
[Object A][    ][Object B][      ][Object C][    ]
          Free           Free               Free

After compaction:
[Object A][Object B][Object C][                  ]
                               Large contiguous free
```

```csharp
// Pinning causes fragmentation
var handle = GCHandle.Alloc(array, GCHandleType.Pinned);
// Pinned objects can't be moved during compaction

// LOH fragmentation (Gen 2)
// Objects >= 85,000 bytes go to LOH
// LOH not compacted by default

// Enable LOH compaction (expensive)
GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;
GC.Collect();

// Check fragmentation
var info = GC.GetGCMemoryInfo();
Console.WriteLine($"Fragmentation: {info.FragmentedBytes}");
```

---

### 65. What is LOH?

**Large Object Heap (LOH)** stores objects >= 85,000 bytes.

```csharp
// Goes to LOH
var largeArray = new byte[85000];  // LOH

// Small array stays in Gen 0
var smallArray = new byte[1000];   // Gen 0

// LOH characteristics:
// - Collected with Gen 2 (expensive)
// - Not compacted by default
// - Fragmentation prone

// Avoid LOH allocation patterns
// ❌ Bad: Many allocations/deallocations
for (int i = 0; i < 1000; i++)
{
    var buffer = new byte[100000];  // LOH allocation
    Process(buffer);
}

// ✓ Good: Reuse or pool
var buffer = ArrayPool<byte>.Shared.Rent(100000);
try
{
    Process(buffer);
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}
```

---

### 66. What is pinning?

**Pinning** prevents the GC from moving an object in memory.

```csharp
// Fixed statement pins for duration
unsafe void UsePointer(byte[] data)
{
    fixed (byte* ptr = data)
    {
        // data won't move while in this block
        NativeMethod(ptr);
    }
}

// GCHandle for longer pinning
var handle = GCHandle.Alloc(data, GCHandleType.Pinned);
try
{
    IntPtr ptr = handle.AddrOfPinnedObject();
    NativeMethod(ptr);
}
finally
{
    handle.Free();  // Don't forget!
}

// Problems with pinning:
// - Causes fragmentation
// - Blocks compaction
// - Degrades GC performance

// Modern alternative: Memory<T> with native memory
using var memory = MemoryPool<byte>.Shared.Rent(1024);
// No pinning needed for many scenarios
```

---

### 67. What is finalizer queue?

**Finalizer queue** holds objects with finalizers waiting to be finalized.

```csharp
public class ResourceHolder
{
    ~ResourceHolder()  // Destructor/Finalizer
    {
        // Cleanup unmanaged resources
    }
}

// Finalization flow:
// 1. Object becomes unreachable
// 2. GC moves object to Finalization Queue
// 3. Finalizer thread runs ~ResourceHolder()
// 4. Object becomes "finalized"
// 5. Next GC collects the object

// This means finalized objects survive at least 2 GC cycles!
```

**Proper cleanup pattern:**
```csharp
public class ResourceHolder : IDisposable
{
    private IntPtr _handle;
    private bool _disposed;
    
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);  // Skip finalizer
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        
        if (disposing)
        {
            // Dispose managed resources
        }
        
        // Always cleanup unmanaged
        CloseHandle(_handle);
        _disposed = true;
    }
    
    ~ResourceHolder() => Dispose(false);
}
```

---

### 68. What is GC pause?

**GC pause** is when application threads are suspended for garbage collection.

```csharp
// Pause types:
// - Ephemeral (Gen 0/1): ~1-10ms
// - Full (Gen 2): 10-100ms+
// - Background GC: Reduced pauses

// Measure pause time
GC.RegisterForFullGCNotification(10, 10);

var status = GC.WaitForFullGCApproach();
if (status == GCNotificationStatus.Succeeded)
{
    // GC is about to happen
    Console.WriteLine("Full GC approaching");
}

status = GC.WaitForFullGCComplete();
if (status == GCNotificationStatus.Succeeded)
{
    Console.WriteLine("Full GC completed");
}

// Minimize pause impact:
// 1. Use Server GC for throughput
// 2. Reduce allocations
// 3. Avoid Gen 2 collections
// 4. Keep heap small
```

---

### 69. What is Server GC?

**Server GC** optimizes for high-throughput multi-processor scenarios.

```xml
<!-- Enable Server GC -->
<PropertyGroup>
  <ServerGarbageCollection>true</ServerGarbageCollection>
  <ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>
</PropertyGroup>
```

| Aspect | Workstation GC | Server GC |
|--------|----------------|-----------|
| Heaps | Single | One per CPU core |
| Threads | Concurrent thread | Multiple GC threads |
| Throughput | Lower | Higher |
| Latency | Optimized | Higher pauses |
| Memory | Lower | Higher |
| Best for | Desktop apps | Web servers |

```csharp
// Check GC mode
Console.WriteLine($"Server GC: {GCSettings.IsServerGC}");
Console.WriteLine($"Concurrent GC: {GCSettings.LatencyMode}");
```

---

### 70. What is Workstation GC?

**Workstation GC** optimizes for responsiveness on single-CPU or interactive apps.

```csharp
// Characteristics:
// - Single heap
// - Single GC thread
// - Lower memory overhead
// - More frequent, shorter pauses
// - Better for UI applications

// Default for console apps and UI apps
<PropertyGroup>
  <ServerGarbageCollection>false</ServerGarbageCollection>
</PropertyGroup>

// Background workstation GC (default)
// Allows threads to run during Gen 2 collection
```

---

### 71. What is concurrent GC?

**Concurrent (Background) GC** performs most work alongside application threads.

```
Without Background GC:
[App Threads Running] [GC PAUSE - all stopped] [App Threads Running]

With Background GC:
[App Threads Running] [Background GC Working] [Short pause] [Running]
        └──────────────────────┬──────────────────────┘
                   App runs during most of GC
```

```csharp
// Configure latency mode
GCSettings.LatencyMode = GCLatencyMode.Batch;          // Throughput priority
GCSettings.LatencyMode = GCLatencyMode.Interactive;   // Balance
GCSettings.LatencyMode = GCLatencyMode.LowLatency;    // Minimize pauses
GCSettings.LatencyMode = GCLatencyMode.SustainedLowLatency; // Avoid Gen 2

// Temporary no-GC region
if (GC.TryStartNoGCRegion(1024 * 1024))  // 1MB
{
    try
    {
        // Critical low-latency code
        // No GC will occur (if allocation stays within limit)
    }
    finally
    {
        GC.EndNoGCRegion();
    }
}
```

---

### 72. What is allocation pressure?

**Allocation pressure** is the rate of memory allocation that triggers GC.

```csharp
// ❌ High allocation pressure
public List<string> ProcessItems(IEnumerable<Item> items)
{
    var results = new List<string>();
    foreach (var item in items)
    {
        results.Add(item.Name.ToUpper());     // String allocation
        results.Add(string.Format("{0}", item.Id));  // String allocation
        results.Add(item.ToString());          // String allocation
    }
    return results;
}

// ✓ Reduced allocation pressure
public void ProcessItems(IEnumerable<Item> items, IBufferWriter<char> output)
{
    foreach (var item in items)
    {
        item.Name.AsSpan().ToUpperInvariant(output.GetSpan());
        // Minimal allocations using spans
    }
}

// Monitor allocations
var before = GC.GetAllocatedBytesForCurrentThread();
ProcessItems(items);
var allocated = GC.GetAllocatedBytesForCurrentThread() - before;
Console.WriteLine($"Allocated: {allocated} bytes");
```

---

### 73. What is CPU bound vs IO bound?

| CPU Bound | I/O Bound |
|-----------|-----------|
| Compute-intensive | Waiting on external resources |
| Uses CPU cycles | Waiting on disk, network, DB |
| Benefits from more cores | Benefits from async |
| Use Parallel/Task.Run | Use async/await |

```csharp
// CPU Bound - use parallelism
public int[] ProcessCpuBound(int[] data)
{
    return data.AsParallel()
        .Select(x => HeavyComputation(x))
        .ToArray();
}

// I/O Bound - use async
public async Task<string[]> ProcessIOBoundAsync(string[] urls)
{
    var tasks = urls.Select(url => _httpClient.GetStringAsync(url));
    return await Task.WhenAll(tasks);
}

// Don't mix them up!
// ❌ Task.Run for I/O
await Task.Run(() => _httpClient.GetStringAsync(url));  // Wastes thread

// ❌ Sync-over-async for CPU
Parallel.ForEach(urls, url =>
{
    var result = _httpClient.GetStringAsync(url).Result;  // Blocks thread!
});
```

---

### 74. What is thread affinity?

**Thread affinity** binds work to a specific thread.

```csharp
// UI thread affinity (WPF/WinForms)
// UI controls can only be accessed from the thread that created them

private void Button_Click()
{
    Task.Run(async () =>
    {
        var data = await FetchDataAsync();
        
        // ❌ Wrong thread!
        // label.Text = data;
        
        // ✓ Marshal to UI thread
        Dispatcher.Invoke(() => label.Text = data);
    });
}

// Set processor affinity
var currentThread = Thread.CurrentThread;
Process.GetCurrentProcess().ProcessorAffinity = (IntPtr)0x1;  // CPU 0 only

// Thread-local storage
private static readonly ThreadLocal<int> _threadId = new(() => Thread.CurrentThread.ManagedThreadId);
```

---

### 75. What is sync-over-async issue?

**Sync-over-async** blocks threads waiting for async operations, causing deadlocks and thread starvation.

```csharp
// ❌ Dangerous patterns
public void BadMethod()
{
    var result = GetDataAsync().Result;  // Blocks!
    var result2 = GetDataAsync().GetAwaiter().GetResult();  // Still blocks!
    GetDataAsync().Wait();  // Blocks!
}

// Deadlock scenario (UI/ASP.NET Framework):
public void Button_Click()
{
    var result = GetDataAsync().Result;  // Blocks UI thread
}

public async Task<string> GetDataAsync()
{
    await Task.Delay(100);  // Needs to resume on UI thread
    return "data";          // But UI thread is blocked!
}

// ✓ Fix: Async all the way
public async void Button_Click()
{
    var result = await GetDataAsync();
}

// ✓ Or ConfigureAwait(false) in library
public async Task<string> GetDataAsync()
{
    await Task.Delay(100).ConfigureAwait(false);
    return "data";
}
```

---

### 76. What is blocking call detection?

Tools and techniques to detect blocking calls in async code.

```csharp
// 1. Async analyzer (IDE warnings)
// Install: Microsoft.VisualStudio.Threading.Analyzers

// 2. Ben.BlockingDetector (runtime detection)
// using var detector = BlockingDetector.BlockOnSyncContext;
// Throws when blocking detected

// 3. Thread pool starvation detection
ThreadPool.GetAvailableThreads(out int workerAvailable, out int _);
ThreadPool.GetMaxThreads(out int workerMax, out int _);
var starvation = (workerMax - workerAvailable) / (double)workerMax;
if (starvation > 0.8)
{
    _logger.LogWarning("Thread pool starvation detected");
}

// 4. Event counters
dotnet-counters monitor -n MyApp --counters System.Runtime
// Watch: ThreadPool Thread Count, ThreadPool Queue Length
```

---

### 77. What is event loop?

.NET uses **event loops** in certain contexts (Kestrel, UI frameworks).

```csharp
// Conceptual event loop:
while (running)
{
    var events = WaitForEvents();  // epoll/kqueue/IOCP
    
    foreach (var evt in events)
    {
        switch (evt.Type)
        {
            case SocketReadable:
                var data = evt.Socket.Read();
                ProcessRequest(data);
                break;
            case SocketWritable:
                FlushPendingWrites(evt.Socket);
                break;
        }
    }
}

// Kestrel uses multiple I/O threads with event loops
// Each thread handles many connections non-blockingly

// Node.js-style single-threaded event loop is NOT .NET's model
// .NET uses thread pool + async I/O
```

---

### 78. What is socket pipeline?

**Socket pipelines** in Kestrel use `System.IO.Pipelines` for efficient I/O.

```csharp
// Pipeline concept
// Producer writes to PipeWriter
// Consumer reads from PipeReader
// Zero-copy buffer management

public async Task ProcessConnection(Socket socket)
{
    var pipe = new Pipe();
    
    var writing = FillPipeAsync(socket, pipe.Writer);
    var reading = ReadPipeAsync(pipe.Reader);
    
    await Task.WhenAll(reading, writing);
}

async Task FillPipeAsync(Socket socket, PipeWriter writer)
{
    while (true)
    {
        Memory<byte> memory = writer.GetMemory(512);
        int bytesRead = await socket.ReceiveAsync(memory, SocketFlags.None);
        
        if (bytesRead == 0) break;
        
        writer.Advance(bytesRead);
        await writer.FlushAsync();
    }
    
    writer.Complete();
}

async Task ReadPipeAsync(PipeReader reader)
{
    while (true)
    {
        ReadResult result = await reader.ReadAsync();
        ReadOnlySequence<byte> buffer = result.Buffer;
        
        // Process buffer (parse HTTP, etc.)
        ProcessLine(buffer);
        
        reader.AdvanceTo(buffer.End);
        
        if (result.IsCompleted) break;
    }
}
```

---

### 79. What is HTTP/2 multiplexing?

**HTTP/2 multiplexing** sends multiple requests over a single TCP connection.

```
HTTP/1.1 (sequential):
Connection 1: [Request A] → [Response A] → [Request B] → [Response B]
Connection 2: [Request C] → [Response C]

HTTP/2 (multiplexed):
Connection 1: [Frame A1][Frame B1][Frame C1][Frame A2][Frame B2][Frame C2]
              └─ Request A ─┘└─ Request B ─┘└─ Request C ─┘
```

```csharp
// HTTP/2 in HttpClient
var handler = new SocketsHttpHandler
{
    EnableMultipleHttp2Connections = true
};
var client = new HttpClient(handler)
{
    DefaultRequestVersion = HttpVersion.Version20,
    DefaultVersionPolicy = HttpVersionPolicy.RequestVersionOrHigher
};

// Kestrel HTTP/2 configuration
builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureEndpointDefaults(endpoints =>
    {
        endpoints.Protocols = HttpProtocols.Http2;
    });
    options.Limits.Http2.MaxStreamsPerConnection = 100;
    options.Limits.Http2.InitialConnectionWindowSize = 128 * 1024;
});
```

---

### 80. What is TLS handshake?

**TLS handshake** establishes a secure connection.

```
Client                                 Server
  |                                      |
  |──── ClientHello ────────────────────▶|
  |     (supported ciphers, TLS version) |
  |                                      |
  |◀──── ServerHello ────────────────────|
  |     (selected cipher, certificate)   |
  |                                      |
  |──── Key Exchange ───────────────────▶|
  |     (pre-master secret)              |
  |                                      |
  |◀──── Finished ───────────────────────|
  |                                      |
  |──── Encrypted Data ─────────────────▶|
  |                                      |
```

```csharp
// Configure TLS in Kestrel
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(443, listenOptions =>
    {
        listenOptions.UseHttps(httpsOptions =>
        {
            httpsOptions.SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13;
            httpsOptions.ServerCertificate = certificate;
        });
    });
});

// Client TLS configuration
var handler = new SocketsHttpHandler
{
    SslOptions = new SslClientAuthenticationOptions
    {
        EnabledSslProtocols = SslProtocols.Tls13,
        CertificateRevocationCheckMode = X509RevocationMode.Online
    }
};
```

---

### 81-100. Quick Runtime Internals

**81. What is Span memory layout?**
```csharp
// Span<T> is a ref struct:
// - Reference to memory
// - Length
// Stack-only, cannot escape to heap
```

**82. What is stackalloc?**
```csharp
Span<int> numbers = stackalloc int[100];  // On stack, very fast
```

**83. What is pooling effect on GC?**
- Reduces allocations → fewer collections
- Objects stay in Gen 2 → less movement

**84. What is struct layout?**
```csharp
[StructLayout(LayoutKind.Sequential)]  // Fields in order
[StructLayout(LayoutKind.Explicit)]    // Manual offsets
```

**85. What is volatile?**
```csharp
private volatile bool _flag;  // No caching, memory barrier
```

**86. What is memory barrier?**
- Prevents CPU/compiler reordering
- `Thread.MemoryBarrier()`

**87. What is interlocked?**
```csharp
Interlocked.Increment(ref _counter);  // Atomic operation
```

**88. What is compare exchange?**
```csharp
Interlocked.CompareExchange(ref _value, newValue, expectedValue);
```

**89. What is lock escalation?**
- SQL Server: Row lock → Page lock → Table lock

**90. What is cache line?**
- CPU cache unit (64 bytes typically)
- False sharing when threads access same line

**91. What is false sharing?**
```csharp
// Separate cache lines with padding
[StructLayout(LayoutKind.Explicit, Size = 128)]
struct PaddedInt { [FieldOffset(0)] public int Value; }
```

**92. What is NUMA?**
- Non-Uniform Memory Access
- Memory access time varies by CPU/memory location

**93. What is memory alignment?**
- Data aligned to word boundaries for faster access

**94. What is branch prediction?**
- CPU predicts branch outcomes for pipeline efficiency

**95. What is JIT inlining?**
```csharp
[MethodImpl(MethodImplOptions.AggressiveInlining)]
public int SmallMethod() => _value;  // Hint to inline
```

**96. What is tail call?**
- Optimization for recursive calls
- .NET JIT limited support

**97. What is assembly binding redirect?**
```xml
<dependentAssembly>
  <assemblyIdentity name="Newtonsoft.Json" />
  <bindingRedirect oldVersion="0.0.0.0-13.0.0.0" newVersion="13.0.0.0" />
</dependentAssembly>
```

**98. What is reflection emit?**
```csharp
var method = new DynamicMethod("Add", typeof(int), new[] { typeof(int), typeof(int) });
var il = method.GetILGenerator();
il.Emit(OpCodes.Ldarg_0);
il.Emit(OpCodes.Ldarg_1);
il.Emit(OpCodes.Add);
il.Emit(OpCodes.Ret);
```

**99. What is dynamic proxy?**
- Runtime class generation implementing interfaces
- Used by mocking frameworks, ORMs

**100. What is expression tree compilation?**
```csharp
Expression<Func<int, int>> expr = x => x * 2;
Func<int, int> compiled = expr.Compile();  // Creates delegate
```

---

## Summary

| Concept | Key Point |
|---------|-----------|
| GC Generations | Gen 0 (fast), Gen 1 (buffer), Gen 2 (long-lived) |
| ThreadPool | Hill-climbing, slow scaling |
| Async State Machine | Compiler-generated IAsyncStateMachine |
| Kestrel | Event-driven, libuv/IO_Uring |
| DI Resolution | Reflection + compiled factories |
| Tiered Compilation | Quick JIT → Optimized JIT |
| R2R/AOT | Pre-compiled native code |
| LOH | Large objects, fragmentation risk |
| Server vs Workstation GC | Throughput vs responsiveness |
| Sync-over-async | Causes deadlocks, starvation |
| Span<T> | Stack-only, zero-allocation slicing |
| Pipelines | High-performance I/O |

---

*Next: [Part 12 - Enterprise & Financial Systems](12-advanced-enterprise-financial.md)*
