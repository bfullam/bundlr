"use client";

import { BundlCard } from "./debug/_components/portfolio/bundlCard";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // READ FUNCTIONS

  const { data: tokenlist } = useScaffoldContractRead({
    contractName: "BundlrNft",
    functionName: "getAllTokens",
    args: [connectedAddress],
  });

  // STATE FUNCTIONS

  // WRITE FUNCTIONS

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

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div>
          <div className="flex flex-row justify-between items-center">
            <div className="text-4xl font-bold">Portfolio</div>
            <div>
              <button
                className="bg-gray-800 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded mt-5"
                onClick={() => mintNFT()}
              >
                Create
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-8">
            {tokenlist?.map((token, index) => (
              <div key={index}>
                <BundlCard tokenId={token.toString()} />
              </div>
            ))}
          </div>
        </div>

        {/* <button
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
        </button> */}
      </div>
    </>
  );
};

export default Home;
