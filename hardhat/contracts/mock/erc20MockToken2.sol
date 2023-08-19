// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenX is ERC20 {
    constructor() ERC20("TokenB", "TKB") {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
