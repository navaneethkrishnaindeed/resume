# 🌳 6. Binary Search Tree (BST) Basics

## BST Property

> For every node: **left subtree values < node value < right subtree values**

```
        8           ✅ Valid BST
       / \
      3   10
     / \    \
    1   6    14
       / \   /
      4   7 13
```

---

## 📌 Search in BST

```csharp
public TreeNode SearchBst(TreeNode root, int val)
{
    // LeetCode 700: Search in a Binary Search Tree
    // Time: O(h), Space: O(1) iterative / O(h) recursive
    
    // Iterative (preferred - O(1) space)
    while (root != null)
    {
        if (val == root.Val)
            return root;
        else if (val < root.Val)
            root = root.Left;
        else
            root = root.Right;
    }
    return null;
}

// Recursive version
public TreeNode SearchBstRecursive(TreeNode root, int val)
{
    if (root == null || root.Val == val)
        return root;
    
    if (val < root.Val)
        return SearchBstRecursive(root.Left, val);
    else
        return SearchBstRecursive(root.Right, val);
}

// Example:
//       4
//      / \
//     2   7
//    / \
//   1   3
//
// SearchBst(root, 2) → returns node with value 2
// SearchBst(root, 5) → returns null
```

**Time Complexity:**
- Balanced BST: O(log n)
- Skewed BST: O(n)

---

## 📌 Insert in BST ⭐

```csharp
public TreeNode InsertBst(TreeNode root, int val)
{
    // LeetCode 701: Insert into a Binary Search Tree
    // Always insert as a leaf
    
    var newNode = new TreeNode(val);
    
    if (root == null) return newNode;
    
    var current = root;
    while (true)
    {
        if (val < current.Val)
        {
            if (current.Left == null)
            {
                current.Left = newNode;
                break;
            }
            current = current.Left;
        }
        else
        {
            if (current.Right == null)
            {
                current.Right = newNode;
                break;
            }
            current = current.Right;
        }
    }
    
    return root;
}

// Recursive version
public TreeNode InsertBstRecursive(TreeNode root, int val)
{
    if (root == null)
        return new TreeNode(val);
    
    if (val < root.Val)
        root.Left = InsertBstRecursive(root.Left, val);
    else
        root.Right = InsertBstRecursive(root.Right, val);
    
    return root;
}

// Example: Insert 5 into BST
//       4              4
//      / \   →        / \
//     2   7          2   7
//    / \            / \ /
//   1   3          1  3 5
```

---

## 📌 Delete in BST ⭐⭐

```csharp
public TreeNode DeleteBst(TreeNode root, int key)
{
    // LeetCode 450: Delete Node in a BST
    // Three cases:
    // 1. Leaf node: just remove
    // 2. One child: replace with child
    // 3. Two children: replace with inorder successor (or predecessor)
    
    if (root == null) return null;
    
    // Find the node to delete
    if (key < root.Val)
    {
        root.Left = DeleteBst(root.Left, key);
    }
    else if (key > root.Val)
    {
        root.Right = DeleteBst(root.Right, key);
    }
    else
    {
        // Found the node to delete
        
        // Case 1 & 2: No left child or no right child
        if (root.Left == null)
            return root.Right;
        if (root.Right == null)
            return root.Left;
        
        // Case 3: Two children
        // Find inorder successor (smallest in right subtree)
        var successor = FindMin(root.Right);
        
        // Replace current value with successor's value
        root.Val = successor.Val;
        
        // Delete the successor from right subtree
        root.Right = DeleteBst(root.Right, successor.Val);
    }
    
    return root;
}

private TreeNode FindMin(TreeNode node)
{
    // Find minimum node (leftmost)
    while (node.Left != null)
        node = node.Left;
    return node;
}

// Alternative: Use predecessor instead
public TreeNode DeleteBstPredecessor(TreeNode root, int key)
{
    if (root == null) return null;
    
    if (key < root.Val)
        root.Left = DeleteBstPredecessor(root.Left, key);
    else if (key > root.Val)
        root.Right = DeleteBstPredecessor(root.Right, key);
    else
    {
        if (root.Left == null) return root.Right;
        if (root.Right == null) return root.Left;
        
        // Find inorder predecessor (largest in left subtree)
        var predecessor = FindMax(root.Left);
        root.Val = predecessor.Val;
        root.Left = DeleteBstPredecessor(root.Left, predecessor.Val);
    }
    
    return root;
}

private TreeNode FindMax(TreeNode node)
{
    // Find maximum node (rightmost)
    while (node.Right != null)
        node = node.Right;
    return node;
}

// Example: Delete 3 from BST
//       5              5
//      / \   →        / \
//     3   6          4   6
//    / \            /
//   2   4          2
```

