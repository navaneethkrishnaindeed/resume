# 🌳 3. Depth First Search (DFS) Traversals

DFS explores as deep as possible before backtracking. Three main orders: **Inorder**, **Preorder**, **Postorder**.

## Visual Reference

```
        1
       / \
      2   3
     / \
    4   5

Inorder (L-Root-R):   4 → 2 → 5 → 1 → 3
Preorder (Root-L-R):  1 → 2 → 4 → 5 → 3
Postorder (L-R-Root): 4 → 5 → 2 → 3 → 1
```

---

## 📌 Inorder Traversal (Left → Root → Right)

> **Use Case**: BST gives sorted order!

```csharp
// Recursive (Most intuitive)
public IList<int> InorderRecursive(TreeNode root)
{
    // LeetCode 94: Binary Tree Inorder Traversal
    // Time: O(n), Space: O(h)
    var result = new List<int>();
    
    void Traverse(TreeNode node)
    {
        if (node == null) return;
        
        Traverse(node.Left);      // L
        result.Add(node.Val);     // Root
        Traverse(node.Right);     // R
    }
    
    Traverse(root);
    return result;
}

// Iterative with Stack (Common interview question!)
public IList<int> InorderIterative(TreeNode root)
{
    // Iterative approach using explicit stack
    // Key insight: Go left as far as possible, then process and go right
    var result = new List<int>();
    var stack = new Stack<TreeNode>();
    var current = root;
    
    while (current != null || stack.Count > 0)
    {
        // Go left as far as possible
        while (current != null)
        {
            stack.Push(current);
            current = current.Left;
        }
        
        // Process current node
        current = stack.Pop();
        result.Add(current.Val);
        
        // Move to right subtree
        current = current.Right;
    }
    
    return result;
}

// Morris Traversal (O(1) space!) - Advanced
public IList<int> InorderMorris(TreeNode root)
{
    // Morris Inorder - O(1) space using threaded tree
    // Modifies tree temporarily but restores it
    var result = new List<int>();
    var current = root;
    
    while (current != null)
    {
        if (current.Left == null)
        {
            // No left child - visit and go right
            result.Add(current.Val);
            current = current.Right;
        }
        else
        {
            // Find inorder predecessor
            var predecessor = current.Left;
            while (predecessor.Right != null && predecessor.Right != current)
                predecessor = predecessor.Right;
            
            if (predecessor.Right == null)
            {
                // Create thread
                predecessor.Right = current;
                current = current.Left;
            }
            else
            {
                // Thread exists - visit and remove thread
                predecessor.Right = null;
                result.Add(current.Val);
                current = current.Right;
            }
        }
    }
    
    return result;
}
```

**Why Inorder is important for BST:**
```csharp
// For BST, inorder gives SORTED sequence
//       5
//      / \
//     3   7
//    / \ / \
//   2  4 6  8
// Inorder: [2, 3, 4, 5, 6, 7, 8] ← Sorted!
```

---

## 📌 Preorder Traversal (Root → Left → Right)

> **Use Case**: Create copy of tree, prefix expression, serialize tree

```csharp
// Recursive
public IList<int> PreorderRecursive(TreeNode root)
{
    // LeetCode 144: Binary Tree Preorder Traversal
    var result = new List<int>();
    
    void Traverse(TreeNode node)
    {
        if (node == null) return;
        
        result.Add(node.Val);     // Root (visit first!)
        Traverse(node.Left);      // L
        Traverse(node.Right);     // R
    }
    
    Traverse(root);
    return result;
}

// Iterative with Stack
public IList<int> PreorderIterative(TreeNode root)
{
    // Simpler than inorder - just use stack
    // Push right first so left is processed first
    if (root == null) return new List<int>();
    
    var result = new List<int>();
    var stack = new Stack<TreeNode>();
    stack.Push(root);
    
    while (stack.Count > 0)
    {
        var node = stack.Pop();
        result.Add(node.Val);
        
        // Push right first (LIFO - so left processed first)
        if (node.Right != null) stack.Push(node.Right);
        if (node.Left != null) stack.Push(node.Left);
    }
    
    return result;
}

// Morris Preorder - O(1) space
public IList<int> PreorderMorris(TreeNode root)
{
    // Morris Preorder Traversal
    var result = new List<int>();
    var current = root;
    
    while (current != null)
    {
        if (current.Left == null)
        {
            result.Add(current.Val);
            current = current.Right;
        }
        else
        {
            var predecessor = current.Left;
            while (predecessor.Right != null && predecessor.Right != current)
                predecessor = predecessor.Right;
            
            if (predecessor.Right == null)
            {
                result.Add(current.Val);  // Visit before going left
                predecessor.Right = current;
                current = current.Left;
            }
            else
            {
                predecessor.Right = null;
                current = current.Right;
            }
        }
    }
    
    return result;
}
```

---

## 📌 Postorder Traversal (Left → Right → Root)

> **Use Case**: Delete tree, postfix expression, calculate folder size

