import { ReportGenerator } from './reporting/ReportGenerator';
import { GoogleGenAI } from '@google/genai';
import { ResearchManager } from './research/ResearchManager';

async function verify() {
  const generator = new ReportGenerator();
  
  console.log('--- Testing Report Generation ---');
  const mockOutputs = [
    { 
      type: 'text', 
      text: 'Deep Research is powerful.',
      annotations: [
        { start_index: 0, end_index: 13, source: 'Source: Gemini Documentation' }
      ]
    },
    {
      type: 'text',
      text: 'File Search enables RAG.',
      annotations: [
        { start_index: 0, end_index: 11, source: 'Source: Google Cloud' }
      ]
    }
  ];

  const report = generator.generateMarkdown(mockOutputs);
  console.log('Generated Report:\n');
  console.log(report);

  console.log('\n--- Testing Research Start with Grounding Configuration ---');
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || 'mock-key';
  const client = new GoogleGenAI({ apiKey });
  const manager = new ResearchManager(client);

  // We mock the client call to inspect the arguments
  const originalCreate = client.interactions.create;
  let capturedRequest: any;
  // @ts-ignore - Mocking for verification
  client.interactions.create = async (req: any) => {
    capturedRequest = req;
    return { id: 'mock-id', status: 'in_progress' } as any;
  };

  await manager.startResearch({
    input: 'Tell me about my documents.',
    model: 'gemini-2.5-flash',
    fileSearchStoreNames: ['my-store-123']
  });

  console.log('Captured Request Tools:', JSON.stringify(capturedRequest.tools, null, 2));
  
  if (capturedRequest.tools?.[0]?.fileSearch?.fileSearchStoreNames?.[0] === 'my-store-123') {
    console.log('Success: File Search Store grounding correctly integrated.');
  } else {
    console.error('Error: File Search Store grounding NOT integrated correctly.');
  }

  console.log('\nVerification script finished.');
}

verify().catch(console.error);