**Deletion Cases Visualization:**
```
Case 1 - Leaf:      Case 2 - One child:    Case 3 - Two children:
    5                    5                      5
   / \                  / \                    / \
  3   6                3   6                  3   6
 ↓                    /                      / \
Delete 3             2                      2   4
                     ↓                       ↓
Result:            Replace 3               Replace 3 with 4
    5              with 2                  (inorder successor)
     \                 5
      6               / \
                     2   6
```

---

## 📌 Validate BST ⭐⭐

```csharp
public bool IsValidBst(TreeNode root)
{
    // LeetCode 98: Validate Binary Search Tree
    // Check if tree satisfies BST property
    return Validate(root, long.MinValue, long.MaxValue);
}

private bool Validate(TreeNode node, long minVal, long maxVal)
{
    if (node == null) return true;
    
    // Check current node's value is within valid range
    if (node.Val <= minVal || node.Val >= maxVal)
        return false;
    
    // Validate subtrees with updated ranges
    return Validate(node.Left, minVal, node.Val) && 
           Validate(node.Right, node.Val, maxVal);
}

// Using inorder traversal (BST inorder is sorted!)
public bool IsValidBstInorder(TreeNode root)
{
    // Inorder traversal should give sorted sequence
    long prev = long.MinValue;
    
    bool Inorder(TreeNode node)
    {
        if (node == null) return true;
        
        // Check left subtree
        if (!Inorder(node.Left)) return false;
        
        // Check current node
        if (node.Val <= prev) return false;
        prev = node.Val;
        
        // Check right subtree
        return Inorder(node.Right);
    }
    
    return Inorder(root);
}

// Iterative inorder
public bool IsValidBstIterative(TreeNode root)
{
    // Iterative inorder with stack
    var stack = new Stack<TreeNode>();
    long prev = long.MinValue;
    
    while (stack.Count > 0 || root != null)
    {
        while (root != null)
        {
            stack.Push(root);
            root = root.Left;
        }
        
        root = stack.Pop();
        
        if (root.Val <= prev) return false;
        prev = root.Val;
        
        root = root.Right;
    }
    
    return true;
}

// Example:
//       2         ✅ Valid        5         ❌ Invalid
//      / \                       / \
//     1   3                     1   4
//                                  / \
//                                 3   6
// Node 3 is less than 5 but in right subtree
```

**⚠️ Common Mistakes:**
1. Only checking immediate children (must check entire subtree)
2. Using `<=` vs `<` (depends on whether duplicates allowed)

---

## 📌 Find Kth Smallest Element ⭐⭐

