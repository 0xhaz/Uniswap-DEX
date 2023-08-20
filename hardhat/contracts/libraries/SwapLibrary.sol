// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../interfaces/ISwapPairTokens.sol";
import "../interfaces/ISwapFactory.sol";
import "../libraries/safeMath.sol";

library SwapLibrary {
    using SafeMath for uint256;

    function sortTokens(
        address _tokenA,
        address _tokenB
    ) internal pure returns (address token0, address token1) {
        require(_tokenA != _tokenB, "SwapLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = _tokenA < _tokenB
            ? (_tokenA, _tokenB)
            : (_tokenB, _tokenA);
        require(token0 != address(0), "SwapLibrary: ZERO_ADDRESS");
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(
        address _factory,
        address _tokenA,
        address _tokenB
    ) internal view returns (address pair) {
        (address token0, address token1) = sortTokens(_tokenA, _tokenB);
        pair = ISwapFactory(_factory).getPair(token0, token1);
    }

    // fetches and sorts the reserves for a pair
    function getReserves(
        address _factory,
        address _tokenA,
        address _tokenB
    ) internal view returns (uint256 reserveA, uint256 reserveB) {
        (address token0, ) = sortTokens(_tokenA, _tokenB);
        (uint256 reserve0, uint256 reserve1, ) = ISwapPairTokens(
            pairFor(_factory, _tokenA, _tokenB)
        ).getReserves();
        (reserveA, reserveB) = _tokenA == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of other asset
    function quote(
        uint256 _amountA,
        uint256 _reserveA,
        uint256 _reserveB
    ) internal pure returns (uint256 amountB) {
        require(_amountA > 0, "SwapLibrary: INSUFFICIENT_AMOUNT");
        require(
            _reserveA > 0 && _reserveB > 0,
            "SwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
        amountB = _amountA.mul(_reserveB) / _reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 _amountIn,
        uint256 _reserveIn,
        uint256 _reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(_amountIn > 0, "SwapLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(
            _reserveIn > 0 && _reserveOut > 0,
            "SwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
        uint256 amountInWithFee = _amountIn.mul(997);
        uint256 numerator = amountInWithFee.mul(_reserveOut);
        uint256 denominator = _reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(
        uint256 _amountOut,
        uint256 _reserveIn,
        uint256 _reserveOut
    ) internal pure returns (uint256 amountIn) {
        require(_amountOut > 0, "SwapLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
        require(
            _reserveIn > 0 && _reserveOut > 0,
            "SwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
        uint256 numerator = _reserveIn.mul(_amountOut).mul(1000);
        uint256 denominator = _reserveOut.sub(_amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(
        address _factory,
        uint256 _amountIn,
        address[] memory _path
    ) internal view returns (uint256[] memory amounts) {
        require(_path.length >= 2, "SwapLibrary: INVALID_PATH");
        amounts = new uint256[](_path.length);
        amounts[0] = _amountIn;
        for (uint256 i; i < _path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(
                _factory,
                _path[i],
                _path[i + 1]
            );
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsIn(
        address _factory,
        uint256 _amountOut,
        address[] memory _path
    ) internal view returns (uint256[] memory amounts) {
        require(_path.length >= 2, "SwapLibrary: INVALID_PATH");
        amounts = new uint256[](_path.length);
        amounts[amounts.length - 1] = _amountOut;
        for (uint256 i = _path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(
                _factory,
                _path[i - 1],
                _path[i]
            );
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}
