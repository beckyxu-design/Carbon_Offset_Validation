import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AIAnalysisRequest, FileType, UploadedFile } from "@/lib/types";
import { uploadFile, getProjectData } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  FileText, 
  MapPin, 
  Upload, 
  X, 
  ArrowRight, 
  FileQuestion,
  Globe,
  Building
} from "lucide-react";
import LoadingState from "@/components/ui/LoadingState";

interface UploadFormProps {
  onSubmit: (request: AIAnalysisRequest) => void;
  isLoading?: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSubmit, isLoading = false }) => {
  const [projectCode, setProjectCode] = useState<string>("");
  const [query, setQuery] = useState<string>("what is the deforestation rate");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [registry, setRegistry] = useState<string>("Verra");
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [country, setCountry] = useState<string>("Indonesia");
  
  // Loading state management
  const [showLoadingState, setShowLoadingState] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<'uploading' | 'processing' | 'analyzing'>('uploading');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await getProjectData();
        if (error) throw new Error(error);
        if (data && data.projects && Array.isArray(data.projects)) {
          setAvailableProjects(data.projects.slice(0, 10).map((p: any) => p.project_code));
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
        // Don't show error toast here as it's not critical
      }
    }
    fetchProjects();
  }, []);

  // Simulate loading progress for demo purposes
  useEffect(() => {
    if (isLoading && !showLoadingState) {
      setShowLoadingState(true);
      setLoadingProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 30) {
            setLoadingStatus('uploading');
            return prev + 1;
          } else if (prev < 70) {
            setLoadingStatus('processing');
            return prev + 0.5;
          } else if (prev < 95) {
            setLoadingStatus('analyzing');
            return prev + 0.2;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
    
    if (!isLoading) {
      setShowLoadingState(false);
    }
  }, [isLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      let fileType: FileType;
      
      if (file.name.endsWith('.pdf')) {
        fileType = FileType.PDF;
      } else if (file.name.endsWith('.kml')) {
        fileType = FileType.KML;
      } else if (file.name.endsWith('.shp') || file.name.endsWith('.zip')) {
        fileType = FileType.Shapefile;
      } else {
        throw new Error("Unsupported file type");
      }
      
      const uploadedFile = await uploadFile(file);
      
      if (uploadedFile) {
        setFiles(prev => [...prev, {
          id: uploadedFile.id,
          name: file.name,
          type: fileType,
          size: file.size
        }]);
        toast.success(`File ${file.name} uploaded successfully`);
      }
    } catch (err) {
      console.error("File upload error:", err);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case FileType.PDF:
        return <FileText className="h-4 w-4 text-red-500" />;
      case FileType.KML:
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case FileType.Shapefile:
        return <MapPin className="h-4 w-4 text-green-500" />;
      default:
        return <FileQuestion className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectCode) {
      toast.error("Please enter a project code");
      return;
    }
    
    const request: AIAnalysisRequest = {
      projectCode,
      query: query || "Analyze this project",
      files,
      registry
    };
    
    onSubmit(request);
  };

  if (showLoadingState) {
    return (
      <div className="w-full max-w-md mx-auto">
        <LoadingState 
          status={loadingStatus} 
          progress={loadingProgress} 
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <Card className="glass-card border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Country selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-800">
                <Globe className="h-4 w-4 text-blue-600" />
                Country of the Project
              </label>
              <div className="flex gap-4 pl-2">
                <label className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  <input
                    type="radio"
                    name="country"
                    value="Indonesia"
                    checked={country === "Indonesia"}
                    onChange={() => setCountry("Indonesia")}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <span>Indonesia</span>
                </label>
                {/* Add more country options here in the future */}
              </div>
            </div>

            {/* Registry toggle */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-800">
                <Building className="h-4 w-4 text-blue-600" />
                Carbon Offset Registry
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start pl-2">
                <label className="flex items-start gap-2 hover:text-blue-600 transition-colors">
                  <input
                    type="radio"
                    name="registry"
                    value="Verra"
                    checked={registry === "Verra"}
                    onChange={() => setRegistry("Verra")}
                    className="accent-blue-600 mt-0.5 h-4 w-4"
                  />
                  <span>Verra</span>
                </label>
                <label className="flex items-start gap-2 text-gray-400 cursor-not-allowed">
                  <input
                    type="radio"
                    name="registry"
                    value="Gold Standard"
                    checked={registry === "Gold Standard"}
                    onChange={() => setRegistry("Gold Standard")}
                    className="accent-yellow-600 mt-0.5 h-4 w-4"
                    disabled
                  />
                  <span>Gold Standard (Coming Soon)</span>
                </label>
                <label className="flex items-start gap-2 text-gray-400 cursor-not-allowed">
                  <input
                    type="radio"
                    name="registry"
                    value="American Carbon Registry"
                    checked={registry === "American Carbon Registry"}
                    onChange={() => setRegistry("American Carbon Registry")}
                    className="accent-green-600 mt-0.5 h-4 w-4"
                    disabled
                  />
                  <span>American Carbon Registry (Coming Soon)</span>
                </label>
              </div>
            </div>
            
            {/* Project ID */}
            <div className="space-y-3 pt-2">
              <Label htmlFor="projectCode" className="flex items-center gap-2 text-gray-800">
                <FileText className="h-4 w-4 text-blue-600" />
                Project ID
              </Label>
              <Input
                id="projectCode"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="Enter project id (e.g., 3226)"
                className="glass-input h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              
              {/* Available projects */}
              {availableProjects.length > 0 && (
                <div className="mt-4 bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                  <Label className="text-sm text-gray-600 mb-2 block">Available Projects</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableProjects.map((code) => (
                      <Button
                        key={code}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProjectCode(code)}
                        className="text-sm px-3 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {code}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* File upload */}
            <div className="space-y-3 pt-2">
              {/* <Label className="flex items-center gap-2 text-gray-800">
                <Upload className="h-4 w-4 text-blue-600" />
                Upload PDD/KML/Shapefile
              </Label> */}
              {/* <div className="flex items-center gap-4">
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
                      Upload File
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
              </div> */}
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
            {/* <div className="space-y-3 pt-2">
              <Label htmlFor="query" className="flex items-center gap-2 text-gray-800">
                <FileText className="h-4 w-4 text-blue-600" />
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
            </div> */}
            
            {/* Submit button */}
            <Button 
              type="submit" 
              disabled={isLoading || !projectCode} 
              className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isLoading ? (
                <span className="flex items-center">Processing...</span>
              ) : (
                <span className="flex items-center">
                  Analyze Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default UploadForm;
