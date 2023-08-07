// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

interface IERC20 {
    function symbol() external view returns (string memory);

    function approve(address, uint256) external;

    function balanceOf(address) external returns (uint256);

    function transfer(address, uint256) external;

    function transferFrom(address, address, uint256) external;
}
