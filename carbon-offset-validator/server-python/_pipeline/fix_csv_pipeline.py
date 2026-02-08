def upload_to_supabase_forestloss(self, project_id: str, table_name: str = "time_series_data"):
    """Upload forest loss time series to Supabase with project_id matching"""
    
    # Add project_id to all rows
    self.df_forestloss["project_id"] = project_id

    # Rename the column names to match the table schema
    self.df_forestloss.rename(columns={
        'year': 'timestamp',
        'deforestation_amount': 'deforestation_area'
    }, inplace=True)
    
    columns = ['project_id', 'timestamp', 'deforestation_area'] 
    df_upload = self.df_forestloss[columns]
    
    # Fill NA & Replace infinity values
    df_upload = df_upload.fillna(0)
    df_upload = df_upload.replace([np.inf, -np.inf], 0)
    
    # Round deforestation_area to 2 decimal places and ensure it's within database limits
    # The database field has precision 10, scale 2, so max value is 99,999,999.99
    df_upload['deforestation_area'] = df_upload['deforestation_area'].round(2)
    
    # Cap values to fit within database constraints (max 99,999,999.99)
    max_allowed = 99999999.99
    df_upload['deforestation_area'] = df_upload['deforestation_area'].clip(upper=max_allowed)
    
    try:
        # First, delete existing records for this project to avoid duplicates
        delete_response = (self.supabase.table(table_name)
                          .delete()
                          .eq("project_id", project_id)
                          .execute())
        
        print(f"Deleted {len(delete_response.data)} existing records")
        
        # Then insert all new records
        data = df_upload.to_dict(orient='records')
        
        # Insert in batches if there are many records
        batch_size = 100
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            response = self.supabase.table(table_name).insert(batch).execute()
            print(f"Inserted batch {i//batch_size + 1}/{(len(data) + batch_size - 1)//batch_size}")
        
        print(f"Successfully uploaded {len(data)} records for project {project_id}")
        return True
    
    except Exception as e:
        print(f"Error uploading to Supabase: {str(e)}")
        return None
