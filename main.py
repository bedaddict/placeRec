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
async def get_itinerary(location: str, shuffle: bool = False):
    # Pass the shuffle boolean directly into the ml_engine!
    result = get_daily_itinerary(location, shuffle)
    
    return {
        "itinerary": result["steps"],
        "total_cost": result["cost"]
    }
    
@app.get("/")
def home():
    return {"message": "Yeay welcome to the Itinerary Recommendation API! Use the /api/itinerary endpoint with a city query parameter to get recommendations."}