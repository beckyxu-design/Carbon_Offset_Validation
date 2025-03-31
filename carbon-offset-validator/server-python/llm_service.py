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
import google.generativeai as genai

load_dotenv()
# API_URL =  "http://localhost:11434/api/generate" # if local model 
API_URL = os.getenv("LLM_API_URL", "http://localhost:11434/api/generate") 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

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
    retriever = index_pdd.as_retriever(similarity_top_k=20,  metadata_filters={"project_code": project_code})  # Retrieve top 10 most relevant chunks
    
    query = "Please extract the following details from the provided voluntary carbon market project design document: Project name; Brief description of the project;Location of the project (e.g., country, region);Geographic coordinates (latitude and longitude);Current project status (e.g., under development, operational, completed);Project start date;Project end date;Project methodology (e.g., specific carbon offset standard or protocol used);Project size (e.g., area in hectares or total carbon credits generated)"
    retrieved_nodes = retriever.retrieve(query)
    
    # Format retrieved documents into context
    retrieved_texts = "\n\n".join([node.text for node in retrieved_nodes])
    # print(retrieved_texts)
    prompt = f"""
    Please extract the following details from the provided voluntary carbon market project design document: Project name; Brief description of the project;Location of the project (e.g., country, region);Geographic coordinates (latitude and longitude);Current project status (e.g., under development, operational, completed);Project start date;Project end date;Project methodology (e.g., specific carbon offset standard or protocol used);Project size (e.g., area in hectares or total carbon credits generated)

    ### Instructions ###
    - Extract these exact fields from the document: project name, description, location, coordinates, status, start date, end date, methodology, size.
    - Use the *exact* XML tag names as shown in the Output Format: <project_name>, <description>, <location>, <coordinates>, <status>, <start_date>, <end_date>, <methodology>, <size>.
    - Wrap the output in the root tag `<project_info>`.
    - Output *ONLY* the XML structure—do not include any additional text, comments, `<think>` tags, markdown (```xml```), or explanations before or after the XML.
    - Keep <project_code> as it is 
    - If a field is missing or not found, use "Not specified" as the value. Infer project name if project name is not found.
    - For coordinates, format as "[latitude, longitude]" (e.g., "[40.7128, -74.0060]").
    - Ensure the XML is well-formed and matches the Output Format exactly in structure and tag names.

    ### Output Format ###
    <project_info>
      <project_code>{project_code}<project_code>
      <project_name>PROJECT TITLE</project_name>
      <description>BRIEF DESCRIPTION</description>
      <location>LOCATION</location>
      <coordinates>[LATITUDE, LONGITUDE]</coordinates>
      <status>STATUS</status>
      <start_date>START DATE</start_date>
      <end_date>END DATE</end_date>
      <methodology>METHODOLOGY</methodology>
      <size>SIZE</size>
    </project_info>

    ### Document to Analyze ###
    {retrieved_texts}

    ### Final Directive ###
    Return ONLY the XML below, using the exact tag names from the Output Format, with no deviations or additional content.
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

async def analyze_projectdesign_risks(project_code: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Analyze project risks by comparing PDD against policy documents, returning XML-structured results.

    Args:
        project_code: project code 
        top_k: Number of top documents to retrieve.

    Returns:
        List of dictionaries containing risk metrics per query.
    """
    # Setup Chroma connections
    chroma_client = chromadb.PersistentClient(path="./chroma_db_new")
    pdd_collection = chroma_client.get_or_create_collection("pdd")
    policy_collection = chroma_client.get_or_create_collection("vcm_policy")

    # Create vector stores and indexes
    from llama_index.vector_stores.chroma import ChromaVectorStore
    pdd_vector_store = ChromaVectorStore(chroma_collection=pdd_collection)
    policy_vector_store = ChromaVectorStore(chroma_collection=policy_collection)
    pdd_index = VectorStoreIndex.from_vector_store(vector_store=pdd_vector_store)
    policy_index = VectorStoreIndex.from_vector_store(vector_store=policy_vector_store)

    # Custom dual retriever
    class DualRetriever(BaseRetriever):
        def __init__(self, pdd_retriever, policy_retriever):
            self.pdd_retriever = pdd_retriever
            self.policy_retriever = policy_retriever
            super().__init__()

        def _retrieve(self, query, **kwargs):
            pdd_nodes = self.pdd_retriever.retrieve(query)
            policy_nodes = self.policy_retriever.retrieve(query)
            # Add metadata to nodes
            for node in pdd_nodes:
                node.node.metadata["source"] = "project_design_document"
            for node in policy_nodes:
                node.node.metadata["source"] = "industry_standard"
            # Return a single list combining both sets of nodes
            return pdd_nodes + policy_nodes

    pdd_retriever = pdd_index.as_retriever(similarity_top_k=top_k, metadata_filters={"project_code": project_code})
    policy_retriever = policy_index.as_retriever(similarity_top_k=top_k)
    dual_retriever = DualRetriever(pdd_retriever, policy_retriever)

    # Custom prompt for XML output
    risk_template_str = (
        "Analyze the risk profile of a carbon offset project by comparing its project design document (PDD) "
        "with established carbon offset policy documents for the aspect: {query}.\n\n"
        "<instructions>\n"
        "- Review the PDD content: {pdd_texts}\n"
        "- Compare it against policy standards: {policy_texts}\n"
        "- Identify potential risks across different categories.\n"
        "- Assign a risk score (0-100), impact level (Low, Medium, High), and likelihood (Unlikely, Possible, Likely).\n"
        "- Provide a brief description for each risk.\n"
        "- Use the *exact* XML tag names as shown in the output_format.\n"
        "- Output *ONLY* the XML structure—do not include additional text, comments, `<think>` tags, markdown, or explanations.\n"
        "</instructions>\n\n"
        "<output_format>\n"
        "<risk_metrics>\n"
        "  <risk_category name=\"CATEGORY\">\n"
        "    <score>SCORE_VALUE</score>\n"
        "    <impact>IMPACT_LEVEL</impact>\n"
        "    <likelihood>LIKELIHOOD</likelihood>\n"
        "    <description>RISK_DESCRIPTION</description>\n"
        "  </risk_category>\n"
        "</risk_metrics>\n"
        "</output_format>"
    )
    risk_template = PromptTemplate(risk_template_str)

    all_risk_metrics = []
    
    project_query_list = ["analyze the risk category: <Additionality> - How does the project demonstrate that it is additional, and what evidence supports this claim? Additionality ensures that the emissions reductions or removals would not have occurred without carbon offset funding. Look for evidence such as financial barriers, technological challenges, or policy gaps that the project overcomes.",
                      "analyze the risk category: <Baseline Scenario> - What is the baseline scenario for the project, and how was it established? The baseline scenario represents the emissions that would have occurred without the project. Check if it’s based on credible data, conservative assumptions, and an appropriate methodology for the project type.",
                      "analyze the risk category: <Permanence> - For projects involving carbon sequestration, what measures are in place to ensure the permanence of the sequestered carbon? For projects like reforestation or soil carbon storage, permanence is critical. Ask about safeguards like buffer pools, long-term management plans, or insurance against reversals (e.g., due to fires or deforestation).",
                      "analyze the risk category: <Leakage> - Has the project assessed potential leakage, and how is it accounted for in the emissions reductions calculations? Leakage occurs when emissions are displaced elsewhere (e.g., deforestation shifting to another area). Verify if a leakage assessment was conducted and if mitigation measures are included.",
                      "analyze the risk category: <Monitoring and Verification> - What is the monitoring plan, and how will the project's emissions reductions be verified by a third party? A robust monitoring plan should detail what data will be collected, how, and how often. Confirmation of third-party verification ensures accuracy and independence."
                     ]
    
    # Process each query using risk_query_engine
    for query in project_query_list:
        print(f"Analyzing: {query}")
        # Retrieve nodes using the dual retriever
        nodes = dual_retriever.retrieve(query)
        # Separate nodes by source for context
        pdd_nodes = [node for node in nodes if node.node.metadata.get("source") == "project_design_document"]
        policy_nodes = [node for node in nodes if node.node.metadata.get("source") == "industry_standard"]
        # Combine retrieved content into context
        pdd_context_str = "\n\n".join([node.node.get_content() for node in pdd_nodes])
        policy_context_str = "\n\n".join([node.node.get_content() for node in policy_nodes])
        # Format the full prompt with context
        formatted_prompt = risk_template.format(
            query=query,
            project_code=project_code,
            pdd_texts=pdd_context_str,
            policy_texts=policy_context_str
        )
        # Call the LLM directly
        response_text = call_llm_api(formatted_prompt)  # Assuming this function is defined elsewhere
        try:
            # Parse XML using the new function
            parsed_response = parse_xml_response(response_text, "risk_metrics")
            risk_metrics = []
            
            # Handle case where risk_category is a single dict or a list
            risk_categories = parsed_response.get("risk_category")
            if not risk_categories:
                print(f"No risk categories found for '{query}'")
                continue
            if isinstance(risk_categories, dict):
                risk_categories = [risk_categories]
                
            for category in risk_categories:
                risk_metrics.append({
                    "category": category["@attributes"]["name"],
                    "score": int(category["score"]),
                    "impact": category["impact"],
                    "likelihood": category["likelihood"],
                    "description": category["description"],
                    "query": query
                })
            all_risk_metrics.extend(risk_metrics)
            print(f"Risk metrics for '{query}': {response_text}")
        except Exception as e:
            print(f"Error parsing risk metrics for '{query}': {e}")
            raise Exception(f"Failed to parse risk metrics: {e}")

    return all_risk_metrics

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
    # headers = {
    #     "Content-Type": "application/json"
    # }
    
    # payload = {
    #     "model": "deepseek-r1:7b",
    #     "prompt": prompt,
    #     "temperature": 0.2,
    #     "max_tokens": 2000,
    #     "stream": False # make this TRUE if you want word by word responses
    # }
    
    # response = requests.post(API_URL, headers=headers, json=payload)
    
    # if response.status_code != 200:
    #     raise Exception(f"LLM API error: {response.status_code} {response.text}")
    
    # # Extract the content from Ollama response
    # return response.json()["response"]
    try:
        # Initialize the Gemini model (adjust model name as needed)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",  # Use "gemini-1.5-flash" or another available model
            generation_config={
                "temperature": 0.1,        # Controls randomness (0.0 to 1.0)
                "max_output_tokens": 50000, # Max tokens in response
            }
        )

        # Generate content with the prompt
        response = model.generate_content(prompt)

        # Check if response was blocked or empty
        if not response.text:
            raise Exception("Gemini API returned no valid response")

        return response.text

    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

