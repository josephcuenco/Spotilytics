import React, { useState, useEffect } from 'react';

const Language = () => {
  
  const [topSongData, setTopSongData] = useState('');
  // const [songTitle, setSongTitle] = useState('Shape of You');  // Set default song title
  // const [artistName, setArtistName] = useState('Ed Sheeran');  // Set default artist
  const [timeRange, setTimeRange] = useState("long_term");
  

  useEffect(() => {
    const fetchData = async () => {
      // if (!songTitle || !artistName) {
      //   setLyricsLanguages('Song title and artist name are required.');
      //   return;
      // }
    
      try {
        const response = await fetch(
          `http://localhost:5000/song-lyrics?time_range=${encodeURIComponent(timeRange)}`
        );
    
        if (!response.ok) {
          const errorData = await response.json();
          setTopSongData(errorData.error || 'Error fetching data.');
          return;
        }
    
        const data = await response.json();
    
        const topSongData = data.languages;

      setTopSongData(topSongData || 'top songs languages could not be determined.');
      } catch (error) {
        setTopSongData('Error fetching top songs.');
      }
    };

    fetchData();
  }, [timeRange]);  

  return (
    <div className="ml-32 mt-16">
      <h1 className="text-5xl font-bold">Language</h1>

      <div className="flex space-x-4 mt-6 ml-16">
       <button 
          onClick={() => setTimeRange("short_term")} 
           className={`px-4 py-2 rounded-full ${timeRange === "short_term" ? "bg-green-500" : "bg-gray-600"} text-white`}>
            Last 3 Months
        </button>
        <button 
          onClick={() => setTimeRange("medium_term")} 
           className={`px-4 py-2 rounded-full ${timeRange === "medium_term" ? "bg-green-500" : "bg-gray-600"} text-white`}>
            Last 6 Months
         </button>
         <button 
             onClick={() => setTimeRange("long_term")} 
             className={`px-4 py-2 rounded-full ${timeRange === "long_term" ? "bg-green-500" : "bg-gray-600"} text-white`}>
              Last 12 Months
            </button>
     </div>

      {/* <input
        type="text"
        value={songTitle}
        onChange={(e) => setSongTitle(e.target.value)}
        placeholder="Enter song title"
        className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 mt-8"  
      />
      <input
        type="text"
        value={artistName}
        onChange={(e) => setArtistName(e.target.value)}
        placeholder="Enter artist name"
        className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 mt-8"
      /> */}



      <div className="mt-8">

        <div className="mt-4 p-4 border border-gray-300 rounded-lg">
          <h2 className="text-2xl font-bold">Data:</h2>
            {topSongData ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(topSongData, null, 2)}</pre>
            ) : (
              <p>Loading...</p>
            )}
          </div>
      </div>
    </div>
  );
};

export default Language;
