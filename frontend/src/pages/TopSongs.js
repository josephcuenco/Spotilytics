import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';


const TopSongs = () => {
  
  const [languageDistribution, setLanguageDistribution] = useState('');
  const [timeRange, setTimeRange] = useState('long_term');
  const [loading, setLoading] = useState(false);
  const [topData, setTopData] = useState({ topTracks: []})

  
  const COLORS = [
  '#1DB954', // Spotify green
  '#535353', // Spotify dark gray
  '#FFFFFF', // white
  '#66D36E', // bright green accent
  '#23A55A', // emerald accent
  '#3E3E3E', // mid gray
  '#2D2D2D', // deeper black/gray
  '#5CDB95', // mint green variation
  '#1ED760', // Spotify light green
  '#0D0D0D', // almost black
  '#28A745'  // subtle green
  ];
  
  

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
        const userId = params.get("user_id");
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:5000/song-lyrics?time_range=${encodeURIComponent(timeRange)}`
        );
    
        const data = await response.json();
        let sum = 0;
        for (const lang in data.languages) {
          if (data.languages[lang] < .9) {
            delete data.languages[lang];
          }
          if (data.languages[lang]) {
            sum += data.languages[lang];
          }
        }

        const localUncertain = Math.max(0, 100 - sum);
        data.languages["Uncertain"] = Number(localUncertain.toFixed(2));
    
        const topSongData = data.languages;

      setLanguageDistribution(topSongData || 'top songs languages could not be determined.');
      } catch (error) {
        setLanguageDistribution('Error fetching top songs.');
      }

      const topDataResponse = await axios.get("http://localhost:5000/user-top", {
        params: { user_id: userId, time_range: timeRange }
      });
       setTopData(topDataResponse.data);



      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);  

  return (
    <div className="ml-32 mt-16">

      <div className="flex justify-between space-x-6 mr-16 min-h-[130px]">
        <h1 className="text-5xl font-bold ml-16 w-1/2">
          Top Track trends!
        </h1>

        <div className="flex space-x-4 mt-6 ml-16 mr-16 w-1/2">
        <button 
            onClick={() => setTimeRange("short_term")} 
            className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "short_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
              Last Month
          </button>
          <button 
            onClick={() => setTimeRange("medium_term")} 
            className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "medium_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
              Last 6 Months
          </button>
          <button 
              onClick={() => setTimeRange("long_term")} 
              className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "long_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
                Last 12 Months
              </button>
        </div>
    </div>

      <div className="flex justify-between space-x-6 mt-12 mr-16">

        {loading ? (
          <p>Loading...</p>
        ) : ( 
          languageDistribution && (
          <div className="w-full max-w-xl min-h-[300px] ml-16">
            <h2 className="text-xl font-semibold mb-4">Language Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(languageDistribution).map(([language, value]) => ({
                    name: language,
                    value: value,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                  stroke="none" 
                  labelLine={false}
                >
                  {Object.keys(languageDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          )
        )}

         <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">
          <h2 className="text-2xl font-bold text-white mb-4">Top Tracks</h2>
         <ul className="space-y-4">
          {topData.topTracks?.map((track, index) => (
          <li key={index} className="flex items-center space-x-4 text-gray-300">
          {/* Album cover image */}
          <img
           src={track.image}
           alt={`${track.name} album cover`}
           className="w-12 h-12 rounded shadow"
          />

          {/* Song info */}
         <div>
         <div className="font-semibold">{index + 1}. {track.name}</div>
         <div className="text-sm text-gray-400">{track.artist}</div>
        </div>
      </li>
       ))}
       </ul>
     </div>
      </div>
    </div>
  );
};

export default TopSongs;
