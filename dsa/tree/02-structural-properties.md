# 🌳 2. Structural Properties Questions

## Common Tree Node Definition

```csharp
public class TreeNode
{
    public int Val;
    public TreeNode Left;
    public TreeNode Right;
    
    public TreeNode(int val = 0, TreeNode left = null, TreeNode right = null)
    {
        Val = val;
        Left = left;
        Right = right;
    }
}
```

---

## 📌 Find Height of a Tree

> **Height**: Number of edges on the longest path from root to leaf.

```csharp
public int Height(TreeNode root)
{
    // Returns height of tree (number of edges)
    // Empty tree: -1, Single node: 0
    if (root == null) return -1;
    
    int leftHeight = Height(root.Left);
    int rightHeight = Height(root.Right);
    
    return 1 + Math.Max(leftHeight, rightHeight);
}

// Alternative: Height as number of nodes
public int HeightNodes(TreeNode root)
{
    // Returns height as number of nodes
    // Empty tree: 0, Single node: 1
    if (root == null) return 0;
    
    return 1 + Math.Max(HeightNodes(root.Left), HeightNodes(root.Right));
}

// Example:
//       1
//      / \
//     2   3
//    /
//   4
// Height(root) = 2 (edges)
// HeightNodes(root) = 3 (nodes)
```

**Time**: O(n) | **Space**: O(h) recursion stack

---

## 📌 Find Maximum Depth

> **Max Depth**: Same as height (number of nodes from root to deepest leaf).

```csharp
public int MaxDepth(TreeNode root)
{
    // LeetCode 104: Maximum Depth of Binary Tree
    // Returns maximum depth (number of nodes on longest path)
    if (root == null) return 0;
    
    int leftDepth = MaxDepth(root.Left);
    int rightDepth = MaxDepth(root.Right);
    
    return 1 + Math.Max(leftDepth, rightDepth);
}

// Iterative BFS approach
public int MaxDepthBfs(TreeNode root)
{
    // Max depth using level order traversal
    if (root == null) return 0;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    int depth = 0;
    
    while (queue.Count > 0)
    {
        depth++;
        int levelSize = queue.Count;
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
    }
    
    return depth;
}
```

---

## 📌 Find Minimum Depth

> **Min Depth**: Shortest path from root to a LEAF node.

```csharp
public int MinDepth(TreeNode root)
{
    // LeetCode 111: Minimum Depth of Binary Tree
    // ⚠️ Careful: Must reach a LEAF node, not just null
    if (root == null) return 0;
    
    // If leaf node
    if (root.Left == null && root.Right == null)
        return 1;
    
    // If no left child, must go right
    if (root.Left == null)
        return 1 + MinDepth(root.Right);
    
    // If no right child, must go left
    if (root.Right == null)
        return 1 + MinDepth(root.Left);
    
    // Both children exist
    return 1 + Math.Min(MinDepth(root.Left), MinDepth(root.Right));
}

// BFS approach (more efficient - stops at first leaf)
public int MinDepthBfs(TreeNode root)
{
    // BFS finds minimum depth faster
    if (root == null) return 0;
    
    var queue = new Queue<(TreeNode node, int depth)>();
    queue.Enqueue((root, 1));
    
    while (queue.Count > 0)
    {
        var (node, depth) = queue.Dequeue();
        
        // First leaf found = minimum depth
        if (node.Left == null && node.Right == null)
            return depth;
        
        if (node.Left != null)
            queue.Enqueue((node.Left, depth + 1));
        if (node.Right != null)
            queue.Enqueue((node.Right, depth + 1));
    }
    
    return 0;
}

// Example:
//       1
//      / \
//     2   3      <- 3 is a leaf at depth 2
//    /
//   4
// MinDepth = 2 (path: 1 -> 3)
```

**⚠️ Common Mistake**: Not handling cases where one child is null!

---

## 📌 Count Total Number of Nodes

```csharp
public int CountNodes(TreeNode root)
{
    // Count total nodes in tree - O(n)
    if (root == null) return 0;
    
    return 1 + CountNodes(root.Left) + CountNodes(root.Right);
}

// Optimized for Complete Binary Tree
public int CountNodesComplete(TreeNode root)
{
    // LeetCode 222: For complete binary tree - O(log²n)
    if (root == null) return 0;
    
    int leftHeight = GetLeftHeight(root);
    int rightHeight = GetRightHeight(root);
    
    if (leftHeight == rightHeight)
    {
        // Perfect tree: 2^h - 1 nodes
        return (1 << leftHeight) - 1;
    }
    else
    {
        // Recurse on subtrees
        return 1 + CountNodesComplete(root.Left) + CountNodesComplete(root.Right);
    }
}

private int GetLeftHeight(TreeNode node)
{
    // Get height going only left
    int height = 0;
    while (node != null)
    {
        height++;
        node = node.Left;
    }
    return height;
}

private int GetRightHeight(TreeNode node)
{
    // Get height going only right
    int height = 0;
    while (node != null)
    {
        height++;
        node = node.Right;
    }
    return height;
}
```

