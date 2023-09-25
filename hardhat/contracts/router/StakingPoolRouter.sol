// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../interfaces/IStakingPool.sol";
import "../interfaces/IStakingPoolFactory.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IWETH.sol";
import "../libraries/TransferHelper.sol";

contract StakingPoolRouter {
    address public immutable factory;
    address public immutable WETH;
    address public immutable rtoken;

    mapping(address => uint256) public getETHBalance;
    mapping(address => uint256) public stakedETH;

    constructor(address _factory, address _WETH, address _rtoken) {
        factory = _factory;
        WETH = _WETH;
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
        require(pool != address(0), "POOL_NOT_EXISTS");

        rewardAmount = IStakingPool(pool).rewardEarned(_user);
    }

    function getStaked(
        address _user,
        address _token
    ) public view returns (uint256 stakedAmount) {
        address pool = getPoolAddress(_token);

        stakedAmount = IStakingPool(pool).getStakedAmount(_user);
    }

    function stake(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);

        if (pool == address(0)) {
            createPool(_token);
            pool = getPoolAddress(_token);
        }

        require(pool != address(0), "POOL_NOT_EXIST");

        TransferHelper.safeTransferFrom(
            _token,
            msg.sender,
            address(this),
            _amount
        );

        IStakingPool(pool).stakeToken(_amount, msg.sender);
    }

    function withdraw(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "POOL_NOT_EXISTS");

        TransferHelper.safeTransfer(_token, msg.sender, _amount);

        IStakingPool(pool).withdrawToken(_amount, msg.sender);
    }

    function redeemReward(address _token) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "POOL_NOT_EXISTS");

        uint256 rewardAmount = getRewardEarned(_token, msg.sender);
        require(rewardAmount > 0, "NO_REWARD_TO_REDEEM");

        IStakingPool(pool).claimReward(msg.sender);
    }

    function stakeETH(uint256 _amount) public payable {
        address pool = getPoolAddress(WETH);

        require(pool != address(0), "POOL_NOT_EXIST");
        require(_amount > 0, "Must stake more than 0 ether");
        require(msg.value >= _amount, "Insufficient Ether sent");

        IWETH(WETH).deposit{value: _amount}();
        stakedETH[msg.sender] += _amount;

        IStakingPool(pool).stakeToken(_amount, msg.sender);
    }

    function withdrawEth(uint256 _amount) public {
        address pool = getPoolAddress(WETH);

        require(pool != address(0), "POOL_NOT_EXIST");
        require(stakedETH[msg.sender] >= _amount, "Not enough staked Ether");

        IStakingPool(pool).withdrawToken(_amount, msg.sender);
        stakedETH[msg.sender] -= _amount;

        IWETH(WETH).withdraw(_amount);
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Ether transfer failed");
    }

    function redeemRewardETH() public {
        redeemReward(WETH);
    }
}
