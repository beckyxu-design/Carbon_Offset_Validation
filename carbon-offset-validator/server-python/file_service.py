# file_service.py
import os
import uuid
from fastapi import UploadFile
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.core.node_parser import MarkdownNodeParser
from llama_index.readers.docling import DoclingReader

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
            
            # Create the index
            node_parser = MarkdownNodeParser()
            index = VectorStoreIndex.from_documents(
                documents=documents,
                transformations=[node_parser],
                embed_model=EMBED_MODEL,
            )
            
            # persist the index
            storage_dir = os.path.join(os.getcwd(), "storage", document_name + "_" + str(uuid.uuid4()))
            os.makedirs(storage_dir, exist_ok=True)
            index.storage_context.persist(persist_dir=storage_dir)
            
            return index
        
        # The finally block is guaranteed to execute no matter what happens in the try block—whether the code succeeds, raises an exception, or is interrupted.
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Validation error processing file: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
