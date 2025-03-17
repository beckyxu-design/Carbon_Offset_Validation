import React from "react";
import { Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
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

  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate);
  const coordinates = formatCoordinates(project.coordinates);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-normal">
              Project Code: {project.project_code}
            </Badge>
            {startDate && (
              <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-secondary/20 font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                Started {new Date(project.startDate).getFullYear()}
              </Badge>
            )}
            {project.status && (
              <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-secondary/20 font-normal">
                Status: {project.status}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name || `Carbon Project ${project.project_code}`}</h1>
        </div>
      </div>
      
      <Card className="glass-card mb-8 overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.location && (
              <div className="flex items-start">
                <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
                  <div className="font-medium">{project.location}</div>
                  {coordinates && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {coordinates}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {(startDate || endDate) && (
              <div className="flex items-start">
                <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Project Period</div>
                  <div className="font-medium">
                    {startDate} - {endDate}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {project.description && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-sm font-medium text-muted-foreground mb-2">Project Description</div>
              <p className="text-foreground">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectHeader;
