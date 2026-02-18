# .NET Interview Guide - Beginner Level
## Part 3: Collections & LINQ (Questions 61-90)

---

### 61. What is List<T>?

`List<T>` is a dynamic array that can grow and shrink, providing type-safe storage.

```csharp
// Create and initialize
var numbers = new List<int> { 1, 2, 3 };
var names = new List<string>();

// Add elements
numbers.Add(4);
numbers.AddRange(new[] { 5, 6, 7 });
numbers.Insert(0, 0);  // Insert at index

// Remove elements
numbers.Remove(3);        // Remove first occurrence
numbers.RemoveAt(0);      // Remove at index
numbers.RemoveAll(n => n > 5);

// Access
int first = numbers[0];
int count = numbers.Count;
bool exists = numbers.Contains(2);
int index = numbers.IndexOf(2);

// Iterate
foreach (var num in numbers)
{
    Console.WriteLine(num);
}

// Sort and search
numbers.Sort();
numbers.Reverse();
int found = numbers.BinarySearch(3);
```

**Performance:** O(1) access, O(n) insert/remove.

---

### 62. What is Dictionary<TKey, TValue>?

`Dictionary<TKey, TValue>` stores key-value pairs with O(1) lookup.

```csharp
// Create
var ages = new Dictionary<string, int>
{
    ["Alice"] = 30,
    ["Bob"] = 25
};

// Add
ages.Add("Charlie", 35);
ages["David"] = 40;  // Add or update

// Access
int aliceAge = ages["Alice"];
bool hasKey = ages.ContainsKey("Alice");
bool hasValue = ages.ContainsValue(30);

// Safe access
if (ages.TryGetValue("Eve", out int eveAge))
{
    Console.WriteLine(eveAge);
}

// Remove
ages.Remove("Bob");

// Iterate
foreach (var kvp in ages)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}

foreach (var key in ages.Keys) { }
foreach (var value in ages.Values) { }
```

---

### 63. What is HashSet<T>?

`HashSet<T>` stores unique elements with O(1) add/remove/lookup.

```csharp
var set = new HashSet<int> { 1, 2, 3 };

// Add (returns false if exists)
bool added = set.Add(4);   // true
bool added2 = set.Add(1);  // false - already exists

// Remove
set.Remove(2);

// Set operations
var other = new HashSet<int> { 3, 4, 5 };

set.UnionWith(other);      // All elements from both
set.IntersectWith(other);  // Common elements only
set.ExceptWith(other);     // Remove other's elements
set.SymmetricExceptWith(other); // Elements in one but not both

// Check relationships
bool isSubset = set.IsSubsetOf(other);
bool isSuperset = set.IsSupersetOf(other);
bool overlaps = set.Overlaps(other);
```

---

### 64. What is Queue<T>?

`Queue<T>` is a FIFO (First-In-First-Out) collection.

```csharp
var queue = new Queue<string>();

// Add to end
queue.Enqueue("First");
queue.Enqueue("Second");
queue.Enqueue("Third");

// Remove from front
string first = queue.Dequeue();  // "First"

// Peek without removing
string next = queue.Peek();  // "Second"

// Check
int count = queue.Count;
bool contains = queue.Contains("Third");

// Safe dequeue
if (queue.TryDequeue(out string item))
{
    Console.WriteLine(item);
}

// Use case: Processing tasks in order
var taskQueue = new Queue<Action>();
taskQueue.Enqueue(() => Console.WriteLine("Task 1"));
taskQueue.Enqueue(() => Console.WriteLine("Task 2"));

while (taskQueue.Count > 0)
{
    taskQueue.Dequeue().Invoke();
}
```

---

### 65. What is Stack<T>?

`Stack<T>` is a LIFO (Last-In-First-Out) collection.

```csharp
var stack = new Stack<int>();

// Push onto top
stack.Push(1);
stack.Push(2);
stack.Push(3);

// Pop from top
int top = stack.Pop();  // 3

// Peek without removing
int peek = stack.Peek();  // 2

// Check
int count = stack.Count;
bool contains = stack.Contains(1);

// Safe pop
if (stack.TryPop(out int item))
{
    Console.WriteLine(item);
}

// Use case: Undo functionality
var undoStack = new Stack<string>();
undoStack.Push("Action 1");
undoStack.Push("Action 2");

// Undo last action
string lastAction = undoStack.Pop();
```

