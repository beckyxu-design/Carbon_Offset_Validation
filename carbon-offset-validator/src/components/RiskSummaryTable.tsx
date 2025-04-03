import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { RiskMetric } from '@/lib/types';

interface RiskSummaryTableProps {
  metrics: RiskMetric[];
}

const getRiskLevel = (score: number) => {
  if (score >= 80) return { level: 'Critical', color: 'text-red-500' };
  if (score >= 60) return { level: 'High', color: 'text-orange-500' };
  if (score >= 40) return { level: 'Medium', color: 'text-yellow-500' };
  return { level: 'Low', color: 'text-green-500' };
};

const RiskSummaryTable: React.FC<RiskSummaryTableProps> = ({ metrics }) => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
          Risk Assessment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Risk Category</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="hidden md:table-cell">Impact</TableHead>
              <TableHead className="hidden md:table-cell">Likelihood</TableHead>
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
                        <div className="text-sm text-muted-foreground">
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
