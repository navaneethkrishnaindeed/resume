# 🌳 1. Basic Tree Terminology

## Tree Node Definition

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

## Visual Example

```
        1           <- Root (Level 0, Depth 0)
       / \
      2   3         <- Level 1, Depth 1
     / \   \
    4   5   6       <- Level 2, Depth 2
   /
  7                 <- Leaf (Level 3, Depth 3)
```

---

## 📌 Root Node

> **Definition**: The topmost node of a tree with no parent.

```csharp
public TreeNode GetRoot(TreeNode tree)
{
    // The root is simply the starting node of the tree
    return tree;  // The tree reference itself is the root
}

// Example
var root = new TreeNode(1);
root.Left = new TreeNode(2);
root.Right = new TreeNode(3);
// 'root' (node with value 1) is the root node
```

**Interview Answer**: "The root is the topmost node in a tree. It has no parent and serves as the entry point for tree traversal."

---

## 📌 Leaf Node

> **Definition**: A node with no children (both left and right are null).

```csharp
public bool IsLeaf(TreeNode node)
{
    if (node == null) return false;
    return node.Left == null && node.Right == null;
}

public int CountLeaves(TreeNode root)
{
    if (root == null) return 0;
    
    if (root.Left == null && root.Right == null)
        return 1;
    
    return CountLeaves(root.Left) + CountLeaves(root.Right);
}

public IList<int> GetAllLeaves(TreeNode root)
{
    var leaves = new List<int>();
    
    void Dfs(TreeNode node)
    {
        if (node == null) return;
        
        if (node.Left == null && node.Right == null)
        {
            leaves.Add(node.Val);
            return;
        }
        
        Dfs(node.Left);
        Dfs(node.Right);
    }
    
    Dfs(root);
    return leaves;
}

// Example usage:
//       1
//      / \
//     2   3
//    / \
//   4   5
// Leaves: [4, 5, 3]
```

**Interview Answer**: "A leaf node is a node that has no children. Both its left and right pointers are null."

---

## 📌 Parent / Child Relationship

> **Definition**: If node A has a direct connection to node B below it, A is the parent and B is the child.

```csharp
public TreeNode FindParent(TreeNode root, int targetVal, TreeNode parent = null)
{
    if (root == null) return null;
    
    if (root.Val == targetVal)
        return parent;
    
    // Search in left subtree
    var leftResult = FindParent(root.Left, targetVal, root);
    if (leftResult != null)
        return leftResult;
    
    // Search in right subtree
    return FindParent(root.Right, targetVal, root);
}

public List<TreeNode> GetChildren(TreeNode node)
{
    var children = new List<TreeNode>();
    
    if (node == null) return children;
    
    if (node.Left != null)
        children.Add(node.Left);
    if (node.Right != null)
        children.Add(node.Right);
    
    return children;
}

// Example:
//       1
//      / \
//     2   3
// Parent of 2 is 1
// Children of 1 are [2, 3]
```

**Interview Answer**: "A parent node is one that has one or more child nodes directly below it. A child node is a direct descendant of its parent."

---

## 📌 Siblings

> **Definition**: Nodes that share the same parent.

```csharp
public TreeNode FindSibling(TreeNode root, int targetVal)
{
    if (root == null) return null;
    
    // Check if target is a child of current node
    if (root.Left != null && root.Left.Val == targetVal)
        return root.Right;  // Return right sibling (could be null)
    
    if (root.Right != null && root.Right.Val == targetVal)
        return root.Left;   // Return left sibling (could be null)
    
    // Search in subtrees
    var leftResult = FindSibling(root.Left, targetVal);
    if (leftResult != null)
        return leftResult;
    
    return FindSibling(root.Right, targetVal);
}

public bool AreSiblings(TreeNode root, int val1, int val2)
{
    if (root == null) return false;
    
    // Check if both children exist and match the values
    if (root.Left != null && root.Right != null)
    {
        if ((root.Left.Val == val1 && root.Right.Val == val2) ||
            (root.Left.Val == val2 && root.Right.Val == val1))
            return true;
    }
    
    return AreSiblings(root.Left, val1, val2) || 
           AreSiblings(root.Right, val1, val2);
}

// Example:
//       1
//      / \
//     2   3
// Nodes 2 and 3 are siblings
```

**Interview Answer**: "Siblings are nodes that have the same parent. In a binary tree, a node can have at most one sibling."

---

## 📌 Degree of a Node

> **Definition**: The number of children a node has.

