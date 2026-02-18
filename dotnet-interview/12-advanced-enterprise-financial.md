# Advanced .NET & SQL - Expert Level
## Enterprise, Financial Systems & Deep Technical Questions

---

## Part 1: Advanced SQL Queries

### Running Totals with Window Functions
```sql
-- Running balance per account
SELECT 
    TransactionId,
    AccountId,
    Amount,
    SUM(Amount) OVER (PARTITION BY AccountId ORDER BY CreatedAt ROWS UNBOUNDED PRECEDING) AS RunningBalance
FROM Transactions;
```

### Gap Detection (Missing Sequences)
```sql
WITH Numbered AS (
    SELECT OrderId, ROW_NUMBER() OVER (ORDER BY OrderId) AS rn
    FROM Orders
)
SELECT a.OrderId + 1 AS GapStart, b.OrderId - 1 AS GapEnd
FROM Numbered a
JOIN Numbered b ON a.rn + 1 = b.rn
WHERE b.OrderId - a.OrderId > 1;
```

### Recursive CTE - Hierarchical Data
```sql
WITH OrgHierarchy AS (
    SELECT EmployeeId, Name, ManagerId, 0 AS Level
    FROM Employees WHERE ManagerId IS NULL
    
    UNION ALL
    
    SELECT e.EmployeeId, e.Name, e.ManagerId, h.Level + 1
    FROM Employees e
    JOIN OrgHierarchy h ON e.ManagerId = h.EmployeeId
)
SELECT * FROM OrgHierarchy;
```

### Consecutive Events Detection
```sql
WITH Grouped AS (
    SELECT *,
        ROW_NUMBER() OVER (ORDER BY EventDate) -
        ROW_NUMBER() OVER (PARTITION BY EventType ORDER BY EventDate) AS Grp
    FROM Events
)
SELECT EventType, MIN(EventDate) AS StartDate, MAX(EventDate) AS EndDate, COUNT(*) AS Streak
FROM Grouped
GROUP BY EventType, Grp
HAVING COUNT(*) >= 3;
```

### Pivot with Dynamic Columns
```sql
DECLARE @cols NVARCHAR(MAX), @sql NVARCHAR(MAX);

SELECT @cols = STRING_AGG(QUOTENAME(Month), ',') 
FROM (SELECT DISTINCT MONTH(OrderDate) AS Month FROM Orders) m;

SET @sql = N'
SELECT CustomerId, ' + @cols + '
FROM (SELECT CustomerId, MONTH(OrderDate) AS Month, Total FROM Orders) src
PIVOT (SUM(Total) FOR Month IN (' + @cols + ')) pvt';

EXEC sp_executesql @sql;
```

### Lead/Lag for Change Detection
```sql
SELECT 
    ProductId,
    Price,
    LAG(Price) OVER (PARTITION BY ProductId ORDER BY EffectiveDate) AS PrevPrice,
    Price - LAG(Price) OVER (PARTITION BY ProductId ORDER BY EffectiveDate) AS PriceChange,
    CASE WHEN Price > LAG(Price) OVER (PARTITION BY ProductId ORDER BY EffectiveDate) 
         THEN 'UP' ELSE 'DOWN' END AS Direction
FROM PriceHistory;
```

### Median Calculation
```sql
SELECT ProductId,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY Price) OVER (PARTITION BY ProductId) AS MedianPrice
FROM Products;
```

### Top N Per Group
```sql
WITH Ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY CategoryId ORDER BY Sales DESC) AS rn
    FROM Products
)
SELECT * FROM Ranked WHERE rn <= 3;
```

### Cumulative Distribution
```sql
SELECT 
    CustomerId,
    TotalSpent,
    CUME_DIST() OVER (ORDER BY TotalSpent) AS CumulativeDistribution,
    NTILE(4) OVER (ORDER BY TotalSpent) AS Quartile
FROM CustomerSpending;
```

### Deadlock-Resistant Upsert
```sql
MERGE INTO Products WITH (HOLDLOCK) AS target
USING (SELECT @Id AS Id, @Name AS Name, @Price AS Price) AS source
ON target.Id = source.Id
WHEN MATCHED THEN UPDATE SET Name = source.Name, Price = source.Price
WHEN NOT MATCHED THEN INSERT (Id, Name, Price) VALUES (source.Id, source.Name, source.Price);
```

