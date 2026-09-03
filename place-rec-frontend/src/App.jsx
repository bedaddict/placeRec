import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 1. A custom, chunky map pin to match your Neo-Brutalist vibe!
const chunkyMarker = new L.DivIcon({
  className: 'bg-transparent',
  html: `<div style="background-color: #22d3ee; border: 3px solid black; width: 24px; height: 24px; border-radius: 50%; box-shadow: 3px 3px 0 black;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// 2. The "Camera Man": This invisible component tells the map to fly to new coordinates
function MapFlyTo({ center }) {
  const map = useMap();
  if (center) {
    map.flyTo(center, 16, { animate: true, duration: 1.2 });
  }
  return null;
}

// The Seamless & Cute Paper Plane
const AnimatedPaperPlane = () => (
  <span className="inline-flex items-center justify-center mx-2 flex-shrink-0 relative w-16 h-10 overflow-visible" style={{ WebkitTextStroke: '0px' }}>
    <style>{`
      @keyframes glide {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-3px) rotate(2deg); }
      }
    `}</style>
    <svg width="100%" height="100%" viewBox="0 0 80 40" className="overflow-visible fill-none stroke-black stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
      {/* The cute, smooth swooping dotted line */}
      <path d="M 0,35 Q 20,40 35,25 T 55,15" strokeDasharray="4,5" />
      {/* The floating minimalist plane */}
      <g transform="translate(0, -10)"> 
        <g style={{ animation: 'glide 3s ease-in-out infinite', transformOrigin: '60px 15px' }}>
          <path d="M 50,18 L 75,5 L 60,28 L 50,18 Z" fill="white" />
          <path d="M 50,18 L 62,12" />
        </g>
        
      </g>
    </svg>
  </span>
);

function App() {
  const [location, setLocation] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  
  // 3. The Tracker: Remembers exactly which spot you are looking at
  const [activeSpot, setActiveSpot] = useState([-6.2088, 106.8456]); // Default: Jakarta

  useEffect(() => {
    // 1. Fetch available locations for autocomplete
    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        setAvailableLocations(data.locations || []);
      } catch (err) {
        console.error("Failed to load locations");
      }
    };
    fetchLocations();

    // 2. Existing URL check
    const params = new URLSearchParams(window.location.search);
    const sharedRoute = params.get('route');
    if (sharedRoute) {
      setLocation(sharedRoute);
      executeSearch(sharedRoute);
    }
  }, []);

  const executeSearch = async (searchQuery, isShuffle = false) => {
    if (!searchQuery) return;
    setLoading(true);
    setError('');
    setItinerary([]);
    setTotalCost(0);
    
    if (!isShuffle) {
      window.history.pushState({}, '', `?route=${searchQuery}`);
    }

    try {
      // Notice the new &shuffle parameter at the end of the URL!
      const response = await fetch(`/api/itinerary?location=${encodeURIComponent(searchQuery)}&shuffle=${isShuffle}`);

      const data = await response.json();

      if (data.itinerary && data.itinerary.length > 0) {
        setItinerary(data.itinerary);
        setTotalCost(data.total_cost || 0);
        // Automatically point the map to the very first spot of the day!
        setActiveSpot([data.itinerary[0].lat, data.itinerary[0].lng]);
      } else {
        setError(`Oopsie! there is no data for "${searchQuery}". Try testing "Kemang" or "Sudirman".`);
      }
    } catch (err) {
      // THIS WILL PRINT THE REAL ERROR TO THE SCREEN!
      console.error("THE REAL ERROR:", err);
      setError(`Crash log: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = availableLocations
    .filter(loc => loc.toLowerCase().includes(location.toLowerCase()))
    .slice(0, 5);
  
  // The Smart Typist: Watches what you type and clears the board if it's empty
  const handleInputChange = (e) => {
    const text = e.target.value;
    setLocation(text);
    setShowDropdown(text.length > 0);

    // If the user completely clears the search bar
    if (text.trim() === '') {
      setItinerary([]); // Hide the timeline
      setTotalCost(0);  // Reset the wallet
      setError('');     // Hide any pink oopsie boxes
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeSearch(location);
  };

  return (
    <div className="min-h-screen bg-violet-100 text-slate-900 font-sans p-8 selection:bg-lime-400 selection:text-black">
      
      {/* Header Section */}
      <div className="w-full max-w-full mx-auto text-center mb-12 mt-10">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
          Where should we wander today? <AnimatedPaperPlane />
        </h1>
        <p className="text-slate-800 font-bold text-lg bg-yellow-300 inline-block px-4 py-1 border-2 border-black rounded-full shadow-[2px_2px_0_rgba(0,0,0,1)]">
          Drop a location and let us find out your hangout agenda for the day
        </p>
      </div>
        
      {/* Search Section */}
      <form onSubmit={handleFormSubmit} className="w-full max-w-2xl mx-auto flex gap-3 mb-12">
        <div className="relative flex-1">
          <input
            type="text"
            value={location}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(location.length > 0)}
            // Delay closing slightly so clicks on the dropdown register first
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Let's try Blok M, Bintaro..."
            className="w-full bg-white border-4 border-black rounded-2xl px-6 py-4 text-black font-bold placeholder-slate-400 shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:translate-y-1 focus:translate-x-1 focus:shadow-none transition-all"
          />
          
          {/* THE PREDICTIVE DROPDOWN */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
              {suggestions.map((suggestion, idx) => (
                <li 
                  key={idx}
                  onClick={() => {
                    setLocation(suggestion);
                    setShowDropdown(false);
                    executeSearch(suggestion); // Auto-search when clicked!
                  }}
                  className="px-6 py-3 border-b-2 border-black last:border-0 hover:bg-lime-200 cursor-pointer text-black font-bold transition-colors"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-lime-400 border-4 border-black text-black font-black px-8 py-4 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-lime-300 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'GO!'}
        </button>

        {/* THE NEW SHUFFLE BUTTON - Only appears if data exists! */}
        {itinerary.length > 0 && (
          <button
            type="button"
            onClick={() => executeSearch(location, true)}
            disabled={loading}
            className="bg-cyan-400 border-4 border-black text-black font-black px-5 py-4 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-cyan-300 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center"
            title="Shuffle Places"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        )}
      </form>

      {error && (
        <div className="w-full max-w-2xl mx-auto bg-pink-400 border-4 border-black text-black font-bold p-4 rounded-2xl mb-8 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
          {error}
        </div>
      )}

      {/* --- THE SPLIT SCREEN LAYOUT --- */}
      {itinerary.length > 0 && (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          
          {/* LEFT SIDE: The Scrollytelling Timeline */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute left-[33px] top-6 bottom-6 w-1.5 bg-black z-0 rounded-full"></div>
            
            <div className="flex flex-col gap-8 relative z-10">
              {itinerary.map((step, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-6 group"
                  // THE TRIGGER: This tells the map to move when the mouse touches the card!
                  onMouseEnter={() => setActiveSpot([step.lat, step.lng])}
                >
                  <div className="w-16 flex flex-col items-center mt-4">
                    <div className="w-6 h-6 rounded-full bg-cyan-400 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover:bg-pink-400 transition-colors duration-300"></div>
                  </div>

                  <div className="flex-1 bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[10px_10px_0_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                    <span className="inline-block px-4 py-1 bg-cyan-300 border-2 border-black text-black text-sm font-black rounded-full mb-3 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      {step.time}
                    </span>
                    <h2 className="text-2xl font-black text-black mb-2">{step.place}</h2>
                    <div className="flex items-center text-slate-600 font-bold text-sm gap-2">
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span>{step.street}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* The Damage Receipt */}
            <div className="w-full bg-lime-300 border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0_rgba(0,0,0,1)] mt-8 flex justify-between items-center transform -rotate-1 hover:rotate-0 transition-all">
              <div className="flex flex-col">
                <span className="text-black font-black uppercase tracking-widest text-sm">Estimated Damage</span>
                <span className="text-slate-800 font-bold text-xs">Based on avg. menu prices</span>
              </div>
              <div className="bg-white border-4 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <span className="text-2xl font-black text-black">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalCost)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: The Sticky Map */}
          <div className="w-full lg:w-1/2">
            <div className="sticky top-8 h-[600px] bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden">
              <MapContainer center={activeSpot} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={activeSpot} icon={chunkyMarker} />
                <MapFlyTo center={activeSpot} />
              </MapContainer>
            </div>
          </div>

        </div>
      )}

      {/* Footer Section */}
      <div className="mt-24 pb-8 text-center text-slate-700 font-bold text-sm max-w-4xl mx-auto">
        <p className="bg-white border-2 border-black px-4 py-3 rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <span className="font-black text-black">Disclaimer:</span> Pardon me since it is my v1 of the app, it only shows some of the neighborhood, more places coming soon ;D
        </p>
      </div>

    </div>
  );
}

export default App;