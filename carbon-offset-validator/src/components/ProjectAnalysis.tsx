
import React from "react";
import { AIAnalysisResponse } from "@/lib/types";
import ProjectHeader from "./ProjectHeader";
import AIAnalysisCard from "./AIAnalysisCard";
import RiskMetrics from "./RiskMetrics";
import DataVisualization from "./DataVisualization";

interface ProjectAnalysisProps {
  data: AIAnalysisResponse;
}

const ProjectAnalysis: React.FC<ProjectAnalysisProps> = ({ data }) => {
  return (
    <div className="space-y-8">
      <ProjectHeader project={data.projectData} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIAnalysisCard data={data} />
        <RiskMetrics riskFactors={data.analysis.riskFactors} />
      </div>
      
      <DataVisualization 
        deforestationData={data.deforestationData} 
        emissionsData={data.emissionsData} 
      />
    </div>
  );
};

export default ProjectAnalysis;
