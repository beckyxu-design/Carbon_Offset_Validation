
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AIAnalysisRequest, FileType, UploadedFile } from "@/lib/types";
import { uploadFile } from "@/lib/ai";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  FileText, 
  MapPin, 
  Upload, 
  X, 
  ArrowRight, 
  FileQuestion
} from "lucide-react";

interface UploadFormProps {
  onSubmit: (request: AIAnalysisRequest) => void;
  isLoading?: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSubmit, isLoading = false }) => {
  const [projectId, setProjectId] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    
    try {
      // Determine file type
      let fileType: FileType = 'other';
      if (file.name.endsWith('.pdf')) fileType = 'pdd';
      else if (file.name.endsWith('.kml')) fileType = 'kml';
      else if (file.name.endsWith('.shp')) fileType = 'shapefile';
      
      // In a real app, we would upload to server
      const url = await uploadFile(file);
      
      const newFile: UploadedFile = {
        name: file.name,
        type: fileType,
        size: file.size,
        url
      };
      
      setFiles(prev => [...prev, newFile]);
      toast.success(`Uploaded ${file.name}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId.trim()) {
      toast.error("Please enter a project ID");
      return;
    }
    
    if (!query.trim()) {
      toast.error("Please enter your question");
      return;
    }
    
    const request: AIAnalysisRequest = {
      projectId: projectId.trim(),
      query: query.trim(),
      files: files.length > 0 ? files : undefined
    };
    
    onSubmit(request);
  };

  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case 'pdd':
        return <FileText className="h-4 w-4" />;
      case 'kml':
      case 'shapefile':
        return <MapPin className="h-4 w-4" />;
      default:
        return <FileQuestion className="h-4 w-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="projectId" className="text-sm font-medium">
          Project ID
        </Label>
        <Input
          id="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID (e.g., Project 5032)"
          className="glass-input h-12"
          required
        />
      </div>
      
      {/* File upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Project Documents</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-dashed border-2 h-12 flex-1 bg-white/50 backdrop-blur-sm transition-all hover:border-primary hover:bg-white/60 text-muted-foreground hover:text-foreground"
          >
            {uploading ? (
              <span className="flex items-center">
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload PDD/KML/Shapefile
              </span>
            )}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.kml,.shp,.zip"
          />
        </div>
        
        {/* Uploaded files */}
        {files.length > 0 && (
          <Card className="mt-4 overflow-hidden bg-white/50 backdrop-blur-sm border border-white/30">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">Uploaded Files</div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/70 rounded-md text-sm">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Query input */}
      <div className="space-y-2">
        <Label htmlFor="query" className="text-sm font-medium">
          Your Question
        </Label>
        <Textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What would you like to know? (e.g., What are the main drivers of deforestation here?)"
          className="glass-input min-h-[120px]"
          required
        />
      </div>
      
      {/* Submit button */}
      <Button 
        type="submit" 
        className="w-full btn-primary h-12 group"
        disabled={isLoading || uploading}
      >
        {isLoading ? (
          <span className="flex items-center">
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
            Analyzing...
          </span>
        ) : (
          <span className="flex items-center">
            Analyze Project
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </Button>
    </form>
  );
};

export default UploadForm;
