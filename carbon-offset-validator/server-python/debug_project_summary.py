import asyncio
from dotenv import load_dotenv
from database import supabase
import json

load_dotenv()

async def debug_project_summary():
    project_code = "3226"
    
    print(f"Debugging project_summary table for project_code: {project_code}")
    
    # Step 1: Get the project to find its ID
    print("\nStep 1: Finding project ID...")
    try:
        project_response = supabase.table("projects").select("*").eq("project_code", project_code).single().execute()
        project = project_response.data
        
        if not project:
            print(f"No project found with code: {project_code}")
            return
            
        project_id = project.get("id")
        print(f"Project found: {project.get('name')}")
        print(f"Project ID: {project_id}")
        
        # Step 2: Examine the project_summary table structure
        print("\nStep 2: Checking project_summary table structure...")
        try:
            # Get a sample row to see table structure
            sample_response = supabase.table("project_summary").select("*").limit(1).execute()
            if sample_response.data:
                print(f"project_summary table columns: {list(sample_response.data[0].keys())}")
            else:
                print("project_summary table exists but has no data")
        except Exception as e:
            print(f"Error checking project_summary structure: {str(e)}")
        
        # Step 3: Check if this project has summary data
        print("\nStep 3: Checking if project has summary data...")
        try:
            summary_response = supabase.table("project_summary").select("*").eq("project_id", project_id).single().execute()
            summary_data = summary_response.data
            
            if summary_data:
                print(f"Summary data found with keys: {list(summary_data.keys())}")
                
                # Check specific field types that might cause issues
                for key, value in summary_data.items():
                    type_name = type(value).__name__
                    print(f"  - {key}: {type_name}")
                    
                    # For complex fields, show a sample of their content
                    if type_name in ('dict', 'list'):
                        sample = json.dumps(value)[:100] + "..." if len(json.dumps(value)) > 100 else json.dumps(value)
                        print(f"    Sample: {sample}")
                
                # Special check for policy_analysis field which might be causing issues
                if 'policy_analysis' in summary_data:
                    policy = summary_data['policy_analysis']
                    print("\nDetailed policy_analysis check:")
                    print(f"  Type: {type(policy).__name__}")
                    if policy is None:
                        print("  Value: None")
                    elif isinstance(policy, dict):
                        print(f"  Keys: {list(policy.keys()) if policy else 'empty dict'}")
                        print(f"  Sample: {json.dumps(policy)[:200]}..." if len(json.dumps(policy)) > 200 else json.dumps(policy))
                    else:
                        print(f"  Value: {str(policy)[:200]}...")
            else:
                print("No summary data found for this project")
                
            # Test a simulated response with defaults
            print("\nTest: Simulating response with default values if summary_data is None...")
            default_summary = {
                'summary': "",
                'policy_analysis': {},
                'news': []
            }
            print(f"Default summary: {default_summary}")
                
        except Exception as e:
            print(f"Error checking project summary data: {str(e)}")
            import traceback
            print(traceback.format_exc())
    
    except Exception as e:
        print(f"Error in debug process: {str(e)}")

if __name__ == "__main__":
    asyncio.run(debug_project_summary())
