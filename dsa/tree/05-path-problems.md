# 🌳 5. Path Based Problems

Path problems are **very common** in interviews. Master these patterns!

## Types of Paths

```
        1
       / \
      2   3
     / \
    4   5

Root-to-Leaf paths:
- 1 → 2 → 4
- 1 → 2 → 5
- 1 → 3

Any-to-Any path (for diameter, max path sum):
- 4 → 2 → 1 → 3
- 4 → 2 → 5
```

---

## 📌 Root to Leaf Paths ⭐

```csharp
public IList<string> BinaryTreePaths(TreeNode root)
{
    // LeetCode 257: Binary Tree Paths
    // Return all root-to-leaf paths as strings
    var result = new List<string>();
    
    if (root == null) return result;
    
    void Dfs(TreeNode node, List<int> path)
    {
        if (node == null) return;
        
        // Add current node to path
        path.Add(node.Val);
        
        // If leaf, add path to result
        if (node.Left == null && node.Right == null)
        {
            result.Add(string.Join("->", path));
        }
        else
        {
            Dfs(node.Left, path);
            Dfs(node.Right, path);
        }
        
        // Backtrack
        path.RemoveAt(path.Count - 1);
    }
    
    Dfs(root, new List<int>());
    return result;
}

// Alternative: Pass string (no explicit backtracking)
public IList<string> BinaryTreePathsV2(TreeNode root)
{
    // String concatenation approach
    var result = new List<string>();
    
    if (root == null) return result;
    
    void Dfs(TreeNode node, string currentPath)
    {
        if (node.Left == null && node.Right == null)
        {
            result.Add(currentPath + node.Val);
            return;
        }
        
        if (node.Left != null)
            Dfs(node.Left, currentPath + node.Val + "->");
        if (node.Right != null)
            Dfs(node.Right, currentPath + node.Val + "->");
    }
    
    Dfs(root, "");
    return result;
}

// Example:
//       1
//      / \
//     2   3
//      \
//       5
// Output: ["1->2->5", "1->3"]
```

---

## 📌 Path Sum (Exact Target) ⭐

```csharp
public bool HasPathSum(TreeNode root, int targetSum)
{
    // LeetCode 112: Path Sum
    // Check if any root-to-leaf path sums to target
    if (root == null) return false;
    
    // If leaf and remaining sum equals node value
    if (root.Left == null && root.Right == null)
        return root.Val == targetSum;
    
    // Recurse with reduced target
    int remaining = targetSum - root.Val;
    return HasPathSum(root.Left, remaining) || 
           HasPathSum(root.Right, remaining);
}

// Iterative with stack
public bool HasPathSumIterative(TreeNode root, int targetSum)
{
    // Stack approach: (node, remaining_sum)
    if (root == null) return false;
    
    var stack = new Stack<(TreeNode node, int remaining)>();
    stack.Push((root, targetSum - root.Val));
    
    while (stack.Count > 0)
    {
        var (node, remaining) = stack.Pop();
        
        // Check if leaf with exact sum
        if (node.Left == null && node.Right == null && remaining == 0)
            return true;
        
        if (node.Right != null)
            stack.Push((node.Right, remaining - node.Right.Val));
        if (node.Left != null)
            stack.Push((node.Left, remaining - node.Left.Val));
    }
    
    return false;
}

// Example:
//       5
//      / \
//     4   8
//    /   / \
//   11  13  4
//  /  \      \
// 7    2      1
// target = 22
// Path: 5 → 4 → 11 → 2 = 22 ✅
```

---

## 📌 Path Sum II (Find All Paths) ⭐

```csharp
public IList<IList<int>> PathSumII(TreeNode root, int targetSum)
{
    // LeetCode 113: Path Sum II
    // Return all root-to-leaf paths that sum to target
    var result = new List<IList<int>>();
    
    void Dfs(TreeNode node, int remaining, List<int> path)
    {
        if (node == null) return;
        
        path.Add(node.Val);
        
        // If leaf and path sums to target
        if (node.Left == null && node.Right == null && remaining == node.Val)
        {
            result.Add(new List<int>(path));  // Copy of path!
        }
        else
        {
            Dfs(node.Left, remaining - node.Val, path);
            Dfs(node.Right, remaining - node.Val, path);
        }
        
        path.RemoveAt(path.Count - 1);  // Backtrack
    }
    
    Dfs(root, targetSum, new List<int>());
    return result;
}

// Example:
//       5
//      / \
//     4   8
//    /   / \
//   11  13  4
//  /  \    / \
// 7    2  5   1
// target = 22
// Output: [[5,4,11,2], [5,8,4,5]]
```

---

## 📌 Path Sum III (Any Start/End) ⭐⭐

