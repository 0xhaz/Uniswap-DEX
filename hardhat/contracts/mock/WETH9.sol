// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

contract WETH9 {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Deposit(address indexed _owner, uint256 _value);

    event Withdrawal(address indexed _owner, uint256 _value);

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 _amount) public {
        require(balanceOf[msg.sender] >= _amount);
        balanceOf[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit Withdrawal(msg.sender, _amount);
    }

    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    function approve(address _owner, uint256 _amount) public returns (bool) {
        allowance[msg.sender][_owner] = _amount;
        emit Approval(msg.sender, _owner, _amount);
        return true;
    }

    function transfer(address _owner, uint256 _amount) public returns (bool) {
        return transferFrom(msg.sender, _owner, _amount);
    }

    function transferFrom(
        address _owner,
        address _to,
        uint256 _amount
    ) public returns (bool) {
        require(balanceOf[_owner] >= _amount);
        if (
            _owner != msg.sender &&
            allowance[_owner][msg.sender] != type(uint256).max
        ) {
            require(allowance[_owner][msg.sender] >= _amount);
            allowance[_owner][msg.sender] -= _amount;
        }

        balanceOf[_owner] -= _amount;
        balanceOf[_to] += _amount;

        emit Transfer(_owner, _to, _amount);

        return true;
    }
}
