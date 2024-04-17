// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "erc6551/src/interfaces/IERC6551Account.sol";
import "erc6551/src/lib/ERC6551AccountLib.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Bundle6551Implementation
/// @author bfullam
/// @notice An NFT Bundle that holds a portfolio of ERC-20 tokens.
/// @dev An ERC-6551 NFT account wallet implementation with a Bundle mechanic. Based on jaydenwindle's SimpleERC6551Account.sol and nnnnicholas's Piggybank6551Implementation.sol.
contract Bundle6551Implementation is IERC165, IERC6551Account, IERC721Receiver {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice This ERC6551 implementation contract does not accept ETH.
    /// @dev Emitted when ETH is sent to this contract.
    error BundleDoesNotAcceptETH();

    /// @notice This ERC6551 implementation contract does not accept NFTs except for the one that owns it.
    /// @dev Emitted when any other NFT is sent to this contract.
    error BundleDoesNotAccept721s();

    /// @notice This ERC6551 implementation contract does not accept NFTs except for the one that owns it.
    /// @dev Emitted when any other NFT is sent to this contract.
    error BundleDoesNotAccept1155s();

    /// @notice This ERC6551 implementation contract does not accept calls.
    /// @dev Emitted when executeCall is called.
    error BundleCannotExecuteCalls();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the Bundle is unbundled and the tokens are sent to the NFT owner
    /// @param recipient The address that received the tokens
    event BundleUnbundled(address indexed recipient);

    /*//////////////////////////////////////////////////////////////
                                 FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Nonce is not supported in this 6551 implementation
    /// @dev Included to maintain 6551 interface compliance
    /// @return uint256 The nonce
    function nonce() external pure returns (uint256) {
        return (0);
    }

    /// @notice Emits an event when the contract receives ETH
    receive() external payable {
        revert BundleDoesNotAcceptETH();
    }

    /// @notice This function will revert when called.
    /// @dev The function is included only to remain 6551 compliant.
    function executeCall() external payable returns (bytes memory) {
        revert BundleCannotExecuteCalls();
    }

    /// @notice Returns identifiers of the NFT that owns this account
    /// @dev Returns identifier of the ERC-721 token which owns the account
    /// @return chainId The EIP-155 ID of the chain the ERC-721 token exists on
    /// @return tokenContract The contract address of the ERC-721 token
    /// @return tokenId The ID of the ERC-721 token
    function token()
        public
        view
        returns (uint256 chainId, address tokenContract, uint256 tokenId)
    {
        return ERC6551AccountLib.token();
    }

    /// @notice Returns the owner of the ERC-721 token which controls the account if the token exists.
    /// @dev This is value is obtained by calling `ownerOf` on the ERC-721 contract.
    /// @return Address of the owner of the ERC-721 token which owns the account
    function owner() public view returns (address) {
        (uint256 chainId, address tokenContract, uint256 tokenId) = this
            .token();
        if (chainId != block.chainid) return address(0);

        return IERC721(tokenContract).ownerOf(tokenId);
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return (interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC6551Account).interfaceId);
    }

    /// @notice This function will revert when called.
    /// @dev Called by 721 contracts when sending ERC721s to this contract.
    /// @inheritdoc IERC721Receiver
    function onERC721Received(
        address, // operator
        address, // from
        uint256, // tokenId
        bytes calldata // data
    ) external pure override returns (bytes4) {
        revert BundleDoesNotAccept721s();
    }

    /// @notice This function will revert when called.
    /// @dev Handles the receipt of a single ERC1155 token type. This function is called at the end of a `safeTransferFrom` after the balance has been updated.
    /// @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e., `0xf23a6e61`) if transfer is allowed
    function onERC1155Received(
        address, // operator
        address, // from
        uint256, // id
        uint256, // value
        bytes calldata // data
    ) external pure returns (bytes4) {
        revert BundleDoesNotAccept1155s();
    }

    function unbundle(address[] calldata _tokens) external {
        (, address tokenContract, ) = this.token();
        require(
            msg.sender == tokenContract,
            "Bundle6551Implementation: Only the NFT contract can unbundle"
        );

        // Transfer all ERC-20 tokens to the NFT owner
        for (uint256 i = 0; i < _tokens.length; i++) {
            IERC20 _token = IERC20(_tokens[i]);
            uint256 balance = _token.balanceOf(address(this));
            _token.transfer(owner(), balance);
        }

        emit BundleUnbundled(owner());
    }

    function state() external view override returns (uint256) {}

    function isValidSigner(
        address signer,
        bytes calldata context
    ) external view override returns (bytes4 magicValue) {}
}
