import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { ChromaClient } from 'chromadb';
import { HfInference } from '@huggingface/inference';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize ChromaDB client
const chromaClient = new ChromaClient();

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// API Routes
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get project basic info
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project summary
    const summaryResult = await pool.query(
      'SELECT * FROM project_summary WHERE project_id = $1',
      [id]
    );

    // Get risk summary metrics
    const riskMetricsResult = await pool.query(
      'SELECT * FROM risk_summary_metrics WHERE project_id = $1',
      [id]
    );

    // Get time series data
    const timeSeriesResult = await pool.query(
      'SELECT * FROM time_series_data WHERE project_id = $1 ORDER BY timestamp',
      [id]
    );

    // Get pie chart data
    const pieChartResult = await pool.query(
      'SELECT * FROM pie_chart_data WHERE project_id = $1',
      [id]
    );

    // Get geospatial data
    const geospatialResult = await pool.query(
      'SELECT ST_AsGeoJSON(geom) as geometry, properties FROM geo_data WHERE project_id = $1',
      [id]
    );

    // Get PDD and Risk Analysis from ChromaDB
    const collection = await chromaClient.getCollection('project_documents');
    const documents = await collection.get({
      where: { project_id: id },
      limit: 2
    });

    const response = {
      project: projectResult.rows[0],
      summary: summaryResult.rows[0],
      riskMetrics: riskMetricsResult.rows,
      timeSeriesData: timeSeriesResult.rows,
      pieChartData: pieChartResult.rows,
      geospatialData: geospatialResult.rows.map(row => ({
        type: 'Feature',
        geometry: JSON.parse(row.geometry),
        properties: row.properties
      })),
      documents: {
        pdd: documents.find(d => d.metadata.type === 'PDD'),
        riskAnalysis: documents.find(d => d.metadata.type === 'RISK_ANALYSIS')
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LLM endpoint for project analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { projectId, query } = req.body;

    // Get project documents from ChromaDB
    const collection = await chromaClient.getCollection('project_documents');
    const results = await collection.query({
      queryTexts: [query],
      nResults: 5,
      where: { project_id: projectId }
    });

    // Use Hugging Face model for analysis
    const analysis = await hf.textGeneration({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      inputs: `Analyze this carbon offset project based on the following context and query:
      
Context:
${results.documents.join('\n')}

Query: ${query}

Provide a detailed analysis focusing on:
1. Project viability
2. Risk assessment
3. Environmental impact
4. Recommendations`,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7
      }
    });

    res.json({
      analysis: analysis.generated_text,
      relevantDocuments: results.documents
    });
  } catch (error) {
    console.error('Error analyzing project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