```csharp
public int DegreeOfNode(TreeNode node)
{
    if (node == null) return 0;
    
    int degree = 0;
    if (node.Left != null) degree++;
    if (node.Right != null) degree++;
    
    return degree;
}

public int DegreeOfTree(TreeNode root)
{
    // For binary tree, max degree is 2
    if (root == null) return 0;
    
    int currentDegree = DegreeOfNode(root);
    int leftMax = DegreeOfTree(root.Left);
    int rightMax = DegreeOfTree(root.Right);
    
    return Math.Max(currentDegree, Math.Max(leftMax, rightMax));
}

// Example:
//       1        <- degree 2
//      / \
//     2   3      <- degree 2, degree 1
//    / \   \
//   4   5   6    <- degree 0 (leaves)
```

**Interview Answer**: "The degree of a node is the number of children it has. In a binary tree, degree can be 0, 1, or 2. The degree of a tree is the maximum degree of any node."

---

## 📌 Height of a Tree

> **Definition**: The number of edges on the longest path from root to a leaf. (Some definitions count nodes instead of edges)

```csharp
public int HeightEdges(TreeNode root)
{
    // Height as number of EDGES (root-only tree has height 0)
    if (root == null) return -1;  // Empty tree has height -1
    
    int leftHeight = HeightEdges(root.Left);
    int rightHeight = HeightEdges(root.Right);
    
    return 1 + Math.Max(leftHeight, rightHeight);
}

public int HeightNodes(TreeNode root)
{
    // Height as number of NODES (root-only tree has height 1)
    if (root == null) return 0;
    
    int leftHeight = HeightNodes(root.Left);
    int rightHeight = HeightNodes(root.Right);
    
    return 1 + Math.Max(leftHeight, rightHeight);
}

// Example:
//       1
//      / \
//     2   3
//    /
//   4
// Height (edges): 2
// Height (nodes): 3
```

**⚠️ Interview Tip**: Always clarify if interviewer means edges or nodes!

---

## 📌 Depth of a Node

> **Definition**: The number of edges from the root to that node.

```csharp
public int DepthOfNode(TreeNode root, int targetVal, int currentDepth = 0)
{
    if (root == null) return -1;  // Node not found
    
    if (root.Val == targetVal)
        return currentDepth;
    
    // Search in left subtree
    int leftDepth = DepthOfNode(root.Left, targetVal, currentDepth + 1);
    if (leftDepth != -1)
        return leftDepth;
    
    // Search in right subtree
    return DepthOfNode(root.Right, targetVal, currentDepth + 1);
}

public IList<int> AllNodesAtDepth(TreeNode root, int targetDepth, int currentDepth = 0)
{
    var result = new List<int>();
    
    if (root == null) return result;
    
    if (currentDepth == targetDepth)
    {
        result.Add(root.Val);
        return result;
    }
    
    result.AddRange(AllNodesAtDepth(root.Left, targetDepth, currentDepth + 1));
    result.AddRange(AllNodesAtDepth(root.Right, targetDepth, currentDepth + 1));
    
    return result;
}

// Example:
//       1           <- depth 0
//      / \
//     2   3         <- depth 1
//    / \
//   4   5           <- depth 2
```

**Interview Answer**: "Depth of a node is the number of edges from the root to that node. The root has depth 0."

---

## 📌 Level of a Node

> **Definition**: Level = Depth + 1 (or same as depth, depending on convention)

```csharp
public int LevelOfNode(TreeNode root, int targetVal, int currentLevel = 1)
{
    // Find level of a node (1-indexed, root is level 1)
    if (root == null) return -1;
    
    if (root.Val == targetVal)
        return currentLevel;
    
    int leftLevel = LevelOfNode(root.Left, targetVal, currentLevel + 1);
    if (leftLevel != -1)
        return leftLevel;
    
    return LevelOfNode(root.Right, targetVal, currentLevel + 1);
}

public IList<int> NodesAtLevel(TreeNode root, int targetLevel)
{
    // BFS approach to get all nodes at a specific level
    if (root == null) return new List<int>();
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    int currentLevel = 1;
    
    while (queue.Count > 0)
    {
        if (currentLevel == targetLevel)
            return queue.Select(n => n.Val).ToList();
        
        int levelSize = queue.Count;
        for (int i = 0; i < levelSize; i++)
        {
            var node = queue.Dequeue();
            if (node.Left != null) queue.Enqueue(node.Left);
            if (node.Right != null) queue.Enqueue(node.Right);
        }
        
        currentLevel++;
    }
    
    return new List<int>();
}

// Example:
//       1           <- level 1
//      / \
//     2   3         <- level 2
//    / \
//   4   5           <- level 3
```

