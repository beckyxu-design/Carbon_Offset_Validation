import React from "react";
import { Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Info, Tag, FileText, PersonStanding, SquareUserRound, Radius, Hash } from "lucide-react";


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
  const testdata = 3000

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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 content-start items-start">

            {project.methodology && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <FileText className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Methodology</span>: {project.methodology}</span>
              </div>
            )}
            
            {project.location && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <MapPin className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Location</span>: {project.location}</span>
              </div>
            )}

            {project.type && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Tag className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Type</span>: {project.type}</span>
              </div>
            )}

            {project.reduction_removal && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Tag className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Reduction/Removal</span>: {project.reduction_removal}</span>
              </div>
            )}

            {project.project_developer && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <SquareUserRound className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Project Developer</span>: {project.project_developer}</span>
              </div>
            )}

            {project.size && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Radius className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Size</span>: {project.size}</span>
              </div>
            )}

            {startDate && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Calendar className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Crediting Start</span>: {startDate}</span>
              </div>
            )}

            {endDate && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Calendar className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Crediting End</span>: {endDate}</span>
              </div>
            )}

            {(
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Hash className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Total Credits</span>: {project.total_credits}</span>
              </div>
            )}

            {(
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Hash className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Remaining Credits</span>: {project.remaining_credits}</span>
              </div>
            )}

            {(
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <Hash className="h-[14px] w-[14px] text-muted-foreground mt-[2px]" />
                </div>
                <span className="text-sm"><span className="font-semibold">Buffer Pool</span>: {project.buffer}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectHeader;
