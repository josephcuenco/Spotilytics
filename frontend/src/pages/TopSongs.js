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
          allDataFetched
        } = useTopData();

  const [currentData, setCurrentData] = useState({ topTracks: [], languageDistribution: {}, mostPositive: [], mostNegative: [], wordCloud: "", mostLexicalRich: [] });
  const [posAvg, setPosAvg] = useState(0);
  const [negAvg, setNegAvg] = useState(0);
  const [lexicalAvg, setLexicalAvg] = useState(0);
  const [hoveredTrack, setHoveredTrack] = useState(null); // State to track which track is hovered
  const [wordCloud, setWordCloud] = useState("");

  const sentimentData = [
    ...(currentData?.mostPositiveSent || []),
    ...(currentData?.mostNegativeSent || [])
  ].map(track => ({
    name: track.name,
    artist: track.artist,
    positive: track.sentiment?.pos ?? 0,
    negative: track.sentiment?.neg ?? 0
  }));
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const { artist } = payload[0].payload;
  
      return (
        <div style={{
          backgroundColor: "#1e1e1e",
          border: "1px solid #555",
          borderRadius: "8px",
          padding: "10px",
          color: "#fff",
          fontSize: "14px"
        }}>
          <p style={{ marginBottom: 4 }}><strong>{label}</strong> by {artist}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: <strong>{entry.value.toFixed(3)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
  '#66D36E', // bright green accent
  '#23A55A', // emerald accent
  '#5CDB95', // mint green variation
  '#1ED760', // Spotify light green
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
      // Set current word cloud
      if (topDataShort.wordCloud) {
        const byteCharacters = atob(topDataShort.wordCloud);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        let image = new Blob([byteArray], { type: 'image/jpeg' });
        let wordCloud = URL.createObjectURL(image);
        setWordCloud(wordCloud);
        }

        //set avergage sentiment scores
      setPosAvg( topDataShort.topTracks
      .filter(t => t.sentiment) // Ensure the track has sentiment data
      .map(t => t.sentiment.pos) // Extract the compound score
      .reduce((a, b) => a + b, 0) / topDataShort.topTracks.filter(t => t.sentiment).length // Compute average
        );
      setNegAvg( topDataShort.topTracks
      .filter(t => t.sentiment) // Ensure the track has sentiment data
      .map(t => t.sentiment.neg) // Extract the compound score
      .reduce((a, b) => a + b, 0) / topDataShort.topTracks.filter(t => t.sentiment).length // Compute average
        );

        //set lexical richness avg
        setLexicalAvg( topDataShort.topTracks
        .filter(t => t.lexicalRichness) // Ensure the track has lexical richness data
        .map(t => t.lexicalRichness.mtld) // Extract the compound score
        .reduce((a, b) => a + b, 0) / topDataShort.topTracks.filter(t => t.lexicalRichness).length // Compute average
          );
    } else if (timeRange === "medium_term") {

      setCurrentData(topDataMedium);
      if (topDataMedium.wordCloud) {
        const byteCharacters = atob(topDataMedium.wordCloud);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        let image = new Blob([byteArray], { type: 'image/jpeg' });
        let wordCloud = URL.createObjectURL(image);
        setWordCloud(wordCloud);
        }

      setPosAvg( topDataMedium.topTracks
        .filter(t => t.sentiment) // Ensure the track has sentiment data
        .map(t => t.sentiment.pos) // Extract the compound score
        .reduce((a, b) => a + b, 0) / topDataMedium.topTracks.filter(t => t.sentiment).length // Compute average
          );
        setNegAvg( topDataMedium.topTracks
        .filter(t => t.sentiment) // Ensure the track has sentiment data
        .map(t => t.sentiment.neg) // Extract the compound score
        .reduce((a, b) => a + b, 0) / topDataMedium.topTracks.filter(t => t.sentiment).length // Compute average
          );
          setLexicalAvg( topDataMedium.topTracks
        .filter(t => t.lexicalRichness) // Ensure the track has lexical richness data
        .map(t => t.lexicalRichness.mtld) // Extract the compound score
        .reduce((a, b) => a + b, 0) / topDataMedium.topTracks.filter(t => t.lexicalRichness).length // Compute average
          );

    } else {
      setCurrentData(topDataLong);
      if (topDataLong.wordCloud) {
        const byteCharacters = atob(topDataLong.wordCloud);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        let image = new Blob([byteArray], { type: 'image/jpeg' });
        let wordCloud = URL.createObjectURL(image);
        setWordCloud(wordCloud);
        }

      setPosAvg( topDataLong.topTracks
        .filter(t => t.sentiment) // Ensure the track has sentiment data
        .map(t => t.sentiment.pos) // Extract the compound score
        .reduce((a, b) => a + b, 0) / topDataLong.topTracks.filter(t => t.sentiment).length // Compute average
          );
        setNegAvg( topDataLong.topTracks
        .filter(t => t.sentiment) // Ensure the track has sentiment data
        .map(t => t.sentiment.neg) // Extract the compound score
        .reduce((a, b) => a + b, 0) / topDataLong.topTracks.filter(t => t.sentiment).length // Compute average
          );
          setLexicalAvg( topDataLong.topTracks
        .filter(t => t.lexicalRichness) // Ensure the track has lexical richness data
        .map(t => t.lexicalRichness.mtld) // Extract the compound score
        .reduce((a, b) => a + b, 0) / topDataLong.topTracks.filter(t => t.lexicalRichness).length // Compute average
          );

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, allDataFetched]);

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
              
              {/* Average Profanity */}
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




              {/* Sentiment Analysis*/}
              <h2 className="text-2xl font-bold text-white mb-4 mt-16">Sentiment Analysis</h2>
              <p className="text-gray-300 text-md">
                Spotilytics uses the VADER sentiment analysis model to analyze the lyrics of each track. 
                From this model we extract positive and negative scores for each track, ranging from 0 to around 0.6, the
                higher the score, the positive/negative the track is.
                This particular model picks out certain words, phrases, and other elements that are considered 
                positive or negative.This model is not perfect, and may be completely wrong for some tracks, but 
                it can be interesting to see how a lexical analysis of the lyrics can contrast with the feel of a song's 
                audio features.

              </p>
                
              <div className='flex items-center space-x-3 mt-10'>
                <h2 className="text-xl font-bold text-white mb-4">Average Sentiment</h2>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                    <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                    rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 p-2 pointer-events-none">
                    Do your top tracks have a more positive or negative sentiment?
                    </div>
                </div>
                </div>   
                             
                  <div className="flex items-center space-x-6">
                  <div className="text-xl">Positive: {posAvg.toFixed(3)}</div>
                  <div className="text-xl">Negative: {negAvg.toFixed(3)}</div>
                  <div className="text-xl">Overall: {(posAvg - negAvg).toFixed(3)}</div>
                </div>
                
                <div className='flex items-center space-x-3 mt-10'>
                <h2 className="text-xl font-bold text-white mb-4">Most Positive and Negative Tracks</h2>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                    <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                    rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 p-2 pointer-events-none">
                    Here are the tracks with the highest positive scores followed by the highest negative scores.
                    P.S. Sometimes a track can have both a high positive and a high negative score.
                    </div>
                </div>
                </div>   
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart
                    layout="vertical"
                    data={sentimentData}
                    margin={{ top: 20, right: 30, left: 15, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 0.6]} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "#ffffff", fontSize: 14 }}
                      interval={0}
                      width={150}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="positive" fill="#4CAF50" name="Positive Score" />
                    <Bar dataKey="negative" fill="#535353" name="Negative Score" />
                  </BarChart>
                </ResponsiveContainer>


                {/* Word Cloud */}
                <div className='flex items-center space-x-3 mt-10'>
                <h2 className="text-xl font-bold text-white mb-4">Word Cloud</h2>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                    <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                    rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 p-2 pointer-events-none">
                    A word cloud that contains the most common words in all of your top tracks!
                    </div>
                </div>
                </div>   
                <div className="flex justify-center items-center min-h-[250px]">
                    {!currentData.wordCloud ? (
                        <div className="w-12 h-12 border-4 border-green-500 border-dashed rounded-full animate-spin
                        "> </div>
                        ) : ( 
                        currentData.wordCloud && (
                          
                          <img src={wordCloud} alt="Word Cloud" width={600} height={600}/>
                        )
                        )}
                </div>

                {/* Lexical Richness */}
              <h2 className="text-2xl font-bold text-white mb-4 mt-16">Lexical Richness</h2>
              <p className="text-gray-300 text-md">
                Lexical richness is a measure of how unique the vocabulary is in a text.
                Spotilytics uses the Measure of Textual Lexical Diversity (MTLD) to calculate lexical richness.
                MTLD calculates how many words you can go through before (Unique words / Total words) drops below 0.72.
                The higher the MTLD score, the more lexically rich the text is. In other words, how repetitive are your top songs?

              </p>
                
              <div className='flex items-center space-x-3 mt-10'>
                <h2 className="text-xl font-bold text-white mb-4">Average MTLD</h2>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                    <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                    rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 p-2 pointer-events-none">
                    A high MTLD score is greater than 60 and a low score is less than 30.
                    How does your average compare?
                    </div>
                </div>
                </div>   
                             
                  <div className="flex items-center space-x-6">
                    <div className="text-xl">{lexicalAvg.toFixed(3)}</div>
                  </div>

                <div className="flex items-center space-x-3 mt-10">
                  <h2 className="text-xl font-bold text-white mb-4">Most Lexically Rich Tracks</h2>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                    <div className="absolute left-0 bottom-0 ml-6 w-64 bg-green-500 text-black text-md font-semibold 
                      rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                      duration-200 p-2 pointer-events-none z-10">
                      These are your top 5 tracks with the most varied vocabulary and linguistic richness.
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    layout="vertical"
                    data={currentData.mostLexicalRich}
                    margin={{ top: 20, right: 30, left: 15, bottom: 20 }}
                    barCategoryGap="15%"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, 'dataMax + 5']}
                      tick={{ fill: "#ffffff" }}
                      label={{ value: "MTLD Score", position: "insideBottomRight", fill: "#ffffff", offset: 0 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "#ffffff", fontSize: 14 }}
                      interval={0}
                      width={180}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="mtld" fill="#1DB954" name="MTLD Score" />
                  </BarChart>
                </ResponsiveContainer>








            </div>
        
         <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">

         <div className='flex items-center space-x-3'>
                <h2 className="text-2xl font-bold text-white mb-4">Top Tracks</h2>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                    <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                    rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 p-2 pointer-events-none">
                    Hover over a track to see its individual sentiment and MLTD scores!
                    </div>
                </div>
                </div>   

            <ul className="relative space-y-6 mt-6">
                {currentData.topTracks?.map((track, index) => (
                    <li key={index} 
                    className="flex items-center space-x-4 text-gray-300 max-h-[45px]"
                    onMouseEnter={() => setHoveredTrack(track.name)} // Set hovered track on mouse enter
                    onMouseLeave={() => setHoveredTrack(null)} // Reset when mouse leaves
                    >

                          {/* Artist info */}
                        <div className="text-xl">{index + 1}  </div>
                        {/* Artist image */}
                        <img
                            src={track.image}
                            alt={`${track.name} artist`}
                            className="w-12 h-12 rounded shadow"
                        />
                        <div className="flex justify-between w-full">
                        <div>
                            <div className="text-xl"> {track.name}</div>
                            <div className="text-md text-gray-400"> {track.artist}</div>
                            
                        </div>
                        {hoveredTrack === track.name && track.sentiment && (
                            <div className="absolute right-0 bg-green-500 text-black font-semibold p-2 rounded shadow-lg">
                              Pos: {track.sentiment.pos}, Neg: {track.sentiment.neg}, MTLD: {(track.lexicalRichness.mtld)}
                            </div>
                          )}
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
