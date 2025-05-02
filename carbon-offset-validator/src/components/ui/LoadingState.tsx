import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingStateProps {
  status: 'uploading' | 'processing' | 'analyzing';
  progress: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({ status, progress }) => {
  const statusMessages = {
    uploading: {
      title: 'Fetching Project Data',
      steps: ['Fetching project data', 'Validating content', 'Preparing for carbon analysis']
    },
    processing: {
      title: 'Processing Carbon Offset Data',
      steps: ['Extracting project details', 'Identifying key metrics', 'Preparing for validation']
    },
    analyzing: {
      title: 'Analyzing Carbon Offset Validity',
      steps: ['Evaluating project claims', 'Assessing risk factors', 'Generating comprehensive validation report']
    }
  };

  const currentStatus = statusMessages[status];
  const activeStep = Math.min(
    Math.floor((progress / 100) * currentStatus.steps.length),
    currentStatus.steps.length - 1
  );

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-16 text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin"
          style={{ animationDuration: '1.5s' }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-800">{progress}%</span>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-3">{currentStatus.title}</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Our AI is analyzing your carbon offset project to validate claims and assess overall credibility
      </p>
      
      <Progress value={progress} className="h-2 mb-8" />
      
      <div className="space-y-4 max-w-md mx-auto">
        {currentStatus.steps.map((step, index) => (
          <div 
            key={index} 
            className={`flex items-center p-3 rounded-lg transition-all ${
              index <= activeStep 
                ? 'bg-accent/10 text-accent-foreground' 
                : 'bg-gray-50 text-gray-400'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
              index <= activeStep 
                ? 'bg-accent text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              {index < activeStep ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;