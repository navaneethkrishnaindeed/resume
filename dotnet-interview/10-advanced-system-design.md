# .NET Interview Guide - Advanced Level
## Part 10: System Design (Questions 1-50)

---

### 1. Design payment system

**Key Requirements:**
- Idempotent payments
- Strong consistency
- Audit trail
- Multiple payment methods
- Refunds

```csharp
public class PaymentSystem
{
    // Core entities
    public class Payment
    {
        public Guid Id { get; set; }
        public string IdempotencyKey { get; set; }  // Prevents double charge
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public PaymentStatus Status { get; set; }
        public PaymentMethod Method { get; set; }
        public string ExternalTransactionId { get; set; }
        public DateTime CreatedAt { get; set; }
        public byte[] RowVersion { get; set; }  // Concurrency
    }
    
    // Idempotent payment processing
    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // 1. Check idempotency
        var existing = await _repo.GetByIdempotencyKeyAsync(request.IdempotencyKey);
        if (existing != null)
            return existing.ToResult();
        
        // 2. Create payment record
        var payment = new Payment
        {
            IdempotencyKey = request.IdempotencyKey,
            Amount = request.Amount,
            Status = PaymentStatus.Pending
        };
        
        await using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // 3. Save to database first (for recovery)
            await _repo.AddAsync(payment);
            
            // 4. Call payment provider
            var result = await _paymentGateway.ChargeAsync(payment);
            
            // 5. Update status
            payment.Status = result.Success ? PaymentStatus.Completed : PaymentStatus.Failed;
            payment.ExternalTransactionId = result.TransactionId;
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            // 6. Publish event
            await _eventBus.PublishAsync(new PaymentProcessedEvent(payment));
            
            return payment.ToResult();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
```

**Architecture:**
```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│  Client  │────▶│  API Gateway │────▶│ Payment Service │
└──────────┘     └──────────────┘     └────────┬────────┘
                                               │
                 ┌─────────────────────────────┼─────────────────┐
                 │                             │                 │
                 ▼                             ▼                 ▼
         ┌──────────────┐            ┌─────────────────┐  ┌────────────┐
         │ Payment DB   │            │ Payment Gateway │  │ Event Bus  │
         │ (PostgreSQL) │            │ (Stripe/Adyen)  │  │  (Kafka)   │
         └──────────────┘            └─────────────────┘  └────────────┘
```

---

### 2. Design booking system

**Key Requirements:**
- Prevent double booking
- Handle concurrent requests
- Support cancellations
- Time-based availability

```csharp
public class BookingService
{
    public async Task<Booking> CreateBookingAsync(BookingRequest request)
    {
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable);
        
        try
        {
            // 1. Lock and check availability
            var slot = await _context.TimeSlots
                .FromSqlRaw(@"
                    SELECT * FROM TimeSlots WITH (UPDLOCK, ROWLOCK)
                    WHERE Id = @id AND Status = 'Available'", 
                    new SqlParameter("id", request.SlotId))
                .FirstOrDefaultAsync();
            
            if (slot == null)
                throw new SlotNotAvailableException();
            
            // 2. Create booking
            var booking = new Booking
            {
                SlotId = slot.Id,
                UserId = request.UserId,
                Status = BookingStatus.Confirmed
            };
            
            // 3. Mark slot as booked
            slot.Status = SlotStatus.Booked;
            slot.BookingId = booking.Id;
            
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            // 4. Send confirmation
            await _notificationService.SendBookingConfirmationAsync(booking);
            
            return booking;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}

// Time-based availability check
public async Task<List<TimeSlot>> GetAvailableSlotsAsync(DateTime date)
{
    return await _context.TimeSlots
        .Where(s => s.Date == date.Date)
        .Where(s => s.Status == SlotStatus.Available)
        .Where(s => s.StartTime > DateTime.UtcNow.AddMinutes(30))  // Buffer time
        .OrderBy(s => s.StartTime)
        .ToListAsync();
}
```

---

### 3. Design stock trading API

