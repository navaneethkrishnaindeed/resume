# .NET Interview Guide - Beginner Level
## Part 1: Core .NET Basics (Questions 1-30)

---

### 1. What is .NET?

**.NET** is a free, open-source, cross-platform development framework created by Microsoft for building various types of applications including web, mobile, desktop, cloud, gaming, and IoT applications.

**Key Components:**
- **Runtime (CLR/CoreCLR)**: Executes your code
- **Libraries (BCL)**: Pre-built functionality
- **Languages**: C#, F#, VB.NET
- **Tools**: CLI, Visual Studio, VS Code

```csharp
// A simple .NET application
using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, .NET!");
    }
}
```

---

### 2. What is the difference between .NET and .NET Framework?

| Aspect | .NET (Core/5+) | .NET Framework |
|--------|----------------|----------------|
| **Platform** | Cross-platform (Windows, Linux, macOS) | Windows only |
| **Open Source** | Yes | Partially |
| **Performance** | Higher, optimized | Lower |
| **Deployment** | Side-by-side, self-contained | Machine-wide GAC |
| **Development** | Active, modern | Maintenance mode |
| **Container Support** | Excellent | Limited |

**.NET Framework** (4.x) is legacy Windows-only.
**.NET** (5, 6, 7, 8+) is the modern, unified platform.

---

### 3. What is CLR?

**CLR (Common Language Runtime)** is the virtual machine component of .NET that manages code execution.

**Key Responsibilities:**
- **Memory Management**: Automatic garbage collection
- **Type Safety**: Enforces type rules at runtime
- **Exception Handling**: Structured exception handling
- **Security**: Code access security, verification
- **JIT Compilation**: Converts IL to native code
- **Thread Management**: Thread pooling and synchronization

```
Source Code → Compiler → IL Code → CLR (JIT) → Native Code → Execution
```

---

### 4. What is JIT compilation?

**JIT (Just-In-Time) compilation** converts IL (Intermediate Language) code to native machine code at runtime, just before execution.

**Types of JIT:**
- **Normal JIT**: Compiles methods when first called
- **Pre-JIT (NGEN/R2R)**: Compiles entire assembly at install time
- **Tiered Compilation**: Starts with quick compilation, optimizes hot paths

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   IL Code   │ → │     JIT     │ → │ Native Code │
└─────────────┘    └─────────────┘    └─────────────┘
                   (At Runtime)        (Cached)
```

**Benefits:**
- Platform-specific optimizations
- Only compiles what's needed
- Can optimize based on runtime conditions

---

### 5. What is IL (Intermediate Language)?

**IL (Intermediate Language)**, also called **MSIL** or **CIL**, is the CPU-independent instruction set that .NET compilers produce.

**Characteristics:**
- Stack-based instruction set
- Object-oriented
- Platform-agnostic
- Stored in assemblies (.dll, .exe)

```csharp
// C# Code
public int Add(int a, int b)
{
    return a + b;
}
```

```
// Equivalent IL (simplified)
.method public int32 Add(int32 a, int32 b)
{
    ldarg.1      // Load argument 'a'
    ldarg.2      // Load argument 'b'
    add          // Add them
    ret          // Return result
}
```

You can view IL using tools like **ILSpy**, **dotPeek**, or `ildasm`.

---

### 6. What is managed code?

**Managed code** is code that runs under the control of the CLR, benefiting from its services.

**Features:**
- Automatic memory management (GC)
- Type safety verification
- Exception handling
- Security sandboxing
- Cross-language interoperability

```csharp
// This is managed code - CLR handles memory
public class ManagedExample
{
    public void CreateObject()
    {
        var list = new List<int>(); // CLR manages this memory
        list.Add(1);
        // No need to free memory - GC handles it
    }
}
```

---

### 7. What is unmanaged code?

**Unmanaged code** executes directly on the operating system, outside CLR control.

**Examples:**
- C/C++ native code
- COM components
- Windows API calls
- Native DLLs

```csharp
// Calling unmanaged code from C#
using System.Runtime.InteropServices;

public class UnmanagedExample
{
    // P/Invoke to call Windows API
    [DllImport("user32.dll")]
    public static extern int MessageBox(IntPtr hWnd, string text, string caption, int type);
    
