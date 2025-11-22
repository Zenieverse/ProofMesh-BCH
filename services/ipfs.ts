
import { FlowNode, FlowEdge } from '../types';

const MOCK_DELAY = 1500;

export const saveProjectToIPFS = async (
  nodes: FlowNode[], 
  edges: FlowEdge[], 
  name: string
): Promise<string> => {
  // Mock IPFS Upload
  console.log("Uploading to IPFS...", { nodes, edges });
  
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  
  // Generate a fake CID
  const cid = "Qm" + Array(44).fill(0).map(() => Math.random().toString(36)[2]).join('');
  return cid;
};

export const loadProjectFromIPFS = async (cid: string): Promise<{ nodes: FlowNode[], edges: FlowEdge[] }> => {
  console.log("Fetching from IPFS...", cid);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  
  // In a real app, fetch JSON from IPFS gateway
  // Returning empty for mock if not found in local state
  return { nodes: [], edges: [] };
};
