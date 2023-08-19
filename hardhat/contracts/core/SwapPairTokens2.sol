// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "./SwapTokens.sol";
import "../interfaces/IERC20.sol";

contract SwapPairTokens2 is SwapTokens {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    // tracks the internal balances of the pool
    uint256 public reserve0;
    uint256 public reserve1;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint256 public kLast;

    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    // swap tokens
    function swap(
        address _tokenIn,
        uint256 _amountIn
    ) external returns (uint256 amountOut) {
        require(
            _tokenIn == address(token0) || _tokenIn == address(token1),
            "INVALID TOKEN"
        );
        require(_amountIn > 0, "INSUFFICIENT INPUT AMOUNT");

        bool isToken0 = _tokenIn == address(token0);

        // assigning the tokens to the correct variables
        (
            IERC20 tokenIn,
            IERC20 tokenOut,
            uint256 reserveIn,
            uint256 reserveOut
        ) = isToken0
                ? (token0, token1, reserve0, reserve1)
                : (token1, token0, reserve1, reserve0);

        // transferring the tokens from the sender to the contract
        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        // fee calculation of 0.3%
        uint256 _amountInWithFee = (_amountIn * 997) / 1000;

        /**
         * ydx / (x + dx) = dy
         * y = reserveOut, dy = _amountOut
         * x = reserveIn, dx = _amountInWithFee
         */
        amountOut =
            (reserveOut * _amountInWithFee) /
            (reserveIn + _amountInWithFee);

        // tokenOut transfer to the sender
        tokenOut.transfer(msg.sender, amountOut);

        // updating the reserves
        _update(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
    }

    function addLiquidity(
        uint256 _amount0,
        uint256 _amount1
    ) external returns (uint256 shares) {
        token0.transferFrom(msg.sender, address(this), _amount0);
        token1.transferFrom(msg.sender, address(this), _amount1);

        if (reserve0 > 0 || reserve1 > 0) {
            require(
                reserve0 * _amount1 == reserve1 * _amount0,
                "x / y != dx / dy"
            );
        }

        if (totalSupply == 0) {
            shares = _sqrt(_amount0 * _amount1);
        } else {
            // whichever value is the minimum will be the shares of (dx * T / x) or (dy * T / y
            shares = _min(
                (_amount0 * totalSupply) / reserve0,
                (_amount1 * totalSupply) / reserve1
            );
        }
    }

    function removeLiquidity(
        uint256 _shares
    ) external returns (uint256 amount0, uint256 amount1) {
        uint256 bal0 = token0.balanceOf(address(this));
        uint256 bal1 = token1.balanceOf(address(this));

        // calculating the amount of tokens to be transferred
        amount0 = (bal0 * _shares) / totalSupply;
        amount1 = (bal1 * _shares) / totalSupply;
        require(amount0 > 0 && amount1 > 0, "INSUFFICIENT LIQUIDITY");

        // burning the shares and updating the reserves
        _burn(msg.sender, _shares);
        _update(bal0 - amount0, bal1 - amount1);

        // transferring the tokens to the sender
        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);
    }

    // to update the reserver of the pool
    function _update(uint256 _reserve0, uint256 _reserve1) private {
        require(
            _reserve0 <= type(uint112).max && _reserve1 <= type(uint112).max,
            "OVERFLOW"
        );
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    // to calculate the square root of the number
    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    // to find the minimum of the two numbers
    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x = x <= y ? x : y;
    }
}
