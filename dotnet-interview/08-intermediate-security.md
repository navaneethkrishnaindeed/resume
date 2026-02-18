# .NET Interview Guide - Intermediate Level
## Part 8: Security & Real Backend (Questions 81-120)

---

### 81. What is JWT?

**JWT (JSON Web Token)** is a compact, self-contained token for securely transmitting information.

```
Header.Payload.Signature

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

```csharp
// Generate JWT
public string GenerateToken(User user)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role)
    };
    
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    
    var token = new JwtSecurityToken(
        issuer: _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(1),
        signingCredentials: credentials);
    
    return new JwtSecurityTokenHandler().WriteToken(token);
}

// Configure validation
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidAudience = config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(config["Jwt:Key"]))
        };
    });
```

---

### 82. What is refresh token?

**Refresh token** allows obtaining new access tokens without re-authentication.

```csharp
public class TokenService
{
    public TokenPair GenerateTokenPair(User user)
    {
        var accessToken = GenerateAccessToken(user);  // Short-lived (15 min)
        var refreshToken = GenerateRefreshToken();    // Long-lived (7 days)
        
        // Store refresh token in database
        _context.RefreshTokens.Add(new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });
        
        return new TokenPair(accessToken, refreshToken);
    }
    
    public async Task<TokenPair> RefreshAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken);
        
        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
            throw new SecurityException("Invalid refresh token");
        
        // Revoke old token
        storedToken.IsRevoked = true;
        
        // Generate new pair
        var user = await _context.Users.FindAsync(storedToken.UserId);
        return GenerateTokenPair(user);
    }
    
    private string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
```

---

### 83. What is token rotation?

**Token rotation** replaces refresh tokens on each use to limit damage from stolen tokens.

```csharp
public async Task<TokenPair> RotateTokensAsync(string refreshToken)
{
    var storedToken = await _context.RefreshTokens
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Token == refreshToken);
    
    if (storedToken == null)
        throw new SecurityException("Invalid token");
    
    // Check if already used (replay attack)
    if (storedToken.IsUsed)
    {
        // Token reuse detected! Revoke entire family
        await RevokeTokenFamilyAsync(storedToken.FamilyId);
        throw new SecurityException("Token reuse detected");
    }
    
    if (storedToken.ExpiresAt < DateTime.UtcNow)
        throw new SecurityException("Token expired");
    
    // Mark as used
    storedToken.IsUsed = true;
    
    // Create new token in same family
    var newRefreshToken = new RefreshToken
    {
        Token = GenerateSecureToken(),
        UserId = storedToken.UserId,
        FamilyId = storedToken.FamilyId,  // Same family for tracking
        ExpiresAt = DateTime.UtcNow.AddDays(7)
    };
    
    _context.RefreshTokens.Add(newRefreshToken);
    await _context.SaveChangesAsync();
    
    return new TokenPair(
        GenerateAccessToken(storedToken.User),
        newRefreshToken.Token);
}
```

---

### 84. What is claims?

**Claims** are key-value pairs representing user attributes and permissions.

```csharp
// Add claims during token generation
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Name, user.Username),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim(ClaimTypes.Role, "Admin"),
    new Claim("department", "Engineering"),
    new Claim("permission", "users:read"),
    new Claim("permission", "users:write"),
    new Claim("tenant_id", user.TenantId.ToString())
};

// Access claims in controller
[HttpGet]
public IActionResult GetProfile()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var email = User.FindFirst(ClaimTypes.Email)?.Value;
    var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);
    var permissions = User.FindAll("permission").Select(c => c.Value);
    
    return Ok(new { userId, email, roles, permissions });
}

// Claims transformation
public class CustomClaimsTransformation : IClaimsTransformation
{
    private readonly IPermissionService _permissions;
    
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var identity = (ClaimsIdentity)principal.Identity;
        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var permissions = await _permissions.GetPermissionsAsync(userId);
        foreach (var permission in permissions)
        {
            identity.AddClaim(new Claim("permission", permission));
        }
        
        return principal;
    }
}
```

---

### 85. What is role-based authorization?

**Role-based authorization** restricts access based on user roles.

```csharp
// Configure roles
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("Admin"));
    
    options.AddPolicy("ModeratorOrAdmin", policy =>
        policy.RequireRole("Moderator", "Admin"));
});

// Apply to controllers/actions
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase { }

[Authorize(Roles = "Admin,Manager")]
[HttpDelete("{id}")]
public IActionResult Delete(int id) { }

// Check role in code
[HttpGet]
public IActionResult Dashboard()
{
    if (User.IsInRole("Admin"))
    {
        return Ok(GetAdminDashboard());
    }
    return Ok(GetUserDashboard());
}

