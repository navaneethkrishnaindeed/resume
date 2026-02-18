# .NET Interview Guide - Beginner Level
## Part 5: Entity Framework Core Basics (Questions 121-150)

---

### 121. What is Entity Framework Core?

**Entity Framework Core (EF Core)** is an object-relational mapper (ORM) that enables .NET developers to work with databases using .NET objects.

```csharp
// Instead of SQL
// SELECT * FROM Users WHERE Age > 18

// You write C#
var adults = await _context.Users
    .Where(u => u.Age > 18)
    .ToListAsync();
```

**Key Features:**
- LINQ to Entities queries
- Change tracking
- Migrations
- Cross-database support (SQL Server, PostgreSQL, SQLite, etc.)
- Code First and Database First approaches

**Installation:**
```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
```

---

### 122. What is DbContext?

`DbContext` is the primary class for interacting with the database. It represents a session with the database.

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
    
    // DbSet properties represent tables
    public DbSet<User> Users { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Product> Products { get; set; }
    
    // Configure model
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}

// Register in DI
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Use in service
public class UserService
{
    private readonly AppDbContext _context;
    
    public UserService(AppDbContext context)
    {
        _context = context;
    }
}
```

**Responsibilities:**
- Querying data
- Saving changes
- Change tracking
- Caching
- Transaction management

---

### 123. What is DbSet<T>?

`DbSet<T>` represents a collection of entities that can be queried and saved.

```csharp
public class AppDbContext : DbContext
{
    public DbSet<User> Users { get; set; }  // Maps to Users table
    public DbSet<Order> Orders { get; set; } // Maps to Orders table
}

// Query operations
var users = await _context.Users.ToListAsync();
var user = await _context.Users.FindAsync(id);
var filtered = await _context.Users.Where(u => u.IsActive).ToListAsync();

// Add
_context.Users.Add(new User { Name = "Alice" });
await _context.Users.AddRangeAsync(users);

// Update (entity must be tracked)
var user = await _context.Users.FindAsync(id);
user.Name = "Updated";

// Remove
_context.Users.Remove(user);
_context.Users.RemoveRange(users);

// Save all changes
await _context.SaveChangesAsync();
```

---

### 124. What is migration?

**Migrations** track changes to your model and apply them to the database schema.

```bash
# Create a migration
dotnet ef migrations add InitialCreate

# Apply migrations to database
dotnet ef database update

# Generate SQL script
dotnet ef migrations script

# Revert to specific migration
dotnet ef database update PreviousMigration

# Remove last migration (if not applied)
dotnet ef migrations remove
```

**Migration file structure:**
```csharp
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Name = table.Column<string>(maxLength: 100, nullable: false),
                Email = table.Column<string>(nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Users");
    }
}
```

---

### 125. What is Code First?

**Code First** means you define your model in C# code, and EF generates the database schema.

```csharp
// 1. Define entities
public class Blog
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Url { get; set; }
    public List<Post> Posts { get; set; }
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public int BlogId { get; set; }
    public Blog Blog { get; set; }
}

// 2. Create DbContext
public class BlogDbContext : DbContext
{
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<Post> Posts { get; set; }
}

// 3. Generate migration
// dotnet ef migrations add InitialCreate

// 4. Update database
// dotnet ef database update
```

**Benefits:**
- Version control for schema
- No SQL knowledge required
- Database-agnostic
- Better for green-field projects

---

### 126. What is Database First?

**Database First** starts with an existing database and generates C# models from it.

```bash
# Scaffold from existing database
dotnet ef dbcontext scaffold \
    "Server=localhost;Database=MyDb;..." \
    Microsoft.EntityFrameworkCore.SqlServer \
    -o Models \
    -c AppDbContext
```

**Generated code:**
```csharp
// Auto-generated from database
public partial class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}

public partial class AppDbContext : DbContext
{
    public virtual DbSet<User> Users { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
        });
    }
}
```

**Use when:**
- Existing database
- DBA manages schema
- Legacy systems

---

### 127. What is ChangeTracker?

**ChangeTracker** tracks the state of entities and detects changes for saving.

```csharp
var user = await _context.Users.FindAsync(1);  // Tracked
user.Name = "Updated";  // Change detected

// Check entity state
var entry = _context.Entry(user);
Console.WriteLine(entry.State);  // Modified

