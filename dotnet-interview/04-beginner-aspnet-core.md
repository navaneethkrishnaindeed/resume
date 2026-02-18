# .NET Interview Guide - Beginner Level
## Part 4: ASP.NET Core Basics (Questions 91-120)

---

### 91. What is ASP.NET Core?

**ASP.NET Core** is a cross-platform, high-performance framework for building modern web applications and APIs.

```csharp
// Minimal API (modern approach)
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello World!");
app.MapGet("/users/{id}", (int id) => $"User {id}");

app.Run();
```

**Key Features:**
- Cross-platform (Windows, Linux, macOS)
- High performance
- Built-in dependency injection
- Unified MVC and Web API
- Built-in support for modern patterns

**Project Types:**
- Web API (REST services)
- MVC (server-rendered pages)
- Razor Pages
- Blazor (WebAssembly/Server)
- gRPC Services

---

### 92. What is Kestrel?

**Kestrel** is the default, cross-platform web server for ASP.NET Core.

```csharp
// Configure Kestrel
var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5000);
    options.ListenLocalhost(5001, listenOptions =>
    {
        listenOptions.UseHttps();
    });
    
    options.Limits.MaxConcurrentConnections = 100;
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
});
```

**Architecture:**
```
Internet → [Reverse Proxy (IIS/Nginx)] → [Kestrel] → [ASP.NET Core App]
```

**Features:**
- HTTP/1.1, HTTP/2, HTTP/3 support
- HTTPS with TLS
- WebSocket support
- High performance (libuv/IO_Uring)

---

### 93. What is middleware?

**Middleware** are components that handle requests/responses in a pipeline.

```csharp
var app = builder.Build();

// Built-in middleware
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Custom inline middleware
app.Use(async (context, next) =>
{
    // Before next middleware
    Console.WriteLine($"Request: {context.Request.Path}");
    
    await next();  // Call next middleware
    
    // After next middleware
    Console.WriteLine($"Response: {context.Response.StatusCode}");
});

// Terminal middleware (doesn't call next)
app.Run(async context =>
{
    await context.Response.WriteAsync("Hello World!");
});
```

**Pipeline Flow:**
```
Request → [Middleware 1] → [Middleware 2] → [Endpoint]
                ↓                ↓               ↓
Response ← [Middleware 1] ← [Middleware 2] ← [Endpoint]
```

---

### 94. What is routing?

**Routing** maps incoming HTTP requests to endpoints (controllers/handlers).

```csharp
var app = builder.Build();

// Conventional routing (MVC)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Attribute routing
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet]           // GET /api/users
    public IActionResult GetAll() => Ok();
    
    [HttpGet("{id}")]   // GET /api/users/5
    public IActionResult GetById(int id) => Ok();
    
    [HttpPost]          // POST /api/users
    public IActionResult Create() => Ok();
}

// Minimal API routing
app.MapGet("/products", () => GetProducts());
app.MapGet("/products/{id}", (int id) => GetProduct(id));
app.MapPost("/products", (Product p) => CreateProduct(p));
```

---

### 95. What is endpoint routing?

**Endpoint routing** decouples route matching from endpoint execution.

```csharp
var app = builder.Build();

// UseRouting - matches route, selects endpoint
app.UseRouting();

// Middleware here can access the selected endpoint
app.Use(async (context, next) =>
{
    var endpoint = context.GetEndpoint();
    if (endpoint != null)
    {
        Console.WriteLine($"Endpoint: {endpoint.DisplayName}");
    }
    await next();
});

// UseEndpoints - executes the matched endpoint
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapRazorPages();
});

// Benefits:
// - Middleware can inspect selected endpoint before execution
// - Authorization can check endpoint metadata
// - Better integration between routing and other middleware
```

---

### 96. What is controller?