**⚠️ Interview Tip**: Clarify if levels are 0-indexed or 1-indexed!

---

## 📌 Subtree

> **Definition**: A tree formed by a node and all its descendants.

```csharp
public TreeNode GetSubtree(TreeNode root, int targetVal)
{
    // Find and return subtree rooted at node with target value
    if (root == null) return null;
    
    if (root.Val == targetVal)
        return root;  // This node and all its descendants form the subtree
    
    var leftResult = GetSubtree(root.Left, targetVal);
    if (leftResult != null)
        return leftResult;
    
    return GetSubtree(root.Right, targetVal);
}

public bool IsSubtree(TreeNode root, TreeNode subRoot)
{
    // Check if subRoot is a subtree of root
    if (subRoot == null) return true;
    if (root == null) return false;
    
    if (IsSameTree(root, subRoot))
        return true;
    
    return IsSubtree(root.Left, subRoot) || IsSubtree(root.Right, subRoot);
}

public bool IsSameTree(TreeNode p, TreeNode q)
{
    // Helper: Check if two trees are identical
    if (p == null && q == null) return true;
    if (p == null || q == null) return false;
    
    return p.Val == q.Val && 
           IsSameTree(p.Left, q.Left) && 
           IsSameTree(p.Right, q.Right);
}

// Example:
//       1
//      / \
//     2   3
//    / \
//   4   5
// Subtree rooted at 2 contains: 2, 4, 5
```

**Interview Answer**: "A subtree is a portion of a tree that consists of a node and all of its descendants. Any node in a tree can be considered the root of its own subtree."

---

## 📌 Binary Tree

> **Definition**: A tree where each node has at most 2 children (left and right).

```csharp
// Binary Tree Node
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

// Building a binary tree
public TreeNode BuildSampleTree()
{
    /*
    Build this tree:
          1
         / \
        2   3
       / \   \
      4   5   6
    */
    var root = new TreeNode(1);
    root.Left = new TreeNode(2);
    root.Right = new TreeNode(3);
    root.Left.Left = new TreeNode(4);
    root.Left.Right = new TreeNode(5);
    root.Right.Right = new TreeNode(6);
    return root;
}

// Build tree from array (LeetCode style)
public TreeNode BuildTreeFromArray(int?[] values)
{
    /*
    Build tree from level-order array
    [1, 2, 3, 4, 5, null, 6] creates:
          1
         / \
        2   3
       / \   \
      4   5   6
    */
    if (values == null || values.Length == 0 || values[0] == null)
        return null;
    
    var root = new TreeNode(values[0].Value);
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    int i = 1;
    
    while (queue.Count > 0 && i < values.Length)
    {
        var node = queue.Dequeue();
        
        // Left child
        if (i < values.Length && values[i] != null)
        {
            node.Left = new TreeNode(values[i].Value);
            queue.Enqueue(node.Left);
        }
        i++;
        
        // Right child
        if (i < values.Length && values[i] != null)
        {
            node.Right = new TreeNode(values[i].Value);
            queue.Enqueue(node.Right);
        }
        i++;
    }
    
    return root;
}

// Example usage
var root = BuildTreeFromArray(new int?[] { 1, 2, 3, 4, 5, null, 6 });
```

---

## 🎯 Summary Cheat Sheet

| Term | Definition | Example (from tree above) |
|------|------------|---------------------------|
| **Root** | Topmost node, no parent | Node 1 |
| **Leaf** | Node with no children | Nodes 4, 5, 6 |
| **Parent** | Node with children below | 1 is parent of 2,3 |
| **Child** | Direct descendant | 2, 3 are children of 1 |
| **Sibling** | Same parent | 2 and 3 are siblings |
| **Degree** | Number of children | Degree of 1 is 2 |
| **Height** | Longest path to leaf | Height is 2 (edges) |
| **Depth** | Distance from root | Depth of 4 is 2 |
| **Level** | Depth + 1 (usually) | Level of 4 is 3 |
| **Subtree** | Node + all descendants | Subtree at 2: {2,4,5} |

---

## 🔥 Common Interview Questions

1. "Find the height of a binary tree" → Use recursive height function
2. "Count leaf nodes" → Recurse, count nodes with no children
3. "Find depth of a given node" → Track depth while traversing
4. "Check if node exists in tree" → DFS/BFS search
5. "Find parent of a node" → Track parent during traversal