// Entity states
// - Detached: Not tracked
// - Unchanged: Tracked, no changes
// - Added: New, will be inserted
// - Modified: Changed, will be updated
// - Deleted: Marked for deletion

// View all tracked entities
foreach (var entry in _context.ChangeTracker.Entries())
{
    Console.WriteLine($"{entry.Entity.GetType().Name}: {entry.State}");
}

// Get changes
var modified = _context.ChangeTracker.Entries()
    .Where(e => e.State == EntityState.Modified)
    .ToList();

// Disable tracking for read-only queries
var users = await _context.Users.AsNoTracking().ToListAsync();
```

---

### 128. What is SaveChanges?

`SaveChanges` persists all tracked changes to the database.

```csharp
// Make changes
var user = new User { Name = "Alice" };
_context.Users.Add(user);

var existing = await _context.Users.FindAsync(1);
existing.Name = "Updated";

_context.Users.Remove(await _context.Users.FindAsync(2));

// Save all changes in one transaction
int affected = await _context.SaveChangesAsync();
Console.WriteLine($"{affected} rows affected");

// SaveChanges:
// 1. Detects all changes
// 2. Generates SQL (INSERT, UPDATE, DELETE)
// 3. Executes in transaction
// 4. Updates entity states
// 5. Returns affected row count

// Auto-generated values are populated after save
_context.Users.Add(user);
await _context.SaveChangesAsync();
Console.WriteLine(user.Id);  // Now has database-generated ID
```

---

### 129. What is AsNoTracking?

`AsNoTracking` returns entities without change tracking, improving read performance.

```csharp
// With tracking (default)
var user = await _context.Users.FindAsync(1);  // Tracked
// Changes to 'user' will be detected and saved

// Without tracking
var user = await _context.Users
    .AsNoTracking()
    .FirstOrDefaultAsync(u => u.Id == 1);  // Not tracked
// Changes to 'user' will NOT be saved

// Use for read-only scenarios
var reports = await _context.Orders
    .AsNoTracking()
    .Where(o => o.Date >= startDate)
    .Select(o => new OrderReportDto
    {
        Id = o.Id,
        Total = o.Total
    })
    .ToListAsync();

// Performance benefit: no tracking overhead
// Memory benefit: no identity map

// Global no-tracking
protected override void OnConfiguring(DbContextOptionsBuilder options)
{
    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
}
```

---

### 130. What is Include?

`Include` eager-loads related entities in a single query.

```csharp
// Without Include - only Blog loaded
var blog = await _context.Blogs.FindAsync(1);
// blog.Posts is null or empty (not loaded)

// With Include - Blog and Posts loaded together
var blog = await _context.Blogs
    .Include(b => b.Posts)
    .FirstOrDefaultAsync(b => b.Id == 1);
// blog.Posts contains all related posts

// Multiple includes
var blog = await _context.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Author)
    .FirstOrDefaultAsync(b => b.Id == 1);

// Nested includes (ThenInclude)
var blog = await _context.Blogs
    .Include(b => b.Posts)
        .ThenInclude(p => p.Comments)
    .Include(b => b.Posts)
        .ThenInclude(p => p.Author)
    .FirstOrDefaultAsync(b => b.Id == 1);

// Filtered include (EF Core 5+)
var blog = await _context.Blogs
    .Include(b => b.Posts.Where(p => p.IsPublished))
    .FirstOrDefaultAsync(b => b.Id == 1);
```

---

### 131. What is eager loading?

**Eager loading** loads related entities as part of the initial query using `Include`.

```csharp
// Eager loading - single query with JOIN
var orders = await _context.Orders
    .Include(o => o.Customer)
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .Where(o => o.Date >= DateTime.Today)
    .ToListAsync();

// Generated SQL (simplified):
// SELECT o.*, c.*, i.*, p.*
// FROM Orders o
// LEFT JOIN Customers c ON o.CustomerId = c.Id
// LEFT JOIN OrderItems i ON o.Id = i.OrderId
// LEFT JOIN Products p ON i.ProductId = p.Id
// WHERE o.Date >= @today
```

**Pros:**
- Single round-trip to database
- All data available immediately

**Cons:**
- May load more data than needed
- Large result sets
- Cartesian explosion with multiple collections

---

### 132. What is lazy loading?

**Lazy loading** loads related entities automatically when accessed.

```csharp
// Enable lazy loading
// Install: Microsoft.EntityFrameworkCore.Proxies
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseLazyLoadingProxies()
           .UseSqlServer(connectionString));

