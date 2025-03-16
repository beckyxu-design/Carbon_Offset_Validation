import { Geometry } from 'geojson';

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates: [number, number];
  status: string;
  startDate: string;
  endDate: string;
}

export interface ProjectSummary {
  project_id: string;
  summary: string;
  recommendations: string;
  lastUpdated: string;
}

export interface RiskMetric {
  project_id: string;
  category: string;
  score: number;
  impact: number;
  likelihood: number;
}

export interface TimeSeriesData {
  project_id: string;
  timestamp: string;
  deforestation_hectares: number;
  emissions_tonnes: number;
}

export interface PieChartData {
  project_id: string;
  category: string;
  value: number;
}

export interface GeoData {
  project_id: string;
  geometry: any; // GeoJSON geometry
  properties: Record<string, any>;
}

export interface ProjectDocument {
  project_id: string;
  content: string;
  type: 'pdd' | 'risk_analysis';
  metadata: Record<string, any>;
}
