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
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase.from('projects').select('id').limit(1);
    if (connectionError) throw connectionError;
    console.log('Successfully connected to Supabase');

    // Get table info
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) throw projectsError;
    
    // console.log('Projects table structure:', projects?.[0] ? Object.keys(projects[0]) : 'No projects found');
    // console.log('Number of projects:', projects?.length || 0);
    // console.log('Sample project:', projects?.[0]);
    
    return true;
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    return false;
  }
}

// Initialize connections
async function init() {
  try {
    const supabaseOk = await testConnection();
    if (!supabaseOk) {
      throw new Error('Failed to connect to Supabase - database connection required');
    }
    
    try {
      await initChromaDB(); // ChromaDB is optional
    } catch (err) {
      console.warn('ChromaDB initialization failed - continuing without document search features');
    }

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Server initialization failed:', err);
    process.exit(1);
  }
}

init().catch(err => {
  console.error('Fatal error during initialization:', err);
  process.exit(1);
});

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

// Check if project exists
app.get('/api/projects/:code/exists', async (req, res) => {
  try {
    const { code } = req.params;
    // console.log('Checking project existence for code:', code);
    
    // First, let's log all projects to see what we have
    const { data: allProjects, error: listError } = await supabase
      .from('projects')
      .select('project_code');
    
    // console.log('All project codes in database:', allProjects);
    
    // Now check for the specific project
    const { data, error } = await supabase
      .from('projects')
      .select('project_code')
      .eq('project_code', code)
      .maybeSingle();
    
    // console.log('Supabase query result:', { data, error });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    const exists = !!data;
    // console.log('Project exists:', exists);
    
    res.json({ exists });
  } catch (err) {
    console.error('Error checking project existence:', err);
    res.status(500).json({ error: 'Failed to check project existence' });
  }
});

// Get project data from Supabase DB
app.get('/api/projects/:code', async (req, res) => {
  try {
    const { code } = req.params;
    console.log('Fetching project data for code:', code);
    
    // First try exact match with project_code
    let { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_code', code)
      .maybeSingle();
    
    if (!projectData) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw projectError;
    }

    const projectId = projectData.id;
    console.log('Found project with ID:', projectId);

    // Get project summary
    const { data: summaryData, error: summaryError } = await supabase
      .from('project_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (summaryError) {
      console.error('Error fetching summary:', summaryError);
      throw summaryError;
    }
    
    // Get risk metrics
    const { data: riskMetricsData, error: riskError } = await supabase
      .from('risk_summary_metrics')
      .select('*')
      .eq('project_id', projectId);
    
    if (riskError) {
      console.error('Error fetching risk metrics:', riskError);
      throw riskError;
    }
    
    // Get time series data
    const { data: timeSeriesData, error: timeSeriesError } = await supabase
      .from('time_series_data')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp');
    
    if (timeSeriesError) {
      console.error('Error fetching time series:', timeSeriesError);
      throw timeSeriesError;
    }
    
    // Get pie chart data
    const { data: pieChartData, error: pieChartError } = await supabase
      .from('pie_chart_data')
      .select('*')
      .eq('project_id', projectId);
    
    if (pieChartError) {
      console.error('Error fetching pie chart data:', pieChartError);
      throw pieChartError;
    }
    
    // Get geospatial data
    const { data: geospatialData, error: geospatialError } = await supabase
      .from('geo_data')
      .select('geometry, properties')
      .eq('project_id', projectId);
    
    if (geospatialError) {
      console.error('Error fetching geospatial data:', geospatialError);
      throw geospatialError;
    }

    const response = {
      project: projectData,
      summary: summaryData,
      riskMetrics: riskMetricsData,
      timeSeriesData: timeSeriesData,
      pieChartData: pieChartData,
      geospatialData: geospatialData?.map(row => ({
        type: 'Feature',
        geometry: row.geometry,
        properties: row.properties
      }))
    };
    
    console.log('Successfully fetched all project data');
    res.json(response);
  } catch (err) {
    console.error('Error fetching project details:', err);
    res.status(500).json({ error: 'Failed to fetch project details' });
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