// Add roles to claims
var claims = new List<Claim>
{
    new Claim(ClaimTypes.Role, "User"),
    new Claim(ClaimTypes.Role, "Manager")  // Multiple roles
};
```

---

### 86. What is policy-based authorization?

**Policy-based authorization** uses requirements and handlers for complex rules.

```csharp
// Define requirement
public class MinimumAgeRequirement : IAuthorizationRequirement
{
    public int MinimumAge { get; }
    public MinimumAgeRequirement(int age) => MinimumAge = age;
}

// Handler evaluates requirement
public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumAgeRequirement requirement)
    {
        var birthDateClaim = context.User.FindFirst("birthdate");
        if (birthDateClaim == null) return Task.CompletedTask;
        
        var birthDate = DateTime.Parse(birthDateClaim.Value);
        var age = DateTime.Today.Year - birthDate.Year;
        
        if (age >= requirement.MinimumAge)
        {
            context.Succeed(requirement);
        }
        
        return Task.CompletedTask;
    }
}

// Register policy
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AtLeast21", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(21)));
});

builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();

// Apply policy
[Authorize(Policy = "AtLeast21")]
public IActionResult PurchaseAlcohol() { }

// Resource-based authorization
public class DocumentAuthorizationHandler : 
    AuthorizationHandler<OperationAuthorizationRequirement, Document>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OperationAuthorizationRequirement requirement,
        Document resource)
    {
        if (requirement.Name == "Edit" && 
            resource.OwnerId == context.User.GetUserId())
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
```

---

### 87. What is OAuth2?

**OAuth2** is an authorization framework that enables third-party access to resources.

```csharp
// OAuth2 flows:
// 1. Authorization Code (web apps)
// 2. Client Credentials (service-to-service)
// 3. Resource Owner Password (legacy)
// 4. Implicit (deprecated)

// Configure OAuth2 authentication
builder.Services.AddAuthentication()
    .AddOAuth("GitHub", options =>
    {
        options.ClientId = config["GitHub:ClientId"];
        options.ClientSecret = config["GitHub:ClientSecret"];
        options.AuthorizationEndpoint = "https://github.com/login/oauth/authorize";
        options.TokenEndpoint = "https://github.com/login/oauth/access_token";
        options.UserInformationEndpoint = "https://api.github.com/user";
        options.CallbackPath = "/signin-github";
        options.SaveTokens = true;
        
        options.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "id");
        options.ClaimActions.MapJsonKey(ClaimTypes.Name, "login");
        
        options.Events = new OAuthEvents
        {
            OnCreatingTicket = async context =>
            {
                // Fetch user info
                var request = new HttpRequestMessage(HttpMethod.Get, 
                    context.Options.UserInformationEndpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue(
                    "Bearer", context.AccessToken);
                
                var response = await context.Backchannel.SendAsync(request);
                var user = await response.Content.ReadFromJsonAsync<JsonElement>();
                context.RunClaimActions(user);
            }
        };
    });
```

---

### 88. What is OpenID Connect?

**OpenID Connect (OIDC)** adds identity layer on top of OAuth2.

```csharp
// OIDC provides:
// - ID Token (user identity)
// - UserInfo endpoint
// - Standard claims
// - Discovery document

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    options.Authority = "https://login.microsoftonline.com/tenant-id/v2.0";
    options.ClientId = config["AzureAd:ClientId"];
    options.ClientSecret = config["AzureAd:ClientSecret"];
    options.ResponseType = "code";
    options.SaveTokens = true;
    
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role"
    };
    
    options.Events = new OpenIdConnectEvents
    {
        OnTokenValidated = async context =>
        {
            // Add custom claims from database
            var userService = context.HttpContext.RequestServices
                .GetRequiredService<IUserService>();
            await userService.SyncUserAsync(context.Principal);
        }
    };
});
```

---

### 89. What is CSRF?

**CSRF (Cross-Site Request Forgery)** tricks users into executing unwanted actions.

```csharp
// Attack: Malicious site submits form to your site using user's cookies

// Protection with anti-forgery tokens
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "CSRF-TOKEN";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// MVC/Razor Pages - automatic protection
[ValidateAntiForgeryToken]
[HttpPost]
public IActionResult Submit(FormModel model) { }

// In Razor views
<form method="post">
    @Html.AntiForgeryToken()
    <!-- form fields -->
</form>

// APIs typically use:
// 1. Custom headers (not sent by simple forms)
// 2. SameSite cookies
// 3. JWT in Authorization header

// SameSite cookie protection
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Strict;  // Best protection
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});
```

---

### 90. What is XSS?

**XSS (Cross-Site Scripting)** injects malicious scripts into web pages.

```csharp
// Types:
// 1. Stored XSS - malicious script stored in database
// 2. Reflected XSS - script in URL parameters
// 3. DOM XSS - client-side script manipulation

// Protection: Encode output
@Html.Encode(userInput)  // Razor encodes by default
@userInput               // Auto-encoded
@Html.Raw(userInput)     // ❌ Dangerous! No encoding

