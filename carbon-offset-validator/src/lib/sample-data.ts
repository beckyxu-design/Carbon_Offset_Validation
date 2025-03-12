
import { DeforestationLayer, ProjectData } from './types';

// Sample project GeoJSON data
export const sampleProjects: ProjectData[] = [
  {
    id: "project-001",
    name: "Amazon Forest Conservation",
    location: "Brazil",
    size: "10,000 hectares",
    startDate: "2022-01-15",
    description: "Conservation project focused on preventing deforestation in the Amazon rainforest.",
    geojson: {
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
    }
  },
  {
    id: "project-002",
    name: "Congo Basin Protection",
    location: "Democratic Republic of Congo",
    size: "8,500 hectares",
    startDate: "2021-05-20",
    description: "Project aimed at protecting the Congo Basin rainforest from illegal logging and land conversion.",
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Congo Basin Protection",
            id: "project-002"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [18.0, -1.0],
              [18.0, 1.0],
              [20.0, 1.0],
              [20.0, -1.0],
              [18.0, -1.0]
            ]]
          }
        }
      ]
    }
  },
  {
    id: "project-003",
    name: "Borneo Peatland Restoration",
    location: "Indonesia",
    size: "5,200 hectares",
    startDate: "2022-08-10",
    description: "Restoration of degraded peatlands in Borneo to prevent carbon emissions and protect biodiversity.",
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Borneo Peatland Restoration",
            id: "project-003"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [113.0, 0.0],
              [113.0, 2.0],
              [115.0, 2.0],
              [115.0, 0.0],
              [113.0, 0.0]
            ]]
          }
        }
      ]
    }
  }
];

// Sample deforestation rate layers
export const deforestationLayers: DeforestationLayer[] = [
  {
    id: "deforestation-001",
    areaName: "Amazon Region",
    rate: 2.4, // 2.4% per year
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Amazon Deforestation",
            rate: 2.4
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-65.0, -8.0],
              [-65.0, -1.0],
              [-55.0, -1.0],
              [-55.0, -8.0],
              [-65.0, -8.0]
            ]]
          }
        }
      ]
    }
  },
  {
    id: "deforestation-002",
    areaName: "Congo Basin",
    rate: 1.8, // 1.8% per year
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Congo Basin Deforestation",
            rate: 1.8
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [16.0, -3.0],
              [16.0, 3.0],
              [23.0, 3.0],
              [23.0, -3.0],
              [16.0, -3.0]
            ]]
          }
        }
      ]
    }
  },
  {
    id: "deforestation-003",
    areaName: "Southeast Asia",
    rate: 3.2, // 3.2% per year
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Southeast Asia Deforestation",
            rate: 3.2
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [110.0, -2.0],
              [110.0, 5.0],
              [118.0, 5.0],
              [118.0, -2.0],
              [110.0, -2.0]
            ]]
          }
        }
      ]
    }
  }
];

// Function to get a project by ID
export const getProjectById = (id: string): ProjectData | undefined => {
  return sampleProjects.find(project => project.id === id);
};
