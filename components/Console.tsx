
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, isOpen, onToggle, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 transition-all duration-300 z-30 flex flex-col shadow-2xl ${isOpen ? 'h-64' : 'h-8'}`}>
      
      {/* Header / Tab Bar */}
      <div 
        className="h-8 bg-dark-800 flex items-center justify-between px-4 cursor-pointer hover:bg-dark-700 transition-colors border-t border-dark-600"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">System Console</span>
            </div>
            {logs.length > 0 && (
                <span className="text-[10px] bg-dark-600 text-gray-300 px-1.5 py-0.5 rounded-full">
                    {logs.length}
                </span>
            )}
        </div>
        
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
             <button onClick={onClear} className="text-[10px] text-gray-500 hover:text-gray-300 uppercase font-bold">Clear</button>
             <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 bg-[#0c0c0c]">
        {logs.length === 0 ? (
            <div className="text-gray-600 italic p-2">System ready. Waiting for events...</div>
        ) : (
            logs.map((log) => (
                <div key={log.id} className="flex gap-2 hover:bg-white/5 p-0.5 rounded">
                    <span className="text-gray-500 shrink-0 w-16">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                    <span className={`font-bold shrink-0 w-20 ${
                        log.source === 'AI' ? 'text-purple-400' :
                        log.source === 'Network' ? 'text-blue-400' :
                        log.source === 'Compiler' ? 'text-orange-400' :
                        log.source === 'Storage' ? 'text-green-400' :
                        'text-gray-400'
                    }`}>[{log.source}]</span>
                    
                    <span className={`break-all ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'success' ? 'text-green-400' :
                        log.level === 'warning' ? 'text-yellow-400' :
                        'text-gray-300'
                    }`}>
                        {log.message}
                    </span>
                </div>
            ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
