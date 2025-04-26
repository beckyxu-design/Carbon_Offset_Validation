# server.py
# functions:
# @app.get("/api/projects")
# @app.get("/api/projects/{project_code}")
# @app.get("/api/projects/{code}/exists")
# @app.post("/api/upload")
# @app.post("/api/analyze")
# @app.post("/api/generate-text")
# @app.post("/api/projects/{project_code}/update-summary")
# @app.get("/api/projects/{project_code}/landuse-timeseries")


from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Optional
import os
from dotenv import load_dotenv
import traceback

# Import core database functions that don't depend on LlamaIndex
from database import get_projects, get_palm_data, get_project_details, update_regional_analy_summary

# Safely import optional components
store_analysis_results = None
process_uploaded_file = None
store_file = None
extract_doc_basicInfo = None
analyze_policy_risks = None
analyze_projectdesign_risks = None

# Try to import optional components that use LlamaIndex
try:
    from file_service import process_uploaded_file, store_file
except ImportError as e:
    print(f"Warning: Could not import file_service: {e}")
    print("File upload functionality will be disabled")

try:
    from llm_service import extract_doc_basicInfo, analyze_policy_risks, analyze_projectdesign_risks
except ImportError as e:
    print(f"Warning: Could not import llm_service: {e}")
    print("Document analysis functionality will be disabled")

try:
    from database import store_analysis_results
except ImportError as e:
    print(f"Warning: Could not import store_analysis_results: {e}")
    print("Project analysis storage will be disabled")

try:
    from models import ProjectAnalysisRequest, ProjectAnalysisResponse
except ImportError as e:
    print(f"Warning: Could not import models: {e}")
    print("Using fallback model definitions")
    
    # Define fallback models if imports fail
    from pydantic import BaseModel
    from typing import Dict, List, Optional, Any
    
    class ProjectAnalysisRequest(BaseModel):
        query: str
        document_text: str
        policy_documents: Optional[str] = None
        regional_policies: Optional[str] = None
        
    class ProjectAnalysisResponse(BaseModel):
        projectData: Dict[str, Any]
        queryResponse: str
        riskMetrics: List[Dict[str, Any]]
        regionalInsights: Dict[str, Any]

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

@app.get("/api/gis/palmoil")
async def get_palm_data_server():
    try:
        print("Fetching palm oil concession data...")
        features = await get_palm_data()
        print(f"Fetched {len(features)} palm oil concession records")
        
        # Format the response as a proper GeoJSON FeatureCollection
        geojson_feature_collection = {
            "type": "FeatureCollection",
            "features": features
        }
        
        return {"palmOilData": geojson_feature_collection}
    except Exception as e:
        print(f"Error in get_palm_data_server: {e}")
        return {"error": f"Failed to fetch palm oil data: {str(e)}"}

# this is the api to get all project details from supabase
@app.get("/api/projects/{project_code}")
async def get_project(project_code: str):
    try:
        print(f"Fetching project details for project_code: {project_code}")
        project_details = await get_project_details(project_code)
        if not project_details:
            print(f"No project found with code: {project_code}")
            raise HTTPException(status_code=404, detail=f"Project with code {project_code} not found")
        print(f"Successfully fetched project details for {project_code}")
        return project_details
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching project details: {error_msg}")
        traceback_str = traceback.format_exc()
        print(f"Traceback: {traceback_str}")
        
        # Return a more specific error message
        if "policy_analysis" in error_msg:
            raise HTTPException(status_code=500, detail="Error parsing policy_analysis field")
        elif "news" in error_msg:
            raise HTTPException(status_code=500, detail="Error parsing news field")
        elif "landuse_time_series" in error_msg:
            raise HTTPException(status_code=500, detail="Error with landuse_time_series table")
        elif "uuid" in error_msg.lower():
            raise HTTPException(status_code=500, detail="Invalid UUID format for project ID")
        else:
            raise HTTPException(status_code=500, detail=f"Error fetching project details: {error_msg}")

@app.get("/api/projects/{code}/exists")
async def check_project_exists(code: str):
    projects = await get_projects()
    exists = any(p.get("project_code") == code for p in projects)
    return {"exists": exists}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if store_file is None or process_uploaded_file is None:
        raise HTTPException(status_code=500, detail="File upload functionality is disabled")
    try:
        file_id = await store_file(file) # file_id is a generated uuid
        document_index= await process_uploaded_file(file)
        return {"fileId": file_id, "index": document_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_project_llm(request: ProjectAnalysisRequest):
    if extract_doc_basicInfo is None or analyze_policy_risks is None or analyze_projectdesign_risks is None or store_analysis_results is None:
        raise HTTPException(status_code=500, detail="Document analysis functionality is disabled")
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
            request.regional_policies # NOTE CHAHGE: instead of request, pull from processed and stored policy index 
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
            "timeSeriesData": risk_policy["timeSeriesData"],
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

@app.get("/api/projects/{project_code}/landuse-timeseries")
async def get_landuse_timeseries(project_code: str):
    """
    Get land use time series data for a specific project.
    
    Args:
        project_code: The code of the project
        
    Returns:
        Land use time series data for the project
    """
    try:
        project_data = await get_project_details(project_code)
        if not project_data:
            raise HTTPException(status_code=404, detail=f"Project with code {project_code} not found")
        
        return {"landuseTimeSeriesData": project_data.get("landuseTimeSeriesData", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/{project_code}/update-summary")
async def update_project_summary(project_code: str, request: dict):
    try:
        # Extract the necessary fields from the request dictionary
        summary = request.get("summary", "")
        policy_analysis = request.get("policy_analysis", None)
        news = request.get("news", None)
        
        # Pass the extracted values to the update_regional_analy_summary function
        success = await update_regional_analy_summary(project_code, summary, policy_analysis, news)
        if success:
            return {"status": "success", "message": f"Summary updated for project {project_code}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update project summary")
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating project summary: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=3006, reload=True)
    # uvicorn.run("server:app", host="0.0.0.0", port=3005, reload=True)