### Optimized Pagination
```sql
-- Keyset pagination (faster than OFFSET for large datasets)
SELECT TOP 20 * FROM Orders
WHERE (OrderDate, OrderId) > (@LastDate, @LastId)
ORDER BY OrderDate, OrderId;
```

### Island Detection (Date Ranges)
```sql
WITH Islands AS (
    SELECT *,
        DATEADD(DAY, -ROW_NUMBER() OVER (PARTITION BY UserId ORDER BY LoginDate), LoginDate) AS Island
    FROM Logins
)
SELECT UserId, MIN(LoginDate) AS IslandStart, MAX(LoginDate) AS IslandEnd, COUNT(*) AS ConsecutiveDays
FROM Islands
GROUP BY UserId, Island;
```

---

## Part 2: Advanced Interview Q&A (Brief)

### Memory & GC

**Q: How does Pinned Object Heap (POH) differ from LOH?**
POH (.NET 5+) stores pinned objects separately, preventing LOH fragmentation. Objects explicitly allocated via `GC.AllocateArray<T>(length, pinned: true)`.

**Q: What triggers a GC?**
Gen 0 threshold, LOH allocation, `GC.Collect()`, low memory notification, induced by runtime.

**Q: How to detect memory leak in production?**
```csharp
// Dump analysis
dotnet-dump collect -p <pid>
dotnet-dump analyze <dump>
> dumpheap -stat
> gcroot <address>
```

**Q: What's the difference between `GC.GetTotalMemory(false)` and `GC.GetTotalMemory(true)`?**
`false`: approximate. `true`: forces full GC first, returns accurate value.

---

### Threading & Async

**Q: `ValueTask` rules?**
1. Await once only
2. Never `.Result` or `.Wait()`
3. Never await concurrently
4. Don't use with `Task.WhenAll`

**Q: How to implement async lock?**
```csharp
private readonly SemaphoreSlim _lock = new(1, 1);
await _lock.WaitAsync();
try { /* work */ }
finally { _lock.Release(); }
```

**Q: What causes `ThreadPool` starvation?**
Blocking sync calls on pool threads (`.Result`, `.Wait()`, `Thread.Sleep`). Solution: async all the way.

**Q: Difference between `Task.Run` and `Task.Factory.StartNew`?**
`Task.Run`: unwraps nested tasks, uses `TaskScheduler.Default`. `StartNew`: more control, doesn't unwrap.

---

### Performance

**Q: How to reduce allocations in hot path?**
- `Span<T>`, `stackalloc`
- `ArrayPool<T>.Shared`
- `ref struct`, `readonly struct`
- Object pooling
- String interning or `StringBuilder`

**Q: What's `[SkipLocalsInit]`?**
Skips zero-initialization of locals. Unsafe but faster for performance-critical code.

**Q: How to benchmark accurately?**
```csharp
[MemoryDiagnoser]
[DisassemblyDiagnoser]
public class Bench
{
    [Benchmark(Baseline = true)]
    public int Method1() => ...;
}
// dotnet run -c Release
```

---

### EF Core Deep

**Q: How to handle optimistic concurrency conflict?**
```csharp
catch (DbUpdateConcurrencyException ex)
{
    var entry = ex.Entries.Single();
    var dbValues = await entry.GetDatabaseValuesAsync();
    entry.OriginalValues.SetValues(dbValues); // Client wins
    await _context.SaveChangesAsync();
}
```

**Q: Split query vs single query?**
Split: avoids Cartesian explosion, multiple roundtrips. Single: one query, data duplication risk.

**Q: How EF tracks changes?**
Snapshot tracking: stores original values on query. Compares on `SaveChanges`. Change tracker notification for proxies.

---

### Security

**Q: How to prevent JWT theft?**
- Short expiry (15min)
- Refresh token rotation
- Bind to client fingerprint
- Store refresh token securely (HttpOnly cookie)

