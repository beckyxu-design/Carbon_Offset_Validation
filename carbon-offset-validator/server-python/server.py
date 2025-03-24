# server.py
# functions:
# @app.get("/api/projects")
# @app.get("/api/projects/{project_code}")
# @app.get("/api/projects/{code}/exists")
# @app.post("/api/upload")
# @app.post("/api/analyze")
# @app.post("/api/generate-text")

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Optional
import os
from dotenv import load_dotenv

from database import get_projects, get_project_details, store_analysis_results
from llm_service import extract_doc_basicInfo, analyze_policy_risks
from file_service import process_uploaded_file, store_file
from models import ProjectAnalysisRequest, ProjectAnalysisResponse # these are class formats 

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
        file_id = await store_file(file) # file_id is a generated uuid
        document_index= await process_uploaded_file(file)
        return {"fileId": file_id, "index": document_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_project_llm(request: ProjectAnalysisRequest):
    try:
        # Extract document data
        project_data = await extract_doc_basicInfo(request.document_text)
        
        # Perform risk analysis
        risk_metrics = await analyze_projectdesign_risks(
            request.document_text, 
            additional_context=request.policy_documents # instead of request, pull from processed and stored policy index 
        )
        
        # Generate recommendations and regional analysis
        risk_policy = await analyze_policy_risks(
            request.document_text,
            request.regional_policies # instead of request, pull from processed and stored policy index 
        )
        
        # Store results in database
        project_id = await store_analysis_results(
            project_data, 
            risk_metrics, 
            risk_policy
        )
        
        return {
            "projectData": project_data,
            "queryResponse": request.query,
            "summary": risk_policy["summary"], # update this summary to 
            "riskMetrics": risk_metrics,
            # these functions should create with GIS analysis...  
            # "deforestationData": risk_policy["deforestation_data"],
            # "emissionsData": risk_policy["emissions_data"],
            # "pieChartData": risk_policy["pie_chart_data"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-text")
async def generate_text(request: dict):
    """
    Generate AI text responses based on project data and user queries.
    
    This endpoint receives a query and project_code, then generates
    a relevant response about the carbon offset project.
    """
    try:
        query = request.get("query", "")
        project_code = request.get("projectCode", "")
        
        if not query or not project_code:
            raise HTTPException(status_code=400, detail="Query and projectCode are required")
        
        # Get project details to provide context for the response
        project_data = await get_project_details(project_code)
        if not project_data:
            raise HTTPException(status_code=404, detail=f"Project with code {project_code} not found")
        
        # Generate a response based on the query and project data
        # This is a simplified implementation - in production you would use a more
        # sophisticated approach with a proper LLM integration
        
        # Example response generation based on query keywords and project data
        response = ""
        project_name = project_data["project"]["name"]
        project_location = project_data["project"]["location"]
        
        if "risk" in query.lower() or "risks" in query.lower():
            risk_metrics = project_data.get("riskMetrics", [])
            if risk_metrics:
                highest_risk = max(risk_metrics, key=lambda x: x.get("score", 0))
                response = f"The highest risk for {project_name} is in the {highest_risk.get('category', 'unknown')} category with a score of {highest_risk.get('score', 'N/A')}. {highest_risk.get('description', '')}"
            else:
                response = f"No risk metrics are available for {project_name}."
        
        elif "deforestation" in query.lower():
            response = f"The {project_name} project in {project_location} is implementing measures to reduce deforestation through sustainable land management practices and community engagement."
        
        elif "emission" in query.lower() or "carbon" in query.lower():
            response = f"The {project_name} project aims to reduce carbon emissions through improved forest management and conservation activities in {project_location}."
        
        else:
            # Default response
            response = f"The {project_name} project in {project_location} is a carbon offset initiative that focuses on sustainable forest management and community development."
        
        return {"response": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=3005, reload=True)