// Content Security Policy
app.Use(async (context, next) =>
{
    context.Response.Headers.Add(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' 'nonce-abc123'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:;");
    await next();
});

// Input validation
public class CommentDto
{
    [Required]
    [StringLength(1000)]
    [RegularExpression(@"^[a-zA-Z0-9\s.,!?-]+$")]
    public string Content { get; set; }
}

// Sanitize HTML input (use HtmlSanitizer library)
var sanitizer = new HtmlSanitizer();
var sanitized = sanitizer.Sanitize(userHtml);
```

---

### 91. What is SQL injection?

**SQL injection** inserts malicious SQL through user input.

```csharp
// ❌ VULNERABLE - string concatenation
var query = $"SELECT * FROM Users WHERE Username = '{username}'";
// Input: ' OR '1'='1
// Becomes: SELECT * FROM Users WHERE Username = '' OR '1'='1'

// ✓ SAFE - parameterized queries
using var cmd = new SqlCommand(
    "SELECT * FROM Users WHERE Username = @username", connection);
cmd.Parameters.AddWithValue("@username", username);

// ✓ SAFE - Dapper
var users = await connection.QueryAsync<User>(
    "SELECT * FROM Users WHERE Username = @Username",
    new { Username = username });

// ✓ SAFE - EF Core (uses parameters automatically)
var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Username == username);

// ❌ VULNERABLE - raw SQL
var users = await _context.Users
    .FromSqlRaw($"SELECT * FROM Users WHERE Username = '{username}'")
    .ToListAsync();

// ✓ SAFE - FromSqlInterpolated
var users = await _context.Users
    .FromSqlInterpolated($"SELECT * FROM Users WHERE Username = {username}")
    .ToListAsync();
```

---

### 92. How EF prevents SQL injection?

EF Core uses parameterized queries automatically.

```csharp
// LINQ queries are always safe
var users = await _context.Users
    .Where(u => u.Email == userInput)
    .ToListAsync();

// Generated SQL:
// SELECT * FROM Users WHERE Email = @p0
// @p0 = 'user@example.com'

// FromSqlInterpolated is safe
var products = await _context.Products
    .FromSqlInterpolated($"SELECT * FROM Products WHERE Name = {name}")
    .ToListAsync();
// Uses parameterized query

// Raw SQL with explicit parameters
var products = await _context.Products
    .FromSqlRaw("SELECT * FROM Products WHERE Name = {0}", name)
    .ToListAsync();
// Also parameterized

// ExecuteSqlInterpolated for commands
await _context.Database.ExecuteSqlInterpolatedAsync(
    $"UPDATE Products SET Price = {newPrice} WHERE Id = {id}");

// ❌ NEVER do this
var sql = $"SELECT * FROM Products WHERE Name = '{name}'";
await _context.Products.FromSqlRaw(sql).ToListAsync();  // Vulnerable!
```

---

### 93. What is hashing?

**Hashing** converts data into a fixed-size value that cannot be reversed.

```csharp
// Password hashing with ASP.NET Core Identity
var passwordHasher = new PasswordHasher<User>();
var hashedPassword = passwordHasher.HashPassword(user, "password123");
var result = passwordHasher.VerifyHashedPassword(user, hashedPassword, "password123");
// result: PasswordVerificationResult.Success

// SHA-256 for data integrity (NOT for passwords)
using var sha256 = SHA256.Create();
var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(data));
var hashString = Convert.ToHexString(hash);

// HMAC for message authentication
using var hmac = new HMACSHA256(key);
var signature = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));

// Properties of good password hashing:
// 1. Slow (bcrypt, Argon2, PBKDF2)
// 2. Salted (prevent rainbow tables)
// 3. Strong algorithm

// Don't use for passwords:
// MD5, SHA1, SHA256 (too fast)
```

---

### 94. What is bcrypt?

**bcrypt** is a password hashing function designed to be slow and resistant to brute force.

```csharp
// Install: BCrypt.Net-Next

// Hash password
string hashedPassword = BCrypt.Net.BCrypt.HashPassword("password123", workFactor: 12);
// Output: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.jn/OEbmBmzq/Iy

// Verify password
bool isValid = BCrypt.Net.BCrypt.Verify("password123", hashedPassword);

// Work factor (cost):
// - Higher = slower = more secure
// - 10-12 typical for web apps
// - Adjust based on server performance

// BCrypt format:
// $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.jn/OEbmBmzq/Iy
// $2a$ = algorithm version
// 12$ = work factor
// LQv3...kCO = salt (22 chars)
// Yz6...q/Iy = hash (31 chars)

// Wrapper for ASP.NET Core
public class BcryptPasswordHasher<TUser> : IPasswordHasher<TUser> where TUser : class
{
    public string HashPassword(TUser user, string password)
        => BCrypt.Net.BCrypt.HashPassword(password, 12);
    
