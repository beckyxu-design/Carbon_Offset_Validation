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

# this funciton is outdated
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