---

### 66. Difference between Array and List?

| Aspect | Array | List<T> |
|--------|-------|---------|
| **Size** | Fixed at creation | Dynamic, grows/shrinks |
| **Performance** | Slightly faster | Slightly slower (overhead) |
| **Memory** | Contiguous, compact | Has internal overhead |
| **Syntax** | `int[]` | `List<int>` |
| **Methods** | Basic | Rich (Add, Remove, Sort) |

```csharp
// Array - fixed size
int[] array = new int[5];
int[] initialized = { 1, 2, 3, 4, 5 };
// array[5] = 6;  // ✗ Error - out of bounds
// Can't add or remove elements

// List - dynamic
List<int> list = new List<int> { 1, 2, 3, 4, 5 };
list.Add(6);     // ✓ Can add
list.Remove(1);  // ✓ Can remove
list.Insert(0, 0);

// Convert between them
int[] fromList = list.ToArray();
List<int> fromArray = array.ToList();
```

**Use Array when:** Size is fixed, maximum performance needed.
**Use List when:** Size varies, need add/remove operations.

---

### 67. What is IEnumerable<T>?

`IEnumerable<T>` is the base interface for all collections that can be iterated.

```csharp
public interface IEnumerable<T>
{
    IEnumerator<T> GetEnumerator();
}

// Enables foreach
IEnumerable<int> numbers = new List<int> { 1, 2, 3 };
foreach (var n in numbers)
{
    Console.WriteLine(n);
}

// Most LINQ methods return IEnumerable<T>
IEnumerable<int> filtered = numbers.Where(n => n > 1);

// Creating custom enumerable
public IEnumerable<int> GetNumbers()
{
    yield return 1;
    yield return 2;
    yield return 3;
}

// Deferred execution - values computed on demand
var lazy = GetNumbers().Where(n => n > 1);
// Nothing executed yet until enumerated
```

---

### 68. What is ICollection<T>?

`ICollection<T>` extends `IEnumerable<T>` with count and modification capabilities.

```csharp
public interface ICollection<T> : IEnumerable<T>
{
    int Count { get; }
    bool IsReadOnly { get; }
    void Add(T item);
    void Clear();
    bool Contains(T item);
    void CopyTo(T[] array, int arrayIndex);
    bool Remove(T item);
}

// ICollection provides Count without enumerating
ICollection<int> collection = new List<int> { 1, 2, 3 };
int count = collection.Count;  // O(1) - stored property

// vs IEnumerable which needs to enumerate
IEnumerable<int> enumerable = new List<int> { 1, 2, 3 };
int count2 = enumerable.Count();  // May need to enumerate
```

---

### 69. What is IQueryable<T>?

`IQueryable<T>` enables queries to be translated into other forms (like SQL).

```csharp
// IEnumerable - executes in memory
IEnumerable<User> users = dbContext.Users;
var filtered = users.Where(u => u.Age > 18);  // Loads ALL users, filters in memory

// IQueryable - builds expression tree, executes on server
IQueryable<User> users = dbContext.Users;
var filtered = users.Where(u => u.Age > 18);  // Translates to SQL WHERE Age > 18

// Key difference: WHERE the query executes
public void Compare()
{
    // IQueryable - SQL: SELECT * FROM Users WHERE Age > 18
    var query1 = _context.Users.Where(u => u.Age > 18);
    
    // IEnumerable - SQL: SELECT * FROM Users (all), then filter in C#
    var query2 = _context.Users.AsEnumerable().Where(u => u.Age > 18);
}
```

**Use `IQueryable`** when querying databases - translates to optimized SQL.
**Use `IEnumerable`** for in-memory collections.

---

### 70. What is LINQ?

**LINQ (Language Integrated Query)** provides a unified way to query data from various sources.

