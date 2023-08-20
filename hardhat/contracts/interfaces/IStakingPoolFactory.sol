// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

interface IStakingPoolFactory {
    function getPool(address _token) external view returns (address);

    function allPools() external view returns (address[] memory);

    function allPoolsLength() external view returns (uint256);

    function createPool(
        address _token0,
        address _token1
    ) external returns (address);
}
