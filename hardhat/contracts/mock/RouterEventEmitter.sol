// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../interfaces/ISwapRouter.sol";

contract RouterEventEmitter {
    event Amounts(uint256[] amounts);

    receive() external payable {}

    function swapExactTokensForTokens(
        address _router,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external {
        (bool success, bytes memory returnData) = _router.delegatecall(
            abi.encodeWithSelector(
                ISwapRouter(_router).swapExactTokensForTokens.selector,
                _amountIn,
                _amountOutMin,
                _path,
                _to,
                _deadline
            )
        );
        assert(success);
        emit Amounts(abi.decode(returnData, (uint256[])));
    }

    function swapTokensForExactTokens(
        address _router,
        uint256 _amountOut,
        uint256 _amountInMax,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external {
        (bool success, bytes memory returnData) = _router.delegatecall(
            abi.encodeWithSelector(
                ISwapRouter(_router).swapTokensForExactTokens.selector,
                _amountOut,
                _amountInMax,
                _path,
                _to,
                _deadline
            )
        );
        assert(success);
        emit Amounts(abi.decode(returnData, (uint256[])));
    }

    function swapExactETHForTokens(
        address _router,
        uint256 _amountOutMin,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external payable {
        (bool success, bytes memory returnData) = _router.delegatecall(
            abi.encodeWithSelector(
                ISwapRouter(_router).swapExactETHForTokens.selector,
                _amountOutMin,
                _path,
                _to,
                _deadline
            )
        );
        assert(success);
        emit Amounts(abi.decode(returnData, (uint256[])));
    }

    function swapTokensForExactETH(
        address _router,
        uint256 _amountOut,
        uint256 _amountInMax,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external {
        (bool success, bytes memory returnData) = _router.delegatecall(
            abi.encodeWithSelector(
                ISwapRouter(_router).swapTokensForExactETH.selector,
                _amountOut,
                _amountInMax,
                _path,
                _to,
                _deadline
            )
        );
        assert(success);
        emit Amounts(abi.decode(returnData, (uint256[])));
    }

    function swapExactTokensForETH(
        address _router,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external {
        (bool success, bytes memory returnData) = _router.delegatecall(
            abi.encodeWithSelector(
                ISwapRouter(_router).swapExactTokensForETH.selector,
                _amountIn,
                _amountOutMin,
                _path,
                _to,
                _deadline
            )
        );
        assert(success);
        emit Amounts(abi.decode(returnData, (uint256[])));
    }

    function swapETHForExactTokens(
        address _router,
        uint256 _amountOut,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external payable {
        (bool success, bytes memory returnData) = _router.delegatecall(
            abi.encodeWithSelector(
                ISwapRouter(_router).swapETHForExactTokens.selector,
                _amountOut,
                _path,
                _to,
                _deadline
            )
        );
        assert(success);
        emit Amounts(abi.decode(returnData, (uint256[])));
    }
}
