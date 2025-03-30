# file_service.py
# store_file(file: UploadFile) -> str: Store uploaded file and return file ID
# process_uploaded_file(file: UploadFile) -> str:

import os
import uuid
import tempfile
import nest_asyncio
import asyncio
from fastapi import UploadFile, HTTPException
from llama_index.core import VectorStoreIndex, StorageContext, Settings
from llama_index.core.node_parser import MarkdownNodeParser
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.extractors import TitleExtractor
from llama_index.core.text_splitter import SentenceSplitter
from llama_index.readers.docling import DoclingReader
from llama_index.embeddings import GeminiEmbedding # may change to huggingface instead
from llama_index.llms.gemini import Gemini
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from dotenv import load_dotenv
from pathlib import Path
from llama_index.core.schema import Document
from typing import Optional, List, Dict, Any, Union
import datetime

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

load_dotenv()

async def store_file(file: UploadFile) -> str:
    """
    Store uploaded file and return file ID
    """
    try:
        file_id = str(uuid.uuid4())
        upload_dir = os.path.join(os.getcwd(), "uploads")
        
        # Create directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")
        
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        return file_id
    
    except Exception as e:
        raise Exception(f'Error storing file: {str(e)}')

async def process_uploaded_file(file: UploadFile) -> str:
    """
    Extract text from uploaded file to become an index object in llamaindex
    """
    try:
        # Read the content of the file
        content = await file.read()                             
        # Get the file name and extension
        file_name = file.filename
        document_name = os.path.splitext(file_name)[0]
        file_extension = os.path.splitext(file_name)[1].lower()
        
        # Create a temporary file to store the content
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Use DoclingReader to load the data
            reader = DoclingReader()
            documents = reader.load_data(temp_file_path)
            
            if not documents:
                raise ValueError("No context extraced from file with llamaindex docling reader")
            
            # Add file name to metadata for each document
            for doc in documents:
                if doc.metadata is None:
                    doc.metadata = {}
                doc.metadata["file_name"] = file_name
            
            # Initialize Gemini models
            api_key = os.getenv("GEMINI_API_KEY", "default-key")
            embed_model = GeminiEmbedding(api_key=api_key)
            gemini_llm = Gemini(
                model_name="models/gemini-1.5-pro",
                api_key=api_key
            )
            
            # Set Gemini as the default LLM
            Settings.llm = gemini_llm
            Settings.embed_model = embed_model
            
            # Create ingestion pipeline with async-compatible transformations
            pipeline = IngestionPipeline(
                transformations=[
                    SentenceSplitter(chunk_size=500, chunk_overlap=50),
                    # Use the async version for TitleExtractor
                    TitleExtractor(llm=gemini_llm),
                    embed_model
                ]
            )
            
            # Use the async version of pipeline.run
            # Since we've applied nest_asyncio, we can use await here
            nodes = await pipeline.arun(documents=documents)
            
            # Initialize ChromaDB for vector storage
            collection_name = f"policy_{document_name}"
            chroma_client = chromadb.Client()
            
            # Get or create collection with get_or_create=True to avoid UniqueConstraintError
            try:
                chroma_collection = chroma_client.create_collection(
                    name=collection_name,
                    get_or_create=True
                )
                print(f"Using collection: {collection_name}")
            except Exception as e:
                print(f"Error with collection: {str(e)}")
                # Fallback to get collection if create with get_or_create fails
                chroma_collection = chroma_client.get_collection(collection_name)
                print(f"Retrieved existing collection: {collection_name}")
            
            # Create vector store
            vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
            
            # Create the index with the vector store
            index = VectorStoreIndex(
                nodes,
                embed_model=embed_model,
                vector_store=vector_store
            )

            # persist the index
            storage_dir = os.path.join(os.getcwd(), "storage", f"{document_name}_{uuid.uuid4()}")
            os.makedirs(storage_dir, exist_ok=True)
            index.storage_context.persist(persist_dir=storage_dir)
            
            return index
        
        # The finally block is guaranteed to execute no matter what happens in the try block—whether the code succeeds, raises an exception, or is interrupted.
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

