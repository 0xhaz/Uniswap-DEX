// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDT is ERC20 {
    uint256 _amount = 1000 ether;

    constructor() ERC20("Tether USD", "USDT") {
        _mint(msg.sender, 1000 * (10 ** decimals()));
    }

    function mint(address _to) external {
        _mint(_to, _amount);
    }
}
