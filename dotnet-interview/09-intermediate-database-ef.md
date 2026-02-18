# .NET Interview Guide - Intermediate Level
## Part 9: Database & EF Optimization (Questions 121-150)

---

### 121. What is execution plan?

An **execution plan** shows how the database engine executes a query.

```sql
-- SQL Server
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

EXPLAIN SELECT * FROM Orders WHERE CustomerId = 5;

-- Or graphical plan in SSMS
-- Ctrl + L (Estimated plan)
-- Ctrl + M (Include actual plan)
```

**Key elements to analyze:**
- **Scan vs Seek**: Seek is better (uses index)
- **Cost %**: Higher = more expensive
- **Rows**: Estimated vs actual
- **Join types**: Nested Loop, Hash, Merge

```csharp
// EF Core - log generated SQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)
           .EnableSensitiveDataLogging()
           .LogTo(Console.WriteLine, LogLevel.Information));

// Get query string
var query = _context.Orders.Where(o => o.CustomerId == 5);
var sql = query.ToQueryString();
```

---

### 122. What is index seek vs scan?

**Index Seek** uses the index to directly find rows. **Index Scan** reads all index entries.

```
Index Seek (good):
┌─────────────────────┐
│     B-Tree Index    │
│         100         │
│       /     \       │
│     50      150     │ → Jump directly to target
│    /  \    /   \    │
│  25   75 125  175   │
└─────────────────────┘

Index Scan (less optimal):
┌─────────────────────┐
│  Read ALL entries   │
│  25→50→75→100→...   │ → Process every entry
└─────────────────────┘
```

```sql
-- Causes SEEK (efficient)
SELECT * FROM Users WHERE Email = 'user@example.com';  -- Index on Email

-- Causes SCAN (reads all)
SELECT * FROM Users WHERE Email LIKE '%@example.com';  -- Leading wildcard
SELECT * FROM Users WHERE YEAR(CreatedAt) = 2024;      -- Function on column

-- Fix: Use computed column or rewrite
SELECT * FROM Users WHERE CreatedAt >= '2024-01-01' AND CreatedAt < '2025-01-01';
```

---

### 123. What is composite index?

A **composite index** includes multiple columns.

```csharp
// EF Core configuration
modelBuilder.Entity<Order>()
    .HasIndex(o => new { o.CustomerId, o.OrderDate });

// SQL equivalent
CREATE INDEX IX_Orders_Customer_Date ON Orders (CustomerId, OrderDate);
```

**Column order matters (leftmost prefix):**
```sql
-- Index on (CustomerId, OrderDate, Status)

-- ✓ Uses index (leftmost columns)
WHERE CustomerId = 5
WHERE CustomerId = 5 AND OrderDate = '2024-01-01'
WHERE CustomerId = 5 AND OrderDate = '2024-01-01' AND Status = 'Active'

-- ✗ Cannot use index efficiently (missing CustomerId)
WHERE OrderDate = '2024-01-01'
WHERE Status = 'Active'
WHERE OrderDate = '2024-01-01' AND Status = 'Active'
```

**Best practices:**
- Most selective column first
- Consider query patterns
- Avoid over-indexing

---

### 124. What is covering index?

A **covering index** includes all columns needed by a query, avoiding table lookup.

```sql
-- Query
SELECT CustomerId, OrderDate, Total 
FROM Orders 
WHERE CustomerId = 5;

-- Covering index (includes all needed columns)
CREATE INDEX IX_Orders_Covering 
ON Orders (CustomerId) 
INCLUDE (OrderDate, Total);

-- Without covering index:
-- 1. Index seek on CustomerId
-- 2. Bookmark lookup to get OrderDate, Total (extra I/O)

-- With covering index:
-- 1. Index seek - all data in index (no lookup needed)
```

```csharp
// EF Core
modelBuilder.Entity<Order>()
    .HasIndex(o => o.CustomerId)
    .IncludeProperties(o => new { o.OrderDate, o.Total });
```

---

### 125. What is transaction isolation level?

**Isolation levels** control how transactions interact with each other.

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|------------|---------------------|--------------|
| Read Uncommitted | Yes | Yes | Yes |
| Read Committed | No | Yes | Yes |
| Repeatable Read | No | No | Yes |
| Serializable | No | No | No |
| Snapshot | No | No | No |

