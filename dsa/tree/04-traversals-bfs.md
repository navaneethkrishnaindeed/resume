# 🌳 4. Breadth First Search (BFS) Traversals

BFS explores level by level using a **queue**. Essential for level-order problems!

## Visual Reference

```
        1           Level 0
       / \
      2   3         Level 1
     / \   \
    4   5   6       Level 2

Level Order: [1], [2, 3], [4, 5, 6]
Flattened:   1 → 2 → 3 → 4 → 5 → 6
```

---

## 📌 Level Order Traversal (Basic)

```csharp
public IList<IList<int>> LevelOrder(TreeNode root)
{
    // LeetCode 102: Binary Tree Level Order Traversal
    // Returns list of lists, each inner list is one level
    // Time: O(n), Space: O(w) where w is max width
    var result = new List<IList<int>>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        var currentLevel = new List<int>();
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            currentLevel.Add(node.Val);
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        result.Add(currentLevel);
    }
    
    return result;
}

// Example:
// Input:
//       3
//      / \
//     9  20
//        / \
//       15  7
// Output: [[3], [9, 20], [15, 7]]
```

---

## 📌 Level Order - Flat List

```csharp
public IList<int> LevelOrderFlat(TreeNode root)
{
    // Returns single flat list in level order
    var result = new List<int>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        var node = queue.Dequeue();
        result.Add(node.Val);
        
        if (node.Left != null) queue.Enqueue(node.Left);
        if (node.Right != null) queue.Enqueue(node.Right);
    }
    
    return result;
}

// Example: [3, 9, 20, 15, 7]
```

---

## 📌 Level Order Bottom Up

```csharp
public IList<IList<int>> LevelOrderBottom(TreeNode root)
{
    // LeetCode 107: Binary Tree Level Order Traversal II
    // Returns levels from bottom to top
    var result = new List<IList<int>>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        var currentLevel = new List<int>();
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            currentLevel.Add(node.Val);
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        result.Add(currentLevel);
    }
    
    result.Reverse();  // Reverse at end
    return result;
}

// Or insert at front during construction
public IList<IList<int>> LevelOrderBottomV2(TreeNode root)
{
    var result = new LinkedList<IList<int>>();  // LinkedList for O(1) AddFirst
    
    if (root == null) return result.ToList();
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        var currentLevel = new List<int>();
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            currentLevel.Add(node.Val);
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        result.AddFirst(currentLevel);  // Add to front
    }
    
    return result.ToList();
}
```

---

## 📌 Zigzag Level Order Traversal ⭐

```csharp
public IList<IList<int>> ZigzagLevelOrder(TreeNode root)
{
    // LeetCode 103: Binary Tree Zigzag Level Order Traversal
    // Level 0: left to right
    // Level 1: right to left
    // Level 2: left to right
    // ...
    var result = new List<IList<int>>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    bool leftToRight = true;
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        var currentLevel = new LinkedList<int>();  // Use LinkedList for O(1) AddFirst
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            
            if (leftToRight)
                currentLevel.AddLast(node.Val);
            else
                currentLevel.AddFirst(node.Val);
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        result.Add(currentLevel.ToList());
        leftToRight = !leftToRight;  // Toggle direction
    }
    
    return result;
}

// Example:
//       3
//      / \
//     9  20
//    /  /  \
//   8  15   7
//
// Output: [[3], [20, 9], [8, 15, 7]]
// Level 0: 3 (L→R)
// Level 1: 20, 9 (R→L)
// Level 2: 8, 15, 7 (L→R)
```

---

## 📌 Right Side View ⭐

```csharp
public IList<int> RightSideView(TreeNode root)
{
    // LeetCode 199: Binary Tree Right Side View
    // Return rightmost node at each level
    var result = new List<int>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            
            // Last node in level = rightmost
            if (i == levelSize - 1)
                result.Add(node.Val);
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
    }
    
    return result;
}

// DFS approach (more elegant)
public IList<int> RightSideViewDfs(TreeNode root)
{
    // DFS: Visit right subtree first
    var result = new List<int>();
    
    void Dfs(TreeNode node, int depth)
    {
        if (node == null) return;
        
        // First node we see at this depth (going right first)
        if (depth == result.Count)
            result.Add(node.Val);
        
        Dfs(node.Right, depth + 1);  // Right first!
        Dfs(node.Left, depth + 1);
    }
    
    Dfs(root, 0);
    return result;
}

// Example:
//       1
//      / \
//     2   3
//      \   \
//       5   4
//
// Right view: [1, 3, 4]
```

---

## 📌 Left Side View

