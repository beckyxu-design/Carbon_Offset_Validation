"""
Upload data from index_process.ipynb to Supabase database.
This script provides functions to upload different types of data (project info, risk metrics, etc.)
to the appropriate Supabase tables.
"""

import os
import json
from supabase import create_client
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "https://ssndcivabflkcfqwaapj.supabase.co")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

def upload_project_info(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload basic project information to the projects table.
    
    Args:
        project_data: Dictionary containing project information
            (name, description, location, coordinates, status, dates)
    
    Returns:
        Response from Supabase
    """
    # Extract relevant fields for the projects table
    project_record = {
        "name": project_data.get("name"),
        "description": project_data.get("description"),
        "location": project_data.get("location"),
        "coordinates": project_data.get("coordinates"),
        "status": project_data.get("status"),
        "start_date": project_data.get("start_date"),
        "end_date": project_data.get("end_date"),
        "project_code": project_data.get("project_code")
    }
    
    # Insert into projects table
    response = supabase.table("projects").insert(project_record).execute()
    
    print(f"Uploaded project info for: {project_data.get('name')}")
    return response.data

def upload_project_summary(project_id: str, summary_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload project summary and analysis to the project_summary table.
    
    Args:
        project_id: ID of the project in the projects table
        summary_data: Dictionary containing summary information
    
    Returns:
        Response from Supabase
    """
    summary_record = {
        "project_id": project_id,
        "summary": summary_data.get("summary"),
        "analysis": summary_data.get("analysis"),
        "recommendations": summary_data.get("recommendations")
    }
    
    # Insert into project_summary table
    response = supabase.table("project_summary").insert(summary_record).execute()
    
    print(f"Uploaded project summary for project ID: {project_id}")
    return response.data

def upload_risk_metrics(project_id: str, risk_metrics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Upload risk assessment metrics to the risk_summary_metrics table.
    
    Args:
        project_id: ID of the project in the projects table
        risk_metrics: List of dictionaries containing risk metrics
            (category, score, impact, likelihood, description)
    
    Returns:
        Response from Supabase
    """
    # Prepare records for insertion
    risk_records = []
    for metric in risk_metrics:
        risk_record = {
            "project_id": project_id,
            "category": metric.get("category"),
            "score": metric.get("score"),
            "impact": metric.get("impact"),
            "likelihood": metric.get("likelihood"),
            "description": metric.get("description")
        }
        risk_records.append(risk_record)
    
    # Insert into risk_summary_metrics table
    response = supabase.table("risk_summary_metrics").insert(risk_records).execute()
    
    print(f"Uploaded {len(risk_metrics)} risk metrics for project ID: {project_id}")
    return response.data

# TODO: this may need to change to insert based on both project_id and timestamp
def upload_time_series_data(project_id: str, time_series_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Upload time series data to the time_series_data table.
    
    Args:
        project_id: ID of the project in the projects table
        time_series_data: List of dictionaries containing time series data
            (timestamp, value, category)
    
    Returns:
        Response from Supabase
    """
    # Prepare records for insertion
    ts_records = []
    for data_point in time_series_data:
        ts_record = {
            "project_id": project_id,
            "timestamp": data_point.get("timestamp"),
            "value": data_point.get("value"),
            "category": data_point.get("category")
        }
        ts_records.append(ts_record)
    
    # Insert into time_series_data table
    response = supabase.table("time_series_data").insert(ts_records).execute()
    
    print(f"Uploaded {len(time_series_data)} time series data points for project ID: {project_id}")
    return response.data

def upload_pie_chart_data(project_id: str, pie_chart_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Upload land use distribution data to the pie_chart_data table.
    
    Args:
        project_id: ID of the project in the projects table
        pie_chart_data: List of dictionaries containing pie chart data
            (category, value, label)
    
    Returns:
        Response from Supabase
    """
    # Prepare records for insertion
    pie_records = []
    for data_point in pie_chart_data:
        pie_record = {
            "project_id": project_id,
            "category": data_point.get("category"),
            "value": data_point.get("value"),
            "label": data_point.get("label")
        }
        pie_records.append(pie_record)
    
    # Insert into pie_chart_data table
    response = supabase.table("pie_chart_data").insert(pie_records).execute()
    
    print(f"Uploaded {len(pie_chart_data)} pie chart data points for project ID: {project_id}")
    return response.data

def upload_geo_data(project_id: str, geo_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload GeoJSON data to the geo_data table.
    
    Args:
        project_id: ID of the project in the projects table
        geo_data: Dictionary containing GeoJSON data
    
    Returns:
        Response from Supabase
    """
    geo_record = {
        "project_id": project_id,
        "geojson": json.dumps(geo_data)  # Convert GeoJSON to string for storage
    }
    
    # Insert into geo_data table
    response = supabase.table("geo_data").insert(geo_record).execute()
    
    print(f"Uploaded GeoJSON data for project ID: {project_id}")
    return response.data

# Example usage in your notebook:
"""
# After running your analysis in index_process.ipynb:

# 1. Import the upload functions
from upload_to_supabase import (
    upload_project_info, 
    upload_project_summary, 
    upload_risk_metrics,
    upload_time_series_data,
    upload_pie_chart_data,
    upload_geo_data
)

# 2. Upload project information first to get the project_id
project_data = extract_doc_basicInfo(project_code)
project_response = upload_project_info(project_data)
project_id = project_response[0]['id']  # Get the ID from the response

# 3. Upload risk metrics
risk_metrics = analyze_project_risks(project_code)
upload_risk_metrics(project_id, risk_metrics)

# 4. Upload other data as needed
# ...
"""
