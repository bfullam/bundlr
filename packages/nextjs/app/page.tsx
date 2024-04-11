"use client";

import { TokenboundClient } from "@tokenbound/sdk";
import type { NextPage } from "next";
import { WalletClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();

  // Constants
  const anvilDefaultAccount = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const TOKEN_CONTRACT = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const TOKEN_ID = "1";

  const walletClient: WalletClient = createWalletClient({
    chain: foundry,
    account: anvilDefaultAccount,
    transport: http(),
  });
  console.log(walletClient);

  const tokenboundClient = new TokenboundClient({
    walletClient,
    chain: foundry,
    implementationAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  });

  const tokenBoundAccount = tokenboundClient.getAccount({
    tokenContract: TOKEN_CONTRACT,
    tokenId: TOKEN_ID,
  });

  console.log(tokenBoundAccount);

  const fundTBA = async () => {
    if (!walletClient || !address) return;
    await walletClient.sendTransaction({
      account: anvilDefaultAccount,
      to: tokenBoundAccount,
      value: parseEther("1.0"),
      chain: foundry,
    });
    console.log(`funded TBA ${tokenBoundAccount} with 1 ETH`);
  };

  const createAccount = async () => {
    if (!tokenboundClient || !address) return;
    const createdAccount = await tokenboundClient.createAccount({
      tokenContract: TOKEN_CONTRACT,
      tokenId: TOKEN_ID,
    });
    console.log(createdAccount);
  };

  const transferETH = async () => {
    if (!tokenboundClient || !address) return;
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
        recipientAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        amount: 0.1,
      });
      console.log(executedTransfer);
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

        <button onClick={() => fundTBA()}>FUND TBA</button>
        <button onClick={() => createAccount()}>CREATE ACCOUNT</button>
        <button onClick={() => transferETH()}>TRANSFER ETH</button>
      </div>
    </>
  );
};

export default Home;
