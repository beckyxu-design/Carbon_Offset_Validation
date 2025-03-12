
import React from "react";
import { ProjectData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Maximize } from "lucide-react";

interface ProjectHeaderProps {
  project: ProjectData;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-normal">
              Project ID: {project.id}
            </Badge>
            {project.startDate && (
              <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-secondary/20 font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                Started {new Date(project.startDate).getFullYear()}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name || `Carbon Project ${project.id}`}</h1>
        </div>
      </div>
      
      <Card className="glass-card mb-8 overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.location && (
              <div className="flex items-start">
                <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
                  <div className="font-medium">{project.location}</div>
                </div>
              </div>
            )}
            
            {project.size && (
              <div className="flex items-start">
                <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Maximize className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Project Size</div>
                  <div className="font-medium">{project.size}</div>
                </div>
              </div>
            )}
            
            {project.startDate && (
              <div className="flex items-start">
                <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Start Date</div>
                  <div className="font-medium">
                    {new Date(project.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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
