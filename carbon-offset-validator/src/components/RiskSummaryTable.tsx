import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { RiskMetric } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskSummaryTableProps {
  metrics: RiskMetric[];
}

const getRiskLevel = (score: number) => {
  if (score >= 8) return { level: 'Critical', color: 'text-red-500' };
  if (score >= 6) return { level: 'High', color: 'text-orange-500' };
  if (score >= 4) return { level: 'Medium', color: 'text-yellow-500' };
  return { level: 'Low', color: 'text-green-500' };
};

const getProgressColor = (score: number) => {
  if (score >= 8) return "stroke-red-500";
  if (score >= 6) return "stroke-orange-500";
  if (score >= 4) return "stroke-yellow-500";
  return "stroke-green-500";
};

const RiskSummaryTable: React.FC<RiskSummaryTableProps> = ({ metrics }) => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => 
      prev.includes(index) 
        ? [] 
        : [index]
    );
  };

  // Calculate overall risk as an average of all risk metrics
  const overallRisk = Math.round(
    metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length
  );

  return (
    <Card className="glass-card overflow-hidden animate-fade-in max-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
              Analysis: Project Design Risk Assessment
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              The following analysis concludes from comparing the project design document with a list of (forestry) project design standard and guidelines from Verra, Gold Standards, ICVCM, etc.
              Risk score ranges from 0 (lowest risk) to 10 (highest risk).
            </p>
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-24 w-24">
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
                    className={getProgressColor(overallRisk)}
                    strokeWidth="10"
                    strokeDasharray={`${overallRisk * 28.3} 283`}
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
                    className={getRiskLevel(overallRisk).color}
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
              <div className="text-sm font-medium mt-1 text-center">
                <span className={getRiskLevel(overallRisk).color}>
                  {getRiskLevel(overallRisk).level} Risk
                </span>
              </div>
            </div>
          </div>
          

        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-grow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>
                <div className="flex items-center">
                  Risk Category
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The specific area of risk assessment for the carbon offset project.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Risk Level
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Overall risk rating based on impact and likelihood. Ranges from Low to Critical.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <div className="flex items-center">
                  Impact
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The severity of consequences if the risk materializes. Ranges from Low to High.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <div className="flex items-center">
                  Likelihood
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The probability of the risk occurring. Ranges from Unlikely to Likely.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric, index) => {
              const { level, color } = getRiskLevel(metric.score);
              const isExpanded = expandedRows.includes(index);
              
              return (
                <React.Fragment key={index}>
                  <TableRow 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleRow(index)}
                  >
                    <TableCell className="p-2 w-10">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{metric.category}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${color}`}>
                        {level}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{metric.impact}</TableCell>
                    <TableCell className="hidden md:table-cell">{metric.likelihood}</TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell className="p-0"></TableCell>
                      <TableCell colSpan={4} className="p-4 bg-muted/30">
                        <div className="text-sm text-muted-foreground max-h-80 overflow-y-auto pr-2">
                          {metric.description}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RiskSummaryTable;