```csharp
public int PathSumIII(TreeNode root, int targetSum)
{
    // LeetCode 437: Path Sum III
    // Count paths with sum = target (can start/end anywhere)
    // O(n²) brute force
    if (root == null) return 0;
    
    int CountPathsFrom(TreeNode node, long remaining)
    {
        // Count paths starting from this node
        if (node == null) return 0;
        
        int count = 0;
        if (node.Val == remaining) count = 1;
        
        count += CountPathsFrom(node.Left, remaining - node.Val);
        count += CountPathsFrom(node.Right, remaining - node.Val);
        
        return count;
    }
    
    // Try starting from every node
    return CountPathsFrom(root, targetSum) + 
           PathSumIII(root.Left, targetSum) + 
           PathSumIII(root.Right, targetSum);
}

// Optimized O(n) with prefix sum
public int PathSumIIIOptimized(TreeNode root, int targetSum)
{
    // O(n) using prefix sum dictionary
    // Key insight: If prefixSum[j] - prefixSum[i] = target,
    // then path from i to j has sum = target
    var prefixCounts = new Dictionary<long, int> { { 0, 1 } };  // Empty path has sum 0
    
    int Dfs(TreeNode node, long currentSum)
    {
        if (node == null) return 0;
        
        currentSum += node.Val;
        
        // Count paths ending at this node
        int count = prefixCounts.GetValueOrDefault(currentSum - targetSum, 0);
        
        // Add current sum to map
        prefixCounts[currentSum] = prefixCounts.GetValueOrDefault(currentSum, 0) + 1;
        
        // Recurse
        count += Dfs(node.Left, currentSum);
        count += Dfs(node.Right, currentSum);
        
        // Backtrack - remove current sum
        prefixCounts[currentSum]--;
        
        return count;
    }
    
    return Dfs(root, 0);
}
```

---

## 📌 Maximum Path Sum ⭐⭐⭐

```csharp
public int MaxPathSum(TreeNode root)
{
    // LeetCode 124: Binary Tree Maximum Path Sum
    // Path can start and end at ANY node (not just root-to-leaf)
    // Nodes can have NEGATIVE values
    int maxSum = int.MinValue;
    
    int MaxGain(TreeNode node)
    {
        // Returns max contribution of this subtree to parent path
        // Also updates global max for paths through this node
        if (node == null) return 0;
        
        // Max gain from left/right (ignore negative contributions)
        int leftGain = Math.Max(0, MaxGain(node.Left));
        int rightGain = Math.Max(0, MaxGain(node.Right));
        
        // Path through current node (potential new max)
        int pathThroughNode = node.Val + leftGain + rightGain;
        maxSum = Math.Max(maxSum, pathThroughNode);
        
        // Return max gain if continuing to parent
        // Can only go through ONE child to parent
        return node.Val + Math.Max(leftGain, rightGain);
    }
    
    MaxGain(root);
    return maxSum;
}

// Example:
//       -10
//       /  \
//      9   20
//         /  \
//        15   7
//
// Max path: 15 → 20 → 7 = 42
// (even though -10 is root, we don't have to include it)
```

**Key Insight**: 
- When calculating path through node: left + node + right
- When returning to parent: node + max(left, right) (can only pick one direction)

---

## 📌 Lowest Common Ancestor (LCA) ⭐⭐

```csharp
public TreeNode LowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q)
{
    // LeetCode 236: Lowest Common Ancestor of Binary Tree
    // Find the lowest node that has both p and q as descendants
    if (root == null) return null;
    
    // If current node is p or q, it's an ancestor
    if (root == p || root == q) return root;
    
    // Search in left and right subtrees
    var left = LowestCommonAncestor(root.Left, p, q);
    var right = LowestCommonAncestor(root.Right, p, q);
    
    // If both subtrees return non-null, current node is LCA
    if (left != null && right != null) return root;
    
    // Otherwise, LCA is in the non-null subtree
    return left ?? right;
}

// Example:
//         3
//        / \
//       5   1
//      / \ / \
//     6  2 0  8
//       / \
//      7   4
//
// LCA(5, 1) = 3
// LCA(5, 4) = 5 (5 is ancestor of itself)
// LCA(6, 4) = 5
```

---

## 📌 LCA in BST (Optimized)

```csharp
public TreeNode LcaBst(TreeNode root, TreeNode p, TreeNode q)
{
    // LeetCode 235: LCA of Binary Search Tree
    // Use BST property for O(h) solution
    while (root != null)
    {
        if (p.Val < root.Val && q.Val < root.Val)
        {
            // Both in left subtree
            root = root.Left;
        }
        else if (p.Val > root.Val && q.Val > root.Val)
        {
            // Both in right subtree
            root = root.Right;
        }
        else
        {
            // Split point - this is the LCA
            return root;
        }
    }
    
    return null;
}

// Recursive version
public TreeNode LcaBstRecursive(TreeNode root, TreeNode p, TreeNode q)
{
    if (p.Val < root.Val && q.Val < root.Val)
        return LcaBstRecursive(root.Left, p, q);
    else if (p.Val > root.Val && q.Val > root.Val)
        return LcaBstRecursive(root.Right, p, q);
    else
        return root;
}
```

---

## 📌 Distance Between Two Nodes ⭐

