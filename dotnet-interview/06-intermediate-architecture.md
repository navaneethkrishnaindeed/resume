# .NET Interview Guide - Intermediate Level
## Part 6: Architecture & Design (Questions 1-40)

---

### 1. What is SOLID?

**SOLID** is five design principles for maintainable, scalable software:

| Principle | Meaning |
|-----------|---------|
| **S** - Single Responsibility | One class = one reason to change |
| **O** - Open/Closed | Open for extension, closed for modification |
| **L** - Liskov Substitution | Subtypes must be substitutable for base types |
| **I** - Interface Segregation | Many specific interfaces > one general interface |
| **D** - Dependency Inversion | Depend on abstractions, not concretions |

```csharp
// Good SOLID example
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}

public interface IUserRepository
{
    Task<User> GetByIdAsync(int id);
    Task SaveAsync(User user);
}

public class UserService
{
    private readonly IUserRepository _repo;
    private readonly IEmailSender _email;
    
    public UserService(IUserRepository repo, IEmailSender email)
    {
        _repo = repo;    // Dependency Inversion
        _email = email;  // Single Responsibility (delegated)
    }
}
```

---

### 2. Explain SRP violation example

**SRP violation**: A class handling multiple responsibilities.

```csharp
// ❌ BAD - Multiple responsibilities
public class UserService
{
    public async Task RegisterUserAsync(RegisterDto dto)
    {
        // 1. Validation logic
        if (string.IsNullOrEmpty(dto.Email))
            throw new ValidationException("Email required");
        
        // 2. Database logic
        var user = new User { Email = dto.Email };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        
        // 3. Email logic
        var smtpClient = new SmtpClient("smtp.server.com");
        await smtpClient.SendMailAsync(/* welcome email */);
        
        // 4. Logging logic
        File.AppendAllText("log.txt", $"User {dto.Email} registered");
    }
}

// ✅ GOOD - Single responsibility each
public class UserService
{
    private readonly IUserRepository _repo;
    private readonly IEmailService _email;
    private readonly ILogger<UserService> _logger;
    
    public async Task RegisterUserAsync(RegisterDto dto)
    {
        var user = User.Create(dto);  // Entity handles validation
        await _repo.AddAsync(user);
        await _email.SendWelcomeAsync(user.Email);
        _logger.LogInformation("User {Email} registered", dto.Email);
    }
}
```

---

### 3. What is DIP in real backend?

**Dependency Inversion Principle** in practice: high-level modules don't depend on low-level modules.

```csharp
// ❌ BAD - Direct dependency on SQL Server
public class OrderService
{
    private readonly SqlConnection _connection;  // Concrete!
    
    public OrderService()
    {
        _connection = new SqlConnection("...");
    }
}

// ✅ GOOD - Depend on abstraction
public interface IOrderRepository
{
    Task<Order> GetByIdAsync(int id);
    Task SaveAsync(Order order);
}

public class OrderService
{
    private readonly IOrderRepository _repository;  // Abstract!
    
    public OrderService(IOrderRepository repository)
    {
        _repository = repository;  // Injected, not created
    }
}

// Multiple implementations possible
public class SqlOrderRepository : IOrderRepository { }
public class MongoOrderRepository : IOrderRepository { }
public class InMemoryOrderRepository : IOrderRepository { }  // For testing

// Registration
services.AddScoped<IOrderRepository, SqlOrderRepository>();
```

---

### 4. What is Clean Architecture?

**Clean Architecture** organizes code in concentric layers with dependencies pointing inward.

```
┌─────────────────────────────────────────────┐
│          Presentation / API                  │  ← Controllers, DTOs
├─────────────────────────────────────────────┤
│          Infrastructure                      │  ← EF Core, External APIs
├─────────────────────────────────────────────┤
│          Application                         │  ← Use Cases, Services
├─────────────────────────────────────────────┤
│          Domain                              │  ← Entities, Business Rules
└─────────────────────────────────────────────┘
```

**Project Structure:**
```
src/
├── Domain/                 # Core business logic, no dependencies
│   ├── Entities/
│   ├── ValueObjects/
│   └── Interfaces/
├── Application/            # Use cases, depends only on Domain
│   ├── Commands/
│   ├── Queries/
│   └── Services/
├── Infrastructure/         # External concerns
│   ├── Persistence/
│   └── ExternalServices/
└── API/                    # Entry point
    ├── Controllers/
    └── Program.cs
```

**Key Rule:** Inner layers know nothing about outer layers.

---

### 5. What is Onion Architecture?

**Onion Architecture** is similar to Clean Architecture with domain at center.

```
        ┌─────────────────────┐
        │    Infrastructure   │
        │  ┌───────────────┐  │
        │  │  Application  │  │
        │  │  ┌─────────┐  │  │
        │  │  │ Domain  │  │  │
        │  │  │ Model   │  │  │
        │  │  └─────────┘  │  │
        │  └───────────────┘  │
        └─────────────────────┘
```

**Layers:**
- **Domain Model**: Entities, Value Objects (no dependencies)
- **Domain Services**: Business logic interfaces
- **Application Services**: Use cases, orchestration
- **Infrastructure**: Database, external APIs (outermost)