A **controller** handles HTTP requests and returns responses.

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _service;
    
    public ProductsController(IProductService service)
    {
        _service = service;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Product>>> GetAll()
    {
        var products = await _service.GetAllAsync();
        return Ok(products);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetById(int id)
    {
        var product = await _service.GetByIdAsync(id);
        if (product == null)
            return NotFound();
        return Ok(product);
    }
    
    [HttpPost]
    public async Task<ActionResult<Product>> Create(CreateProductDto dto)
    {
        var product = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
```

---

### 97. What is attribute routing?

**Attribute routing** uses attributes on controllers/actions to define routes.

```csharp
[ApiController]
[Route("api/v{version:int}/[controller]")]  // Route template on controller
public class OrdersController : ControllerBase
{
    [HttpGet]                              // GET api/v1/orders
    public IActionResult GetAll() => Ok();
    
    [HttpGet("{id:int}")]                  // GET api/v1/orders/5
    public IActionResult GetById(int id) => Ok();
    
    [HttpGet("pending")]                   // GET api/v1/orders/pending
    public IActionResult GetPending() => Ok();
    
    [HttpGet("{id}/items")]               // GET api/v1/orders/5/items
    public IActionResult GetOrderItems(int id) => Ok();
    
    [HttpPost]
    [Route("~/api/special-orders")]       // Override: GET api/special-orders
    public IActionResult CreateSpecial() => Ok();
}

// Route constraints
[HttpGet("{id:int:min(1)}")]              // Must be int >= 1
[HttpGet("{name:alpha:minlength(3)}")]    // Must be letters, min 3
[HttpGet("{date:datetime}")]              // Must be valid date
```

---

### 98. What is model binding?

**Model binding** automatically maps HTTP request data to action parameters.

```csharp
public class SearchQuery
{
    public string Term { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    // Binds from query string: /api/search?term=phone&page=2
    [HttpGet]
    public IActionResult Search([FromQuery] SearchQuery query)
    {
        return Ok($"Searching for {query.Term}, page {query.Page}");
    }
    
    // Binds from route: /api/search/users/5
    [HttpGet("users/{id}")]
    public IActionResult GetUser([FromRoute] int id) => Ok();
    
    // Binds from body (JSON)
    [HttpPost]
    public IActionResult Create([FromBody] CreateDto dto) => Ok();
    
    // Binds from header
    [HttpGet("auth")]
    public IActionResult Auth([FromHeader(Name = "X-Api-Key")] string apiKey) => Ok();
    
    // Binds from form
    [HttpPost("upload")]
    public IActionResult Upload([FromForm] IFormFile file) => Ok();
}
```

**Binding Sources:**
- `[FromQuery]` - Query string
- `[FromRoute]` - Route parameters
- `[FromBody]` - Request body
- `[FromHeader]` - HTTP headers
- `[FromForm]` - Form data

---

### 99. What is model validation?

**Model validation** ensures incoming data meets requirements.

```csharp
public class CreateUserDto
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "Password must contain uppercase, lowercase, and digit")]
    public string Password { get; set; }
    
    [Range(18, 120)]
    public int Age { get; set; }
    
    [Url]
    public string Website { get; set; }
}

[ApiController]  // Automatically validates and returns 400 if invalid
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpPost]
    public IActionResult Create(CreateUserDto dto)
    {
        // With [ApiController], validation is automatic
        // ModelState.IsValid is always true here
        
        return Ok(dto);
    }
}

// Custom validation attribute
public class FutureDateAttribute : ValidationAttribute
{
    protected override ValidationResult IsValid(object value, ValidationContext context)
    {
        if (value is DateTime date && date <= DateTime.Now)
        {
            return new ValidationResult("Date must be in the future");
        }
        return ValidationResult.Success;
    }
}
```

---

### 100. What is dependency injection?

**Dependency Injection (DI)** provides dependencies to classes instead of having them create dependencies themselves.

```csharp
// 1. Define interface
public interface IEmailService
{
    Task SendAsync(string to, string subject, string body);
}

// 2. Implement interface
public class SmtpEmailService : IEmailService
{
    public async Task SendAsync(string to, string subject, string body)
    {
        // Send email via SMTP
    }
}

// 3. Register in DI container
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// 4. Inject into controller
public class NotificationController : ControllerBase
{
    private readonly IEmailService _emailService;
    
    public NotificationController(IEmailService emailService)
    {
        _emailService = emailService;  // Injected by DI
    }
    
    [HttpPost]
    public async Task<IActionResult> Send(NotificationDto dto)
    {
        await _emailService.SendAsync(dto.To, dto.Subject, dto.Body);
        return Ok();
    }
}
```

**Benefits:**
- Loose coupling
- Testability (mock dependencies)
- Flexibility (swap implementations)

---

### 101. What is service container?

The **service container** (IoC container) manages dependency registration and resolution.

```csharp
var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;  // IServiceCollection

// Register services
services.AddScoped<IUserService, UserService>();
services.AddSingleton<ICacheService, RedisCacheService>();
services.AddTransient<IEmailService, EmailService>();