```csharp
// Set isolation level in EF Core
using var transaction = await _context.Database
    .BeginTransactionAsync(IsolationLevel.RepeatableRead);

try
{
    // Operations...
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}

// Per-query
var orders = await _context.Orders
    .FromSqlRaw("SELECT * FROM Orders WITH (NOLOCK)")  // Read Uncommitted
    .ToListAsync();
```

---

### 126. What is dirty read?

A **dirty read** reads uncommitted data from another transaction.

```
Transaction 1              Transaction 2
─────────────              ─────────────
BEGIN
UPDATE Balance = 500
                          SELECT Balance → 500 (dirty read!)
ROLLBACK
                          (Transaction 2 used invalid data)
```

```csharp
// Allow dirty reads (Read Uncommitted)
using var transaction = await _context.Database
    .BeginTransactionAsync(IsolationLevel.ReadUncommitted);

// Risks:
// - Reading data that gets rolled back
// - Making decisions on invalid data

// Use when:
// - Approximate counts/aggregates are acceptable
// - Performance is critical
// - Data consistency isn't critical
```

---

### 127. What is phantom read?

A **phantom read** occurs when new rows appear in repeated queries within a transaction.

```
Transaction 1                      Transaction 2
─────────────                      ─────────────
BEGIN
SELECT COUNT(*) WHERE Status='A' → 10
                                  INSERT INTO Orders (Status='A')
                                  COMMIT
SELECT COUNT(*) WHERE Status='A' → 11 (phantom!)
COMMIT
```

```csharp
// Prevent phantoms with Serializable
using var transaction = await _context.Database
    .BeginTransactionAsync(IsolationLevel.Serializable);

// Or use Snapshot isolation
using var transaction = await _context.Database
    .BeginTransactionAsync(IsolationLevel.Snapshot);

// Snapshot isolation:
// - Uses row versioning
// - No blocking reads
// - Better concurrency than Serializable
```

---

### 128. What is snapshot isolation?

**Snapshot isolation** provides a consistent view of data as of transaction start.

```csharp
// Enable snapshot isolation on database (SQL Server)
// ALTER DATABASE MyDb SET ALLOW_SNAPSHOT_ISOLATION ON;

using var transaction = await _context.Database
    .BeginTransactionAsync(IsolationLevel.Snapshot);

// Transaction sees data as of this point
var order1 = await _context.Orders.FindAsync(1);

// Other transaction modifies order 1
// This transaction still sees original value

var order1Again = await _context.Orders.FindAsync(1);
// Same as first read, even if changed externally

await transaction.CommitAsync();
```

**Benefits:**
- Consistent reads without blocking
- No dirty reads, no phantoms
- Better concurrency than Serializable

**Tradeoffs:**
- More storage (row versions)
- Update conflicts possible

---

### 129. What is bulk insert?

**Bulk insert** efficiently inserts large amounts of data.

```csharp
// ❌ Slow - individual inserts
foreach (var item in items)
{
    _context.Products.Add(item);
    await _context.SaveChangesAsync();  // Each save = roundtrip
}

// ✓ Better - batch with AddRange
_context.Products.AddRange(items);
await _context.SaveChangesAsync();  // Single roundtrip

// ✓ Best - bulk insert library (EFCore.BulkExtensions)
await _context.BulkInsertAsync(items, new BulkConfig
{
    BatchSize = 5000,
    SetOutputIdentity = true
});

// ✓ Raw SQL bulk insert
using var connection = new SqlConnection(connectionString);
using var bulkCopy = new SqlBulkCopy(connection);
bulkCopy.DestinationTableName = "Products";
bulkCopy.BatchSize = 10000;

var table = ToDataTable(items);
await connection.OpenAsync();
await bulkCopy.WriteToServerAsync(table);
```

---

### 130. What is batching?

**Batching** groups multiple operations into fewer database roundtrips.

```csharp
// EF Core 7+ ExecuteUpdate/ExecuteDelete (batched)
await _context.Products
    .Where(p => p.Category == "Discontinued")
    .ExecuteUpdateAsync(s => s
        .SetProperty(p => p.IsActive, false)
        .SetProperty(p => p.UpdatedAt, DateTime.UtcNow));

await _context.Products
    .Where(p => p.IsObsolete)
    .ExecuteDeleteAsync();

// Manual batching
var batch = new List<Product>();
foreach (var item in items)
{
    batch.Add(item);
    
    if (batch.Count >= 1000)
    {
        _context.Products.AddRange(batch);
        await _context.SaveChangesAsync();
        batch.Clear();
    }
}

// Process remaining
if (batch.Any())
{
    _context.Products.AddRange(batch);
    await _context.SaveChangesAsync();
}

// EF Core batches SaveChanges automatically
// Default batch size: 42 for SQL Server
```

