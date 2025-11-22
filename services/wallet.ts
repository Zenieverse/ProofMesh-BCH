import { WalletState } from '../types';

// Mock types for window objects
declare global {
  interface Window {
    paytaca?: {
        connect: () => Promise<string>;
        isEnabled: () => Promise<boolean>;
        signMessage: (args: { message: string, address: string }) => Promise<string>;
    };
    selene?: any;
  }
}

export const connectWallet = async (providerName: 'paytaca' | 'selene'): Promise<WalletState> => {
  try {
    console.log(`Connecting to ${providerName}...`);

    // 1. Check for Real Provider (Paytaca)
    if (providerName === 'paytaca' && window.paytaca) {
        try {
            // Attempt real connection if extension exists
            const address = await window.paytaca.connect();
            return {
                connected: true,
                authenticated: false,
                address: address, // Real address
                balance: 0, // Would need to fetch via Electrum/REST
                provider: 'paytaca',
                network: 'mainnet' // Usually defaults to mainnet, app handles network switching logic
            };
        } catch (e) {
            console.warn("Real Paytaca connection failed, falling back to mock.", e);
        }
    }

    // 2. Fallback to Mock (for Dev/Demo)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      connected: true,
      authenticated: false,
      address: providerName === 'paytaca'
        ? "bchtest:qq2j9gp97gm9a6lx6648s2r3l2l22558hsg3j7k43t" 
        : "bchtest:qz7j9gp97gm9a6lx6648s2r3l2l22558hsg3j7k...selene",
      balance: 14.5234,
      provider: providerName,
      network: 'testnet'
    };
  } catch (error) {
    console.error("Wallet connection failed", error);
    throw error;
  }
};

export const signMessage = async (provider: string, address: string, message: string): Promise<string> => {
    // Simulate signing for login challenge
    console.log(`Signing message with ${provider}: ${message}`);
    
    if (provider === 'paytaca' && window.paytaca) {
        try {
            return await window.paytaca.signMessage({ message, address });
        } catch (e) {
            console.warn("Real signing failed, using mock signature.");
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 600));
    // Use btoa for browser compatibility instead of Buffer
    return `sig_${btoa(message)}_${Date.now()}`;
};

export const signTransaction = async (provider: string, rawTx: string): Promise<string> => {
    // Simulate signing
    console.log(`Signing with ${provider}: ${rawTx}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return `${rawTx}_signed_by_${provider}`;
};