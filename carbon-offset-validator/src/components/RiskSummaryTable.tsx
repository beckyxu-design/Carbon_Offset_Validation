import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from 'lucide-react';
import { RiskMetric } from '@/lib/types';

// This interface is not needed here as it's already defined in the types.ts file.
// Import the RiskMetric interface from the types file instead:

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
              <TableHead>Risk Category</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="hidden md:table-cell">Impact</TableHead>
              <TableHead className="hidden md:table-cell">Likelihood</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric, index) => {
              const { level, color } = getRiskLevel(metric.score);
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{metric.category}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${color}`}>
                      {level}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{metric.impact}</TableCell>
                  <TableCell className="hidden md:table-cell">{metric.likelihood}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RiskSummaryTable;