    public PasswordVerificationResult VerifyHashedPassword(
        TUser user, string hashedPassword, string providedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword)
            ? PasswordVerificationResult.Success
            : PasswordVerificationResult.Failed;
    }
}
```

---

### 95. What is data protection API?

**Data Protection API** provides cryptographic services for protecting data.

```csharp
// Registration
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/keys"))
    .SetApplicationName("MyApp")
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

// Usage
public class ProtectedDataService
{
    private readonly IDataProtector _protector;
    
    public ProtectedDataService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("MyApp.Secrets");
    }
    
    public string Protect(string input)
    {
        return _protector.Protect(input);
    }
    
    public string Unprotect(string protectedData)
    {
        return _protector.Unprotect(protectedData);
    }
}

// Time-limited protection
var timeLimitedProtector = _protector.ToTimeLimitedDataProtector();
var protected = timeLimitedProtector.Protect("data", TimeSpan.FromHours(1));

try
{
    var data = timeLimitedProtector.Unprotect(protected);
}
catch (CryptographicException)
{
    // Data expired or tampered
}

// Use cases:
// - Cookie values
// - Query string tokens
// - Sensitive form data
// - Password reset tokens
```

---

### 96. What is secret management?

**Secret management** securely stores sensitive configuration like API keys and passwords.

```csharp
// Development - User Secrets
// dotnet user-secrets init
// dotnet user-secrets set "ApiKey" "secret-value"

// Access in code
var apiKey = Configuration["ApiKey"];

// Secrets stored in:
// Windows: %APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json
// Linux/macOS: ~/.microsoft/usersecrets/<user_secrets_id>/secrets.json

// Production - Environment Variables
Environment.GetEnvironmentVariable("API_KEY");

// Configuration sources (in order of priority):
// 1. Command line
// 2. Environment variables
// 3. User secrets (Development)
// 4. appsettings.{Environment}.json
// 5. appsettings.json

// Best practices:
// - Never commit secrets to source control
// - Use different secrets per environment
// - Rotate secrets regularly
// - Use managed services (Key Vault, Secrets Manager)
```

---

### 97. What is Azure Key Vault?

**Azure Key Vault** is a cloud service for securely storing secrets, keys, and certificates.

```csharp
// Install packages:
// Azure.Identity
// Azure.Extensions.AspNetCore.Configuration.Secrets

// Configure Key Vault
builder.Configuration.AddAzureKeyVault(
    new Uri("https://my-vault.vault.azure.net/"),
    new DefaultAzureCredential());

// Access secrets like regular configuration
var connectionString = Configuration["DatabaseConnectionString"];
var apiKey = Configuration["ExternalApi--ApiKey"];  // Replaces -- with :

// Direct SDK usage
var client = new SecretClient(
    new Uri("https://my-vault.vault.azure.net/"),
    new DefaultAzureCredential());

KeyVaultSecret secret = await client.GetSecretAsync("MySecret");
string secretValue = secret.Value;

// Set secret
await client.SetSecretAsync("MySecret", "new-value");

// Authentication options:
// - DefaultAzureCredential (recommended)
// - ManagedIdentityCredential (Azure VMs, App Service)
// - ClientSecretCredential (service principal)
// - InteractiveBrowserCredential (development)
```

---

### 98. What is HTTPS redirection?

**HTTPS redirection** forces all HTTP traffic to use HTTPS.

```csharp
var app = builder.Build();

// Redirect HTTP to HTTPS
app.UseHttpsRedirection();

// Configure HTTPS redirection
builder.Services.AddHttpsRedirection(options =>
{
    options.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect;
    options.HttpsPort = 443;
});

// HSTS (HTTP Strict Transport Security)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
    options.ExcludedHosts.Add("example.com");
});

// Response headers:
// Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// Force HTTPS in production
builder.WebHost.UseKestrel(options =>
{
    options.ListenAnyIP(443, listenOptions =>
    {
        listenOptions.UseHttps("certificate.pfx", "password");
    });
});
```

---

### 99. What is HSTS?

**HSTS (HTTP Strict Transport Security)** tells browsers to only use HTTPS.

```csharp
// Enable HSTS
app.UseHsts();

// Configure HSTS
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);      // Duration
    options.IncludeSubDomains = true;              // Apply to subdomains
    options.Preload = true;                        // Allow preload list
    options.ExcludedHosts.Add("localhost");        // Exclude hosts
});

// Response header:
// Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// Preload list:
// Submit to https://hstspreload.org/
// Browser will use HTTPS even on first visit

// HSTS protects against:
// - SSL stripping attacks
// - Accidental HTTP access
// - Mixed content warnings

