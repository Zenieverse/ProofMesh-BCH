
import React from 'react';
import { ContractTemplateType, NodeType } from '../types';

export const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, type: NodeType, templateType?: ContractTemplateType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type, templateType }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 border-r border-dark-700 bg-dark-800 flex flex-col h-full z-10 shadow-xl select-none">
      <div className="p-4 border-b border-dark-700 bg-dark-900/50">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Node Palette</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        
        {/* UTXO Primitives */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-wider">UTXO Primitives</h3>
          <div className="space-y-2">
            <div 
                className="p-3 bg-dark-700 rounded border border-dark-600 cursor-grab hover:border-blue-400 transition-all group"
                draggable
                onDragStart={(e) => onDragStart(e, NodeType.WALLET_INPUT)}
            >
                <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-white">Wallet Input</span>
                </div>
            </div>
            <div 
                className="p-3 bg-dark-700 rounded border border-dark-600 cursor-grab hover:border-purple-400 transition-all group"
                draggable
                onDragStart={(e) => onDragStart(e, NodeType.TRANSACTION_OUTPUT)}
            >
                <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-white">Tx Output</span>
                </div>
            </div>
          </div>
        </div>

        {/* Smart Contracts */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-wider">Modules (PMv3)</h3>
          <div className="space-y-2">
            {[
                { label: 'Escrow (2-of-3)', type: ContractTemplateType.ESCROW, color: 'bg-orange-500' },
                { label: 'Time-Locked Vault', type: ContractTemplateType.VAULT_TIMELOCK, color: 'bg-yellow-500' },
                { label: 'Prediction Market', type: ContractTemplateType.PREDICTION_MARKET, color: 'bg-pink-500' },
                { label: 'Token Gated Payment', type: ContractTemplateType.TOKEN_GATED_PAYMENT, color: 'bg-indigo-500' },
                { label: 'Pay Per Trigger', type: ContractTemplateType.PAY_PER_TRIGGER, color: 'bg-cyan-500' },
                { label: 'Mech Client', type: ContractTemplateType.MECH_CLIENT, color: 'bg-teal-500' },
            ].map((item) => (
                <div 
                key={item.type}
                className="p-3 bg-dark-700 rounded border border-dark-600 cursor-grab hover:border-bch transition-all group"
                draggable
                onDragStart={(e) => onDragStart(e, NodeType.CONTRACT_TEMPLATE, item.type)}
                >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-lg opacity-80 group-hover:opacity-100`}></div>
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white">{item.label}</span>
                </div>
                </div>
            ))}
          </div>
        </div>

        {/* Cashtokens */}
        <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-wider">Cashtokens</h3>
            <div className="space-y-2">
                 <div 
                    className="p-3 bg-dark-700 rounded border border-dark-600 cursor-grab hover:border-green-400 transition-all group"
                    draggable
                    onDragStart={(e) => onDragStart(e, NodeType.CONTRACT_TEMPLATE, ContractTemplateType.TOKEN_MINT)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">Token Minter</span>
                    </div>
                </div>
                <div 
                    className="p-3 bg-dark-700 rounded border border-dark-600 cursor-grab hover:border-red-400 transition-all group"
                    draggable
                    onDragStart={(e) => onDragStart(e, NodeType.CONTRACT_TEMPLATE, ContractTemplateType.CASH_STAMPS)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">CashStamps</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 p-4 bg-dark-900/50 rounded border border-dashed border-dark-600 text-center">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            v0.1.0-alpha<br/>
            Drag nodes to canvas.<br/>
            Connect outputs to inputs.
          </p>
        </div>
      </div>
    </div>
  );
};
