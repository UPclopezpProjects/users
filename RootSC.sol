pragma solidity ^0.6.2;

contract RootSC{
    address root;
    mapping (address=> address) admors;

    constructor() public{
        root = msg.sender;
    }

    function addAdmor(address k) public{
        require(msg.sender == root);
        admors[k] = k;
    }
    
}
