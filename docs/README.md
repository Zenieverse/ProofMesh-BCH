
# ProofMesh BCH

**Modular Smart Contract Playground for UTXO dApps on Bitcoin Cash.**

ProofMesh BCH is a visual builder for constructing, simulating, and deploying Bitcoin Cash smart contracts. It specifically leverages **PMv3 (Covenants)**, **Cashtokens**, and **Native Introspection** to allow developers to build "micro-protocols" without deep knowledge of CashScript assembly.

## Features

- **Visual Canvas**: Drag-and-drop UTXO primitives and Smart Contract modules.
- **PMv3 Templates**: Pre-built, audited templates for Escrows, Vaults, and Prediction Markets.
- **Cashtoken Support**: Integrated Minting and Token-Gated logic.
- **AI Auditing**: Built-in Gemini integration to check logic flows for race conditions.
- **Testnet Deployment**: One-click deployment to BCH Testnet4 (Chipnet).

## Getting Started

1. **Connect Wallet**: Supports Paytaca and Selene (Testnet).
2. **Drag Nodes**: Pull a "Cashtoken Minter" or "Escrow" from the sidebar.
3. **Connect**: Link "Wallet Input" -> "Contract" -> "Tx Output".
4. **Configure**: Click a node to set parameters (Public Keys, Timeouts, Supply).
5. **Deploy**: Hit "Deploy Contract" to broadcast to the network.

## Architecture

The app runs entirely client-side using:
- **React/Typescript** for the UI.
- **CashScript** (mocked service) for contract compilation.
- **Gemini API** for intelligent contract explanation and auditing.

## Modules Included

1. **Safe Escrow**: 2-of-3 multisig with timeout.
2. **Time-Locked Vault**: CLTV-based HODL vaults.
3. **Cashtoken Minter**: Genesis capabilities and supply management.
4. **Prediction Market**: Oracle-based binary markets.
5. **CashStamps**: Loyalty token logic.

---
*Built for the Bliss 2025 Hackathon.*