// Navigation properties must be virtual
public class Blog
{
    public int Id { get; set; }
    public string Title { get; set; }
    public virtual ICollection<Post> Posts { get; set; }  // virtual!
}

// Usage
var blog = await _context.Blogs.FindAsync(1);
// Posts not loaded yet

foreach (var post in blog.Posts)  // NOW Posts are loaded (separate query)
{
    Console.WriteLine(post.Title);
}
```

**Pros:**
- Load only what you need
- Simple code

**Cons:**
- N+1 query problem
- Hard to predict queries
- Hidden database calls

---

### 133. What is explicit loading?

**Explicit loading** manually loads related entities on demand.

```csharp
var blog = await _context.Blogs.FindAsync(1);

// Explicitly load Posts
await _context.Entry(blog)
    .Collection(b => b.Posts)
    .LoadAsync();

// Explicitly load reference
await _context.Entry(blog)
    .Reference(b => b.Author)
    .LoadAsync();

// With filter
await _context.Entry(blog)
    .Collection(b => b.Posts)
    .Query()
    .Where(p => p.IsPublished)
    .LoadAsync();

// Check if loaded
bool postsLoaded = _context.Entry(blog)
    .Collection(b => b.Posts)
    .IsLoaded;
```

**Use when:**
- Conditional loading needed
- Can't use Include (already have entity)
- Need to filter related data

---

### 134. What is primary key?

A **primary key** uniquely identifies each row in a table.

```csharp
public class User
{
    // Convention: property named 'Id' or 'UserId' is primary key
    public int Id { get; set; }
    public string Name { get; set; }
}

// Explicit configuration
public class Product
{
    public int ProductId { get; set; }
    public string Name { get; set; }
}

// Data annotation
public class Order
{
    [Key]
    public Guid OrderNumber { get; set; }
}

// Fluent API
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Order>()
        .HasKey(o => o.OrderNumber);
}

// Auto-increment (default for int/long)
// GUID with auto-generate
public class Entity
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
}
```

---

### 135. What is foreign key?

A **foreign key** creates a relationship between tables.

```csharp
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; }
    
    // Foreign key
    public int BlogId { get; set; }
    
    // Navigation property
    public Blog Blog { get; set; }
}

public class Blog
{
    public int Id { get; set; }
    public string Title { get; set; }
    
    // Inverse navigation
    public ICollection<Post> Posts { get; set; }
}

// Convention: Property named [NavigationProperty]Id is foreign key

// Explicit configuration
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Post>()
        .HasOne(p => p.Blog)
        .WithMany(b => b.Posts)
        .HasForeignKey(p => p.BlogId)
        .OnDelete(DeleteBehavior.Cascade);
}

// Data annotation
public class Post
{
    [ForeignKey(nameof(Blog))]
    public int BlogForeignKey { get; set; }
    public Blog Blog { get; set; }
}
```

---

### 136. What is composite key?

A **composite key** uses multiple columns as the primary key.

```csharp
// Entity with composite key
public class OrderItem
{
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    
    public Order Order { get; set; }
    public Product Product { get; set; }
}

// Configure composite key (Fluent API only)
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<OrderItem>()
        .HasKey(oi => new { oi.OrderId, oi.ProductId });
}

// Usage
var item = await _context.OrderItems
    .FindAsync(orderId, productId);  // Pass both key values

// Many-to-many join table
public class StudentCourse
{
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public DateTime EnrolledDate { get; set; }
    
    public Student Student { get; set; }
    public Course Course { get; set; }
}
```

---

### 137. What is index?

An **index** improves query performance on frequently searched columns.

```csharp
// Data annotation
public class User
{
    public int Id { get; set; }
    
    [Index]
    public string Email { get; set; }
}

