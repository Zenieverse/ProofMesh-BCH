
export enum NodeType {
  WALLET_INPUT = 'WALLET_INPUT',
  CONTRACT_TEMPLATE = 'CONTRACT_TEMPLATE',
  TRANSACTION_OUTPUT = 'TRANSACTION_OUTPUT',
  TOKEN_GENESIS = 'TOKEN_GENESIS',
  SPLIT_UTXO = 'SPLIT_UTXO'
}

export enum ContractTemplateType {
  ESCROW = 'ESCROW',
  VAULT_TIMELOCK = 'VAULT_TIMELOCK',
  PREDICTION_MARKET = 'PREDICTION_MARKET',
  TOKEN_MINT = 'TOKEN_MINT',
  MECH_CLIENT = 'MECH_CLIENT',
  TOKEN_GATED_PAYMENT = 'TOKEN_GATED_PAYMENT',
  CASH_STAMPS = 'CASH_STAMPS',
  PAY_PER_TRIGGER = 'PAY_PER_TRIGGER'
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface CashTokenData {
  category: string; // Hex category ID
  amount: string; // BigInt as string
  capability?: 'none' | 'mutable' | 'minting';
  commitment?: string; // NFT commitment
}

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  position: NodePosition;
  data: {
    templateType?: ContractTemplateType;
    code?: string;
    params?: Record<string, string | number | boolean>;
    tokens?: CashTokenData[];
    status?: 'draft' | 'compiled' | 'deploying' | 'deployed' | 'error';
    txid?: string;
    errorMsg?: string;
    network?: 'mainnet' | 'testnet3' | 'testnet4' | 'chipnet';
    artifact?: any; // Stored compilation artifact
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WalletState {
  connected: boolean;
  authenticated: boolean;
  address: string | null;
  balance: number;
  provider: 'paytaca' | 'selene' | 'generic' | null;
  network: 'mainnet' | 'testnet' | 'chipnet';
}

export interface ContractTemplate {
  name: string;
  type: ContractTemplateType;
  description: string;
  defaultCode: string;
  params: ParamDefinition[];
  version: string;
}

export interface ParamDefinition {
  name: string;
  type: 'string' | 'int' | 'bool' | 'pubkey' | 'bytes' | 'sig';
  description: string;
  defaultValue?: string | number | boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  source: 'System' | 'Compiler' | 'Network' | 'AI' | 'Storage';
}

export interface RegistryEntry {
  id: string;
  name: string;
  address: string;
  txid: string;
  deployer: string;
  timestamp: number;
  network: string;
  type: ContractTemplateType;
}
