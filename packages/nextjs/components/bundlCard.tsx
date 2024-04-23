"use client";

// @ts-ignore
import React, { ChangeEvent, useState } from "react";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { formatUnits, parseEther } from "viem";
import { useChainId } from "wagmi";
import { ImageWithFallback } from "~~/components/ImageWithFallback";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

type BundlCardProps = {
  tokenId: string;
};

type ChainInfo = {
  name: string;
  protocol: string;
};

type TokenBalance = {
  symbol: string;
  balance: bigint;
  decimalPlaces: number;
};

export const BundlCard = ({ tokenId }: BundlCardProps) => {
  const chainId = useChainId();
  // STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [totalUSDValue, setTotalUSDValue] = useState() as any;

  // Mapping chainId to chainName so we can use the correct subgraph
  const chainInfo: { [key: number]: ChainInfo } = {
    1: { name: "ethereum", protocol: "uniswap" },
    31337: { name: "ethereum", protocol: "uniswap" },
    42161: { name: "arbitrum", protocol: "uniswap" },
    100: { name: "gnosis", protocol: "sushi" },
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleFundInput = (e: ChangeEvent<HTMLInputElement>) => setFundAmount(e.target.value);

  // Function to generate a random Ethereum address
  const generateRandomAddress = () => {
    const characters = "0123456789abcdef";
    let address = "0x";
    for (let i = 0; i < 40; i++) {
      address += characters[Math.floor(Math.random() * characters.length)];
    }
    return address;
  };

  const renderTokenImage = (token: any) => {
    return (
      <ImageWithFallback
        src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainInfo[chainId].name}/assets/${token.token}/logo.png`}
        fallback={<Jazzicon diameter={50} seed={jsNumberForAddress(generateRandomAddress())} />}
        width={50}
        height={50}
        alt={token.symbol}
      />
    );
  };

  // This function fetches token prices from the API, ID is the token ID
  const getPrices = async (tokenBalances: TokenBalance[]): Promise<any | null> => {
    try {
      const res = await fetch(`/api/tokenPrices?tokenSymbols=${tokenBalances.map(token => token.symbol).join(",")}`);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      let totalValue = 0;
      for (const key in data.data) {
        const tokenBalance = tokenBalances.find(token => token.symbol === key);
        if (!tokenBalance) continue;
        totalValue +=
          Number(data.data[key].quote.USD.price) *
          Number(formatUnits(tokenBalance.balance, tokenBalance.decimalPlaces));
      }

      if (totalUSDValue === undefined) {
        setTotalUSDValue(totalValue);
      }
    } catch (error) {
      console.error("Failed to fetch token prices:", error);
      return null;
    }
  };

  // READ CONTRACT

  const { data: getAllocations } = useScaffoldContractRead({
    contractName: "BundlrNft",
    functionName: "getAllocations",
    args: [BigInt(tokenId)],
  });

  // @ts-ignore
  const { data: getAllocationBalances } = useScaffoldContractRead({
    contractName: "BundlrNft",
    functionName: "getAllocationBalances",
    args: [BigInt(tokenId)],
  });

  // WRITE CONTRACT

  const {
    writeAsync: fundNftWithEth,
    // isLoading: fundNftWithEthIsLoading,
    // isMining: fundNftWithEthIsMining,
  } = useScaffoldContractWrite({
    contractName: "BundlrNft",
    functionName: "fundWithEth",
    args: [BigInt(tokenId)],
    value: parseEther(fundAmount),
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
    args: [BigInt(tokenId)],
    onBlockConfirmation: txnReceipt => {
      console.log("Unbundle transaction blockHash", txnReceipt.blockHash);
    },
  });

  if (getAllocationBalances && totalUSDValue === undefined) {
    const atLeastOneTokenHasBalance = getAllocationBalances.some(allocation => allocation.balance !== BigInt(0));
    if (!atLeastOneTokenHasBalance) {
      setTotalUSDValue(0);
    } else {
      getPrices(
        getAllocationBalances?.map(({ symbol, balance, decimalPlaces }) => ({ symbol, balance, decimalPlaces })),
      );
    }
  }

  return (
    <div className="bg-[#dddcd9] bg-opacity-40 px-12 py-10 rounded-md">
      <div className="text-lg font-semibold">BAG {tokenId}</div>
      <div className="pt-5">
        {getAllocations?.map((allocation, index) => {
          // Calculate the index of the next bag name
          return (
            <div key={index}>
              <div className="pb-2">
                <div className="flex flex-row justify-between">
                  <div className="flex flex-row space-x-2">
                    {renderTokenImage(allocation)}
                    <div className="font-medium">{allocation?.symbol}</div>
                    <div>
                      {getAllocationBalances?.[index]?.balance
                        ? `${Number(
                            formatUnits(
                              getAllocationBalances[index].balance,
                              getAllocationBalances[index].decimalPlaces,
                            ),
                          ).toFixed(5)}...`
                        : "No balance available"}
                    </div>
                  </div>
                  <div className="font-medium">{allocation?.percentage}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-30">
            <div className="bg-white p-5 rounded-lg">
              <h2 className="text-lg font-semibold">Funding amount</h2>
              <h2 className="text-md w-[20rem]">
                Specify the ETH amount you wish to invest, and we will automatically exchange it to rebalance your
                portfolio according to predetermined token weights.
              </h2>
              <input
                type="text"
                value={fundAmount}
                onChange={handleFundInput}
                className="border border-gray-300 rounded-md p-2 mt-2 w-full"
              />
              <div className="flex flex-row justify-between mt-4">
                <button
                  className="flex-grow bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded mr-2" // Added flex-grow class
                  onClick={() => {
                    fundNftWithEth();
                    setIsModalOpen(false);
                  }}
                >
                  Fund
                </button>
                <button
                  className="flex-grow bg-red-300 hover:bg-red-700 text-white font-bold py-2 px-6 rounded ml-2" // Added flex-grow class
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="font-semibold pt-4">Total Value Locked (TVL)</div>
        <div className="font-medium text-gray-800">
          {totalUSDValue !== undefined ? `$${totalUSDValue.toFixed(2)}` : "Loading..."}
        </div>
        <div className="flex flex-row space-x-5 mt-4">
          <div className="flex-grow">
            <div
              className="w-full bg-gray-200 border border-gray-500 hover:bg-gray-50 text-gray-700 font-bold py-2 px-8 rounded cursor-pointer"
              onClick={openModal}
            >
              Fund
            </div>
          </div>
          <div className="flex-grow">
            <div
              className="w-full bg-gray-200 border border-gray-500 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded"
              onClick={() => unbundleNftAssets()}
            >
              Liquidate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