```csharp
// Domain (center) - no external dependencies
public class Order
{
    public void AddItem(Product product, int quantity)
    {
        // Business rules here
    }
}

// Application references Domain
public class OrderService
{
    private readonly IOrderRepository _repo;  // Interface from Domain
}

// Infrastructure implements Domain interfaces
public class SqlOrderRepository : IOrderRepository { }
```

---

### 6. What is layered architecture?

**Layered (N-Tier) Architecture** separates concerns into horizontal layers.

```
┌─────────────────────────┐
│   Presentation Layer    │  UI, Controllers
├─────────────────────────┤
│   Business Logic Layer  │  Services, Rules
├─────────────────────────┤
│   Data Access Layer     │  Repositories, DbContext
├─────────────────────────┤
│       Database          │
└─────────────────────────┘
```

```csharp
// Presentation
[ApiController]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;
    
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var user = await _service.GetByIdAsync(id);
        return Ok(user);
    }
}

// Business Layer
public class UserService : IUserService
{
    private readonly IUserRepository _repo;
    
    public async Task<UserDto> GetByIdAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id);
        return MapToDto(user);
    }
}

// Data Access Layer
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
    
    public async Task<User> GetByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }
}
```

---

### 7. What is vertical slice architecture?

**Vertical Slice Architecture** organizes code by feature, not layer.

```
Traditional (Horizontal):        Vertical Slice:
├── Controllers/                 ├── Features/
│   ├── OrderController          │   ├── Orders/
│   ├── UserController           │   │   ├── CreateOrder/
├── Services/                    │   │   │   ├── CreateOrderCommand.cs
│   ├── OrderService             │   │   │   ├── CreateOrderHandler.cs
│   ├── UserService              │   │   │   └── CreateOrderValidator.cs
├── Repositories/                │   │   ├── GetOrder/
│   ├── OrderRepository          │   │   │   ├── GetOrderQuery.cs
│   └── UserRepository           │   │   │   └── GetOrderHandler.cs
```

```csharp
// Each feature is self-contained
public class CreateOrder
{
    public record Command(string CustomerId, List<OrderItem> Items);
    
    public class Handler : IRequestHandler<Command, OrderDto>
    {
        private readonly AppDbContext _context;
        
        public async Task<OrderDto> Handle(Command request, CancellationToken ct)
        {
            var order = new Order(request.CustomerId, request.Items);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync(ct);
            return new OrderDto(order);
        }
    }
    
    public class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.CustomerId).NotEmpty();
            RuleFor(x => x.Items).NotEmpty();
        }
    }
}
```

---

### 8. What is DDD?

**Domain-Driven Design** focuses on modeling the business domain.

**Strategic Patterns:**
- **Ubiquitous Language**: Shared vocabulary between devs and domain experts
- **Bounded Context**: Clear boundaries for domain models
- **Context Mapping**: How bounded contexts relate

**Tactical Patterns:**
```csharp
// Entity - has identity
public class Order
{
    public OrderId Id { get; private set; }
    private List<OrderLine> _lines = new();
    
    public void AddLine(Product product, int qty)
    {
        // Business rules here
        _lines.Add(new OrderLine(product, qty));
    }
}

// Value Object - no identity, immutable
public record Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException();
        return new Money(Amount + other.Amount, Currency);
    }
}

// Aggregate Root - consistency boundary
public class Order  // Aggregate root
{
    public OrderId Id { get; }
    public CustomerId CustomerId { get; }
    private List<OrderLine> _lines;  // Inside aggregate
}
```

---

### 9. What is aggregate root?

An **Aggregate Root** is the entry point to a cluster of domain objects that should be treated as a single unit.

```csharp
// Order is the aggregate root
public class Order
{
    public Guid Id { get; private set; }
    public OrderStatus Status { get; private set; }
    private readonly List<OrderLine> _lines = new();
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();
    
    // All modifications go through the root
    public void AddLine(ProductId productId, int quantity, decimal unitPrice)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Cannot modify non-draft order");
            
        var line = new OrderLine(productId, quantity, unitPrice);
        _lines.Add(line);
    }
    
    public void Submit()
    {
        if (!_lines.Any())
            throw new InvalidOperationException("Order must have lines");
            
        Status = OrderStatus.Submitted;
    }
}

// OrderLine cannot exist without Order
public class OrderLine
{
    public ProductId ProductId { get; }
    public int Quantity { get; }
    public decimal UnitPrice { get; }
    
    internal OrderLine(ProductId productId, int quantity, decimal unitPrice)
    {
        // Only Order can create OrderLines
    }
}

// Repository is per aggregate root
public interface IOrderRepository
{
    Task<Order> GetByIdAsync(Guid id);
    Task SaveAsync(Order order);
    // No IOrderLineRepository!
}
```

---

### 10. What is domain event?

**Domain events** capture something important that happened in the domain.

```csharp
// Domain event
public record OrderSubmittedEvent(Guid OrderId, DateTime SubmittedAt, decimal Total);

// Entity raises events
public class Order
{
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents;
    
    public void Submit()
    {
        Status = OrderStatus.Submitted;
        _domainEvents.Add(new OrderSubmittedEvent(Id, DateTime.UtcNow, Total));
    }
    
    public void ClearDomainEvents() => _domainEvents.Clear();
}

// Handler reacts to events
public class OrderSubmittedHandler : INotificationHandler<OrderSubmittedEvent>
{
    private readonly IEmailService _email;
    
    public async Task Handle(OrderSubmittedEvent notification, CancellationToken ct)
    {
        await _email.SendOrderConfirmationAsync(notification.OrderId);
    }
}

// Dispatch events after save
public override async Task<int> SaveChangesAsync(CancellationToken ct)
{
    var events = ChangeTracker.Entries<Entity>()
        .SelectMany(e => e.Entity.DomainEvents)
        .ToList();
    
    var result = await base.SaveChangesAsync(ct);
    
    foreach (var domainEvent in events)
    {
        await _mediator.Publish(domainEvent, ct);
    }
    
    return result;
}
```

