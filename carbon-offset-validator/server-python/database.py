# database.py
# manage project data retrival and upload with supabase
# get_projects(): return all projects in db # get_project_details(project_code: str): return project details of one project
# store_analysis_results(project_data, risk_metrics, analysis_results): store project basic info and llm analysis results in dbasync def insert_project_data(project_code: str, gis_results: Dict[str, Any]):
# insert_project_GISdata(project_code: str, gis_results: Dict[str, Any]): insert gis data result

import os
from supabase import create_client, Client
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

async def get_projects():
    # table = "projects"
    response = supabase.table("projects").select("*").execute()
    return response.data

async def get_project_details(project_code: str):
    # Get project
    project_response = supabase.table("projects").select("*").eq("project_code", project_code).single().execute()
    project = project_response.data
    
    if not project:
        return None
    
    project_id = project["id"]
    
    # Get summary
    summary_response = supabase.table("project_summary").select("*").eq("project_id", project_id).single().execute()
    
    # Get risk metrics
    risk_response = supabase.table("risk_summary_metrics").select("*").eq("project_id", project_id).execute()
    
    # Get time series data
    time_series_response = supabase.table("time_series_data").select("*").eq("project_id", project_id).order("timestamp").execute()
    
    # Get pie chart data
    pie_chart_response = supabase.table("pie_chart_data").select("*").eq("project_id", project_id).execute()
    
    # Get geospatial data
    geo_response = supabase.table("geo_data").select("geometry, properties").eq("project_id", project_id).execute()
    
    return {
        "project": project,
        "summary": summary_response.data,
        "riskMetrics": risk_response.data,
        "timeSeriesData": time_series_response.data,
        "pieChartData": pie_chart_response.data,
        "geospatialData": [
            {
                "type": "Feature",
                "geometry": item["geometry"],
                "properties": item["properties"]
            }
            for item in geo_response.data
        ] if geo_response.data else []
    }

async def store_analysis_results(project_data, risk_metrics, analysis_results):
    # Insert project
    project_response = supabase.table("projects").insert(project_data).execute()
    project_id = project_response.data[0]["id"]
    # insert project code 
    
    # Insert summary
    supabase.table("project_summary").insert({
        "project_id": project_id,
        "summary": analysis_results["summary"]["overall_summary"],
        "recommendations": [r["action"] for r in analysis_results["summary"]["recommendations"]],
        "additional_insights": analysis_results["summary"]["additional_insights"]
    }).execute()
    
    # Insert risk metrics
    for metric in risk_metrics:
        supabase.table("risk_summary_metrics").insert({
            "project_id": project_id,
            "category": metric["category"],
            "score": metric["score"],
            "impact": metric["impact"],
            "likelihood": metric["likelihood"],
            "description": metric["description"]
        }).execute()
    
    return project_id

async def insert_project_GISdata(project_code: str, gis_results: Dict[str, Any]):
    """
    Insert time series and pie chart data for an existing project.
    
    Args:
        project_code: The code of the existing project
        gis_results: Dictionary containing deforestation_data, emissions_data, and pie_chart_data
    
    Returns:
        bool: True if data was inserted successfully
    """
    try:
        project_response = supabase.table("projects").select("*").eq("project_code", project_code).single().execute()    
        if not project_response.data:
            raise ValueError(f"No project found with code: {project_code}")
        
        project_id = project_response.data["id"]

        # Insert time series data for deforestation
        if "deforestation_data" in gis_results:
            for data_point in gis_results["deforestation_data"]:
                supabase.table("time_series_data").insert({
                    "project_id": project_id,
                    "type": "deforestation",
                    "timestamp": f"{data_point['year']}-01-01",
                    "value": data_point["hectares"]
                }).execute()
        
        # Insert time series data for emissions
        if "emissions_data" in gis_results:
            for data_point in gis_results["emissions_data"]:
                supabase.table("time_series_data").insert({
                    "project_id": project_id,
                    "type": "emissions",
                    "timestamp": f"{data_point['year']}-01-01",
                    "value": data_point["tonnes"]
                }).execute()
        
        # Insert pie chart data
        if "pie_chart_data" in gis_results:
            for segment in gis_results["pie_chart_data"]:
                supabase.table("pie_chart_data").insert({
                    "project_id": project_id,
                    "category": segment["category"],
                    "value": segment["value"]
                }).execute()
        return True
    
    except KeyError as ke:
        print(f"Project error: {ke}")
        return False
    except Exception as e:
        print(f"Error inserting project data: {e}")
        return False