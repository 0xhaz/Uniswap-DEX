// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WETH is ERC20, Ownable {
    address public approved;

    event Deposit(address indexed account, uint256 amount);
    event Withdraw(address indexed account, uint256 amount);

    constructor() ERC20("Wrapped Ether", "WETH") {}

    modifier onlyApproved() {
        require(msg.sender == approved, "Not Authorized");
        _;
    }

    function mint(address _to, uint _amount) public onlyApproved {
        _mint(_to, _amount);
    }

    function burn(address _to, uint _amount) public onlyApproved {
        _burn(_to, _amount);
    }

    function setApproved(address _approved) public onlyOwner {
        approved = _approved;
    }

    function deposit() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 _amount) external {
        require(balanceOf(msg.sender) >= _amount, "Insufficient Balance");
        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(_amount);
        emit Withdraw(msg.sender, _amount);
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    fallback() external payable {}
}