    public void ShowMessage()
    {
        MessageBox(IntPtr.Zero, "Hello!", "Title", 0);
    }
}
```

**Key Difference:** You must manually manage memory in unmanaged code.

---

### 8. What is CTS?

**CTS (Common Type System)** defines how types are declared, used, and managed in the .NET runtime.

**Purpose:**
- Enables cross-language integration
- Provides type safety
- Defines rules all types must follow

**Type Categories:**
```
CTS Types
├── Value Types (struct, enum)
│   ├── Built-in (int, bool, float)
│   └── User-defined structs
└── Reference Types
    ├── Classes
    ├── Interfaces
    ├── Arrays
    └── Delegates
```

```csharp
// CTS ensures these are compatible across languages
int number = 42;           // System.Int32
string text = "Hello";     // System.String
bool flag = true;          // System.Boolean
```

---

### 9. What is CLS?

**CLS (Common Language Specification)** is a subset of CTS that defines rules for cross-language compatibility.

**Key Rules:**
- No unsigned types in public APIs
- No pointers in public APIs
- No operator overloading (for some languages)
- Case sensitivity considerations

```csharp
// CLS-compliant
[assembly: CLSCompliant(true)]

public class Calculator
{
    public int Add(int a, int b) => a + b;  // ✓ CLS-compliant
}

// NOT CLS-compliant (unsigned type)
public class NotCompliant
{
    public uint GetValue() => 42;  // ✗ uint not CLS-compliant
}
```

---

### 10. What is BCL?

**BCL (Base Class Library)** is the standard library of classes available to all .NET applications.

**Key Namespaces:**
| Namespace | Purpose |
|-----------|---------|
| `System` | Fundamental types (Object, String, Int32) |
| `System.Collections.Generic` | Generic collections |
| `System.IO` | File and stream operations |
| `System.Linq` | LINQ extensions |
| `System.Threading.Tasks` | Async programming |
| `System.Net.Http` | HTTP client |
| `System.Text.Json` | JSON serialization |

```csharp
// Using BCL classes
using System;
using System.Collections.Generic;
using System.Linq;

var numbers = new List<int> { 1, 2, 3, 4, 5 };
var sum = numbers.Where(n => n > 2).Sum();
Console.WriteLine(sum); // 12
```

---

### 11. What is assembly?

An **assembly** is the fundamental unit of deployment, versioning, and security in .NET.

**Types:**
- **EXE**: Executable assembly (has entry point)
- **DLL**: Library assembly (no entry point)

**Contains:**
- **Manifest**: Metadata about the assembly
- **Type Metadata**: Information about types
- **IL Code**: The compiled code
- **Resources**: Embedded files, strings

```csharp
// Get assembly information
using System.Reflection;

var assembly = Assembly.GetExecutingAssembly();
Console.WriteLine($"Name: {assembly.GetName().Name}");
Console.WriteLine($"Version: {assembly.GetName().Version}");
```

---

### 12. What is strong naming?

**Strong naming** gives an assembly a unique identity using a cryptographic key pair.

**Components:**
- Assembly name
- Version number
- Culture information
- Public key token

```bash
# Generate a key pair
sn -k MyKey.snk

# Sign assembly (in .csproj)
<PropertyGroup>
    <SignAssembly>true</SignAssembly>
    <AssemblyOriginatorKeyFile>MyKey.snk</AssemblyOriginatorKeyFile>
</PropertyGroup>
```

**Benefits:**
- Guarantees assembly uniqueness
- Prevents tampering
- Required for GAC deployment
- Enables side-by-side versioning

---

### 13. What is GAC?

**GAC (Global Assembly Cache)** is a machine-wide cache for storing shared assemblies.

**Location:** `C:\Windows\Microsoft.NET\assembly\`

**Requirements:**
- Assembly must be strong-named
- Requires admin privileges to install

```bash
# Install to GAC (requires admin)
gacutil -i MyAssembly.dll

# List GAC contents
gacutil -l

# Uninstall from GAC
gacutil -u MyAssembly
```

**Note:** GAC is primarily a .NET Framework concept. .NET Core/5+ uses NuGet packages and local deployment instead.

---

### 14. What is garbage collection?

**Garbage Collection (GC)** is automatic memory management that reclaims memory from objects no longer in use.

**How it works:**
1. **Mark**: Identify reachable objects
2. **Sweep**: Reclaim unreachable objects
3. **Compact**: Defragment memory (optionally)

```csharp
public void Example()
{
    var obj = new MyClass();  // Memory allocated
    // ... use obj
}   // obj goes out of scope
    // GC will eventually reclaim this memory