```csharp
var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// Query syntax
var query1 = from n in numbers
             where n > 5
             orderby n descending
             select n * 2;

// Method syntax (more common)
var query2 = numbers
    .Where(n => n > 5)
    .OrderByDescending(n => n)
    .Select(n => n * 2);

// Both produce: 20, 18, 16, 14, 12

// LINQ works on many data sources
var xmlQuery = from e in xDocument.Descendants("employee")
               select e.Attribute("name").Value;

var sqlQuery = from u in dbContext.Users
               where u.IsActive
               select u;
```

---

### 71. What is deferred execution?

**Deferred execution** means LINQ queries are not executed until the results are enumerated.

```csharp
var numbers = new List<int> { 1, 2, 3 };

// Query is defined, NOT executed
var query = numbers.Where(n => 
{
    Console.WriteLine($"Checking {n}");
    return n > 1;
});

Console.WriteLine("Query defined");

// NOW it executes (when enumerated)
foreach (var n in query)
{
    Console.WriteLine($"Result: {n}");
}

// Output:
// Query defined
// Checking 1
// Checking 2
// Result: 2
// Checking 3
// Result: 3
```

**Force immediate execution:**
```csharp
var immediate = numbers.Where(n => n > 1).ToList();  // Executes NOW
var array = numbers.Where(n => n > 1).ToArray();     // Executes NOW
var first = numbers.First(n => n > 1);               // Executes NOW
```

---

### 72. What is Select?

`Select` projects each element into a new form (transformation).

```csharp
var numbers = new List<int> { 1, 2, 3, 4, 5 };

// Simple projection
var doubled = numbers.Select(n => n * 2);
// 2, 4, 6, 8, 10

// Project to different type
var strings = numbers.Select(n => $"Number: {n}");

// Project to anonymous type
var users = new List<User> { /* ... */ };
var projected = users.Select(u => new 
{ 
    FullName = $"{u.FirstName} {u.LastName}",
    u.Email 
});

// With index
var indexed = numbers.Select((n, index) => $"{index}: {n}");
// "0: 1", "1: 2", "2: 3", ...
```

---

### 73. What is Where?

`Where` filters elements based on a predicate (condition).

```csharp
var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// Simple filter
var evens = numbers.Where(n => n % 2 == 0);
// 2, 4, 6, 8, 10

// Multiple conditions
var filtered = numbers.Where(n => n > 3 && n < 8);
// 4, 5, 6, 7

// With index
var indexed = numbers.Where((n, index) => index % 2 == 0);
// Elements at even indices: 1, 3, 5, 7, 9

// Chaining
var result = numbers
    .Where(n => n > 2)
    .Where(n => n < 8)
    .Where(n => n % 2 == 0);
// 4, 6
```

---

### 74. What is GroupBy?

`GroupBy` groups elements by a key.

```csharp
var people = new List<Person>
{
    new("Alice", "HR"),
    new("Bob", "IT"),
    new("Charlie", "HR"),
    new("David", "IT"),
    new("Eve", "Sales")
};

// Group by department
var byDepartment = people.GroupBy(p => p.Department);

foreach (var group in byDepartment)
{
    Console.WriteLine($"Department: {group.Key}");
    foreach (var person in group)
    {
        Console.WriteLine($"  - {person.Name}");
    }
}

// Group with projection
var summary = people
    .GroupBy(p => p.Department)
    .Select(g => new 
    { 
        Department = g.Key, 
        Count = g.Count(),
        Names = string.Join(", ", g.Select(p => p.Name))
    });

// Multiple keys
var grouped = people.GroupBy(p => new { p.Department, p.Level });
```

---

### 75. What is Join?

`Join` combines two sequences based on matching keys.

