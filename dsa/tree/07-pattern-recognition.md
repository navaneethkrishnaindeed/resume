# 🌳 7. Pattern Recognition Problems

These problems involve comparing, transforming, or restructuring trees.

---

## 📌 Mirror (Invert) a Binary Tree ⭐

```csharp
public TreeNode InvertTree(TreeNode root)
{
    // LeetCode 226: Invert Binary Tree
    // Swap left and right children for every node
    if (root == null) return null;
    
    // Swap children
    (root.Left, root.Right) = (root.Right, root.Left);
    
    // Recursively invert subtrees
    InvertTree(root.Left);
    InvertTree(root.Right);
    
    return root;
}

// Iterative with queue (BFS)
public TreeNode InvertTreeBfs(TreeNode root)
{
    // BFS approach to invert tree
    if (root == null) return null;
    
    var queue = new Queue<TreeNode>();
    queue.Enqueue(root);
    
    while (queue.Count > 0)
    {
        var node = queue.Dequeue();
        
        // Swap children
        (node.Left, node.Right) = (node.Right, node.Left);
        
        if (node.Left != null) queue.Enqueue(node.Left);
        if (node.Right != null) queue.Enqueue(node.Right);
    }
    
    return root;
}

// Iterative with stack (DFS)
public TreeNode InvertTreeDfs(TreeNode root)
{
    // DFS approach using stack
    if (root == null) return null;
    
    var stack = new Stack<TreeNode>();
    stack.Push(root);
    
    while (stack.Count > 0)
    {
        var node = stack.Pop();
        
        (node.Left, node.Right) = (node.Right, node.Left);
        
        if (node.Left != null) stack.Push(node.Left);
        if (node.Right != null) stack.Push(node.Right);
    }
    
    return root;
}

// Example:
//       4                4
//      / \              / \
//     2   7    →       7   2
//    / \ / \          / \ / \
//   1  3 6  9        9  6 3  1
```

---

## 📌 Check if Two Trees are Identical ⭐

```csharp
public bool IsSameTree(TreeNode p, TreeNode q)
{
    // LeetCode 100: Same Tree
    // Check if two binary trees are structurally identical
    // with same node values
    
    // Both empty
    if (p == null && q == null) return true;
    
    // One empty, one not
    if (p == null || q == null) return false;
    
    // Check current nodes and recurse
    return p.Val == q.Val && 
           IsSameTree(p.Left, q.Left) && 
           IsSameTree(p.Right, q.Right);
}

// Iterative with queue
public bool IsSameTreeIterative(TreeNode p, TreeNode q)
{
    // BFS comparison
    var queue = new Queue<(TreeNode, TreeNode)>();
    queue.Enqueue((p, q));
    
    while (queue.Count > 0)
    {
        var (node1, node2) = queue.Dequeue();
        
        if (node1 == null && node2 == null) continue;
        if (node1 == null || node2 == null) return false;
        if (node1.Val != node2.Val) return false;
        
        queue.Enqueue((node1.Left, node2.Left));
        queue.Enqueue((node1.Right, node2.Right));
    }
    
    return true;
}

// Example:
//     1        1
//    / \      / \
//   2   3    2   3
// These are identical ✅

//     1        1
//    / \      / \
//   2   1    1   2
// These are NOT identical ❌
```

---

## 📌 Check if Tree is Symmetric ⭐

```csharp
public bool IsSymmetric(TreeNode root)
{
    // LeetCode 101: Symmetric Tree
    // Check if tree is mirror of itself
    if (root == null) return true;
    
    return IsMirror(root.Left, root.Right);
}

private bool IsMirror(TreeNode left, TreeNode right)
{
    // Both empty
    if (left == null && right == null) return true;
    
    // One empty
    if (left == null || right == null) return false;
    
    // Compare: left's left with right's right, etc.
    return left.Val == right.Val && 
           IsMirror(left.Left, right.Right) && 
           IsMirror(left.Right, right.Left);
}

// Iterative with queue
public bool IsSymmetricIterative(TreeNode root)
{
    // BFS with paired comparison
    if (root == null) return true;
    
    var queue = new Queue<(TreeNode, TreeNode)>();
    queue.Enqueue((root.Left, root.Right));
    
    while (queue.Count > 0)
    {
        var (left, right) = queue.Dequeue();
        
        if (left == null && right == null) continue;
        if (left == null || right == null) return false;
        if (left.Val != right.Val) return false;
        
        // Add pairs: outer and inner
        queue.Enqueue((left.Left, right.Right));   // Outer
        queue.Enqueue((left.Right, right.Left));   // Inner
    }
    
    return true;
}

// Example:
//       1
//      / \
//     2   2
//    / \ / \
//   3  4 4  3
// Symmetric ✅

//       1
//      / \
//     2   2
//      \   \
//       3   3
// NOT Symmetric ❌
```