---

### 131. What is split query?

**Split queries** execute separate queries for collections to avoid Cartesian explosion.

```csharp
// Single query (default) - can explode with multiple collections
var blogs = await _context.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Tags)
    .ToListAsync();
// Result: Blogs × Posts × Tags rows (Cartesian product)

// Split query - separate queries
var blogs = await _context.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Tags)
    .AsSplitQuery()
    .ToListAsync();
// Query 1: SELECT * FROM Blogs
// Query 2: SELECT * FROM Posts WHERE BlogId IN (...)
// Query 3: SELECT * FROM Tags WHERE BlogId IN (...)

// Configure globally
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)
           .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
```

**Use split queries when:**
- Multiple collection includes
- Large collections
- Slow queries due to data explosion

---

### 132. What is compiled query?

**Compiled queries** pre-compile LINQ expressions for better performance.

```csharp
// Compiled query - parsed once, reused
private static readonly Func<AppDbContext, int, Task<Order?>> _getOrderById =
    EF.CompileAsyncQuery((AppDbContext ctx, int id) =>
        ctx.Orders
            .Include(o => o.Lines)
            .FirstOrDefault(o => o.Id == id));

public async Task<Order?> GetOrderAsync(int id)
{
    return await _getOrderById(_context, id);
}

// Multiple parameters
private static readonly Func<AppDbContext, string, DateTime, IAsyncEnumerable<Order>>
    _getOrdersByCustomerAndDate = EF.CompileAsyncQuery(
        (AppDbContext ctx, string customerId, DateTime date) =>
            ctx.Orders
                .Where(o => o.CustomerId == customerId && o.OrderDate >= date));

// Use when:
// - Hot path queries
// - Complex queries called frequently
// - Measured performance improvement

// Note: Less benefit in EF Core 6+ due to query cache improvements
```

---

### 133. What is projection optimization?

**Projection** selects only needed columns, reducing data transfer.

```csharp
// ❌ Bad - loads entire entity
var orders = await _context.Orders.ToListAsync();
var ids = orders.Select(o => o.Id);  // Loaded ALL columns

// ✓ Good - load only needed columns
var ids = await _context.Orders
    .Select(o => o.Id)
    .ToListAsync();
// SQL: SELECT Id FROM Orders

// ✓ Project to DTO
var orderDtos = await _context.Orders
    .Select(o => new OrderDto
    {
        Id = o.Id,
        CustomerName = o.Customer.Name,  // No separate query
        Total = o.Lines.Sum(l => l.Quantity * l.Price)
    })
    .ToListAsync();

// ✓ Anonymous type projection
var summary = await _context.Orders
    .GroupBy(o => o.CustomerId)
    .Select(g => new
    {
        CustomerId = g.Key,
        TotalOrders = g.Count(),
        TotalAmount = g.Sum(o => o.Total)
    })
    .ToListAsync();
```

---

### 134. What is N+1 fix?

**N+1 problem** occurs when loading related data triggers N additional queries.

```csharp
// ❌ N+1 problem
var orders = await _context.Orders.ToListAsync();  // 1 query
foreach (var order in orders)
{
    var customer = order.Customer;  // N queries (lazy loading)
}

// ✓ Fix with Include (eager loading)
var orders = await _context.Orders
    .Include(o => o.Customer)
    .ToListAsync();  // 1 query with JOIN

// ✓ Fix with projection
var orderDtos = await _context.Orders
    .Select(o => new OrderDto
    {
        Id = o.Id,
        CustomerName = o.Customer.Name
    })
    .ToListAsync();  // 1 optimized query

// ✓ Fix with explicit loading (when needed)
var orders = await _context.Orders.ToListAsync();
var customerIds = orders.Select(o => o.CustomerId).Distinct();
var customers = await _context.Customers
    .Where(c => customerIds.Contains(c.Id))
    .ToDictionaryAsync(c => c.Id);
// 2 queries total

// Detect N+1 in development
services.AddDbContext<AppDbContext>(options =>
    options.ConfigureWarnings(w => 
        w.Throw(RelationalEventId.MultipleCollectionIncludeWarning)));
```

