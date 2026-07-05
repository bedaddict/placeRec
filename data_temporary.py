import pandas as pd
from geopy.geocoders import Nominatim
from time import sleep

def export_all_coordinates():
    print("Loading full data.csv file..")
    df = pd.read_csv("data.csv")
    
    total_rows = len(df)
    print(f"Found {total_rows} total rows to process.")
    
    geolocator =  Nominatim(user_agent="PlaceRec_app_v1")
    
    lats = []
    lngs = []
    
    print("Starting geocoding process...")
    for index, row in df.iterrows():
        search_query = f"{row['title']}, {row['location']}, Indonesia"
        print(f"[{index + 1}/{total_rows}] Looking up: {row['title']} ({row['location']})")
        
        try:
            location = geolocator.geocode(search_query, timeout=5)
            if location:
                lats.append(location.latitude)
                lngs.append(location.longitude)
            else:
                lats.append(-6.2088)
                lngs.append(106.8456)
        except Exception as e:
            lats.append(-6.2088)
            lngs.append(106.8456)
            
        sleep(1)
        
    df['lat'] = lats
    df['lng'] = lngs
    df.to_csv("data_with_coordinates.csv", index=False)
    print("\nGeocoding process completed. Coordinates have been injected into 'data_with_coordinates.csv'.")
    
if __name__ == "__main__":
    export_all_coordinates()