import React, { useState } from "react";
import { OverallSummary } from "@/lib/types";
import { AlertTriangle, Copy, Check, CircleAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectRiskAnalysisProps {
  overallSummary: OverallSummary[];
}

const ProjectRiskAnalysis: React.FC<ProjectRiskAnalysisProps> = ({ overallSummary }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!overallSummary || overallSummary.length === 0 || !overallSummary[0].summary) {
    return null;
  }

  // Split summary into sentences for highlighting
  const summarySentences = overallSummary[0].summary.split('.').filter(s => s.trim()).map(s => s.trim() + '.');

  const copyToClipboard = () => {
    const text = `
      Project Overall Risk Analysis
      
      Summary: ${overallSummary[0].summary}
    `;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Risk analysis copied to clipboard");

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mb-6"
    >
      <Card className="glass-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold flex items-center">
              <CircleAlert className="h-5 w-5 mr-2 text-primary" />
              Overview: Project Risk Analysis
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyToClipboard}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summarySentences.map((sentence, index) => (
              <p key={index} className="text-sm">
                {sentence}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectRiskAnalysis;
