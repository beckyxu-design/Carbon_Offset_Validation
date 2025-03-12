
export interface ProjectData {
  id: string;
  name?: string;
  location?: string;
  size?: string;
  startDate?: string;
  description?: string;
  geojson?: GeoJSON.FeatureCollection;
}

export interface AnalysisResult {
  summary: string;
  riskFactors: RiskFactor[];
  recommendations: string[];
  additionalInsights: string;
}

export interface RiskFactor {
  name: string;
  score: number; // 0-100
  description: string;
}

export interface DeforestationData {
  year: number;
  hectares: number;
}

export interface EmissionsData {
  year: number;
  tonnes: number;
}

export type FileType = 'pdd' | 'kml' | 'shapefile' | 'other';

export interface UploadedFile {
  name: string;
  type: FileType;
  size: number;
  url?: string;
}

export interface AIAnalysisRequest {
  projectId: string;
  query: string;
  files?: UploadedFile[];
}

export interface AIAnalysisResponse {
  projectData: ProjectData;
  analysis: AnalysisResult;
  deforestationData: DeforestationData[];
  emissionsData: EmissionsData[];
  queryResponse: string;
}

export interface DeforestationLayer {
  id: string;
  areaName: string;
  rate: number; // percentage per year
  geojson: GeoJSON.FeatureCollection;
}
