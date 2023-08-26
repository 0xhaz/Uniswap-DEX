// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1000 * (10 ** decimals()));
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