---

### 135. What is DB concurrency token?

**Concurrency token** detects conflicting updates to the same row.

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    
    [Timestamp]  // SQL Server rowversion
    public byte[] RowVersion { get; set; }
}

// Or fluent API
modelBuilder.Entity<Product>()
    .Property(p => p.RowVersion)
    .IsRowVersion();

// Usage
var product = await _context.Products.FindAsync(id);
product.Price = 29.99m;

try
{
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    var entry = ex.Entries.Single();
    var dbValues = await entry.GetDatabaseValuesAsync();
    
    if (dbValues == null)
    {
        // Entity deleted
        throw new EntityNotFoundException();
    }
    
    // Resolve: client wins
    entry.OriginalValues.SetValues(dbValues);
    await _context.SaveChangesAsync();
    
    // Or: database wins
    // entry.CurrentValues.SetValues(dbValues);
}
```

---

### 136. What is pessimistic locking?

**Pessimistic locking** locks rows to prevent concurrent access.

```csharp
// SQL Server - Row lock
using var transaction = await _context.Database.BeginTransactionAsync();

var account = await _context.Accounts
    .FromSqlRaw("SELECT * FROM Accounts WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", id)
    .FirstOrDefaultAsync();

account.Balance -= amount;
await _context.SaveChangesAsync();
await transaction.CommitAsync();

// PostgreSQL
var account = await _context.Accounts
    .FromSqlRaw("SELECT * FROM Accounts WHERE Id = {0} FOR UPDATE", id)
    .FirstOrDefaultAsync();

// When to use:
// - Short transactions
// - High contention
// - Critical financial operations

// Risks:
// - Deadlocks
// - Reduced concurrency
// - Longer response times
```

---

### 137. What is retry on failure?

**Retry on failure** handles transient database errors.

```csharp
// EF Core built-in retry
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: new[] { 4060 })));  // Additional error codes

// Custom retry strategy
public class CustomRetryStrategy : SqlServerRetryingExecutionStrategy
{
    public CustomRetryStrategy(ExecutionStrategyDependencies dependencies)
        : base(dependencies, 5, TimeSpan.FromSeconds(30), null)
    {
    }
    
    protected override bool ShouldRetryOn(Exception exception)
    {
        if (exception is SqlException sqlEx)
        {
            // Custom retry logic
            return sqlEx.Number == 1205;  // Deadlock
        }
        return base.ShouldRetryOn(exception);
    }
}

// Manual retry with Polly
var retryPolicy = Policy
    .Handle<SqlException>(ex => ex.Number == 1205)
    .WaitAndRetryAsync(3, attempt => TimeSpan.FromMilliseconds(100 * attempt));

await retryPolicy.ExecuteAsync(async () =>
{
    await _context.SaveChangesAsync();
});
```

---

### 138. What is deadlock in SQL?

**SQL deadlock** occurs when two transactions wait for each other's locks.

```
Transaction 1            Transaction 2
─────────────            ─────────────
Lock Table A             Lock Table B
Request Lock B (wait)    Request Lock A (wait)
        └────────────────────┘
              DEADLOCK!
```

**Prevention:**
```csharp
// 1. Access tables in same order
async Task Transfer(int from, int to, decimal amount)
{
    var first = Math.Min(from, to);
    var second = Math.Max(from, to);
    
    var account1 = await _context.Accounts
        .FromSqlRaw("SELECT * FROM Accounts WITH (UPDLOCK) WHERE Id = {0}", first)
        .FirstAsync();
    var account2 = await _context.Accounts
        .FromSqlRaw("SELECT * FROM Accounts WITH (UPDLOCK) WHERE Id = {0}", second)
        .FirstAsync();
    // ...
}

// 2. Keep transactions short
// 3. Use appropriate isolation level
// 4. Use retry logic for deadlocks

// Handle deadlock
try
{
    await _context.SaveChangesAsync();
}
catch (SqlException ex) when (ex.Number == 1205)
{
    // Retry the operation
}
```

---

### 139. What is sharding?

**Sharding** splits data across multiple database servers.

```
┌─────────────────────────────────────────────────────┐
│                   Application                        │
│                   Shard Router                       │
└────────────┬──────────┬──────────┬─────────────────┘
             │          │          │
    ┌────────▼───┐ ┌────▼─────┐ ┌──▼──────────┐
    │  Shard 1   │ │  Shard 2 │ │   Shard 3   │
    │ Users A-H  │ │ Users I-P│ │  Users Q-Z  │
    └────────────┘ └──────────┘ └─────────────┘
