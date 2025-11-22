
import { GoogleGenAI } from "@google/genai";
import { FlowNode } from '../types';

// Initialize Gemini client
// Note: process.env.API_KEY is assumed to be available
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const auditWorkflow = async (nodes: FlowNode[], edges: any[]): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const graphDescription = JSON.stringify({ nodes, edges }, null, 2);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Analyze the following node-based workflow for a UTXO dApp on Bitcoin Cash:\n\n${graphDescription}`,
      config: {
        systemInstruction: "You are a Senior Smart Contract Auditor for Bitcoin Cash (BCH) specializing in PMv3, Cashtokens, and Introspection. Identify security risks (race conditions, unspendable UTXOs), verify flow logic, and suggest optimizations for the UTXO model.",
        temperature: 0.2
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return "Error: Could not connect to AI auditor. Please check your API key.";
  }
};

export const explainContract = async (code: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Explain this CashScript code:\n\`\`\`solidity\n${code}\n\`\`\``,
      config: {
        systemInstruction: "You are an expert Bitcoin Cash developer. Explain the code clearly to a developer new to UTXO smart contracts. Focus on 'require' statements, introspection, and spending conditions.",
        temperature: 0.2
      }
    });

    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Error generating explanation.";
  }
};

export const simulateContract = async (
  code: string,
  params: Record<string, any>,
  functionName: string,
  mockContext: string
): Promise<{ success: boolean; logs: string }> => {
  try {
    const model = "gemini-2.5-flash";
    const simulationRequest = {
      code,
      constructorParams: params,
      functionToCall: functionName,
      transactionContext: mockContext || "Standard P2PKH spending context"
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: `Simulate the execution of this Bitcoin Cash smart contract logic.
      
Request:
${JSON.stringify(simulationRequest, null, 2)}

Determine if the transaction would be valid according to CashScript and PMv3 rules.
Consider INTROSPECTION (tx.inputs, tx.outputs) checks.
`,
      config: {
        systemInstruction: `You are a Bitcoin Cash Virtual Machine simulator. 
        Evaluate the code. 
        Return a JSON object with:
        - "success": boolean (true if require() statements pass)
        - "logs": string (Markdown explanation of the stack execution or failure reason).`,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { success: false, logs: "No response from simulator." };
    
    try {
        // Robust JSON extraction: find the first { and the last }
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : text;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error", e, text);
        return { success: false, logs: `Parse Error: Output was not valid JSON. Raw output: ${text.substring(0, 100)}...` };
    }

  } catch (error: any) {
    return { success: false, logs: `Simulation error: ${error.message}` };
  }
};
