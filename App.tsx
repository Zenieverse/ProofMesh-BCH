import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { NodeProperties } from './components/NodeProperties';
import { Console } from './components/Console';
import { RegistryModal } from './components/RegistryModal';
import { FlowNode, FlowEdge, NodeType, ContractTemplateType, WalletState, LogEntry, RegistryEntry } from './types';
import { CONTRACT_TEMPLATES } from './lib/contracts';
import { auditWorkflow } from './services/gemini';
import { connectWallet, signMessage } from './services/wallet';
import { deployContractToNetwork } from './services/deployment';
import { saveProjectToIPFS } from './services/ipfs';
import { registerContract, fetchRegistry } from './services/registry';

// Utility to generate unique IDs
const generateId = () => `node_${Date.now().toString().slice(-6)}`;

export default function App() {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    authenticated: false,
    address: null,
    balance: 0,
    provider: null,
    network: 'testnet'
  });
  
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Console State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setConsoleOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Registry State
  const [isRegistryOpen, setRegistryOpen] = useState(false);
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);

  // Dragging State
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const addLog = (level: LogEntry['level'], source: LogEntry['source'], message: string) => {
    const newLog: LogEntry = {
        id: Date.now().toString() + Math.random(),
        timestamp: Date.now(),
        level,
        source,
        message
    };
    setLogs(prev => [...prev, newLog]);
    if (level === 'error' || level === 'success') setConsoleOpen(true);
  };

  // Persistence
  useEffect(() => {
    const savedNodes = localStorage.getItem('pm_nodes');
    const savedEdges = localStorage.getItem('pm_edges');
    if (savedNodes) setNodes(JSON.parse(savedNodes));
    if (savedEdges) setEdges(JSON.parse(savedEdges));
    
    fetchRegistry().then(setRegistryEntries);
    addLog('info', 'System', 'Ready. Loaded local state.');
  }, []);

  useEffect(() => {
    localStorage.setItem('pm_nodes', JSON.stringify(nodes));
    localStorage.setItem('pm_edges', JSON.stringify(edges));
  }, [nodes, edges]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        // Prevent deletion if user is typing in an input field
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        
        handleDeleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  // Wallet Connection & Login
  const handleConnectWallet = async () => {
    try {
      addLog('info', 'System', 'Initiating wallet connection...');
      const walletData = await connectWallet('paytaca');
      setWallet(walletData);
      addLog('success', 'Network', `Connected to ${walletData.provider} (${walletData.address})`);

      // Perform Login Challenge (Signature)
      if (walletData.address) {
          addLog('info', 'System', 'Requesting authentication signature...');
          const msg = `Login to ProofMesh BCH at ${Date.now()}`;
          try {
              const sig = await signMessage(walletData.provider!, walletData.address, msg);
              setWallet(prev => ({ ...prev, authenticated: true }));
              addLog('success', 'System', `User authenticated via BIP-137 signature.`);
          } catch (sigError) {
              addLog('warning', 'System', 'Authentication failed or cancelled.');
          }
      }

    } catch (e) {
      addLog('error', 'Network', 'Failed to connect wallet.');
    }
  };

  // Project Saving
  const handleSaveProject = async () => {
      setIsSaving(true);
      addLog('info', 'Storage', 'Pinning project to IPFS...');
      try {
          const cid = await saveProjectToIPFS(nodes, edges, 'My Project');
          addLog('success', 'Storage', `Project saved! IPFS CID: ${cid}`);
      } catch (e) {
          addLog('error', 'Storage', 'Failed to save project.');
      }
      setIsSaving(false);
  };

  // Node Management
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/reactflow');
    if (!data) return;

    const { type, templateType } = JSON.parse(data);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Center the new node on the mouse cursor (Offset: -80px x, -40px y)
    const x = event.clientX - rect.left - 80;
    const y = event.clientY - rect.top - 40;

    const newNode: FlowNode = {
      id: generateId(),
      type,
      label: templateType ? CONTRACT_TEMPLATES[templateType as ContractTemplateType].name : (type === NodeType.WALLET_INPUT ? 'Wallet Input' : 'Tx Output'),
      position: { x, y },
      data: {
        templateType,
        status: 'draft',
        code: templateType ? CONTRACT_TEMPLATES[templateType as ContractTemplateType].defaultCode : undefined,
        params: {}
      }
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    addLog('info', 'System', `Added node: ${newNode.label}`);
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Canvas Interactions
  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setConnectingNodeId(id);
    } else {
      setSelectedNodeId(id);
      setDraggedNode(id);
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggedNode) {
       // Center dragging (Offset: -80px x, -40px y)
       setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, position: { x: x - 80, y: y - 40 } } : n));
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggedNode(null);
    setConnectingNodeId(null);
  };

  const handleMouseUpNode = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (connectingNodeId && connectingNodeId !== targetId) {
      // Create Edge
      const newEdge: FlowEdge = {
        id: `e_${connectingNodeId}-${targetId}`,
        source: connectingNodeId,
        target: targetId
      };
      if (!edges.find(e => e.source === connectingNodeId && e.target === targetId)) {
        setEdges(prev => [...prev, newEdge]);
        addLog('info', 'System', 'Nodes connected.');
      }
    }
    setConnectingNodeId(null);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
    addLog('info', 'System', 'Node deleted.');
  };

  const updateNodeData = (id: string, data: any) => {
    setNodes(prev => prev.map(n => {
        if (n.id === id) {
            return { ...n, data: { ...n.data, ...data }};
        }
        return n;
    }));
  };

  const handleDeploy = async (id: string) => {
    if (!wallet.connected) {
      addLog('warning', 'Network', 'Cannot deploy: Wallet not connected.');
      alert("Please connect a wallet first.");
      return;
    }
    
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    updateNodeData(id, { status: 'deploying', errorMsg: undefined });
    addLog('info', 'Compiler', `Compiling ${node.label}...`);
    
    const result = await deployContractToNetwork(node, 'testnet');
    
    if (result.success) {
        updateNodeData(id, { 
            status: 'deployed', 
            txid: result.txid,
            artifact: result.artifact 
        });
        
        // Register in Registry
        if (wallet.address && result.contractAddress && result.txid && node.data.templateType) {
            const newEntry: RegistryEntry = {
                id: result.txid,
                name: node.label,
                address: result.contractAddress,
                txid: result.txid,
                deployer: wallet.address,
                timestamp: Date.now(),
                network: 'testnet4',
                type: node.data.templateType
            };
            await registerContract(newEntry);
            setRegistryEntries(prev => [newEntry, ...prev]);
            addLog('info', 'Network', 'Contract added to Registry.');
        }

        addLog('success', 'Network', `Deployed successfully! TXID: ${result.txid?.substring(0, 12)}...`);
    } else {
        updateNodeData(id, { status: 'error', errorMsg: result.error });
        addLog('error', 'Network', `Deployment failed: ${result.error}`);
    }
  };

  const runAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    addLog('info', 'AI', 'Submitting workflow to Gemini Auditor...');
    
    const result = await auditWorkflow(nodes, edges);
    setAuditResult(result);
    
    addLog('success', 'AI', 'Audit complete. Report generated.');
    setIsAuditing(false);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  const renderEdges = () => {
    return edges.map(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return null;

      // Draw from Right side of Source to Left side of Target
      // Node width is w-40 (approx 160px)
      const sx = source.position.x + 160; 
      const sy = source.position.y + 40; // Middle height approx
      const tx = target.position.x;
      const ty = target.position.y + 40;
      
      // Cubic Bezier Curve
      const d = `M${sx},${sy} C${sx + 50},${sy} ${tx - 50},${ty} ${tx},${ty}`;

      return (
        <path
          key={edge.id}
          d={d}
          stroke="#4FF0C2"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
          onDoubleClick={(e) => {
             e.stopPropagation();
             setEdges(prev => prev.filter(ed => ed.id !== edge.id));
             addLog('info', 'System', 'Connection removed.');
          }}
        >
            <title>Double-click to remove connection</title>
        </path>
      );
    });
  };

  // Helper for dynamic node styling matching Sidebar palette
  const getNodeHeaderClass = (node: FlowNode) => {
    if (node.type === NodeType.WALLET_INPUT) return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
    if (node.type === NodeType.TRANSACTION_OUTPUT) return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
    
    if (node.type === NodeType.CONTRACT_TEMPLATE) {
        const type = node.data.templateType;
        if (type === ContractTemplateType.TOKEN_MINT) return 'bg-green-500/10 border-green-500/30 text-green-300';
        if (type === ContractTemplateType.CASH_STAMPS) return 'bg-red-500/10 border-red-500/30 text-red-300';
        if (type === ContractTemplateType.PREDICTION_MARKET) return 'bg-pink-500/10 border-pink-500/30 text-pink-300';
        if (type === ContractTemplateType.VAULT_TIMELOCK) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
        if (type === ContractTemplateType.PAY_PER_TRIGGER) return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
        if (type === ContractTemplateType.MECH_CLIENT) return 'bg-teal-500/10 border-teal-500/30 text-teal-300';
        if (type === ContractTemplateType.TOKEN_GATED_PAYMENT) return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
        return 'bg-orange-500/10 border-orange-500/30 text-orange-300';
    }
    return 'bg-dark-700 border-dark-600 text-gray-300';
  };

  return (
    <Layout 
        wallet={wallet} 
        onConnect={handleConnectWallet}
        onOpenRegistry={() => setRegistryOpen(true)}
        bottomPanel={
            <Console 
                logs={logs} 
                isOpen={isConsoleOpen} 
                onToggle={() => setConsoleOpen(!isConsoleOpen)}
                onClear={() => setLogs([])}
            />
        }
    >
      <div className="flex h-full pb-8">
        <Sidebar />
        
        <div className="flex-1 relative flex flex-col">
          {/* Toolbar */}
          <div className="h-12 border-b border-dark-700 bg-dark-800 flex items-center justify-between px-4">
             <div className="flex items-center gap-3">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Canvas:</span>
                <span className="text-white text-sm font-medium">Protocol V1</span>
                <span className="text-xs px-2 py-0.5 bg-dark-600 rounded text-gray-400">Draft</span>
             </div>
             <div className="flex gap-2 items-center">
                <button 
                    onClick={handleSaveProject}
                    disabled={isSaving}
                    className="text-xs text-gray-300 hover:text-white flex items-center gap-1 mr-4 disabled:opacity-50"
                >
                    {isSaving ? <span className="animate-pulse">Saving...</span> : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            Save to IPFS
                        </>
                    )}
                </button>

                <button 
                  onClick={() => { setEdges([]); addLog('info', 'System', 'Cleared connections.'); }}
                  className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
                >
                    Clear Connections
                </button>
                <button 
                  onClick={() => { setNodes([]); setEdges([]); addLog('warning', 'System', 'Reset canvas.'); }}
                  className="px-3 py-1.5 text-red-400 hover:text-red-300 text-xs transition-colors mr-4"
                >
                    Reset Canvas
                </button>
                <button 
                   onClick={runAudit}
                   disabled={isAuditing}
                   className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg flex items-center gap-2 transition-all"
                >
                    {isAuditing ? 'Auditing...' : (
                        <>
                             <span>AI Audit</span>
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        </>
                    )}
                </button>
             </div>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 bg-dark-900 grid-bg relative overflow-hidden"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            onClick={() => setSelectedNodeId(null)}
          >
             <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#4FF0C2" />
                  </marker>
                </defs>
                
                {renderEdges()}
                
                {/* Temporary Connection Line - Visible when dragging to connect */}
                {connectingNodeId && (() => {
                   const sourceNode = nodes.find(n => n.id === connectingNodeId);
                   if (!sourceNode) return null;
                   const sx = sourceNode.position.x + 160; // right side
                   const sy = sourceNode.position.y + 40;  // middle height
                   return (
                       <path 
                         d={`M${sx},${sy} L${mousePos.x},${mousePos.y}`} 
                         stroke="#4FF0C2" 
                         strokeWidth="2" 
                         strokeDasharray="5,5" 
                       />
                   );
                })()}
             </svg>

             {nodes.map(node => (
               <div
                 key={node.id}
                 className={`absolute w-40 rounded-lg shadow-2xl border transition-all cursor-pointer select-none z-10 group
                    ${selectedNodeId === node.id ? 'border-bch ring-1 ring-bch/50 scale-105' : 'border-dark-600 bg-dark-800 hover:border-gray-500'}
                    ${node.type === NodeType.CONTRACT_TEMPLATE ? 'bg-dark-800' : 'bg-dark-700'}
                 `}
                 style={{ left: node.position.x, top: node.position.y }}
                 onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                 onMouseUp={(e) => handleMouseUpNode(e, node.id)}
               >
                 <div className={`p-2 border-b rounded-t-lg flex items-center justify-between ${getNodeHeaderClass(node)}`}>
                    <span className="text-xs font-bold truncate max-w-[100px]">{node.label}</span>
                    {node.data.status === 'deployed' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>}
                    {node.data.status === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                 </div>
                 <div className="p-2">
                    <div className="text-[9px] text-gray-500 font-mono flex justify-between">
                       <span>{node.type === NodeType.CONTRACT_TEMPLATE ? 'PMv3' : 'UTXO'}</span>
                       {node.data.txid && <span className="text-green-500">ON-CHAIN</span>}
                    </div>
                 </div>
                 
                 {/* Connection Points */}
                 <div className="absolute top-1/2 -left-1.5 w-3 h-3 rounded-full bg-dark-700 border border-gray-500 hover:bg-bch hover:scale-125 transition-all" title="Input"></div>
                 <div className="absolute top-1/2 -right-1.5 w-3 h-3 rounded-full bg-dark-700 border border-gray-500 hover:bg-bch hover:scale-125 transition-all" title="Output"></div>
               </div>
             ))}

             {/* Floating Audit Report */}
             {auditResult && (
               <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-dark-800 border border-indigo-500 p-0 rounded-lg shadow-2xl z-50 flex flex-col max-h-[50%] animate-slide-up">
                  <div className="p-3 border-b border-dark-700 bg-indigo-900/20 flex justify-between items-center">
                     <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                        <span className="text-lg">🛡️</span> Protocol Audit
                     </h3>
                     <button onClick={() => setAuditResult(null)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div className="p-4 overflow-y-auto prose prose-invert prose-sm">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-gray-300">{auditResult}</pre>
                  </div>
               </div>
             )}
          </div>
        </div>

        <NodeProperties 
          node={selectedNode} 
          onUpdate={updateNodeData} 
          onDeploy={handleDeploy}
          onDelete={handleDeleteNode}
        />

        <RegistryModal 
            isOpen={isRegistryOpen}
            onClose={() => setRegistryOpen(false)}
            entries={registryEntries}
        />
      </div>
    </Layout>
  );
}