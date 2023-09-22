// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

interface IStakingPool {
    function rewardEarned(address _user) external view returns (uint256);

    function stakeToken(uint256 _amount, address _account) external;

    function withdrawToken(uint256 _amount, address _account) external;

    function totalSupply() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function redeemReward(address _user) external;

    function lastUpdateTime() external view returns (uint256);

    function getStakedAmount(address _user) external view returns (uint256);

    function claimReward(address _user) external;
}
