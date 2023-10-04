// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

interface ILendingPool {
    function lendAmount(address _user) external view returns (uint256);

    function earnedInterest(address _user) external view returns (uint256);

    function borrowAmount(address _user) external view returns (uint256);

    function paidInterest(address user) external view returns (uint256);

    function lenders(address _user) external view returns (bool);

    function borrowers(address _user) external view returns (bool);

    function deposit(uint256 _amount, address _user) external;

    function borrow(uint256 _amount, address _user) external;

    function repay(address _user, uint256 _amount) external;

    function withdraw(address _user, uint256 _amount) external;

    function liquidate(address _user, uint256 _amount) external;

    function getCurrentTotalSupply() external view returns (uint256);

    function calculateRepayAmount(
        address _user,
        uint256 _amount
    ) external view returns (uint256);

    function calculateWithdrawAmount(
        address _user,
        uint256 _amount
    ) external view returns (uint256);
}
