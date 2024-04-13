//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import {MyNFT} from "../contracts/MyNFT.sol";
import {ERC6551Account} from "../contracts/ERC6551Account.sol";

contract DeployScript is ScaffoldETHDeploy {
    error InvalidPrivateKey(string);

    function run() external {
        uint256 deployerPrivateKey = setupLocalhostEnv();
        if (deployerPrivateKey == 0) {
            revert InvalidPrivateKey(
                "You don't have a deployer account. Make sure you have set DEPLOYER_PRIVATE_KEY in .env or use `yarn generate` to generate a new random account"
            );
        }
        vm.startBroadcast(deployerPrivateKey);

        ERC6551Account erc6551Account = new ERC6551Account();
        console.logString(
            string.concat(
                "ERC6551Account deployed at: ",
                vm.toString(address(erc6551Account))
            )
        );

        MyNFT myNFT = new MyNFT();
        console.logString(
            string.concat("MyNFT deployed at: ", vm.toString(address(myNFT)))
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
