// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "erc6551/src/lib/ERC6551AccountLib.sol";
import "erc6551/src/interfaces/IERC6551Registry.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

address constant SWAP_ROUTER = 0x2E6cd2d30aa43f40aa81619ff4b6E0a41479B13F;
address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

contract BundlrNft is ERC721 {
    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct Allocation {
        address token;
        uint24 percentage;
        uint24 poolFee;
    }
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    ISwapRouter private constant swapRouter = ISwapRouter(SWAP_ROUTER);
    IERC20 private constant usdc = IERC20(USDC);
    uint256 public totalSupply; // The total number of tokens minted on this contract
    address public immutable implementation; // The ERC6551Implementation address
    IERC6551Registry public immutable registry; // The 6551 registry address
    uint public immutable chainId = block.chainid; // The chainId of the network this contract is deployed on
    address public immutable tokenContract = address(this); // The address of this contract
    bytes32 private constant salt = 0; // The salt used to generate the account address
    Allocation[] private allocations; // The allocations for the tokenbound account

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _implementation,
        address _registry
    ) ERC721("myNft", "NFT") {
        implementation = _implementation;
        registry = IERC6551Registry(_registry);
        allocations.push(
            Allocation({token: WBTC, percentage: 50, poolFee: 500})
        );
        allocations.push(
            Allocation({token: USDC, percentage: 50, poolFee: 3000})
        );
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

    // Fund the tokenbound account with ERC20 tokens
    function fundWithEth(uint256 tokenId) external payable {
        require(msg.value > 0, "Insufficient amount");
        require(allocations.length > 0, "No allocations set");

        // Create the tokenbound account address (or get it if it already exists)
        address tokenBoundAccount = createAccount(tokenId);

        // Loop through the allocations and swap the ETH for the tokens
        for (uint i = 0; i < allocations.length; i++) {
            Allocation memory a = allocations[i];
            uint256 amountIn = (msg.value * a.percentage) / 100;
            // Prepare the swap parameters
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: WETH,
                    tokenOut: a.token,
                    fee: a.poolFee,
                    recipient: tokenBoundAccount,
                    deadline: block.timestamp + 60,
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });
            // The call to `exactInputSingle` executes the swap.
            swapRouter.exactInputSingle{value: amountIn}(params);
        }
    }

    // // Fund the tokenbound account with USDC
    // function fundWithUSDC(
    //     uint256 tokenId,
    //     uint256 amountIn
    // ) external payable returns (uint256 amountOut) {
    //     // Check for adequate allowance
    //     require(
    //         usdc.allowance(msg.sender, address(this)) >= amountIn,
    //         "Insufficient allowance"
    //     );

    //     // Transfer tokens from sender to this contract
    //     require(
    //         usdc.transferFrom(msg.sender, address(this), amountIn),
    //         "Transfer to NFT failed"
    //     );

    //     // Get the tokenbound account address
    //     address tokenBoundAccount = getAccount(tokenId);

    //     ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
    //         .ExactInputSingleParams({
    //             tokenIn: USDC,
    //             tokenOut: USDC,
    //             fee: poolFee,
    //             recipient: tokenBoundAccount,
    //             amountIn: msg.value,
    //             amountOutMinimum: 0,
    //             sqrtPriceLimitX96: 0
    //         });

    //     // The call to `exactInputSingle` executes the swap.
    //     amountOut = swapRouter.exactInputSingle{value: msg.value}(params);
    // }
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