// Force GC (not recommended in production)
GC.Collect();
GC.WaitForPendingFinalizers();
```

**GC Modes:**
- **Workstation GC**: Optimized for UI responsiveness
- **Server GC**: Optimized for throughput

---

### 15. What are generations in GC?

The GC organizes objects into **generations** based on their lifetime, optimizing collection efficiency.

```
┌─────────────────────────────────────────────┐
│                   HEAP                       │
├─────────────┬──────────────┬────────────────┤
│    Gen 0    │    Gen 1     │     Gen 2      │
│  (Newest)   │  (Survived)  │   (Long-lived) │
│   ~256KB    │    ~2MB      │    ~10MB+      │
└─────────────┴──────────────┴────────────────┘
        ↑              ↑              ↑
   Collected      Collected      Collected
   Most Often     Less Often     Rarely
```

**Generation Rules:**
- **Gen 0**: New objects. Collected frequently.
- **Gen 1**: Survived Gen 0. Buffer between short and long-lived.
- **Gen 2**: Long-lived objects. Collected rarely (expensive).

```csharp
// Check object generation
var obj = new object();
Console.WriteLine(GC.GetGeneration(obj)); // 0

GC.Collect();
Console.WriteLine(GC.GetGeneration(obj)); // 1 (survived)
```

---

### 16. What is boxing?

**Boxing** is the process of converting a value type to a reference type (object or interface).

```csharp
int number = 42;           // Value type on stack
object boxed = number;     // Boxing: copied to heap, wrapped in object

// What happens:
// 1. Memory allocated on heap
// 2. Value copied to heap
// 3. Reference returned
```

**Performance Impact:**
- Heap allocation
- Memory copy
- GC pressure

```csharp
// Common boxing scenarios
ArrayList list = new ArrayList();
list.Add(42);  // Boxing occurs!

// Avoid with generics
List<int> genericList = new List<int>();
genericList.Add(42);  // No boxing!
```

---

### 17. What is unboxing?

**Unboxing** is the process of converting a boxed value back to its original value type.

```csharp
object boxed = 42;         // Boxed integer
int number = (int)boxed;   // Unboxing: extract value from heap

// What happens:
// 1. Check type compatibility
// 2. Copy value from heap to stack
```

**Rules:**
- Must cast to the exact original type
- InvalidCastException if types don't match

```csharp
object boxed = 42;

int correct = (int)boxed;      // ✓ Works
// long wrong = (long)boxed;   // ✗ InvalidCastException

// Correct way for different type:
long converted = (long)(int)boxed;  // ✓ Unbox then convert
```

---

### 18. What is value type?

**Value types** store data directly and are allocated on the stack (usually).

**Characteristics:**
- Contain actual data
- Copied by value
- Cannot be null (unless nullable)
- Inherit from `System.ValueType`

**Built-in Value Types:**
```csharp
// Numeric types
int i = 10;
double d = 3.14;
decimal m = 19.99m;

// Other value types
bool flag = true;
char c = 'A';
DateTime now = DateTime.Now;

// Structs
struct Point
{
    public int X;
    public int Y;
}

// Enums
enum Color { Red, Green, Blue }
```

---

### 19. What is reference type?

**Reference types** store a reference (pointer) to data on the heap.

**Characteristics:**
- Variable contains address, not data
- Data stored on heap
- Copied by reference
- Can be null
- Inherit from `System.Object`

```csharp
// Reference types
class Person
{
    public string Name;
}

Person p1 = new Person { Name = "Alice" };
Person p2 = p1;  // Both point to same object

p2.Name = "Bob";
Console.WriteLine(p1.Name);  // "Bob" - same object!

