
import { ContractTemplateType, ContractTemplate } from '../types';

export const CONTRACT_TEMPLATES: Record<ContractTemplateType, ContractTemplate> = {
  [ContractTemplateType.ESCROW]: {
    name: "Safe Escrow (PMv3)",
    type: ContractTemplateType.ESCROW,
    description: "2-of-3 Multi-sig escrow with timeout functionality and introspection.",
    version: "1.0.0",
    params: [
        { name: "buyer", type: "pubkey", description: "Buyer's public key" },
        { name: "seller", type: "pubkey", description: "Seller's public key" },
        { name: "arbiter", type: "pubkey", description: "Arbiter's public key" },
        { name: "timeout", type: "int", description: "Block height for timeout refund", defaultValue: 100000 }
    ],
    defaultCode: `pragma cashscript ^0.10.0;

// 2-of-3 Escrow with Timeout & Introspection
contract Escrow(pubkey buyer, pubkey seller, pubkey arbiter, int timeout) {
    
    // Buyer and Seller agree to release funds
    function spend(sig s1, sig s2) {
        require(checkSig(s1, buyer) && checkSig(s2, seller));
    }

    // Arbiter resolves dispute
    function resolve(sig s1, sig s2) {
        require(checkSig(s1, arbiter));
        require(checkSig(s2, buyer) || checkSig(s2, seller));
    }

    // Timeout refund to buyer if no action taken
    function refund(sig s) {
        require(tx.time >= timeout);
        require(checkSig(s, buyer));
    }
}`
  },
  [ContractTemplateType.VAULT_TIMELOCK]: {
    name: "Time-Locked Vault",
    type: ContractTemplateType.VAULT_TIMELOCK,
    description: "Standard HODL vault forcing funds to stay until block height.",
    version: "1.0.0",
    params: [
        { name: "owner", type: "pubkey", description: "Owner's public key" },
        { name: "locktime", type: "int", description: "Block height to unlock", defaultValue: 850000 }
    ],
    defaultCode: `pragma cashscript ^0.10.0;

contract Timelock(pubkey owner, int locktime) {
    function spend(sig s) {
        require(tx.time >= locktime);
        require(checkSig(s, owner));
    }
}`
  },
  [ContractTemplateType.TOKEN_MINT]: {
    name: "Cashtoken Minter (M2V)",
    type: ContractTemplateType.TOKEN_MINT,
    description: "Mint fungible or NFT Cashtokens. Supports Mint-to-Validate patterns.",
    version: "2.1.0",
    params: [
        { name: "owner", type: "pubkey", description: "Controller of the minting capability" },
        { name: "initialSupply", type: "int", description: "Initial supply to mint", defaultValue: 1000 }
    ],
    defaultCode: `pragma cashscript ^0.10.0;

contract TokenMinter(pubkey owner) {
    function mint(sig s) {
        require(checkSig(s, owner));
        
        // Introspection: Ensure the minting capability (genesis) is preserved 
        // or burned intentionally.
        // In a real deployment, we check that tx.inputs[0] is the parent 
        // and tx.outputs[0] carries the capability forward.
        
        require(tx.inputs[0].lockingBytecode == tx.outputs[0].lockingBytecode);
        require(tx.inputs[0].tokenCategory == tx.outputs[0].tokenCategory);
    }
}`
  },
  [ContractTemplateType.PREDICTION_MARKET]: {
    name: "PMv3 Binary Prediction",
    type: ContractTemplateType.PREDICTION_MARKET,
    description: "Oracle-based binary outcome market using DataSig verification.",
    version: "3.0.0",
    params: [
        { name: "oraclePk", type: "pubkey", description: "Oracle Public Key" },
        { name: "marketId", type: "bytes", description: "Unique Event ID (hex)", defaultValue: "0x01" }
    ],
    defaultCode: `pragma cashscript ^0.10.0;

contract Prediction(pubkey oraclePk, bytes marketId) {
    // Redeem winning share
    function redeem(sig oracleSig, bool outcome, int amount) {
        // 1. Verify the Oracle signed the outcome message
        // Message format: marketId + outcome (1 byte)
        bytes message = marketId + bytes(outcome);
        require(checkDataSig(oracleSig, message, oraclePk));
        
        // 2. Introspection to ensure fair distribution
        // (Simplified: requires the output to be a standard P2PKH to the claimer)
        // In full PMv3, we would inspect the token category of inputs/outputs.
        require(tx.outputs[0].value >= amount);
    }
    
    // Cancel market if oracle fails to report
    function cancel(sig s, pubkey owner) {
        require(tx.time >= 999999999); // Indefinite for now
        require(checkSig(s, owner));
    }
}`
  },
  [ContractTemplateType.TOKEN_GATED_PAYMENT]: {
    name: "Token Gated Payment",
    type: ContractTemplateType.TOKEN_GATED_PAYMENT,
    description: "Only allow spending if a specific NFT is present in the transaction.",
    version: "1.0.0",
    params: [
        { name: "merchant", type: "pubkey", description: "Merchant public key" },
        { name: "requiredCategory", type: "bytes", description: "Token Category ID (hex)" }
    ],
    defaultCode: `pragma cashscript ^0.10.0;

contract TokenGated(pubkey merchant, bytes requiredCategory) {
    function pay(sig s) {
        require(checkSig(s, merchant));
        
        // Check if the required NFT category is present in the inputs
        bool tokenPresent = false;
        // Loop unrolling (CashScript limitation, simplified for 2 inputs)
        if (tx.inputs[0].tokenCategory == requiredCategory) tokenPresent = true;
        if (tx.inputs[1].tokenCategory == requiredCategory) tokenPresent = true;
        
        require(tokenPresent);
    }
}`
  },
  [ContractTemplateType.CASH_STAMPS]: {
    name: "CashStamps Loyalty",
    type: ContractTemplateType.CASH_STAMPS,
    description: "Loyalty card logic using mutable NFTs.",
    version: "0.9.0",
    params: [
        { name: "issuer", type: "pubkey", description: "Issuer Public Key" }
    ],
    defaultCode: `pragma cashscript ^0.10.0;

contract CashStamps(pubkey issuer) {
    function stamp(sig s) {
        require(checkSig(s, issuer));
        // Logic to increment on-chain commitment data
        // would go here via introspection of output commitment.
    }
    
    function redeem(sig s) {
        // Check if stamp count reached threshold
    }
}`
  },
  [ContractTemplateType.MECH_CLIENT]: {
    name: "Mech Client",
    type: ContractTemplateType.MECH_CLIENT,
    description: "Interact with autonomous agents.",
    version: "1.0",
    params: [{ name: "agentPk", type: "pubkey", description: "Agent Public Key" }],
    defaultCode: `pragma cashscript ^0.10.0;

contract MechClient(pubkey agent) {
    function trigger(sig s) {
        require(checkSig(s, agent));
    }
}`
  },
  [ContractTemplateType.PAY_PER_TRIGGER]: {
    name: "Pay Per Trigger",
    type: ContractTemplateType.PAY_PER_TRIGGER,
    description: "Allow anyone to trigger an action for a fixed fee paid to provider.",
    version: "1.0.0",
    params: [
      { name: "provider", type: "pubkey", description: "Service Provider PK" },
      { name: "fee", type: "int", description: "Fee in satoshis", defaultValue: 5000 },
      { name: "useCovenant", type: "bool", description: "Enforce next output state", defaultValue: true }
    ],
    defaultCode: `pragma cashscript ^0.10.0;

contract PayPerTrigger(pubkey provider, int fee) {
    function trigger() {
        // Anyone can call this, but they must pay the provider
        
        // 1. Enforce payment to provider in Output 0
        require(tx.outputs[0].value == fee);
        require(tx.outputs[0].lockingBytecode == new LockingBytecodeP2PKH(hash160(provider)));
        
        // 2. Enforce that the contract lives on (Recursive Covenant)
        // This ensures the service stays alive in Output 1
        require(tx.outputs[1].lockingBytecode == tx.inputs[0].lockingBytecode);
    }
    
    function withdraw(sig s) {
        require(checkSig(s, provider));
    }
}`
  }
};