```csharp
// Recursive
public IList<int> PostorderRecursive(TreeNode root)
{
    // LeetCode 145: Binary Tree Postorder Traversal
    var result = new List<int>();
    
    void Traverse(TreeNode node)
    {
        if (node == null) return;
        
        Traverse(node.Left);       // L
        Traverse(node.Right);      // R
        result.Add(node.Val);      // Root (visit last!)
    }
    
    Traverse(root);
    return result;
}

// Iterative - Tricky! (Modified preorder + reverse)
public IList<int> PostorderIterative(TreeNode root)
{
    // Trick: Postorder = Reverse of (Root → Right → Left)
    if (root == null) return new List<int>();
    
    var result = new List<int>();
    var stack = new Stack<TreeNode>();
    stack.Push(root);
    
    while (stack.Count > 0)
    {
        var node = stack.Pop();
        result.Add(node.Val);
        
        // Push left first (opposite of preorder)
        if (node.Left != null) stack.Push(node.Left);
        if (node.Right != null) stack.Push(node.Right);
    }
    
    result.Reverse();  // Reverse at end
    return result;
}

// Iterative - Two Stack Method
public IList<int> PostorderTwoStacks(TreeNode root)
{
    // More intuitive two-stack approach
    if (root == null) return new List<int>();
    
    var stack1 = new Stack<TreeNode>();
    var stack2 = new Stack<int>();
    stack1.Push(root);
    
    while (stack1.Count > 0)
    {
        var node = stack1.Pop();
        stack2.Push(node.Val);
        
        if (node.Left != null) stack1.Push(node.Left);
        if (node.Right != null) stack1.Push(node.Right);
    }
    
    return stack2.ToList();
}

// Iterative - Single Stack with Visited Flag
public IList<int> PostorderSingleStack(TreeNode root)
{
    // Single stack tracking visited state
    if (root == null) return new List<int>();
    
    var result = new List<int>();
    var stack = new Stack<(TreeNode node, bool visited)>();
    stack.Push((root, false));
    
    while (stack.Count > 0)
    {
        var (node, visited) = stack.Pop();
        
        if (visited)
        {
            result.Add(node.Val);
        }
        else
        {
            // Push in reverse order: Root, Right, Left
            stack.Push((node, true));  // Visit later
            if (node.Right != null) stack.Push((node.Right, false));
            if (node.Left != null) stack.Push((node.Left, false));
        }
    }
    
    return result;
}
```

---

## 📌 Build Tree from Inorder + Preorder ⭐

```csharp
public TreeNode BuildTreePreorderInorder(int[] preorder, int[] inorder)
{
    // LeetCode 105: Construct Binary Tree from Preorder and Inorder
    // Key insight:
    // - First element of preorder is root
    // - Find root in inorder to split left/right subtrees
    
    if (preorder == null || preorder.Length == 0) return null;
    
    // Create hashmap for O(1) lookup in inorder
    var inorderMap = new Dictionary<int, int>();
    for (int i = 0; i < inorder.Length; i++)
        inorderMap[inorder[i]] = i;
    
    TreeNode Build(int preStart, int preEnd, int inStart, int inEnd)
    {
        if (preStart > preEnd) return null;
        
        // Root is first element of preorder
        int rootVal = preorder[preStart];
        var root = new TreeNode(rootVal);
        
        // Find root position in inorder
        int rootIdx = inorderMap[rootVal];
        
        // Calculate left subtree size
        int leftSize = rootIdx - inStart;
        
        // Build subtrees
        root.Left = Build(preStart + 1, preStart + leftSize, 
                         inStart, rootIdx - 1);
        root.Right = Build(preStart + leftSize + 1, preEnd, 
                          rootIdx + 1, inEnd);
        
        return root;
    }
    
    return Build(0, preorder.Length - 1, 0, inorder.Length - 1);
}

// Simpler version (less efficient but clearer)
public TreeNode BuildTreeSimple(int[] preorder, int[] inorder)
{
    // Simpler but O(n²) due to array operations
    if (preorder == null || preorder.Length == 0) return null;
    
    int rootVal = preorder[0];
    var root = new TreeNode(rootVal);
    
    int rootIdx = Array.IndexOf(inorder, rootVal);
    
    root.Left = BuildTreeSimple(
        preorder.Skip(1).Take(rootIdx).ToArray(),
        inorder.Take(rootIdx).ToArray());
    
    root.Right = BuildTreeSimple(
        preorder.Skip(rootIdx + 1).ToArray(),
        inorder.Skip(rootIdx + 1).ToArray());
    
    return root;
}

// Example:
// preorder = [3, 9, 20, 15, 7]
// inorder = [9, 3, 15, 20, 7]
//
// Tree:
//       3
//      / \
//     9  20
//        / \
//       15  7
```

---

## 📌 Build Tree from Inorder + Postorder ⭐

