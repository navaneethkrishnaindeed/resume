# 🌳 8. Tree Recursion Patterns (Master This!)

## The Universal Tree Recursion Template

> **Almost ALL tree problems follow this pattern:**
> 1. Solve left subtree
> 2. Solve right subtree  
> 3. Combine results

```csharp
public ReturnType Solve(TreeNode node)
{
    // Base case
    if (node == null)
        return BASE_VALUE;
    
    // 1. Solve left subtree
    var leftResult = Solve(node.Left);
    
    // 2. Solve right subtree
    var rightResult = Solve(node.Right);
    
    // 3. Combine results
    return Combine(node.Val, leftResult, rightResult);
}
```

---

## 🎯 The 4 Core Patterns

### Pattern 1: Bottom-Up (Postorder)
> **Collect information from children, then compute for current node**

```csharp
// Example: Calculate height
public int Height(TreeNode node)
{
    if (node == null) return 0;  // Base case
    
    int leftHeight = Height(node.Left);      // Step 1
    int rightHeight = Height(node.Right);    // Step 2
    
    return 1 + Math.Max(leftHeight, rightHeight);  // Step 3: Combine
}

// Example: Sum of all nodes
public int TreeSum(TreeNode node)
{
    if (node == null) return 0;
    
    int leftSum = TreeSum(node.Left);
    int rightSum = TreeSum(node.Right);
    
    return node.Val + leftSum + rightSum;
}

// Example: Count nodes
public int CountNodes(TreeNode node)
{
    if (node == null) return 0;
    
    int leftCount = CountNodes(node.Left);
    int rightCount = CountNodes(node.Right);
    
    return 1 + leftCount + rightCount;
}
```

**When to use**: When you need information from children to compute the answer for the current node.

---

### Pattern 2: Top-Down (Preorder)
> **Pass information from parent to children**

```csharp
// Example: Max depth passing current depth down
public int MaxDepth(TreeNode node, int currentDepth = 0)
{
    if (node == null)
        return currentDepth;
    
    int leftMax = MaxDepth(node.Left, currentDepth + 1);   // Pass info down
    int rightMax = MaxDepth(node.Right, currentDepth + 1);
    
    return Math.Max(leftMax, rightMax);
}

// Example: Check path sum
public bool HasPathSum(TreeNode node, int target, int currentSum = 0)
{
    if (node == null)
        return false;
    
    currentSum += node.Val;  // Update before going down
    
    // Leaf check
    if (node.Left == null && node.Right == null)
        return currentSum == target;
    
    return HasPathSum(node.Left, target, currentSum) || 
           HasPathSum(node.Right, target, currentSum);
}

// Example: Build all root-to-leaf paths
public void AllPaths(TreeNode node, List<int> currentPath, List<List<int>> result)
{
    if (node == null) return;
    
    currentPath.Add(node.Val);  // Add before recursing
    
    if (node.Left == null && node.Right == null)
    {
        result.Add(new List<int>(currentPath));  // Found a path
    }
    else
    {
        AllPaths(node.Left, currentPath, result);
        AllPaths(node.Right, currentPath, result);
    }
    
    currentPath.RemoveAt(currentPath.Count - 1);  // Backtrack
}
```

**When to use**: When parent information affects child processing (depth, path tracking, constraints).

---

### Pattern 3: Global State (with Side Effects)
> **Use external variable to track global maximum/minimum**

```csharp
// Example: Diameter of tree
public int Diameter(TreeNode root)
{
    int maxDiameter = 0;  // Global state
    
    int Height(TreeNode node)
    {
        if (node == null) return 0;
        
        int leftH = Height(node.Left);
        int rightH = Height(node.Right);
        
        // Update global max (side effect)
        maxDiameter = Math.Max(maxDiameter, leftH + rightH);
        
        return 1 + Math.Max(leftH, rightH);  // Return to parent
    }
    
    Height(root);
    return maxDiameter;
}

// Example: Max path sum (any to any)
public int MaxPathSum(TreeNode root)
{
    int maxSum = int.MinValue;
    
    int MaxGain(TreeNode node)
    {
        if (node == null) return 0;
        
        int left = Math.Max(0, MaxGain(node.Left));   // Ignore negative
        int right = Math.Max(0, MaxGain(node.Right));
        
        // Path through current node
        maxSum = Math.Max(maxSum, left + node.Val + right);
        
        // Return max one-sided path to parent
        return node.Val + Math.Max(left, right);
    }
    
    MaxGain(root);
    return maxSum;
}

// Example: Count good nodes (nodes where path from root has no greater value)
public int CountGoodNodes(TreeNode root)
{
    int count = 0;
    
    void Dfs(TreeNode node, int maxSoFar)
    {
        if (node == null) return;
        
        if (node.Val >= maxSoFar)
            count++;
        
        int newMax = Math.Max(maxSoFar, node.Val);
        Dfs(node.Left, newMax);
        Dfs(node.Right, newMax);
    }
    
    Dfs(root, int.MinValue);
    return count;
}
```

