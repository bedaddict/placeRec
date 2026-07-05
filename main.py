from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ml_engine import get_daily_itinerary

app = FastAPI(title="Itineary Recommendation API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/itinerary")
def fetch_itinerary(location: str):
    """
    This endpoint listens for GET requests at" /api/itinerary?city=YOUR_CITY
    It catches the city name, feeds it to the ML engine, and sends back JSON.
    """
    print(f"Server caught a request for location {location.upper()}")
    itinerary_data = get_daily_itinerary(location)
    return{
        "status": "success", "location": location, "itinerary": itinerary_data
    }
    
@app.get("/")
def home():
    return {"message": "Yeay welcome to the Itinerary Recommendation API! Use the /api/itinerary endpoint with a city query parameter to get recommendations."}