---

### 11. What is repository pattern?

**Repository pattern** abstracts data access, providing collection-like interface for domain objects.

```csharp
// Generic repository interface
public interface IRepository<T> where T : Entity
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task AddAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
}

// Specific repository with domain operations
public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetByOrderNumberAsync(string orderNumber);
    Task<IEnumerable<Order>> GetByCustomerAsync(Guid customerId);
    Task<IEnumerable<Order>> GetPendingOrdersAsync();
}

// Implementation
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;
    
    public async Task<Order?> GetByIdAsync(Guid id)
    {
        return await _context.Orders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == id);
    }
    
    public async Task AddAsync(Order entity)
    {
        await _context.Orders.AddAsync(entity);
    }
}
```

---

### 12. Should we use repository with EF Core?

**It depends.** Arguments on both sides:

**Against Repository (use DbContext directly):**
```csharp
// DbContext IS already a repository + Unit of Work
public class OrderService
{
    private readonly AppDbContext _context;  // Direct usage
    
    public async Task<Order> GetOrderAsync(int id)
    {
        return await _context.Orders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == id);
    }
}
```

**For Repository:**
```csharp
// Benefits:
// 1. Testability - easy to mock
// 2. Abstraction - hide EF specifics
// 3. Encapsulation - domain query methods
// 4. Swappable - change ORM easily

public interface IOrderRepository
{
    Task<Order?> GetWithLinesAsync(int id);  // Named, meaningful
    Task<IEnumerable<Order>> GetPendingForShipmentAsync();
}

// Unit tests without EF
[Fact]
public async Task CreateOrder_ShouldSucceed()
{
    var mockRepo = new Mock<IOrderRepository>();
    var service = new OrderService(mockRepo.Object);
    // Test without database
}
```

**Recommendation:** Use thin repositories for complex domains, skip for simple CRUD.

---

### 13. What is Unit of Work?

**Unit of Work** tracks changes and coordinates writing them to the database as a single transaction.

```csharp
// DbContext already implements Unit of Work
public class AppDbContext : DbContext
{
    // SaveChanges = Commit all tracked changes
}

// Explicit Unit of Work pattern
public interface IUnitOfWork
{
    IOrderRepository Orders { get; }
    ICustomerRepository Customers { get; }
    Task<int> SaveChangesAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    
    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Orders = new OrderRepository(_context);
        Customers = new CustomerRepository(_context);
    }
    
    public IOrderRepository Orders { get; }
    public ICustomerRepository Customers { get; }
    
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}

// Usage - multiple repos, single save
public async Task TransferAsync(int fromId, int toId, decimal amount)
{
    var from = await _uow.Accounts.GetByIdAsync(fromId);
    var to = await _uow.Accounts.GetByIdAsync(toId);
    
    from.Debit(amount);
    to.Credit(amount);
    
    await _uow.SaveChangesAsync();  // Single transaction
}
```

---

### 14. What is CQRS?

**CQRS (Command Query Responsibility Segregation)** separates read and write operations.

```csharp
// Command - changes state
public record CreateOrderCommand(string CustomerId, List<OrderItemDto> Items);

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IOrderRepository _repo;
    
    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = new Order(cmd.CustomerId, cmd.Items);
        await _repo.AddAsync(order);
        return order.Id;
    }
}

// Query - reads state (can be optimized separately)
public record GetOrderQuery(Guid Id);

public class GetOrderHandler : IRequestHandler<GetOrderQuery, OrderDto>
{
    private readonly IDbConnection _connection;  // Direct DB access for reads
    
    public async Task<OrderDto> Handle(GetOrderQuery query, CancellationToken ct)
    {
        return await _connection.QueryFirstAsync<OrderDto>(
            "SELECT * FROM OrdersView WHERE Id = @Id", 
            new { query.Id });
    }
}
```

**Benefits:**
- Optimize reads independently (denormalized views, caching)
- Simpler models (read DTOs vs rich domain)
- Scalability (separate read/write databases)

---

### 15. When not to use CQRS?

**Skip CQRS when:**

1. **Simple CRUD applications**
```csharp
// Overkill for basic CRUD
public class ProductService
{
    public async Task<Product> GetAsync(int id) => await _context.Products.FindAsync(id);
    public async Task CreateAsync(Product p) { _context.Add(p); await _context.SaveChangesAsync(); }
    // No need for separate commands/queries
}
```

2. **Small teams / simple domains**
3. **Read/write patterns are similar**
4. **No performance issues with current approach**
5. **Adding complexity without clear benefit**

**Use CQRS when:**
- Complex domain with rich behavior
- Different read/write scalability needs
- Need for event sourcing
- Read models need heavy optimization
- Team is large enough to manage complexity

---

### 16. What is mediator pattern?

