class CSVtoSupabasePipeline:
    def __init__(self, project_code: str):
        """Initialize the pipeline with Supabase credentials"""
        self.supabase: Client = client
        self.project_code = project_code 
        self.landuse_file_path = f'{DIRECTORY}gee_csv/landclass_moveAvg_2016to2025_res10_{self.project_code}.csv'
        self.forestloss_file_path = f'{DIRECTORY}gee_csv/forestloss_gfw_res30_{self.project_code}.csv'
        self.df_landuse = pd.read_csv(self.landuse_file_path)
        self.df_forestloss = pd.read_csv(self.forestloss_file_path)
        
    def get_project_id(self) -> str:
        """Retrieve project_id from projects table using project_code"""
        try:
            response = (self.supabase.table("projects")
                       .select("id")
                       .eq("project_code", self.project_code)
                       .execute())
            if response.data and len(response.data) > 0:
                return response.data[0]["id"]
            print(f"No project found with project_code: {self.project_code}")
            return None
        except Exception as e:
            print(f"Error retrieving project_id: {str(e)}")
            return None
        
    def upload_to_supabase_landuse(self, project_id: str, table_name: str = "landuse_time_series"):
        """Upload land use time series to Supabase with project_id matching"""
        
        # Add project_id to all rows
        self.df_landuse["project_id"] = project_id
        
        # Rename the column names to match the table schema
        self.df_landuse.rename(columns={
            '0': 'water', 0: 'water',
            '1': 'trees', 1: 'trees',
            '2': 'grass', 2: 'grass',
            '3': 'flooded_vegetation', 3: 'flooded_vegetation',
            '4': 'crops', 4: 'crops',
            '5': 'shrub_and_scrub', 5: 'shrub_and_scrub',
            '6': 'built', 6: 'built',
            '7': 'bare', 7: 'bare',
            '8': 'snow_and_ice', 8: 'snow_and_ice',
            '9': 'null', 9: 'null'
        }, inplace=True)
        
        columns = [
            'project_id', 'month', 'bare', 'built', 'crops', 
            'flooded_vegetation', 'grass', 'shrub_and_scrub', 
            'snow_and_ice', 'trees', 'water', 'null'
        ] 
        df_upload = self.df_landuse[columns]
        
        # Fill NA & Replace infinity values
        df_upload = df_upload.fillna(0)
        df_upload = df_upload.replace([np.inf, -np.inf], 0)
        
        # Round all numeric columns to 2 decimal places to ensure they fit within database constraints
        numeric_columns = df_upload.select_dtypes(include=['float64', 'int64']).columns
        for col in numeric_columns:
            if col != 'month' and col != 'project_id':
                df_upload[col] = df_upload[col].round(2)
                # Cap values to fit within database constraints (max 99,999,999.99)
                df_upload[col] = df_upload[col].clip(upper=99999999.99)
        
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
        
    def plotting_landuse(self):        
        # Define columns to plot (exclude 'month' and 'system:index')
        value_columns = [
            'water', 
            'bare', 'built', 'snow_and_ice', 
            'crops', 'grass', 'trees', 'shrub_and_scrub', 'flooded_vegetation'
        ]
        
        # Create a figure
        fig = go.Figure()
        
        # Add traces for each land use type
        for column in value_columns:
            fig.add_trace(go.Scatter(
                x=self.df_landuse['month'],
                y=self.df_landuse[column],
                mode='lines',
                name=column,
                line=dict(width=0.5)
            ))
        
        # Update layout
        fig.update_layout(
            title=f"Land Use Time Series for Project {self.project_code}",
            xaxis_title="Month",
            yaxis_title="Percentage",
            legend_title="Land Use Type",
            height=600,
            width=1000
        )
        
        # Show the figure
        fig.show()
        
    def plotting_forestloss(self):
        # Create a figure
        fig = go.Figure()
        
        # Add trace for forest loss
        fig.add_trace(go.Scatter(
            x=self.df_forestloss['year'],
            y=self.df_forestloss['deforestation_amount'],
            mode='lines+markers',
            name='Forest Loss',
            line=dict(width=2, color='red')
        ))
        
        # Update layout
        fig.update_layout(
            title=f"Forest Loss Time Series for Project {self.project_code}",
            xaxis_title="Year",
            yaxis_title="Forest Loss (hectares)",
            height=400,
            width=800
        )
        
        # Show the figure
        fig.show()
    
    def process_file(self, table_name: str = "time_series_data"):
        """Main pipeline method to process CSV files and upload to Supabase"""
        # Get project_id for the project_code
        project_id = self.get_project_id()
        if not project_id:
            print(f"Pipeline failed for project code: {self.project_code}")
            return False
        
        # Upload forest loss data
        success = self.upload_to_supabase_forestloss(project_id, table_name = "time_series_data")
        if not success:
            print(f"Pipeline failed for project code: {self.project_code}")
            return False
        
        # Upload land use data
        success = self.upload_to_supabase_landuse(self.get_project_id(), table_name = "landuse_time_series")
        if not success:
            print(f"Pipeline failed for project code: {self.project_code}")
            return False
        
        # plot the file 
        self.plotting_landuse()
        
        return success
