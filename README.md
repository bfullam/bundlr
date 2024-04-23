# 🎁 Bags

## Project Description
Bags is shaking up the NFT game. Picture this: NFTs with their own wallets, calling the shots based on how you told them to manage your assets. Yep, that's Bags. Using the ERC-6551 standard, we're giving NFTs the power to manage their wallets, decide where incoming ETH goes, and convert it into tokens you choose.

What's cool is, you get to set the rules when you mint your NFT. Want it split 50-50 between ETH and your favorite token? No problem. Plus, each NFT gets a unique look based on your choices, adding that personal touch.

With Bags, it's not just about owning NFTs; it's about using them to streamline your investment strategy and simplify your wallet.

## How it's Made
The main ingredients: Love, sweat and tears. Built with extreme enjoyment (and stress) as my second foray into web3 hackathons. I had such a great time with this project!

Technologies Used: Scaffold-Eth: The entirety of Bags is build on the skeleton of Scaffold-Eth. Token Swapping Protocol: For token swapping functionality, we integrated with Sushiswap. This allowed for easy conversion of incoming ETH into specified tokens across all the chains we wanted to support. ERC-6551: Bags relies heavily on the new ERC-6551 standard, which allows NFTs to own and control their own smart contract wallets.

Notable "Hacky" Solutions: One notable aspect of our implementation is the dynamic generation of images based on the asset allocations. To do this, we generate custom SVG code for the tokenURI each time it's called. By doing this, we were able to make visually distinct images tailored to each NFT's unique settings. This "hacky" solution allowed us to add a personalized touch to each NFT without compromising scalability or performance.

## Deploy

In order to run this project locally, you must have an ERC-6551 Registry contract deployed. See Tokenbound docs <a href="https://docs.tokenbound.org/guides/deploy-registry">here</a>

To test ERC-6551 implementation:

1. Yarn chain
2. Deploy ERC-6551 Registry contract as in <a href="https://docs.tokenbound.org/guides/deploy-registry">Tokenbound docs</a>
3. Yarn deploy

Home page:
1. Mint NFT
  - Calls mint() on the NFT contract using the default Anvil account
2. Fund
  - Calls fundWithEth() on the NFT contract, sending the ETH set in the input
3. Liquidate
  - Calls unbundle() on the NFT contract, returning all held assets to the NFT owner

Current Deployments:
Arbitrum
  Bundle6551Implementation: 0x007Ed7Bc73CF56050db8a261E14dc973825D2663
  BundlrNft: 0x9Fa433656a0650918c5Ec00887c38E8D3B6a4ee0

Gnosis
  Bundle6551Implementation: 0x3D7D7B847BF22009e02769E475C137d215adb0dF
  BundlrNft: 0x3faD711398399abc798356AAB015789A11E530A9

# 🏗 Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, RainbowKit, Foundry, Wagmi, Viem, and Typescript.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/b237af0c-5027-4849-a5c1-2e31495cccb1)

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Foundry. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/foundry/foundry.toml`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/foundry/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/foundry/script` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn foundry:test`

- Edit your smart contract `YourContract.sol` in `packages/foundry/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/foundry/script`

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