```csharp
var orders = new List<Order>
{
    new(1, 101, 50.00m),
    new(2, 102, 75.00m),
    new(3, 101, 25.00m)
};

var customers = new List<Customer>
{
    new(101, "Alice"),
    new(102, "Bob"),
    new(103, "Charlie")
};

// Inner join
var orderDetails = orders.Join(
    customers,
    order => order.CustomerId,      // Outer key
    customer => customer.Id,        // Inner key
    (order, customer) => new        // Result selector
    {
        customer.Name,
        order.Amount
    });

// Query syntax
var query = from o in orders
            join c in customers on o.CustomerId equals c.Id
            select new { c.Name, o.Amount };

// Left outer join (using GroupJoin)
var leftJoin = customers.GroupJoin(
    orders,
    c => c.Id,
    o => o.CustomerId,
    (customer, orderGroup) => new
    {
        customer.Name,
        Orders = orderGroup.ToList()
    });
```

---

### 76. What is OrderBy?

`OrderBy` sorts elements in ascending order.

```csharp
var people = new List<Person>
{
    new("Charlie", 30),
    new("Alice", 25),
    new("Bob", 35)
};

// Sort ascending
var byName = people.OrderBy(p => p.Name);
// Alice, Bob, Charlie

// Sort descending
var byAgeDesc = people.OrderByDescending(p => p.Age);
// Bob(35), Charlie(30), Alice(25)

// Multiple sort keys
var sorted = people
    .OrderBy(p => p.Department)
    .ThenBy(p => p.Name)
    .ThenByDescending(p => p.Age);

// Custom comparer
var custom = people.OrderBy(p => p.Name, StringComparer.OrdinalIgnoreCase);

// Numbers
var numbers = new[] { 5, 2, 8, 1, 9 };
var ascending = numbers.OrderBy(n => n);   // 1, 2, 5, 8, 9
var descending = numbers.OrderByDescending(n => n);  // 9, 8, 5, 2, 1
```

---

### 77. What is Distinct?

`Distinct` removes duplicate elements.

```csharp
var numbers = new[] { 1, 2, 2, 3, 3, 3, 4 };
var unique = numbers.Distinct();  // 1, 2, 3, 4

// With objects (uses default equality)
var people = new List<Person>
{
    new("Alice", "IT"),
    new("Bob", "HR"),
    new("Alice", "IT")  // Duplicate if using record
};

var uniquePeople = people.Distinct();

// Custom comparer
var uniqueByName = people.DistinctBy(p => p.Name);  // .NET 6+

// Or with custom IEqualityComparer
class PersonNameComparer : IEqualityComparer<Person>
{
    public bool Equals(Person x, Person y) => x.Name == y.Name;
    public int GetHashCode(Person obj) => obj.Name.GetHashCode();
}
var unique2 = people.Distinct(new PersonNameComparer());
```

---

### 78. What is ToList?

`ToList` forces immediate execution and creates a `List<T>`.

```csharp
var numbers = new[] { 1, 2, 3, 4, 5 };

// Deferred - query not executed
var query = numbers.Where(n => n > 2);

// ToList forces execution NOW
var list = numbers.Where(n => n > 2).ToList();

// Now list is independent of source
numbers[0] = 100;  // Doesn't affect list

// Common use: materialize query results
public List<UserDto> GetActiveUsers()
{
    return _context.Users
        .Where(u => u.IsActive)
        .Select(u => new UserDto(u.Name, u.Email))
        .ToList();  // Execute query, return concrete list
}

// Related methods
var array = numbers.ToArray();
var dictionary = numbers.ToDictionary(n => n, n => n * 2);
var hashSet = numbers.ToHashSet();
```

---

### 79. What is projection?

**Projection** is transforming data from one shape to another using `Select`.

```csharp
var users = new List<User>
{
    new User { Id = 1, FirstName = "Alice", LastName = "Smith", Email = "alice@example.com", Password = "secret" },
    new User { Id = 2, FirstName = "Bob", LastName = "Jones", Email = "bob@example.com", Password = "secret" }
};

// Project to DTO (hide sensitive data)
var userDtos = users.Select(u => new UserDto
{
    Id = u.Id,
    FullName = $"{u.FirstName} {u.LastName}",
    Email = u.Email
    // Password not included
});

// Project to anonymous type
var names = users.Select(u => new { u.Id, Name = u.FirstName });

// Flat projection (single value)
var emails = users.Select(u => u.Email);

// Complex projection
var userSummaries = users.Select(u => new
{
    u.Id,
    DisplayName = $"{u.FirstName[0]}. {u.LastName}",
    Domain = u.Email.Split('@')[1],
    NameLength = u.FirstName.Length + u.LastName.Length
});
```

