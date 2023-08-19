// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../core/StakingPool.sol";

contract StakingPoolFactory {
    address public feeTo;
    address public feeToSetter;
    address[] public allPools;

    mapping(address => mapping(address => address)) public getPool;

    event PoolCreated(address indexed token, address pool, uint256 timestamp);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    /**
     * @dev - Creates a new pool for the given token pair
     * @dev - assembly is used to create the pool contract with the CREATE2 opcode
     * @param _stakingToken - the token that will be staked
     * @param _rewardToken  - the token that will be rewarded
     * @return pool - the address of the pool that was created
     *
     */

    function createPool(
        address _stakingToken,
        address _rewardToken
    ) external returns (address pool) {
        require(
            getPool[_stakingToken][_rewardToken] == address(0),
            "StakingPoolFactory::createPool: Pool already exists"
        );
        bytes memory bytecode = type(StakingPool).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_stakingToken, _rewardToken));
        assembly {
            pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        StakingPool _pool = new StakingPool(_stakingToken, _rewardToken);

        getPool[_stakingToken][_rewardToken] = address(_pool);
        allPools.push(address(_pool));
        emit PoolCreated(_stakingToken, address(_pool), block.timestamp);

        return address(_pool);
    }

    function setFeeTo(address _feeTo) external {
        require(
            msg.sender == feeToSetter,
            "StakingPoolFactory::setFeeTo: FORBIDDEN"
        );
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(
            msg.sender == feeToSetter,
            "StakingPoolFactory::setFeeToSetter: FORBIDDEN"
        );
        feeToSetter = _feeToSetter;
    }
}