def parse_xml_response(response: str, root_tag: str) -> Dict[str, Any]:
    """
    Parse XML response from LLM into a dictionary, handling potential extra text.
    
    Args:
        response (str): Raw LLM response containing XML
        root_tag (str): Expected root tag (e.g., "project_info")
    
    Returns:
        Dict[str, Any]: Parsed XML as a dictionary
    """
    # Try to find any XML-like structure if the exact root_tag isn't found
    xml_start = response.find(f"<{root_tag}>")
    xml_end = response.rfind(f"</{root_tag}>")
    
    if xml_start == -1 or xml_end == -1:
        # Fallback: Look for any XML root tag (e.g., <information>)
        possible_start = response.find("<")
        possible_end = response.rfind(">")
        if possible_start != -1 and possible_end != -1 and possible_end > possible_start:
            xml_content = response[possible_start:possible_end + 1]
        else:
            raise Exception("Could not find XML in LLM response")
    else:
        xml_content = response[xml_start:xml_end + len(f"</{root_tag}>")]

    # Parse XML
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        raise Exception(f"Invalid XML in LLM response: {e}")

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

    parsed_dict = xml_to_dict(root)
    
    # If root tag doesn't match expected, warn but proceed
    if root.tag != root_tag:
        print(f"Warning: Expected root tag '{root_tag}', found '{root.tag}'. Proceeding with parsed data.")
    
    return parsed_dict

def llm_setting(name = "Local"):
    if name == "Gemini": 
        from llama_index.llms.gemini import Gemini
        from llama_index.embeddings.gemini import GeminiEmbedding
        from llama_index.embeddings.huggingface import HuggingFaceEmbedding
        api_key = os.getenv("GEMINI_API_KEY")
        # define embedding model
        embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5", 
                                           device=device,
                                           embed_batch_size=10)
        llm = Gemini(model_name="models/gemini-1.5-flash", temperature=0.1, max_tokens=50000, api_key=api_key)
    
    # if default -> use local model with HF embedding
    else:
        # api_key = os.getenv("HF_API_KEY")
        # define embedding model
        from llama_index.llms.ollama import Ollama
        from llama_index.embeddings.huggingface import HuggingFaceEmbedding
        embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5", 
                                           device=device,
                                           embed_batch_size=10)
        
        llm = Ollama(model="deepseek-r1:7b", 
                     request_timeout=120.0)
    return llm, embed_model