**Mediator pattern** encapsulates how objects interact, promoting loose coupling.

```csharp
// Without mediator - tight coupling
public class OrderController
{
    private readonly IOrderService _orderService;
    private readonly IInventoryService _inventoryService;
    private readonly INotificationService _notificationService;
    private readonly IPaymentService _paymentService;
    // Many dependencies!
}

// With mediator - loose coupling
public class OrderController
{
    private readonly IMediator _mediator;  // Single dependency
    
    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderRequest request)
    {
        var result = await _mediator.Send(new CreateOrderCommand(request));
        return Ok(result);
    }
}

// Handler handles the command
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, OrderResult>
{
    private readonly IOrderRepository _repo;
    
    public async Task<OrderResult> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        // All logic here
    }
}
```

---

### 17. What is MediatR?

**MediatR** is a popular .NET implementation of the mediator pattern.

```csharp
// Install
// dotnet add package MediatR

// Registration
builder.Services.AddMediatR(cfg => 
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// Request (command/query)
public record CreateProductCommand(string Name, decimal Price) : IRequest<int>;

// Handler
public class CreateProductHandler : IRequestHandler<CreateProductCommand, int>
{
    private readonly AppDbContext _context;
    
    public CreateProductHandler(AppDbContext context) => _context = context;
    
    public async Task<int> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var product = new Product(request.Name, request.Price);
        _context.Products.Add(product);
        await _context.SaveChangesAsync(ct);
        return product.Id;
    }
}

// Notification (events)
public record OrderCreatedNotification(int OrderId) : INotification;

public class SendEmailHandler : INotificationHandler<OrderCreatedNotification>
{
    public async Task Handle(OrderCreatedNotification notification, CancellationToken ct)
    {
        // Send email
    }
}

// Usage
var productId = await _mediator.Send(new CreateProductCommand("Widget", 9.99m));
await _mediator.Publish(new OrderCreatedNotification(orderId));
```

---

### 18. When MediatR becomes anti-pattern?

**MediatR can become problematic when:**

```csharp
// 1. Hiding simple dependencies
// ❌ Over-engineering simple service calls
public class GetUserHandler : IRequestHandler<GetUserQuery, User>
{
    public Task<User> Handle(GetUserQuery q, CancellationToken ct)
        => _context.Users.FindAsync(q.Id);  // Just a FindAsync!
}

// 2. Handlers calling handlers
// ❌ Creates hidden coupling
public class OrderHandler : IRequestHandler<CreateOrderCommand, Order>
{
    private readonly IMediator _mediator;
    
    public async Task<Order> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        // Handler calling another handler
        var customer = await _mediator.Send(new GetCustomerQuery(cmd.CustomerId));
        var inventory = await _mediator.Send(new CheckInventoryQuery(cmd.Items));
        // Hard to trace, test, and understand
    }
}

// 3. Replacing direct service injection everywhere
// Simple service calls don't need mediator

// Better: Use MediatR at controller level, 
// use direct DI within handlers
```

---

### 19. What is specification pattern?

**Specification pattern** encapsulates query criteria as objects.

```csharp
// Base specification
public interface ISpecification<T>
{
    Expression<Func<T, bool>> Criteria { get; }
    List<Expression<Func<T, object>>> Includes { get; }
    Expression<Func<T, object>>? OrderBy { get; }
}

// Concrete specification
public class ActiveOrdersSpec : ISpecification<Order>
{
    public Expression<Func<Order, bool>> Criteria => 
        o => o.Status == OrderStatus.Active && o.Total > 100;
        
    public List<Expression<Func<Order, object>>> Includes => 
        new() { o => o.Lines, o => o.Customer };
        
    public Expression<Func<Order, object>>? OrderBy => o => o.CreatedAt;
}

// Repository uses specification
public async Task<IEnumerable<Order>> GetAsync(ISpecification<Order> spec)
{
    var query = _context.Orders.Where(spec.Criteria);
    
    foreach (var include in spec.Includes)
        query = query.Include(include);
        
    if (spec.OrderBy != null)
        query = query.OrderBy(spec.OrderBy);
        
    return await query.ToListAsync();
}

// Usage
var orders = await _repo.GetAsync(new ActiveOrdersSpec());
```

---

### 20. What is anti-corruption layer?

**Anti-Corruption Layer (ACL)** translates between your domain and external systems.

```csharp
// External system's model (legacy/third-party)
public class ExternalCustomerData
{
    public string CUST_ID { get; set; }
    public string CUST_NAME_FIRST { get; set; }
    public string CUST_NAME_LAST { get; set; }
    public int CUST_STATUS_CODE { get; set; }
}

// Your clean domain model
public class Customer
{
    public Guid Id { get; }
    public string FullName { get; }
    public CustomerStatus Status { get; }
}

// Anti-corruption layer translates
public class CustomerAcl : ICustomerAcl
{
    private readonly ILegacyCustomerApi _legacyApi;
    
    public async Task<Customer> GetCustomerAsync(string customerId)
    {
        var external = await _legacyApi.GetCustomerAsync(customerId);
        
        // Translate to your domain
        return new Customer(
            id: Guid.Parse(external.CUST_ID),
            fullName: $"{external.CUST_NAME_FIRST} {external.CUST_NAME_LAST}",
            status: MapStatus(external.CUST_STATUS_CODE)
        );
    }
    
    private CustomerStatus MapStatus(int code) => code switch
    {
        1 => CustomerStatus.Active,
        2 => CustomerStatus.Inactive,
        _ => CustomerStatus.Unknown
    };
}
```

