//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import {BundlrNft} from "../contracts/BundlrNft.sol";
import {ERC6551Account} from "../contracts/ERC6551Account.sol";
import {IERC6551Registry} from "erc6551/src/interfaces/IERC6551Registry.sol";
import {MyToken} from "../contracts/MyToken.sol";
import {SingleSwap} from "../contracts/SingleSwap.sol";

contract DeployScript is ScaffoldETHDeploy {
    error InvalidPrivateKey(string);

    IERC6551Registry erc6551Registry =
        IERC6551Registry(0x000000006551c19487814612e58FE06813775758);

    function run() external {
        uint256 deployerPrivateKey = setupLocalhostEnv();
        if (deployerPrivateKey == 0) {
            revert InvalidPrivateKey(
                "You don't have a deployer account. Make sure you have set DEPLOYER_PRIVATE_KEY in .env or use `yarn generate` to generate a new random account"
            );
        }
        vm.startBroadcast(deployerPrivateKey);

        // ERC6551Account erc6551Account = new ERC6551Account();
        // console.logString(
        //     string.concat(
        //         "ERC6551Account deployed at: ",
        //         vm.toString(address(erc6551Account))
        //     )
        // );

        // BundlrNft bundlrNft = new BundlrNft(
        //     address(erc6551Account),
        //     address(erc6551Registry)
        // );
        // console.logString(
        //     string.concat(
        //         "BundlrNft deployed at: ",
        //         vm.toString(address(bundlrNft))
        //     )
        // );

        // MyToken myToken = new MyToken("MyToken", "MTK1", 100);
        // console.logString(
        //     string.concat(
        //         "MyToken deployed at: ",
        //         vm.toString(address(myToken))
        //     )
        // );

        SingleSwap singleSwap = new SingleSwap();
        console.logString(
            string.concat(
                "SingleSwap deployed at: ",
                vm.toString(address(singleSwap))
            )
        );

        vm.stopBroadcast();

        /**
         * This function generates the file containing the contracts Abi definitions.
         * These definitions are used to derive the types needed in the custom scaffold-eth hooks, for example.
         * This function should be called last.
         */
        exportDeployments();
    }

    function test() public {}
}
