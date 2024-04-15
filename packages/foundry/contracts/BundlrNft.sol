// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "erc6551/src/lib/ERC6551AccountLib.sol";
import "erc6551/src/interfaces/IERC6551Registry.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

// address constant SWAP_ROUTER = 0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B;
// address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
// address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

contract BundlrNft is ERC721 {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    // ISwapRouter private constant swapRouter = ISwapRouter(SWAP_ROUTER);
    // IERC20 private constant weth = IERC20(WETH);
    // IERC20 private constant usdc = IERC20(USDC);
    // uint24 public constant poolFee = 3000;
    uint256 public totalSupply; // The total number of tokens minted on this contract
    address public immutable implementation; // The ERC6551Implementation address
    IERC6551Registry public immutable registry; // The 6551 registry address
    uint public immutable chainId = block.chainid; // The chainId of the network this contract is deployed on
    address public immutable tokenContract = address(this); // The address of this contract
    bytes32 salt = 0; // The salt used to generate the account address

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _implementation,
        address _registry
    ) ERC721("myNft", "NFT") {
        implementation = _implementation;
        registry = IERC6551Registry(_registry);
    }

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getAccount(uint tokenId) public view returns (address) {
        return
            registry.account(
                implementation,
                salt,
                chainId,
                tokenContract,
                tokenId
            );
    }

    function createAccount(uint tokenId) public returns (address) {
        return
            registry.createAccount(
                implementation,
                salt,
                chainId,
                tokenContract,
                tokenId
            );
    }

    function addEth(uint tokenId) external payable {
        address account = getAccount(tokenId);
        (bool success, ) = account.call{value: msg.value}("");
        require(success, "Failed to send ETH");
    }

    function mint() external payable {
        _safeMint(msg.sender, ++totalSupply);
    }

    // // Fund the tokenbound account with ERC20 tokens
    // function fund()
    //     external
    //     payable
    //     returns (
    //         // uint256 amountIn,
    //         // uint256 tokenId
    //         uint256 amountOut
    //     )
    // {
    //     // // Check for adequate allowance
    //     // require(
    //     //     usdc.allowance(msg.sender, address(this)) >= amountIn,
    //     //     "Insufficient allowance"
    //     // );
    //     // // Transfer tokens from sender to this contract
    //     // require(
    //     //     usdc.transferFrom(msg.sender, address(this), amountIn),
    //     //     "Transfer to NFT failed"
    //     // );
    //     // Get the tokenbound account address
    //     // address tokenBoundAccount = getAccount(tokenId);
    //     // // Transfer tokens to the recipient
    //     // require(
    //     //     token.transfer(tokenBoundAccount, amountIn),
    //     //     "Transfer to tokenbound account failed"
    //     // );
    //     // ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
    //     //     .ExactInputSingleParams({
    //     //         tokenIn: WETH,
    //     //         tokenOut: USDC,
    //     //         fee: poolFee,
    //     //         // recipient: tokenBoundAccount,
    //     //         recipient: msg.sender,
    //     //         deadline: block.timestamp,
    //     //         amountIn: msg.value,
    //     //         amountOutMinimum: 0,
    //     //         sqrtPriceLimitX96: 0
    //     //     });
    //     // The call to `exactInputSingle` executes the swap.
    //     // amountOut = swapRouter.exactInputSingle{value: msg.value}(params);
    // }
}
