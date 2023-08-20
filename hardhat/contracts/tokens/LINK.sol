// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Link is ERC20 {
    constructor() ERC20("ChainLink Token", "LINK") {
        _mint(msg.sender, 1000 * (10 ** decimals()));
    }
}
