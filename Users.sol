pragma solidity ^0.6.2;

contract RootSC{
    address root;
    mapping (address=> User) users;
    mapping (address=> bool) exists;

    constructor() public{
        root = msg.sender;
        addUser(msg.sender,"Root");
        exists[msg.sender] = true;
    }

    function addUser(address k, string memory tUser) private{
        User userN = new User(k,tUser);
        users[k] = userN;
    }    

    function addAdmor(address k) public{
        require(msg.sender == root);//we enforce the root to be the executor
        require(exists[k]==false);
        addUser(k,"Admor");
        exists[k] = true;
        
    }
    
    function getTypeUser(address k) view public returns (string memory){
        User userN = users[k];
        //require(userN.getType()!="");
        string memory regreso = userN.getType();
        return regreso;        
    }

}

contract User{
    address user;
    string typeUser;
    
    constructor(address k,string memory typeU) public{
        user = k;
        typeUser = typeU;
    }

    function getType() view public returns (string memory){
        return typeUser;
    }    
}