// Register with factory
services.AddScoped<IDbConnection>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new SqlConnection(config.GetConnectionString("Default"));
});

// Register open generics
services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Build the app
var app = builder.Build();

// Manual resolution (avoid if possible)
using var scope = app.Services.CreateScope();
var service = scope.ServiceProvider.GetRequiredService<IUserService>();
```

---

### 102. What is AddScoped?

`AddScoped` registers a service with **scoped lifetime** - one instance per request.

```csharp
builder.Services.AddScoped<IUserService, UserService>();

// Each HTTP request gets ONE instance
// Same instance throughout the request
// Different requests get different instances

public class OrderService
{
    private readonly IUserService _userService;  // Same instance as other scoped services in this request
    
    public OrderService(IUserService userService)
    {
        _userService = userService;
    }
}
```

**Use for:**
- Database contexts (DbContext)
- Services that hold request-specific state
- Unit of work pattern

```csharp
// DbContext is scoped by default
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));  // Internally uses AddScoped
```

---

### 103. What is AddSingleton?

`AddSingleton` registers a service with **singleton lifetime** - one instance for the entire application.

```csharp
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

// ONE instance for the entire application lifetime
// Shared across all requests and threads
// Created on first request or at startup

// With concrete instance
var cache = new MemoryCacheService();
builder.Services.AddSingleton<ICacheService>(cache);

// With factory
builder.Services.AddSingleton<IConfigService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new ConfigService(config);
});
```

**Use for:**
- Configuration services
- Caching
- Logging
- Thread-safe stateless services

**Warning:** Must be thread-safe! Don't inject scoped services into singletons.

---

### 104. What is AddTransient?

`AddTransient` registers a service with **transient lifetime** - new instance every time.

```csharp
builder.Services.AddTransient<IEmailService, EmailService>();

// NEW instance every time it's requested
// Even within the same request, different injections = different instances

public class NotificationService
{
    private readonly IEmailService _email1;
    private readonly IEmailService _email2;
    
    public NotificationService(IEmailService email1, IEmailService email2)
    {
        // email1 and email2 are DIFFERENT instances
    }
}
```

**Use for:**
- Lightweight, stateless services
- Services that shouldn't be shared
- Services with no expensive initialization

**Comparison:**
| Lifetime | Instance Created | Use Case |
|----------|------------------|----------|
| Transient | Every injection | Stateless services |
| Scoped | Once per request | DbContext, request state |
| Singleton | Once per app | Caching, configuration |

---

### 105. What is IActionResult?

`IActionResult` is an interface representing an HTTP response.

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var product = _repo.Find(id);
        
        if (product == null)
            return NotFound();                    // 404
            
        return Ok(product);                       // 200 with body
    }
    
    [HttpPost]
    public IActionResult Create(ProductDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);        // 400
            
        var product = _repo.Create(dto);
        return CreatedAtAction(                   // 201
            nameof(GetById), 
            new { id = product.Id }, 
            product);
    }
    
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _repo.Delete(id);
        return NoContent();                       // 204
    }
}

// Common IActionResult types:
// Ok()           - 200 OK
// Created()     - 201 Created
// NoContent()   - 204 No Content
// BadRequest()  - 400 Bad Request
// Unauthorized() - 401 Unauthorized
// Forbid()      - 403 Forbidden
// NotFound()    - 404 Not Found
// Conflict()    - 409 Conflict
```

---

### 106. What is ActionResult<T>?

`ActionResult<T>` combines `IActionResult` with a strongly-typed response.

```csharp
[HttpGet("{id}")]
public ActionResult<Product> GetById(int id)
{
    var product = _repo.Find(id);
    
    if (product == null)
        return NotFound();    // Still can return IActionResult
        
    return product;           // Implicit conversion to ActionResult<Product>
}

// Benefits over IActionResult:
// 1. Swagger/OpenAPI generates better documentation
// 2. Compile-time type checking
// 3. Cleaner code (implicit conversion)

[HttpGet]
public async Task<ActionResult<List<Product>>> GetAll()
{
    var products = await _repo.GetAllAsync();
    return products;  // No need for Ok(products)
}

// With async
[HttpGet("{id}")]
public async Task<ActionResult<Product>> GetByIdAsync(int id)
{
    var product = await _repo.FindAsync(id);
    return product ?? (ActionResult<Product>)NotFound();
}
```

---

