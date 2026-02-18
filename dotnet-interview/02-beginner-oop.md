# .NET Interview Guide - Beginner Level
## Part 2: OOP in C# (Questions 31-60)

---

### 31. What is encapsulation?

**Encapsulation** is bundling data and methods that operate on that data within a single unit (class), hiding internal details.

```csharp
public class BankAccount
{
    // Private field - hidden from outside
    private decimal _balance;
    
    // Public property - controlled access
    public decimal Balance => _balance;
    
    // Public method - controlled modification
    public void Deposit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive");
        
        _balance += amount;
    }
    
    public bool Withdraw(decimal amount)
    {
        if (amount > _balance)
            return false;
            
        _balance -= amount;
        return true;
    }
}

// Usage - can't directly modify balance
var account = new BankAccount();
account.Deposit(100);
// account._balance = 1000000;  // ✗ Not allowed!
```

**Access Modifiers:**
- `private` - Class only
- `protected` - Class + derived classes
- `internal` - Same assembly
- `public` - Everywhere

---

### 32. What is inheritance?

**Inheritance** allows a class to inherit properties and methods from another class.

```csharp
// Base class
public class Animal
{
    public string Name { get; set; }
    
    public void Eat()
    {
        Console.WriteLine($"{Name} is eating");
    }
}

// Derived class
public class Dog : Animal
{
    public string Breed { get; set; }
    
    public void Bark()
    {
        Console.WriteLine($"{Name} says: Woof!");
    }
}

// Usage
var dog = new Dog { Name = "Buddy", Breed = "Labrador" };
dog.Eat();   // Inherited from Animal
dog.Bark();  // Dog's own method
```

**Key Points:**
- C# supports single inheritance only
- Use `:` syntax
- Derived class IS-A base class
- Use `sealed` to prevent inheritance

---

### 33. What is polymorphism?

**Polymorphism** means "many forms" - objects can be treated as instances of their parent class while behaving according to their actual type.

```csharp
public abstract class Shape
{
    public abstract double GetArea();
}

public class Circle : Shape
{
    public double Radius { get; set; }
    public override double GetArea() => Math.PI * Radius * Radius;
}

public class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }
    public override double GetArea() => Width * Height;
}

// Polymorphic behavior
Shape[] shapes = { new Circle { Radius = 5 }, new Rectangle { Width = 4, Height = 3 } };

foreach (Shape shape in shapes)
{
    Console.WriteLine(shape.GetArea());  // Each calls its own GetArea()
}
// Output: 78.54 (circle), 12 (rectangle)
```

**Types:**
- **Compile-time (static)**: Method overloading
- **Runtime (dynamic)**: Method overriding

---

### 34. What is abstraction?

**Abstraction** hides complex implementation details and shows only essential features.

```csharp
// Abstract class - defines "what" not "how"
public abstract class PaymentProcessor
{
    public abstract bool ProcessPayment(decimal amount);
    public abstract void Refund(string transactionId);
}

// Concrete implementation - the "how"
public class StripeProcessor : PaymentProcessor
{
    public override bool ProcessPayment(decimal amount)
    {
        // Complex Stripe API integration hidden here
        return CallStripeApi(amount);
    }
    
    public override void Refund(string transactionId)
    {
        // Stripe refund logic
    }
    
    private bool CallStripeApi(decimal amount) => true;
}

// User code only knows abstract interface
PaymentProcessor processor = new StripeProcessor();
processor.ProcessPayment(99.99m);  // Don't need to know Stripe details
```

---

### 35. What is method overloading?

**Method overloading** is defining multiple methods with the same name but different parameters.

```csharp
public class Calculator
{
    // Same name, different parameters
    public int Add(int a, int b) => a + b;
    public double Add(double a, double b) => a + b;
    public int Add(int a, int b, int c) => a + b + c;
    public string Add(string a, string b) => a + b;
}

var calc = new Calculator();
calc.Add(1, 2);          // Calls int version
calc.Add(1.5, 2.5);      // Calls double version
calc.Add(1, 2, 3);       // Calls 3-parameter version
calc.Add("Hello", "!");  // Calls string version
```

