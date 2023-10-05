// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../interfaces/ILendingPool.sol";
import "../interfaces/ILendingPoolFactory.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IWETH.sol";
import "../libraries/TransferHelper.sol";

contract LendingPoolRouter {
    address public immutable factory;
    address public immutable WETH;

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    function getPoolAddress(address _token) public view returns (address pool) {
        pool = ILendingPoolFactory(factory).getLendingPool(_token);
    }

    function getBalance(address _token) public view returns (uint256 balance) {
        balance = IERC20(_token).balanceOf(address(this));
    }

    function createPool(address _token) public {
        address pool = getPoolAddress(_token);
        require(pool == address(0), "Pool exists");

        ILendingPoolFactory(factory).createPool(_token);
    }

    function depositToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);

        if (pool == address(0)) {
            createPool(_token);
            pool = getPoolAddress(_token);
        }

        require(pool != address(0), "Pool does not exist");

        TransferHelper.safeTransferFrom(
            _token,
            msg.sender,
            address(this),
            _amount
        );

        ILendingPool(pool).deposit(_amount, msg.sender);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        require(
            ILendingPool(pool).lendAmount(msg.sender) > 0,
            "No amount to withdraw"
        );

        TransferHelper.safeTransfer(_token, msg.sender, _amount);

        ILendingPool(pool).withdraw(msg.sender, _amount);
    }

    function borrowToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        TransferHelper.safeTransfer(_token, msg.sender, _amount);

        ILendingPool(pool).borrow(_amount, msg.sender);
    }

    function repayToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        require(_amount > 0, "Invalid Amount");

        ILendingPool(pool).repay(msg.sender, _amount);
    }

    function depositETH(uint256 _amount) public payable {
        require(_amount == msg.value, "Invalid amount");

        address pool = getPoolAddress(WETH);

        IWETH(WETH).deposit{value: msg.value}();
        TransferHelper.safeTransfer(WETH, pool, msg.value);
    }

    function withdrawETH(uint256 _amount) public {
        address pool = getPoolAddress(WETH);
        require(pool != address(0), "Pool does not exist");

        ILendingPool(pool).withdraw(msg.sender, _amount);

        IWETH(WETH).transferFrom(msg.sender, address(this), _amount);
        IWETH(WETH).withdraw(_amount);

        TransferHelper.safeTransferETH(msg.sender, _amount);
    }

    function borrowETH(uint256 _amount) public {
        address pool = getPoolAddress(WETH);
        require(pool != address(0), "Pool does not exist");

        ILendingPool(pool).borrow(_amount, msg.sender);

        IWETH(WETH).approve(address(this), _amount);
        IWETH(WETH).transferFrom(address(this), msg.sender, _amount);

        IWETH(WETH).withdraw(_amount);

        TransferHelper.safeTransferETH(msg.sender, _amount);
    }

    function repayETH(uint256 _amount) public payable {
        address pool = getPoolAddress(WETH);
        require(pool != address(0), "Pool does not exist");

        IWETH(WETH).deposit{value: msg.value}();
        TransferHelper.safeTransfer(WETH, msg.sender, _amount);

        ILendingPool(pool).repay(msg.sender, _amount);

        if (msg.value > _amount) {
            TransferHelper.safeTransferETH(msg.sender, msg.value - _amount);
        }
    }

    function getRepayAmount(
        address _token,
        address _user,
        uint256 _repayAmount
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);

        amount = ILendingPool(pool).calculateRepayAmount(_user, _repayAmount);
    }

    function getLendAmount(
        address _token,
        address _user
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        amount = ILendingPool(pool).lendAmount(_user);
    }

    function getTotalLendAmount(
        address _token
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        amount = ILendingPool(pool).getCurrentTotalSupply();
    }

    function getBorrowAmount(
        address _token,
        address _user
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        amount = ILendingPool(pool).borrowAmount(_user);
    }
}