---

### 21. What is bounded context?

**Bounded Context** is a boundary within which a domain model is defined and applicable.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Sales BC     │    │   Shipping BC   │    │   Billing BC    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Customer        │    │ Customer        │    │ Customer        │
│ - Name          │    │ - ShippingAddr  │    │ - BillingAddr   │
│ - Email         │    │ - ContactPhone  │    │ - PaymentMethod │
│ - Orders        │    │ - Packages      │    │ - Invoices      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       ↑                      ↑                      ↑
       └──────────────────────┴──────────────────────┘
                    Same real-world customer,
                    different model in each context
```

```csharp
// Sales context
namespace Sales.Domain
{
    public class Customer
    {
        public Guid Id { get; }
        public string Email { get; }
        public List<Order> Orders { get; }
    }
}

// Shipping context
namespace Shipping.Domain
{
    public class Customer  // Different Customer!
    {
        public Guid Id { get; }
        public Address ShippingAddress { get; }
        public string ContactPhone { get; }
    }
}
```

---

### 22. What is value object?

**Value Object** is defined by its attributes, not identity. Immutable and equality by value.

```csharp
public record Money
{
    public decimal Amount { get; }
    public string Currency { get; }
    
    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentException("Amount cannot be negative");
        if (string.IsNullOrEmpty(currency)) throw new ArgumentException("Currency required");
        
        Amount = amount;
        Currency = currency;
    }
    
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot add different currencies");
        return new Money(Amount + other.Amount, Currency);
    }
}

public record Address(string Street, string City, string PostalCode, string Country);

public record DateRange
{
    public DateTime Start { get; }
    public DateTime End { get; }
    
    public DateRange(DateTime start, DateTime end)
    {
        if (end < start) throw new ArgumentException("End must be after start");
        Start = start;
        End = end;
    }
    
    public bool Contains(DateTime date) => date >= Start && date <= End;
}

// Value objects are equal by value
var money1 = new Money(100, "USD");
var money2 = new Money(100, "USD");
Console.WriteLine(money1 == money2);  // true
```

---

### 23. What is factory pattern?

**Factory pattern** encapsulates object creation logic.

```csharp
// Simple factory
public static class OrderFactory
{
    public static Order CreateStandardOrder(Customer customer, List<OrderItem> items)
    {
        var order = new Order(customer.Id);
        foreach (var item in items)
        {
            order.AddLine(item.ProductId, item.Quantity, item.Price);
        }
        return order;
    }
    
    public static Order CreatePriorityOrder(Customer customer, List<OrderItem> items)
    {
        var order = CreateStandardOrder(customer, items);
        order.SetPriority(Priority.High);
        order.ApplyDiscount(0.05m);  // 5% priority discount
        return order;
    }
}

// Abstract factory
public interface INotificationFactory
{
    INotification CreateNotification(NotificationType type, string message);
}

public class NotificationFactory : INotificationFactory
{
    public INotification CreateNotification(NotificationType type, string message) => type switch
    {
        NotificationType.Email => new EmailNotification(message),
        NotificationType.Sms => new SmsNotification(message),
        NotificationType.Push => new PushNotification(message),
        _ => throw new ArgumentException($"Unknown type: {type}")
    };
}
```

---

### 24. What is strategy pattern?

**Strategy pattern** defines interchangeable algorithms.

```csharp
// Strategy interface
public interface IShippingCostCalculator
{
    decimal Calculate(Order order);
}

// Concrete strategies
public class StandardShipping : IShippingCostCalculator
{
    public decimal Calculate(Order order) => order.TotalWeight * 0.5m;
}

public class ExpressShipping : IShippingCostCalculator
{
    public decimal Calculate(Order order) => order.TotalWeight * 1.5m + 10;
}

public class FreeShipping : IShippingCostCalculator
{
    public decimal Calculate(Order order) => 0;
}

// Context uses strategy
public class OrderService
{
    public decimal CalculateTotal(Order order, IShippingCostCalculator shippingStrategy)
    {
        var subtotal = order.Lines.Sum(l => l.Total);
        var shipping = shippingStrategy.Calculate(order);
        return subtotal + shipping;
    }
}

// Usage
var calculator = order.Total > 100 
    ? new FreeShipping() 
    : new StandardShipping();
var total = _service.CalculateTotal(order, calculator);
```

---

### 25. What is decorator pattern?

**Decorator pattern** adds behavior to objects dynamically.

```csharp
// Base interface
public interface INotificationService
{
    Task SendAsync(string message);
}

// Base implementation
public class EmailNotificationService : INotificationService
{
    public async Task SendAsync(string message)
    {
        await SendEmailAsync(message);
    }
}

// Decorators add behavior
public class LoggingNotificationDecorator : INotificationService
{
    private readonly INotificationService _inner;
    private readonly ILogger _logger;
    
    public LoggingNotificationDecorator(INotificationService inner, ILogger logger)
    {
        _inner = inner;
        _logger = logger;
    }
    
    public async Task SendAsync(string message)
    {
        _logger.LogInformation("Sending notification: {Message}", message);
        await _inner.SendAsync(message);
        _logger.LogInformation("Notification sent");
    }
}

