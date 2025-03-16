import React, { useState, useEffect } from 'react';
import { useMap } from '@/contexts/MapContext';
import { Project } from '@/lib/types';
import { getProjectData } from '@/lib/api';
// import { sampleProject } from '@/lib/sample-data';

const ProjectSelector: React.FC = () => {
  const { selectedProjectId, setSelectedProjectId } = useMap();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjectData('', ''); // Empty strings since we're just fetching the list
        if (response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">Loading projects...</div>;
  }

  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Select Project</h2>
      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`p-2 rounded cursor-pointer transition-colors ${
              // selectedProjectId === sampleProject.id
              selectedProjectId === project.id
                ? 'bg-blue-100 border-blue-500'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedProjectId(project.id)}
            // onClick={() => setSelectedProjectId(sampleProject.id)
          >
            <h3 className="font-medium">{project.name}</h3>
            <p className="text-sm text-gray-600">{project.location}</p>
            {/* <h3 className="font-medium">{sampleProject.name}</h3>
          <p className="text-sm text-gray-600">{sampleProject.location}</p> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectSelector;