```csharp
public int KthSmallest(TreeNode root, int k)
{
    // LeetCode 230: Kth Smallest Element in a BST
    // Inorder traversal gives sorted order
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
    return result ?? -1;
}

// Iterative version
public int KthSmallestIterative(TreeNode root, int k)
{
    // Iterative inorder - stop at kth
    var stack = new Stack<TreeNode>();
    
    while (true)
    {
        while (root != null)
        {
            stack.Push(root);
            root = root.Left;
        }
        
        root = stack.Pop();
        k--;
        
        if (k == 0) return root.Val;
        
        root = root.Right;
    }
}

// Kth Largest = (n - k + 1)th smallest
// Or reverse inorder (right first)
public int KthLargest(TreeNode root, int k)
{
    // Reverse inorder: right → root → left
    int count = 0;
    int? result = null;
    
    void ReverseInorder(TreeNode node)
    {
        if (node == null || result != null) return;
        
        ReverseInorder(node.Right);  // Right first!
        
        count++;
        if (count == k)
        {
            result = node.Val;
            return;
        }
        
        ReverseInorder(node.Left);
    }
    
    ReverseInorder(root);
    return result ?? -1;
}
```

---

## 📌 Find Inorder Predecessor / Successor ⭐

```csharp
public TreeNode InorderSuccessor(TreeNode root, TreeNode p)
{
    // LeetCode 285: Inorder Successor in BST
    // Find smallest node greater than p
    TreeNode successor = null;
    
    while (root != null)
    {
        if (p.Val < root.Val)
        {
            successor = root;  // Potential successor
            root = root.Left;
        }
        else
        {
            root = root.Right;
        }
    }
    
    return successor;
}

public TreeNode InorderPredecessor(TreeNode root, TreeNode p)
{
    // Find largest node smaller than p
    TreeNode predecessor = null;
    
    while (root != null)
    {
        if (p.Val > root.Val)
        {
            predecessor = root;  // Potential predecessor
            root = root.Right;
        }
        else
        {
            root = root.Left;
        }
    }
    
    return predecessor;
}

// If node has reference to parent (TreeNode with Parent property)
public TreeNode SuccessorWithParent(TreeNode node)
{
    // Case 1: Node has right subtree → successor is min of right subtree
    // Case 2: No right subtree → go up until we're a left child
    if (node.Right != null)
    {
        // Go to right subtree, then go left as far as possible
        node = node.Right;
        while (node.Left != null)
            node = node.Left;
        return node;
    }
    
    // Go up until we're a left child (assuming Parent property exists)
    // while (node.Parent != null && node.Parent.Right == node)
    //     node = node.Parent;
    // return node.Parent;
    
    return null;  // Simplified version without parent reference
}

// Example:
//       20
//      /  \
//     8    22
//    / \
//   4  12
//     /  \
//    10  14
//
// Successor of 8: 10
// Successor of 14: 20
// Predecessor of 12: 10
```

---

## 📌 Convert Sorted Array to BST

```csharp
public TreeNode SortedArrayToBst(int[] nums)
{
    // LeetCode 108: Convert Sorted Array to BST
    // Create height-balanced BST
    TreeNode Build(int left, int right)
    {
        if (left > right) return null;
        
        // Choose middle element as root
        int mid = left + (right - left) / 2;
        
        var node = new TreeNode(nums[mid]);
        node.Left = Build(left, mid - 1);
        node.Right = Build(mid + 1, right);
        
        return node;
    }
    
    return Build(0, nums.Length - 1);
}

// Example:
// nums = [-10, -3, 0, 5, 9]
//
// Result:
//       0
//      / \
//    -3   9
//    /   /
//  -10  5
```

---

## 📌 Convert Sorted Linked List to BST

```csharp
public class ListNode
{
    public int Val;
    public ListNode Next;
    public ListNode(int val = 0, ListNode next = null)
    {
        Val = val;
        Next = next;
    }
}

public TreeNode SortedListToBst(ListNode head)
{
    // LeetCode 109: Convert Sorted List to BST
    // Use slow/fast pointer to find middle
    if (head == null) return null;
    if (head.Next == null) return new TreeNode(head.Val);
    
    // Find middle node (and node before it)
    ListNode prev = null;
    ListNode slow = head, fast = head;
    
    while (fast != null && fast.Next != null)
    {
        prev = slow;
        slow = slow.Next;
        fast = fast.Next.Next;
    }
    
    // slow is now middle node
    // Disconnect left half
    if (prev != null)
        prev.Next = null;
    
    // Create tree node
    var root = new TreeNode(slow.Val);
    
    // Recursively build subtrees
    root.Left = SortedListToBst(prev != null ? head : null);
    root.Right = SortedListToBst(slow.Next);
    
    return root;
}
```

