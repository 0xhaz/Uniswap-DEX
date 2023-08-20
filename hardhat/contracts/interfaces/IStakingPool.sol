// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

interface IStakingPool {
    function staked(address _user) external view returns (uint256);

    function earned(address _user) external view returns (uint256);

    function stake(uint256 _amount) external;

    function withdraw(uint256 _amount) external;

    function rewards(address _user) external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function redeemReward(address _user) external;
}