---

## 📌 Check if Subtree ⭐

```csharp
public bool IsSubtree(TreeNode root, TreeNode subRoot)
{
    // LeetCode 572: Subtree of Another Tree
    // Check if subRoot is a subtree of root
    if (subRoot == null) return true;
    if (root == null) return false;
    
    // Check if current tree matches
    if (IsSameTree(root, subRoot))
        return true;
    
    // Check subtrees
    return IsSubtree(root.Left, subRoot) || IsSubtree(root.Right, subRoot);
}

// Optimized: Use tree serialization
public bool IsSubtreeOptimized(TreeNode root, TreeNode subRoot)
{
    // Serialize both trees and use string matching
    // O(m + n) with KMP or O(m * n) naive
    string Serialize(TreeNode node)
    {
        if (node == null) return "#";
        return $"^{node.Val}#{Serialize(node.Left)}#{Serialize(node.Right)}";
    }
    
    string rootStr = Serialize(root);
    string subStr = Serialize(subRoot);
    
    return rootStr.Contains(subStr);
}

// Example:
// Root:        SubRoot:
//     3           4
//    / \         / \
//   4   5       1   2
//  / \
// 1   2
// SubRoot IS a subtree of Root ✅
```

---

## 📌 Merge Two Binary Trees

```csharp
public TreeNode MergeTrees(TreeNode root1, TreeNode root2)
{
    // LeetCode 617: Merge Two Binary Trees
    // If both nodes exist, sum the values
    // Otherwise, use the non-null node
    if (root1 == null) return root2;
    if (root2 == null) return root1;
    
    // Create new node with sum
    var merged = new TreeNode(root1.Val + root2.Val);
    
    // Recursively merge children
    merged.Left = MergeTrees(root1.Left, root2.Left);
    merged.Right = MergeTrees(root1.Right, root2.Right);
    
    return merged;
}

// In-place modification (modify root1)
public TreeNode MergeTreesInplace(TreeNode root1, TreeNode root2)
{
    // Merge into root1
    if (root1 == null) return root2;
    if (root2 == null) return root1;
    
    root1.Val += root2.Val;
    root1.Left = MergeTreesInplace(root1.Left, root2.Left);
    root1.Right = MergeTreesInplace(root1.Right, root2.Right);
    
    return root1;
}

// Example:
// Tree 1:     Tree 2:      Merged:
//     1          2            3
//    / \        / \          / \
//   3   2      1   3        4   5
//  /            \   \      / \   \
// 5              4   7    5   4   7
```

---

## 📌 Serialize and Deserialize Binary Tree ⭐⭐

```csharp
public class Codec
{
    // LeetCode 297: Serialize and Deserialize Binary Tree
    // Convert tree to string and back
    
    public string Serialize(TreeNode root)
    {
        // Encodes a tree to a single string.
        if (root == null) return "null";
        
        var result = new List<string>();
        
        void Preorder(TreeNode node)
        {
            if (node == null)
            {
                result.Add("null");
                return;
            }
            
            result.Add(node.Val.ToString());
            Preorder(node.Left);
            Preorder(node.Right);
        }
        
        Preorder(root);
        return string.Join(",", result);
    }
    
    public TreeNode Deserialize(string data)
    {
        // Decodes your encoded data to tree.
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
}

// BFS approach (level order)
public class CodecBfs
{
    // Level order serialization
    
    public string Serialize(TreeNode root)
    {
        if (root == null) return "[]";
        
        var result = new List<string>();
        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);
        
        while (queue.Count > 0)
        {
            var node = queue.Dequeue();
            
            if (node != null)
            {
                result.Add(node.Val.ToString());
                queue.Enqueue(node.Left);
                queue.Enqueue(node.Right);
            }
            else
            {
                result.Add("null");
            }
        }
        
        // Remove trailing nulls
        while (result.Count > 0 && result[^1] == "null")
            result.RemoveAt(result.Count - 1);
        
        return "[" + string.Join(",", result) + "]";
    }
    
    public TreeNode Deserialize(string data)
    {
        if (data == "[]") return null;
        
        var values = data[1..^1].Split(',');
        
        var root = new TreeNode(int.Parse(values[0]));
        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);
        int i = 1;
        
        while (queue.Count > 0 && i < values.Length)
        {
            var node = queue.Dequeue();
            
            if (i < values.Length && values[i] != "null")
            {
                node.Left = new TreeNode(int.Parse(values[i]));
                queue.Enqueue(node.Left);
            }
            i++;
            
            if (i < values.Length && values[i] != "null")
            {
                node.Right = new TreeNode(int.Parse(values[i]));
                queue.Enqueue(node.Right);
            }
            i++;
        }
        
        return root;
    }
}

// Example:
//       1
//      / \
//     2   3
//        / \
//       4   5
//
// Preorder: "1,2,null,null,3,4,null,null,5,null,null"
// Level:    "[1,2,3,null,null,4,5]"
```