---

### 80. What is aggregation in LINQ?

**Aggregation** combines multiple values into a single result.

```csharp
var numbers = new[] { 1, 2, 3, 4, 5 };

// Built-in aggregations
int sum = numbers.Sum();           // 15
int count = numbers.Count();       // 5
double average = numbers.Average(); // 3.0
int min = numbers.Min();           // 1
int max = numbers.Max();           // 5

// With selector
var products = new List<Product> { /* ... */ };
decimal totalPrice = products.Sum(p => p.Price);
decimal maxPrice = products.Max(p => p.Price);

// Aggregate - custom accumulation
int product = numbers.Aggregate((acc, n) => acc * n);  // 1*2*3*4*5 = 120

string combined = numbers.Aggregate(
    "Numbers: ",                      // Seed
    (acc, n) => acc + n + ", ",       // Accumulator
    result => result.TrimEnd(',', ' ') // Final selector
);
// "Numbers: 1, 2, 3, 4, 5"
```

---

### 81. What is Any?

`Any` checks if any element matches a condition (returns bool).

```csharp
var numbers = new[] { 1, 2, 3, 4, 5 };

// Check if collection has elements
bool hasElements = numbers.Any();  // true

// Check if any matches condition
bool hasEven = numbers.Any(n => n % 2 == 0);  // true
bool hasNegative = numbers.Any(n => n < 0);   // false

// Common use: validation
var users = GetUsers();
if (!users.Any())
{
    throw new InvalidOperationException("No users found");
}

// Check existence (more efficient than Count() > 0)
if (numbers.Any(n => n > 100))  // ✓ Stops at first match
{
    // Found
}
// vs
if (numbers.Count(n => n > 100) > 0)  // ✗ Counts all matches
{
    // Less efficient
}
```

---

### 82. What is All?

`All` checks if ALL elements match a condition.

```csharp
var numbers = new[] { 2, 4, 6, 8, 10 };

// Check if all match
bool allEven = numbers.All(n => n % 2 == 0);     // true
bool allPositive = numbers.All(n => n > 0);      // true
bool allLessThan5 = numbers.All(n => n < 5);     // false

// Common use: validation
var orderItems = GetOrderItems();
bool allInStock = orderItems.All(item => item.StockQuantity >= item.OrderQuantity);

if (!allInStock)
{
    throw new InvalidOperationException("Some items are out of stock");
}

// Empty collection returns true
var empty = new int[] { };
bool result = empty.All(n => n > 100);  // true (vacuously true)
```

---

### 83. What is First vs FirstOrDefault?

Both return the first element, but handle empty sequences differently.

```csharp
var numbers = new[] { 1, 2, 3, 4, 5 };
var empty = new int[] { };

// First - throws if empty
int first = numbers.First();           // 1
int firstEven = numbers.First(n => n % 2 == 0);  // 2
// int error = empty.First();          // ✗ InvalidOperationException

// FirstOrDefault - returns default if empty
int firstOrNull = empty.FirstOrDefault();       // 0 (default for int)
int? nullable = empty.Cast<int?>().FirstOrDefault();  // null

// C# 10+ default value parameter
int withDefault = empty.FirstOrDefault(-1);     // -1

// Best practice: Use FirstOrDefault with null checks
var user = users.FirstOrDefault(u => u.Id == id);
if (user == null)
{
    return NotFound();
}

// Or with nullable reference types
var user = users.FirstOrDefault(u => u.Id == id);
return user?.Name ?? "Unknown";
```

---

### 84. What is Single vs SingleOrDefault?

Both expect exactly one element. Throw if multiple found.