**Q: What's the risk of `[FromBody]` without validation?**
Mass assignment attacks. Always use DTOs with explicit properties.

**Q: How to implement rate limiting per user AND per IP?**
```csharp
options.AddPolicy("combined", context =>
    RateLimitPartition.GetTokenBucketLimiter(
        $"{context.User.Identity?.Name}:{context.Connection.RemoteIpAddress}",
        _ => new TokenBucketRateLimiterOptions { ... }));
```

---

## Part 3: System Design Q&A (Brief)

**Q: Design idempotent API**
- Idempotency key in header
- Store key + response in Redis (24h TTL)
- Lock during processing
- Return cached result on retry

**Q: How to handle distributed transactions without 2PC?**
Saga pattern with compensating transactions. Or Outbox pattern for reliable event publishing.

**Q: Design rate limiter for 1M RPS**
- Token bucket at edge (CDN/Gateway)
- Redis Lua script for atomic operations
- Local cache with periodic sync

**Q: Prevent double payment**
```csharp
// 1. Unique idempotency key
// 2. Database unique constraint on (idempotency_key, status)
// 3. SELECT FOR UPDATE before charging
// 4. State machine: Pending -> Processing -> Completed/Failed
```

**Q: How to scale WebSocket connections?**
- Redis pub/sub backplane
- Sticky sessions or connection state in Redis
- Multiple SignalR servers behind load balancer

**Q: Event sourcing vs state-based?**
Event sourcing: append-only events, rebuild state. State-based: store current state. ES better for audit, complex domains. State-based simpler, faster reads.

**Q: How to implement exactly-once processing?**
Idempotent consumers + deduplication. Store processed message IDs. Outbox + Inbox patterns.

---

## Part 4: Financial System Specifics

### Double-Entry Ledger
```csharp
public async Task Transfer(Guid from, Guid to, decimal amount)
{
    var entries = new[]
    {
        new LedgerEntry { AccountId = from, Amount = -amount, Type = EntryType.Debit },
        new LedgerEntry { AccountId = to, Amount = amount, Type = EntryType.Credit }
    };
    
    if (entries.Sum(e => e.Amount) != 0)
        throw new UnbalancedEntryException();
    
    await _context.LedgerEntries.AddRangeAsync(entries);
}
```

### Balance Snapshot with Point-in-Time Query
```sql
SELECT AccountId, 
    SUM(Amount) AS Balance,
    MAX(CreatedAt) AS AsOf
FROM LedgerEntries
WHERE CreatedAt <= @PointInTime
GROUP BY AccountId;
```

### Reconciliation Query
```sql
WITH Expected AS (
    SELECT AccountId, SUM(Amount) AS ExpectedBalance FROM LedgerEntries GROUP BY AccountId
),
Actual AS (
    SELECT AccountId, Balance AS ActualBalance FROM AccountSnapshots WHERE SnapshotDate = @Date
)
SELECT e.AccountId, e.ExpectedBalance, a.ActualBalance, 
    e.ExpectedBalance - ISNULL(a.ActualBalance, 0) AS Variance
FROM Expected e
LEFT JOIN Actual a ON e.AccountId = a.AccountId
WHERE ABS(e.ExpectedBalance - ISNULL(a.ActualBalance, 0)) > 0.01;
```

### Atomic Balance Update
```sql
UPDATE Accounts 
SET Balance = Balance - @Amount, Version = Version + 1
WHERE Id = @AccountId AND Balance >= @Amount AND Version = @ExpectedVersion;

IF @@ROWCOUNT = 0
    RAISERROR('Insufficient funds or version conflict', 16, 1);
```

### High-Frequency Order Matching
```csharp
public class MatchingEngine
{
    private readonly SortedSet<Order> _bids = new(new OrderComparer(descending: true));
    private readonly SortedSet<Order> _asks = new(new OrderComparer(descending: false));
    
    public List<Trade> Match(Order order)
    {
        var trades = new List<Trade>();
        var book = order.Side == Side.Buy ? _asks : _bids;
        
        while (order.Remaining > 0 && book.Any() && CanMatch(order, book.Min))
        {
            var match = book.Min;
            var qty = Math.Min(order.Remaining, match.Remaining);
            trades.Add(new Trade(order, match, qty, match.Price));
            order.Remaining -= qty;
            match.Remaining -= qty;
            if (match.Remaining == 0) book.Remove(match);
        }
        
        if (order.Remaining > 0)
            (order.Side == Side.Buy ? _bids : _asks).Add(order);
        
        return trades;
    }
}
```

