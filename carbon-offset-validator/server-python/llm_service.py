# llm_service.py
import os
import requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional

load_dotenv()
API_URL = os.getenv("LLM_API_URL")  # Set to your preferred LLM API

async def analyze_document(document_text: str, additional_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Extract basic project information from document using LLM with XML-formatted output
    """
    context = f"\n\nAdditional context:\n{additional_context}" if additional_context else ""
    
    prompt = f"""
    You are a carbon offset project validator analyzing a project document. Extract the following project information in a structured format:

    <instructions>
    Extract basic project information from the document and format it in XML.
    Be specific and accurate. If information is not available, indicate "Not specified".
    </instructions>

    <output_format>
    <project_info>
      <project_code>CODE</project_code>
      <name>PROJECT NAME</name>
      <description>BRIEF DESCRIPTION</description>
      <location>LOCATION</location>
      <coordinates>[LATITUDE, LONGITUDE]</coordinates>
      <status>STATUS</status>
      <start_date>START DATE</start_date>
      <end_date>END DATE</end_date>
      <methodology>METHODOLOGY</methodology>
      <size>SIZE</size>
    </project_info>
    </output_format>

    Document to analyze: {document_text}{context}
    """
    
    # Call your preferred LLM API
    response = await call_llm_api(prompt)
    
    # Parse XML response
    try:
        parsed_data = parse_xml_response(response, "project_info")
        return parsed_data
    except Exception as e:
        print(f"Error parsing LLM response: {e}")
        raise Exception(f"Failed to parse LLM output: {e}")

async def analyze_risks(document_text: str, policy_documents: str) -> List[Dict[str, Any]]:
    """
    Analyze document risks compared to policy documents
    """
    prompt = f"""
    You are analyzing the risk profile of a carbon offset project by comparing it with established carbon offset policy documents.

    <instructions>
    Review the project document and compare it against carbon offset policy standards. 
    Identify potential risks across different categories.
    Assign a risk score (0-100), impact level (Low, Medium, High), and likelihood (Unlikely, Possible, Likely).
    Provide a brief description for each risk.
    </instructions>

    <output_format>
    <risk_metrics>
      <risk_category name="Permanence">
        <score>SCORE_VALUE</score>
        <impact>IMPACT_LEVEL</impact>
        <likelihood>LIKELIHOOD</likelihood>
        <description>RISK_DESCRIPTION</description>
      </risk_category>
      <!-- Additional risk categories -->
    </risk_metrics>
    </output_format>

    Project document: {document_text}
    Reference policy documents: {policy_documents}
    """
    
    response = await call_llm_api(prompt)
    
    # Parse XML response
    try:
        xml_root = ET.fromstring(response)
        risk_metrics = []
        
        for risk_category in xml_root.findall(".//risk_category"):
            risk_metrics.append({
                "category": risk_category.get("name"),
                "score": int(risk_category.find("score").text),
                "impact": risk_category.find("impact").text,
                "likelihood": risk_category.find("likelihood").text,
                "description": risk_category.find("description").text
            })
        
        return risk_metrics
    except Exception as e:
        print(f"Error parsing risk metrics: {e}")
        raise Exception(f"Failed to parse risk metrics: {e}")

async def generate_recommendations(document_text: str, regional_policies: str) -> Dict[str, Any]:
    """
    Generate recommendations and analysis data based on regional policies
    """
    prompt = f"""
    You are evaluating a carbon offset project's compliance with country and regional level policy requirements.

    <instructions>
    Analyze the project document against country and regional policy documents.
    Determine compliance levels and identify any regional-specific risks.
    Generate deforestation and emissions data based on the available information.
    Create land use distribution data suitable for a pie chart visualization.
    </instructions>

    <output_format>
    <summary>
      <overall_summary>COMPREHENSIVE_SUMMARY</overall_summary>
      <recommendations>
        <!-- Recommendations -->
      </recommendations>
      <additional_insights>ADDITIONAL_INSIGHTS</additional_insights>
    </summary>

    <time_series_data>
      <!-- Time series data -->
    </time_series_data>

    <pie_chart_data>
      <!-- Pie chart data -->
    </pie_chart_data>
    </output_format>

    Project document: {document_text}
    Country/regional policies: {regional_policies}
    """
    
    response = await call_llm_api(prompt)
    
    # Parse XML response (implementation omitted for brevity)
    # Would need to extract and format all the data elements

    # Sample return structure
    return {
        "summary": {
            "overall_summary": "Summary text...",
            "recommendations": [
                {"action": "Action 1", "priority": "high"},
                {"action": "Action 2", "priority": "medium"}
            ],
            "additional_insights": "Additional insights..."
        },
        "deforestation_data": [
            {"year": 2019, "hectares": 150},
            {"year": 2020, "hectares": 130},
            {"year": 2021, "hectares": 100}
        ],
        "emissions_data": [
            {"year": 2019, "tonnes": 5000},
            {"year": 2020, "tonnes": 4500},
            {"year": 2021, "tonnes": 4000}
        ],
        "pie_chart_data": [
            {"category": "Forest", "value": 45},
            {"category": "Agriculture", "value": 30},
            {"category": "Urban", "value": 25}
        ]
    }

async def call_llm_api(prompt: str) -> str:
    """
    Call LLM API with the provided prompt
    """
    # Replace with your preferred LLM API (OpenAI, Anthropic, etc.)
    headers = {
        "Authorization": f"Bearer {os.getenv('LLM_API_KEY')}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4",  # Replace with your model
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 2000
    }
    
    response = requests.post(API_URL, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"LLM API error: {response.status_code} {response.text}")
    
    # Extract the content from response (adjust based on your LLM API)
    return response.json()["choices"][0]["message"]["content"]

def parse_xml_response(response: str, root_tag: str) -> Dict[str, Any]:
    """
    Parse XML response from LLM
    """
    # Extract XML part from response if needed
    xml_start = response.find(f"<{root_tag}>")
    xml_end = response.find(f"</{root_tag}>") + len(f"</{root_tag}>")
    
    if xml_start == -1 or xml_end == -1:
        raise Exception("Could not find XML in LLM response")
    
    xml_content = response[xml_start:xml_end]
    
    # Parse XML
    root = ET.fromstring(xml_content)
    
    # Convert to dictionary (implementation details omitted)
    # This would be a recursive function to convert XML to dict
    
    # Return parsed data
    return {"parsed_data": "Would be XML converted to dict"}