**Key Requirements:**
- Ultra-low latency
- Order matching engine
- Real-time price updates
- Audit compliance

```csharp
public class TradingEngine
{
    private readonly ConcurrentDictionary<string, OrderBook> _orderBooks = new();
    
    public class OrderBook
    {
        private readonly SortedSet<Order> _buyOrders;  // Descending by price
        private readonly SortedSet<Order> _sellOrders; // Ascending by price
        private readonly ReaderWriterLockSlim _lock = new();
        
        public MatchResult SubmitOrder(Order order)
        {
            _lock.EnterWriteLock();
            try
            {
                var matches = new List<Trade>();
                
                if (order.Side == OrderSide.Buy)
                {
                    while (_sellOrders.Any() && 
                           _sellOrders.Min.Price <= order.Price &&
                           order.RemainingQuantity > 0)
                    {
                        var match = _sellOrders.Min;
                        var trade = ExecuteTrade(order, match);
                        matches.Add(trade);
                    }
                    
                    if (order.RemainingQuantity > 0)
                        _buyOrders.Add(order);
                }
                
                return new MatchResult(matches);
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }
    }
    
    // Real-time price streaming
    public async IAsyncEnumerable<PriceUpdate> StreamPricesAsync(string symbol)
    {
        var channel = Channel.CreateUnbounded<PriceUpdate>();
        _subscribers.TryAdd(symbol, channel);
        
        await foreach (var update in channel.Reader.ReadAllAsync())
        {
            yield return update;
        }
    }
}
```

---

### 4. Design ledger system

**Key Requirements:**
- Double-entry accounting
- Immutable records
- Balance consistency
- Audit trail

```csharp
public class LedgerSystem
{
    public class LedgerEntry
    {
        public Guid Id { get; set; }
        public Guid TransactionId { get; set; }
        public Guid AccountId { get; set; }
        public decimal Amount { get; set; }  // Positive = Debit, Negative = Credit
        public DateTime CreatedAt { get; set; }
        public string Description { get; set; }
    }
    
    public async Task RecordTransferAsync(
        Guid fromAccount, Guid toAccount, decimal amount, string description)
    {
        var transactionId = Guid.NewGuid();
        
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable);
        
        try
        {
            // Double-entry: Debit from, Credit to
            var entries = new[]
            {
                new LedgerEntry
                {
                    TransactionId = transactionId,
                    AccountId = fromAccount,
                    Amount = -amount,  // Credit (decrease)
                    Description = description
                },
                new LedgerEntry
                {
                    TransactionId = transactionId,
                    AccountId = toAccount,
                    Amount = amount,   // Debit (increase)
                    Description = description
                }
            };
            
            // Verify debits = credits
            if (entries.Sum(e => e.Amount) != 0)
                throw new InvalidOperationException("Unbalanced entry");
            
            // Check from account has sufficient balance
            var fromBalance = await GetBalanceAsync(fromAccount);
            if (fromBalance < amount)
                throw new InsufficientFundsException();
            
            await _context.LedgerEntries.AddRangeAsync(entries);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    
    public async Task<decimal> GetBalanceAsync(Guid accountId)
    {
        return await _context.LedgerEntries
            .Where(e => e.AccountId == accountId)
            .SumAsync(e => e.Amount);
    }
}
```

---

### 5. Design high-scale chat app backend

**Key Requirements:**
- Real-time messaging
- Message persistence
- Presence detection
- Scalable to millions of users

