import React, { useState } from 'react';

function App() {
  const [location, setLocation] = useState('');
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchItinerary = async (e) => {
    e.preventDefault();
    if (!location) return;

    setLoading(true);
    setError('');
    setItinerary([]);

    try{
      const response = await fetch(`http://127.0.0.1:8000/api/itinerary?location=${location}`);

      if (!response.ok) {
        throw new Error('Sorry, network response was not ok');
      }

      const data = await response.json();

      if (data.itinerary && data.itinerary.length > 0) {
        setItinerary(data.itinerary);
      } else {
        setError(`Oopsie! there is no data for "${location}". Try testing "Kemang", "Bogor Timur", or "Sudirman".`);
      }
    } catch (err) {
      setError('Oh ow, failed to connect to backend. Is your Uvicorn server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-8 flex flex-col items-center">
      {/*Header Section*/}
      <div className="w-full max-w-2xl text-center mb-10 mt-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-teal-400 tracking-tight mb-4">
          Itinerary Planner
          </h1>
          <p className="text-slate-400 text-lg">
            Got confused where to go? we are here to help ᯓ★
            </p>
          </div>
        
      {/*Search Section*/}
      <form onSubmit={fetchItinerary} className="w-full max-w-xl flex gap-3 mb-12">
        <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Let's try Blok M, Bintaro or Bogor Timur..."
        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Go'}
        </button>
        </form>

        {/*Error Message*/}
        {error && (
          <div className="w-full max-w-xl bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 text-center">
            {error}
          </div>
        )}

        {/*The Scrollytelling Timeline Display*/}
        <div className="w-full max-w-xl relative">

          {/* Vertical line running down the middle (hidden if no data)*/}
          {itinerary.length > 0 && (
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-700 z-0"></div>
          )}

          <div className="flex flex-col gap-8 relative z-10">
            {itinerary.map((step, index) => (
              <div key={index} className="flex items-start gap-6 group">

                {/*Timeline DOT */}
                <div className="w-16 flex flex-col items-center mt-1">
                  <div className="w-4 h-4 rounded-full bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.5)] group-hover:scale-125 transition-transform duration-300"></div>
                  </div>

                  {/*Itinerary Card*/}
                  <div className="flex-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl hover:border-teal-400/50 hover:bg-slate-800 transition-all duration-300 shadow-lg">
                    <span className="inline-block px-3 py-1 bg-teal-900/30 text-teal-300 text-sm font-bold rounded-lg mb-3">
                      {step.time}
                    </span>
                    <h2 className="text-2xl font-bold text-white mb-2">{step.place}</h2>
                    <div className="flex items-center text-slate-400 text-sm gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{step.street}</span>
                    </div>
                  </div>

                </div>
              ))}
          </div>
        </div>
        {/*Footer Section*/}
        <div className="mt-16 pb-8 text-center text-slate-500 text-sm max-2-md">
          <p>
            <span className="font-bold text-slate-400">Disclaimer:</span> Pardon me since it is my v1 of the app, it only shows some of the neighborhood, more places coming soon ;D
          </p>
        </div>
    </div>
  );
}

export default App;