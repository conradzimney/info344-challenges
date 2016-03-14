package main 

import (
    "os"
    "log"
    "fmt"
    "runtime"
    "net/http"
    "encoding/json"
    "strings"
    "strconv"
    "github.com/conradzimney/challenges-conradzimney/go-challenge/trie"
)

// FileName is the default file name
var FileName = "wordsEn.txt"
// Memstats is the runtime memory statistics
var Memstats = new(runtime.MemStats)
// MyTrie creates the Trie object
var MyTrie = trie.NewTrie()
// Maximum number of words to return for suggestions
var Maximum = 20
// DoneLoading is boolean for whether or not the trie is finished loading
var DoneLoading = false
// Default port number
var port = "9000"

// Load loads the trie from the given file and sets DoneLoading to true
func Load(file *os.File) {
    MyTrie.LoadFromFile(file)
    DoneLoading = true
}

// Get and write the Memory Statistics that we desire
func getMemStats(w http.ResponseWriter, r *http.Request) {
    runtime.ReadMemStats(Memstats)
    allocStats := make(map[string]uint64)
    allocStats["alloc"] = Memstats.Alloc
    allocStats["totalAlloc"] = Memstats.TotalAlloc
    j, err := json.Marshal(allocStats)
    if nil != err {
        log.Println(err)
        w.WriteHeader(500)
        w.Write([]byte(err.Error()))
    } else {
        // Tell the client we are sending back JSON
        w.Header().Add("Content-Type", "application/json")
        w.Write(j)        
    }
}

// Find matching words in the trie, and write the suggestions to the client
func suggestions(w http.ResponseWriter, r *http.Request) {
    if !DoneLoading {
        w.WriteHeader(400)
        w.Write([]byte("Data is still loading. Please try again in a minute or so."))
        return
    }
    // Extract the query from the URL path
    url := r.URL.Path
    query := url[len("/api/v1/suggestions/q="):]
    // Find the prefix from the request
    var prefix string
    andIdx := strings.IndexRune(query, '&')
    prefix = query[:andIdx]
    // Find the maximum number of suggestions from the request
    i64, err := strconv.ParseInt(query[len(prefix) + len("&max="):], 10, 64)
    Maximum = int(i64)
    // Find the suggestions from the trie
    words := MyTrie.FindMatches(prefix, Maximum)
    // Convert the array of words to JSON and send them to the client
    if !DoneLoading {
        words[0] = "File is not done loading yet, please try again in a minute"
    }
    j, err := json.Marshal(words)
    if nil != err {
        log.Println(err)
        w.WriteHeader(500)
        w.Write([]byte(err.Error()))
    } else {
        w.Header().Add("Content-Type", "application/json")
        w.Write(j)        
    }
}

// Send the client the source file currently in use in order to determine the correct links on suggestions
func source(w http.ResponseWriter, r *http.Request) {
    var source [1]string
    if FileName == "wordsEn.txt" {
        source[0] = "words"
    } else if FileName == "enwiki-latest-all-titles-in-ns0" {
        source[0] = "wiki"
    } else {
        source[0] = FileName
    }
    fmt.Println(source)
    // Convert the array to JSON and send it to the client
    j, err := json.Marshal(source)
    if nil != err {
        log.Println(err)
        w.WriteHeader(500)
        w.Write([]byte(err.Error()))
    } else {
        w.Header().Add("Content-Type", "application/json")
        w.Write(j)        
    }
}

// check returns whether or not the data is done loading
func check(w http.ResponseWriter, r *http.Request) {
    var isDone [1]string
    if DoneLoading {
        isDone[0] = "true"
    } else {
        isDone[0] = "false"
    }
    // Convert the array to JSON and send it to the client
    j, err := json.Marshal(isDone)
    if nil != err {
        log.Println(err)
        w.WriteHeader(500)
        w.Write([]byte(err.Error()))
    } else {
        w.Header().Add("Content-Type", "application/json")
        w.Write(j)        
    }
}

// * * * * * * * * * * * * * * * * * ** * * * * * * * * * * * * * * * * * * * 
// MAIN EXECUTABLE ACCEPTS 2 COMMAND LINE ARGUMENTS:
// FIRST: FILENAME                  // IF NONE PROVIDED DEFAULT TO wordsEn.txt
// SECOND: PORT TO LISTEN ON        // IF NONE PROVIDED DEFAULT TO 9000
// * * * * * * * * * * * * * * * * * ** * * * * * * * * * * * * * * * * * * * 
// Main executable function, starts the server
func main() {
    file := chooseAndOpenFile()
    if nil == file {
        log.Fatal("Could not find file. Please select a different file.")
    } else {
        // Load the Trie with data from specified file name
        go Load(file)
        defer file.Close()
    }
    // Serve files from static directory
    http.Handle("/", http.FileServer(http.Dir("./static"))) 
    
    // Handle memstats request
    http.HandleFunc("/api/v1/memstats", getMemStats)
    
    // Handle suggestion request
    http.HandleFunc("/api/v1/suggestions/", suggestions)
    
    // Handle source request
    http.HandleFunc("/api/v1/source", source)
    
    // Handle check request
    http.HandleFunc("/api/v1/check", check)
    
    // Start the server
    if len(os.Args) > 2 {
        port = os.Args[2]
    } 
    fmt.Println("Server is listening on port " + port + "...")
    http.ListenAndServe(":" + port, nil)
}

// Asks for command line argument of file to load into the trie, and returns that file
func chooseAndOpenFile() *os.File {
    if len(os.Args) > 1 {
        FileName = os.Args[1]
    } else {
        fmt.Println("No file provided. Loading default file: " + FileName)
    }
    file, err := os.Open("word-files/" + FileName)
    if nil != err {
        log.Fatal(err)
        return nil
    } 
    return file
}