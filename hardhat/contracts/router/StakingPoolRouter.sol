// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../interfaces/IStakingPool.sol";
import "../interfaces/IStakingPoolFactory.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IRToken.sol";
import "../libraries/TransferHelper.sol";

contract StakingPoolRouter {
    address public immutable factory;
    address public immutable WRTKN;
    address public immutable rtoken;

    constructor(address _factory, address _WRTKN, address _rtoken) {
        factory = _factory;
        WRTKN = _WRTKN;
        rtoken = _rtoken;
    }

    function getPoolAddress(address _token) public view returns (address pool) {
        pool = IStakingPoolFactory(factory).getPool(_token);
    }

    function getBalance(address _token) public view returns (uint256 balance) {
        balance = IERC20(_token).balanceOf(address(this));
    }

    function createPool(address sToken) public {
        address pool = getPoolAddress(sToken);
        require(pool == address(0), "POOL_EXISTS");

        IStakingPoolFactory(factory).createPool(sToken, rtoken);
    }

    function getRewardEarned(
        address _token,
        address _user
    ) public view returns (uint256 rewardAmount) {
        address pool = getPoolAddress(_token);

        rewardAmount = IStakingPool(pool).rewards(_user);
    }

    function getStaked(
        address _user,
        address _token
    ) public view returns (uint256 stakedAmount) {
        address pool = getPoolAddress(_token);

        stakedAmount = IStakingPool(pool).staked(_user);
    }

    function stake(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);

        if (pool != address(0)) {
            IStakingPool(pool).stake(_amount, msg.sender);
        } else {
            createPool(_token);
            IStakingPool(pool).stake(_amount, msg.sender);
        }
    }

    function withdraw(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "POOL_NOT_EXISTS");

        uint256 stakedAmount = getStaked(msg.sender, _token);
        require(stakedAmount >= _amount, "INSUFFICIENT_STAKED_AMOUNT");

        IStakingPool(pool).withdraw(_amount, msg.sender);
    }

    function redeemReward(address _token) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "POOL_NOT_EXISTS");

        uint256 rewardAmount = getRewardEarned(_token, msg.sender);
        require(rewardAmount > 0, "NO_REWARD_TO_REDEEM");

        IStakingPool(pool).redeemReward(msg.sender);
    }

    function stakeETH(uint256 _amount) public payable {
        require(msg.value == _amount, "INVALID_AMOUNT");

        IRToken(WRTKN).deposit{value: msg.value}();
        TransferHelper.safeTransfer(WRTKN, msg.sender, _amount);

        stake(WRTKN, _amount);
    }

    function withdrawETH(uint256 _amount) public {
        withdraw(WRTKN, _amount);

        TransferHelper.safeTransferFrom(
            WRTKN,
            msg.sender,
            address(this),
            _amount
        );

        IRToken(WRTKN).withdraw(_amount);

        TransferHelper.safeTransferETH(msg.sender, _amount);
    }

    function redeemRewardETH() public {
        redeemReward(WRTKN);
    }
}
