import React, { useState, useEffect} from 'react';
import { useTopData } from "./TopDataContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Info } from "lucide-react";


const TopSongs = () => {

  const [timeRange, setTimeRange] = useState('long_term');
  const {
          topDataShort,
          topDataMedium,
          topDataLong,
        } = useTopData();

  const [currentData, setCurrentData] = useState({ topTracks: [], languageDistribution: {}})

  // const [loading, setLoading] = useState(false);
  // const [topData, setTopData] = useState({ topTracks: []});
  //const [testVar, setTestVar] = useState(null);
  const testAvgProfanity = [{"name": "test", "avgProf": 10, "avgWord": 100}];
  const testProfaneTracks = [{"name": "Song 1", "profanity_count": 10}, {"name": "Song 2", "profanity_count": 8},
                             {"name": "Song 3", "profanity_count": 7}, {"name": "Song 4", "profanity_count": 6},
                             {"name": "Song 5", "profanity_count": 5}];
  
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
  
  

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const params = new URLSearchParams(window.location.search);
  //       const userId = params.get("user_id");

  //     // Profanity Backend Link In Progress
  //     /*
  //     const profan_response = await fetch(
  //       `http://localhost:5000/song-lyrics/profanity?time_range=${encodeURIComponent(timeRange)}`
  //     );

  //     const data = await profan_response.json();
  //     setTestVar(data);
  //     */
  //    )
      
  //     setLoading(false);
  //   };

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
            <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">

          <div className='flex items-center space-x-3'>
          <h2 className="text-2xl font-bold text-white mb-4">Language Distribution</h2>
            <div className="relative group">
              <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
              <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
              rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
              duration-200 p-2 pointer-events-none">
              Spotilytics' language detection is not perfect, which is why there is an uncertain percentage!
              P.S. If the distribution looks wrong, try refreshing the page.
              </div>
          </div>
          </div>
            {/*languageDistribution*/}
          <div className='flex justify-center items-center min-h-[250px]'>
            {!currentData.languageDistribution ? (
                <div className="w-12 h-12 border-4 border-green-500 border-dashed rounded-full animate-spin
                "> </div>

              ) : ( 
          currentData.languageDistribution && (

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
          )
          )}
          </div>
              

              <h2 className="text-2xl font-bold text-white mb-4 mt-16">Average Profanity</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data= {testAvgProfanity}>
                  <XAxis dataKey="name"/>
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgProf" fill="#535353" />
                  <Bar dataKey="avgWord" fill="#1DB954" />
                </BarChart>
              </ResponsiveContainer>

              <h2 className="text-2xl font-bold text-white mb-4 mt-16">Most Profane Tracks</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data= {testProfaneTracks}>
                  <CartesianGrid strokeDasharray="3"/>
                  <XAxis dataKey="name"/>
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="profanity_count" fill="#1DB954" />
                </BarChart>
              </ResponsiveContainer>




            </div>
        
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
