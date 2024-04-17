// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

address constant SWAP_ROUTER = 0x2E6cd2d30aa43f40aa81619ff4b6E0a41479B13F;
address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

contract SingleSwap {
    ISwapRouter private constant swapRouter = ISwapRouter(SWAP_ROUTER);

    function swapExactInputSingle() external payable {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: WBTC,
                fee: 500,
                recipient: msg.sender,
                deadline: block.timestamp + 15,
                amountIn: msg.value,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        swapRouter.exactInputSingle{value: msg.value}(params);
    }
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);
}