### 107. What is FromBody?

`[FromBody]` binds data from the HTTP request body (typically JSON).

```csharp
public class CreateOrderDto
{
    public string CustomerId { get; set; }
    public List<OrderItemDto> Items { get; set; }
    public decimal Total { get; set; }
}

[HttpPost]
public IActionResult CreateOrder([FromBody] CreateOrderDto dto)
{
    // JSON body is automatically deserialized to CreateOrderDto
    return Ok();
}

// Request:
// POST /api/orders
// Content-Type: application/json
// {
//     "customerId": "123",
//     "items": [{ "productId": 1, "quantity": 2 }],
//     "total": 99.99
// }
```

**Notes:**
- `[ApiController]` makes `[FromBody]` implicit for complex types
- Only ONE `[FromBody]` per action
- Uses configured JSON serializer (System.Text.Json by default)

---

### 108. What is FromQuery?

`[FromQuery]` binds data from URL query string parameters.

```csharp
// GET /api/products?category=electronics&minPrice=100&maxPrice=500&page=1

[HttpGet]
public IActionResult Search(
    [FromQuery] string category,
    [FromQuery] decimal? minPrice,
    [FromQuery] decimal? maxPrice,
    [FromQuery] int page = 1)
{
    // Parameters bound from query string
    return Ok();
}

// Complex object from query
public class SearchFilter
{
    public string Category { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

[HttpGet]
public IActionResult Search([FromQuery] SearchFilter filter)
{
    // All properties bound from query string
    return Ok();
}

// Array parameters
// GET /api/products?ids=1&ids=2&ids=3
[HttpGet]
public IActionResult GetMultiple([FromQuery] int[] ids)
{
    return Ok(ids);  // [1, 2, 3]
}
```

---

### 109. What is FromRoute?

`[FromRoute]` binds data from URL route segments.

```csharp
// Route: api/users/{userId}/orders/{orderId}

[HttpGet("{userId}/orders/{orderId}")]
public IActionResult GetOrder(
    [FromRoute] int userId,
    [FromRoute] int orderId)
{
    // GET /api/users/5/orders/123
    // userId = 5, orderId = 123
    return Ok();
}

// With route constraints
[HttpGet("{id:int:min(1)}")]
public IActionResult GetById([FromRoute] int id)
{
    return Ok();
}

// Note: [FromRoute] is often implicit
[HttpGet("{id}")]
public IActionResult GetById(int id)  // Implicitly [FromRoute]
{
    return Ok();
}

// Combined with other sources
[HttpGet("{category}")]
public IActionResult GetProducts(
    [FromRoute] string category,           // From URL
    [FromQuery] int page = 1,              // From query string
    [FromHeader(Name = "X-Client")] string client = null)  // From header
{
    return Ok();
}
```

---

### 110. What is appsettings.json?

`appsettings.json` is the default configuration file for ASP.NET Core applications.

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  },
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=MyDb;..."
  },
  "AppSettings": {
    "ApiKey": "your-api-key",
    "MaxRetries": 3,
    "Features": {
      "EnableNewFeature": true
    }
  },
  "AllowedHosts": "*"
}
```

**Environment-specific files:**
- `appsettings.json` - Base settings
- `appsettings.Development.json` - Dev overrides
- `appsettings.Production.json` - Prod overrides

```csharp
// Configuration is auto-loaded
var builder = WebApplication.CreateBuilder(args);

// Access configuration
var connectionString = builder.Configuration.GetConnectionString("Default");
var apiKey = builder.Configuration["AppSettings:ApiKey"];
var maxRetries = builder.Configuration.GetValue<int>("AppSettings:MaxRetries");
```

---

### 111. What is IConfiguration?

`IConfiguration` provides access to configuration values from various sources.

```csharp
public class EmailService
{
    private readonly string _apiKey;
    private readonly int _maxRetries;
    
    public EmailService(IConfiguration configuration)
    {
        _apiKey = configuration["Email:ApiKey"];
        _maxRetries = configuration.GetValue<int>("Email:MaxRetries", 3);
    }
}

// Strongly-typed configuration (preferred)
public class EmailSettings
{
    public string ApiKey { get; set; }
    public int MaxRetries { get; set; }
    public string FromAddress { get; set; }
}

// Register in Program.cs
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("Email"));

