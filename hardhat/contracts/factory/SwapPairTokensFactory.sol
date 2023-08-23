// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../core/SwapPairTokens.sol";

contract SwapPairTokensFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256
    );

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        require(
            tokenA != tokenB,
            "SwapPairTokensFactory::createPair: IDENTICAL_ADDRESSES"
        );
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(
            tokenA != address(0),
            "SwapPairTokensFactory::createPair: ZERO_ADDRESS"
        );
        require(
            getPair[token0][token1] == address(0),
            "SwapPairTokensFactory::createPair: PAIR_EXISTS"
        ); // single check is sufficient
        bytes memory bytecode = type(SwapPairTokens).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        SwapPairTokens(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(
            msg.sender == feeToSetter,
            "SwapPairTokensFactory::setFeeTo: FORBIDDEN"
        );
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(
            msg.sender == feeToSetter,
            "SwapPairTokensFactory::setFeeToSetter: FORBIDDEN"
        );
        feeToSetter = _feeToSetter;
    }
}
