# server.py
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Optional
import os
from dotenv import load_dotenv

from database import get_projects, get_project_details, store_analysis_results
from llm_service import analyze_document, generate_recommendations
from file_service import process_uploaded_file, store_file
from models import ProjectAnalysisRequest, ProjectAnalysisResponse

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/projects")
async def get_all_projects():
    return await get_projects()

@app.get("/api/projects/{project_code}")
async def get_project(project_code: str):
    return await get_project_details(project_code)

@app.get("/api/projects/{code}/exists")
async def check_project_exists(code: str):
    projects = await get_projects()
    exists = any(p.get("project_code") == code for p in projects)
    return {"exists": exists}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_id = await store_file(file)
        document_index= await process_uploaded_file(file)
        return {"fileId": file_id, "index": document_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_project(request: ProjectAnalysisRequest):
    try:
        # Extract document data
        project_data = await analyze_document(request.document_text)
        
        # Perform risk analysis
        risk_metrics = await analyze_document(
            request.document_text, 
            additional_context=request.policy_documents
        )
        
        # Generate recommendations and regional analysis
        analysis_results = await generate_recommendations(
            request.document_text,
            request.regional_policies
        )
        
        # Store results in database
        project_id = await store_analysis_results(
            project_data, 
            risk_metrics, 
            analysis_results
        )
        
        return {
            "projectData": project_data,
            "queryResponse": request.query,
            "summary": analysis_results["summary"],
            "riskMetrics": risk_metrics,
            "deforestationData": analysis_results["deforestation_data"],
            "emissionsData": analysis_results["emissions_data"],
            "pieChartData": analysis_results["pie_chart_data"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=3005, reload=True)