```csharp
var one = new[] { 42 };
var multiple = new[] { 1, 2, 3 };
var empty = new int[] { };

// Single - exactly one, throws if 0 or 2+
int single = one.Single();          // 42
// int error1 = empty.Single();     // ✗ InvalidOperationException
// int error2 = multiple.Single();  // ✗ InvalidOperationException

// SingleOrDefault - 0 or 1 elements only
int singleOrDefault = one.SingleOrDefault();    // 42
int fromEmpty = empty.SingleOrDefault();        // 0
// int error = multiple.SingleOrDefault();      // ✗ InvalidOperationException

// Use for unique lookups
var user = users.SingleOrDefault(u => u.Email == email);
if (user == null)
{
    // Not found
}
else
{
    // Exactly one found
}

// Common use: by unique identifier
var product = products.Single(p => p.Id == id);
```

**Use `Single` when:** There MUST be exactly one result.
**Use `First` when:** You want the first of potentially many.

---

### 85. What is Count vs LongCount?

`Count` returns int, `LongCount` returns long for large collections.

```csharp
var numbers = new[] { 1, 2, 3, 4, 5 };

// Count - returns int (max ~2.1 billion)
int count = numbers.Count();
int evenCount = numbers.Count(n => n % 2 == 0);

// LongCount - returns long (for huge collections)
long longCount = numbers.LongCount();
long longEvenCount = numbers.LongCount(n => n % 2 == 0);

// When to use LongCount
// - Collections with > 2.1 billion elements
// - Database tables that might be huge
// - Being defensive about growth

// Performance note: use .Count property when available
var list = new List<int> { 1, 2, 3 };
int fast = list.Count;        // O(1) - property
int slow = list.Count();      // May be O(n) - LINQ method

// IQueryable - translates to SQL COUNT
var dbCount = context.Users.Count();  // SELECT COUNT(*) FROM Users
```

---

### 86. What is SelectMany?

`SelectMany` flattens nested collections into a single sequence.

```csharp
var teams = new List<Team>
{
    new Team("Red", new[] { "Alice", "Bob" }),
    new Team("Blue", new[] { "Charlie", "David", "Eve" })
};

// Select returns nested: IEnumerable<string[]>
var nested = teams.Select(t => t.Members);
// [["Alice", "Bob"], ["Charlie", "David", "Eve"]]

// SelectMany flattens: IEnumerable<string>
var flat = teams.SelectMany(t => t.Members);
// ["Alice", "Bob", "Charlie", "David", "Eve"]

// With result selector
var withTeam = teams.SelectMany(
    t => t.Members,
    (team, member) => new { Team = team.Name, Member = member }
);
// [{Team: "Red", Member: "Alice"}, {Team: "Red", Member: "Bob"}, ...]

// Flattening arrays
var arrays = new[] { new[] { 1, 2 }, new[] { 3, 4, 5 } };
var allNumbers = arrays.SelectMany(a => a);  // [1, 2, 3, 4, 5]

// Query syntax
var query = from team in teams
            from member in team.Members
            select new { team.Name, member };
```

---

### 87. What is lambda expression?

A **lambda expression** is an anonymous function using the `=>` syntax.

```csharp
// Lambda syntax
Func<int, int> square = x => x * x;
Func<int, int, int> add = (a, b) => a + b;
Action<string> print = s => Console.WriteLine(s);

// With explicit types
Func<int, bool> isEven = (int n) => n % 2 == 0;

// Statement lambda (multiple statements)
Func<int, int> complex = x =>
{
    var doubled = x * 2;
    var result = doubled + 1;
    return result;
};

// Common LINQ usage
var numbers = new[] { 1, 2, 3, 4, 5 };
var evens = numbers.Where(n => n % 2 == 0);
var doubled = numbers.Select(n => n * 2);
var sum = numbers.Aggregate((a, b) => a + b);

// Capturing variables (closure)
int multiplier = 3;
var multiplied = numbers.Select(n => n * multiplier);

// Lambda vs delegate
Func<int, int> lambda = x => x * 2;
Func<int, int> method = Double;
int Double(int x) => x * 2;
```

---

### 88. What is Func<T>?

`Func<T>` is a delegate representing a method that returns a value.

