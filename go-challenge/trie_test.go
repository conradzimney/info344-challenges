package main 

import (
    "testing"
     "github.com/conradzimney/challenges-conradzimney/go-challenge/trie"
)

// Trie for testing
var testTrie = trie.NewTrie()

// Should return a new Trie object
func TestNewTrie(t *testing.T) {
    newTrie := trie.NewTrie()
    if newTrie == nil {
        t.Error("Trie was not created...")
    }
}

// Should add a given word to the Trie
func TestAdd(t *testing.T) {
    words := []string{"animal", "bogus", "caracal", "dingus"}
    count := testTrie.GetItems()
    for _, word := range words {
        testTrie.Add(word)
        count++
    }
    if count != testTrie.GetItems() {
        t.Error("Trie did not load words properly")
    }
    testTrie = trie.NewTrie()
}

// Should return the correct number of items in the Trie
func TestGetItems(t *testing.T) {
    words := []string{"eggs", "feline", "giraffe", "hilltop"}
    count := testTrie.GetItems()
    for _, word := range words {
        testTrie.Add(word)
        count++
    }
    if count != testTrie.GetItems() {
        t.Error("Trie did not return the correct word count")
    }
    testTrie = trie.NewTrie()
}

// Should return maximum number of matches with the matching prefix
func TestFindMatches(t *testing.T) {
    words := []string{"igloo", "jaguar", "knife", "lobotomy"}
    for _, word := range words {
        testTrie.Add(word)
    }
    iMatches := testTrie.FindMatches("i", 5)
    jMatches := testTrie.FindMatches("j", 5)
    kMatches := testTrie.FindMatches("k", 5)
    lMatches := testTrie.FindMatches("l", 5)
    noMatches := testTrie.FindMatches("", 5)
    zeroMatches := testTrie.FindMatches("a", 5)
    if len(noMatches) != 0 || len(zeroMatches) != 0 {
        t.Error("Trie did not find correct matches for zero returning prefixes")
    } else if len(iMatches) != 1 || len(jMatches) != 1 || len(kMatches) != 1 || len(lMatches) != 1 {
        t.Error("Trie did not find correct matches for certain prefixes")
    }
}