---

## 📌 Count Leaf Nodes

```csharp
public int CountLeaves(TreeNode root)
{
    // Count nodes with no children
    if (root == null) return 0;
    
    // Leaf node
    if (root.Left == null && root.Right == null)
        return 1;
    
    return CountLeaves(root.Left) + CountLeaves(root.Right);
}

// Using yield return (memory efficient)
public IEnumerable<int> GetLeaves(TreeNode root)
{
    // Generator yielding all leaf values
    if (root == null) yield break;
    
    if (root.Left == null && root.Right == null)
    {
        yield return root.Val;
        yield break;
    }
    
    foreach (var leaf in GetLeaves(root.Left))
        yield return leaf;
    foreach (var leaf in GetLeaves(root.Right))
        yield return leaf;
}

// Example usage
var leaves = GetLeaves(root).ToList();
int leafCount = leaves.Count;
```

---

## 📌 Count Internal Nodes

> **Internal Node**: A node that is NOT a leaf (has at least one child).

```csharp
public int CountInternalNodes(TreeNode root)
{
    // Count non-leaf nodes
    if (root == null) return 0;
    
    // Leaf node - not internal
    if (root.Left == null && root.Right == null)
        return 0;
    
    // Internal node + recurse
    return 1 + CountInternalNodes(root.Left) + CountInternalNodes(root.Right);
}

// Alternative: Total - Leaves
public int CountInternalAlternative(TreeNode root)
{
    return CountNodes(root) - CountLeaves(root);
}
```

---

## 📌 Find Diameter of Tree ⭐

> **Diameter**: The longest path between any two nodes (may or may not pass through root).

```csharp
public int Diameter(TreeNode root)
{
    // LeetCode 543: Diameter of Binary Tree
    // Returns number of EDGES in longest path
    int maxDiameter = 0;
    
    int Height(TreeNode node)
    {
        if (node == null) return 0;
        
        int leftHeight = Height(node.Left);
        int rightHeight = Height(node.Right);
        
        // Diameter through this node = left + right heights
        maxDiameter = Math.Max(maxDiameter, leftHeight + rightHeight);
        
        return 1 + Math.Max(leftHeight, rightHeight);
    }
    
    Height(root);
    return maxDiameter;
}

// Alternative: Return both diameter and height
public (int diameter, int height) DiameterV2(TreeNode root)
{
    // Returns (diameter, height) tuple
    if (root == null) return (0, 0);
    
    var (leftD, leftH) = DiameterV2(root.Left);
    var (rightD, rightH) = DiameterV2(root.Right);
    
    // Current diameter = max of:
    // 1. Diameter of left subtree
    // 2. Diameter of right subtree
    // 3. Path through current node
    int currentDiameter = Math.Max(Math.Max(leftD, rightD), leftH + rightH);
    int currentHeight = 1 + Math.Max(leftH, rightH);
    
    return (currentDiameter, currentHeight);
}

// Example:
//       1
//      / \
//     2   3
//    / \
//   4   5
// Diameter = 3 (path: 4 -> 2 -> 1 -> 3 or 5 -> 2 -> 1 -> 3)
```

**Time**: O(n) | **Space**: O(h)

---

## 📌 Check if Tree is Balanced ⭐

> **Balanced**: Height difference between left and right subtrees is at most 1 for EVERY node.

```csharp
public bool IsBalanced(TreeNode root)
{
    // LeetCode 110: Balanced Binary Tree
    // O(n) solution - check balance while computing height
    return CheckHeight(root) != -1;
}

private int CheckHeight(TreeNode node)
{
    // Returns height if balanced, -1 if unbalanced
    if (node == null) return 0;
    
    int leftHeight = CheckHeight(node.Left);
    if (leftHeight == -1) return -1;  // Left subtree unbalanced
    
    int rightHeight = CheckHeight(node.Right);
    if (rightHeight == -1) return -1;  // Right subtree unbalanced
    
    // Check current node balance
    if (Math.Abs(leftHeight - rightHeight) > 1)
        return -1;  // Current node unbalanced
    
    return 1 + Math.Max(leftHeight, rightHeight);
}

// Alternative: More readable but O(n²)
public bool IsBalancedSimple(TreeNode root)
{
    // Simpler but less efficient O(n²)
    if (root == null) return true;
    
    int leftHeight = HeightNodes(root.Left);
    int rightHeight = HeightNodes(root.Right);
    
    if (Math.Abs(leftHeight - rightHeight) > 1)
        return false;
    
    return IsBalancedSimple(root.Left) && IsBalancedSimple(root.Right);
}
```

