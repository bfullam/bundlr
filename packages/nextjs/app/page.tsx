"use client";

import type { NextPage } from "next";
import { WalletClient, createPublicClient, createWalletClient, custom, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();
  const BundlrNftContractInfo = useDeployedContractInfo("BundlrNft");

  // Constants
  const anvilDefaultAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const TOKEN_CONTRACT = BundlrNftContractInfo?.data?.address;
  const TOKEN_ID = "1";
  const anvilDefaultAccount = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

  const publicClient = createPublicClient({
    chain: foundry,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transport: custom(window.ethereum!),
  });

  const walletClient: WalletClient = createWalletClient({
    account: anvilDefaultAccount,
    chain: foundry,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transport: http(),
  });

  const mintNFT = async () => {
    if (!TOKEN_CONTRACT || !BundlrNftContractInfo?.data?.abi) return;
    const { request } = await publicClient.simulateContract({
      account: anvilDefaultAccount,
      address: TOKEN_CONTRACT,
      abi: BundlrNftContractInfo?.data?.abi,
      functionName: "mint",
      args: [
        [
          { token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", percentage: 50, poolFee: 3000 },
          { token: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", percentage: 50, poolFee: 500 },
        ],
      ],
    });
    await walletClient.writeContract(request);
    console.log(`Minted NFT to ${anvilDefaultAddress}`);
  };

  const fundNftWithEth = async () => {
    if (!TOKEN_CONTRACT || !BundlrNftContractInfo?.data?.abi) return;
    const { request } = await publicClient.simulateContract({
      account: anvilDefaultAccount,
      address: TOKEN_CONTRACT,
      abi: BundlrNftContractInfo?.data?.abi,
      functionName: "fundWithEth",
      args: [BigInt(1)],
      value: parseEther("1"),
    });
    await walletClient.writeContract(request);
    console.log(`Funded NFT with 1 ETH`);
  };

  const unbundleNftAssets = async () => {
    if (!TOKEN_CONTRACT || !BundlrNftContractInfo?.data?.abi) return;
    const { request } = await publicClient.simulateContract({
      account: anvilDefaultAccount,
      address: TOKEN_CONTRACT,
      abi: BundlrNftContractInfo?.data?.abi,
      functionName: "unbundle",
      args: [BigInt(TOKEN_ID)],
    });
    await walletClient.writeContract(request);
    console.log(`Unbundled NFT ${TOKEN_ID}`);
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
          onClick={() => mintNFT()}
        >
          MINT NFT
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5"
          onClick={() => fundNftWithEth()}
        >
          FUND NFT ACCOUNT WITH 1 ETH (this is slow AF locally, but works on the testnet)
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5"
          onClick={() => unbundleNftAssets()}
        >
          UNBUNDLE NFT ASSETS
        </button>
      </div>
    </>
  );
};

export default Home;