// Built-in reference types
string text = "Hello";
int[] array = new int[5];
object obj = new object();
```

---

### 20. Difference between stack and heap?

| Aspect | Stack | Heap |
|--------|-------|------|
| **Allocation** | Automatic, fast | Manual (via `new`), slower |
| **Deallocation** | Automatic (scope-based) | GC managed |
| **Size** | Limited (~1MB) | Large (limited by RAM) |
| **Access** | Very fast | Slower (indirection) |
| **Contents** | Value types, references | Reference type data |
| **Thread Safety** | Thread-specific | Shared across threads |

```
┌─────────────────────────────────────────┐
│                 STACK                    │
│  ┌─────────────────────────────────┐    │
│  │ int x = 10        (value: 10)   │    │
│  │ Person p = ref    (ref: 0x1234) │───┐│
│  └─────────────────────────────────┘   ││
└────────────────────────────────────────┘│
                                          │
┌─────────────────────────────────────────┐│
│                 HEAP                     ││
│  ┌─────────────────────────────────┐    ││
│  │ 0x1234: Person { Name="Alice" } │←───┘│
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

### 21. What is nullable type?

**Nullable types** allow value types to represent `null` in addition to their normal values.

```csharp
// Nullable value types
int? nullableInt = null;
int? anotherInt = 42;

// Check and access
if (nullableInt.HasValue)
{
    int value = nullableInt.Value;
}

// Null-coalescing operator
int result = nullableInt ?? 0;  // 0 if null

// Null-conditional
int? length = nullableInt?.ToString().Length;
```

