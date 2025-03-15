import { Project, AIAnalysisResponse, DeforestationData, EmissionsData, RiskMetric, PieChartData } from './types';
import { FeatureCollection, Feature, Polygon } from 'geojson';

// Sample project data
export const sampleProject: Project = {
  id: "project-001",
  name: "Amazon Forest Conservation",
  description: "Conservation project focused on preventing deforestation in the Amazon rainforest.",
  location: "Brazil",
  coordinates: [-61.0, -4.0],
  status: "Active",
  startDate: "2022-01-15",
  endDate: "2032-01-15"
};

// Sample time series data
export const sampleDeforestationData: DeforestationData[] = [
  { year: 2018, hectares: 1200 },
  { year: 2019, hectares: 980 },
  { year: 2020, hectares: 850 },
  { year: 2021, hectares: 920 },
  { year: 2022, hectares: 780 },
  { year: 2023, hectares: 650 }
];

export const sampleEmissionsData: EmissionsData[] = [
  { year: 2018, tonnes: 45000 },
  { year: 2019, tonnes: 38000 },
  { year: 2020, tonnes: 32000 },
  { year: 2021, tonnes: 35000 },
  { year: 2022, tonnes: 29000 },
  { year: 2023, tonnes: 24000 }
];

// Sample risk metrics
export const sampleRiskMetrics: RiskMetric[] = [
  {
    category: "Deforestation Risk",
    score: 75,
    impact: "High",
    likelihood: "Likely",
    description: "High pressure from agricultural expansion in surrounding areas"
  },
  {
    category: "Social Impact",
    score: 45,
    impact: "Medium",
    likelihood: "Possible",
    description: "Moderate engagement with local communities, some concerns about land rights"
  },
  {
    category: "Project Management",
    score: 82,
    impact: "High",
    likelihood: "Likely",
    description: "Strong track record but limited resources for monitoring"
  },
  {
    category: "Climate Risk",
    score: 60,
    impact: "Medium",
    likelihood: "Likely",
    description: "Increasing drought frequency affecting forest resilience"
  }
];

// Sample land use classification data
export const samplePieChartData: PieChartData[] = [
  { category: "Primary Forest", value: 6500 },
  { category: "Secondary Forest", value: 2000 },
  { category: "Degraded Land", value: 800 },
  { category: "Agricultural Land", value: 500 },
  { category: "Water Bodies", value: 200 }
];

// Sample GeoJSON data with proper typing
export const sampleGeoJSON: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Amazon Forest Conservation",
        id: "project-001"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-62.0, -5.0],
          [-62.0, -3.0],
          [-60.0, -3.0],
          [-60.0, -5.0],
          [-62.0, -5.0]
        ]]
      }
    }
  ]
};

// Sample analysis response
export const sampleAnalysisResponse: AIAnalysisResponse = {
  projectData: sampleProject,
  queryResponse: "What are the main risks and environmental impacts of this project?",
  analysis: {
    summary: "The Amazon Forest Conservation project shows promising results in reducing deforestation rates, with a 45% decrease in forest loss since 2018. However, significant challenges remain, particularly from agricultural expansion pressure and climate-related risks.",
    recommendations: [
      "Strengthen monitoring capabilities through satellite technology and ground patrols",
      "Develop partnerships with local communities to create sustainable livelihood alternatives",
      "Implement fire prevention measures to address increasing drought risks",
      "Establish buffer zones around high-pressure areas"
    ],
    additionalInsights: "The project's location in a high-biodiversity corridor makes it particularly valuable for conservation, but also increases its vulnerability to external pressures."
  },
  riskMetrics: sampleRiskMetrics,
  deforestationData: sampleDeforestationData,
  emissionsData: sampleEmissionsData,
  pieChartData: samplePieChartData,
  documents: {
    pdd: {
      id: "doc-001",
      text: "Project Design Document for Amazon Forest Conservation...",
      metadata: { type: "PDD", version: "1.0" }
    },
    riskAnalysis: {
      id: "doc-002",
      text: "Risk Analysis Report for Amazon Forest Conservation...",
      metadata: { type: "RISK_ANALYSIS", version: "1.0" }
    }
  }
};
