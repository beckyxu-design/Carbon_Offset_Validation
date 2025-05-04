import { Feature, FeatureCollection, Geometry } from 'geojson';

/**
 * Project interface
 */
export interface Project {
  project_code: string;
  name: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
  methodology?: string;
  size?: string;
  total_credits?: number;
  remaining_credits?: number;
  verifier?: string;
  type?: string;
  reduction_removal?: string;
  project_developer?: string;
  buffer?: number
}

/**
 * Deforestation data interface
 */
export interface TimeSeriesData {
  timestamp: string;
  deforestation_area: number;
}

// /**
//  * Emissions data interface
//  */
// export interface EmissionsData {
//   timestamp: number;
//   tonnes: number;
// }

/**
 * Land use time series data interface
 */
export interface LanduseTimeSeriesData {
  project_id: string;
  month: string;
  bare: number;
  built: number;
  crops: number;
  flooded_vegetation: number;
  grass: number;
  shrub_and_scrub: number;
  snow_and_ice: number;
  trees: number;
  water: number;
  null: number;
}

/**
 * Risk metric interface
 */
export interface RiskMetric {
  category: string;
  score: number;
  impact: 'Low' | 'Medium' | 'High';
  likelihood: 'Unlikely' | 'Possible' | 'Likely';
  description: string;
}

/**
 * Pie chart data interface
 */
export interface PieChartData {
  category: string;
  value: number;
}

/**
 * Document interface
 */
export interface Document {
  id: string;
  text: string;
  metadata: {
    type: string;
    version: string;
  };
}

/**
 * Summary interface
 */
export interface Summary {
  summary: string;
  policy_analysis?: string; // JSON string from Supabase
  news?: string | NewsArticle[]; // JSON string or parsed array from Supabase
  policyAssessment?: PolicyAssessment; // Parsed policy_analysis for frontend
  newsSearch?: NewsArticle[]; // Parsed news for frontend
}

/**
 * News article from search interface
 */
export interface NewsArticle {
  title: string;
  url: string;
  content: string;
}

/**
 * Policy assessment interface
 */
export interface PolicyAssessment {
  regulatory?: string;
  finance?: string;
  permanence?: string;
  local_economy?: string;
  [key: string]: string | undefined;
}

/**
 * AI analysis response interface
 */
export interface AIAnalysisResponse {
  projectData: Project;
  queryResponse: string;
  overallSummary: OverallSummary[];
  summary: Summary;
  policyAssessment?: PolicyAssessment;
  newsSearch?: NewsArticle[];
  riskMetrics: RiskMetric[];
  timeSeriesData: TimeSeriesData[];
  pieChartData?: PieChartData[];
  geospatialData: GeoData[];
  landuseTimeSeriesData: LanduseTimeSeriesData[];
  documents: {
    pdd: Document;
    riskAnalysis: Document;
  };
}

/**
 * AI analysis request interface
 */
export interface AIAnalysisRequest {
  projectCode: string;
  query: string;
  files?: UploadedFile[]; // Add optional files field
  registry: string; // Add registry field for carbon registry selection
}

/**
 * File type enum
 */
export enum FileType {
  PDD = 'pdd',
  KML = 'kml',
  RISK_ANALYSIS = 'risk_analysis',
  OTHER = 'other'
}

/**
 * Uploaded file interface
 */
export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  text?: string;
}

/**
 * Geo data interface
 */
export interface GeoData extends Feature {
  type: "Feature";
  geometry: any;
  properties: {
    [key: string]: any;
  };
}

/**
 * Overall analysis data interface
 */
export interface OverallSummary {
  summary: string
  recommendations: string
  // Optionally, include id, project_id, created_at, updated_at if present in Supabase
  id?: string
  project_id?: string
  created_at?: string
  updated_at?: string
}

/**
 * Project data response interface
 */
export interface ProjectDataResponse {
  project: Project;
  projects?: Project[];  // Optional array of projects for listing all projects
  overallSummary: OverallSummary[];
  summary: Summary;
  policyAssessment?: PolicyAssessment;
  newsSearch?: NewsArticle[];
  riskMetrics: RiskMetric[];
  timeSeriesData: TimeSeriesData[];
  landuseTimeSeriesData: LanduseTimeSeriesData[];
  pieChartData?: PieChartData[];
  geospatialData: GeoData[];
}
