import React from 'react';
import { useMap } from '@/contexts/MapContext';
import { sampleProject } from '@/lib/sample-data';

const ProjectSelector: React.FC = () => {
  const { selectedProjectId, setSelectedProjectId } = useMap();

  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Select Project</h2>
      <div className="space-y-2">
        <div
          className={`p-2 rounded cursor-pointer transition-colors ${
            selectedProjectId === sampleProject.id
              ? 'bg-blue-100 border-blue-500'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setSelectedProjectId(sampleProject.id)}
        >
          <h3 className="font-medium">{sampleProject.name}</h3>
          <p className="text-sm text-gray-600">{sampleProject.location}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelector;
