import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

// Initialize the Hugging Face Inference client with your API key
const hf = new HfInference(process.env.HF_API_KEY!);

/**
 * Helper function to query ChromaDB for relevant project documents
 */
async function retrieveRelevantDocs(query: string): Promise<any[]> {
  try {
    const response = await fetch('http://localhost:8000/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, collection: 'project_embeddings', nResults: 5 }),
    });
    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error('Error querying ChromaDB:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    const query = formData.get('query') as string;
    const file = formData.get('file') as File | null;

    // Process the uploaded file if provided
    let fileData = null;
    if (file) {
      const buffer = await file.arrayBuffer();
      fileData = {
        originalname: file.name,
        buffer: Buffer.from(buffer).toString('base64'),
      };
    }

    // Retrieve documents from ChromaDB based on the user's query
    const relevantDocs = await retrieveRelevantDocs(query);
    const context = relevantDocs.map((doc) => doc.content).join('\n\n');

    // Build the prompt
    const prompt = `
Project ID: ${projectId}
Uploaded Document: ${fileData ? fileData.originalname : 'None'}

Relevant Context from Documents:
${context}

User Query: ${query}

Provide a detailed analysis of the project including key risks, metrics, and recommendations.
    `;

    try {
      // Call the Hugging Face LLM for text generation
      const generation = await hf.textGeneration({
        model: process.env.HF_MODEL || 'gpt2',
        inputs: prompt,
        parameters: { max_new_tokens: 150 },
      });

      const aiResponse = generation.generated_text || 'No response generated.';
      const responsePayload = {
        projectDescription: `Detailed analysis for ${projectId}`,
        overallRisk: 'High',
        baselineOverstatement: 'Moderate',
        aiInsights: aiResponse,
        visualizations: '',
        retrievedDocs: relevantDocs,
        fileData: fileData,
      };

      return NextResponse.json(responsePayload);
    } catch (error) {
      console.error('Error calling Hugging Face LLM:', error);
      return NextResponse.json(
        { error: 'Error generating AI analysis.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
}
  