"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BundlCard } from "./debug/_components/portfolio/bundlCard";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import type { NextPage } from "next";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { useAccount, useChainId } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const modalRef = useRef<HTMLDivElement>(null);

  // READ FUNCTIONS
  const { data: tokenlist } = useScaffoldContractRead({
    contractName: "BundlrNft",
    functionName: "getAllTokens",
    args: [connectedAddress],
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
  const chainIdToChainName: { [key: number]: string } = {
    1: "ethereum",
    31337: "ethereum", // Foundry set to Ethereum subgraph for use when forking mainnet locally
    100: "gnosis",
    42161: "arbitrum",
  };

  // Use the chainIdToChainName mapping to get the correct subgraph for the chainId
  const APIURL = `https://api.thegraph.com/subgraphs/name/sushi-v3/v3-${chainIdToChainName[chainId]}`;

  // Query to get all the pools on the SushiSwap subgraph
  const tokensQuery = `
    query {
      pools(first: 1000) {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
        feeTier
        liquidity
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
      const tokensThatPairWithEth = data.data.pools.reduce((acc: any, pool: any) => {
        // Check if the pool is an ETH pool and has liquidity
        const isEthPool = pool.token0.symbol === "WETH" || pool.token1 === "WETH";
        const hasLiquidity = pool.liquidity > 0;
        if (!isEthPool || !hasLiquidity) {
          return acc;
        }

        // Organize the data by token, so we can see all the pools for each token with their liquidity and feeTier
        const nonEthToken = pool.token0.symbol === "WETH" ? pool.token1 : pool.token0;
        if (acc[nonEthToken.id]) {
          return {
            ...acc,
            [nonEthToken.id]: {
              ...acc[nonEthToken.id],
              pools: [...acc[nonEthToken.id].pools, { feeTier: pool.feeTier, liquidity: pool.liquidity }],
            },
          };
        }
        return {
          ...acc,
          [nonEthToken.id]: { ...nonEthToken, pools: [{ feeTier: pool.feeTier, liquidity: pool.liquidity }] },
        };
      }, []);

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
      const updatedTokens = [...selectedTokens];
      updatedTokens.splice(tokenIndex, 1);
      setSelectedTokens(updatedTokens);
      // Remove the percentage for the deselected token
      const updatedInputs = percentageInputs.filter(input => input.token !== id);
      setPercentageInputs(updatedInputs);
    } else {
      // Token is not selected, add it to the list and initialize its percentage input
      setSelectedTokens([...selectedTokens, { token: id, symbol, percentage: 50, poolFee: parseInt(fee) }]);
      setPercentageInputs([...percentageInputs, { token: id, percentage: 50 }]); // Initialize the percentage input for the selected token
    }
  };

  const renderInputFields = () => {
    // Convert pairingTokens object into an array of its values
    const pairingTokensArray = Object.values(pairingTokens);

    return percentageInputs.map((input, index) => {
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

  // Render Jazzicon directly where needed
  const renderTokenImage = (token: any) => {
    console.log("token", token);
    const imagePath = `/cryptocurrency-icons/svg/color/${token.symbol.toLowerCase()}.svg`;

    try {
      require(imagePath);
      console.log("path: ", imagePath);
      return <Image src={imagePath} width={50} height={50} alt={token.symbol} />;
    } catch (error) {
      console.log("Image not found, error:", error);
      // Generate a random Ethereum address
      const address = generateRandomAddress();
      // Generate a Jazzicon using the random address
      // @ts-ignore
      return <Jazzicon diameter={25} seed={jsNumberForAddress(address)} />;
    }
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
      console.log("modalRef", modalRef.current);
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        console.log("detected");
        closeModal(); // Close the modal if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef, closeModal]);

  // WRITE FUNCTIONS
  const {
    writeAsync: mintNFT,
    // isLoading: mintNFTIsLoading,
    // isMining: mintNFTIsMining,
  } = useScaffoldContractWrite({
    contractName: "BundlrNft",
    functionName: "mint",
    args: [selectedTokens],
    onBlockConfirmation: txnReceipt => {
      console.log("Mint transaction blockHash", txnReceipt.blockHash);
    },
  });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div>
          <div className="flex flex-row space-x-[56.5rem] items-center mb-4">
            <div className="text-4xl font-bold">Portfolio</div>
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-30">
                <div
                  ref={modalRef}
                  className="bg-white p-5 rounded-lg max-h-96 overflow-y-auto max-w-md w-full mx-auto"
                >
                  <h2 className="text-lg font-semibold">Select Tokens</h2>
                  <h3 className="text-md pb-6">Tailor your bag to suit your preferences.</h3>
                  <div className="max-h-[11rem] overflow-y-auto">
                    {Object.values(pairingTokens).length > 0 ? (
                      Object.values(pairingTokens).map((token: any, index: number) => (
                        <div
                          key={index}
                          onClick={() => handleTokenSelect(token.symbol, token.id, token.pools[0].feeTier)}
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
                      className="bg-gray-800 hover:bg-green-700 text-white font-bold py-2 px-6 rounded w-full"
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
            <div>
              <button
                className="bg-gray-800 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded mt-5"
                onClick={openModal}
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
      </div>
    </>
  );
};

export default Home;