---

## 📌 Flatten Binary Tree to Linked List ⭐

```csharp
public void Flatten(TreeNode root)
{
    // LeetCode 114: Flatten Binary Tree to Linked List
    // Flatten to right-skewed tree in preorder
    
    if (root == null) return;
    
    // Morris-like approach - O(1) space
    var current = root;
    
    while (current != null)
    {
        if (current.Left != null)
        {
            // Find rightmost node of left subtree
            var rightmost = current.Left;
            while (rightmost.Right != null)
                rightmost = rightmost.Right;
            
            // Connect right subtree to rightmost
            rightmost.Right = current.Right;
            
            // Move left subtree to right
            current.Right = current.Left;
            current.Left = null;
        }
        
        current = current.Right;
    }
}

// Recursive approach with reverse postorder
public void FlattenRecursive(TreeNode root)
{
    // Process right → left → root (reverse preorder)
    TreeNode prev = null;
    
    void Helper(TreeNode node)
    {
        if (node == null) return;
        
        Helper(node.Right);
        Helper(node.Left);
        
        node.Right = prev;
        node.Left = null;
        prev = node;
    }
    
    Helper(root);
}

// Using stack (preorder)
public void FlattenStack(TreeNode root)
{
    // Stack-based preorder flattening
    if (root == null) return;
    
    var stack = new Stack<TreeNode>();
    stack.Push(root);
    
    while (stack.Count > 0)
    {
        var node = stack.Pop();
        
        if (node.Right != null) stack.Push(node.Right);
        if (node.Left != null) stack.Push(node.Left);
        
        if (stack.Count > 0)
            node.Right = stack.Peek();
        node.Left = null;
    }
}

// Example:
//       1                1
//      / \                \
//     2   5       →        2
//    / \   \                \
//   3   4   6                3
//                             \
//                              4
//                               \
//                                5
//                                 \
//                                  6
```

---

## 📌 Construct Binary Tree from String

```csharp
public TreeNode Str2Tree(string s)
{
    // LeetCode 536: Construct Binary Tree from String
    // "4(2(3)(1))(6(5))" → tree
    if (string.IsNullOrEmpty(s)) return null;
    
    int index = 0;
    
    TreeNode Parse()
    {
        // Parse number (may be negative)
        int start = index;
        if (s[index] == '-') index++;
        while (index < s.Length && char.IsDigit(s[index]))
            index++;
        
        var node = new TreeNode(int.Parse(s[start..index]));
        
        // Parse left child if exists
        if (index < s.Length && s[index] == '(')
        {
            index++;  // Skip '('
            node.Left = Parse();
            index++;  // Skip ')'
        }
        
        // Parse right child if exists
        if (index < s.Length && s[index] == '(')
        {
            index++;  // Skip '('
            node.Right = Parse();
            index++;  // Skip ')'
        }
        
        return node;
    }
    
    return Parse();
}

// Example:
// "4(2(3)(1))(6(5))" represents:
//       4
//      / \
//     2   6
//    / \ /
//   3  1 5
```

---

## 📌 Find Duplicate Subtrees ⭐