**Overloading Rules:**
- Same method name
- Different parameter types, count, or order
- Return type alone is NOT enough

---

### 36. What is method overriding?

**Method overriding** replaces a base class method in a derived class.

```csharp
public class Animal
{
    public virtual void MakeSound()
    {
        Console.WriteLine("Some sound");
    }
}

public class Dog : Animal
{
    public override void MakeSound()
    {
        Console.WriteLine("Woof!");
    }
}

public class Cat : Animal
{
    public override void MakeSound()
    {
        Console.WriteLine("Meow!");
    }
}

// Polymorphic behavior
Animal[] animals = { new Dog(), new Cat() };
foreach (var animal in animals)
{
    animal.MakeSound();  // Woof! then Meow!
}
```

**Requirements:**
- Base method must be `virtual`, `abstract`, or `override`
- Use `override` keyword in derived class
- Same signature required

---

### 37. What is virtual keyword?

`virtual` marks a method/property that CAN be overridden in derived classes.

```csharp
public class Logger
{
    // Can be overridden but has default implementation
    public virtual void Log(string message)
    {
        Console.WriteLine($"[LOG]: {message}");
    }
    
    // Cannot be overridden (no virtual)
    public void LogError(string message)
    {
        Console.WriteLine($"[ERROR]: {message}");
    }
}

public class FileLogger : Logger
{
    public override void Log(string message)
    {
        File.AppendAllText("log.txt", message);
    }
    
    // Cannot override LogError - not virtual
}
```

**Virtual vs Non-Virtual:**
- Virtual: Runtime dispatch (slower, flexible)
- Non-virtual: Compile-time binding (faster)

---

### 38. What is override keyword?

`override` replaces a virtual/abstract method from a base class.

```csharp
public class Shape
{
    public virtual string GetDescription()
    {
        return "I am a shape";
    }
}

public class Circle : Shape
{
    public override string GetDescription()
    {
        return "I am a circle";
    }
}

// Chaining overrides
public class RedCircle : Circle
{
    public override string GetDescription()
    {
        return base.GetDescription() + " and I am red";
    }
}

var rc = new RedCircle();
Console.WriteLine(rc.GetDescription()); 
// "I am a circle and I am red"
```

---

### 39. What is abstract class?

An **abstract class** cannot be instantiated and may contain abstract (unimplemented) members.

```csharp
public abstract class Vehicle
{
    // Abstract - must be implemented by derived class
    public abstract void Start();
    public abstract int GetWheelCount();
    
    // Virtual - can be overridden
    public virtual void Stop()
    {
        Console.WriteLine("Vehicle stopped");
    }
    
    // Regular method - inherited as-is
    public void Honk()
    {
        Console.WriteLine("Beep!");
    }
}

public class Car : Vehicle
{
    public override void Start() => Console.WriteLine("Car engine started");
    public override int GetWheelCount() => 4;
}

// Cannot instantiate abstract class
// var v = new Vehicle();  // ✗ Error

var car = new Car();
car.Start();  // "Car engine started"
```

---

### 40. What is interface?

An **interface** defines a contract that implementing classes must follow.

```csharp
public interface IPayable
{
    decimal Amount { get; }
    void Pay();
}

public interface ITaxable
{
    decimal CalculateTax();
}

// Class implementing multiple interfaces
public class Invoice : IPayable, ITaxable
{
    public decimal Amount { get; set; }
    
    public void Pay()
    {
        Console.WriteLine($"Paying {Amount}");
    }
    
    public decimal CalculateTax()
    {
        return Amount * 0.1m;
    }
}

// Program to interface
IPayable payable = new Invoice { Amount = 100 };
payable.Pay();
```

**C# 8+ Interface Features:**
```csharp
public interface ILogger
{
    void Log(string message);
    
    // Default implementation (C# 8+)
    void LogError(string message) => Log($"ERROR: {message}");
    
    // Static members (C# 8+)
    static string DefaultFormat => "[{0}]: {1}";
}
```