**When to use**: When finding global optimum that might pass through any node.

---

### Pattern 4: Two-Tree Parallel Recursion
> **Compare or combine two trees simultaneously**

```csharp
// Example: Check if same tree
public bool IsSame(TreeNode p, TreeNode q)
{
    if (p == null && q == null) return true;
    if (p == null || q == null) return false;
    
    return p.Val == q.Val && 
           IsSame(p.Left, q.Left) && 
           IsSame(p.Right, q.Right);
}

// Example: Check symmetric (mirror comparison)
public bool IsSymmetric(TreeNode root)
{
    bool IsMirror(TreeNode left, TreeNode right)
    {
        if (left == null && right == null) return true;
        if (left == null || right == null) return false;
        
        return left.Val == right.Val && 
               IsMirror(left.Left, right.Right) &&   // Outer
               IsMirror(left.Right, right.Left);     // Inner
    }
    
    return root == null || IsMirror(root.Left, root.Right);
}

// Example: Merge two trees
public TreeNode Merge(TreeNode t1, TreeNode t2)
{
    if (t1 == null) return t2;
    if (t2 == null) return t1;
    
    return new TreeNode(
        t1.Val + t2.Val,
        Merge(t1.Left, t2.Left),
        Merge(t1.Right, t2.Right)
    );
}
```

**When to use**: When comparing or combining multiple trees.

---

## 🧩 Returning Multiple Values

Sometimes you need to return more than one thing from recursion:

```csharp
// Example: Check if balanced AND get height
public bool IsBalanced(TreeNode root)
{
    (bool balanced, int height) Check(TreeNode node)
    {
        if (node == null)
            return (true, 0);
        
        var (leftBalanced, leftHeight) = Check(node.Left);
        var (rightBalanced, rightHeight) = Check(node.Right);
        
        bool balanced = leftBalanced && 
                       rightBalanced && 
                       Math.Abs(leftHeight - rightHeight) <= 1;
        
        int height = 1 + Math.Max(leftHeight, rightHeight);
        
        return (balanced, height);
    }
    
    return Check(root).balanced;
}

// Example: Find diameter AND height together
public (int diameter, int height) DiameterAndHeight(TreeNode node)
{
    // Returns (diameter, height) tuple
    if (node == null)
        return (0, 0);
    
    var (leftD, leftH) = DiameterAndHeight(node.Left);
    var (rightD, rightH) = DiameterAndHeight(node.Right);
    
    // Diameter through this node
    int throughCurrent = leftH + rightH;
    
    int diameter = Math.Max(Math.Max(leftD, rightD), throughCurrent);
    int height = 1 + Math.Max(leftH, rightH);
    
    return (diameter, height);
}

// Example: Min and Max of tree in one pass
public (int min, int max) MinMax(TreeNode node)
{
    // Returns (min_val, max_val)
    if (node == null)
        return (int.MaxValue, int.MinValue);
    
    var (leftMin, leftMax) = MinMax(node.Left);
    var (rightMin, rightMax) = MinMax(node.Right);
    
    int currentMin = Math.Min(node.Val, Math.Min(leftMin, rightMin));
    int currentMax = Math.Max(node.Val, Math.Max(leftMax, rightMax));
    
    return (currentMin, currentMax);
}
```

---

## 🎓 Classic Problem Breakdowns

### Problem: Maximum Depth
```csharp
public int MaxDepth(TreeNode root)
{
    // Base case: empty tree has depth 0
    if (root == null) return 0;
    
    // Recursive case: 1 + max of children's depths
    return 1 + Math.Max(MaxDepth(root.Left), MaxDepth(root.Right));
}

// Think about it:
// - What's the depth of an empty tree? → 0
// - What's the depth of current node? → 1 + max(left, right)
```

### Problem: Validate BST
```csharp
public bool IsValidBst(TreeNode root, long minVal = long.MinValue, long maxVal = long.MaxValue)
{
    // Base case: empty tree is valid
    if (root == null) return true;
    
    // Current node must be within range
    if (root.Val <= minVal || root.Val >= maxVal)
        return false;
    
    // Recursively validate with updated ranges
    return IsValidBst(root.Left, minVal, root.Val) && 
           IsValidBst(root.Right, root.Val, maxVal);
}

// Think about it:
// - Pass constraints DOWN to children
// - Left child must be < current
// - Right child must be > current
```

