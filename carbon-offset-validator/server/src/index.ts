// server api
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { ChromaClient, Collection, QueryResponse } from 'chromadb';
import { HfInference } from '@huggingface/inference';
import { Project, ProjectSummary, RiskMetric, TimeSeriesData, PieChartData, GeoData } from './types/database';
import { supabase } from './config/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Initialize ChromaDB client
let chromaClient: ChromaClient | null = null;
let projectCollection: Collection | null = null;

async function initChromaDB() {
  try {
    chromaClient = new ChromaClient();
    projectCollection = await chromaClient.getOrCreateCollection({ name: 'project_documents' });
    console.log('Successfully connected to ChromaDB');
    return true;
  } catch (err) {
    console.warn('ChromaDB not available - document search features will be limited');
    console.error('ChromaDB Error:', err);
    return false;
  }
}

// Initialize Hugging Face client
if (!process.env.HUGGINGFACE_API_KEY) {
  console.warn('HUGGINGFACE_API_KEY not found - analysis features will be limited');
}
const hf = process.env.HUGGINGFACE_API_KEY ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

// Test Supabase connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('projects').select('id').limit(1);
    if (error) throw error;
    console.log('Successfully connected to Supabase');
    return true;
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    return false;
  }
}

// Initialize connections
async function init() {
  const supabaseOk = await testConnection();
  if (!supabaseOk) {
    throw new Error('Failed to connect to Supabase - database connection required');
  }
  await initChromaDB(); // ChromaDB is optional
}

init().catch(console.error);

// API Routes 
app.get('/api/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*');
    
    if (error) throw error;
    
    res.json(data as Project[]);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project data from Supabase DB
app.get('/api/projects/:code', async (req, res) => {
  try {
    const { code } = req.params;
    console.log(code)
    
    // First try exact match with project_code
    let { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_code', code)
      .maybeSingle();
    
    if (!projectData) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectId = projectData.id;
    console.log(projectId)

    // Get project summary
    const { data: summaryData, error: summaryError } = await supabase
      .from('project_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (summaryError) throw summaryError;
    
    // Get risk metrics
    const { data: riskMetricsData, error: riskError } = await supabase
      .from('risk_summary_metrics')
      .select('*')
      .eq('project_id', projectId);
    
    if (riskError) throw riskError;
    
    // Get time series data
    const { data: timeSeriesData, error: timeSeriesError } = await supabase
      .from('time_series_data')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp');
    
    if (timeSeriesError) throw timeSeriesError;
    
    // Get pie chart data
    const { data: pieChartData, error: pieChartError } = await supabase
      .from('pie_chart_data')
      .select('*')
      .eq('project_id', projectId);
    
    if (pieChartError) throw pieChartError;
    
    // Get geospatial data
    const { data: geospatialData, error: geospatialError } = await supabase
      .from('geo_data')
      .select('geometry, properties')
      .eq('project_id', projectId);
    
    if (geospatialError) throw geospatialError;

    // // Get PDD and Risk Analysis from ChromaDB if available
    // let documents: { documents: string[] } = { documents: [] };
    // if (projectCollection) {
    //   try {
    //     const result = await projectCollection.query({
    //       queryTexts: [`Project ${code} documents`],
    //       nResults: 2,
    //       where: { project_id: projectId }
    //     });
    //     documents = {
    //       documents: (result.documents?.[0] || []).filter((doc): doc is string => doc !== null)
    //     };
    //   } catch (err) {
    //     console.warn('Failed to fetch documents from ChromaDB:', err);
    //   }
    // }

    const response = {
      project: projectData as Project,
      summary: summaryData as ProjectSummary,
      riskMetrics: riskMetricsData as RiskMetric[],
      timeSeriesData: timeSeriesData as TimeSeriesData[],
      pieChartData: pieChartData as PieChartData[],
      geospatialData: (geospatialData as GeoData[]).map(row => ({
        type: 'Feature',
        geometry: row.geometry,
        properties: row.properties
      })),
      // documents: {
      //   pdd: documents.documents?.[0] || null,
      //   riskAnalysis: documents.documents?.[1] || null
      // }
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching project details:', err);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Check if project exists
app.get('/api/projects/:code/exists', async (req, res) => {
  try {
    // console.log(req.params);
    const { code } = req.params;
    const { data, error } = await supabase
      .from('projects')
      .select('project_code')
      .or(`project_code.eq.${code}`)
      .maybeSingle();
    
    if (error) throw error;
    
    res.json({ exists: !!data }); //!! converts data to boolean t/f
  } catch (err) {
    console.error('Error checking project existence:', err);
    res.status(500).json({ error: 'Failed to check project existence' });
  }
});

// LLM endpoint for project analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { projectId, query } = req.body;
    
    if (!projectId || !query) {
      return res.status(400).json({ error: 'projectId and query are required' });
    }

    // Query documents from ChromaDB if available
    let documents: { documents: string[] } = { documents: [] };
    if (projectCollection) {
      try {
        const result = await projectCollection.query({
          queryTexts: [query],
          nResults: 5,
          where: { project_id: projectId }
        });
        documents = {
          documents: (result.documents?.[0] || []).filter((doc): doc is string => doc !== null)
        };
      } catch (err) {
        console.warn('Failed to fetch documents from ChromaDB:', err);
      }
    }

    // Use Hugging Face for analysis if available
    let analysis = '';
    if (hf) {
      try {
        // First get project data from Supabase for more context
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        const prompt = `Based on the following information about a carbon offset project, 
        please provide a concise analysis focusing on: ${query}

        Project Context:
        ${documents.documents?.join('\n\n')}

        Please provide a clear, factual analysis based only on the information provided above.`;
                
        const response = await hf.textGeneration({
          model: 'facebook/opt-2.7b',  // Using OPT model for better analysis
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.3, // Lower temperature for more focused responses
            top_p: 0.9,
            repetition_penalty: 1.2,
            do_sample: true
          }
        });

        // Clean up the response
        analysis = response.generated_text
          .replace(prompt, '')  // Remove the prompt
          .trim();
      } catch (err) {
        console.warn('Failed to generate analysis with Hugging Face:', err);
        analysis = 'Analysis generation failed';
      }
    } else {
      analysis = 'Analysis not available - Hugging Face API key not configured';
    }

    res.json({
      analysis,
      context: documents.documents || []
    });
  } catch (err) {
    console.error('Error analyzing project:', err);
    res.status(500).json({ error: 'Failed to analyze project' });
  }
});

// Add documents to ChromaDB
app.post('/api/documents', async (req, res) => {
  try {
    const { projectId, documents } = req.body;
    
    if (!projectId || !documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'projectId and documents array are required' });
    }

    if (!projectCollection) {
      return res.status(503).json({ error: 'ChromaDB not available' });
    }

    const ids = documents.map((_, index) => `${projectId}-doc-${index}`);
    const metadata = documents.map(() => ({ project_id: projectId }));

    await projectCollection.add({
      ids,
      metadatas: metadata,
      documents
    });

    res.json({ message: 'Documents added successfully' });
  } catch (err) {
    console.error('Error adding documents:', err);
    res.status(500).json({ error: 'Failed to add documents' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