public class RetryNotificationDecorator : INotificationService
{
    private readonly INotificationService _inner;
    
    public async Task SendAsync(string message)
    {
        for (int i = 0; i < 3; i++)
        {
            try
            {
                await _inner.SendAsync(message);
                return;
            }
            catch when (i < 2)
            {
                await Task.Delay(1000);
            }
        }
    }
}

// Compose decorators
services.AddScoped<INotificationService>(sp =>
    new RetryNotificationDecorator(
        new LoggingNotificationDecorator(
            new EmailNotificationService(),
            sp.GetRequiredService<ILogger>())));
```

---

### 26. What is builder pattern?

**Builder pattern** constructs complex objects step by step.

```csharp
public class EmailBuilder
{
    private string _to;
    private string _subject;
    private string _body;
    private List<string> _cc = new();
    private List<Attachment> _attachments = new();
    private bool _isHtml;
    
    public EmailBuilder To(string to)
    {
        _to = to;
        return this;
    }
    
    public EmailBuilder Subject(string subject)
    {
        _subject = subject;
        return this;
    }
    
    public EmailBuilder Body(string body, bool isHtml = false)
    {
        _body = body;
        _isHtml = isHtml;
        return this;
    }
    
    public EmailBuilder Cc(string cc)
    {
        _cc.Add(cc);
        return this;
    }
    
    public EmailBuilder Attach(Attachment attachment)
    {
        _attachments.Add(attachment);
        return this;
    }
    
    public Email Build()
    {
        if (string.IsNullOrEmpty(_to))
            throw new InvalidOperationException("Recipient required");
            
        return new Email(_to, _subject, _body, _isHtml, _cc, _attachments);
    }
}

// Usage - fluent interface
var email = new EmailBuilder()
    .To("user@example.com")
    .Subject("Welcome!")
    .Body("<h1>Hello</h1>", isHtml: true)
    .Cc("manager@example.com")
    .Attach(new Attachment("report.pdf", data))
    .Build();
```

---

### 27. What is open/closed principle violation?

**OCP violation**: Modifying existing code to add new behavior.

```csharp
// ❌ BAD - Must modify to add new discount type
public class DiscountCalculator
{
    public decimal Calculate(Order order, string discountType)
    {
        switch (discountType)
        {
            case "percentage":
                return order.Total * 0.1m;
            case "fixed":
                return 10m;
            case "seasonal":  // Added later - modifying existing class!
                return order.Total * 0.15m;
            default:
                return 0;
        }
    }
}

// ✅ GOOD - Open for extension, closed for modification
public interface IDiscountStrategy
{
    decimal Calculate(Order order);
}

public class PercentageDiscount : IDiscountStrategy
{
    public decimal Calculate(Order order) => order.Total * 0.1m;
}

public class SeasonalDiscount : IDiscountStrategy  // New class, no modification
{
    public decimal Calculate(Order order) => order.Total * 0.15m;
}

public class DiscountCalculator
{
    public decimal Calculate(Order order, IDiscountStrategy strategy)
    {
        return strategy.Calculate(order);
    }
}
```

---

### 28. What is dependency inversion?

**Dependency Inversion**: High-level modules depend on abstractions, not low-level modules.

```csharp
// ❌ BAD - High-level depends on low-level
public class OrderProcessor  // High-level
{
    private readonly SqlOrderRepository _repo;  // Low-level concrete
    private readonly SmtpEmailService _email;    // Low-level concrete
    
    public OrderProcessor()
    {
        _repo = new SqlOrderRepository();  // Creates dependency
        _email = new SmtpEmailService();
    }
}

// ✅ GOOD - Both depend on abstractions
public interface IOrderRepository { }  // Abstraction
public interface IEmailService { }     // Abstraction

public class OrderProcessor  // High-level
{
    private readonly IOrderRepository _repo;  // Depends on abstraction
    private readonly IEmailService _email;    // Depends on abstraction
    
    public OrderProcessor(IOrderRepository repo, IEmailService email)
    {
        _repo = repo;   // Injected
        _email = email; // Injected
    }
}

// Low-level implements abstraction
public class SqlOrderRepository : IOrderRepository { }
```

---

### 29. What is application layer?

**Application layer** contains use cases and orchestrates the flow of data.

```csharp
// Application layer - use cases
namespace Application.Orders.Commands
{
    public record CreateOrderCommand(Guid CustomerId, List<OrderItemDto> Items);
    
    public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
    {
        private readonly IOrderRepository _orderRepo;
        private readonly ICustomerRepository _customerRepo;
        private readonly IEmailService _email;
        
        public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
        {
            // 1. Validate customer exists
            var customer = await _customerRepo.GetByIdAsync(cmd.CustomerId);
            if (customer == null)
                throw new CustomerNotFoundException(cmd.CustomerId);
            
            // 2. Create domain object
            var order = Order.Create(customer, cmd.Items);
            
            // 3. Persist
            await _orderRepo.AddAsync(order);
            
            // 4. Side effects
            await _email.SendOrderConfirmationAsync(customer.Email, order);
            
            return order.Id;
        }
    }
}
```

**Responsibilities:**
- Orchestrate use cases
- Transaction boundaries
- Call domain logic
- Map DTOs
- No business rules (that's domain)

---

### 30. What is infrastructure layer?

**Infrastructure layer** contains implementations for external concerns.

```csharp
// Infrastructure - data access
namespace Infrastructure.Persistence
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _context;
        
        public async Task<Order?> GetByIdAsync(Guid id)
        {
            return await _context.Orders
                .Include(o => o.Lines)
                .FirstOrDefaultAsync(o => o.Id == id);
        }
    }
}