// Don't use in development (breaks localhost)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
```

---

### 100. What is rate limiting attack?

**Rate limiting attacks** and defenses control request frequency to prevent abuse.

```csharp
// Attack types:
// - Brute force login
// - DDoS
// - API abuse
// - Resource exhaustion

// Defense: Rate limiting
builder.Services.AddRateLimiter(options =>
{
    // Per-IP limiting
    options.AddPolicy("PerIp", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                PermitLimit = 100
            }));
    
    // Stricter for login endpoint
    options.AddPolicy("Login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(15),
                PermitLimit = 5,
                QueueLimit = 0
            }));
    
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync(
            "Too many requests. Try again later.");
    };
});

[EnableRateLimiting("Login")]
[HttpPost("login")]
public async Task<IActionResult> Login(LoginDto dto) { }
```

---

### 101. What is multi-tenant design?

**Multi-tenancy** serves multiple customers from a single application instance.

```csharp
// Tenant identification
public interface ITenantResolver
{
    string GetTenantId();
}

public class HeaderTenantResolver : ITenantResolver
{
    private readonly IHttpContextAccessor _accessor;
    
    public string GetTenantId()
    {
        return _accessor.HttpContext?.Request.Headers["X-Tenant-ID"].FirstOrDefault()
            ?? throw new TenantNotFoundException();
    }
}

// Tenant-aware DbContext
public class AppDbContext : DbContext
{
    private readonly ITenantResolver _tenantResolver;
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Global query filter for tenant isolation
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => o.TenantId == _tenantResolver.GetTenantId());
    }
    
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // Auto-set tenant on new entities
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.TenantId = _tenantResolver.GetTenantId();
            }
        }
        return base.SaveChangesAsync(ct);
    }
}
```

---

### 102. DB per tenant vs shared DB?

| Approach | Pros | Cons |
|----------|------|------|
| **DB per tenant** | Strong isolation, easy backup/restore, compliance | More resources, harder to manage |
| **Shared DB, schema per tenant** | Good isolation, moderate resources | Schema migration complexity |
| **Shared DB, shared schema** | Efficient, simple management | Risk of data leakage, noisy neighbors |

```csharp
// Shared DB with tenant column
public class Order
{
    public Guid Id { get; set; }
    public string TenantId { get; set; }  // Tenant identifier
    // ... other properties
}

// DB per tenant
public class TenantDbContextFactory
{
    public AppDbContext CreateContext(string tenantId)
    {
        var connectionString = GetConnectionStringForTenant(tenantId);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(connectionString)
            .Options;
        return new AppDbContext(options);
    }
}

// Hybrid approach: Major tenants get own DB
public class TenantConnectionResolver
{
    public string GetConnectionString(Tenant tenant)
    {
        return tenant.Plan == "Enterprise"
            ? tenant.DedicatedConnectionString
            : _sharedConnectionString;
    }
}
```

---

### 103. What is row-level security?

**Row-level security** restricts data access at the database level.

```csharp
// SQL Server Row-Level Security
// CREATE SECURITY POLICY TenantFilter
// ADD FILTER PREDICATE dbo.fn_tenant_filter(TenantId) ON dbo.Orders
// WITH (STATE = ON)

// EF Core query filter (application-level)
public class AppDbContext : DbContext
{
    private readonly string _tenantId;
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => o.TenantId == _tenantId);
        
        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c => c.TenantId == _tenantId);
    }
}

// PostgreSQL RLS
// ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
// CREATE POLICY tenant_isolation ON orders
//     USING (tenant_id = current_setting('app.tenant_id'));

// Set tenant context per request
public class TenantMiddleware
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        var tenantId = context.User.FindFirst("tenant_id")?.Value;
        await db.Database.ExecuteSqlRawAsync(
            $"SET app.tenant_id = '{tenantId}'");
        await _next(context);
    }
}
```

---

### 104. What is soft delete?

**Soft delete** marks records as deleted instead of removing them.

```csharp
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    string? DeletedBy { get; set; }
}

