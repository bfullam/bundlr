"use client";

import { useEffect, useRef, useState } from "react";
import { BundlCard } from "../components/bundlCard";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import type { NextPage } from "next";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { getAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { ImageWithFallback } from "~~/components/ImageWithFallback";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

type ChainInfo = {
  name: string;
  protocol: string;
};

const Home: NextPage = () => {
  const connectedAccount = useAccount();
  const modalRef = useRef<HTMLDivElement>(null);

  // READ FUNCTIONS
  const { data: tokenlist } = useScaffoldContractRead({
    contractName: "BundlrNft",
    functionName: "getAllTokens",
    args: [connectedAccount.address],
    watch: true,
  });

  // STATE FUNCTIONS
  const [pairingTokens, setPairingTokens] = useState<
    {
      id: string;
      symbol: string;
    }[]
  >([]);
  const [pairingTokensChainId, setPairingTokensChainId] = useState() as any;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTokens([]); // Reset selected tokens array
    setPercentageInputs([]); // Reset percentage inputs
  };

  const [selectedTokens, setSelectedTokens] = useState<
    { token: string; symbol: string; percentage: number; poolFee: number }[]
  >([]);

  const [percentageInputs, setPercentageInputs] = useState<{ token: string; percentage: number }[]>([]);

  // Get the current chainId from the wagmi hook
  const chainId = useChainId();

  // Mapping chainId to chainName so we can use the correct subgraph
  const chainInfo: { [key: number]: ChainInfo } = {
    1: { name: "ethereum", protocol: "uniswap" },
    31337: { name: "ethereum", protocol: "uniswap" },
    42161: { name: "arbitrum", protocol: "uniswap" },
    100: { name: "gnosis", protocol: "sushi" },
  };

  // Use different subgraph for Gnosis because it's using sushiswap instead of uniswap
  const APIURL = `https://api.thegraph.com/subgraphs/name/messari/${chainInfo[chainId].protocol}-v3-${chainInfo[chainId].name}`;

  // Gnosis uses XDAI instead of ETH
  const currentChainGasToken = chainId === 100 ? "XDAI" : "WETH";

  // Query to get all the pools on the SushiSwap subgraph
  const tokensQuery = `
    query {
      liquidityPools(
        first: 100,
        orderBy:cumulativeVolumeUSD,
        orderDirection: desc,
        where: {
          inputTokens_: { symbol: "${currentChainGasToken}" }
        }
      ) {
        id
        inputTokens {
          id
          symbol
        }
        fees {
          feePercentage
          feeType
        }
      }
    }
  `;

  // Create a new ApolloClient to fetch data from the subgraph
  const client = new ApolloClient({
    uri: APIURL,
    cache: new InMemoryCache(),
  });

  // Fetch the data from the subgraph
  client
    .query({
      query: gql(tokensQuery),
    })
    .then(data => {
      const tokensThatPairWithEth = data.data.liquidityPools.reduce((acc: any, pool: any) => {
        // Organize the data by token, so we can see all the pools for each token with their liquidity and feeTier
        const nonEthToken = pool.inputTokens.find((token: any) => token.symbol !== currentChainGasToken);
        const nonEthTokenAddress = getAddress(nonEthToken.id);
        const poolFee = pool.fees.find((fee: any) => fee.feeType === "FIXED_TRADING_FEE")?.feePercentage * 10000;
        if (acc[nonEthTokenAddress]) {
          return {
            ...acc,
            [nonEthTokenAddress]: {
              ...acc[nonEthTokenAddress],
              pools: [...acc[nonEthTokenAddress].pools, { feeTier: poolFee, liquidity: pool.liquidity }],
            },
          };
        }
        return {
          ...acc,
          [nonEthTokenAddress]: {
            ...nonEthToken,
            id: nonEthTokenAddress,
            pools: [{ feeTier: poolFee, liquidity: pool.liquidity }],
          },
        };
      }, {});

      // If the pairingTokens array is empty or the chainId has changed, update the state
      if (pairingTokens.length === 0 || pairingTokensChainId !== chainId) {
        setPairingTokens(tokensThatPairWithEth);
        setPairingTokensChainId(chainId);
      }
    })
    .catch(err => {
      console.log("Error fetching data: ", err);
    });

  // UTILS

  const handleTokenSelect = (symbol: string, id: string, fee: string) => {
    const tokenIndex = selectedTokens.findIndex(token => token.token === id);
    if (tokenIndex !== -1) {
      // Token is already selected, deselect it
      const updatedTokens = selectedTokens.filter(token => token.token !== id);
      setSelectedTokens(updatedTokens);
    } else {
      // Token is not selected, add it to the list and set percentages of all tokens to be equal
      const newTokenInputs = [...selectedTokens, { token: id, symbol, poolFee: parseInt(fee) }].map(input => {
        return { ...input, percentage: Math.floor(100 / (selectedTokens.length + 1)) };
      });
      // If the sum of all percentages is less than 100, add the remaining percentage to the first token
      const remainingPercentage = 100 - newTokenInputs.reduce((acc, input) => acc + input.percentage, 0);
      newTokenInputs[0].percentage += remainingPercentage;

      // Token is not selected, add it to the list and initialize its percentage input
      setSelectedTokens(newTokenInputs);
    }
  };

  const renderInputFields = () => {
    // Convert pairingTokens object into an array of its values
    const pairingTokensArray = Object.values(pairingTokens);

    return selectedTokens.map((input, index) => {
      // Find the token object with the matching address
      const tokenObject = pairingTokensArray.find(token => token.id === input.token);
      // Get the symbol from the token object
      const symbol = tokenObject ? tokenObject.symbol : "";

      return (
        <div key={index} className="mt-4 flex items-center">
          <label className="mr-2 text-md font-semibold flex-shrink-0" style={{ width: "100px" }}>
            {symbol}
          </label>
          <input
            type="number"
            value={input.percentage || ""}
            onChange={e => handlePercentageChange(e, index)}
            className="border px-2 py-1 rounded w-full"
            style={{ maxWidth: "calc(100% - 100px)" }} // Adjust based on the width of the label
          />
        </div>
      );
    });
  };

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
        src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token.id}/logo.png`}
        fallback={<Jazzicon diameter={50} seed={jsNumberForAddress(generateRandomAddress())} />}
        width={50}
        height={50}
        alt={token.symbol}
      />
    );
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newPercentage = parseInt(e.target.value);
    if (!isNaN(newPercentage) || e.target.value === "") {
      const updatedInputs = [...percentageInputs];
      updatedInputs[index].percentage = e.target.value === "" ? 0 : newPercentage;
      setPercentageInputs(updatedInputs); // Update the percentage for the selected token

      // Update the percentage for the corresponding token in selectedTokens array
      const tokenIndex = selectedTokens.findIndex(token => token.token === updatedInputs[index].token);
      if (tokenIndex !== -1) {
        const updatedTokens = [...selectedTokens];
        updatedTokens[tokenIndex].percentage = e.target.value === "" ? 0 : newPercentage;
        setSelectedTokens(updatedTokens);
      }
    }
  };

  // EFFECTS

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal(); // Close the modal if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);

  // WRITE FUNCTIONS
  const { writeAsync: mintNFT } = useScaffoldContractWrite({
    contractName: "BundlrNft",
    functionName: "mint",
    args: [selectedTokens],
  });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div>
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-30">
              <div ref={modalRef} className="bg-white p-5 rounded-lg overflow-y-auto max-w-md w-full mx-auto">
                <h2 className="text-lg font-semibold">Select Tokens</h2>
                <h3 className="text-md pb-6">Tailor your bag to suit your preferences.</h3>
                <div className="max-h-[12rem] overflow-y-auto">
                  {Object.values(pairingTokens).length > 0 ? (
                    Object.values(pairingTokens)
                      .filter((token: any) => token.symbol) // Filter out tokens with no symbol
                      .sort((a, b) => a.symbol.localeCompare(b.symbol))
                      .map((token: any, index: number) => (
                        <div
                          key={index}
                          onClick={() => {
                            const highestLiquidityPool = token.pools.reduce((acc: any, pool: any) =>
                              pool.liquidity > acc.liquidity ? pool : acc,
                            );

                            handleTokenSelect(token.symbol, token.id, highestLiquidityPool.feeTier);
                          }}
                        >
                          <div className="flex flex-row space-x-4">
                            <div>{renderTokenImage(token)}</div>
                            <div>{token.symbol}</div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div>Loading...</div>
                  )}
                </div>
                <div className="text-md pt-7 font-semibold">Select Weight</div>
                <div className="text-md pt-2">
                  You provide funds, and we diversify your investment based on your chosen weight distribution.
                </div>
                {renderInputFields()}
                <div className="flex flex-row justify-between mt-5">
                  <button
                    className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded w-full"
                    onClick={() => {
                      mintNFT(); // Pass selected tokens to mint function
                      setIsModalOpen(false);
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className={`flex flex-row space-x-[64.5rem] items-center mb-4`}>
            <div className="text-4xl font-bold">Portfolio</div>

            <div>
              <button
                className={`bg-gray-800 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded mt-5 ${
                  !connectedAccount.isConnected ? "opacity-50 hover:bg-gray-800" : ""
                }`}
                onClick={openModal}
                disabled={!connectedAccount.isConnected}
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
            {(tokenlist?.length === 0 || !tokenlist) && (
              // If there are no tokens in the list, display a nice centered message encouraging the user to create one
              <div className="flex flex-col items-center justify-center col-span-3 pt-16">
                <div className="text-2xl font-bold">
                  {connectedAccount.isConnected ? "You don't have any bags!" : "You're not connected!"}
                </div>
                <div className="text-lg font-semibold text-center">
                  {connectedAccount.isConnected
                    ? 'Click "Create" to create a new bag and diversify your investments'
                    : "Connect your wallet to create and view your bags"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