```csharp
public class ChatService
{
    // Message delivery
    public async Task SendMessageAsync(SendMessageRequest request)
    {
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = request.ConversationId,
            SenderId = request.SenderId,
            Content = request.Content,
            Timestamp = DateTime.UtcNow
        };
        
        // 1. Persist to database
        await _messageRepo.AddAsync(message);
        
        // 2. Publish to message bus for real-time delivery
        await _messageBus.PublishAsync($"conversation:{request.ConversationId}", message);
        
        // 3. Send push notifications to offline users
        var offlineUsers = await GetOfflineParticipantsAsync(request.ConversationId);
        await _pushService.SendAsync(offlineUsers, message);
    }
}

// SignalR Hub for real-time
public class ChatHub : Hub
{
    public async Task JoinConversation(Guid conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId.ToString());
    }
    
    public async Task SendMessage(Guid conversationId, string content)
    {
        var message = await _chatService.SendMessageAsync(new SendMessageRequest
        {
            ConversationId = conversationId,
            SenderId = Context.UserIdentifier,
            Content = content
        });
        
        await Clients.Group(conversationId.ToString())
            .SendAsync("ReceiveMessage", message);
    }
}

// Redis for presence
public class PresenceService
{
    public async Task SetOnlineAsync(string userId)
    {
        await _redis.StringSetAsync($"presence:{userId}", "online", TimeSpan.FromMinutes(5));
    }
    
    public async Task<bool> IsOnlineAsync(string userId)
    {
        return await _redis.KeyExistsAsync($"presence:{userId}");
    }
}
```

**Architecture:**
```
┌─────────┐    ┌─────────────┐    ┌──────────────┐
│ Clients │───▶│ Load Balancer│───▶│ Chat Servers │
└─────────┘    └─────────────┘    │ (SignalR)    │
                                   └──────┬───────┘
                                          │
         ┌────────────────────────────────┼────────────────────┐
         │                                │                    │
         ▼                                ▼                    ▼
  ┌────────────┐                  ┌─────────────┐      ┌───────────────┐
  │   Redis    │                  │ PostgreSQL  │      │ Redis Pub/Sub │
  │ (Presence) │                  │ (Messages)  │      │ (Backplane)   │
  └────────────┘                  └─────────────┘      └───────────────┘
```

---

### 6. Design rate limiting system

```csharp
public class RateLimiter
{
    // Token bucket implementation
    public class TokenBucket
    {
        private readonly int _capacity;
        private readonly int _refillRate;
        private readonly SemaphoreSlim _lock = new(1, 1);
        private double _tokens;
        private DateTime _lastRefill;
        
        public TokenBucket(int capacity, int refillPerSecond)
        {
            _capacity = capacity;
            _refillRate = refillPerSecond;
            _tokens = capacity;
            _lastRefill = DateTime.UtcNow;
        }
        
        public async Task<bool> TryConsumeAsync(int tokens = 1)
        {
            await _lock.WaitAsync();
            try
            {
                Refill();
                
                if (_tokens >= tokens)
                {
                    _tokens -= tokens;
                    return true;
                }
                return false;
            }
            finally
            {
                _lock.Release();
            }
        }
        
        private void Refill()
        {
            var now = DateTime.UtcNow;
            var elapsed = (now - _lastRefill).TotalSeconds;
            _tokens = Math.Min(_capacity, _tokens + elapsed * _refillRate);
            _lastRefill = now;
        }
    }
    
    // Distributed rate limiting with Redis
    public async Task<bool> IsAllowedAsync(string key, int limit, TimeSpan window)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var windowStart = now - (long)window.TotalSeconds;
        
        var script = @"
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
            local count = redis.call('ZCARD', KEYS[1])
            if count < tonumber(ARGV[2]) then
                redis.call('ZADD', KEYS[1], ARGV[3], ARGV[3])
                redis.call('EXPIRE', KEYS[1], ARGV[4])
                return 1
            end
            return 0";
        
        var result = await _redis.ScriptEvaluateAsync(script,
            new RedisKey[] { $"rate:{key}" },
            new RedisValue[] { windowStart, limit, now, (int)window.TotalSeconds });
        
        return (int)result == 1;
    }
}
```

---

### 7. Design API gateway

