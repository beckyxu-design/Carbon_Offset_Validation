"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const chromadb_1 = require("chromadb");
const inference_1 = require("@huggingface/inference");
const database_1 = require("./config/database");
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize ChromaDB client
let chromaClient;
let projectCollection;
async function initChromaDB() {
    try {
        chromaClient = new chromadb_1.ChromaClient();
        projectCollection = await chromaClient.getOrCreateCollection({ name: 'project_documents' });
        console.log('Successfully connected to ChromaDB');
    }
    catch (err) {
        console.error('Error initializing ChromaDB:', err);
        throw new Error('Failed to initialize ChromaDB');
    }
}
// Initialize Hugging Face client
if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is required');
}
const hf = new inference_1.HfInference(process.env.HUGGINGFACE_API_KEY);
// Test Supabase connection
async function testConnection() {
    try {
        const { data, error } = await database_1.supabase.from('projects').select('id').limit(1);
        if (error)
            throw error;
        console.log('Successfully connected to Supabase');
    }
    catch (err) {
        console.error('Error connecting to Supabase:', err);
    }
}
// Initialize connections
async function init() {
    await initChromaDB();
    await testConnection();
}
init().catch(console.error);

app.get('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Get project details
        const { data: projectData, error: projectError } = await database_1.supabase
            .from('projects')
            .select('*')
            .eq('project_code', id)
            .single();
        if (projectError)
            throw projectError;
        if (!projectData) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const projectId = projectData.id;
        // Get project summary
        const { data: summaryData, error: summaryError } = await database_1.supabase
            .from('project_summary')
            .select('*')
            .eq('project_id', projectId)
            .single();
        if (summaryError)
            throw summaryError;
        // Get risk metrics
        const { data: riskMetricsData, error: riskError } = await database_1.supabase
            .from('risk_summary_metrics')
            .select('*')
            .eq('project_id', projectId);
        if (riskError)
            throw riskError;
        // Get time series data
        const { data: timeSeriesData, error: timeSeriesError } = await database_1.supabase
            .from('time_series_data')
            .select('*')
            .eq('project_id', projectId)
            .order('timestamp');
        if (timeSeriesError)
            throw timeSeriesError;
        // Get pie chart data
        const { data: pieChartData, error: pieChartError } = await database_1.supabase
            .from('pie_chart_data')
            .select('*')
            .eq('project_id', projectId);
        if (pieChartError)
            throw pieChartError;
        // Get geospatial data
        const { data: geospatialData, error: geospatialError } = await database_1.supabase
            .from('geo_data')
            .select('geometry, properties')
            .eq('project_id', projectId);
        if (geospatialError)
            throw geospatialError;
        // Get PDD and Risk Analysis from ChromaDB
        const documents = await projectCollection.query({
            queryTexts: [`Project ${id} documents`],
            nResults: 2,
            where: { project_id: projectId }
        });
        const response = {
            project: projectData,
            summary: summaryData,
            riskMetrics: riskMetricsData,
            timeSeriesData: timeSeriesData,
            pieChartData: pieChartData,
            geospatialData: geospatialData.map(row => ({
                type: 'Feature',
                geometry: row.geometry,
                properties: row.properties
            })),
            documents: {
                pdd: documents.documents?.[0] || null,
                riskAnalysis: documents.documents?.[1] || null
            }
        };
        res.json(response);
    }
    catch (err) {
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
        // Query documents from ChromaDB
        const results = await projectCollection.query({
            queryTexts: [query],
            nResults: 5,
            where: { project_id: projectId }
        });
        // Use Hugging Face for analysis
        const analysis = await hf.textGeneration({
            model: 'gpt2',
            inputs: `Project Analysis Query: ${query}\nContext: ${results.documents?.join('\n')}`,
            parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
            }
        });
        res.json({
            analysis: analysis.generated_text,
            context: results.documents
        });
    }
    catch (err) {
        console.error('Error analyzing project:', err);
        res.status(500).json({ error: 'Failed to analyze project' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
