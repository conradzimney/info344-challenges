package node

// Node struct. These are the nodes of the Trie
type Node struct {
    Value string
    IsEntry bool
    Children map[string]*Node
}

// NewNode return a pointer to new Node with given value
func NewNode(value string, isEntry bool) *Node {
    return &Node{Value: value, IsEntry: isEntry, Children: make(map[string]*Node)}
}