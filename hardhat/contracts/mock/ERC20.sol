// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../tokens/TokenV2.sol";

contract MockERC20 is TokenV2 {
    constructor(uint256 totalSupply) {
        _mint(msg.sender, totalSupply);
    }
}