**Nullable Reference Types (C# 8+):**
```csharp
#nullable enable

string nonNullable = "Hello";    // Cannot be null
string? nullable = null;          // Can be null

// Compiler warnings help prevent null reference exceptions
```

---

### 22. What is default(T)?

`default(T)` returns the default value for a type.

```csharp
// Default values
default(int)      // 0
default(bool)     // false
default(double)   // 0.0
default(string)   // null
default(object)   // null
default(DateTime) // DateTime.MinValue (0001-01-01)

// Generic usage
public T GetDefault<T>()
{
    return default(T);  // or just: default
}

// C# 7.1+ simplified syntax
int x = default;
string s = default;
```

**Rules:**
- Value types: Zero/false equivalent
- Reference types: null
- Structs: All fields set to default

---

### 23. What is var?

`var` is implicit typing - the compiler infers the type at compile time.

```csharp
var number = 42;           // int
var text = "Hello";        // string
var list = new List<int>();// List<int>

// Type is still static - these are errors:
// number = "text";  // ✗ Cannot assign string to int

// Required for anonymous types
var anon = new { Name = "Alice", Age = 30 };
```

**When to use:**
- ✓ When type is obvious from right side
- ✓ With anonymous types (required)
- ✓ Long generic types
- ✗ When type isn't clear

```csharp
// Good uses
var customer = new Customer();
var dict = new Dictionary<string, List<int>>();

// Avoid when unclear
var result = GetData();  // What type is this?
```

---

### 24. What is dynamic?

`dynamic` bypasses compile-time type checking. Type resolution happens at runtime.

```csharp
dynamic value = 10;
value = "Hello";      // ✓ No compile error
value = new List<int>();  // ✓ Can change types

dynamic d = "Hello";
Console.WriteLine(d.Length);   // ✓ Resolved at runtime
// Console.WriteLine(d.Foo()); // Runtime error, not compile error
```

**Use Cases:**
- COM interop
- Dynamic languages interop
- JSON/XML with unknown structure
- Reflection alternative

```csharp
// Working with dynamic JSON
dynamic json = JsonConvert.DeserializeObject(jsonString);
string name = json.user.name;  // No type needed
```

**Performance:** Slower than static typing due to runtime resolution.

---

### 25. What is object?

`object` is the base type for all types in .NET. Every type inherits from `System.Object`.

```csharp
object obj1 = 42;        // Boxing
object obj2 = "Hello";   // Reference stored
object obj3 = new Person();

// Object methods available to all types
obj1.ToString();
obj1.GetType();
obj1.GetHashCode();
obj1.Equals(obj2);
```

**Object Methods:**
| Method | Purpose |
|--------|---------|
| `ToString()` | String representation |
| `GetType()` | Runtime type information |
| `GetHashCode()` | Hash code for collections |
| `Equals()` | Equality comparison |

---

### 26. What is string immutability?

Strings in .NET are **immutable** - once created, they cannot be changed.

```csharp
string s = "Hello";
s = s + " World";  // Creates NEW string, doesn't modify original

// What happens:
// 1. "Hello" created in memory
// 2. " World" created
// 3. "Hello World" created (concatenation)
// 4. Original "Hello" eligible for GC
```

**Why Immutable?**
- Thread safety
- String interning (reuse)
- Security (can't be modified unexpectedly)
- Hash code stability

```csharp
// String interning
string a = "Hello";
string b = "Hello";
Console.WriteLine(object.ReferenceEquals(a, b));  // true - same instance!

// Inefficient concatenation
string result = "";
for (int i = 0; i < 1000; i++)
{
    result += i;  // Creates 1000 strings!
}
```

---

### 27. What is StringBuilder?

`StringBuilder` is a mutable string class for efficient string manipulation.

```csharp
using System.Text;

// Efficient string building
var sb = new StringBuilder();
for (int i = 0; i < 1000; i++)
{
    sb.Append(i);     // Modifies internal buffer
    sb.Append(", ");
}
string result = sb.ToString();

// Common methods
sb.Append("text");
sb.AppendLine("line");
sb.Insert(0, "prefix");
sb.Replace("old", "new");
sb.Remove(0, 5);
sb.Clear();
```

**When to use:**
- Multiple concatenations (>3-4)
- Building strings in loops
- Large string operations

**Performance:**
```csharp
// String: O(n²) for n concatenations
// StringBuilder: O(n) for n appends
```

---

### 28. What is a namespace?

A **namespace** organizes code and prevents naming conflicts.

```csharp
// Declaring a namespace
namespace MyCompany.MyProduct.Features
{
    public class MyClass { }
}

// Using namespaces
using System;
using System.Collections.Generic;
using MyCompany.MyProduct.Features;

// Alias
using Console = System.Console;
using Dict = System.Collections.Generic.Dictionary<string, int>;

// File-scoped namespace (C# 10+)
namespace MyCompany.MyProduct;

public class MyClass { }  // Less indentation
```

**Conventions:**
- CompanyName.ProductName.Feature
- PascalCase
- Match folder structure

---

### 29. What is partial class?

A **partial class** allows splitting a class definition across multiple files.

```csharp
// File: Person.cs
public partial class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
}

// File: Person.Methods.cs
public partial class Person
{
    public void SayHello()
    {
        Console.WriteLine($"Hello, I'm {Name}");
    }
}

// File: Person.Generated.cs (auto-generated)
public partial class Person
{
    public string GeneratedProperty { get; set; }
}
```

**Use Cases:**
- Separating generated code from custom code
- Large classes organization
- Multiple developers on same class
- WinForms/WPF designer files

---

### 30. What is sealed class?

A **sealed class** cannot be inherited from.

```csharp
public sealed class FinalClass
{
    public void DoSomething() { }
}

// This is an error:
// public class Derived : FinalClass { }  // ✗ Cannot inherit

// Sealed methods
public class Base
{
    public virtual void Method() { }
}

public class Derived : Base
{
    public sealed override void Method() { }  // Can't be overridden further
}
```

**Why seal classes?**
- Security - prevent malicious overrides
- Performance - enables devirtualization
- Design - class isn't designed for inheritance
- Simplicity - inheritance adds complexity

**Examples:** `String`, `StringBuilder`, `Tuple<>` are sealed.

---

## Summary

| Concept | One-Line Definition |
|---------|---------------------|
| .NET | Cross-platform development framework |
| CLR | Runtime that executes managed code |
| JIT | Compiles IL to native code at runtime |
| IL | CPU-independent intermediate code |
| Managed Code | Code running under CLR control |
| CTS | Common type system across languages |
| CLS | Cross-language compatibility rules |
| BCL | Standard class library |
| Assembly | Unit of deployment (.dll/.exe) |
| GAC | Machine-wide shared assembly cache |
| GC | Automatic memory management |
| Boxing | Value type → Reference type |
| Value Type | Data on stack, copied by value |
| Reference Type | Reference on stack, data on heap |
| Nullable | Value types that can be null |
| var | Compile-time type inference |
| dynamic | Runtime type resolution |
| StringBuilder | Mutable string builder |
| Namespace | Code organization unit |
| Partial Class | Class split across files |
| Sealed Class | Cannot be inherited |

---

*Next: [Part 2 - OOP in C#](02-beginner-oop.md)*