```

```csharp
// Shard routing
public class ShardRouter
{
    public string GetShardConnectionString(string tenantId)
    {
        var shardId = GetShardId(tenantId);
        return _shardConfigs[shardId].ConnectionString;
    }
    
    private int GetShardId(string tenantId)
    {
        // Consistent hashing
        var hash = tenantId.GetHashCode();
        return Math.Abs(hash % _shardCount);
    }
}

// Dynamic DbContext per shard
public class ShardedDbContext : DbContext
{
    private readonly string _connectionString;
    
    public ShardedDbContext(string connectionString)
    {
        _connectionString = connectionString;
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {
        options.UseSqlServer(_connectionString);
    }
}
```

---

### 140. What is read replica?

**Read replicas** offload read queries from the primary database.

```
        ┌─────────────────┐
        │   Application   │
        └────────┬────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌───────────┐           ┌───────────────┐
│  Primary  │──────────▶│ Read Replica  │
│  (Write)  │  Replication │   (Read)    │
└───────────┘           └───────────────┘
```

```csharp
// Register multiple contexts
builder.Services.AddDbContext<WriteDbContext>(options =>
    options.UseSqlServer(config["PrimaryConnection"]));

builder.Services.AddDbContext<ReadDbContext>(options =>
    options.UseSqlServer(config["ReplicaConnection"])
           .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

// Usage
public class ProductService
{
    private readonly WriteDbContext _writeContext;
    private readonly ReadDbContext _readContext;
    
    public async Task<Product> GetAsync(int id)
    {
        return await _readContext.Products.FindAsync(id);  // Read from replica
    }
    
    public async Task UpdateAsync(Product product)
    {
        _writeContext.Products.Update(product);
        await _writeContext.SaveChangesAsync();  // Write to primary
    }
}
```

---

### 141. What is eventual consistency?

**Eventual consistency** means data will become consistent over time, not immediately.

```csharp
// Example: Order placed, inventory updated later
public class OrderService
{
    public async Task PlaceOrderAsync(Order order)
    {
        // 1. Save order
        await _orderRepo.SaveAsync(order);
        
        // 2. Publish event (don't wait for inventory)
        await _messageBus.PublishAsync(new OrderPlacedEvent(order));
    }
}

public class InventoryHandler : IHandler<OrderPlacedEvent>
{
    public async Task HandleAsync(OrderPlacedEvent evt)
    {
        // Eventually updates inventory
        await _inventoryService.ReserveAsync(evt.Items);
    }
}

// Read your writes pattern
public async Task<Order> PlaceAndGetOrderAsync(CreateOrderDto dto)
{
    var order = await PlaceOrderAsync(dto);
    
    // Wait for replica sync (if reading from replica)
    await Task.Delay(100);  // Or use version/timestamp
    
    return await _readContext.Orders.FindAsync(order.Id);
}
```

---

### 142. What is ACID?

**ACID** properties ensure reliable database transactions.

| Property | Meaning |
|----------|---------|
| **Atomicity** | All or nothing |
| **Consistency** | Valid state to valid state |
| **Isolation** | Concurrent transactions isolated |
| **Durability** | Committed data persists |

```csharp
// Atomicity - all operations succeed or all fail
using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    _context.Accounts.Find(1).Balance -= 100;
    _context.Accounts.Find(2).Balance += 100;
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();  // Both or neither
}
catch
{
    await transaction.RollbackAsync();
    throw;
}

// Durability - use synchronous writes for critical data
// EF Core SaveChanges is durable by default
await _context.SaveChangesAsync();  // Data persisted to disk
```

---

### 143. What is CAP theorem?

**CAP theorem**: A distributed system can only guarantee 2 of 3 properties.

| Property | Meaning |
|----------|---------|
| **Consistency** | All nodes see same data |
| **Availability** | Every request gets response |
| **Partition Tolerance** | System works despite network failures |

```
Network Partition (must handle):
┌─────────┐       X       ┌─────────┐
│ Node A  │───────X───────│ Node B  │
└─────────┘       X       └─────────┘

Choose CP (Consistency + Partition):
- Reject writes during partition
- Example: Banking systems

Choose AP (Availability + Partition):
- Allow writes, reconcile later
- Example: Social media likes
```

```csharp
// CP system - strong consistency
await using var transaction = await _context.Database.BeginTransactionAsync();
// All nodes must confirm

// AP system - eventual consistency
await _eventBus.PublishAsync(new OrderPlaced(order));
// Continue without waiting for all nodes
```

---

### 144. What is index fragmentation?

**Index fragmentation** occurs when index pages are out of order, reducing performance.

```sql
-- Check fragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10;

-- Fix fragmentation
-- < 30%: Reorganize (online)
ALTER INDEX IX_Orders_CustomerId ON Orders REORGANIZE;

-- > 30%: Rebuild (may lock table)
ALTER INDEX IX_Orders_CustomerId ON Orders REBUILD;

-- Rebuild all indexes
ALTER INDEX ALL ON Orders REBUILD;
```

**Prevention:**
- Choose appropriate fill factor
- Regular maintenance jobs
- Consider page splits during inserts

---

### 145. What is partitioning?

**Table partitioning** divides large tables into smaller, manageable pieces.

```sql
-- SQL Server partitioning
-- 1. Create partition function
CREATE PARTITION FUNCTION pf_OrderDate (DATE)
AS RANGE RIGHT FOR VALUES ('2022-01-01', '2023-01-01', '2024-01-01');

-- 2. Create partition scheme
CREATE PARTITION SCHEME ps_OrderDate
AS PARTITION pf_OrderDate
TO (fg_2021, fg_2022, fg_2023, fg_2024);

-- 3. Create partitioned table
CREATE TABLE Orders (
    Id INT,
    OrderDate DATE,
    Total DECIMAL(18,2)
) ON ps_OrderDate(OrderDate);

-- Benefits:
-- Faster queries on partition key
-- Easy archival (switch out old partitions)
-- Parallel query execution
```

```csharp
// Query specific partition
var recentOrders = await _context.Orders
    .Where(o => o.OrderDate >= DateTime.Today.AddMonths(-3))
    .ToListAsync();
// Only scans recent partitions
```

---

### 146. What is query plan cache?

**Query plan cache** stores compiled query execution plans for reuse.

```sql
-- View cached plans (SQL Server)
SELECT 
    cp.usecounts,
    cp.cacheobjtype,
    cp.objtype,
    st.text AS QueryText,
    qp.query_plan
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle) st
CROSS APPLY sys.dm_exec_query_plan(cp.plan_handle) qp
ORDER BY cp.usecounts DESC;

