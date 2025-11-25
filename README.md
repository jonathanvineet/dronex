 # Dronex

A full-stack demo for drone delivery orchestration, on-chain escrow and simulation tools.

This repository contains two main parts:

- `sei-app` — a Next.js frontend with UI, wallet integrations, and API routes.
- `sei-so` — smart contract sources (Hardhat), scripts, tests and utility services.

This README consolidates project purpose, architecture, setup, running, testing, and development notes.

**Status:** Active development. See each subfolder README for module-specific notes.

## Table of contents

- Project overview
- Architecture & key components
- Folder structure
- Quick start (local dev)
- Smart contracts (build / test / deploy)
- Frontend (run / build)
- Backend scripts & utilities
- Testing
- Environment variables and configuration
- Contributing
- Helpful links & resources

## Project overview

Dronex demonstrates an integrated drone-delivery system that combines a Next.js frontend (`sei-app`) with smart contracts and tooling (`sei-so`) for escrow, job allocation, and analytics. The stack is built for development and integration testing with Hardhat for contracts and Next.js for the web UI.

Use cases included:

- Simulating drone job allocation and delivery escrow
- On-chain escrow management using `DeliveryEscrow.sol`
- Wallet integrations and simple UX for assigning drones and tracking deliveries

## Architecture & key components

- Frontend: `sei-app` — Next.js app with pages, components and API routes under `src/app`.
- Contracts: `sei-so/contracts/DeliveryEscrow.sol` — core escrow contract.
- Hardhat: `sei-so` uses Hardhat to compile, test and deploy contracts. Artifacts live in `sei-so/artifacts`.
- Scripts: Deployment, verification and helper scripts live in `sei-so/scripts` and the `pages`/`scripts` folders for integration tests.

The app communicates with the contracts via configured RPC endpoints and uses local APIs under `sei-app/src/app/api` to proxy or orchestrate operations when needed.

## Folder structure (high level)

- `sei-app/` — Next.js frontend
	- `src/app/` — routes, pages, and API endpoints
	- `src/components/` — UI components
	- `src/services/` — client-side services to interact with contracts or backend

- `sei-so/` — smart contract workspace
	- `contracts/` — Solidity source files (`DeliveryEscrow.sol`)
	- `scripts/` — deployment and helper scripts
	- `artifacts/` — compiled contract output (auto-generated)
	- `test-*.js` and `run-test.js` — tests and utilities

## Quick start (local development)

### Prerequisites

- Node.js 18+ recommended
- `npm` or `pnpm` (examples use `npm`)
- `npx` (comes with npm)
- (Optional) `git` to clone and manage branches

### 1. Clone the repo

```bash
git clone <repo-url> dronex
cd dronex
```

### 2. Install dependencies

```bash
cd sei-app
npm install
cd ../sei-so
npm install
```

### 3. Start a local Hardhat node and deploy contracts

Open one terminal and run:

```bash
cd sei-so
npx hardhat node
```

In another terminal, deploy the contracts to the local node:

```bash
cd sei-so
npx hardhat run scripts/deploy.js --network localhost
```

Notes: if `scripts/deploy.js` is not present, inspect `sei-so/scripts` for deploy helpers such as `deploy.js` or `deploy-ethers.js`.

### 4. Run the frontend

```bash
cd sei-app
npm run dev
```

The frontend runs at `http://localhost:3000` by default.

## Smart contracts — build / test / deploy

Common Hardhat tasks (run from `sei-so`):

- Compile:

```bash
cd sei-so
npx hardhat compile
```

- Run tests:

```bash
cd sei-so
npm test
# or
npx hardhat test
```

- Deploy (example to local node):

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Artifacts and ABIs are emitted to `sei-so/artifacts` and `sei-so/build-info`.

Contract of interest:

- `contracts/DeliveryEscrow.sol` — on-chain escrow for payments tied to delivery jobs. See `sei-so/artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json` for ABI and bytecode.

## Frontend — run / build

Development server (hot reload):

```bash
cd sei-app
npm run dev
```

Production build:

```bash
cd sei-app
npm run build
npm run start
```

API routes used by the app live under `src/app/api` (Examples: `drone/route.js`, `drones/route.js`, and `assign-drone/route.js`). These can provide mock data or forward to on-chain interactions depending on configuration.

## Backend scripts & utilities

`sei-so` contains helpful scripts for deploying and testing contracts. Example files include:

- `scripts/deploy.js` — deployment script
- `scripts/deploy-ethers.js` — ethers-based deploy helper
- `run-test.js` — runs integration and test harnesses

Run these from `sei-so` with `node` or `npx hardhat run` per script instructions.

## Environment variables & configuration

Sensitive values and RPC endpoints should be provided via environment variables. Common variables:

- `PRIVATE_KEY` — deployer account private key (for non-local networks)
- `RPC_URL` — RPC endpoint for the target network
- `INFURA_API_KEY` / `ALCHEMY_API_KEY` — optional provider keys

Create a `.env` in `sei-so` and/or `sei-app` as needed (do not commit `.env`):

```text
# example .env
PRIVATE_KEY=0x...
RPC_URL=https://sepolia.infura.io/v3/...
```

## Testing & integration

- Unit tests: `cd sei-so && npx hardhat test`
- Integration harnesses: there are several `test-*.js` files in `sei-so` that demonstrate scenarios such as fee handling, drone job flows and contract interactions. Run `node run-test.js` to execute the integration flow used during development.

If tests reference pre-funded wallets or specific chain state, run a local Hardhat node and deploy fixtures before running the integration tests.

## Notes about contracts and known issues

- The repo includes debugging artifacts and notes (e.g., `CONTRACT_DECODING_FIX.md`, `drone-fee-implementation.md`) — consult those files for historical fixes and reasoning behind contract changes.
- If you find failing tests, check the Hardhat output and ensure the local node has the expected accounts and balances.

## Contributing

Thanks for considering contributing! Suggested contribution steps:

1. Open an issue to discuss large changes.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Add tests for any contract or backend changes.
4. Open a pull request describing your changes.

Coding style: follow existing project conventions in `sei-app` and `sei-so`.

## Troubleshooting

- If the frontend cannot reach the contracts, ensure the contracts are deployed and `RPC_URL` points to the correct network.
- If Hardhat tests fail due to nonce or gas issues, restart the local node and redeploy contracts.

## Helpful links

- Contracts: `sei-so/contracts/DeliveryEscrow.sol`
- Frontend entry: `sei-app/src/app/page.js` and `sei-app/src/app/layout.js`

## Where to go next

- Explore `sei-app/src/components` to adjust UI and instrument additional debug logging.
- Review `sei-so/test-*.js` to understand the test scenarios and extend them.

## License

Add a `LICENSE` file to this repo if you plan to publish. If you want a permissive license, consider `MIT`.

---

If you'd like, I can:

- Add badges (build, tests) to this `README.md`.
- Create a `CONTRIBUTING.md` or `LICENSE` file.
- Tailor the Quick Start commands to use `pnpm` or a specific Node version manager.

Tell me which of those you'd like next.
