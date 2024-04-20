"use client";

import { useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useChainId } from "wagmi";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const chainId = useChainId();
  const [pairingTokens, setPairingTokens] = useState([]) as any[];
  const [pairingTokensChainId, setPairingTokensChainId] = useState() as any;

  // Mapping chainId to chainName so we can use the correct subgraph
  const chainIdToChainName: { [key: number]: string } = {
    1: "ethereum",
    31337: "ethereum",
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

        <div className="px-5">
          <h2 className="text-center text-xl">Available Tokens with their pools</h2>
          <ul className="text-center">
            {Object.values(pairingTokens).map((pool: any, index: number) => (
              <>
                <li key={index}>
                  <span>{pool.symbol}</span>
                  <ul>
                    {pool.pools.map((pool: any, index: number) => (
                      <li key={index}>
                        <span>Fee Tier: {pool.feeTier}</span>, <span>Liquidity: {pool.liquidity}</span>
                      </li>
                    ))}
                  </ul>
                </li>
                <br />
              </>
            ))}
          </ul>
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
