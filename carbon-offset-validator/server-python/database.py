# database.py
# manage project data retrival and upload with supabase
# get_projects(): return all projects in db 
# get_project_details(): return stored project related data
# store_analysis_results(project_data, risk_metrics, analysis_results): store project basic info and llm analysis results in dbasync def insert_project_data(project_code_test: str, gis_results: Dict[str, Any]):
# insert_project_GISdata(project_code_test: str, gis_results: Dict[str, Any]): insert gis data result

import os
from supabase import create_client, Client
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)
print(supabase)

async def get_projects():
    # table = "projects"
    response = supabase.table("projects").select("*").execute()
    return response.data

async def get_palm_data():
    try:
        # Get the geojson column from the other_geo_data table
        geo_response = supabase.table("other_geo_data").select("geojson").execute()
        data = geo_response.data
        
        # Extract the GeoJSON features from the response
        features = []
        for item in data:
            if 'geojson' in item and item['geojson']:
                # If the item itself is already a complete GeoJSON feature, use it
                features.append(item['geojson'])
        
        print(f"Retrieved {len(features)} palm oil features from database")
        return features
    except Exception as e:
        print(f'database.py fail to get palm oil concession data from supabase: {e}')
        return []

async def get_project_details(project_code: str):
    '''    
    Summary: Get project data    
    "project": project,
    "summary": summary_data with summary, policy_analysis, news fields,
    "riskMetrics": risk_response.data,
    "timeSeriesData": time_series_response.data,
    "landuseTimeSeriesData": landuse_time_series_response.data,
    "pieChartData": pie_chart_response.data,
    "geospatialData": geo_response.data
    '''
    # Check if project_code is numeric (to handle requests by ID)
    if project_code.isdigit():
        # If numeric, look up the project by project_code field instead
        # (Not searching by ID since it's a UUID, not a simple integer)
        project_response = supabase.table("projects").select("*").eq("project_code", project_code).single().execute()
    else:
        # Otherwise find by project_code as usual
        project_response = supabase.table("projects").select("*").eq("project_code", project_code).single().execute()
    
    project = project_response.data
    
    if not project:
        return None
    
    project_id = project["id"]
    
    # Get summary
    summary_response = supabase.table("project_summary").select("*").eq("project_id", project_id).single().execute()
    print(summary_response.data)
    # Format summary data to match frontend expectations
    summary_data = summary_response.data
    if summary_data:
        # Ensure we have the expected fields
        if 'summary' not in summary_data:
            summary_data['summary'] = ""
            
        # Handle policy_analysis field - parse JSON string to dict
        if 'policy_analysis' in summary_data:
            if isinstance(summary_data['policy_analysis'], str):
                try:
                    import json
                    summary_data['policy_analysis'] = json.loads(summary_data['policy_analysis'])
                except json.JSONDecodeError:
                    # If JSON parsing fails, use empty dict
                    summary_data['policy_analysis'] = {}
        else:
            summary_data['policy_analysis'] = {}
            
        # Handle news field - parse JSON string to list
        if 'news' in summary_data:
            if isinstance(summary_data['news'], str):
                try:
                    import json
                    summary_data['news'] = json.loads(summary_data['news'])
                except json.JSONDecodeError:
                    # If JSON parsing fails, use empty list
                    summary_data['news'] = []
        else:
            summary_data['news'] = []
    else:
        # Initialize summary_data with default values if none exists
        summary_data = {
            'summary': "",
            'policy_analysis': {},
            'news': []
        }

    # Get risk metrics
    risk_response = supabase.table("risk_summary_metrics").select("*").eq("project_id", project_id).execute()
    
    # Get time series data
    time_series_response = supabase.table("time_series_data").select("*").eq("project_id", project_id).order("timestamp").execute()
    
    # Get landuse time series data with correct column names
    landuse_time_series_response = supabase.table("landuse_time_series").select("*").eq("project_id", project_id).order("month").execute()
    
    # Get pie chart data
    pie_chart_response = supabase.table("pie_chart_data").select("*").eq("project_id", project_id).execute()
    
    # Get geospatial data
    geo_response = supabase.table("geo_data").select("geometry").eq("project_id", project_id).execute()
    
    return {
        "project": project,
        "summary": summary_data,
        "riskMetrics": risk_response.data,
        "timeSeriesData": time_series_response.data,
        "landuseTimeSeriesData": landuse_time_series_response.data,
        "pieChartData": pie_chart_response.data,
        "geospatialData": geo_response.data
    }

async def store_analysis_results(project_data, risk_metrics):
    
    # Insert project
    project_response = supabase.table("projects").insert(project_data).execute()
    project_id = project_response.data[0]["id"]
    # insert project code 
    
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
    
async def update_regional_analy_summary(project_code: str, summary: str, policy_analysis: Dict[str, Any], news: List[Dict[str, Any]]):
    """
    Update or upload national policy and news analysis to the project_summary table.
    
    Args:
        project_code: project code in the projects table
        summary: string of the project policy risk analysis
        policy_analysis: Dictionary containing policy assessment information
        news: List of news articles from search
    
    Returns:
        bool: True if data was updated/inserted successfully
    """

    try:
        # Find the project by project_code
        print(f"Querying Supabase for project with code: {project_code}")
        try:
            project_response = supabase.table("projects").select("*").eq("project_code", project_code).single().execute()
            
            if not project_response.data:
                print(f"No project found with code: {project_code}")
                raise ValueError(f"No project found with code: {project_code}")
            
            project_id = project_response.data["id"]
            print(f"Found project with ID: {project_id}")
        except Exception as find_err:
            print(f"Error finding project: {find_err}")
            return False
            
        # Check if a summary already exists for this project
        print(f"Checking for existing summary for project_id: {project_id}")
        existing_summary = supabase.table("project_summary").select("*").eq("project_id", project_id).execute()
        
        # Prepare the data to insert/update - ensure the structure matches what your frontend expects
        summary_data = {
            "project_id": project_id,
            "summary": summary,
        }
        
        # Only add policy_analysis if it's not None or empty
        if policy_analysis:
            # If it's a dict, we can directly insert it
            summary_data["policy_analysis"] = policy_analysis
        
        # Only add news if it's not None or empty
        if news:
            # If it's a list of dictionaries, we can directly insert it
            summary_data["news"] = news
        
        print(f"Summary data prepared: {summary_data}")
        
        if existing_summary.data:
            # Update existing summary
            print(f"Updating existing summary for project_id: {project_id}")
            response = supabase.table("project_summary").update(summary_data).eq("project_id", project_id).execute()
            print(f"Update response status: {response.status_code if hasattr(response, 'status_code') else 'N/A'}")
            print(f"Updated summary for project with code: {project_code}")
        else:
            # Insert new summary
            print(f"Inserting new summary for project_id: {project_id}")
            response = supabase.table("project_summary").insert(summary_data).execute()
            print(f"Insert response status: {response.status_code if hasattr(response, 'status_code') else 'N/A'}")
            print(f"Inserted new summary for project with code: {project_code}")
        
        return True
    
    except Exception as e:
        print(f"Error updating project summary: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False
