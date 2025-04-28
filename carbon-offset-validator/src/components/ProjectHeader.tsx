import React from "react";
import { Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Info, Tag, FileText } from "lucide-react";

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  // Debug log
  console.log("ProjectHeader received project:", project);

  // Early return with loading state if project is undefined
  if (!project) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Loading project data...</h1>
          </div>
        </div>
      </div>
    );
  }

  // Format coordinates safely
  const formatCoordinates = (coords: [number, number] | undefined) => {
    if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;
    try {
      return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
    } catch (error) {
      console.error('Error formatting coordinates:', error);
      return null;
    }
  };

  // Format date safely
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  // Format timestamp safely
  const formatTimestamp = (timestampStr: string | undefined) => {
    if (!timestampStr) return null;
    try {
      return new Date(timestampStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return null;
    }
  };

  const startDate = formatDate(project.start_date);
  const endDate = formatDate(project.end_date);
  const coordinates = formatCoordinates(project.coordinates);
  const createdAt = formatTimestamp(project.created_at);
  const updatedAt = formatTimestamp(project.updated_at);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-normal">
              Project Code: {project.project_code}
            </Badge>
            <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-secondary/20 font-normal">
              Status: {project.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{project.location}</span>
              </div>
            )}
            
            {coordinates && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Coordinates: {coordinates}</span>
              </div>
            )}

            {startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Crediting Start: {startDate}</span>
              </div>
            )}

            {endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Crediting End: {endDate}</span>
              </div>
            )}

            {project.methodology && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Methodology: {project.methodology}</span>
              </div>
            )}

            {project.size && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Size: {project.size}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectHeader;
