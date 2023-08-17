// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WETH is ERC20, Ownable {
    address public approved;

    constructor(address bridge) ERC20("Wrapped Ether", "WETH") {
        approved = bridge;
    }

    modifier onlyApproved() {
        require(msg.sender == approved, "Not Athourized");
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
}