-- Clear plan cache (careful!)
DBCC FREEPROCCACHE;
```

```csharp
// EF Core query cache
// First execution: Parse LINQ → Generate SQL → Compile plan
// Subsequent: Reuse compiled query

// Force plan recompilation with OPTION (RECOMPILE)
var results = await _context.Orders
    .FromSqlRaw("SELECT * FROM Orders WHERE CustomerId = @p0 OPTION (RECOMPILE)", customerId)
    .ToListAsync();
```

---

### 147. What is parameter sniffing?

**Parameter sniffing** occurs when SQL Server optimizes a query plan based on first execution's parameter values.

```sql
-- First call with selective value
EXEC GetOrders @CustomerId = 123;  -- Returns 10 rows, Index Seek plan cached

-- Later call with common value
EXEC GetOrders @CustomerId = 1;    -- Should return 1M rows, but uses same plan!
                                   -- Index Seek is wrong for this case
```

**Solutions:**
```sql
-- 1. OPTION (RECOMPILE) - new plan each time
SELECT * FROM Orders WHERE CustomerId = @CustomerId OPTION (RECOMPILE);

-- 2. OPTIMIZE FOR UNKNOWN
SELECT * FROM Orders WHERE CustomerId = @CustomerId OPTION (OPTIMIZE FOR UNKNOWN);

-- 3. Local variables
DECLARE @LocalCustomerId INT = @CustomerId;
SELECT * FROM Orders WHERE CustomerId = @LocalCustomerId;
```

```csharp
// EF Core - be aware with dynamic queries
var threshold = isHighVolume ? 1000 : 10;
var orders = await _context.Orders
    .Where(o => o.Quantity > threshold)
    .ToListAsync();
