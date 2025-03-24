# file_service.py
# store_file(file: UploadFile) -> str: Store uploaded file and return file ID
# process_uploaded_file(file: UploadFile) -> str:

import os
import uuid
from fastapi import UploadFile
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.core.node_parser import MarkdownNodeParser
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.extractors import TitleExtractor
from llama_index.core.text_splitter import SentenceSplitter
from llama_index.readers.docling import DoclingReader
from llama_index.embeddings import GeminiEmbedding # may change to huggingface instead


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
            
            # create ingestion pipeline to define splitter and embed model 
            embed_model = embed_model or GeminiEmbedding(api_key=os.getenv("GEMINI_API_KEY", "default-key"))
            pipeline = IngestionPipeline(
                transformations=[
                    SentenceSplitter(chunk_size=500, chunk_overlap=50),  # Match your project chunking
                    TitleExtractor(),
                    embed_model
                ]
            )
            
            # Create the index
            # node_parser = MarkdownNodeParser()
            nodes = await pipeline.run(documents=documents)
            index = VectorStoreIndex.from_vector_store(
                nodes,
                # transformations=[node_parser],
                embed_model=embed_model,
            )

            # persist the index
            storage_dir = os.path.join(os.getcwd(), "storage", f"{document_name}_{uuid.uuid4()}")
            os.makedirs(storage_dir, exist_ok=True)
            index.storage_context.persist(persist_dir=storage_dir)
            # to load the storage 
            # storage_context = StorageContext.from_defaults(persist_dir="./policy_storage")
            # policy_index = load_index_from_storage(storage_context)
            
            return index
        
        # The finally block is guaranteed to execute no matter what happens in the try block—whether the code succeeds, raises an exception, or is interrupted.
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Validation error processing file: {str(ve)}")
    except OSError as ose:
        raise HTTPException(status_code=500, detail="File system error occurred")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

# need a function to check if VCR policy docs index exists, and if Country level policy exists
# if not, process the VCR policy docs 