# 🌳 Tree Data Structures - Complete Interview Guide (C#)

This guide covers all essential tree concepts for technical interviews with C# code examples.

## 📚 Table of Contents

| # | Topic | Description |
|---|-------|-------------|
| 1 | [Basic Terminology](01-basic-terminology.md) | Root, leaf, parent, child, siblings, degree, height, depth, level |
| 2 | [Structural Properties](02-structural-properties.md) | Height, depth, node counts, diameter, tree types |
| 3 | [DFS Traversals](03-traversals-dfs.md) | Inorder, Preorder, Postorder, tree construction |
| 4 | [BFS Traversals](04-traversals-bfs.md) | Level order, zigzag, views (right/left/top/bottom) |
| 5 | [Path Problems](05-path-problems.md) | Root to leaf, path sum, LCA, distance between nodes |
| 6 | [BST Basics](06-bst-basics.md) | Search, insert, delete, validate, kth smallest |
| 7 | [Pattern Recognition](07-pattern-recognition.md) | Mirror, identical, symmetric, invert, serialize |
| 8 | [Recursion Patterns](08-recursion-patterns.md) | Master pattern for solving tree problems |

## 🔧 Common Tree Node Definition

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

## 🎯 Key Interview Tips

1. **Always clarify**: Binary tree vs BST vs N-ary tree
2. **Edge cases**: Empty tree, single node, skewed tree
3. **Think recursively**: Most tree problems follow left → right → combine pattern
4. **Know your traversals**: Each traversal has specific use cases
5. **Time complexity**: Usually O(n) where n = number of nodes
6. **Space complexity**: O(h) for recursion stack, O(n) for BFS queue

## 🚀 Quick Reference - Time Complexities

| Operation | Binary Tree | BST (balanced) | BST (worst) |
|-----------|------------|----------------|-------------|
| Search | O(n) | O(log n) | O(n) |
| Insert | O(n) | O(log n) | O(n) |
| Delete | O(n) | O(log n) | O(n) |
| Traversal | O(n) | O(n) | O(n) |

---
*Happy coding! 🚀*