public class Order : ISoftDeletable
{
    public Guid Id { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}

// Global query filter
modelBuilder.Entity<Order>()
    .HasQueryFilter(o => !o.IsDeleted);

// Override SaveChanges
public override Task<int> SaveChangesAsync(CancellationToken ct = default)
{
    foreach (var entry in ChangeTracker.Entries<ISoftDeletable>())
    {
        if (entry.State == EntityState.Deleted)
        {
            entry.State = EntityState.Modified;
            entry.Entity.IsDeleted = true;
            entry.Entity.DeletedAt = DateTime.UtcNow;
            entry.Entity.DeletedBy = _currentUser.Id;
        }
    }
    return base.SaveChangesAsync(ct);
}

// Query including deleted
var allOrders = await _context.Orders
    .IgnoreQueryFilters()
    .ToListAsync();
```

---

### 105. What is audit logging?

**Audit logging** tracks who did what and when.

```csharp
public class AuditLog
{
    public Guid Id { get; set; }
    public string EntityType { get; set; }
    public string EntityId { get; set; }
    public string Action { get; set; }  // Create, Update, Delete
    public string UserId { get; set; }
    public DateTime Timestamp { get; set; }
    public string OldValues { get; set; }
    public string NewValues { get; set; }
    public string IpAddress { get; set; }
}

public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
{
    var auditEntries = new List<AuditLog>();
    
    foreach (var entry in ChangeTracker.Entries())
    {
        if (entry.Entity is AuditLog || entry.State == EntityState.Unchanged)
            continue;
        
        var audit = new AuditLog
        {
            EntityType = entry.Entity.GetType().Name,
            EntityId = GetPrimaryKey(entry),
            Action = entry.State.ToString(),
            UserId = _currentUser.Id,
            Timestamp = DateTime.UtcNow,
            IpAddress = _httpContext.Connection.RemoteIpAddress?.ToString()
        };
        
        if (entry.State == EntityState.Modified)
        {
            audit.OldValues = JsonSerializer.Serialize(
                entry.OriginalValues.ToObject());
            audit.NewValues = JsonSerializer.Serialize(
                entry.CurrentValues.ToObject());
        }
        
        auditEntries.Add(audit);
    }
    
    AuditLogs.AddRange(auditEntries);
    return await base.SaveChangesAsync(ct);
}
```

---

### 106. What is idempotency?

**Idempotency** ensures multiple identical requests produce the same result.

```csharp
// Idempotency key pattern
[HttpPost("payments")]
public async Task<IActionResult> CreatePayment(
    [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
    PaymentRequest request)
{
    // Check if request was already processed
    var existing = await _cache.GetAsync<PaymentResult>(idempotencyKey);
    if (existing != null)
    {
        return Ok(existing);  // Return cached result
    }
    
    // Process payment
    var result = await _paymentService.ProcessAsync(request);
    
    // Cache result
    await _cache.SetAsync(idempotencyKey, result, TimeSpan.FromHours(24));
    
    return Ok(result);
}

// Database-level idempotency
public async Task<Payment> CreatePaymentAsync(string idempotencyKey, PaymentRequest request)
{
    await using var transaction = await _context.Database.BeginTransactionAsync();
    
    var existing = await _context.Payments
        .FirstOrDefaultAsync(p => p.IdempotencyKey == idempotencyKey);
    
    if (existing != null)
        return existing;
    
    var payment = new Payment
    {
        IdempotencyKey = idempotencyKey,
        Amount = request.Amount
    };
    
    _context.Payments.Add(payment);
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
    
    return payment;
}
```

---

### 107. What is correlation ID?

**Correlation ID** tracks requests across services for debugging and tracing.

```csharp
// Middleware to handle correlation IDs
public class CorrelationIdMiddleware
{
    private const string HeaderName = "X-Correlation-ID";
    
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
            ?? Guid.NewGuid().ToString();
        
        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;
        
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        }))
        {
            await _next(context);
        }
    }
}

// Propagate to downstream services
public class CorrelationIdHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _accessor;
    
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var correlationId = _accessor.HttpContext?.Items["CorrelationId"]?.ToString();
        if (!string.IsNullOrEmpty(correlationId))
        {
            request.Headers.Add("X-Correlation-ID", correlationId);
        }
        return base.SendAsync(request, ct);
    }
}

// Register
builder.Services.AddHttpClient("api")
    .AddHttpMessageHandler<CorrelationIdHandler>();
```

---

### 108. What is API versioning?

**API versioning** allows multiple API versions to coexist.

```csharp
// Install: Asp.Versioning.Mvc

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version"),
        new QueryStringApiVersionReader("api-version"));
});

// URL versioning
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsV1Controller : ControllerBase { }

[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsV2Controller : ControllerBase { }

// Same controller, multiple versions
[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    [MapToApiVersion("1.0")]
    public IActionResult GetV1() => Ok("v1");
    
    [HttpGet]
    [MapToApiVersion("2.0")]
    public IActionResult GetV2() => Ok("v2");
}
```

---

### 109. What is backward compatibility?

**Backward compatibility** ensures old clients work with new API versions.

```csharp
// V1 response
public class ProductV1Dto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
}

// V2 response (backward compatible)
public class ProductV2Dto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    
    // New fields with defaults
    public string? Description { get; set; }
    public List<string> Tags { get; set; } = new();
    
    // Deprecated but still present
    [Obsolete("Use PriceInfo instead")]
    public decimal UnitPrice => Price;
}

// Breaking changes to avoid:
// - Removing fields
// - Changing field types
// - Changing field meanings
// - Removing endpoints
// - Changing authentication

// Safe changes:
// - Adding optional fields
// - Adding new endpoints
// - Adding optional parameters
// - Deprecating (not removing)