```csharp
// Key responsibilities: Routing, Auth, Rate Limiting, Caching

public class ApiGateway
{
    public async Task<HttpResponseMessage> HandleRequestAsync(HttpContext context)
    {
        var route = _routeResolver.Resolve(context.Request.Path);
        
        // 1. Authentication
        var authResult = await _authService.ValidateAsync(context);
        if (!authResult.IsAuthenticated)
            return Unauthorized();
        
        // 2. Rate limiting
        var rateLimitKey = $"{authResult.ClientId}:{route.Name}";
        if (!await _rateLimiter.IsAllowedAsync(rateLimitKey, route.RateLimit, TimeSpan.FromMinutes(1)))
            return TooManyRequests();
        
        // 3. Check cache (for GET requests)
        if (context.Request.Method == "GET")
        {
            var cached = await _cache.GetAsync(context.Request.Path);
            if (cached != null) return cached;
        }
        
        // 4. Forward to backend
        var response = await _httpClient.SendAsync(BuildDownstreamRequest(context, route));
        
        // 5. Cache response
        if (response.IsSuccessStatusCode && context.Request.Method == "GET")
        {
            await _cache.SetAsync(context.Request.Path, response, route.CacheDuration);
        }
        
        return response;
    }
}

// Configuration
public class RouteConfig
{
    public string Path { get; set; }
    public string Downstream { get; set; }
    public int RateLimit { get; set; }
    public TimeSpan CacheDuration { get; set; }
    public string[] RequiredScopes { get; set; }
}
```

---

### 8. Design distributed cache invalidation

```csharp
public class CacheInvalidationService
{
    // Pub/Sub based invalidation
    public async Task InvalidateAsync(string key)
    {
        // Remove from local cache
        _memoryCache.Remove(key);
        
        // Publish to all instances
        await _redis.PublishAsync("cache:invalidate", key);
    }
    
    // Subscriber (on each instance)
    public void StartListening()
    {
        _redis.Subscribe("cache:invalidate", (channel, key) =>
        {
            _memoryCache.Remove(key);
        });
    }
    
    // Tag-based invalidation
    public async Task InvalidateByTagAsync(string tag)
    {
        var keys = await _redis.SetMembersAsync($"cache:tag:{tag}");
        
        foreach (var key in keys)
        {
            await InvalidateAsync(key);
        }
        
        await _redis.KeyDeleteAsync($"cache:tag:{tag}");
    }
    
    public async Task SetWithTagsAsync(string key, object value, string[] tags)
    {
        await _cache.SetAsync(key, value);
        
        foreach (var tag in tags)
        {
            await _redis.SetAddAsync($"cache:tag:{tag}", key);
        }
    }
}
```

---

### 9. Design multi-region deployment

```
                    ┌─────────────────┐
                    │  Global Load    │
                    │  Balancer       │
                    │  (Cloudflare)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Region US   │   │  Region EU    │   │  Region Asia  │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ App Servers   │   │ App Servers   │   │ App Servers   │
│ Redis Cache   │   │ Redis Cache   │   │ Redis Cache   │
│ Read Replica  │   │ Read Replica  │   │ Read Replica  │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Primary DB     │
                   │  (US-East)      │
                   └─────────────────┘
```

```csharp
public class MultiRegionService
{
    // Read from local replica
    public async Task<Data> ReadAsync(string id)
    {
        return await _readContext.Data.FindAsync(id);  // Regional replica
    }
    
    // Write to primary with conflict resolution
    public async Task WriteAsync(Data data)
    {
        data.RegionId = _currentRegion;
        data.UpdatedAt = DateTime.UtcNow;
        
        try
        {
            await _writeContext.Data.Upsert(data);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Last-write-wins or merge strategy
            await MergeConflictAsync(data);
        }
    }
}
```

---

### 10. Design idempotent payment endpoint