```csharp
public IList<TreeNode> FindDuplicateSubtrees(TreeNode root)
{
    // LeetCode 652: Find Duplicate Subtrees
    // Return roots of all duplicate subtrees
    var subtrees = new Dictionary<string, List<TreeNode>>();
    var result = new List<TreeNode>();
    
    string Serialize(TreeNode node)
    {
        if (node == null) return "#";
        
        // Create unique serialization for this subtree
        string serial = $"{node.Val},{Serialize(node.Left)},{Serialize(node.Right)}";
        
        // Track this subtree
        if (!subtrees.ContainsKey(serial))
            subtrees[serial] = new List<TreeNode>();
        subtrees[serial].Add(node);
        
        // If we've seen exactly 2 instances, it's a duplicate
        if (subtrees[serial].Count == 2)
            result.Add(node);
        
        return serial;
    }
    
    Serialize(root);
    return result;
}

// Optimized with tuple hashing (using ID approach)
public IList<TreeNode> FindDuplicateSubtreesOptimized(TreeNode root)
{
    // Use IDs for faster comparison
    var tripletToId = new Dictionary<(int, int, int), int>();
    var idCount = new Dictionary<int, int>();
    var result = new List<TreeNode>();
    int nextId = 1;
    
    int GetId(TreeNode node)
    {
        if (node == null) return 0;
        
        var triplet = (node.Val, GetId(node.Left), GetId(node.Right));
        
        if (!tripletToId.ContainsKey(triplet))
            tripletToId[triplet] = nextId++;
        
        int id = tripletToId[triplet];
        idCount[id] = idCount.GetValueOrDefault(id, 0) + 1;
        
        if (idCount[id] == 2)
            result.Add(node);
        
        return id;
    }
    
    GetId(root);
    return result;
}
```

---

## 📌 Leaf-Similar Trees

```csharp
public bool LeafSimilar(TreeNode root1, TreeNode root2)
{
    // LeetCode 872: Leaf-Similar Trees
    // Check if two trees have same leaf sequence
    return GetLeaves(root1).SequenceEqual(GetLeaves(root2));
}

private IEnumerable<int> GetLeaves(TreeNode node)
{
    if (node == null) yield break;
    
    if (node.Left == null && node.Right == null)
    {
        yield return node.Val;
        yield break;
    }
    
    foreach (var leaf in GetLeaves(node.Left))
        yield return leaf;
    foreach (var leaf in GetLeaves(node.Right))
        yield return leaf;
}

// Alternative: Collect to list first
public bool LeafSimilarList(TreeNode root1, TreeNode root2)
{
    var leaves1 = new List<int>();
    var leaves2 = new List<int>();
    
    CollectLeaves(root1, leaves1);
    CollectLeaves(root2, leaves2);
    
    return leaves1.SequenceEqual(leaves2);
}

private void CollectLeaves(TreeNode node, List<int> leaves)
{
    if (node == null) return;
    
    if (node.Left == null && node.Right == null)
    {
        leaves.Add(node.Val);
        return;
    }
    
    CollectLeaves(node.Left, leaves);
    CollectLeaves(node.Right, leaves);
}
```

---

## 🎯 Pattern Recognition Summary

| Problem | Key Insight | Time | Space |
|---------|-------------|------|-------|
| Invert Tree | Swap left/right at each node | O(n) | O(h) |
| Same Tree | Compare values and structure | O(n) | O(h) |
| Symmetric | Mirror comparison | O(n) | O(h) |
| Subtree | Check same tree at each node | O(m*n) | O(h) |
| Serialize | Preorder with nulls | O(n) | O(n) |
| Flatten | Right → rightmost of left | O(n) | O(1) |
| Duplicates | Hash subtree serializations | O(n) | O(n) |

---

## 🔥 Practice Problems

| Problem | LeetCode | Difficulty | Key Technique |
|---------|----------|------------|---------------|
| Invert Tree | 226 | Easy | Swap children |
| Same Tree | 100 | Easy | Parallel recursion |
| Symmetric Tree | 101 | Easy | Mirror comparison |
| Subtree | 572 | Easy | Same tree check |
| Merge Trees | 617 | Easy | Parallel traversal |
| Serialize | 297 | Hard | Preorder + nulls |
| Flatten to List | 114 | Medium | Morris-like |
| Duplicate Subtrees | 652 | Medium | Serialize + hash |
| Leaf Similar | 872 | Easy | Collect leaves |