```csharp
public int FindDistance(TreeNode root, TreeNode p, TreeNode q)
{
    // Find distance (number of edges) between nodes p and q
    // Distance = depth(p) + depth(q) - 2 * depth(LCA)
    
    // Find LCA
    var lca = LowestCommonAncestor(root, p, q);
    
    // Find distance from LCA to each node
    int GetDistance(TreeNode node, TreeNode target, int distance)
    {
        if (node == null) return -1;
        if (node == target) return distance;
        
        int left = GetDistance(node.Left, target, distance + 1);
        if (left != -1) return left;
        
        return GetDistance(node.Right, target, distance + 1);
    }
    
    return GetDistance(lca, p, 0) + GetDistance(lca, q, 0);
}

// Alternative: Find path and count
public int FindDistanceV2(TreeNode root, int pVal, int qVal)
{
    // Using paths
    bool FindPath(TreeNode node, int target, List<int> path)
    {
        if (node == null) return false;
        
        path.Add(node.Val);
        
        if (node.Val == target) return true;
        
        if (FindPath(node.Left, target, path) || FindPath(node.Right, target, path))
            return true;
        
        path.RemoveAt(path.Count - 1);
        return false;
    }
    
    var pathP = new List<int>();
    var pathQ = new List<int>();
    FindPath(root, pVal, pathP);
    FindPath(root, qVal, pathQ);
    
    // Find where paths diverge (LCA)
    int i = 0;
    while (i < pathP.Count && i < pathQ.Count && pathP[i] == pathQ[i])
        i++;
    
    // Distance = remaining lengths of both paths
    return (pathP.Count - i) + (pathQ.Count - i);
}
```

---

## 📌 Sum of Root to Leaf Numbers

```csharp
public int SumNumbers(TreeNode root)
{
    // LeetCode 129: Sum Root to Leaf Numbers
    // Each path forms a number: 1->2->3 = 123
    int Dfs(TreeNode node, int currentNum)
    {
        if (node == null) return 0;
        
        currentNum = currentNum * 10 + node.Val;
        
        // If leaf, return the number
        if (node.Left == null && node.Right == null)
            return currentNum;
        
        // Sum of all paths through children
        return Dfs(node.Left, currentNum) + Dfs(node.Right, currentNum);
    }
    
    return Dfs(root, 0);
}

// Example:
//       1
//      / \
//     2   3
// Numbers: 12, 13
// Sum: 12 + 13 = 25
```

---

## 📌 Longest Univalue Path

```csharp
public int LongestUnivaluePath(TreeNode root)
{
    // LeetCode 687: Longest Univalue Path
    // Longest path where all nodes have same value
    int maxLength = 0;
    
    int Dfs(TreeNode node)
    {
        if (node == null) return 0;
        
        int leftLength = Dfs(node.Left);
        int rightLength = Dfs(node.Right);
        
        // Extend left path if values match
        int leftPath = 0;
        if (node.Left != null && node.Left.Val == node.Val)
            leftPath = leftLength + 1;
        
        // Extend right path if values match
        int rightPath = 0;
        if (node.Right != null && node.Right.Val == node.Val)
            rightPath = rightLength + 1;
        
        // Update max (path through this node)
        maxLength = Math.Max(maxLength, leftPath + rightPath);
        
        // Return longer path to parent
        return Math.Max(leftPath, rightPath);
    }
    
    Dfs(root);
    return maxLength;
}
```

---

## 🎯 Path Problem Patterns

### Pattern 1: Root to Leaf (Standard)
```csharp
public void RootToLeafTemplate(TreeNode root, int target, 
                                List<int> path, List<List<int>> result)
{
    if (root == null) return;
    
    path.Add(root.Val);
    
    if (root.Left == null && root.Right == null)
    {
        // Process leaf - check condition
        if (MeetsCondition(path, target))
            result.Add(new List<int>(path));
    }
    
    RootToLeafTemplate(root.Left, target, path, result);
    RootToLeafTemplate(root.Right, target, path, result);
    
    path.RemoveAt(path.Count - 1);  // Backtrack
}
```

### Pattern 2: Any Node to Any Node (Max Path Sum style)
```csharp
public int AnyToAnyTemplate(TreeNode root)
{
    int globalMax = int.MinValue;
    
    int Helper(TreeNode node)
    {
        if (node == null) return 0;
        
        int left = Helper(node.Left);
        int right = Helper(node.Right);
        
        // Path through current node
        int pathThrough = Combine(left, node.Val, right);
        globalMax = Math.Max(globalMax, pathThrough);
        
        // Return contribution to parent (only ONE direction)
        return Extend(node.Val, Math.Max(left, right));
    }
    
    Helper(root);
    return globalMax;
}
```

---

## 🔥 Practice Problems

| Problem | LeetCode | Difficulty | Key Technique |
|---------|----------|------------|---------------|
| Binary Tree Paths | 257 | Easy | DFS + backtrack |
| Path Sum | 112 | Easy | DFS |
| Path Sum II | 113 | Medium | DFS + backtrack |
| Path Sum III | 437 | Medium | Prefix sum |
| Max Path Sum | 124 | Hard | Global max pattern |
| LCA | 236 | Medium | Recursive split |
| LCA BST | 235 | Medium | BST property |
| Sum Root to Leaf | 129 | Medium | Build number |
| Longest Univalue | 687 | Medium | Path matching |
