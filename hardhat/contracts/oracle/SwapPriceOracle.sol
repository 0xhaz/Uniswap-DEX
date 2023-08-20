// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../libraries/SwapLibrary.sol";
import "../interfaces/ISwapPairTokens.sol";

contract SwapPriceOracle {
    address public immutable factory;
    address public immutable WETH;

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    // returns the price of A with precision of B
    // A = price * ( B   )
    function getPriceA(
        address _tokenA,
        address _tokenB
    ) public view returns (uint256 priceA) {
        address pair = SwapLibrary.pairFor(factory, _tokenA, _tokenB);

        (uint reserveA, uint reserveB, uint timestamp) = ISwapPairTokens(pair)
            .getReserves();
        priceA = (reserveB / reserveA);
    }

    function getPriceB(
        address _tokenA,
        address _tokenB
    ) public view returns (uint256 priceB) {
        address pair = SwapLibrary.pairFor(factory, _tokenA, _tokenB);

        (uint reserveA, uint reserveB, uint timestamp) = ISwapPairTokens(pair)
            .getReserves();
        priceB = (reserveA / reserveB);
    }
}