// Plan might be suboptimal for different threshold values
```

---

### 148. What is transaction scope?

`TransactionScope` creates ambient transactions spanning multiple operations.

```csharp
// Single database
using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

await _context1.SaveChangesAsync();
await _context2.SaveChangesAsync();

scope.Complete();  // Commit both

// Multiple databases (distributed transaction)
using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

await _sqlContext.SaveChangesAsync();
await _postgresContext.SaveChangesAsync();  // Different database

scope.Complete();  // Requires MSDTC

// Configuration
using var scope = new TransactionScope(
    TransactionScopeOption.Required,
    new TransactionOptions
    {
        IsolationLevel = IsolationLevel.ReadCommitted,
        Timeout = TimeSpan.FromMinutes(5)
    },
    TransactionScopeAsyncFlowOption.Enabled);
```

---

### 149. What is distributed transaction?

**Distributed transactions** span multiple databases or services.

```csharp
// Two-phase commit (2PC)
// Phase 1: Prepare - all participants vote
// Phase 2: Commit - coordinator decides

// Problems:
// - Performance (blocking)
// - Availability (coordinator failure)
// - Complexity

// Modern alternatives:

// 1. Saga pattern
public class OrderSaga
{
    public async Task ExecuteAsync(Order order)
    {
        try
        {
            await _paymentService.ChargeAsync(order);
            await _inventoryService.ReserveAsync(order);
            await _shippingService.ScheduleAsync(order);
        }
        catch
        {
            // Compensating transactions
            await _paymentService.RefundAsync(order);
            await _inventoryService.ReleaseAsync(order);
            throw;
        }
    }
}

// 2. Outbox pattern (see next question)
```

---

### 150. What is outbox pattern?

**Outbox pattern** ensures reliable message publishing with database transactions.

```csharp
public class OutboxMessage
{
    public Guid Id { get; set; }
    public string Type { get; set; }
    public string Payload { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class OrderService
{
    public async Task CreateOrderAsync(Order order)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        // Save order
        _context.Orders.Add(order);
        
        // Save message to outbox (same transaction)
        _context.OutboxMessages.Add(new OutboxMessage
        {
            Type = nameof(OrderCreatedEvent),
            Payload = JsonSerializer.Serialize(new OrderCreatedEvent(order.Id)),
            CreatedAt = DateTime.UtcNow
        });
        
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
    }
}

// Background processor publishes messages
public class OutboxProcessor : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var messages = await _context.OutboxMessages
                .Where(m => m.ProcessedAt == null)
                .Take(100)
                .ToListAsync(ct);
            
            foreach (var message in messages)
            {
                await _messageBus.PublishAsync(message.Type, message.Payload);
                message.ProcessedAt = DateTime.UtcNow;
            }
            
            await _context.SaveChangesAsync(ct);
            await Task.Delay(1000, ct);
        }
    }
}
```

---

## Summary

| Concept | Purpose |
|---------|---------|
| Execution Plan | Analyze query performance |
| Index Seek/Scan | Direct lookup vs full scan |
| Composite Index | Multi-column index |
| Covering Index | All columns in index |
| Isolation Levels | Control transaction interaction |
| Dirty/Phantom Read | Concurrency anomalies |
| Snapshot Isolation | Point-in-time consistency |
| Bulk Insert | Efficient mass insert |
| Batching | Group operations |
| Split Query | Separate collection queries |
| Compiled Query | Pre-compiled LINQ |
| Projection | Select only needed columns |
| N+1 Problem | Extra queries for relations |
| Concurrency Token | Detect conflicts |
| Pessimistic Locking | Lock rows explicitly |
| Retry Logic | Handle transient failures |
| Deadlock | Circular lock wait |
| Sharding | Split data across servers |
| Read Replica | Offload reads |
| Eventual Consistency | Data syncs over time |
| ACID | Transaction guarantees |
| CAP Theorem | Distributed system tradeoffs |
| Index Fragmentation | Out-of-order pages |
| Partitioning | Divide large tables |
| Query Plan Cache | Reuse compiled plans |
| Parameter Sniffing | Plan based on first params |
| Transaction Scope | Ambient transactions |
| Distributed Transaction | Multi-database transaction |
| Outbox Pattern | Reliable message publishing |

---

**🎉 Intermediate Level Complete!**

*Next: [Part 10 - Advanced: System Design](10-advanced-system-design.md)*
