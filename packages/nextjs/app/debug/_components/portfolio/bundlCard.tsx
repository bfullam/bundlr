"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

type BundlCardProps = {
  tokenId: string;
};

type TokenBalance = {
  symbol: string;
  balance: bigint;
};

export const BundlCard = ({ tokenId }: BundlCardProps) => {
  // STATES

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleFundInput = (e: ChangeEvent<HTMLInputElement>) => setFundAmount(e.target.value);

  // UTILS

  const formatAddress = (address: string | null) => {
    if (!address) return "No Address";
    const first = address.slice(0, 6); // First 6 characters
    const last = address.slice(-4); // Last 4 characters
    return `${first}...${last}`; // Concatenated with ellipsis
  };

  const balanceInDecimals = (balance: bigint) => {
    return formatEther(balance);
  };

  // This function fetches token prices from the API, ID is the token ID
  const getPrices = async (tokenBalances: TokenBalance[]): Promise<any | null> => {
    try {
      const res = await fetch(`/api/tokenPrices?tokenSymbols=${tokenBalances.map(token => token.symbol).join(",")}`);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      // console.log("API Response:", data);
      let totalUSDValue = 0;
      for (const key in data.data) {
        const tokenBalance = tokenBalances.find(token => token.symbol === key);
        if (!tokenBalance) continue;
        totalUSDValue +=
          (data.data[key].quote.USD.price || 0) * Number(balanceInDecimals(tokenBalance.balance) || 0) * 100;
      }
      return totalUSDValue;
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
    args: [BigInt(1)],
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
    args: [BigInt(1)],
    onBlockConfirmation: txnReceipt => {
      console.log("Unbundle transaction blockHash", txnReceipt.blockHash);
    },
  });

  // EFFECTS
  useEffect(() => {
    if (!getAllocationBalances) return;
    getPrices(getAllocationBalances?.map(({ symbol, balance }) => ({ symbol, balance }))); // Call the function on component mount or when tokenId changes
  });

  return (
    <>
      <div className="bg-gray-200 px-20 py-10 rounded-md">
        <div className="font-semibold">Name</div>
        <div>Id: {tokenId}</div>
        <div className="pt-5">
          {getAllocations?.map((allocation, index) => (
            <div className="pb-2" key={index}>
              <div>Symbol: {allocation.symbol}</div>
              <div>Address: {formatAddress(allocation.token)}</div>
              <div>Weight: {allocation?.percentage}</div>
              <div>
                Balance:{" "}
                {getAllocationBalances?.[index]?.balance
                  ? balanceInDecimals(getAllocationBalances[index].balance)
                  : "No balance available"}
              </div>
              {/* <div>
                USD Values: {usdBalances[index] !== undefined ? `$${usdBalances[index]?.toFixed(2)} USD` : "Loading..."}
              </div> */}
            </div>
          ))}
        </div>
        <div>
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-30">
              <div className="bg-white p-5 rounded-lg">
                <h2 className="text-lg">Enter the amount to fund</h2>
                <input
                  type="text"
                  value={fundAmount}
                  onChange={handleFundInput}
                  className="border border-gray-300 rounded-md p-2 mt-2"
                />
                <div className="flex flex-row justify-between mt-4">
                  <button
                    className="bg-gray-800 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
                    onClick={() => {
                      fundNftWithEth();
                      setIsModalOpen(false);
                    }}
                  >
                    Fund
                  </button>
                  <button
                    className="bg-red-400 hover:bg-red-700 text-white font-bold py-2 px-6 rounded"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-row space-x-5">
            <div
              className="bg-gray-800 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded mt-5 cursor-pointer"
              onClick={openModal}
            >
              Fund
            </div>
            <div
              className="bg-gray-800 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded mt-5"
              onClick={() => unbundleNftAssets()}
            >
              Liquidate
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
