// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "erc6551/src/lib/ERC6551AccountLib.sol";
import "erc6551/src/interfaces/IERC6551Registry.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MyNFT is ERC721 {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    uint256 public totalSupply; // The total number of tokens minted on this contract
    address public immutable implementation; // The ERC6551Implementation address
    IERC6551Registry public immutable registry; // The 6551 registry address
    uint public immutable chainId = block.chainid; // The chainId of the network this contract is deployed on
    address public immutable tokenContract = address(this); // The address of this contract
    bytes32 salt = 0; // The salt used to generate the account address
    uint public immutable price;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _implementation,
        address _registry,
        uint _price
    ) ERC721("myNFT", "NFT") {
        implementation = _implementation;
        registry = IERC6551Registry(_registry);
        price = _price;
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
        require(msg.value >= price, "Insufficient funds");
        _safeMint(msg.sender, ++totalSupply);
    }
    }
}
