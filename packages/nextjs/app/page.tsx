"use client";

import { TokenboundClient } from "@tokenbound/sdk";
import type { NextPage } from "next";
import { WalletClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();
  const ERC6551AccountContractInfo = useDeployedContractInfo("ERC6551Account");
  const MyNftContractInfo = useDeployedContractInfo("MyNFT");

  // Constants
  const anvilDefaultAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const anvilDefaultAccount = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const IMPLEMENTATION_CONTRACT = ERC6551AccountContractInfo?.data?.address;
  const TOKEN_CONTRACT = MyNftContractInfo?.data?.address;
  const TOKEN_ID = "1";

  const walletClient: WalletClient = createWalletClient({
    chain: foundry,
    account: anvilDefaultAccount,
    transport: http(),
  });

  let tokenboundClient: TokenboundClient;
  let tokenBoundAccount: `0x${string}`;
  if (IMPLEMENTATION_CONTRACT && TOKEN_CONTRACT) {
    tokenboundClient = new TokenboundClient({
      walletClient,
      chain: foundry,
      implementationAddress: IMPLEMENTATION_CONTRACT,
    });
    tokenBoundAccount = tokenboundClient.getAccount({
      tokenContract: TOKEN_CONTRACT,
      tokenId: TOKEN_ID,
    });
  }

  const fundTBA = async () => {
    if (!walletClient || !tokenBoundAccount) return;
    await walletClient.sendTransaction({
      account: anvilDefaultAccount,
      to: tokenBoundAccount,
      value: parseEther("10.0"),
      chain: foundry,
    });
    console.log(`funded TBA ${tokenBoundAccount} with 10 ETH`);
  };

  const createAccount = async () => {
    if (!tokenboundClient || !TOKEN_CONTRACT) return;
    const createdAccount = await tokenboundClient.createAccount({
      tokenContract: TOKEN_CONTRACT,
      tokenId: TOKEN_ID,
    });
    console.log(createdAccount);
  };

  const transferETH = async () => {
    if (!tokenboundClient || !tokenBoundAccount) return;
    const isAccountDeployed = await tokenboundClient.checkAccountDeployment({
      accountAddress: tokenBoundAccount,
    });
    console.log("IS DEPLOYED?", isAccountDeployed);

    const isValidSigner = await tokenboundClient.isValidSigner({
      account: tokenBoundAccount,
    });
    console.log("isValidSigner?", isValidSigner);

    if (isAccountDeployed) {
      const executedTransfer = await tokenboundClient.transferETH({
        account: tokenBoundAccount,
        recipientAddress: anvilDefaultAddress,
        amount: 1,
      });
      console.log(
        `Transfer hash ${executedTransfer} has transferred 1 ETH from ${tokenBoundAccount} to ${anvilDefaultAddress}`,
      );
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={address} />
          </div>
        </div>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5"
          onClick={() => fundTBA()}
        >
          FUND TBA
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5"
          onClick={() => createAccount()}
        >
          CREATE ACCOUNT
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5"
          onClick={() => transferETH()}
        >
          TRANSFER ETH
        </button>
      </div>
    </>
  );
};

export default Home;