---

### 41. Difference between interface and abstract class?

| Aspect | Interface | Abstract Class |
|--------|-----------|----------------|
| **Instantiation** | Cannot | Cannot |
| **Multiple Inheritance** | Yes | No |
| **Constructors** | No | Yes |
| **Fields** | No (until C# 8) | Yes |
| **Access Modifiers** | Public only (traditionally) | Any |
| **Default Implementation** | C# 8+ only | Yes |
| **Purpose** | Define capability (CAN-DO) | Define identity (IS-A) |

```csharp
// Use interface for capabilities
public interface ISerializable { }
public interface IDisposable { }

// Use abstract class for shared base
public abstract class Animal
{
    protected string name;  // Shared field
    public Animal(string name) => this.name = name;  // Constructor
}

// A class can implement multiple interfaces
public class Dog : Animal, ISerializable, IDisposable
{
    public Dog(string name) : base(name) { }
    public void Dispose() { }
}
```

---

### 42. What is multiple inheritance?

**Multiple inheritance** means a class inheriting from multiple base classes. C# doesn't support this for classes but does for interfaces.

```csharp
// ✗ NOT ALLOWED in C#
// class Child : Parent1, Parent2 { }

// ✓ Multiple interface implementation
public interface IFlyable { void Fly(); }
public interface ISwimmable { void Swim(); }

public class Duck : IFlyable, ISwimmable
{
    public void Fly() => Console.WriteLine("Flying");
    public void Swim() => Console.WriteLine("Swimming");
}

// Workaround: Composition
public class Child
{
    private Parent1 _parent1 = new Parent1();
    private Parent2 _parent2 = new Parent2();
    
    public void Method1() => _parent1.Method1();
    public void Method2() => _parent2.Method2();
}
```

---

### 43. What is constructor?

A **constructor** initializes an object when it's created.

```csharp
public class Person
{
    public string Name { get; }
    public int Age { get; }
    
    // Default constructor
    public Person()
    {
        Name = "Unknown";
        Age = 0;
    }
    
    // Parameterized constructor
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
    
    // Constructor chaining
    public Person(string name) : this(name, 0)
    {
    }
}

// Usage
var p1 = new Person();
var p2 = new Person("Alice", 30);
var p3 = new Person("Bob");
```

---

### 44. What is static constructor?

A **static constructor** initializes static members. Called once, automatically, before first use.

```csharp
public class Configuration
{
    public static string ConnectionString { get; private set; }
    public static int MaxRetries { get; private set; }
    
    // Static constructor - no access modifier, no parameters
    static Configuration()
    {
        Console.WriteLine("Loading configuration...");
        ConnectionString = LoadFromFile();
        MaxRetries = 3;
    }
    
    private static string LoadFromFile() => "Server=localhost;...";
}

// First access triggers static constructor
var conn = Configuration.ConnectionString;
```

**Rules:**
- No access modifier
- No parameters
- Called once automatically
- Cannot be called directly
- Runs before any static member access

---

### 45. What is destructor?

A **destructor** (finalizer) is called when an object is garbage collected. Used for cleanup.

```csharp
public class ResourceHolder
{
    private IntPtr _unmanagedResource;
    
    public ResourceHolder()
    {
        _unmanagedResource = AllocateUnmanagedResource();
    }
    
    // Destructor / Finalizer
    ~ResourceHolder()
    {
        // Clean up unmanaged resources
        FreeUnmanagedResource(_unmanagedResource);
    }
    
    private IntPtr AllocateUnmanagedResource() => IntPtr.Zero;
    private void FreeUnmanagedResource(IntPtr ptr) { }
}
```

**Important:**
- Use `IDisposable` pattern instead when possible
- Finalizers are non-deterministic
- Objects with finalizers take longer to collect
- Prefer `using` statement

```csharp
// Better approach - IDisposable
public class BetterResource : IDisposable
{
    public void Dispose()
    {
        // Deterministic cleanup
        GC.SuppressFinalize(this);
    }
    
    ~BetterResource() => Dispose();
}
```

---

### 46. What is property?

A **property** is a member that provides flexible access to a field with get/set accessors.

```csharp
public class Person
{
    private string _name;
    private int _age;
    
    // Property with backing field
    public string Name
    {
        get { return _name; }
        set { _name = value ?? throw new ArgumentNullException(); }
    }
    
    // Property with validation
    public int Age
    {
        get => _age;
        set
        {
            if (value < 0 || value > 150)
                throw new ArgumentOutOfRangeException();
            _age = value;
        }
    }
    
    // Read-only property
    public bool IsAdult => Age >= 18;
}
```

---

### 47. What is auto-property?

**Auto-properties** let the compiler generate the backing field automatically.

```csharp
public class Product
{
    // Auto-property
    public string Name { get; set; }
    
    // Auto-property with initializer (C# 6+)
    public decimal Price { get; set; } = 0.0m;
    
    // Read-only auto-property
    public DateTime CreatedAt { get; } = DateTime.Now;
    
    // Init-only (C# 9+)
    public string SKU { get; init; }
    
    // Private setter
    public int Id { get; private set; }
}

var product = new Product 
{ 
    Name = "Widget", 
    Price = 29.99m,
    SKU = "WGT-001"  // Can only set during initialization
};
```

---

### 48. What is readonly?

`readonly` fields can only be assigned during declaration or in a constructor.

```csharp
public class ImmutableConfig
{
    // Readonly field
    public readonly string Environment;
    public readonly DateTime StartTime = DateTime.Now;
    
    public ImmutableConfig(string env)
    {
        Environment = env;  // ✓ Can assign in constructor
    }
    
    public void TryChange()
    {
        // Environment = "Other";  // ✗ Error - cannot reassign
    }
}

// Readonly struct (C# 7.2+)
public readonly struct Point
{
    public readonly int X;
    public readonly int Y;
    
    public Point(int x, int y) => (X, Y) = (x, y);
}
```

---

### 49. What is const?

`const` defines compile-time constants that never change.

```csharp
public class MathConstants
{
    public const double Pi = 3.14159265359;
    public const int MaxSize = 100;
    public const string Version = "1.0.0";
}

// Usage
double area = MathConstants.Pi * radius * radius;
```

**const vs readonly:**
| Aspect | const | readonly |
|--------|-------|----------|
| Set when | Compile time | Runtime (constructor) |
| Static | Always static | Can be instance |
| Types | Primitives, string | Any type |
| Value | Literal only | Expression allowed |

```csharp
public class Example
{
    public const int CompileTime = 42;        // Must be literal
    public readonly int RuntimeSet;           // Set in constructor
    public static readonly DateTime StartTime = DateTime.Now;  // Runtime value
}
```

---

### 50. What is ref keyword?

`ref` passes a variable by reference, allowing the method to modify the original.

```csharp
public class RefExample
{
    // Ref parameter - must be initialized before call
    public void Double(ref int number)
    {
        number *= 2;
    }
    
    // Ref return
    public ref int GetElement(int[] array, int index)
    {
        return ref array[index];
    }
}

int value = 10;
var example = new RefExample();
example.Double(ref value);
Console.WriteLine(value);  // 20

int[] arr = { 1, 2, 3 };
ref int element = ref example.GetElement(arr, 1);
element = 100;
Console.WriteLine(arr[1]);  // 100
```

---

### 51. What is out keyword?

`out` is for returning values from a method. Must be assigned before method returns.

```csharp
public class OutExample
{
    // Out parameter - for returning values
    public bool TryParse(string input, out int result)
    {
        if (int.TryParse(input, out result))
        {
            return true;
        }
        result = 0;  // Must assign before return
        return false;
    }
    
    // Multiple out parameters
    public void GetMinMax(int[] numbers, out int min, out int max)
    {
        min = numbers.Min();
        max = numbers.Max();
    }
}

// Usage (C# 7+: inline declaration)
if (int.TryParse("42", out int number))
{
    Console.WriteLine(number);
}

// Discard unwanted out values
int.TryParse("42", out _);
```

---

### 52. What is params?

`params` allows passing a variable number of arguments.

```csharp
public class ParamsExample
{
    // Variable argument list
    public int Sum(params int[] numbers)
    {
        return numbers.Sum();
    }
    
    public void Print(string format, params object[] args)
    {
        Console.WriteLine(string.Format(format, args));
    }
}

var example = new ParamsExample();
example.Sum(1, 2, 3);          // Pass multiple values
example.Sum(1, 2, 3, 4, 5);    // Any count
example.Sum(new int[] { 1, 2 }); // Or array

example.Print("{0} is {1}", "Alice", 30);
```

**Rules:**
- Only one params per method
- Must be last parameter
- Optional to pass (empty array if not)

---

### 53. What is this keyword?

`this` refers to the current instance of the class.

```csharp
public class Person
{
    private string name;
    
    // Distinguish field from parameter
    public Person(string name)
    {
        this.name = name;
    }
    
    // Constructor chaining
    public Person() : this("Unknown")
    {
    }
    
    // Return current instance (fluent API)
    public Person SetName(string name)
    {
        this.name = name;
        return this;
    }
    
    // Pass current instance
    public void Register()
    {
        Registry.Add(this);
    }
}

// Extension method parameter
public static class Extensions
{
    public static bool IsEmpty(this string s) => string.IsNullOrEmpty(s);
}
```

---

### 54. What is base keyword?

`base` accesses members of the base class from a derived class.

```csharp
public class Animal
{
    public string Name { get; protected set; }
    
    public Animal(string name)
    {
        Name = name;
    }
    
    public virtual void Speak()
    {
        Console.WriteLine($"{Name} makes a sound");
    }
}

public class Dog : Animal
{
    public string Breed { get; }
    
    // Call base constructor
    public Dog(string name, string breed) : base(name)
    {
        Breed = breed;
    }
    
    // Call base method
    public override void Speak()
    {
        base.Speak();  // Call Animal.Speak()
        Console.WriteLine("Woof woof!");
    }
}
```

---

### 55. What is record?

`record` (C# 9+) is a reference type designed for immutable data with value-based equality.

```csharp
// Record declaration
public record Person(string FirstName, string LastName);

// Usage
var p1 = new Person("John", "Doe");
var p2 = new Person("John", "Doe");

Console.WriteLine(p1 == p2);  // true (value equality)
Console.WriteLine(p1);        // Person { FirstName = John, LastName = Doe }

// With expression for copying
var p3 = p1 with { LastName = "Smith" };

// Record struct (C# 10+)
public record struct Point(int X, int Y);

// Record with additional members
public record Employee(string Name, int Id)
{
    public string Department { get; init; }
    
    public void PrintBadge() => Console.WriteLine($"[{Id}] {Name}");
}
```

---

### 56. What is init?

`init` (C# 9+) allows properties to be set only during object initialization.

```csharp
public class Person
{
    public string Name { get; init; }  // Init-only
    public int Age { get; init; }
}

// Can set during initialization
var person = new Person 
{ 
    Name = "Alice", 
    Age = 30 
};

// Cannot set after
// person.Name = "Bob";  // ✗ Error

// Works with records
public record Product
{
    public string Name { get; init; }
    public decimal Price { get; init; }
}
```

---

### 57. What is expression-bodied member?

**Expression-bodied members** use `=>` for concise single-expression implementations.

```csharp
public class Circle
{
    private double _radius;
    
    // Constructor
    public Circle(double radius) => _radius = radius;
    
    // Property getter
    public double Radius => _radius;
    
    // Property getter and setter
    public double Diameter
    {
        get => _radius * 2;
        set => _radius = value / 2;
    }
    
    // Method
    public double GetArea() => Math.PI * _radius * _radius;
    
    // Read-only property
    public double Circumference => 2 * Math.PI * _radius;
    
    // Indexer
    public double this[int i] => i == 0 ? _radius : 0;
    
    // Finalizer
    ~Circle() => Console.WriteLine("Disposed");
}
```

---

### 58. What is tuple?

**Tuples** group multiple values without creating a formal class.

```csharp
// Creating tuples
var tuple1 = (1, "hello");
var tuple2 = (Id: 1, Name: "Alice");

// Accessing
Console.WriteLine(tuple1.Item1);  // 1
Console.WriteLine(tuple2.Name);   // Alice

// Deconstruction
var (id, name) = tuple2;
(int x, string y) = tuple1;

// Method returning tuple
public (int Min, int Max) GetMinMax(int[] numbers)
{
    return (numbers.Min(), numbers.Max());
}

var result = GetMinMax(new[] { 1, 5, 3 });
Console.WriteLine($"Min: {result.Min}, Max: {result.Max}");

// Tuple equality
var a = (1, 2);
var b = (1, 2);
Console.WriteLine(a == b);  // true
```

---

### 59. What is pattern matching?

**Pattern matching** tests values against patterns and extracts data.

```csharp
// Type pattern
object obj = "Hello";
if (obj is string s)
{
    Console.WriteLine(s.Length);
}

// Property pattern
public record Person(string Name, int Age);

var person = new Person("Alice", 30);
if (person is { Age: > 18, Name: var name })
{
    Console.WriteLine($"{name} is an adult");
}

// Relational patterns (C# 9+)
string GetCategory(int score) => score switch
{
    >= 90 => "A",
    >= 80 and < 90 => "B",
    >= 70 and < 80 => "C",
    >= 60 and < 70 => "D",
    _ => "F"
};

// List patterns (C# 11+)
int[] numbers = { 1, 2, 3 };
if (numbers is [1, 2, ..])
{
    Console.WriteLine("Starts with 1, 2");
}
```

---

### 60. What is switch expression?

**Switch expressions** (C# 8+) return values based on pattern matching.

```csharp
// Traditional switch statement
string GetDayType1(DayOfWeek day)
{
    switch (day)
    {
        case DayOfWeek.Saturday:
        case DayOfWeek.Sunday:
            return "Weekend";
        default:
            return "Weekday";
    }
}

// Switch expression
string GetDayType2(DayOfWeek day) => day switch
{
    DayOfWeek.Saturday or DayOfWeek.Sunday => "Weekend",
    _ => "Weekday"
};

// With pattern matching
string DescribeShape(object shape) => shape switch
{
    Circle { Radius: > 10 } => "Large circle",
    Circle c => $"Circle with radius {c.Radius}",
    Rectangle { Width: var w, Height: var h } when w == h => "Square",
    Rectangle r => $"Rectangle {r.Width}x{r.Height}",
    null => "No shape",
    _ => "Unknown shape"
};

// Tuple pattern
string GetQuadrant(int x, int y) => (x, y) switch
{
    ( > 0, > 0) => "Quadrant 1",
    ( < 0, > 0) => "Quadrant 2",
    ( < 0, < 0) => "Quadrant 3",
    ( > 0, < 0) => "Quadrant 4",
    _ => "On axis"
};
```

---

## Summary Table

| Concept | Purpose |
|---------|---------|
| Encapsulation | Hide internal details, control access |
| Inheritance | Reuse code from parent class |
| Polymorphism | Same interface, different behaviors |
| Abstraction | Hide complexity, show essentials |
| Overloading | Same name, different parameters |
| Overriding | Replace base class method |
| Virtual | Allow method to be overridden |
| Abstract Class | Base with unimplemented methods |
| Interface | Contract for capabilities |
| Constructor | Initialize objects |
| Static Constructor | Initialize static members once |
| Destructor | Cleanup before GC |
| Property | Controlled field access |
| readonly | Set only in constructor |
| const | Compile-time constant |
| ref | Pass by reference |
| out | Return multiple values |
| params | Variable argument count |
| this | Current instance reference |
| base | Access parent class |
| record | Immutable data type |
| init | Set during initialization only |
| Tuple | Group multiple values |
| Pattern Matching | Test and extract from patterns |
| Switch Expression | Pattern-based value selection |

---

*Next: [Part 3 - Collections & LINQ](03-beginner-collections-linq.md)*
