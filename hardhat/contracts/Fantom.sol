// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Fantom is ERC20 {
    constructor() ERC20("Fantom", "FTM") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