---

## 📌 BST Iterator ⭐

```csharp
public class BSTIterator
{
    // LeetCode 173: Binary Search Tree Iterator
    // Implement iterator for inorder traversal
    
    private Stack<TreeNode> _stack = new();
    
    public BSTIterator(TreeNode root)
    {
        PushLeft(root);
    }
    
    private void PushLeft(TreeNode node)
    {
        // Push all left children onto stack
        while (node != null)
        {
            _stack.Push(node);
            node = node.Left;
        }
    }
    
    public int Next()
    {
        // Return next smallest element
        var node = _stack.Pop();
        
        // If node has right child, push its left path
        if (node.Right != null)
            PushLeft(node.Right);
        
        return node.Val;
    }
    
    public bool HasNext()
    {
        // Check if more elements exist
        return _stack.Count > 0;
    }
}

// Usage:
//       7
//      / \
//     3   15
//        /  \
//       9   20
//
// var iterator = new BSTIterator(root);
// iterator.Next()    // 3
// iterator.Next()    // 7
// iterator.HasNext() // true
// iterator.Next()    // 9
// iterator.Next()    // 15
// iterator.Next()    // 20
// iterator.HasNext() // false
```

---

## 📌 Find Mode in BST

```csharp
public int[] FindMode(TreeNode root)
{
    // LeetCode 501: Find Mode in Binary Search Tree
    // Find most frequent element(s) using O(1) extra space
    int maxCount = 0;
    int currentCount = 0;
    int? currentVal = null;
    var modes = new List<int>();
    
    void Inorder(TreeNode node)
    {
        if (node == null) return;
        
        Inorder(node.Left);
        
        // Process current node
        if (node.Val == currentVal)
        {
            currentCount++;
        }
        else
        {
            currentVal = node.Val;
            currentCount = 1;
        }
        
        if (currentCount > maxCount)
        {
            maxCount = currentCount;
            modes.Clear();
            modes.Add(node.Val);
        }
        else if (currentCount == maxCount)
        {
            modes.Add(node.Val);
        }
        
        Inorder(node.Right);
    }
    
    Inorder(root);
    return modes.ToArray();
}
```

---

## 🎯 BST Operations Summary

| Operation | Time (Balanced) | Time (Skewed) | Key Technique |
|-----------|-----------------|---------------|---------------|
| Search | O(log n) | O(n) | Go left/right based on comparison |
| Insert | O(log n) | O(n) | Find position, add as leaf |
| Delete | O(log n) | O(n) | Replace with successor/predecessor |
| Find Min | O(log n) | O(n) | Go left until null |
| Find Max | O(log n) | O(n) | Go right until null |
| Validate | O(n) | O(n) | Range checking or inorder |
| Kth Element | O(k + h) | O(k + h) | Inorder traversal |

---

## 🔥 Practice Problems

| Problem | LeetCode | Difficulty | Key Technique |
|---------|----------|------------|---------------|
| Search in BST | 700 | Easy | Binary search |
| Insert into BST | 701 | Medium | Find leaf position |
| Delete Node in BST | 450 | Medium | Three cases |
| Validate BST | 98 | Medium | Range or inorder |
| Kth Smallest | 230 | Medium | Inorder traversal |
| Inorder Successor | 285 | Medium | Go right or up |
| Sorted Array to BST | 108 | Easy | Divide and conquer |
| BST Iterator | 173 | Medium | Controlled stack |
| Two Sum BST | 653 | Easy | Two pointers or set |
| Recover BST | 99 | Medium | Find swapped nodes |
