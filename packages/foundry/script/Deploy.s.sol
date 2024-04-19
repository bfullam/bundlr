//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import {BundlrNft} from "../contracts/BundlrNft.sol";
import {Bundle6551Implementation} from "../contracts/Bundle6551Implementation.sol";
import {IERC6551Registry} from "erc6551/src/interfaces/IERC6551Registry.sol";

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

        Bundle6551Implementation bundle6551Implementation = new Bundle6551Implementation();
        console.logString(
            string.concat(
                "Bundle6551Implementation deployed at: ",
                vm.toString(address(bundle6551Implementation))
            )
        );

        BundlrNft bundlrNft = new BundlrNft(
            address(bundle6551Implementation),
            address(erc6551Registry)
        );
        console.logString(
            string.concat(
                "BundlrNft deployed at: ",
                vm.toString(address(bundlrNft))
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
