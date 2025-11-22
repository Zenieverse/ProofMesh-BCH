
import React from 'react';
import { RegistryEntry } from '../types';

interface RegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: RegistryEntry[];
}

export const RegistryModal: React.FC<RegistryModalProps> = ({ isOpen, onClose, entries }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-600 rounded-lg shadow-2xl w-[800px] max-h-[80vh] flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-bch/20 flex items-center justify-center text-bch">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Contract Registry</h2>
                <p className="text-xs text-gray-400">Deployed contracts on BCH Testnet4</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
            {entries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No contracts deployed yet.
                </div>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-dark-600 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="pb-3 pl-2">Name</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Contract Address</th>
                            <th className="pb-3">Deploy Date</th>
                            <th className="pb-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-dark-700/50 transition-colors">
                                <td className="py-3 pl-2 font-medium text-white">{entry.name}</td>
                                <td className="py-3">
                                    <span className="px-2 py-0.5 rounded bg-dark-600 text-xs text-gray-300 border border-dark-500">
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="py-3 font-mono text-xs text-bch truncate max-w-[150px]">
                                    {entry.address}
                                </td>
                                <td className="py-3 text-gray-500 text-xs">
                                    {new Date(entry.timestamp).toLocaleDateString()}
                                </td>
                                <td className="py-3 text-right">
                                    <a 
                                        href={`https://chipnet.imaginary.cash/tx/${entry.txid}`} 
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-xs hover:underline"
                                    >
                                        View TX
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-dark-700 bg-dark-900/50 text-center">
            <p className="text-[10px] text-gray-500">
                Registry Contract: <span className="font-mono">bchtest:pq...registry</span>
            </p>
        </div>
      </div>
    </div>
  );
};
