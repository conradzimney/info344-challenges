<?php 

class Movies {
    protected $conn; 
    
    // Class constructor 
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    // Search function to query the database for titles that include parameter $q
    public function search($q) { 
        if ($q == '') {
            $sql = 'select * from movie order by gross desc';
            $stmt = $this->conn->prepare($sql);
            $success = $stmt->execute(array());
        } else {
            $sql = 'select * from movie where title like \'%' . $q . '%\' order by gross desc'; 
            $stmt = $this->conn->prepare($sql);
            $success = $stmt->execute(array());   
        }
        if (!$success) {
            var_dump($stmt->errorInfo());
            return false;
        } else {
            return $stmt->fetchAll();
        }
    }
    
    // Selection function used for returning the unique movie with primary key $q form database
    public function select($q) {
        $sql = 'select * from movie where ID = \'' . $q . '\'';
        $stmt = $this->conn->prepare($sql);
        $success = $stmt->execute(array($q));
        if (!$success) {
            var_dump($stmt->errorInfo());
            return false;
        } else {
            return $stmt->fetchAll();
        }
    }
}

?>