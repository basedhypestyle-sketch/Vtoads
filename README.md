# Based Vice Toads Mini-App (Next.js + Hardhat) - English

This repository includes:
- Next.js frontend (Claim, Profile, Mint pages) in English
- Next.js API routes: /api/claim (verify ownership & claim), /api/opensea-assets (proxy OpenSea), /api/profile
- ABI file for mintPublic
- Solidity contract `ViceToads.sol` (ERC20 + EIP-712 voucher redeem)
- Hardhat config & deploy script

## Quickstart
1. Copy `.env.example` to `.env.local` and fill environment variables.
2. `npm install`
3. Run dev server: `npm run dev`
4. Hardhat: `npx hardhat compile`

## Notes
- Do NOT commit `SERVER_PRIVATE_KEY` to a public repo.
- Replace `RPC_URL` with a provider that supports the network where the NFT contract is deployed.
