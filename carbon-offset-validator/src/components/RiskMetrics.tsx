
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskFactor } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

interface RiskMetricsProps {
  riskFactors: RiskFactor[];
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ riskFactors }) => {
  // Calculate overall risk as an average of all risk factors
  const overallRisk = Math.round(
    riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length
  );
  
  // Helper to get color based on risk score
  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-500";
    if (score < 60) return "text-amber-500";
    return "text-red-500";
  };
  
  const getProgressColor = (score: number) => {
    if (score < 30) return "bg-green-500";
    if (score < 60) return "bg-amber-500";
    return "bg-red-500";
  };
  
  const getRiskLevel = (score: number) => {
    if (score < 30) return "Low Risk";
    if (score < 60) return "Medium Risk";
    return "High Risk";
  };
  
  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
          Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative h-32 w-32 mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getProgressColor(overallRisk)}
                strokeWidth="10"
                strokeDasharray={`${overallRisk * 2.83} 283`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="24"
                fontWeight="bold"
                fill="currentColor"
                className={getRiskColor(overallRisk)}
              >
                {overallRisk}
              </text>
              <text
                x="50"
                y="65"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="currentColor"
              >
                Risk Score
              </text>
            </svg>
          </div>
          <div className={`text-lg font-semibold ${getRiskColor(overallRisk)}`}>
            {getRiskLevel(overallRisk)}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Risk Breakdown</h3>
          <div className="space-y-3">
            {riskFactors.map((factor, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{factor.name}</span>
                  <span className={`text-sm font-medium ${getRiskColor(factor.score)}`}>
                    {factor.score}%
                  </span>
                </div>
                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getProgressColor(factor.score)}`}
                    style={{ width: `${factor.score}%`, transition: "width 1s ease-in-out" }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMetrics;