```csharp
public class IdempotentPaymentController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> ProcessPayment(
        [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
        [FromBody] PaymentRequest request)
    {
        if (string.IsNullOrEmpty(idempotencyKey))
            return BadRequest("Idempotency-Key header required");
        
        // 1. Check for existing result
        var existingResult = await _idempotencyStore.GetAsync(idempotencyKey);
        if (existingResult != null)
        {
            return StatusCode(existingResult.StatusCode, existingResult.Body);
        }
        
        // 2. Acquire lock to prevent concurrent processing
        var lockAcquired = await _lockService.TryAcquireAsync(
            $"payment:{idempotencyKey}", TimeSpan.FromMinutes(5));
        
        if (!lockAcquired)
        {
            // Another request is processing, wait and return that result
            await Task.Delay(1000);
            existingResult = await _idempotencyStore.GetAsync(idempotencyKey);
            return StatusCode(existingResult.StatusCode, existingResult.Body);
        }
        
        try
        {
            // 3. Process payment
            var result = await _paymentService.ProcessAsync(request);
            
            // 4. Store result for future requests
            await _idempotencyStore.SetAsync(idempotencyKey, new IdempotencyRecord
            {
                StatusCode = 200,
                Body = result,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            });
            
            return Ok(result);
        }
        catch (PaymentException ex)
        {
            await _idempotencyStore.SetAsync(idempotencyKey, new IdempotencyRecord
            {
                StatusCode = 400,
                Body = new { Error = ex.Message }
            });
            
            return BadRequest(new { Error = ex.Message });
        }
        finally
        {
            await _lockService.ReleaseAsync($"payment:{idempotencyKey}");
        }
    }
}
```

---

### 11. Design background job scheduler

```csharp
public class JobScheduler
{
    public class ScheduledJob
    {
        public Guid Id { get; set; }
        public string JobType { get; set; }
        public string Payload { get; set; }
        public DateTime ScheduledAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public JobStatus Status { get; set; }
        public int RetryCount { get; set; }
        public string? Error { get; set; }
    }
    
    public async Task ScheduleAsync<T>(T jobData, DateTime? runAt = null) where T : IJob
    {
        var job = new ScheduledJob
        {
            JobType = typeof(T).AssemblyQualifiedName,
            Payload = JsonSerializer.Serialize(jobData),
            ScheduledAt = runAt ?? DateTime.UtcNow,
            Status = JobStatus.Pending
        };
        
        await _context.ScheduledJobs.AddAsync(job);
        await _context.SaveChangesAsync();
    }
    
    // Worker process
    public async Task ProcessJobsAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var job = await DequeueJobAsync();
            if (job == null)
            {
                await Task.Delay(1000, ct);
                continue;
            }
            
            try
            {
                var handler = _serviceProvider.GetService(Type.GetType(job.JobType));
                var jobData = JsonSerializer.Deserialize(job.Payload, handler.GetType());
                
                job.StartedAt = DateTime.UtcNow;
                await handler.ExecuteAsync(jobData, ct);
                
                job.Status = JobStatus.Completed;
                job.CompletedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                job.RetryCount++;
                job.Error = ex.Message;
                
                if (job.RetryCount >= 3)
                    job.Status = JobStatus.Failed;
                else
                    job.ScheduledAt = DateTime.UtcNow.AddMinutes(Math.Pow(2, job.RetryCount));
            }
            
            await _context.SaveChangesAsync();
        }
    }
    
    private async Task<ScheduledJob?> DequeueJobAsync()
    {
        return await _context.ScheduledJobs
            .FromSqlRaw(@"
                UPDATE TOP(1) ScheduledJobs WITH (UPDLOCK, READPAST)
                SET Status = 'Processing'
                OUTPUT INSERTED.*
                WHERE Status = 'Pending' AND ScheduledAt <= @now",
                new SqlParameter("now", DateTime.UtcNow))
            .FirstOrDefaultAsync();
    }
}
```

---

### 12. Design event-driven architecture

