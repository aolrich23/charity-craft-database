import csv
import json
import os

# Define absolute paths based on context
CSV_PATH = '/Users/andreaolrich/Source/charity-craft-database/data.csv'
JSON_PATH = '/Users/andreaolrich/Source/charity-craft-database/data.json'

def transform_csv_to_json():
    projects = []
    
    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} not found.")
        return

    with open(CSV_PATH, mode='r', encoding='utf-8-sig') as csvfile:
        # DictReader automatically handles headers and quoted values
        reader = csv.DictReader(csvfile)
        
        for index, row in enumerate(reader, start=1):
            # 1. Transform craft and category into lists
            categories = [c.strip() for c in row['category'].split(',')] if row['category'] else []
            crafts = [c.strip() for c in row['craft'].split(',')] if row['craft'] else []
            
            # 2. Group organiser details
            organiser = {
                "name": row.get('organiser_name', ''),
                "url": row.get('organiser_url', ''),
                "location": row.get('organiser_location', ''),
                "image": row.get('organiser_image', '')
            }
            
            # 3. Sensibly group multiple materials into an array
            materials = []
            for i in range(1, 3):
                m_type = row.get(f'materialType{i}', '').strip()
                m_amount = row.get(f'materialAmount{i}', '').strip()
                if m_type or m_amount:
                    materials.append({
                        "type": m_type,
                        "amount": m_amount
                    })
            
            # 4. Group pattern details
            pattern = {
                "text": row.get('pattern_text', 'View Pattern'),
                "url": row.get('pattern_url', '#')
            }
            
            # 5. Map remaining fields to a clean schema
            project = {
                "id": index,
                "title": row.get('title', ''),
                "whatYouMake": row.get('what_you_make', ''),
                "organiser": organiser,
                "whoTheyHelp": row.get('who_they_help', ''),
                "category": categories,
                "craft": crafts,
                "equipment": row.get('Equipment', ''),
                "materials": materials,
                "approximateTime": row.get('approximateTime', ''),
                "pattern": pattern,
                "image": row.get('image') if row.get('image') else None,
                "contribution": {
                    "mail": row.get('contribution_mail', ''),
                    "inPerson": row.get('contribution_in_person', ''),
                    "other1Text": row.get('contribution_other_1_text', ''),
                    "other1Value": row.get('contribution_other_1_value', ''),
                    "other2Text": row.get('contribution_other_2_text', ''),
                    "other2Value": row.get('contribution_other_2_value', '')
                },
                "lastVerified": row.get('last_verified', ''),
                "skillLevel": row.get('skill_level', ''),
                "community": {
                    "facebookUrl": row.get('community_facebook_url', ''),
                    "facebookText": row.get('community_facebook_text', ''),
                    "instagramUrl": row.get('community_instagram_url', ''),
                    "instagramText": row.get('community_instagram_text', ''),
                    "other1Text": row.get('community_other_1_text', ''),
                    "other1Url": row.get('community_other_1_url', ''),
                    "other1Format": row.get('community_other_1_format', '')
                },
                "andieStory": row.get('andie_story', ''),
                "contactUrl": row.get('contact', '')
            }
            projects.append(project)

    # Write to data.json with pretty printing
    with open(JSON_PATH, mode='w', encoding='utf-8') as jsonfile:
        json.dump(projects, jsonfile, indent=2)
    
    print(f"Successfully transformed {len(projects)} projects from CSV to JSON.")
    print(f"Output: {JSON_PATH}")

if __name__ == "__main__":
    transform_csv_to_json()