```csharp
public IList<int> LeftSideView(TreeNode root)
{
    // Return leftmost node at each level
    var result = new List<int>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            
            // First node in level = leftmost
            if (i == 0)
                result.Add(node.Val);
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
    }
    
    return result;
}

// DFS approach
public IList<int> LeftSideViewDfs(TreeNode root)
{
    // DFS: Visit left subtree first
    var result = new List<int>();
    
    void Dfs(TreeNode node, int depth)
    {
        if (node == null) return;
        
        if (depth == result.Count)
            result.Add(node.Val);
        
        Dfs(node.Left, depth + 1);   // Left first!
        Dfs(node.Right, depth + 1);
    }
    
    Dfs(root, 0);
    return result;
}
```

---

## 📌 Top View of Binary Tree ⭐

```csharp
public IList<int> TopView(TreeNode root)
{
    // Return nodes visible from top
    // Uses horizontal distance (HD): root=0, left=-1, right=+1
    // For each HD, only first node (top) is visible
    if (root == null) return new List<int>();
    
    // Store first node at each horizontal distance
    var hdMap = new Dictionary<int, int>();  // {horizontal_distance: node_value}
    var queue = new Queue<(TreeNode node, int hd)>();
    queue.Enqueue((root, 0));
    
    int minHd = 0, maxHd = 0;
    
    while (queue.Count > 0)
    {
        var (node, hd) = queue.Dequeue();
        
        // Only add if this HD not seen before (top view)
        if (!hdMap.ContainsKey(hd))
            hdMap[hd] = node.Val;
        
        minHd = Math.Min(minHd, hd);
        maxHd = Math.Max(maxHd, hd);
        
        if (node.Left != null)
            queue.Enqueue((node.Left, hd - 1));
        if (node.Right != null)
            queue.Enqueue((node.Right, hd + 1));
    }
    
    // Return in order of horizontal distance
    var result = new List<int>();
    for (int i = minHd; i <= maxHd; i++)
        result.Add(hdMap[i]);
    
    return result;
}

// Example:
//         1
//        / \
//       2   3
//      / \   \
//     4   5   6
//
// HD:  -2  -1  0  0  1  2
//       4   2  1  5  3  6
//
// Top view: [4, 2, 1, 3, 6]
// (5 is hidden by 1)
```

---

## 📌 Bottom View of Binary Tree ⭐

```csharp
public IList<int> BottomView(TreeNode root)
{
    // Return nodes visible from bottom
    // For each HD, last node (bottom) is visible
    if (root == null) return new List<int>();
    
    var hdMap = new Dictionary<int, int>();
    var queue = new Queue<(TreeNode node, int hd)>();
    queue.Enqueue((root, 0));
    
    int minHd = 0, maxHd = 0;
    
    while (queue.Count > 0)
    {
        var (node, hd) = queue.Dequeue();
        
        // Always update (last one wins = bottom view)
        hdMap[hd] = node.Val;
        
        minHd = Math.Min(minHd, hd);
        maxHd = Math.Max(maxHd, hd);
        
        if (node.Left != null)
            queue.Enqueue((node.Left, hd - 1));
        if (node.Right != null)
            queue.Enqueue((node.Right, hd + 1));
    }
    
    var result = new List<int>();
    for (int i = minHd; i <= maxHd; i++)
        result.Add(hdMap[i]);
    
    return result;
}

// Example:
//         1
//        / \
//       2   3
//      / \   \
//     4   5   6
//
// Bottom view: [4, 2, 5, 3, 6]
// (1 is replaced by 5)
```

---

## 📌 Vertical Order Traversal ⭐