// Fluent API
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Single column index
    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email);
    
    // Unique index
    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .IsUnique();
    
    // Composite index
    modelBuilder.Entity<Order>()
        .HasIndex(o => new { o.CustomerId, o.Date });
    
    // Named index
    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .HasDatabaseName("IX_Users_Email");
    
    // Filtered index
    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .HasFilter("[IsActive] = 1");
}
```

---

### 138. What is unique constraint?

A **unique constraint** ensures column values are unique across all rows.

```csharp
// Data annotation
public class User
{
    public int Id { get; set; }
    
    [Required]
    public string Email { get; set; }
}

// Fluent API - unique index
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .IsUnique();
    
    // Composite unique
    modelBuilder.Entity<Employee>()
        .HasIndex(e => new { e.DepartmentId, e.EmployeeNumber })
        .IsUnique();
    
    // Alternate key (also creates unique constraint)
    modelBuilder.Entity<User>()
        .HasAlternateKey(u => u.Email);
}

// Violation throws DbUpdateException
try
{
    _context.Users.Add(new User { Email = "existing@example.com" });
    await _context.SaveChangesAsync();
}
catch (DbUpdateException ex)
{
    // Handle duplicate
}
```

---

### 139. What is transaction?

A **transaction** groups multiple operations into an atomic unit.

```csharp
// Implicit transaction (SaveChanges)
_context.Orders.Add(order);
_context.OrderItems.AddRange(items);
await _context.SaveChangesAsync();  // All or nothing

// Explicit transaction
using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    // Debit account
    var source = await _context.Accounts.FindAsync(sourceId);
    source.Balance -= amount;
    
    // Credit account
    var dest = await _context.Accounts.FindAsync(destId);
    dest.Balance += amount;
    
    await _context.SaveChangesAsync();
    
    // Commit
    await transaction.CommitAsync();
}
catch
{
    // Rollback on error
    await transaction.RollbackAsync();
    throw;
}

// Transaction scope (multiple contexts)
using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
await _context1.SaveChangesAsync();
await _context2.SaveChangesAsync();
scope.Complete();
```

---

### 140. What is concurrency token?

A **concurrency token** detects when another user modified the same data.

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    
    // Row version for concurrency
    [Timestamp]
    public byte[] RowVersion { get; set; }
}

// Or fluent API
modelBuilder.Entity<Product>()
    .Property(p => p.RowVersion)
    .IsRowVersion();

// Usage
var product = await _context.Products.FindAsync(1);
product.Price = 29.99m;

try
{
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    // Someone else modified this row!
    var entry = ex.Entries.Single();
    var currentValues = entry.CurrentValues;
    var databaseValues = await entry.GetDatabaseValuesAsync();
    
    // Resolve conflict:
    // 1. Client wins: entry.OriginalValues.SetValues(databaseValues);
    // 2. Database wins: entry.CurrentValues.SetValues(databaseValues);
    // 3. Custom merge logic
}
```

---

### 141. What is optimistic concurrency?

**Optimistic concurrency** assumes conflicts are rare and checks at save time.

```csharp
public class Account
{
    public int Id { get; set; }
    public decimal Balance { get; set; }
    
    [ConcurrencyCheck]  // Check this value hasn't changed
    public decimal Version { get; set; }
}

// Or check specific properties
modelBuilder.Entity<Account>()
    .Property(a => a.Balance)
    .IsConcurrencyToken();

// How it works:
// User A reads: Balance = 100, Version = 1
// User B reads: Balance = 100, Version = 1
// User A saves: Balance = 150, Version = 2 ✓
// User B saves: Balance = 80, Version = 2
//   → UPDATE WHERE Version = 1 
//   → 0 rows affected (Version is now 2)
//   → DbUpdateConcurrencyException thrown

// Compare to pessimistic (locking):
// Optimistic: No locks, check on save
// Pessimistic: Lock row until done
```

---

### 142. What is shadow property?

A **shadow property** exists in EF model but not in the entity class.

```csharp
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; }
    // No LastModified property here
}

// Configure shadow property
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Post>()
        .Property<DateTime>("LastModified");
    
    modelBuilder.Entity<Post>()
        .Property<string>("CreatedBy");
}

// Set shadow property value
var post = new Post { Title = "Hello" };
_context.Entry(post).Property("LastModified").CurrentValue = DateTime.Now;
_context.Entry(post).Property("CreatedBy").CurrentValue = "Admin";

// Query using shadow property
var recent = await _context.Posts
    .Where(p => EF.Property<DateTime>(p, "LastModified") > DateTime.Today.AddDays(-7))
    .ToListAsync();

// Common use: audit columns without polluting entities
```

