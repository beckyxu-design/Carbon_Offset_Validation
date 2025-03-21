import { Feature, FeatureCollection, Geometry } from 'geojson';

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

export interface DeforestationData {
  year: number;
  hectares: number;
}

export interface EmissionsData {
  year: number;
  tonnes: number;
}

export interface RiskMetric {
  category: string;
  score: number;
  impact: 'Low' | 'Medium' | 'High';
  likelihood: 'Unlikely' | 'Possible' | 'Likely';
  description: string;
}

export interface PieChartData {
  category: string;
  value: number;
}

export interface Document {
  id: string;
  text: string;
  metadata: {
    type: string;
    version: string;
  };
}

export interface Summary {
  summary: string;
  recommendations: string[];
  additionalInsights: string;
}

export interface AIAnalysisResponse {
  projectData: Project;
  queryResponse: string;
  summary: Summary;
  riskMetrics: RiskMetric[];
  deforestationData: DeforestationData[];
  emissionsData: EmissionsData[];
  pieChartData: PieChartData[];
  documents: {
    pdd: Document;
    riskAnalysis: Document;
  };
}

export interface AIAnalysisRequest {
  projectCode: string;
  query: string;
}