```csharp
// Func signatures (last type is return type)
Func<int> noParams = () => 42;                    // Returns int
Func<int, int> oneParam = x => x * 2;             // int -> int
Func<int, int, int> twoParams = (a, b) => a + b;  // (int, int) -> int
Func<string, int, bool> mixed = (s, n) => s.Length > n;

// Usage
int result = noParams();           // 42
int doubled = oneParam(5);         // 10
bool check = mixed("hello", 3);    // true

// As method parameters
public List<T> Filter<T>(List<T> items, Func<T, bool> predicate)
{
    return items.Where(predicate).ToList();
}

var numbers = new List<int> { 1, 2, 3, 4, 5 };
var evens = Filter(numbers, n => n % 2 == 0);

// Factory pattern
public T Create<T>(Func<T> factory)
{
    return factory();
}

var user = Create(() => new User { Name = "Alice" });
```

---

### 89. What is Action<T>?

`Action<T>` is a delegate representing a method that returns void.

```csharp
// Action signatures (no return type)
Action noParams = () => Console.WriteLine("Hello");
Action<string> oneParam = s => Console.WriteLine(s);
Action<string, int> twoParams = (s, n) => Console.WriteLine($"{s}: {n}");

// Usage
noParams();                    // "Hello"
oneParam("World");             // "World"
twoParams("Count", 42);        // "Count: 42"

// As method parameters
public void ForEach<T>(List<T> items, Action<T> action)
{
    foreach (var item in items)
    {
        action(item);
    }
}

var names = new List<string> { "Alice", "Bob", "Charlie" };
ForEach(names, name => Console.WriteLine($"Hello, {name}!"));

// Event handlers
public event Action<string> OnMessage;

OnMessage += message => Console.WriteLine($"Received: {message}");
OnMessage?.Invoke("Hello");

// Callbacks
public void ProcessAsync(Action onComplete)
{
    // Do work...
    onComplete();
}
```

---

### 90. What is Predicate<T>?

`Predicate<T>` is a delegate that returns bool - used for conditions.

```csharp
// Predicate definition
Predicate<int> isEven = n => n % 2 == 0;
Predicate<string> isLong = s => s.Length > 5;

// Usage
bool result = isEven(4);   // true
bool check = isLong("Hi"); // false

// With List methods
var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };

// Find first match
int firstEven = numbers.Find(isEven);  // 2

// Find all matches
List<int> allEvens = numbers.FindAll(isEven);  // [2, 4, 6]

// Check existence
bool exists = numbers.Exists(n => n > 5);  // true
bool allPositive = numbers.TrueForAll(n => n > 0);  // true

// Remove matching
numbers.RemoveAll(n => n > 3);  // Removes 4, 5, 6

// Predicate vs Func<T, bool>
Predicate<int> predicate = n => n > 0;
Func<int, bool> func = n => n > 0;
// Functionally equivalent, but used in different APIs
```

---

## Summary Table

| Method | Purpose | Returns |
|--------|---------|---------|
| `Select` | Transform each element | `IEnumerable<TResult>` |
| `Where` | Filter elements | `IEnumerable<T>` |
| `GroupBy` | Group by key | `IEnumerable<IGrouping>` |
| `Join` | Combine two sequences | `IEnumerable<TResult>` |
| `OrderBy` | Sort ascending | `IOrderedEnumerable<T>` |
| `Distinct` | Remove duplicates | `IEnumerable<T>` |
| `ToList` | Force execution, create list | `List<T>` |
| `Any` | Check if any match | `bool` |
| `All` | Check if all match | `bool` |
| `First` | First element (throws if empty) | `T` |
| `FirstOrDefault` | First or default | `T` |
| `Single` | Exactly one (throws otherwise) | `T` |
| `Count` | Count elements | `int` |
| `SelectMany` | Flatten nested collections | `IEnumerable<T>` |

| Delegate | Signature | Purpose |
|----------|-----------|---------|
| `Func<T>` | `() => T` | Function with return value |
| `Func<T1, T>` | `(T1) => T` | Function with input and return |
| `Action` | `() => void` | Method with no return |
| `Action<T>` | `(T) => void` | Method with input, no return |
| `Predicate<T>` | `(T) => bool` | Condition checker |

---

*Next: [Part 4 - ASP.NET Core Basics](04-beginner-aspnet-core.md)*
