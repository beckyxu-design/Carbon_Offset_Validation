import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface LandusePieChartProps {
  data: {
    category: string;
    value: number;
  }[];
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

// def react functional component
const LandusePieChart: React.FC<LandusePieChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
          Land Use Classification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(2)} hectares (${((value / total) * 100).toFixed(1)}%)`,
                  'Area'
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default LandusePieChart;
