import React from "react";
import { AIAnalysisResponse } from "@/lib/types";
import ProjectHeader from "./ProjectHeader";
import AIAnalysisCard from "./AIAnalysisCard";
import RiskSummaryTable from "./RiskSummaryTable";
import DataVisualization from "./DataVisualization";
import LandusePieChart from "./LandusePieChart";

// define a typescript interface with data prop type AIAnalysisResponse(structured data format)
interface ProjectAnalysisProps {
  // must receive a data prop of type AIAnalysisResponse
  data: AIAnalysisResponse;
}

// def react functional component
// expect prop type: <ProjectAnalysisProps> & expect input: {data}
const ProjectAnalysis: React.FC<ProjectAnalysisProps> = ({ data }) => {
  return (
    <div className="space-y-8">
      <ProjectHeader project={data.projectData} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIAnalysisCard data={data} />
        <RiskSummaryTable metrics={data.riskMetrics} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataVisualization 
          deforestationData={data.deforestationData} 
          emissionsData={data.emissionsData} 
        />
        <LandusePieChart data={data.pieChartData} />
      </div>
    </div>
  );
};

export default ProjectAnalysis;
