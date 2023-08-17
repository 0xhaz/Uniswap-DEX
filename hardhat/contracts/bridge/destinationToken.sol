// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract WrappedStackDollars is ERC20, ERC20Burnable {
    address bridge;

    constructor(address _bridge) ERC20("WrappedStackDollars", "WSD") {
        bridge = _bridge;
    }

    modifier onlyBridge() {
        require(bridge == msg.sender, "WrappedToken: caller is not the bridge");
        _;
    }

    // @dev called from the bridge when tokens are locked on ETH side
    function mint(address _recipient, uint _amount) public virtual onlyBridge {
        _mint(_recipient, _amount);
    }

    // @dev called from the bridge when tokens are received
    function burnFrom(
        address _account,
        uint _amount
    ) public virtual override(ERC20Burnable) onlyBridge {
        super.burnFrom(_account, _amount);
    }
}
