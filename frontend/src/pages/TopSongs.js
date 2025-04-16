import React, { useState, useEffect} from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTopData } from "./TopDataContext";

const TopSongs = () => {

  const [timeRange, setTimeRange] = useState('long_term');
  const {
          topDataShort,
          topDataMedium,
          topDataLong,
        } = useTopData();

  const [currentData, setCurrentData] = useState({ topTracks: [], languageDistribution: {}})

  
  const COLORS = [
  '#1DB954', // Spotify green
  '#FFFFFF', // white
  '#535353', // Spotify dark gray
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
    if (timeRange === "short_term") {
      setCurrentData(topDataShort);
    } else if (timeRange === "medium_term") {
      setCurrentData(topDataMedium);
    } else {
      setCurrentData(topDataLong);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  return (
    <div>

      <div className="flex justify-between space-x-6 ml-32 mt-8 mr-16">
        <h1 className="text-5xl font-bold ml-16 mt-8 w-1/2">
            Top Track trends!
        </h1>

        <div className="flex space-x-4 mb-3 justify-center mt-3 min-h-[90px] w-1/2">
            <button 
                onClick={() => setTimeRange("short_term")} 
                className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "short_term" ? "bg-green-500 text-black" : "bg-gray-900 text-white"} transition 
                    duration-300 hover:bg-green-500 hover:text-black font-semibold`}>
                Last Month
            </button>
            <button 
                onClick={() => setTimeRange("medium_term")} 
                className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "medium_term" ? "bg-green-500 text-black" : "bg-gray-900 text-white"} transition 
                    duration-300 hover:bg-green-500 hover:text-black font-semibold`}>
                Last 6 Months
            </button>
            <button 
                onClick={() => setTimeRange("long_term")} 
                className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "long_term" ? "bg-green-500 text-black" : "bg-gray-900 text-white"}  transition 
                    duration-300 hover:bg-green-500 hover:text-black font-semibold`}>
                Last 12 Months
            </button>
        </div>
    </div>

      <div className="flex justify-between space-x-6 mt-16 ml-32 mr-16">

        {!currentData.languageDistribution ? (
          <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">
            <p>Loading...</p>
          </div>
        ) : ( 
          currentData.languageDistribution && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">
            <h2 className="text-2xl font-bold text-white mb-4">Language Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(currentData.languageDistribution).map(([language, value]) => ({
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
                  {Object.keys(currentData.languageDistribution).map((_, index) => (
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
         <h2 className="text-3xl font-bold text-white mb-4">Top Tracks</h2>
            <ul className="space-y-6 mt-6">
                {currentData.topTracks?.map((track, index) => (
                    <li key={index} className="flex items-center space-x-4 text-gray-300 max-h-[45px]">

                          {/* Artist info */}
                        <div className="text-xl">{index + 1}  </div>
                        {/* Artist image */}
                        <img
                            src={track.image}
                            alt={`${track.name} artist`}
                            className="w-12 h-12 rounded shadow"
                        />
                        <div>
                            <div className="text-xl"> {track.name}</div>
                            <div className="text-md text-gray-400"> {track.artist}</div>
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