```csharp
// Event contracts
public record OrderPlacedEvent(Guid OrderId, string CustomerId, decimal Total);
public record PaymentProcessedEvent(Guid OrderId, bool Success);
public record InventoryReservedEvent(Guid OrderId, List<ReservedItem> Items);

// Event publisher
public class EventPublisher
{
    public async Task PublishAsync<T>(T evt) where T : class
    {
        var message = new Message
        {
            Type = typeof(T).Name,
            Data = JsonSerializer.Serialize(evt),
            Timestamp = DateTime.UtcNow,
            CorrelationId = _correlationService.GetCorrelationId()
        };
        
        await _kafka.ProduceAsync(GetTopic<T>(), message);
    }
}

// Event consumer
public class OrderEventsConsumer : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var message in _kafka.ConsumeAsync<OrderPlacedEvent>("orders", ct))
        {
            using var scope = _serviceProvider.CreateScope();
            var handlers = scope.ServiceProvider.GetServices<IEventHandler<OrderPlacedEvent>>();
            
            foreach (var handler in handlers)
            {
                try
                {
                    await handler.HandleAsync(message);
                }
                catch (Exception ex)
                {
                    await _deadLetterQueue.SendAsync(message, ex);
                }
            }
        }
    }
}

// Saga orchestration
public class OrderSaga
{
    public async Task HandleAsync(OrderPlacedEvent evt)
    {
        var saga = new SagaState { OrderId = evt.OrderId };
        
        // Step 1: Process payment
        await _eventBus.PublishAsync(new ProcessPaymentCommand(evt));
    }
    
    public async Task HandleAsync(PaymentProcessedEvent evt)
    {
        if (!evt.Success)
        {
            await _eventBus.PublishAsync(new OrderCancelledEvent(evt.OrderId, "Payment failed"));
            return;
        }
        
        // Step 2: Reserve inventory
        await _eventBus.PublishAsync(new ReserveInventoryCommand(evt.OrderId));
    }
}
```

---

### 13. Design saga orchestration

```csharp
public class SagaOrchestrator<TData> where TData : class
{
    private readonly List<SagaStep<TData>> _steps = new();
    
    public SagaOrchestrator<TData> AddStep(
        Func<TData, Task> action,
        Func<TData, Task> compensate)
    {
        _steps.Add(new SagaStep<TData>(action, compensate));
        return this;
    }
    
    public async Task ExecuteAsync(TData data)
    {
        var completedSteps = new Stack<SagaStep<TData>>();
        
        try
        {
            foreach (var step in _steps)
            {
                await step.ExecuteAsync(data);
                completedSteps.Push(step);
            }
        }
        catch (Exception ex)
        {
            // Compensate in reverse order
            while (completedSteps.Count > 0)
            {
                var step = completedSteps.Pop();
                try
                {
                    await step.CompensateAsync(data);
                }
                catch (Exception compensateEx)
                {
                    _logger.LogError(compensateEx, "Compensation failed");
                }
            }
            throw;
        }
    }
}

// Usage
var saga = new SagaOrchestrator<OrderData>()
    .AddStep(
        action: async data => await _paymentService.ChargeAsync(data),
        compensate: async data => await _paymentService.RefundAsync(data))
    .AddStep(
        action: async data => await _inventoryService.ReserveAsync(data),
        compensate: async data => await _inventoryService.ReleaseAsync(data))
    .AddStep(
        action: async data => await _shippingService.ScheduleAsync(data),
        compensate: async data => await _shippingService.CancelAsync(data));

await saga.ExecuteAsync(orderData);
```

---

### 14. Choreography vs orchestration?

**Orchestration** (Centralized control):
```
┌─────────────────────────────────────────┐
│           Saga Orchestrator             │
└────────┬─────────┬────────────┬─────────┘
         │         │            │
         ▼         ▼            ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Payment │ │Inventory│ │Shipping │
    └─────────┘ └─────────┘ └─────────┘
```

**Choreography** (Decentralized events):
```
    ┌─────────┐ OrderPlaced  ┌─────────┐ PaymentDone  ┌─────────┐
    │ Order   │─────────────▶│ Payment │─────────────▶│Inventory│
    └─────────┘              └─────────┘              └────┬────┘
                                                          │
                    ┌─────────┐ InventoryReserved         │
                    │Shipping │◀──────────────────────────┘
                    └─────────┘
```

| Aspect | Orchestration | Choreography |
|--------|---------------|--------------|
| Complexity | Central logic | Distributed logic |
| Coupling | Orchestrator knows all | Services independent |
| Debugging | Easier (single point) | Harder (trace events) |
| Single point of failure | Yes (orchestrator) | No |
| Best for | Complex workflows | Simple event chains |

