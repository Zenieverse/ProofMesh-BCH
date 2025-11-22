
import { RegistryEntry } from '../types';

const MOCK_REGISTRY_KEY = 'pm_registry_contracts';

export const fetchRegistry = async (): Promise<RegistryEntry[]> => {
    // Simulate network fetch
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const stored = localStorage.getItem(MOCK_REGISTRY_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    
    // Default mock data
    return [
        {
            id: 'init_01',
            name: 'Safe Escrow V1',
            address: 'bchtest:pq75zmtt8d84rfspye02thz59w8c0nmve53s70t2z',
            txid: '5f3c193874584329573489573489573489573489573489573489573489573489',
            deployer: 'bchtest:qq2j9gp...',
            timestamp: Date.now() - 86400000,
            network: 'testnet4',
            type: 'ESCROW' as any
        }
    ];
};

export const registerContract = async (entry: RegistryEntry): Promise<void> => {
    console.log("Registering contract on-chain...", entry);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const current = await fetchRegistry();
    const updated = [entry, ...current];
    localStorage.setItem(MOCK_REGISTRY_KEY, JSON.stringify(updated));
};