async def process_document_to_collection(
    file_path: Union[str, Path], 
    collection_name: str = "carbon_offset_docs",
    embed_model_name: str = "local"
) -> Dict[str, Any]:
    """
    Process a document and store it in a ChromaDB collection.
    If the collection exists, adds to it. If not, creates a new collection.
    
    Args:
        file_path: Path to the document file
        collection_name: Name of the ChromaDB collection
        embed_model_name: Name of embedding model to use ('local' or 'gemini')
        
    Returns:
        Dict with processing results including success status and document info
    """
    try:
        # Ensure file_path is a Path object
        if isinstance(file_path, str):
            file_path = Path(file_path)
            
        # Get the file name for metadata
        file_name = file_path.name
        
        # Initialize reader
        reader = DoclingReader()
        
        # Set up LLM and embedding model
        if embed_model_name.lower() == "gemini":
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
                
            llm = Gemini(
                model_name="models/gemini-1.5-pro",
                api_key=api_key
            )
            embed_model = GeminiEmbedding(
                model_name="text-embedding-004", 
                api_key=api_key
            )
        else:
            # Use local models
            import torch
            device = "mps" if torch.backends.mps.is_available() else "cpu"
            
            from llama_index.llms.ollama import Ollama
            from llama_index.embeddings.huggingface import HuggingFaceEmbedding
            
            llm = Ollama(
                model="deepseek-r1:7b", 
                request_timeout=120.0
            )
            embed_model = HuggingFaceEmbedding(
                model_name="BAAI/bge-small-en-v1.5", 
                device=device,
                embed_batch_size=10  # Control resource usage
            )
        
        # Set global models for LlamaIndex
        Settings.llm = llm
        Settings.embed_model = embed_model
        
        # Initialize ChromaDB client
        chroma_client = chromadb.Client()
        
        # Check if collection exists
        collection_exists = False
        try:
            chroma_collection = chroma_client.get_collection(collection_name)
            collection_exists = True
            print(f"Using existing collection: {collection_name}")
        except Exception:
            # Collection doesn't exist, create it
            chroma_collection = chroma_client.create_collection(
                name=collection_name,
                get_or_create=True
            )
            print(f"Created new collection: {collection_name}")
            
        # Create vector store
        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
        
        # Load document using DoclingReader
        documents = reader.load_data(str(file_path))
        if not isinstance(documents, list):
            documents = [documents]
            
        # Check for empty documents
        if not documents:
            return {
                "success": False,
                "message": f"No content extracted from {file_name}",
                "collection_name": collection_name,
                "document_count": 0
            }
            
        # Add metadata to documents
        valid_docs = []
        for doc in documents:
            if not isinstance(doc, Document):
                continue
                
            if doc.metadata is None:
                doc.metadata = {}
                
            # Add file metadata
            doc.metadata.update({
                "file_name": file_name,
                "processed_at": str(datetime.datetime.now()),
                "source": "file_upload"
            })
            valid_docs.append(doc)
            
        if not valid_docs:
            return {
                "success": False,
                "message": f"No valid documents found in {file_name}",
                "collection_name": collection_name,
                "document_count": 0
            }
            
        # Create text processing pipeline
        pipeline = IngestionPipeline(
            transformations=[
                SentenceSplitter(chunk_size=500, chunk_overlap=50),
                TitleExtractor(llm=llm),
            ]
        )
        
        # Process documents into nodes
        nodes = await pipeline.arun(documents=valid_docs)
        
        if not nodes:
            return {
                "success": False,
                "message": f"No nodes generated for {file_name}",
                "collection_name": collection_name,
                "document_count": 0
            }
            
        # Create storage context with vector store
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # If adding to existing collection, check for duplicates
        if collection_exists and chroma_collection.count() > 0:
            # Check if this file was already processed
            try:
                # Note: This requires the metadata to contain the file_name field
                existing_items = chroma_collection.get(
                    where={"file_name": file_name},
                    limit=1
                )
                
                if existing_items and len(existing_items.get('ids', [])) > 0:
                    return {
                        "success": True,
                        "message": f"File {file_name} already exists in collection. Skipping.",
                        "collection_name": collection_name,
                        "document_count": chroma_collection.count(),
                        "already_exists": True
                    }
            except Exception as e:
                print(f"Warning: Error checking for duplicates: {str(e)}")
                # Continue processing even if duplicate check fails
        
        # For efficient handling, add nodes directly instead of recreating the index
        for node in nodes:
            # Add nodes to vector store
            storage_context.vector_store.add(
                nodes=[node],
                embed_model=embed_model
            )
            
        # Get final count
        final_count = chroma_collection.count()
            
        return {
            "success": True,
            "message": f"Successfully processed {file_name}",
            "collection_name": collection_name,
            "document_count": final_count,
            "nodes_added": len(nodes)
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in process_document_to_collection: {str(e)}\n{error_details}")
        
        return {
            "success": False,
            "message": f"Error processing document: {str(e)}",
            "error_details": error_details,
            "collection_name": collection_name
        }

# need a function to check if VCR policy docs index exists, and if Country level policy exists
# if not, process the VCR policy docs 