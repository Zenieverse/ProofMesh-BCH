import React, { useState, useEffect } from 'react';
import { FlowNode, NodeType, ContractTemplateType } from '../types';
import { CONTRACT_TEMPLATES } from '../lib/contracts';
import { explainContract, simulateContract } from '../services/gemini';

interface NodePropertiesProps {
  node: FlowNode | null;
  onUpdate: (id: string, data: any) => void;
  onDeploy: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onUpdate, onDeploy, onDelete }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loadingExplain, setLoadingExplain] = useState(false);
  
  // Simulation State
  const [activeTab, setActiveTab] = useState<'config' | 'simulate'>('config');
  const [simFunction, setSimFunction] = useState('spend');
  const [simContext, setSimContext] = useState('');
  const [simResult, setSimResult] = useState<{ success: boolean; logs: string } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    setExplanation('');
    setSimResult(null);
    setSimContext('');
    setActiveTab('config');
  }, [node?.id]);

  const handleExplain = async () => {
    if (!node?.data.code) return;
    setLoadingExplain(true);
    const result = await explainContract(node.data.code);
    setExplanation(result);
    setLoadingExplain(false);
  };

  const handleSimulate = async () => {
    if (!node?.data.code) return;
    setSimLoading(true);
    setSimResult(null);
    const result = await simulateContract(
        node.data.code,
        node.data.params || {},
        simFunction,
        simContext
    );
    setSimResult(result);
    setSimLoading(false);
  };

  const handleDownloadArtifact = () => {
     if (!node) return;
     
     // Use stored artifact if available (from deployment), otherwise generate a draft one
     const artifact = node.data.artifact || {
         contractName: node.label.replace(/\s+/g, ''),
         constructorInputs: node.data.params,
         source: node.data.code,
         compiler: { name: "cashc", version: "0.10.0" },
         network: node.data.status === 'deployed' ? 'testnet4' : 'undefined',
         updatedAt: new Date().toISOString()
     };
     
     const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${artifact.contractName}.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  if (!node) {
    return (
      <div className="w-96 border-l border-dark-700 bg-dark-800 p-6 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <p className="mb-2">Select a node to configure</p>
          <p className="text-xs text-dark-600">Contracts, Wallets, or Outputs</p>
        </div>
      </div>
    );
  }

  const isContract = node.type === NodeType.CONTRACT_TEMPLATE;
  const template = isContract && node.data.templateType ? CONTRACT_TEMPLATES[node.data.templateType] : null;

  return (
    <div className="w-96 border-l border-dark-700 bg-dark-800 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-dark-700 bg-dark-900/50">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h2 className="font-bold text-white text-lg">{node.label}</h2>
                <span className="text-[10px] text-gray-400 font-mono">{node.id}</span>
            </div>
            <span className="text-xs bg-bch/10 text-bch px-2 py-1 rounded border border-bch/20">
                {node.type.replace('_', ' ')}
            </span>
        </div>
        
        {isContract && (
            <div className="flex gap-2 bg-dark-800 p-1 rounded border border-dark-600">
                <button 
                    onClick={() => setActiveTab('config')}
                    className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'config' ? 'bg-dark-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Config
                </button>
                <button 
                    onClick={() => setActiveTab('simulate')}
                    className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'simulate' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Simulate
                </button>
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {activeTab === 'config' ? (
            <>
                {/* Status Box */}
                <div className={`p-3 rounded border flex flex-col gap-2 ${
                    node.data.status === 'deployed' 
                        ? 'bg-green-900/20 border-green-800' 
                        : node.data.status === 'error' 
                            ? 'bg-red-900/20 border-red-800' 
                            : 'bg-dark-900 border-dark-600'
                }`}>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Network Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    node.data.status === 'deployed' ? 'text-green-400' : 'text-yellow-500'
                    }`}>
                    {node.data.status?.toUpperCase() || 'DRAFT'}
                    </span>
                </div>
                {node.data.txid && (
                    <div className="mt-1 p-2 bg-dark-800 rounded text-[10px] font-mono text-gray-400 break-all border border-dark-700 hover:border-bch cursor-pointer transition-colors">
                    <span className="text-bch">TXID:</span> {node.data.txid}
                    </div>
                )}
                {node.data.status === 'deployed' && node.data.artifact?.networks?.testnet?.address && (
                    <div className="p-2 bg-dark-800 rounded text-[10px] font-mono text-gray-400 break-all border border-dark-700 hover:border-bch cursor-pointer transition-colors">
                    <span className="text-gray-500">Addr:</span> {node.data.artifact.networks.testnet.address}
                    </div>
                )}
                {node.data.errorMsg && (
                    <div className="text-xs text-red-400 mt-1">{node.data.errorMsg}</div>
                )}
                
                {node.data.status === 'deployed' && (
                     <button 
                        onClick={handleDownloadArtifact}
                        className="mt-2 w-full py-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 text-[10px] uppercase font-bold rounded border border-dark-600 transition-colors flex justify-center items-center gap-2"
                     >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download JSON Artifact
                     </button>
                )}
                </div>

                {/* Template Parameters */}
                {template && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px bg-dark-600 flex-1"></div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase">Configuration</h3>
                        <div className="h-px bg-dark-600 flex-1"></div>
                    </div>
                    
                    <p className="text-xs text-gray-500 italic">{template.description}</p>

                    <div className="space-y-3">
                    {template.params.map((param) => (
                        <div key={param.name}>
                        <label className="flex justify-between text-xs text-gray-300 mb-1">
                            <span className="font-medium">{param.name}</span>
                            <span className="text-gray-500 text-[10px]">{param.type}</span>
                        </label>
                        
                        {param.type === 'bool' ? (
                            <div className="flex items-center gap-3 bg-dark-700 border border-dark-600 rounded px-3 py-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-bch rounded focus:ring-bch bg-dark-800 border-gray-500"
                                    checked={node.data.params?.[param.name] === true || node.data.params?.[param.name] === 'true'}
                                    onChange={(e) => {
                                        const newParams = { ...node.data.params, [param.name]: e.target.checked };
                                        onUpdate(node.id, { params: newParams });
                                    }}
                                    disabled={node.data.status === 'deployed'}
                                />
                                <span className="text-sm text-gray-300">{param.description}</span>
                            </div>
                        ) : (
                            <input
                                type={param.type === 'int' ? 'number' : 'text'}
                                className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-bch transition-colors"
                                placeholder={param.description}
                                defaultValue={String(param.defaultValue || '')}
                                onChange={(e) => {
                                const val = param.type === 'int' ? parseInt(e.target.value) : e.target.value;
                                const newParams = { ...node.data.params, [param.name]: val };
                                onUpdate(node.id, { params: newParams });
                                }}
                                value={node.data.params?.[param.name] ?? ''}
                                disabled={node.data.status === 'deployed'}
                            />
                        )}
                        </div>
                    ))}
                    </div>
                </div>
                )}

                {/* Code Editor */}
                {node.data.code && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center mt-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase">Contract Logic</h3>
                    <button 
                        onClick={handleExplain}
                        disabled={loadingExplain}
                        className="flex items-center gap-1 text-xs text-bch hover:text-white transition-colors disabled:opacity-50"
                    >
                        {loadingExplain ? (
                            <span className="animate-pulse">Analyzing...</span>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                                Explain Logic
                            </>
                        )}
                    </button>
                    </div>
                    
                    <div className="relative group">
                    <textarea
                        className="w-full h-64 bg-[#1a1a1a] border border-dark-600 rounded p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-bch resize-y leading-relaxed"
                        value={node.data.code}
                        onChange={(e) => onUpdate(node.id, { code: e.target.value })}
                        spellCheck={false}
                    />
                    <div className="absolute top-2 right-2 text-[10px] text-gray-600 pointer-events-none">CashScript 0.10.0</div>
                    </div>
                    
                    {explanation && (
                    <div className="mt-3 p-4 bg-purple-900/10 rounded border border-purple-500/30 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                            <h4 className="text-xs font-bold text-purple-400">AI Audit & Explanation</h4>
                        </div>
                        <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">
                            {explanation}
                        </p>
                    </div>
                    )}
                </div>
                )}
            </>
        ) : (
            <div className="space-y-4 animate-fade-in">
                 <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-3">
                    <h3 className="text-xs font-bold text-indigo-300 mb-2 uppercase">Gemini VM Simulator</h3>
                    <p className="text-[10px] text-gray-400 mb-4">
                        Simulate contract execution in a virtual environment powered by AI. Test edge cases without spending BCH.
                    </p>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-300 block mb-1">Function to Call</label>
                            <input 
                                type="text"
                                value={simFunction}
                                onChange={(e) => setSimFunction(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                placeholder="spend"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-300 block mb-1">Mock Transaction Context (Optional)</label>
                            <textarea 
                                value={simContext}
                                onChange={(e) => setSimContext(e.target.value)}
                                className="w-full h-24 bg-dark-900 border border-dark-600 rounded p-2 text-xs font-mono text-gray-300 focus:border-indigo-500 focus:outline-none"
                                placeholder={`e.g.\nBlock Height: 850001\nSender: 0x123...\nTx Inputs: [...]`}
                            />
                        </div>

                        <button 
                            onClick={handleSimulate}
                            disabled={simLoading}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition-all flex justify-center items-center gap-2"
                        >
                            {simLoading ? 'Running Simulation...' : 'Run Simulation'}
                        </button>
                    </div>
                 </div>

                 {simResult && (
                     <div className={`p-3 rounded border ${simResult.success ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${simResult.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <h4 className={`text-xs font-bold ${simResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                {simResult.success ? 'Transaction Valid' : 'Transaction Failed'}
                            </h4>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                             <pre className="whitespace-pre-wrap text-[10px] font-mono text-gray-300 bg-dark-900/50 p-2 rounded border border-dark-700/50 overflow-x-auto">
                                 {simResult.logs}
                             </pre>
                        </div>
                     </div>
                 )}
            </div>
        )}

      </div>

      <div className="p-4 border-t border-dark-700 bg-dark-800 space-y-3">
         {isContract && activeTab === 'config' && (
            <button
              onClick={() => onDeploy(node.id)}
              disabled={node.data.status === 'deployed' || node.data.status === 'deploying'}
              className={`w-full py-3 font-bold rounded shadow-lg text-sm flex items-center justify-center gap-2 transition-all
                ${node.data.status === 'deployed' 
                    ? 'bg-dark-700 text-gray-400 cursor-not-allowed' 
                    : node.data.status === 'deploying'
                        ? 'bg-bch/50 text-white cursor-wait'
                        : 'bg-bch hover:bg-bch-light text-dark-900 shadow-bch/20 hover:shadow-bch/40'
                }
              `}
            >
              {node.data.status === 'deployed' ? (
                <>Deployed ✓</>
              ) : node.data.status === 'deploying' ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Deploying to Testnet4...
                </>
              ) : (
                'Deploy Contract'
              )}
            </button>
         )}
         <button 
            onClick={() => onDelete(node.id)}
            className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-transparent hover:border-red-900 rounded transition-all"
         >
            Delete Node
         </button>
      </div>
    </div>
  );
};