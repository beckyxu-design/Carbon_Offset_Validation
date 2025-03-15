import React, { useState } from 'react';
import { useMap } from '@/contexts/MapContext';
import { analyzeProject } from '@/lib/api';
import { AIAnalysisResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sampleAnalysisResponse } from '@/lib/sample-data';
import ProjectAnalysis from './ProjectAnalysis';

const ProjectAnalysisContainer: React.FC = () => {
  const { selectedProjectId } = useMap();
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeProject = async () => {
    if (!selectedProjectId) {
      setError('Please select a project first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await analyzeProject(selectedProjectId, query);
      if (response.success && response.data) {
        setAnalysis(response.data);
      } else {
        setError(response.error || 'Failed to analyze project');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleShowSampleData = () => {
    setAnalysis(sampleAnalysisResponse);
    setError(null);
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Ask a question about the project..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button
          onClick={handleAnalyzeProject}
          disabled={!selectedProjectId || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
        <Button
          variant="outline"
          onClick={handleShowSampleData}
          disabled={loading}
        >
          See Sample Data
        </Button>
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      {analysis && (
        <ProjectAnalysis analysis={analysis} />
      )}
    </div>
  );
};

export default ProjectAnalysisContainer;