---

### 143. What is fluent API?

**Fluent API** configures the model using method chaining in `OnModelCreating`.

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Entity configuration
    modelBuilder.Entity<User>(entity =>
    {
        // Table name
        entity.ToTable("tbl_Users");
        
        // Primary key
        entity.HasKey(u => u.Id);
        
        // Properties
        entity.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(100);
        
        entity.Property(u => u.Email)
            .HasColumnName("EmailAddress")
            .HasColumnType("varchar(255)");
        
        // Index
        entity.HasIndex(u => u.Email).IsUnique();
        
        // Relationships
        entity.HasMany(u => u.Orders)
            .WithOne(o => o.User)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });
    
    // Separate configuration classes
    modelBuilder.ApplyConfiguration(new OrderConfiguration());
    
    // Apply all from assembly
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}

// Separate configuration class
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Total).HasPrecision(18, 2);
    }
}
```

---

### 144. What is data annotation?

**Data annotations** are attributes that configure model properties.

```csharp
[Table("tbl_Products")]
public class Product
{
    [Key]
    public int ProductId { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }
    
    [Column("ProductDescription", TypeName = "nvarchar(500)")]
    public string Description { get; set; }
    
    [Range(0.01, 10000)]
    [DataType(DataType.Currency)]
    public decimal Price { get; set; }
    
    [NotMapped]  // Not in database
    public decimal PriceWithTax => Price * 1.1m;
    
    [Timestamp]
    public byte[] RowVersion { get; set; }
    
    [ConcurrencyCheck]
    public int Version { get; set; }
    
    [ForeignKey(nameof(Category))]
    public int CategoryId { get; set; }
    
    public Category Category { get; set; }
}

// Common annotations:
// [Key] - Primary key
// [Required] - Not nullable
// [MaxLength(n)] - Max length
// [StringLength(max, MinimumLength = min)]
// [Column("name")] - Column name
// [Table("name")] - Table name
// [NotMapped] - Exclude from database
// [ForeignKey("property")] - Foreign key
// [Index] - Create index
```

---

### 145. What is cascade delete?

**Cascade delete** automatically deletes related entities when the parent is deleted.

```csharp
public class Blog
{
    public int Id { get; set; }
    public string Title { get; set; }
    public ICollection<Post> Posts { get; set; }
}

// Configure delete behavior
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Post>()
        .HasOne(p => p.Blog)
        .WithMany(b => b.Posts)
        .OnDelete(DeleteBehavior.Cascade);  // Delete posts when blog deleted
}

// Delete behaviors:
// Cascade - Delete dependents
// SetNull - Set FK to null (requires nullable FK)
// Restrict - Prevent delete if dependents exist
// NoAction - Database default
// ClientSetNull - Set null on client side

// Example
var blog = await _context.Blogs
    .Include(b => b.Posts)
    .FirstAsync(b => b.Id == 1);

_context.Blogs.Remove(blog);
await _context.SaveChangesAsync();
// Blog AND all its Posts are deleted
```

---

### 146. What is seed data?

**Seed data** provides initial data when the database is created or migrated.

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Seed data
    modelBuilder.Entity<Category>().HasData(
        new Category { Id = 1, Name = "Electronics" },
        new Category { Id = 2, Name = "Clothing" },
        new Category { Id = 3, Name = "Books" }
    );
    
    modelBuilder.Entity<User>().HasData(
        new User 
        { 
            Id = 1, 
            Name = "Admin", 
            Email = "admin@example.com",
            RoleId = 1  // FK must be set, not navigation property
        }
    );
}

// Create migration with seed data
// dotnet ef migrations add SeedData
// dotnet ef database update

// For complex seeding, use DbContext initialization
public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (!await context.Products.AnyAsync())
        {
            var products = LoadProductsFromJson();
            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }
    }
}
```

---

### 147. What is global query filter?

**Global query filters** automatically apply WHERE clauses to all queries.

