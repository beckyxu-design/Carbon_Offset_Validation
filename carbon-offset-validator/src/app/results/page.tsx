'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Analysis = {
  projectDescription?: string;
  overallRisk?: string;
  baselineOverstatement?: string;
  aiInsights?: string;
  visualizations?: string;
};

export default function Results() {
  const searchParams = useSearchParams();
  const result = searchParams.get('result');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (result) {
      try {
        setAnalysis(JSON.parse(result));
      } catch (error) {
        console.error('Error parsing result:', error);
      }
    }
  }, [result]);

  if (!analysis) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Analysis Results</h1>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Project Description</h2>
          <p>{analysis.projectDescription || 'No description available.'}</p>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Key Metrics</h2>
          <ul className="list-disc ml-6">
            <li>Overall Additionality Risk: {analysis.overallRisk || 'N/A'}</li>
            <li>Baseline Overstatement: {analysis.baselineOverstatement || 'N/A'}</li>
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">AI Insights</h2>
          <p>{analysis.aiInsights || 'No insights available.'}</p>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Data Visualizations</h2>
          {analysis.visualizations ? (
            <img src={analysis.visualizations} alt="Data Visualizations" className="w-full" />
          ) : (
            <p>No visualizations available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