// Inject IOptions<T>
public class EmailService
{
    private readonly EmailSettings _settings;
    
    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }
}
```

**Configuration Sources (in order of priority):**
1. Command-line arguments
2. Environment variables
3. User secrets (Development)
4. `appsettings.{Environment}.json`
5. `appsettings.json`

---

### 112. What is logging?

**Logging** records application events for debugging and monitoring.

```csharp
public class OrderService
{
    private readonly ILogger<OrderService> _logger;
    
    public OrderService(ILogger<OrderService> logger)
    {
        _logger = logger;
    }
    
    public async Task<Order> CreateOrderAsync(OrderDto dto)
    {
        _logger.LogInformation("Creating order for customer {CustomerId}", dto.CustomerId);
        
        try
        {
            var order = await ProcessOrder(dto);
            _logger.LogInformation("Order {OrderId} created successfully", order.Id);
            return order;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create order for customer {CustomerId}", dto.CustomerId);
            throw;
        }
    }
}

// Log levels (in order of severity)
_logger.LogTrace("Detailed trace");      // Most verbose
_logger.LogDebug("Debug info");
_logger.LogInformation("General info");
_logger.LogWarning("Warning");
_logger.LogError(ex, "Error occurred");
_logger.LogCritical(ex, "Critical!");    // Most severe
```

**Configuration:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "MyApp.Services": "Debug"
    }
  }
}
```

---

### 113. What is Swagger?

**Swagger (OpenAPI)** generates interactive API documentation.

```csharp
// Install: dotnet add package Swashbuckle.AspNetCore

var builder = WebApplication.CreateBuilder(args);

// Add Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "API documentation"
    });
});

var app = builder.Build();

// Enable Swagger middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "My API v1");
    });
}
```

**Document your endpoints:**
```csharp
/// <summary>
/// Gets a product by ID
/// </summary>
/// <param name="id">The product ID</param>
/// <returns>The product</returns>
/// <response code="200">Returns the product</response>
/// <response code="404">Product not found</response>
[HttpGet("{id}")]
[ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public ActionResult<Product> GetById(int id)
{
    // ...
}
```

---

### 114. What is REST?

**REST (Representational State Transfer)** is an architectural style for web APIs.

**Principles:**
1. **Stateless** - Each request contains all needed information
2. **Client-Server** - Separation of concerns
3. **Cacheable** - Responses can be cached
4. **Uniform Interface** - Consistent resource-based URLs
5. **Layered System** - Client doesn't know if connected directly to server

```csharp
// RESTful API design
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    // GET /api/users - Get all users
    [HttpGet]
    public async Task<ActionResult<List<User>>> GetAll() { }
    
    // GET /api/users/5 - Get specific user
    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetById(int id) { }
    
    // POST /api/users - Create user
    [HttpPost]
    public async Task<ActionResult<User>> Create(CreateUserDto dto) { }
    
    // PUT /api/users/5 - Update entire user
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateUserDto dto) { }
    
    // PATCH /api/users/5 - Partial update
    [HttpPatch("{id}")]
    public async Task<IActionResult> Patch(int id, JsonPatchDocument<User> patch) { }
    
    // DELETE /api/users/5 - Delete user
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) { }
}
```

---

### 115. What is HTTP verbs?

**HTTP verbs** (methods) indicate the desired action on a resource.

| Verb | Purpose | Idempotent | Safe |
|------|---------|------------|------|
| GET | Retrieve resource | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Partial update | Yes | No |
| DELETE | Remove resource | Yes | No |
| HEAD | Get headers only | Yes | Yes |
| OPTIONS | Get allowed methods | Yes | Yes |

```csharp
[HttpGet]       // Read - no side effects
[HttpPost]      // Create - new resource
[HttpPut]       // Update - replace entire resource
[HttpPatch]     // Update - partial modification
[HttpDelete]    // Delete - remove resource

// Idempotent: Multiple identical requests = same result
// GET /users/1 - Always returns same user
// PUT /users/1 - Always results in same state
// DELETE /users/1 - First deletes, subsequent do nothing

// Safe: No side effects on server
// GET, HEAD, OPTIONS are safe
```

---

### 116. What is status codes?

**HTTP status codes** indicate the result of an HTTP request.

