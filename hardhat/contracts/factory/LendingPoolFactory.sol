// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../core/LendingPool.sol";

contract LendingPoolFactory {
    address public feeProvider;
    address public feeToSetter;

    mapping(address => address) public getLendingPool;
    address[] public allLendingPools;

    event LendingPoolCreated(
        address indexed sender,
        address indexed pool,
        uint256 timestamp
    );

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPoolsLength() external view returns (uint256) {
        return allLendingPools.length;
    }

    function createPool(address _token) external returns (address) {
        require(_token != address(0), "INVALID_TOKEN_ADDRESS");
        require(getLendingPool[_token] == address(0), "LENDING_POOL_EXISTS");

        LendingPool pool = new LendingPool(_token);

        getLendingPool[_token] = address(pool);
        allLendingPools.push(address(pool));

        emit LendingPoolCreated(msg.sender, address(pool), block.timestamp);
        return address(pool);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "UNAUTHORIZED");
        feeToSetter = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "UNAUTHORIZED");
        feeToSetter = _feeToSetter;
    }
}