---

### 15-20. Quick Design Answers

**15. Design resilient microservice:**
- Circuit breaker (Polly)
- Retry with exponential backoff
- Bulkhead isolation
- Health checks
- Graceful degradation

**16. Design feature toggle system:**
- Store flags in database/Redis
- Support user targeting, percentages
- Real-time updates via pub/sub
- SDK for consistent evaluation

**17. Design plugin system in .NET:**
- Use Assembly.LoadFrom for plugins
- Define IPlugin interface
- Use MEF or custom loading
- Sandbox with AppDomain/AssemblyLoadContext

**18. Design real-time notification system:**
- WebSocket/SignalR for delivery
- Message queue for reliability
- Push notifications for mobile
- Preference management

**19. Design fraud detection pipeline:**
- Real-time rule engine
- ML model scoring
- Feature extraction
- Alert management
- Case workflow

**20. Design distributed logging:**
- Structured logging (Serilog)
- Correlation IDs
- Central aggregation (ELK/Splunk)
- Sampling for high volume
- Alert rules

---

### 21-30. More Design Patterns

**21. Design file upload service:**
```csharp
// Chunked upload for large files
public async Task<string> UploadChunkAsync(ChunkRequest request)
{
    var uploadPath = $"uploads/{request.UploadId}";
    
    using var stream = new FileStream(
        uploadPath, FileMode.Append, FileAccess.Write);
    await request.Data.CopyToAsync(stream);
    
    if (request.IsLastChunk)
    {
        await FinalizeUploadAsync(request.UploadId);
    }
    
    return request.UploadId;
}
```

**22-30 Quick answers:**
- **Streaming service**: HLS/DASH, CDN, adaptive bitrate
- **Audit system**: Immutable append-only log, encryption
- **Reporting engine**: Pre-aggregation, materialized views, async
- **Invoice system**: Sequential numbering, PDF generation, archival
- **RBAC system**: Roles → Permissions → Resources
- **Soft delete at scale**: Global query filter, archive partition
- **Search system**: Elasticsearch, indexing pipeline
- **Caching hierarchy**: L1 (in-process), L2 (distributed), L3 (CDN)
- **API throttling**: Token bucket at gateway level

---

### 31-50. Architecture Patterns Summary

| Question | Key Components |
|----------|----------------|
| 31. Global exception framework | Middleware, Problem Details, Logging |
| 32. High-performance read model | Denormalized views, caching, CQRS |
| 33. Eventual consistency workflow | Events, compensating transactions |
| 34. Schema migration strategy | EF Migrations, blue-green, versioning |
| 35. Rollback strategy | Feature flags, database backups, traffic shifting |
| 36. Auto-scaling strategy | Metrics-based, predictive, queue depth |
| 37. Health monitoring | Probes, metrics, alerting, dashboards |
| 38. Data archival system | Partitioning, cold storage, retention policies |
| 39. Multi-layer caching | Memory → Redis → Database |
| 40. Distributed lock system | Redis SETNX, fencing tokens, TTL |
| 41. ID generation system | Snowflake, UUID v7, database sequences |
| 42. Notification retry system | Exponential backoff, dead letter queue |
| 43. Payment retry logic | Idempotency, state machine, alerts |
| 44. Compensation transaction | Reverse operations, saga pattern |
| 45. Distributed trace system | OpenTelemetry, correlation IDs |
| 46. Microservice security | mTLS, JWT, API gateway |
| 47. High-throughput event bus | Kafka, partitioning, consumer groups |
| 48. Tenant isolation | Row-level security, separate schemas/DBs |
| 49. Plugin-based modular monolith | Interfaces, DI, feature modules |
| 50. Event sourcing system | Event store, projections, snapshots |

---

**🎉 System Design Section Complete!**

*Next: [Part 11 - Runtime Internals](11-advanced-runtime-internals.md)*