```csharp
// 2xx - Success
return Ok(data);                    // 200 OK
return Created(uri, resource);      // 201 Created
return Accepted();                  // 202 Accepted
return NoContent();                 // 204 No Content

// 3xx - Redirection
return RedirectToAction("Index");   // 302 Found
return RedirectPermanent(url);      // 301 Moved Permanently

// 4xx - Client Errors
return BadRequest(errors);          // 400 Bad Request
return Unauthorized();              // 401 Unauthorized
return Forbid();                    // 403 Forbidden
return NotFound();                  // 404 Not Found
return Conflict();                  // 409 Conflict
return UnprocessableEntity(errors); // 422 Unprocessable Entity

// 5xx - Server Errors
return StatusCode(500);             // 500 Internal Server Error
return StatusCode(503);             // 503 Service Unavailable
```

**Common Codes:**
| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected server error |

---

### 117. What is CORS?

**CORS (Cross-Origin Resource Sharing)** controls which domains can access your API.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configure CORS
builder.Services.AddCors(options =>
{
    // Named policy
    options.AddPolicy("AllowMyApp", policy =>
    {
        policy.WithOrigins("https://myapp.com", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    
    // Allow all (not for production!)
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Use CORS globally
app.UseCors("AllowMyApp");

// Or per-endpoint
app.MapGet("/api/public", () => "Hello")
    .RequireCors("AllowAll");

// Or per-controller
[EnableCors("AllowMyApp")]
[ApiController]
public class DataController : ControllerBase { }
```

---

### 118. What is authentication?

**Authentication** verifies WHO the user is (identity).

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "https://myapi.com",
            ValidAudience = "https://myapp.com",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("your-secret-key"))
        };
    });

var app = builder.Build();

app.UseAuthentication();  // Must come before UseAuthorization
app.UseAuthorization();

// Require authentication
[Authorize]
[ApiController]
public class SecureController : ControllerBase
{
    [HttpGet]
    public IActionResult GetSecureData()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Ok($"Hello, user {userId}");
    }
}
```

---

### 119. What is authorization?

**Authorization** verifies WHAT the user can do (permissions).

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthorization(options =>
{
    // Role-based policy
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
    
    // Claim-based policy
    options.AddPolicy("PremiumUser", policy =>
        policy.RequireClaim("subscription", "premium"));
    
    // Custom policy
    options.AddPolicy("MinimumAge", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
});

// Apply authorization
[Authorize]  // Must be authenticated
public class AccountController : ControllerBase { }

[Authorize(Roles = "Admin")]  // Must have Admin role
public class AdminController : ControllerBase { }

[Authorize(Policy = "PremiumUser")]  // Must satisfy policy
public class PremiumController : ControllerBase { }

// Per-action
[HttpDelete("{id}")]
[Authorize(Roles = "Admin,Manager")]
public IActionResult Delete(int id) { }

[AllowAnonymous]  // Override authentication requirement
public IActionResult PublicEndpoint() { }
```

---

### 120. What is HTTPS?

**HTTPS** encrypts communication between client and server using TLS/SSL.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Force HTTPS
app.UseHttpsRedirection();

// HSTS (HTTP Strict Transport Security)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Configure Kestrel for HTTPS
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5001, listenOptions =>
    {
        listenOptions.UseHttps("certificate.pfx", "password");
    });
});

// Or use appsettings.json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://localhost:5001",
        "Certificate": {
          "Path": "certificate.pfx",
          "Password": "password"
        }
      }
    }
  }
}
```

**Why HTTPS?**
- Encrypts data in transit
- Prevents man-in-the-middle attacks
- Required for HTTP/2
- Required for modern browser features
- SEO benefits

---

## Summary Table

| Concept | Purpose |
|---------|---------|
| Kestrel | High-performance web server |
| Middleware | Request/response pipeline components |
| Routing | Map URLs to handlers |
| Controller | Handle HTTP requests |
| Model Binding | Map request data to parameters |
| Model Validation | Validate incoming data |
| Dependency Injection | Provide dependencies to classes |
| AddScoped | One instance per request |
| AddSingleton | One instance per application |
| AddTransient | New instance every time |
| IActionResult | HTTP response abstraction |
| FromBody/Query/Route | Specify binding source |
| IConfiguration | Access configuration |
| Logging | Record application events |
| Swagger | API documentation |
| REST | API architectural style |
| HTTP Verbs | GET, POST, PUT, DELETE, etc. |
| Status Codes | Response result indicators |
| CORS | Cross-origin access control |
| Authentication | Verify identity |
| Authorization | Verify permissions |
| HTTPS | Encrypted communication |

---

*Next: [Part 5 - EF Core Basics](05-beginner-ef-core.md)*
