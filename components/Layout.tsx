
import React, { useState } from 'react';
import { WalletState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  wallet: WalletState;
  onConnect: () => void;
  onOpenRegistry: () => void;
  bottomPanel?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, wallet, onConnect, onOpenRegistry, bottomPanel }) => {
  const [copied, setCopied] = useState(false);

  const handleWalletClick = () => {
    if (wallet.connected && wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      onConnect();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-dark-900 text-gray-100">
      <header className="h-16 border-b border-dark-700 bg-dark-800 flex items-center justify-between px-6 z-20 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-bch-dark to-bch flex items-center justify-center font-bold text-white text-xl shadow-bch/20 shadow-lg">
            P
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            ProofMesh <span className="text-bch">BCH</span>
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-gray-400 border border-dark-600">
            Testnet4
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <button onClick={onOpenRegistry} className="text-sm font-medium hover:text-bch transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Registry
          </button>
          <a href="#" className="text-sm font-medium hover:text-bch transition-colors">Docs</a>
          <button
            onClick={handleWalletClick}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 border flex items-center gap-2 ${
              wallet.connected
                ? 'bg-dark-700 border-bch text-bch hover:bg-dark-600'
                : 'bg-bch hover:bg-bch-light text-dark-900 border-transparent'
            }`}
            title={wallet.connected ? "Click to copy address" : "Connect Wallet"}
          >
             {wallet.authenticated && !copied && (
                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
             )}
            {wallet.connected 
              ? (copied ? 'Copied!' : `${wallet.address?.slice(0, 8)}...`)
              : 'Connect Wallet'}
          </button>
        </nav>
      </header>
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </main>
      {bottomPanel}
    </div>
  );
};