### Problem: Lowest Common Ancestor
```csharp
public TreeNode Lca(TreeNode root, TreeNode p, TreeNode q)
{
    // Base case
    if (root == null || root == p || root == q)
        return root;
    
    // Search in subtrees
    var left = Lca(root.Left, p, q);
    var right = Lca(root.Right, p, q);
    
    // If both sides found something, current is LCA
    if (left != null && right != null)
        return root;
    
    // Otherwise, return whichever side found something
    return left ?? right;
}

// Think about it:
// - If we found p or q, report it up
// - If both subtrees reported something, we're the LCA
// - Otherwise, pass up what we found
```

### Problem: Serialize Tree
```csharp
public string Serialize(TreeNode root)
{
    if (root == null) return "null";
    
    // Preorder: root, left, right
    return $"{root.Val},{Serialize(root.Left)},{Serialize(root.Right)}";
}

public TreeNode Deserialize(string data)
{
    var values = new Queue<string>(data.Split(','));
    
    TreeNode Build()
    {
        string val = values.Dequeue();
        if (val == "null")
            return null;
        
        var node = new TreeNode(int.Parse(val));
        node.Left = Build();
        node.Right = Build();
        return node;
    }
    
    return Build();
}

// Think about it:
// - Preorder visits root first → perfect for reconstruction
// - null markers preserve structure
```

---

## 🔧 Debugging Tree Recursion

### Print Statement Technique
```csharp
public int DebugHeight(TreeNode node, int depth = 0)
{
    string indent = new string(' ', depth * 2);
    
    if (node == null)
    {
        Console.WriteLine($"{indent}null → 0");
        return 0;
    }
    
    Console.WriteLine($"{indent}Entering node {node.Val}");
    
    int leftH = DebugHeight(node.Left, depth + 1);
    int rightH = DebugHeight(node.Right, depth + 1);
    
    int result = 1 + Math.Max(leftH, rightH);
    Console.WriteLine($"{indent}Node {node.Val} → height {result}");
    
    return result;
}
```

### Visualization
```csharp
public void PrintTree(TreeNode node, int level = 0, string prefix = "Root: ")
{
    if (node != null)
    {
        Console.WriteLine(new string(' ', level * 4) + prefix + node.Val);
        if (node.Left != null || node.Right != null)
        {
            if (node.Left != null)
                PrintTree(node.Left, level + 1, "L--- ");
            else
                Console.WriteLine(new string(' ', (level + 1) * 4) + "L--- null");
            
            if (node.Right != null)
                PrintTree(node.Right, level + 1, "R--- ");
            else
                Console.WriteLine(new string(' ', (level + 1) * 4) + "R--- null");
        }
    }
}
```

---

## 🎯 Recursion Cheat Sheet

| Pattern | When to Use | Key Insight |
|---------|-------------|-------------|
| **Bottom-Up** | Need child info first | Postorder, combine results |
| **Top-Down** | Pass info to children | Preorder, carry state down |
| **Global State** | Find global optimum | Side effects, external variable |
| **Parallel** | Compare/combine trees | Process same positions together |

### Questions to Ask Yourself:

1. **What's the base case?** (Usually `if (node == null)`)
2. **What do I need from children?** (Determines recursion)
3. **How do I combine?** (The core logic)
4. **Do I need to pass info down?** (Top-down vs bottom-up)
5. **Am I tracking a global value?** (Need external state)

---

## 🔥 Practice These Problems

Start simple, build up:

| Level | Problems | Pattern |
|-------|----------|---------|
| **Easy** | Max Depth, Sum of Tree, Count Nodes | Bottom-up |
| **Easy** | Same Tree, Symmetric | Parallel |
| **Medium** | Path Sum, Validate BST | Top-down |
| **Medium** | Diameter, Balanced Tree | Global state |
| **Medium** | LCA, Build Tree | Combined |
| **Hard** | Max Path Sum, Serialize | Advanced |

---

## 💡 Final Tips

1. **Start with the base case** - What happens with null/empty?
2. **Trust the recursion** - Assume children give correct answers
3. **Focus on ONE node** - What should current node do?
4. **Draw it out** - Visualize for small examples
5. **Check return type** - What are you returning to parent?

Remember: **If you understand the pattern deeply, most tree problems become easy!** 🚀
