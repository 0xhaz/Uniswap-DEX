// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../libraries/SwapLibrary.sol";
import "../libraries/TransferHelper.sol";
import "../libraries/safeMath.sol";
import "../interfaces/ISwapFactory.sol";
import "../interfaces/ISwapPairTokens.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IWETH.sol";
import "../interfaces/IRToken.sol";

contract SwapRouter {
    using SafeMath for uint256;

    address public immutable factory;
    address public immutable WETH;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "EXPIRED");
        _;
    }

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {
        assert(msg.sender == WETH);
        // only accept ETH via fallback from the WETH contract
    }

    function getLiquidityAmount(
        address _user,
        address _tokenA,
        address _tokenB
    ) public view returns (uint256 liquidityAmount) {
        address pair = ISwapFactory(factory).getPair(_tokenA, _tokenB);
        liquidityAmount = ISwapPairTokens(pair).balanceOf(_user);
    }

    /**
     * @dev Add liquidity to a pool
     * @param _tokenA - the first token of the pair
     * @param _tokenB - the second token of the pair
     * @param _amountAMin - the minimum amount of the first token to add as liquidity
     * @param _amountBMin - the minimum amount of the second token to add as liquidity
     * @param _amountADesired - the desired amount of the first token to add as liquidity
     * @param _amountBDesired - the desired amount of the second token to add as liquidity
     */
    function _addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountADesired,
        uint256 _amountBDesired,
        uint256 _amountAMin,
        uint256 _amountBMin
    ) internal virtual returns (uint256 amountA, uint256 amountB) {
        if (ISwapFactory(factory).getPair(_tokenA, _tokenB) == address(0)) {
            ISwapFactory(factory).createPair(_tokenA, _tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = SwapLibrary.getReserves(
            factory,
            _tokenA,
            _tokenB
        );

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (_amountADesired, _amountBDesired);
        } else {
            uint256 amountBOptimal = SwapLibrary.quote(
                _amountADesired,
                reserveA,
                reserveB
            );
            if (amountBOptimal <= _amountBDesired) {
                require(amountBOptimal >= _amountBMin, "INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (_amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = SwapLibrary.quote(
                    _amountBDesired,
                    reserveB,
                    reserveA
                );
                assert(amountAOptimal <= _amountADesired);
                require(amountAOptimal >= _amountAMin, "INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, _amountBDesired);
            }
        }
    }

    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountADesired,
        uint256 _amountBDesired,
        uint256 _amountAMin,
        uint256 _amountBMin,
        address _to,
        uint256 _deadline
    )
        external
        virtual
        ensure(_deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        (amountA, amountB) = _addLiquidity(
            _tokenA,
            _tokenB,
            _amountADesired,
            _amountBDesired,
            _amountAMin,
            _amountBMin
        );

        address pair = SwapLibrary.pairFor(factory, _tokenA, _tokenB);
        TransferHelper.safeTransferFrom(_tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(_tokenB, msg.sender, pair, amountB);
        liquidity = ISwapPairTokens(pair).mint(_to);
    }

    function addLiquidityETH(
        address _token,
        uint256 _amountTokenDesired,
        uint256 _amountTokenMin,
        uint256 _amountETHMin,
        address _to,
        uint256 _deadline
    )
        external
        payable
        virtual
        ensure(_deadline)
        returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
    {
        (amountToken, amountETH) = _addLiquidity(
            _token,
            WETH,
            _amountTokenDesired,
            msg.value,
            _amountTokenMin,
            _amountETHMin
        );
        address pair = SwapLibrary.pairFor(factory, _token, WETH);
        TransferHelper.safeTransferFrom(_token, msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = ISwapPairTokens(pair).mint(_to);
        if (msg.value > amountETH) {
            TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
        }
    }

    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _liquidity,
        uint256 _amountAMin,
        uint256 _amountBMin,
        address _to,
        uint256 _deadline
    )
        public
        virtual
        ensure(_deadline)
        returns (uint256 amountA, uint256 amountB)
    {
        address pair = SwapLibrary.pairFor(factory, _tokenA, _tokenB);
        ISwapPairTokens(pair).transferFrom(msg.sender, pair, _liquidity);
        (uint256 amount0, uint256 amount1) = ISwapPairTokens(pair).burn(_to);
        (address token0, ) = SwapLibrary.sortTokens(_tokenA, _tokenB);
        (amountA, amountB) = _tokenA == token0
            ? (amount0, amount1)
            : (amount1, amount0);

        require(amountA >= _amountAMin, "INSUFFICIENT_A_AMOUNT");
        require(amountB >= _amountBMin, "INSUFFICIENT_B_AMOUNT");
    }

    function removeLiquidityETH(
        address _token,
        uint256 _liquidity,
        uint256 _amountTokenMin,
        uint256 _amountETHMin,
        address _to,
        uint256 _deadline
    )
        public
        virtual
        ensure(_deadline)
        returns (uint256 amountToken, uint256 amountETH)
    {
        (amountToken, amountETH) = removeLiquidity(
            _token,
            WETH,
            _liquidity,
            _amountTokenMin,
            _amountETHMin,
            address(this),
            _deadline
        );
        TransferHelper.safeTransfer(_token, _to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(_to, amountETH);
    }

    function _swap(
        uint256[] memory _amounts,
        address[] memory _path,
        address _to
    ) internal virtual {
        for (uint256 i; i < _path.length - 1; i++) {
            (address input, address output) = (_path[i], _path[i + 1]);
            (address token0, ) = SwapLibrary.sortTokens(input, output);
            uint256 amountOut = _amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < _path.length - 2
                ? SwapLibrary.pairFor(factory, output, _path[i + 2])
                : _to;
            ISwapPairTokens(SwapLibrary.pairFor(factory, input, output)).swap(
                amount0Out,
                amount1Out,
                to,
                new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external virtual ensure(_deadline) returns (uint256[] memory amounts) {
        amounts = SwapLibrary.getAmountsOut(factory, _amountIn, _path);
        require(
            amounts[amounts.length - 1] >= _amountOutMin,
            "INSUFFICIENT_OUTPUT_AMOUNT"
        );
        TransferHelper.safeTransferFrom(
            _path[0],
            msg.sender,
            SwapLibrary.pairFor(factory, _path[0], _path[1]),
            amounts[0]
        );
        _swap(amounts, _path, _to);
    }

    function swapTokensForExactTokens(
        uint256 _amountOut,
        uint256 _amountInMax,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external virtual ensure(_deadline) returns (uint256[] memory amounts) {
        amounts = SwapLibrary.getAmountsIn(factory, _amountOut, _path);
        require(amounts[0] <= _amountInMax, "EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            _path[0],
            msg.sender,
            SwapLibrary.pairFor(factory, _path[0], _path[1]),
            amounts[0]
        );
        _swap(amounts, _path, _to);
    }

    function swapETHForExactTokens(
        uint256 _amountOut,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    )
        external
        payable
        virtual
        ensure(_deadline)
        returns (uint256[] memory amounts)
    {
        require(_path[0] == WETH, "INVALID_PATH");
        amounts = SwapLibrary.getAmountsIn(factory, _amountOut, _path);
        require(amounts[0] <= msg.value, "EXCESSIVE_INPUT_AMOUNT");
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(
            IWETH(WETH).transfer(
                SwapLibrary.pairFor(factory, _path[0], _path[1]),
                amounts[0]
            )
        );
        _swap(amounts, _path, _to);
        if (msg.value > amounts[0])
            TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external virtual ensure(_deadline) returns (uint256[] memory amounts) {
        require(_path[_path.length - 1] == WETH, "INVALID_PATH");
        amounts = SwapLibrary.getAmountsIn(factory, amountOut, _path);
        require(amounts[0] <= amountInMax, "EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            _path[0],
            msg.sender,
            SwapLibrary.pairFor(factory, _path[0], _path[1]),
            amounts[0]
        );
        _swap(amounts, _path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(_to, amounts[amounts.length - 1]);
    }

    function swapExactTokensForETH(
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external virtual ensure(_deadline) returns (uint256[] memory amounts) {
        require(_path[_path.length - 1] == WETH, "INVALID_PATH");
        amounts = SwapLibrary.getAmountsOut(factory, _amountIn, _path);
        require(
            amounts[amounts.length - 1] >= _amountOutMin,
            "INSUFFICIENT_OUTPUT_AMOUNT"
        );
        TransferHelper.safeTransferFrom(
            _path[0],
            msg.sender,
            SwapLibrary.pairFor(factory, _path[0], _path[1]),
            amounts[0]
        );
        _swap(amounts, _path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(_to, amounts[amounts.length - 1]);
    }

    function getReserve(
        address _tokenA,
        address _tokenB
    ) public view returns (uint256 reserveA, uint256 reserveB) {
        (reserveA, reserveB) = SwapLibrary.getReserves(
            factory,
            _tokenA,
            _tokenB
        );
    }

    function quote(
        uint256 _amountA,
        uint256 _reserveA,
        uint256 _reserveB
    ) public pure virtual returns (uint256 amountB) {
        return SwapLibrary.quote(_amountA, _reserveA, _reserveB);
    }

    function getAmountOut(
        uint256 _amountIn,
        uint256 _reserveIn,
        uint256 _reserveOut
    ) public pure virtual returns (uint256 amountOut) {
        return SwapLibrary.getAmountOut(_amountIn, _reserveIn, _reserveOut);
    }

    function getAmountIn(
        uint256 _amountOut,
        uint256 _reserveIn,
        uint256 _reserveOut
    ) public pure virtual returns (uint256 amountIn) {
        return SwapLibrary.getAmountIn(_amountOut, _reserveIn, _reserveOut);
    }

    function getAmountsOut(
        uint256 _amountIn,
        address[] memory _path
    ) public view virtual returns (uint256[] memory amounts) {
        return SwapLibrary.getAmountsOut(factory, _amountIn, _path);
    }

    function getAmountsIn(
        uint256 _amountOut,
        address[] memory _path
    ) public view virtual returns (uint256[] memory amounts) {
        return SwapLibrary.getAmountsIn(factory, _amountOut, _path);
    }
}
