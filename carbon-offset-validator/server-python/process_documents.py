"""
Document Processing Script for Carbon Offset Validation

This script processes policy documents and adds them to a vector database for retrieval.
It handles multiple documents, adds file names to metadata, and creates a searchable index.
"""

import os
import uuid
from pathlib import Path
from typing import List, Optional

from llama_index.core import VectorStoreIndex, Document, StorageContext, Settings
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.extractors import TitleExtractor
from llama_index.core.text_splitter import SentenceSplitter
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.gemini import Gemini
from docling import DoclingReader

import chromadb
from dotenv import load_dotenv

load_dotenv()

def get_file_paths(folder_path: str) -> List[str]:
    """Get all file paths in a folder recursively."""
    file_paths = []
    folder = Path(folder_path)
    
    if not folder.exists():
        raise ValueError(f"Folder path does not exist: {folder_path}")
        
    for path in folder.glob('**/*'):
        if path.is_file():
            file_paths.append(str(path))
    
    return file_paths

def process_documents(folder_path: str, collection_name: str = "policy_vcm") -> VectorStoreIndex:
    """
    Process all documents in a folder and add them to a ChromaDB collection.
    
    Args:
        folder_path: Path to the folder containing documents
        collection_name: Name of the ChromaDB collection to use
        
    Returns:
        VectorStoreIndex: The created index
    """
    # Initialize ChromaDB
    chroma_client = chromadb.Client()
    
    # Get or create collection
    try:
        chroma_collection = chroma_client.get_collection(collection_name)
        print(f"Using existing collection: {collection_name}")
    except:
        chroma_collection = chroma_client.create_collection(collection_name)
        print(f"Created new collection: {collection_name}")
    
    # Create vector store
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # Define embedding model
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    embed_model = GeminiEmbedding(
        model_name="models/embedding-001",
        api_key=api_key
    )
    
    # Set Gemini as the default LLM
    gemini_llm = Gemini(
        model_name="models/gemini-1.5-pro",
        api_key=api_key
    )
    Settings.llm = gemini_llm
    Settings.embed_model = embed_model
    
    # Get all file paths
    file_paths = get_file_paths(folder_path)
    print(f"Found {len(file_paths)} files to process")
    
    # Use DoclingReader to load the data
    reader = DoclingReader()
    all_documents = []
    
    # Process each file and add file name to metadata
    for file_path in file_paths:
        print(f"Processing: {file_path}")
        file_name = os.path.basename(file_path)
        
        try:
            documents = reader.load_data(file_path)
            
            # Add file name to metadata for each document
            for doc in documents:
                if doc.metadata is None:
                    doc.metadata = {}
                doc.metadata["file_name"] = file_name
                doc.metadata["source_path"] = file_path
            
            all_documents.extend(documents)
            print(f"  Added {len(documents)} document chunks from {file_name}")
        except Exception as e:
            print(f"  Error processing {file_name}: {str(e)}")
    
    if not all_documents:
        raise ValueError("No documents were successfully processed")
    
    # Create ingestion pipeline with explicit LLM for TitleExtractor
    pipeline = IngestionPipeline(
        transformations=[
            SentenceSplitter(chunk_size=500, chunk_overlap=50),
            TitleExtractor(llm=gemini_llm),  # Explicitly pass Gemini LLM
            embed_model
        ]
    )
    
    # Process all documents
    print("Running ingestion pipeline...")
    nodes = pipeline.run(documents=all_documents)
    
    # Create the index
    print("Creating vector index...")
    index = VectorStoreIndex(
        nodes,
        embed_model=embed_model,
        vector_store=vector_store
    )
    
    # Optionally persist the index
    storage_dir = os.path.join(os.getcwd(), "storage", f"{collection_name}_{uuid.uuid4()}")
    os.makedirs(storage_dir, exist_ok=True)
    index.storage_context.persist(persist_dir=storage_dir)
    print(f"Index persisted to: {storage_dir}")
    
    return index

def query_index(collection_name: str = "policy_vcm", query_text: str = "What are the key carbon offset policies?"):
    """
    Query the existing index
    
    Args:
        collection_name: Name of the ChromaDB collection to query
        query_text: The query text
    """
    # Initialize ChromaDB and get collection
    chroma_client = chromadb.Client()
    
    try:
        chroma_collection = chroma_client.get_collection(collection_name)
    except:
        raise ValueError(f"Collection {collection_name} not found")
    
    # Create vector store
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # Define embedding model
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    embed_model = GeminiEmbedding(
        model_name="models/embedding-001",
        api_key=api_key
    )
    
    # Set Gemini as the default LLM
    gemini_llm = Gemini(
        model_name="models/gemini-1.5-pro",
        api_key=api_key
    )
    Settings.llm = gemini_llm
    Settings.embed_model = embed_model
    
    # Load index from vector store
    index = VectorStoreIndex.from_vector_store(
        vector_store=vector_store,
        embed_model=embed_model
    )
    
    # Create query engine
    query_engine = index.as_query_engine()
    
    # Execute query
    response = query_engine.query(query_text)
    
    return response

if __name__ == "__main__":
    # Example usage
    import argparse
    
    parser = argparse.ArgumentParser(description="Process documents for vector search")
    parser.add_argument("--folder", type=str, help="Folder path containing documents to process")
    parser.add_argument("--collection", type=str, default="policy_vcm", help="ChromaDB collection name")
    parser.add_argument("--query", type=str, help="Query to run against the index")
    
    args = parser.parse_args()
    
    if args.folder:
        # Process documents
        process_documents(args.folder, args.collection)
    
    if args.query:
        # Query the index
        response = query_index(args.collection, args.query)
        print("\nQuery Results:")
        print(f"Query: {args.query}")
        print(f"Response: {response}")
