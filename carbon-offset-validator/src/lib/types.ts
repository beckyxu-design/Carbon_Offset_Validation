import { Feature, FeatureCollection, Geometry } from 'geojson';

/**
 * Project interface
 */
export interface Project {
  project_code: string;
  name: string;
  description: string;
  location: string;
  coordinates: [number, number];
  status: string;
  startDate: string;
  endDate: string;
}

/**
 * Deforestation data interface
 */
export interface DeforestationData {
  year: number;
  hectares: number;
}

/**
 * Emissions data interface
 */
export interface EmissionsData {
  year: number;
  tonnes: number;
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
  recommendations: string[];
  additionalInsights: string;
}

/**
 * AI analysis response interface
 */
export interface AIAnalysisResponse {
  projectData: Project;
  queryResponse: string;
  summary: Summary;
  riskMetrics: RiskMetric[];
  deforestationData: DeforestationData[];
  emissionsData: EmissionsData[];
  pieChartData: PieChartData[];
  geospatialData: FeatureCollection;
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
  geometry: Geometry;
  properties: {
    [key: string]: any;
  };
}

/**
 * Project data response interface
 */
export interface ProjectDataResponse {
  project: Project;
  summary: Summary;
  riskMetrics: RiskMetric[];
  timeSeriesData: (DeforestationData | EmissionsData)[];
  pieChartData: PieChartData[];
  geospatialData: GeoData[];
}