```csharp
public IList<IList<int>> VerticalOrder(TreeNode root)
{
    // LeetCode 314: Binary Tree Vertical Order Traversal
    // Group nodes by horizontal distance
    if (root == null) return new List<IList<int>>();
    
    var columnMap = new Dictionary<int, List<int>>();
    var queue = new Queue<(TreeNode node, int col)>();
    queue.Enqueue((root, 0));
    
    int minCol = 0, maxCol = 0;
    
    while (queue.Count > 0)
    {
        var (node, col) = queue.Dequeue();
        
        if (!columnMap.ContainsKey(col))
            columnMap[col] = new List<int>();
        columnMap[col].Add(node.Val);
        
        minCol = Math.Min(minCol, col);
        maxCol = Math.Max(maxCol, col);
        
        if (node.Left != null)
            queue.Enqueue((node.Left, col - 1));
        if (node.Right != null)
            queue.Enqueue((node.Right, col + 1));
    }
    
    var result = new List<IList<int>>();
    for (int col = minCol; col <= maxCol; col++)
        result.Add(columnMap[col]);
    
    return result;
}

// LeetCode 987: Vertical Order with sorting
public IList<IList<int>> VerticalTraversal(TreeNode root)
{
    // LeetCode 987: Vertical Order Traversal (with sorting)
    // Same column + same row: sort by value
    if (root == null) return new List<IList<int>>();
    
    // Store: (col, row, value)
    var nodes = new List<(int col, int row, int val)>();
    
    void Dfs(TreeNode node, int row, int col)
    {
        if (node == null) return;
        nodes.Add((col, row, node.Val));
        Dfs(node.Left, row + 1, col - 1);
        Dfs(node.Right, row + 1, col + 1);
    }
    
    Dfs(root, 0, 0);
    
    // Sort by column, then row, then value
    nodes = nodes.OrderBy(n => n.col)
                 .ThenBy(n => n.row)
                 .ThenBy(n => n.val)
                 .ToList();
    
    // Group by column
    var result = new List<IList<int>>();
    var columnMap = new Dictionary<int, List<int>>();
    
    foreach (var (col, row, val) in nodes)
    {
        if (!columnMap.ContainsKey(col))
            columnMap[col] = new List<int>();
        columnMap[col].Add(val);
    }
    
    foreach (var col in columnMap.Keys.OrderBy(k => k))
        result.Add(columnMap[col]);
    
    return result;
}
```

---

## 📌 Average of Levels

```csharp
public IList<double> AverageOfLevels(TreeNode root)
{
    // LeetCode 637: Average of Levels in Binary Tree
    var result = new List<double>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        double levelSum = 0;
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            levelSum += node.Val;
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        result.Add(levelSum / levelSize);
    }
    
    return result;
}
```

---

## 📌 Find Largest Value in Each Row

```csharp
public IList<int> LargestValues(TreeNode root)
{
    // LeetCode 515: Find Largest Value in Each Tree Row
    var result = new List<int>();
    
    if (root == null) return result;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        int levelMax = int.MinValue;
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            levelMax = Math.Max(levelMax, node.Val);
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        result.Add(levelMax);
    }
    
    return result;
}
```

---

## 📌 Cousins in Binary Tree

```csharp
public bool IsCousins(TreeNode root, int x, int y)
{
    // LeetCode 993: Cousins in Binary Tree
    // Cousins: Same depth, different parents
    var queue = new Queue<(TreeNode node, TreeNode parent)>();
    queue.Enqueue((root, null));
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;
        TreeNode xParent = null, yParent = null;
        
        for (int i = 0; i < levelSize; i++)
        {
            var (node, parent) = queue.Dequeue();
            
            if (node.Val == x) xParent = parent;
            if (node.Val == y) yParent = parent;
            
            if (node.Left != null)
                queue.Enqueue((node.Left, node));
            if (node.Right != null)
                queue.Enqueue((node.Right, node));
        }
        
        // Both found at this level
        if (xParent != null && yParent != null)
            return xParent != yParent;  // Different parents?
        
        // One found, other not - can't be cousins
        if (xParent != null || yParent != null)
            return false;
    }
    
    return false;
}
```

---

## 🎯 BFS Template

```csharp
public void BfsTemplate(TreeNode root)
{
    // Generic BFS template for tree problems
    if (root == null) return;  // Handle empty tree
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    int level = 0;
    
    while (queue.Count > 0)
    {
        int levelSize = queue.Count;  // Important: Capture before loop!
        
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            
            // Process node here
            // - First node: i == 0
            // - Last node: i == levelSize - 1
            // - Current level: level
            
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        level++;
    }
}
```

---

## 🔥 BFS vs DFS Comparison

| Aspect | BFS | DFS |
|--------|-----|-----|
| **Data Structure** | Queue | Stack (or recursion) |
| **Order** | Level by level | Deep first |
| **Space** | O(w) max width | O(h) height |
| **Use Case** | Level problems, shortest path | Path problems, backtracking |
| **Find Depth** | Natural | Need to track |

---

## 🔥 Practice Problems

| Problem | LeetCode | Key Technique |
|---------|----------|---------------|
| Level Order | 102 | Basic BFS |
| Level Order Bottom | 107 | BFS + reverse |
| Zigzag | 103 | BFS + direction toggle |
| Right Side View | 199 | BFS (last) or DFS (right first) |
| Vertical Order | 314, 987 | BFS + column tracking |
| Average of Levels | 637 | BFS + sum |
| Max Width | 662 | BFS + position tracking |
| Cousins | 993 | BFS + parent tracking |
