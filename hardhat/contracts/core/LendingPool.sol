// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../interfaces/IERC20.sol";

// import "hardhat/console.sol";

error LendingPool__InvalidAmount();
error LendingPool__InvalidValue();
error LendingPool__InvalidUser();

contract LendingPool {
    IERC20 public token;
    address public immutable tokenAddress;
    uint256 totalPoolSupply;
    uint256 interestFactor;

    // @dev the rate earned by the lender per second
    uint256 lendRate = 100; // 100 / 10^18 = 0.0000000000000001% per second

    // @dev the rate paid by the borrower per second
    uint256 borrowRate = 130; // 130 / 10^18 = 0.00000000000000013% per second

    uint256 periodBorrowed;

    // @dev struct with amount and date of borrowing or lending
    struct Amount {
        uint256 amount;
        uint256 start;
    }

    // @dev mapping of user address that has lended
    mapping(address => Amount) public lendAmount;
    // mapping of interest earned by the lender
    mapping(address => uint256) public earnedInterest;

    // @dev arrays to store the info about lenders & borrowers
    mapping(address => bool) public lenders;
    mapping(address => bool) public borrowers;

    // @dev mapping to check if the address has borrowed any amount
    mapping(address => Amount) public borrowAmount;
    // @dev mapping of interest paid by the borrower
    mapping(address => uint256) public paidInterest;

    // @dev mapping of current total supply of the token
    mapping(address => uint256) private currentTotalSupply;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
        tokenAddress = _tokenAddress;

        uint256 tokenDecimals = token.decimals();
        // Calculate the dynamic factor for interest rate
        interestFactor = 10 ** tokenDecimals;
    }

    /**
     * @dev - to liquidate the amount
     * @param _liquidateAmount - amount to be liquidated
     */

    function liquidate(address _user, uint256 _liquidateAmount) public {
        if (!borrowers[_user]) revert LendingPool__InvalidUser();

        if (_liquidateAmount >= borrowAmount[_user].amount)
            revert LendingPool__InvalidAmount();

        uint256 _reward = (_liquidateAmount * 3) / 100;
        _updateBorrow(_user);

        borrowAmount[_user].amount -= _liquidateAmount + _reward;
    }

    /**
     * @dev - to lend the amount by adding liquidity
     * @param _amount - deposited amount
     */
    function deposit(uint256 _amount, address _user) external {
        if (_amount == 0) revert LendingPool__InvalidAmount();

        Amount storage userAmount = lendAmount[_user];

        userAmount.amount += _amount;

        if (userAmount.start == 0) {
            userAmount.start = block.timestamp;
        }

        lenders[_user] = true;

        /// @dev updating the total pool supply
        totalPoolSupply += _amount;
        _updateLend(_user);
        emit Deposit(_user, _amount);
    }

    /**
     * @dev - to borrow the amount
     * @param _amount - borrowed amount
     */

    function borrow(uint256 _amount, address _user) external {
        if (_amount == 0) revert LendingPool__InvalidAmount();

        if (_amount > totalPoolSupply / 10) revert LendingPool__InvalidValue();

        /// @dev updating the total pool supply
        borrowAmount[_user].amount = _amount;
        borrowAmount[_user].start = block.timestamp;
        totalPoolSupply -= _amount;

        borrowers[_user] = true;
        _updateBorrow(_user);
        emit Borrow(_user, _amount);
    }

    /**
     * @dev - to repay the amount
     * @param _repayAmount - amount to be repaid
     */
    function repay(address _user, uint256 _repayAmount) external {
        if (!borrowers[_user]) revert LendingPool__InvalidUser();

        uint256 _amount = _calculateRepayAmount(_user, _repayAmount);

        if (_amount == 0) revert LendingPool__InvalidAmount();

        /// @dev updating the total pool supply
        borrowAmount[_user].amount -= _amount;

        if (borrowAmount[_user].amount == 0) {
            borrowers[_user] = false;
        }

        totalPoolSupply += _amount;
        _updateBorrow(_user);
        emit Repay(_user, _repayAmount);
    }

    /**
     * @dev - to withdraw the amount
     * @param _withdrawAmount - amount to be withdrawn
     */
    function withdraw(address _user, uint256 _withdrawAmount) external {
        if (!lenders[_user]) revert LendingPool__InvalidUser();

        Amount storage userAmount = lendAmount[_user];

        /// @dev calculating the total amount with interest
        uint256 _amount = _calculateWithdrawAmount(_user, _withdrawAmount);
        // console.log(_amount);
        if (_amount == 0) revert LendingPool__InvalidAmount();

        userAmount.amount -= _amount;

        if (userAmount.amount == 0) {
            lenders[_user] = false;
        }

        /// @dev updating the total supply before transferring the tokens
        totalPoolSupply -= _amount;

        _updateLend(_user);
        emit Withdraw(_user, _withdrawAmount);
    }

    function getBorrowers(address _user) external view returns (uint256) {
        return borrowAmount[_user].amount;
    }

    function getBorrowRate() external view returns (uint256) {
        return borrowRate;
    }

    function _calculateRepayAmount(
        address _user,
        uint256 _repayAmount
    ) internal view returns (uint256 _amount) {
        /// @dev total amount to be repaid with interest
        Amount storage amount_ = borrowAmount[_user];

        require(_repayAmount <= amount_.amount, "Invalid amount");

        uint256 _interest = (_repayAmount *
            (((block.timestamp - amount_.start) * borrowRate) /
                interestFactor)) / totalPoolSupply;

        _amount = (_repayAmount + _interest);
    }

    function _calculateWithdrawAmount(
        address _user,
        uint256 _withdrawAmount
    ) internal view returns (uint256 amount) {
        Amount storage amount_ = lendAmount[_user];

        require(_withdrawAmount <= amount_.amount, "Invalid amount");

        uint256 elapsedTime = block.timestamp - amount_.start;

        uint256 interestEarned = (_withdrawAmount *
            elapsedTime *
            lendRate *
            interestFactor) / totalPoolSupply;

        amount = (_withdrawAmount + interestEarned);
    }

    function _updateBorrow(
        address _user
    ) internal returns (uint256 _interestAmount) {
        Amount storage amount_ = borrowAmount[_user];
        _interestAmount =
            (amount_.amount *
                ((block.timestamp - amount_.start) *
                    borrowRate *
                    interestFactor)) /
            totalPoolSupply;

        paidInterest[_user] = _interestAmount;
    }

    function _updateLend(
        address _user
    ) internal returns (uint256 _interestAmount) {
        Amount storage amount_ = lendAmount[_user];

        _interestAmount =
            (amount_.amount *
                ((block.timestamp - amount_.start) *
                    lendRate *
                    interestFactor)) /
            totalPoolSupply;

        earnedInterest[_user] = _interestAmount;
    }
}
