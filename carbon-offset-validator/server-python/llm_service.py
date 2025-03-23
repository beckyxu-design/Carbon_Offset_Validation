# llm_service.py
# extract_doc_basicInfo(document_index, additional_context): Extract basic project information from document using LLM with XML-formatted output
# analyze_projectdesign_risks(document_index, poolicy_index): Analyze document risks compared to policy documents
# analyze_policy_risks(document_index, regional_policies_index): Generate recommendations and analysis data based on regional policies
# call_llm_api(prompt): Call LLM API with the provided prompt
# parse_xml_response(): parse xml response
    # need to implement this shit:
        # Convert to dictionary (implementation details omitted)
        # This would be a recursive function to convert XML to dict
        

import os
import requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional

load_dotenv()
API_URL = os.getenv("LLM_API_URL")  # Set to your preferred LLM API

async def extract_doc_basicInfo(document_index: str, additional_context: Optional[str] = None) -> Dict[str, Any]:
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

    Document to analyze: {document_index}{context}
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

async def analyze_projectdesign_risks(document_index: index, policy_index: index) -> List[Dict[str, Any]]:
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

    Project document: {document_index}
    Reference policy documents: {policy_index}
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

async def analyze_policy_risks(document_index: index, regional_policies_index: index) -> Dict[str, Any]:
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
        <recommendation>
          <action>ACTION_DESCRIPTION</action>
          <priority>PRIORITY_LEVEL</priority>
        </recommendation>
        <!-- Additional recommendations -->
      </recommendations>
      <additional_insights>ADDITIONAL_INSIGHTS</additional_insights>
    </summary>

    Project document: {document_index}
    Country/regional policies: {regional_policies_index}
    """
    
    response = await call_llm_api(prompt)
    
    # Parse XML response
    try:
        xml_root = ET.fromstring(response)
        summary_element = xml_root.find(".//summary")
        
        recommendations = []
        for rec in summary_element.findall(".//recommendation"):
            recommendations.append({
                "action": rec.find("action").text,
                "priority": rec.find("priority").text
            })
        
        return {
            "summary": {
                "overall_summary": summary_element.find("overall_summary").text,
                "recommendations": recommendations,
                "additional_insights": summary_element.find("additional_insights").text
            }
        }
    except Exception as e:
        print(f"Error parsing recommendations: {e}")
        raise Exception(f"Failed to parse recommendations: {e}")

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
    # need to implement this shit
    # Return parsed data
    return {"parsed_data": "Would be XML converted to dict"}