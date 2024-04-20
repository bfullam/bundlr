// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "erc6551/src/lib/ERC6551AccountLib.sol";
import "erc6551/src/interfaces/IERC6551Registry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

address constant SWAP_ROUTER = 0x2E6cd2d30aa43f40aa81619ff4b6E0a41479B13F;
address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

contract BundlrNft is ERC721 {
    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct Allocation {
        address token;
        uint24 percentage;
        uint24 poolFee;
    }
    struct AllocationBalance {
        address token;
        uint256 balance;
    }
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    ISwapRouter private constant swapRouter = ISwapRouter(SWAP_ROUTER);
    uint256 public totalSupply; // The total number of tokens minted on this contract
    address public immutable implementation; // The ERC6551Implementation address
    IERC6551Registry public immutable registry; // The 6551 registry address
    uint public immutable chainId = block.chainid; // The chainId of the network this contract is deployed on
    address public immutable tokenContract = address(this); // The address of this contract
    bytes32 private constant salt = 0; // The salt used to generate the account address
    mapping(uint256 => Allocation[]) private tokenAllocations; // The allocations for each token

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _implementation,
        address _registry
    ) ERC721("BundlrNft", "BNDLR") {
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

    function getAllocations(
        uint256 tokenId
    ) external view returns (Allocation[] memory) {
        require(
            tokenAllocations[tokenId].length > 0,
            "No allocations set for this token"
        );
        return tokenAllocations[tokenId];
    }

    function getAllocationBalances(
        uint256 tokenId
    ) external view returns (AllocationBalance[] memory) {
        require(
            tokenAllocations[tokenId].length > 0,
            "No allocations set for this token"
        );

        AllocationBalance[] memory balances = new AllocationBalance[](
            tokenAllocations[tokenId].length
        );
        for (uint256 i = 0; i < tokenAllocations[tokenId].length; i++) {
            balances[i] = AllocationBalance({
                token: tokenAllocations[tokenId][i].token,
                balance: IERC20(tokenAllocations[tokenId][i].token).balanceOf(
                    getAccount(tokenId)
                )
            });
        }
        return balances;
    }

    function getAllTokens(address owner) external view returns (uint256[] memory) {
    uint256 tokenCount = balanceOf(owner); // Get the number of tokens owned by the address
    uint256[] memory tokens = new uint256[](tokenCount); // Array to store token IDs
    uint256 counter = 0; // Counter to track the number of tokens found

    // Iterate over all tokens minted (assuming `totalSupply` is the count of all tokens)
    for (uint256 i = 1; i <= totalSupply; i++) {
        if (ownerOf(i) == owner) {
            tokens[counter] = i; // Store the token ID
            counter++; // Increment the counter
            // If we've added the correct number of tokens, we can stop early
            if (counter == tokenCount) {
                break;
            }
        }
    }

    return tokens;
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

    function mint(Allocation[] calldata _allocations) external {
        require(
            _allocations.length > 0,
            "At least one allocation must be provided"
        );

        uint256 totalPercentage;
        for (uint256 i = 0; i < _allocations.length; i++) {
            totalPercentage += _allocations[i].percentage;
        }
        require(
            totalPercentage == 100,
            "Invalid allocations, percentages must add up to 100%"
        );

        uint256 tokenId = ++totalSupply;
        _safeMint(msg.sender, tokenId);
        for (uint256 i = 0; i < _allocations.length; i++) {
            tokenAllocations[tokenId].push(_allocations[i]);
        }
    }

    // Swap ETH for tokens defined in the allocations and send them to the tokenbound account
    function fundWithEth(uint256 tokenId) external payable {
        require(msg.value > 0, "Insufficient ETH sent, must be greater than 0");
        require(tokenAllocations[tokenId].length > 0, "No allocations set");

        // Create the tokenbound account address (or get it if it already exists)
        address tokenBoundAccount = createAccount(tokenId);

        // Loop through the allocations and swap the ETH for the tokens
        for (uint i = 0; i < tokenAllocations[tokenId].length; i++) {
            Allocation memory a = tokenAllocations[tokenId][i];
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

    function unbundle(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender,
            "Bundle6551Implementation: Only the NFT owner can unbundle"
        );

        address tokenBoundAccount = getAccount(tokenId);

        address[] memory addressesOfAllocatedTokens = new address[](
            tokenAllocations[tokenId].length
        );
        for (uint256 i = 0; i < tokenAllocations[tokenId].length; i++) {
            addressesOfAllocatedTokens[i] = tokenAllocations[tokenId][i].token;
        }

        IBundle6551Implementation(tokenBoundAccount).unbundle(
            addressesOfAllocatedTokens
        );
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

interface IBundle6551Implementation {
    function unbundle(address[] calldata _tokens) external;
}
