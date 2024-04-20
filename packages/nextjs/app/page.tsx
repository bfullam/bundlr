"use client";

import type { NextPage } from "next";
import { parseEther } from "viem";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const {
    writeAsync: mintNFT,
    // isLoading: mintNFTIsLoading,
    // isMining: mintNFTIsMining,
  } = useScaffoldContractWrite({
    contractName: "BundlrNft",
    functionName: "mint",
    args: [
      [
        { token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", percentage: 50, poolFee: 3000 },
        { token: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", percentage: 50, poolFee: 500 },
      ],
    ],
    onBlockConfirmation: txnReceipt => {
      console.log("Mint transaction blockHash", txnReceipt.blockHash);
    },
  });

  const {
    writeAsync: fundNftWithEth,
    // isLoading: fundNftWithEthIsLoading,
    // isMining: fundNftWithEthIsMining,
  } = useScaffoldContractWrite({
    contractName: "BundlrNft",
    functionName: "fundWithEth",
    args: [BigInt(1)],
    value: parseEther("1"),
    onBlockConfirmation: txnReceipt => {
      console.log("Fund transaction blockHash", txnReceipt.blockHash);
    },
  });

  const {
    writeAsync: unbundleNftAssets,
    // isLoading: unbundleNftAssetsIsLoading,
    // isMining: unbundleNftAssetsIsMining,
  } = useScaffoldContractWrite({
    contractName: "BundlrNft",
    functionName: "unbundle",
    args: [BigInt(1)],
    onBlockConfirmation: txnReceipt => {
      console.log("Unbundle transaction blockHash", txnReceipt.blockHash);
    },
  });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
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
          FUND NFT ACCOUNT WITH 1 ETH
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
