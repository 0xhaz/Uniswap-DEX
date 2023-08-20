// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../interfaces/ILendingPool.sol";
import "../interfaces/ILendingPoolFactory.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IRToken.sol";
import "../libraries/TransferHelper.sol";

contract LendingPoolRouter {
    address public immutable factory;
    address public immutable WRTKN;

    constructor(address _factory, address _WRTKN) {
        factory = _factory;
        WRTKN = _WRTKN;
    }

    function getPoolAddress(address _token) public view returns (address pool) {
        pool = ILendingPoolFactory(factory).getPool(_token);
    }

    function getBalance(address _token) public view returns (uint256 balance) {
        balance = IERC20(_token).balanceOf(address(this));
    }

    function createPool(address _token) public {
        ILendingPoolFactory(factory).createPool(_token);
    }

    function getRepayAmount(
        address _token,
        address _user,
        uint256 repayAmount
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);

        amount = ILendingPool(pool).calculateRepayAmount(_user, repayAmount);
    }

    function getWithdrawAmount(
        address _token,
        address _user,
        uint256 withdrawAmount
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);

        amount = ILendingPool(pool).calculateWithdrawAmount(
            _user,
            withdrawAmount
        );
    }

    function depositToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);

        if (pool != address(0)) {
            ILendingPool(pool).deposit(_amount, msg.sender);
        } else {
            createPool(_token);
            pool = getPoolAddress(_token);

            ILendingPool(pool).deposit(_amount, msg.sender);
        }
    }

    function withdrawToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        require(
            ILendingPool(pool).lendAmount(msg.sender).amount > 0,
            "No amount to withdraw"
        );

        ILendingPool(pool).withdraw(msg.sender, _amount);
    }

    function borrowToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        ILendingPool(pool).borrow(_amount, msg.sender);
    }

    function repayToken(address _token, uint256 _amount) public {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        uint256 totalAmount = getRepayAmount(_token, msg.sender, _amount);

        ILendingPool(pool).repay(msg.sender, totalAmount);
    }

    function depositETH(uint256 _amount) public payable {
        require(_amount == msg.value, "Invalid amount");

        address pool = getPoolAddress(WRTKN);

        IRToken(WRTKN).deposit{value: msg.value}();
        TransferHelper.safeTransfer(WRTKN, pool, msg.value);
    }

    function withdrawETH(uint256 _amount) public {
        address pool = getPoolAddress(WRTKN);
        require(pool != address(0), "Pool does not exist");

        uint256 totalAmount = getWithdrawAmount(WRTKN, msg.sender, _amount);
        ILendingPool(pool).withdraw(msg.sender, _amount);

        IRToken(WRTKN).transferFrom(msg.sender, address(this), totalAmount);
        IRToken(WRTKN).withdraw(totalAmount);

        TransferHelper.safeTransferETH(msg.sender, _amount);
    }

    function borrowETH(uint256 _amount) public {
        address pool = getPoolAddress(WRTKN);
        require(pool != address(0), "Pool does not exist");

        ILendingPool(pool).borrow(_amount, msg.sender);

        IRToken(WRTKN).approve(address(this), _amount);
        IRToken(WRTKN).transferFrom(address(this), msg.sender, _amount);

        IRToken(WRTKN).withdraw(_amount);

        TransferHelper.safeTransferETH(msg.sender, _amount);
    }

    function repayETH(uint256 _amount) public payable {
        address pool = getPoolAddress(WRTKN);
        require(pool != address(0), "Pool does not exist");

        uint256 totalAmount = getRepayAmount(WRTKN, msg.sender, _amount);

        require(msg.value >= totalAmount, "Invalid amount");

        IRToken(WRTKN).deposit{value: msg.value}();
        TransferHelper.safeTransfer(WRTKN, msg.sender, totalAmount);

        ILendingPool(pool).repay(msg.sender, _amount);

        if (msg.value > totalAmount) {
            TransferHelper.safeTransferETH(msg.sender, msg.value - totalAmount);
        }
    }

    function getLendAmount(
        address _token,
        address _user
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        amount = ILendingPool(pool).lendAmount(_user).amount;
    }

    function getBorrowAmount(
        address _token,
        address _user
    ) public view returns (uint256 amount) {
        address pool = getPoolAddress(_token);
        require(pool != address(0), "Pool does not exist");

        amount = ILendingPool(pool).borrowAmount(_user).amount;
    }
}
