// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

contract UserStorageData {
    struct Transaction {
        address caller;
        address poolAddress;
        address tokenAddress0;
        address tokenAddress1;
    }

    Transaction[] transactions;

    function addToBlockchain(
        address _poolAddress,
        address _tokenAddress0,
        address _tokenAddress1
    ) public {
        transactions.push(
            Transaction(
                msg.sender,
                _poolAddress,
                _tokenAddress0,
                _tokenAddress1
            )
        );
    }

    function getAllTransactions() public view returns (Transaction[] memory) {
        return transactions;
    }
}