// Infrastructure - external services
namespace Infrastructure.ExternalServices
{
    public class StripePaymentService : IPaymentService
    {
        private readonly StripeClient _client;
        
        public async Task<PaymentResult> ProcessAsync(Payment payment)
        {
            var result = await _client.ChargesCreateAsync(/*...*/);
            return new PaymentResult(result.Id, result.Status);
        }
    }
}

// Infrastructure - messaging
namespace Infrastructure.Messaging
{
    public class RabbitMqMessageBus : IMessageBus
    {
        public async Task PublishAsync<T>(T message) { /*...*/ }
    }
}
```

---

### 31. What is domain layer?

**Domain layer** contains core business logic, entities, and rules.

```csharp
namespace Domain.Entities
{
    // Rich domain entity
    public class Order
    {
        public Guid Id { get; private set; }
        public OrderStatus Status { get; private set; }
        private readonly List<OrderLine> _lines = new();
        public IReadOnlyList<OrderLine> Lines => _lines;
        
        private Order() { }  // EF
        
        public static Order Create(Customer customer, List<OrderItemDto> items)
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Pending
            };
            
            foreach (var item in items)
            {
                order.AddLine(item.ProductId, item.Quantity, item.Price);
            }
            
            return order;
        }
        
        public void AddLine(Guid productId, int quantity, decimal price)
        {
            if (Status != OrderStatus.Pending)
                throw new DomainException("Cannot modify submitted order");
                
            _lines.Add(new OrderLine(productId, quantity, price));
        }
        
        public void Submit()
        {
            if (!_lines.Any())
                throw new DomainException("Order must have lines");
                
            Status = OrderStatus.Submitted;
        }
    }
}

// Domain interfaces (defined here, implemented in Infrastructure)
namespace Domain.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(Guid id);
        Task AddAsync(Order order);
    }
}
```

---

### 32. What is DTO mapping strategy?

**DTO mapping** converts between domain entities and data transfer objects.

```csharp
// Manual mapping
public static class OrderMapper
{
    public static OrderDto ToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            Status = order.Status.ToString(),
            Total = order.Lines.Sum(l => l.Total),
            Lines = order.Lines.Select(LineToDto).ToList()
        };
    }
    
    private static OrderLineDto LineToDto(OrderLine line) => new()
    {
        ProductId = line.ProductId,
        Quantity = line.Quantity,
        UnitPrice = line.UnitPrice
    };
}

// AutoMapper
public class OrderProfile : Profile
{
    public OrderProfile()
    {
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.Total, opt => opt.MapFrom(s => s.Lines.Sum(l => l.Total)));
        CreateMap<OrderLine, OrderLineDto>();
    }
}

// Mapster (faster)
public static class MappingConfig
{
    public static void Configure()
    {
        TypeAdapterConfig<Order, OrderDto>.NewConfig()
            .Map(d => d.Total, s => s.Lines.Sum(l => l.Total));
    }
}

// Best practices:
// - Map at application boundaries (API, handlers)
// - Don't expose entities to API layer
// - Consider projection for queries (Select)
```

---

### 33. What is cross-cutting concern?

**Cross-cutting concerns** are aspects that affect multiple parts of the application.

```csharp
// Common cross-cutting concerns:
// - Logging
// - Authentication/Authorization
// - Validation
// - Caching
// - Error handling
// - Transaction management

// Address with middleware
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

// Address with behaviors (MediatR)
services.AddScoped(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// Logging behavior
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    private readonly ILogger _logger;
    
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        _logger.LogInformation("Handling {RequestName}", typeof(TRequest).Name);
        var response = await next();
        _logger.LogInformation("Handled {RequestName}", typeof(TRequest).Name);
        return response;
    }
}
```

---

### 34. What is middleware vs filter?

**Middleware** operates on HTTP request/response, **Filters** operate on MVC/API actions.

```csharp
// Middleware - runs for ALL requests
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await _next(context);
        sw.Stop();
        context.Response.Headers.Add("X-Response-Time", sw.ElapsedMilliseconds.ToString());
    }
}

// Filter - runs only for controller actions
public class ValidateModelFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            context.Result = new BadRequestObjectResult(context.ModelState);
        }
    }
    
    public void OnActionExecuted(ActionExecutedContext context) { }
}
```

| Aspect | Middleware | Filter |
|--------|------------|--------|
| Scope | All requests | MVC actions only |
| Access | HttpContext | ActionContext, ModelState |
| Order | Pipeline order | Before/After action |
| Use case | Logging, auth, CORS | Validation, caching |

---

### 35. What is action filter?

**Action filters** execute before and after controller actions.

```csharp
// Custom action filter
public class AuditLogFilter : IAsyncActionFilter
{
    private readonly IAuditService _audit;
    
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Before action
        var actionName = context.ActionDescriptor.DisplayName;
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var executedContext = await next();  // Execute action
        
