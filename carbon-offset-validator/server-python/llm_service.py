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
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core import get_response_synthesizer

load_dotenv()
# API_URL = os.getenv("LLM_API_URL", "http://localhost:11434/api/generate")  # Default to Ollama API endpoint
API_URL =  "http://localhost:11434/api/generate"

async def extract_doc_basicInfo(index_pdd: VectorStoreIndex, query: str, project_code: str) -> Dict[str, Any]:
    """
    Extract basic project information from document using LLM with XML-formatted output
    Args:
        index_pdd: VectorStoreIndex of the document to extract information from
    Returns:
        Dictionary containing extracted project information
    """
    # context = f"\n\nAdditional context:\n{additional_context}" if additional_context else ""
    # Create a retriever
    # chroma_client = chromadb.PersistentClient(path="./chroma_db_new")
    # pdd_collection = chroma_client.get_or_create_collection("chroma_collection_pdd")
    # pdd_vector_store = ChromaVectorStore(chroma_collection=pdd_collection)
    # index_pdd = VectorStoreIndex.from_vector_store(vector_store=pdd_vector_store)
    retriever = index_pdd.as_retriever(similarity_top_k=10,  metadata_filters={"project_code": project_code})  # Retrieve top 3 most relevant chunks
    
    query = "Extract project code, name, description, location, coordinates, status, start date, end date, methodology, and size from the project design document."
    retrieved_nodes = retriever.retrieve(query)
    
    # Format retrieved documents into context
    retrieved_texts = "\n\n".join([node.text for node in retrieved_nodes])
    
    prompt = f"""
    You are a carbon offset project certifier analyzing a project design document. Extract the following project information in a structured format:

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

    Document to analyze: {retrieved_texts}
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
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-r1:7b",
        "prompt": prompt,
        "temperature": 0.2,
        "max_tokens": 2000,
        "stream": False # make this TRUE if you want word by word responses
    }
    
    response = requests.post(API_URL, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"LLM API error: {response.status_code} {response.text}")
    
    # Extract the content from Ollama response
    return response.json()["response"]

def parse_xml_response(response: str, root_tag: str) -> Dict[str, Any]:
    """
    Parse XML response from LLM to become a dictionary
    """
    # Extract XML part from response if needed
    xml_start = response.find(f"<{root_tag}>")
    xml_end = response.find(f"</{root_tag}>") + len(f"</{root_tag}>")
    
    if xml_start == -1 or xml_end == -1:
        raise Exception("Could not find XML in LLM response")
    
    xml_content = response[xml_start:xml_end]
    
    # Parse XML
    root = ET.fromstring(xml_content)
    
    # Convert to dictionary recursively
    def xml_to_dict(element):
        result = {}
        
        # Handle attributes
        if element.attrib:
            result["@attributes"] = element.attrib
            
        # Handle children
        for child in element:
            child_data = xml_to_dict(child)
            
            if child.tag in result:
                # If tag already exists, convert to list or append
                if not isinstance(result[child.tag], list):
                    result[child.tag] = [result[child.tag]]
                result[child.tag].append(child_data)
            else:
                result[child.tag] = child_data
                
        # Handle text content
        text = element.text.strip() if element.text else ""
        if text and not result:
            return text
        elif text:
            result["#text"] = text
            
        return result
    
    return xml_to_dict(root)