```csharp
public TreeNode BuildTreePostorderInorder(int[] inorder, int[] postorder)
{
    // LeetCode 106: Construct Binary Tree from Inorder and Postorder
    // Key insight:
    // - Last element of postorder is root
    // - Find root in inorder to split left/right subtrees
    
    if (inorder == null || inorder.Length == 0) return null;
    
    var inorderMap = new Dictionary<int, int>();
    for (int i = 0; i < inorder.Length; i++)
        inorderMap[inorder[i]] = i;
    
    TreeNode Build(int inStart, int inEnd, int postStart, int postEnd)
    {
        if (inStart > inEnd) return null;
        
        // Root is last element of postorder
        int rootVal = postorder[postEnd];
        var root = new TreeNode(rootVal);
        
        // Find root position in inorder
        int rootIdx = inorderMap[rootVal];
        
        // Calculate sizes
        int leftSize = rootIdx - inStart;
        
        // Build subtrees
        root.Left = Build(inStart, rootIdx - 1, 
                         postStart, postStart + leftSize - 1);
        root.Right = Build(rootIdx + 1, inEnd, 
                          postStart + leftSize, postEnd - 1);
        
        return root;
    }
    
    return Build(0, inorder.Length - 1, 0, postorder.Length - 1);
}

// Example:
// inorder = [9, 3, 15, 20, 7]
// postorder = [9, 15, 7, 20, 3]
//
// Tree:
//       3
//      / \
//     9  20
//        / \
//       15  7
```

---

## 📌 Return Traversal as List (All Variations)

```csharp
public class TraversalResult
{
    public List<int> Inorder { get; set; } = new();
    public List<int> Preorder { get; set; } = new();
    public List<int> Postorder { get; set; } = new();
}

public TraversalResult AllTraversals(TreeNode root)
{
    // Return all three traversals
    var result = new TraversalResult();
    
    void Traverse(TreeNode node)
    {
        if (node == null) return;
        
        result.Preorder.Add(node.Val);    // Pre: Root first
        Traverse(node.Left);
        result.Inorder.Add(node.Val);     // In: Root middle
        Traverse(node.Right);
        result.Postorder.Add(node.Val);   // Post: Root last
    }
    
    Traverse(root);
    return result;
}

// Using IEnumerable (memory efficient)
public IEnumerable<int> InorderGenerator(TreeNode root)
{
    // Yield values in inorder
    if (root != null)
    {
        foreach (var val in InorderGenerator(root.Left))
            yield return val;
        yield return root.Val;
        foreach (var val in InorderGenerator(root.Right))
            yield return val;
    }
}

// Example usage
foreach (int val in InorderGenerator(root))
{
    Console.WriteLine(val);
}
```

---

## 🎯 DFS Traversal Summary

| Traversal | Order | Use Case | Iterative Trick |
|-----------|-------|----------|-----------------|
| **Inorder** | L → Root → R | BST sorted order | Go left, then right |
| **Preorder** | Root → L → R | Copy tree, serialize | Push right then left |
| **Postorder** | L → R → Root | Delete tree, calc size | Reverse of modified preorder |

---

## 🔥 Key Interview Patterns

### Pattern 1: Passing Information Down (Preorder style)
```csharp
public void PathFromRoot(TreeNode root, string path = "")
{
    // Track path from root to each node
    if (root == null) return;
    
    string currentPath = path + root.Val.ToString();
    
    if (root.Left == null && root.Right == null)
    {
        Console.WriteLine($"Path to leaf: {currentPath}");
        return;
    }
    
    PathFromRoot(root.Left, currentPath + "->");
    PathFromRoot(root.Right, currentPath + "->");
}
```

### Pattern 2: Collecting Information Up (Postorder style)
```csharp
public int SumOfSubtree(TreeNode root)
{
    // Calculate sum including current node
    if (root == null) return 0;
    
    int leftSum = SumOfSubtree(root.Left);
    int rightSum = SumOfSubtree(root.Right);
    
    return root.Val + leftSum + rightSum;
}
```

### Pattern 3: In-between Processing (Inorder style)
```csharp
public int? KthSmallestBst(TreeNode root, int k)
{
    // Find kth smallest using inorder
    int count = 0;
    int? result = null;
    
    void Inorder(TreeNode node)
    {
        if (node == null || result != null) return;
        
        Inorder(node.Left);
        
        count++;
        if (count == k)
        {
            result = node.Val;
            return;
        }
        
        Inorder(node.Right);
    }
    
    Inorder(root);
    return result;
}
```

---

## 🔥 Practice Problems

| Problem | LeetCode | Traversal Type |
|---------|----------|---------------|
| Inorder Traversal | 94 | Inorder |
| Preorder Traversal | 144 | Preorder |
| Postorder Traversal | 145 | Postorder |
| Build Tree (Pre+In) | 105 | Preorder + Inorder |
| Build Tree (Post+In) | 106 | Postorder + Inorder |
| Kth Smallest in BST | 230 | Inorder |
| Flatten to Linked List | 114 | Preorder |
| Binary Tree Paths | 257 | Preorder |