---

## Part 5: Quick Fire Expert Q&A

| Question | Answer |
|----------|--------|
| `volatile` vs `Interlocked`? | `volatile`: visibility only. `Interlocked`: atomicity + visibility |
| `IAsyncDisposable` when? | Async cleanup (DB connections, streams) |
| Source generators vs reflection? | Compile-time vs runtime. Generators: AOT-friendly, faster |
| `record struct` vs `readonly struct`? | `record struct`: value equality + `with`. Both immutable |
| Channel vs BlockingCollection? | Channel: async-native. BC: sync-based |
| Span limitations? | Stack-only, no async, no heap storage |
| `nint`/`nuint`? | Platform-sized integers for interop |
| `Unsafe.As<T>`? | Reinterpret cast without copy. Dangerous |
| `CollectionsMarshal.GetValueRefOrAddDefault`? | Dictionary value by ref (avoid double lookup) |
| `FrozenDictionary`? | Immutable, optimized read. .NET 8+ |

---

## Part 6: Optimization Patterns

### Avoid Closure Allocation
```csharp
// ❌ Captures 'id' in closure (heap allocation)
var result = items.Where(x => x.Id == id);

// ✓ No allocation
var result = items.Where((x, state) => x.Id == state, id);
```

### Struct Enumerator
```csharp
public struct Enumerator : IEnumerator<T>
{
    // Avoids boxing when foreach'd
}
```

### Inline Array (.NET 8)
```csharp
[InlineArray(16)]
public struct Buffer16
{
    private byte _first;
}
```

### Zero-Allocation Logging
```csharp
[LoggerMessage(Level = LogLevel.Information, Message = "Processing {Id}")]
static partial void LogProcessing(ILogger logger, int id);
```

---

## Part 7: Critical Architecture Patterns

### CQRS Write Model
```csharp
public class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, Guid>
{
    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Items); // Rich domain
        await _repo.AddAsync(order);
        await _eventPublisher.PublishAsync(new OrderPlacedEvent(order.Id));
        return order.Id;
    }
}
```

### CQRS Read Model
```csharp
public class GetOrderHandler : IRequestHandler<GetOrderQuery, OrderDto>
{
    public async Task<OrderDto> Handle(GetOrderQuery query, CancellationToken ct)
    {
        return await _connection.QueryFirstAsync<OrderDto>(
            "SELECT * FROM OrderReadModel WHERE Id = @Id", new { query.Id });
    }
}
```

### Outbox Pattern
```csharp
// Same transaction
_context.Orders.Add(order);
_context.OutboxMessages.Add(new OutboxMessage(nameof(OrderCreated), order.Id));
await _context.SaveChangesAsync();

// Background worker publishes and marks processed
```

### Inbox Pattern (Idempotent Consumer)
```csharp
public async Task HandleAsync(OrderCreatedEvent evt)
{
    if (await _inbox.ExistsAsync(evt.MessageId))
        return; // Already processed
    
    await ProcessEventAsync(evt);
    await _inbox.MarkProcessedAsync(evt.MessageId);
}
```

---

## Summary - What Experts Know

1. **Memory**: Span, stackalloc, pooling, GC generations, pinning, LOH/POH
2. **Async**: State machines, ConfigureAwait, ValueTask rules, SynchronizationContext
3. **SQL**: Window functions, CTEs, execution plans, index design, isolation levels
4. **Concurrency**: Lock-free patterns, Interlocked, volatile, memory barriers
5. **Architecture**: CQRS, event sourcing, saga, outbox/inbox patterns
6. **Performance**: BenchmarkDotNet, allocation profiling, hot path optimization
7. **Reliability**: Idempotency, circuit breakers, retry policies, distributed tracing

---

*This completes the advanced .NET interview guide.*