        // After action
        if (executedContext.Exception == null)
        {
            await _audit.LogAsync(userId, actionName, "Success");
        }
    }
}

// Apply to controller/action
[ServiceFilter(typeof(AuditLogFilter))]
public class OrdersController : ControllerBase { }

// Or globally
services.AddControllers(options =>
{
    options.Filters.Add<AuditLogFilter>();
});
```

**Filter Types:**
- Authorization filters
- Resource filters
- Action filters
- Exception filters
- Result filters

---

### 36. What is global filter?

**Global filters** apply to all controllers/actions automatically.

```csharp
// Register global filters
builder.Services.AddControllers(options =>
{
    // Exception handling
    options.Filters.Add<GlobalExceptionFilter>();
    
    // Model validation
    options.Filters.Add<ValidateModelStateFilter>();
    
    // Authorization (require auth everywhere)
    options.Filters.Add(new AuthorizeFilter());
});

// Global exception filter
public class GlobalExceptionFilter : IExceptionFilter
{
    private readonly ILogger<GlobalExceptionFilter> _logger;
    
    public void OnException(ExceptionContext context)
    {
        _logger.LogError(context.Exception, "Unhandled exception");
        
        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = 500,
            Title = "An error occurred"
        })
        {
            StatusCode = 500
        };
        
        context.ExceptionHandled = true;
    }
}
```

---

### 37. What is custom middleware?

**Custom middleware** extends the HTTP request/response pipeline.

```csharp
// Middleware class
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    
    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();
            
        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers["X-Correlation-ID"] = correlationId;
        
        using (_logger.BeginScope(new { CorrelationId = correlationId }))
        {
            await _next(context);
        }
    }
}

// Extension method
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
    {
        return app.UseMiddleware<CorrelationIdMiddleware>();
    }
}

// Register
app.UseCorrelationId();
```

---

### 38. What is pipeline behavior?

**Pipeline behaviors** (MediatR) intercept requests similar to middleware but for handlers.

```csharp
// Validation behavior
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    
    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }
    
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();
            
        if (failures.Any())
            throw new ValidationException(failures);
            
        return await next();
    }
}

// Register
services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
services.AddScoped(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
services.AddScoped(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));

// Execution order:
// Request → Validation → Logging → Transaction → Handler
//                                              ↓
// Response ← Validation ← Logging ← Transaction ←
```

---

### 39. What is modular monolith?

**Modular monolith** organizes code into independent modules within a single deployable unit.

```
src/
├── Modules/
│   ├── Sales/
│   │   ├── Sales.Domain/
│   │   ├── Sales.Application/
│   │   ├── Sales.Infrastructure/
│   │   └── Sales.Api/
│   ├── Inventory/
│   │   ├── Inventory.Domain/
│   │   └── ...
│   └── Shipping/
│       └── ...
├── Shared/
│   ├── Shared.Kernel/
│   └── Shared.Infrastructure/
└── Host/
    └── Api/  (composes all modules)
```

```csharp
// Module registration
public static class SalesModule
{
    public static IServiceCollection AddSalesModule(this IServiceCollection services)
    {
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        return services;
    }
}

// Host composes modules
builder.Services.AddSalesModule();
builder.Services.AddInventoryModule();
builder.Services.AddShippingModule();

// Modules communicate via:
// - Integration events (async)
// - Module interfaces (sync)
// - Shared kernel
```

---

### 40. When to split microservices?

**Split to microservices when:**

| Factor | Monolith | Microservices |
|--------|----------|---------------|
| Team size | < 10 devs | Multiple teams |
| Deployment | Same release cycle | Independent releases needed |
| Scaling | Uniform | Different scaling needs |
| Technology | Homogeneous | Different tech stacks |
| Domain boundaries | Unclear | Well-defined contexts |

**Warning signs you need to split:**
```csharp
// 1. Different scaling requirements
// - Orders: 1000 req/s (scale horizontally)
// - Reports: Heavy compute (scale vertically)

// 2. Different deployment cycles
// - Payments: Quarterly (compliance)
// - Features: Weekly

// 3. Team conflicts
// - Team A waiting on Team B
// - Merge conflicts

// 4. Technology constraints
// - ML module needs Python
// - Core app is C#
```

**Don't split prematurely:**
- Increased complexity
- Network latency
- Data consistency challenges
- Operational overhead

---

## Summary

| Pattern | Purpose |
|---------|---------|
| SOLID | Five principles for maintainable code |
| Clean Architecture | Dependency direction toward domain |
| Onion Architecture | Domain at center, infra at edges |
| Vertical Slice | Organize by feature, not layer |
| DDD | Model the business domain |
| Repository | Abstract data access |
| Unit of Work | Coordinate transactions |
| CQRS | Separate reads from writes |
| MediatR | Decouple request/handler |
| Specification | Encapsulate query criteria |
| ACL | Translate external systems |
| Bounded Context | Domain model boundaries |
| Value Object | Identity by value |
| Factory | Encapsulate creation |
| Strategy | Interchangeable algorithms |
| Decorator | Add behavior dynamically |
| Builder | Step-by-step construction |
| Middleware | HTTP pipeline |
| Filter | MVC/API pipeline |
| Pipeline Behavior | MediatR pipeline |
| Modular Monolith | Modules in single deployment |

---

*Next: [Part 7 - Async & Performance](07-intermediate-async-performance.md)*