// Sunset header for deprecation
context.Response.Headers.Add("Sunset", "Sat, 01 Jan 2025 00:00:00 GMT");
context.Response.Headers.Add("Deprecation", "true");
```

---

### 110. What is blue-green deployment?

**Blue-green deployment** maintains two identical environments for zero-downtime releases.

```
┌─────────────┐     ┌─────────────────┐
│   Router/   │────▶│  Blue (v1.0)    │ ← Current production
│   Load      │     │  Running        │
│   Balancer  │     └─────────────────┘
│             │     ┌─────────────────┐
│             │     │  Green (v1.1)   │ ← New version (staging)
│             │     │  Ready          │
└─────────────┘     └─────────────────┘

After verification, switch traffic:

┌─────────────┐     ┌─────────────────┐
│   Router/   │     │  Blue (v1.0)    │ ← Standby/rollback
│   Load      │     │  Idle           │
│   Balancer  │     └─────────────────┘
│             │     ┌─────────────────┐
│             │────▶│  Green (v1.1)   │ ← Now production
│             │     │  Running        │
└─────────────┘     └─────────────────┘
```

**Benefits:**
- Zero downtime
- Instant rollback
- Full testing in production environment

**Challenges:**
- Database migrations
- Double infrastructure cost
- Session management

---

### 111. What is feature flag?

**Feature flags** enable/disable features without deployment.

```csharp
// Simple implementation
public interface IFeatureFlags
{
    bool IsEnabled(string feature);
    bool IsEnabled(string feature, string userId);
}

public class FeatureFlagService : IFeatureFlags
{
    private readonly IConfiguration _config;
    
    public bool IsEnabled(string feature)
    {
        return _config.GetValue<bool>($"Features:{feature}");
    }
    
    public bool IsEnabled(string feature, string userId)
    {
        // Check user-specific override
        var override = _config[$"Features:{feature}:Users:{userId}"];
        if (override != null) return bool.Parse(override);
        
        // Check percentage rollout
        var percentage = _config.GetValue<int?>($"Features:{feature}:Percentage");
        if (percentage.HasValue)
        {
            var hash = userId.GetHashCode();
            return Math.Abs(hash % 100) < percentage;
        }
        
        return IsEnabled(feature);
    }
}

// Usage
public class ProductService
{
    public async Task<Product> GetProductAsync(int id)
    {
        var product = await _repo.GetByIdAsync(id);
        
        if (_featureFlags.IsEnabled("NewPricingEngine", _userId))
        {
            product.Price = await _newPricingService.CalculateAsync(product);
        }
        
        return product;
    }
}

// Libraries: LaunchDarkly, ConfigCat, Unleash
```

---

### 112. What is health probe?

**Health probes** check application health for orchestrators.

```csharp
// Liveness probe - is the app alive?
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false  // No checks, just respond
});

// Readiness probe - is the app ready to serve traffic?
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

// Startup probe - has the app started?
app.MapHealthChecks("/health/startup", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("startup")
});

// Add tagged checks
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString, tags: new[] { "ready", "startup" })
    .AddRedis(redisConnection, tags: new[] { "ready" })
    .AddCheck<WarmupCheck>("warmup", tags: new[] { "startup" });

// Kubernetes configuration
// livenessProbe:
//   httpGet:
//     path: /health/live
//     port: 8080
//   initialDelaySeconds: 5
//   periodSeconds: 10
// 
// readinessProbe:
//   httpGet:
//     path: /health/ready
//     port: 8080
```

---

### 113. What is containerization?

**Containerization** packages applications with dependencies into isolated containers.

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MyApp.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "MyApp.dll"]
```

```bash
# Build and run
docker build -t myapp:latest .
docker run -p 8080:8080 myapp:latest

# Docker Compose
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ConnectionStrings__Default=Server=db;...
    depends_on:
      - db
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourPassword123!
```

---

### 114. What is Docker?

**Docker** is a platform for building, running, and managing containers.

```bash
# Common commands
docker build -t myapp:1.0 .           # Build image
docker run -d -p 8080:80 myapp:1.0    # Run container
docker ps                              # List running containers
docker logs <container>                # View logs
docker exec -it <container> bash       # Shell into container
docker stop <container>                # Stop container
docker rm <container>                  # Remove container
docker images                          # List images
docker rmi <image>                     # Remove image

# Docker networking
docker network create mynetwork
docker run --network mynetwork --name api myapp:1.0
docker run --network mynetwork --name db postgres:15

# Volumes (persistent data)
docker volume create mydata
docker run -v mydata:/var/lib/data myapp:1.0

# Environment variables
docker run -e "ConnectionString=Server=db" myapp:1.0

# Multi-stage build for smaller images
# Build stage: SDK (large)
# Runtime stage: ASP.NET runtime (small)
```

---

### 115. What is Kubernetes?