---

## 📌 Check if Tree is Complete

> **Complete Binary Tree**: All levels filled except possibly last, which is filled left to right.

```csharp
public bool IsComplete(TreeNode root)
{
    // LeetCode 958: Check if Binary Tree is Complete
    // Use BFS - once we see a null, no more nodes should appear
    if (root == null) return true;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    bool seenNull = false;
    
    while (queue.Count > 0)
    {
        var node = queue.Dequeue();
        
        if (node == null)
        {
            seenNull = true;
        }
        else
        {
            // If we've seen null before, tree is not complete
            if (seenNull) return false;
            
            queue.Enqueue(node.Left);
            queue.Enqueue(node.Right);
        }
    }
    
    return true;
}

// Example of Complete Tree:
//       1
//      / \
//     2   3
//    / \
//   4   5
// ✅ Complete

// Example of NOT Complete:
//       1
//      / \
//     2   3
//      \
//       5
// ❌ Not complete (5 should be left child)
```

---

## 📌 Check if Tree is Full

> **Full Binary Tree**: Every node has 0 or 2 children (no node has exactly 1 child).

```csharp
public bool IsFull(TreeNode root)
{
    // Check if every node has 0 or 2 children
    if (root == null) return true;
    
    // Leaf node - OK
    if (root.Left == null && root.Right == null)
        return true;
    
    // Has exactly one child - NOT full
    if (root.Left == null || root.Right == null)
        return false;
    
    // Has both children - check subtrees
    return IsFull(root.Left) && IsFull(root.Right);
}

// Example of Full Tree:
//       1
//      / \
//     2   3
//    / \
//   4   5
// ✅ Full (all nodes have 0 or 2 children)

// Example of NOT Full:
//       1
//      / \
//     2   3
//    /
//   4
// ❌ Not full (node 2 has only 1 child)
```

---

## 📌 Check if Tree is Perfect

> **Perfect Binary Tree**: All internal nodes have 2 children AND all leaves are at same level.

```csharp
public bool IsPerfect(TreeNode root)
{
    // Perfect = Full + Complete + All leaves at same level
    // For perfect tree with height h: nodes = 2^(h+1) - 1
    if (root == null) return true;
    
    int depth = GetDepth(root);
    return CheckPerfect(root, depth, 1);
}

private int GetDepth(TreeNode node)
{
    // Get depth of leftmost leaf
    int depth = 0;
    while (node != null)
    {
        depth++;
        node = node.Left;
    }
    return depth;
}

private bool CheckPerfect(TreeNode node, int depth, int level)
{
    if (node == null) return true;
    
    // Leaf node must be at expected depth
    if (node.Left == null && node.Right == null)
        return depth == level;
    
    // Internal node must have both children
    if (node.Left == null || node.Right == null)
        return false;
    
    return CheckPerfect(node.Left, depth, level + 1) && 
           CheckPerfect(node.Right, depth, level + 1);
}

// Alternative: Using node count
public bool IsPerfectV2(TreeNode root)
{
    // Perfect tree has 2^h - 1 nodes where h is height (counting nodes)
    int h = HeightNodes(root);
    int n = CountNodes(root);
    return n == (1 << h) - 1;  // 2^h - 1
}

// Example of Perfect Tree:
//        1
//       / \
//      2   3
//     / \ / \
//    4  5 6  7
// ✅ Perfect (7 nodes = 2³ - 1)
```

---

## 🎯 Summary Comparison Table

| Property | Definition | Key Check |
|----------|------------|-----------|
| **Balanced** | Height diff ≤ 1 at every node | DFS, check heights |
| **Complete** | All levels full except last (left-filled) | BFS, no node after null |
| **Full** | Every node has 0 or 2 children | DFS, check child count |
| **Perfect** | Full + all leaves same level | Full + count = 2^h - 1 |

```
Perfect ⊂ Complete ⊂ Trees
Perfect ⊂ Full ⊂ Trees
```

---

## 🔥 Practice Problems

| Problem | LeetCode | Key Technique |
|---------|----------|---------------|
| Maximum Depth | 104 | DFS recursion |
| Minimum Depth | 111 | BFS or careful DFS |
| Balanced Tree | 110 | DFS with height |
| Diameter | 543 | DFS, track max path |
| Count Complete Tree Nodes | 222 | Optimized O(log²n) |
| Check Complete Tree | 958 | BFS level order |