```csharp
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; }
    public bool IsDeleted { get; set; }  // Soft delete flag
    public int TenantId { get; set; }    // Multi-tenant
}

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Soft delete filter - always exclude deleted
    modelBuilder.Entity<Post>()
        .HasQueryFilter(p => !p.IsDeleted);
    
    // Multi-tenant filter
    modelBuilder.Entity<Post>()
        .HasQueryFilter(p => p.TenantId == _currentTenantId);
}

// All queries automatically filtered
var posts = await _context.Posts.ToListAsync();
// SQL: SELECT * FROM Posts WHERE IsDeleted = 0

// Ignore filter when needed
var allPosts = await _context.Posts
    .IgnoreQueryFilters()
    .ToListAsync();
// SQL: SELECT * FROM Posts (includes deleted)
```

---

### 148. What is owned entity?

**Owned entities** are types that can only exist as part of another entity (no separate table by default).

```csharp
// Owned type
[Owned]
public class Address
{
    public string Street { get; set; }
    public string City { get; set; }
    public string ZipCode { get; set; }
    public string Country { get; set; }
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public Address ShippingAddress { get; set; }  // Owned
    public Address BillingAddress { get; set; }   // Owned
}

// Fluent configuration
modelBuilder.Entity<Customer>()
    .OwnsOne(c => c.ShippingAddress, sa =>
    {
        sa.Property(a => a.Street).HasColumnName("ShippingStreet");
        sa.Property(a => a.City).HasColumnName("ShippingCity");
    });

// Table structure (single table):
// Customers
// - Id
// - Name
// - ShippingAddress_Street
// - ShippingAddress_City
// - BillingAddress_Street
// - BillingAddress_City
```

---

### 149. What is value conversion?

**Value conversions** transform values when reading from and writing to the database.

```csharp
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public UserStatus Status { get; set; }  // Enum
    public List<string> Tags { get; set; }  // Collection
}

public enum UserStatus
{
    Active,
    Inactive,
    Suspended
}

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Enum to string
    modelBuilder.Entity<User>()
        .Property(u => u.Status)
        .HasConversion<string>();
    
    // Custom conversion
    modelBuilder.Entity<User>()
        .Property(u => u.Tags)
        .HasConversion(
            v => string.Join(',', v),           // To database
            v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()  // From database
        );
    
    // JSON conversion (EF Core 7+)
    modelBuilder.Entity<User>()
        .OwnsOne(u => u.Settings, b =>
        {
            b.ToJson();
        });
}

// Built-in converters:
// BoolToStringConverter
// DateTimeToTicksConverter
// EnumToStringConverter
// GuidToStringConverter
```

---

### 150. What is connection string?

A **connection string** specifies how to connect to the database.

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MyApp;User Id=sa;Password=pass;TrustServerCertificate=true",
    "PostgresConnection": "Host=localhost;Database=myapp;Username=postgres;Password=pass",
    "SqliteConnection": "Data Source=myapp.db"
  }
}
```

```csharp
// Read connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Register DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Connection string components (SQL Server):
// Server - Database server address
// Database - Database name
// User Id - Username (SQL auth)
// Password - Password (SQL auth)
// Integrated Security=true - Windows auth
// TrustServerCertificate - Trust self-signed certs

// Environment-specific
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;..."
  }
}

// Use secrets for sensitive data
// dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..."
```

---

## Summary Table

| Concept | Purpose |
|---------|---------|
| DbContext | Database session |
| DbSet<T> | Table representation |
| Migration | Schema versioning |
| Code First | Model defines database |
| Database First | Database defines model |
| ChangeTracker | Track entity changes |
| SaveChanges | Persist to database |
| AsNoTracking | Read-only optimization |
| Include | Eager load related data |
| Lazy Loading | Load on access |
| Explicit Loading | Manual load |
| Primary Key | Unique row identifier |
| Foreign Key | Relationship link |
| Index | Query optimization |
| Transaction | Atomic operations |
| Concurrency Token | Conflict detection |
| Shadow Property | Hidden model property |
| Fluent API | Code-based configuration |
| Data Annotation | Attribute configuration |
| Cascade Delete | Auto-delete related |
| Seed Data | Initial data |
| Query Filter | Auto-filter queries |
| Owned Entity | Embedded type |
| Value Conversion | Type transformation |
| Connection String | Database connection |

---

**🎉 Beginner Level Complete!**

*Next: [Part 6 - Intermediate: Architecture & Design](06-intermediate-architecture.md)*
