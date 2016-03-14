package trie

import (
    "io"
    "os"
    "bufio"
    "log"
    "fmt"
    "strings"
    "sort"
    "runtime"
    "github.com/conradzimney/challenges-conradzimney/go-challenge/node"
)

var memstats = new(runtime.MemStats)

// Trie struct. This is the underlying data structure
type Trie struct {
    Root *node.Node
    NumberOfEntries int
}

// NewTrie return a pointer to new Trie with an initialized root Branch
func NewTrie() *Trie {
    return &Trie{Root: node.NewNode("*", false)}
}

// Add adds a string entry to an existing trie object 
func (t *Trie) Add(entry string) {
    t.NumberOfEntries++
    t.addHelper(t.Root, entry)
}

// addHelper is the recursive helper function for Add function
func (t *Trie) addHelper(currentNode *node.Node, entry string) {
    if len(entry) != 0 {
        charToAdd := entry[0:1]
        rest := entry[1:]
        var isEntry bool 
        if len(rest) == 0 {
            isEntry = true
        } else {
            isEntry = false
        }
        currentMap := currentNode.Children
        currentMapHasKey := false
        for key := range currentMap {
            if key == charToAdd {
                // key already exists in the children map
                currentMapHasKey = true
                t.addHelper(currentMap[key], rest)
            }
        }
        if !currentMapHasKey {
            // key does not yet exist in the children map
            currentMap[charToAdd] = node.NewNode(charToAdd, isEntry)
            t.addHelper(currentMap[charToAdd], rest)
        }  
    } 
}

// GetItems returns the number of existing items in the trie
func (t *Trie) GetItems() int {
    return t.NumberOfEntries
}

// FindMatches finds up to max number of matches in the trie for a given prefix
func (t *Trie) FindMatches(prefix string, max int) []string {
    var matches []string 
    if prefix == "" {
        return matches
    }
    prefix = strings.ToLower(prefix)
    prefixNode := t.findPrefixStart(prefix, t.Root)
    if prefixNode == nil {
        return matches
    }
    if prefixNode.IsEntry {
        matches = append(matches, prefix)
    }
    prefixMap := prefixNode.Children
    for _, nodeToFollow := range prefixMap {
        wordsToAdd := t.findPrefixWords(prefix, len(matches), max, nodeToFollow)
        sort.Strings(wordsToAdd)
        for _, word := range wordsToAdd {
            matches = append(matches, word)
        }
    }
    sort.Strings(matches)
    return matches
}

// findPrefixStart is a recursive function for FindMatches that returns the starting prefix node
func (t *Trie) findPrefixStart(prefix string, currentNode *node.Node) *node.Node {
    if len(prefix) != 0 {
        letterToFollow := prefix[0:1]
        restOfPrefix := prefix[1:]
        currentMap := currentNode.Children
        return t.findPrefixStart(restOfPrefix, currentMap[letterToFollow])
    }
    return currentNode
}

// findPrefixWords helper function for FindMatches that returns an array of strings of words matching the given prefix
func (t *Trie) findPrefixWords(prefix string, currNum int, max int, currNode *node.Node) (words []string) {
    if currNode != nil {
        workingPhrase := prefix + currNode.Value
        if currNode.IsEntry && (currNum < max) {
            words = append(words, workingPhrase)
            currNum++
        }
        currMap := currNode.Children
        alphabet := "abcdefghijklmnopqrstuvwxyz"
        for i := 0; i < len(alphabet); i++ {
            wordsToAdd := t.findPrefixWords(workingPhrase, currNum, max, currMap[string(alphabet[i:i+1])])
            sort.Strings(wordsToAdd)
            for _, word := range wordsToAdd {
                if currNum < max {
                    words = append(words, word)
                    currNum++
                }
            }
        }
    }
    sort.Strings(words)
    return words
}

// LoadFromFile loads a new trie object from a file that has one entry per line
func (t *Trie) LoadFromFile(file *os.File) {
    r := io.Reader(file)
    t.Load(r)
}

// Load loads a new trie object from a reader stream that has one entry per line
func (t *Trie) Load(r io.Reader) {
    reader := bufio.NewReader(r)
    for {
        line, _, err := reader.ReadLine()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatal(err)
        }
        if t.GetItems() % 1000 == 0 {          // Check our memory every 10000 entries we add
            runtime.ReadMemStats(memstats)
            allocStats := make(map[string]uint64)
            allocStats["alloc"] = memstats.Alloc
            allocStats["totalAlloc"] = memstats.TotalAlloc
            // If we are at less then 900 megabytes of total memory, add the string again, otherwise break and stop adding words
            if allocStats["totalAlloc"] < 90000000 {
                // Load lowercase version of line into the trie
                t.Add(strings.ToLower(string(line)))
            } else {
                break
            }
        } else {                                // If we aren't checking memory, just add the next entry
            // Load lowercase version of line into the trie
            t.Add(strings.ToLower(string(line)))
        }
    }
}

// * * * * * * * * * * * * * * * * * ** * * * * * * * * * * * * * * * * * * * 
// * * * * * * * * * * * * * * FOR TESTING * * * * * * * * * * * * * * * * * *
// * * * * * * * * * * * * * * * * * ** * * * * * * * * * * * * * * * * * * * 

// PrintTrie prints a string representation of a the trie
func (t *Trie) PrintTrie()  {
    t.printHelper(t.Root)
}

// printHelper is the recursive helpder method for printing the trie
func (t *Trie) printHelper(currentNode *node.Node) {
    if currentNode != nil {
        fmt.Print(currentNode.Value + ": ")
        currentMap := currentNode.Children
        for key := range currentMap {
            fmt.Print(key + ", ")
        }
        fmt.Println()
        for key := range currentMap {
            t.printHelper(currentMap[key])
        }
    }   
}