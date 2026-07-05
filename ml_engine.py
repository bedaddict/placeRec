from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

def get_daily_itinerary(target_city):
    df = pd.read_csv("data_with_coordinates.csv")
    city_data = df[df["location"].str.lower() == target_city.lower()].copy()
    
    if city_data.empty:
        print(f"oopsiee! there is no itinerary for {target_city} right now :(")
        return []
    
    unique_coordinates = city_data[["lat", "lng"]].drop_duplicates().values
    num_clusters = min(2, len(unique_coordinates))
    
    if num_clusters < 2:
        city_data["zone_id"] = 0
        selected_zone = 0
    else:
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
        city_data["zone_id"] = kmeans.fit_predict(city_data[["lat", "lng"]].values)
        day_of_year = datetime.now().timetuple().tm_yday
        selected_zone = day_of_year % num_clusters
    
    today_pool = city_data[city_data["zone_id"] == selected_zone]
    
    time_slots = [
        {"time": "08:00 AM", "type": "cafe"},
        {"time": "01:00 PM", "type": "restaurant"},
        {"time": "04:00 PM", "type": "restaurant"},
        {"time": "07:00 PM", "type": "restaurant"},
    ]
    
    final_itinerary = []
    used_places = set()
    
    for slot in time_slots:
        time = slot["time"]
        target_type = slot["type"]
        
        if target_type =="cafe":
            match = today_pool[
                (today_pool["cuisine"].str.lower() == "kafe") &
                (~today_pool["title"].isin(used_places))
                ]
        else:
            match = today_pool[
                (today_pool["cuisine"].str.lower() != "kafe") &
                (~today_pool["title"].isin(used_places))
                ]
        
        if not match.empty:
            spot = match.sort_values(by="rate", ascending=False).iloc[0]
            final_itinerary.append(
                {"time": time, "place": spot["title"], "street": spot["street"]
                 })
            used_places.add(spot["title"])
            
        else:
            if target_type == "cafe":
                all_candidates = city_data[
                    (city_data["cuisine"].str.lower() == "kafe") &
                    (~city_data["title"].isin(used_places))
                ]
            else:
                all_candidates = city_data[
                    (city_data["cuisine"].str.lower() != "kafe") &
                    (~city_data["title"].isin(used_places))
                ]
                
            if not all_candidates.empty:
                if num_clusters >= 2:
                    zone_center = kmeans.cluster_centers_[selected_zone]
                    distances = np.linalg.norm(all_candidates[["lat", "lng"]].values - zone_center, axis=1)
                    closest_idx = np.argmin(distances)
                    spot = all_candidates.iloc[closest_idx]
                else:
                    spot = all_candidates.sort_values(by="rate", ascending=False).iloc[0]
                    
                final_itinerary.append({
                    "time": time, "place": spot["title"], "street": spot["street"]
                })
                used_places.add(spot["title"])
                
    return final_itinerary

if __name__ == "__main__":
    test_location = "Kemang"
    
    print(f"Testing itinerary for: {test_location.upper()}")
    itinerary = get_daily_itinerary(test_location)
    for step in itinerary:
        print(f"{step['time']} -> {step['place']} {step['street']}")
    