from datetime import datetime
import os
import numpy as np
import pandas as pd
import difflib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "data_with_coordinates.csv")
DF = pd.read_csv(CSV_PATH)

ALIASES = {
    "jaksel": "jakarta selatan",
    "jaktim": "jakarta timur",
    "jakpus": "jakarta pusat",
    "jakbar": "jakarta barat",
    "jakut": "jakarta utara",
    "blokm": "blok m",
    "alsut": "alam sutera",
    "pasming": "pasar minggu",
    "dursaw": "duren sawit",
    "pik": "pantai indah kapuk"
}

def get_unique_locations():
    # Return a clean, sorted list of unique neighborhoods
    if "location" in DF.columns:
        valid_locs = DF["location"].dropna().unique()
        return sorted([str(loc).strip() for loc in valid_locs if str(loc).strip()])
    return []

def simple_kmeans(coords, n_clusters=2, max_iter=10):
    if len(coords) <= n_clusters:
        return np.zeros(len(coords), dtype=int)
    np.random.seed(42)
    centroids = coords[np.random.choice(len(coords), n_clusters, replace=False)]
    labels = np.zeros(len(coords), dtype=int)
    for _ in range(max_iter):
        distances = np.linalg.norm(coords[:, np.newaxis] - centroids, axis=2)
        labels = np.argmin(distances, axis=1)
        new_centroids = np.array([
            coords[labels == k].mean(axis=0) if np.any(labels == k) else centroids[k] 
            for k in range(n_clusters)
        ])
        if np.allclose(centroids, new_centroids):
            break
        centroids = new_centroids
    return labels

def get_daily_itinerary(target_city, is_shuffle=False):
    df = DF.copy()  # Create a lightweight copy for filtering
    search_term = target_city.lower()
    
    if search_term in ALIASES:
        search_term = ALIASES[search_term]
    # --- THE SMART SEARCH ENGINE ---
    # 1. Try to find an EXACT match in the location column first
    if "location" in df.columns:
        exact_match = df[df["location"].fillna("").str.lower() == search_term].copy()
    else:
        exact_match = pd.DataFrame()
        
    # 2. If it's a real neighborhood, lock it in! Otherwise, do the broad search.
    if not exact_match.empty:
        city_data = exact_match
    else:
        mask = pd.Series(False, index=df.index)
        if "location" in df.columns:
            mask = mask | df["location"].fillna("").str.lower().str.contains(search_term)
        if "street" in df.columns:
            mask = mask | df["street"].fillna("").str.lower().str.contains(search_term)
        if "address" in df.columns:
            mask = mask | df["address"].fillna("").str.lower().str.contains(search_term)
        city_data = df[mask].copy()
    # ----------------------------------
    
    # --- NEW TYPO CATCHER ---
    if city_data.empty:
        if "location" in df.columns:
            # Get a list of all valid neighborhoods in lowercase
            valid_locations = [str(x).lower() for x in df["location"].dropna().unique()]
            
            # Find the closest matching word (cutoff 0.6 means 60% similarity needed)
            closest_matches = difflib.get_close_matches(search_term, valid_locations, n=1, cutoff=0.6)
            
            if closest_matches:
                # Return the suggested correction formatted nicely
                suggested_term = closest_matches[0].title()
                return {"steps": [], "cost": 0, "suggestion": suggested_term}
                
        return {"steps": [], "cost": 0}
    
    unique_coordinates = city_data[["lat", "lng"]].drop_duplicates().values
    num_clusters = min(2, len(unique_coordinates))
    
    if num_clusters < 2:
        city_data["zone_id"] = 0
        selected_zone = 0
    else:
        city_data["zone_id"] = simple_kmeans(city_data[["lat", "lng"]].values, num_clusters)
        
        # --- SHUFFLE LOGIC 1: Pick a random zone ---
        if is_shuffle:
            import random
            selected_zone = random.randint(0, num_clusters - 1)
        else:
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
            # --- SHUFFLE LOGIC 2: Pick a random place instead of top rated ---
            if is_shuffle:
                spot = match.sample(n=1).iloc[0]
            else:
                spot = match.sort_values(by="rate", ascending=False).iloc[0]
                
            street_text = str(spot["street"])
            raw_price = spot["price_from"]
            safe_price = int(raw_price) if pd.notna(raw_price) and str(raw_price).strip() != "" else 0
            
            final_itinerary.append({
                "time": time, 
                "place": spot["title"], 
                "street": f"{spot['location']}, Jakarta" if street_text == "nan" else street_text,
                "price": safe_price,
                "lat": float(spot["lat"]),
                "lng": float(spot["lng"])
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
                # --- SHUFFLE LOGIC 3: Fallback randomizer ---
                if is_shuffle:
                    spot = all_candidates.sample(n=1).iloc[0]
                else:
                    if num_clusters >= 2:
                        zone_center = today_pool[["lat", "lng"]].mean().values
                        distances = np.linalg.norm(all_candidates[["lat", "lng"]].values - zone_center, axis=1)
                        closest_idx = np.argmin(distances)
                        spot = all_candidates.iloc[closest_idx]
                    else:
                        spot = all_candidates.sort_values(by="rate", ascending=False).iloc[0]
                    
                street_text = str(spot["street"])
                raw_price = spot["price_from"]
                safe_price = int(raw_price) if pd.notna(raw_price) and str(raw_price).strip() != "" else 0
                
                final_itinerary.append({
                    "time": time, 
                    "place": spot["title"], 
                    "street": f"{spot['location']}, Jakarta" if street_text == "nan" else street_text,
                    "price": safe_price,
                    "lat": float(spot["lat"]),
                    "lng": float(spot["lng"])
                })
                used_places.add(spot["title"])
                
    total_budget = sum(item["price"] for item in final_itinerary)
    
    return {
        "steps": final_itinerary,
        "cost": total_budget
    }