**Kubernetes (K8s)** orchestrates containerized applications at scale.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0
        ports:
        - containerPort: 8080
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

```bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl scale deployment myapp --replicas=5
kubectl rollout status deployment/myapp
kubectl rollout undo deployment/myapp
```

---

### 116. What is scaling?

**Scaling** adjusts capacity to handle load.

```csharp
// Horizontal scaling (add more instances)
// - Requires stateless application
// - Load balancer distributes traffic
// - Database can be bottleneck

// Vertical scaling (add more resources)
// - Bigger CPU, more RAM
// - Has limits
// - Simpler to implement

// Auto-scaling in Kubernetes
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

// Application considerations:
// - Stateless design
// - External session storage
// - Distributed caching
// - Database connection pooling
```

---

### 117. What is horizontal scaling?

**Horizontal scaling** adds more instances to handle increased load.

```csharp
// Requirements for horizontal scaling:

// 1. Stateless application
// ❌ Bad - in-memory state
public class CartService
{
    private static Dictionary<string, Cart> _carts = new();  // Lost on other instances!
}

// ✓ Good - external state
public class CartService
{
    private readonly IDistributedCache _cache;
    
    public async Task<Cart> GetCartAsync(string userId)
    {
        var data = await _cache.GetStringAsync($"cart:{userId}");
        return JsonSerializer.Deserialize<Cart>(data);
    }
}

// 2. Externalized session
builder.Services.AddSession()
    .AddStackExchangeRedisCache(options =>
    {
        options.Configuration = "redis:6379";
    });

// 3. Shared file storage
// Use Azure Blob, S3, or shared NFS

// 4. Database read replicas
// Read from replicas, write to primary
```

---

### 118. What is vertical scaling?

**Vertical scaling** adds more resources to existing instances.

```yaml
# Kubernetes resource limits
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

# Scale up by increasing limits
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

**Comparison:**

| Aspect | Horizontal | Vertical |
|--------|------------|----------|
| Approach | Add instances | Add resources |
| Complexity | Higher | Lower |
| Limits | Virtually unlimited | Hardware limits |
| Cost | Pay per instance | Premium for bigger |
| Downtime | None | Usually required |
| Best for | Web servers | Databases |

---

### 119. What is load balancing?

**Load balancing** distributes traffic across multiple instances.

```csharp
// Kubernetes Service (built-in load balancing)
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080

// Nginx configuration
upstream backend {
    least_conn;  # Algorithm
    server app1:8080;
    server app2:8080;
    server app3:8080;
}

// Load balancing algorithms:
// - Round Robin: Sequential distribution
// - Least Connections: Fewest active connections
// - IP Hash: Same client → same server
// - Weighted: Distribute based on capacity

// Health checks
upstream backend {
    server app1:8080 max_fails=3 fail_timeout=30s;
    server app2:8080 max_fails=3 fail_timeout=30s;
}

// Sticky sessions (when needed)
upstream backend {
    ip_hash;  # Sticky by IP
    server app1:8080;
    server app2:8080;
}
```

---

### 120. What is reverse proxy?

**Reverse proxy** sits in front of servers, handling requests on their behalf.

```nginx
# Nginx reverse proxy configuration
server {
    listen 80;
    server_name myapp.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://api-backend;
        proxy_read_timeout 300s;
    }
    
    # SSL termination
    listen 443 ssl;
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
}
```

**Benefits:**
- SSL termination
- Load balancing
- Caching
- Compression
- Security (hide backend servers)
- Rate limiting

**ASP.NET Core behind reverse proxy:**
```csharp
// Configure forwarded headers
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | 
                       ForwardedHeaders.XForwardedProto
});
```

---

## Summary

| Concept | Purpose |
|---------|---------|
| JWT | Token-based authentication |
| Refresh Token | Renew access without re-login |
| Claims | User attributes in token |
| Role-based Auth | Access by role |
| Policy-based Auth | Complex authorization rules |
| OAuth2 | Third-party authorization |
| OIDC | Identity on top of OAuth2 |
| CSRF | Prevent cross-site request forgery |
| XSS | Prevent script injection |
| SQL Injection | Prevent malicious SQL |
| Hashing/bcrypt | Secure password storage |
| Data Protection | Encrypt sensitive data |
| Key Vault | Secure secret storage |
| HTTPS/HSTS | Secure transport |
| Rate Limiting | Prevent abuse |
| Multi-tenancy | Multiple customers, one app |
| Soft Delete | Mark deleted, don't remove |
| Audit Logging | Track all changes |
| Idempotency | Same request = same result |
| Correlation ID | Track across services |
| API Versioning | Multiple API versions |
| Feature Flags | Toggle features |
| Docker/K8s | Container orchestration |
| Scaling | Handle increased load |
| Load Balancing | Distribute traffic |

---

*Next: [Part 9 - Database & EF Optimization](09-intermediate-database-ef.md)*
