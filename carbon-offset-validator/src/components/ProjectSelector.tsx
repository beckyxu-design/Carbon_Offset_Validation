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
        const response = await getProjectData(); // No parameter to fetch all projects
        if (response.data && response.data.projects) {
          setProjects(response.data.projects);
        } else if (response.data && response.data.project) {
          // If we only have a single project, create an array with it
          setProjects([response.data.project]);
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

  if (projects.length === 0) {
    return (
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
        No projects available
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium mb-2">Select a Project</h3>
      <select
        className="w-full p-2 border rounded"
        value={selectedProjectId || ''}
        onChange={(e) => setSelectedProjectId(e.target.value)}
      >
        <option value="">-- Select Project --</option>
        {projects.map((project) => (
          <option key={project.project_code} value={project.project_code}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProjectSelector;
