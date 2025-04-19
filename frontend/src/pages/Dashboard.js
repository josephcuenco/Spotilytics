import { React, useEffect, useState, useRef} from "react";
import { Routes, Route, Link , useLocation } from "react-router-dom";
import axios from "axios";
import SpotilyticsIcon from "../images/Spotilytics.png";
import TopSongs from "./TopSongs";
import Playlists from "./Playlists";
import { Info } from "lucide-react";
import { useTopData } from "./TopDataContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const {
        topDataShort, setTopDataShort,
        topDataMedium, setTopDataMedium,
        topDataLong, setTopDataLong,
        topDataFetched, setTopDataFetched,
        setAllDataFetched
      } = useTopData();
    
    const [currentData, setCurrentData] = useState({ topTracks: [], topArtists: [], 
        artistPopularity: 0, trackPopularity: 0})
    const location = useLocation();
    const [timeRange, setTimeRange] = useState("");
    const [activePage, setActivePage] = useState("")
    const dropdownRef = useRef(null); 
    const [dataStored, setDataStored] = useState(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


    //handles clicking outside of dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setOpen(false);
          }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

    const handleLogout = () => {
        navigate("/");
    };

    //stores top track data in context
    useEffect(() => {
        async function storeUserData() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get("user_id");


        if (!userId) {
            console.error("No user_id found in URL");
            return;
        }

        try {
            // Fetch user profile data
            const userResponse = await axios.get("http://localhost:5000/user", {
                params: { user_id: userId }
            });
            setUser(userResponse.data);

            // store user's top tracks and artists 
            if(!dataStored){
                let topDataResponse = await axios.get("http://localhost:5000/store-user-top-data", {
                    params: { user_id: userId, time_range: "short_term"}
                });
                setTopDataShort(topDataResponse.data);
                topDataResponse = await axios.get("http://localhost:5000/store-user-top-data", {
                    params: { user_id: userId, time_range: "medium_term"}
                });
                setTopDataMedium(topDataResponse.data);
                topDataResponse = await axios.get("http://localhost:5000/store-user-top-data", {
                    params: { user_id: userId, time_range: "long_term"}
                });
                setTopDataLong(topDataResponse.data);

                setDataStored(true);
            }
            setTimeRange("short_term");

        } catch (error) {
            console.error("Error fetching data:", error);
        }        
    }
    storeUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    //sets current data based on time range
    useEffect(() => {
        let topData;
        if(timeRange === "short_term"){
            topData = topDataShort;
        } else if(timeRange === "medium_term"){
            topData = topDataMedium;
        } else {
            topData = topDataLong;
        }
        
        setCurrentData(topData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange]);


    //fetches language distributions for top tracks and stores in context
    //THIS IS SEQUENTIAL BECAUSE IT DOES NOT WORK IN PARALLEL OR LOOPED
    const fetchLanguageDistributions = async () => {
    const languageData = {};
    
        try {
        const response = await axios.get("http://localhost:5000/get_top_songs_language_distribution", {
            params: {
            time_range: "short_term",
            user_id: user.id
            }
        });
    
        const data = response.data;

        let sum = 0;
        for (const lang in data.languages) {
            if (data.languages[lang] < 0.9) {
            delete data.languages[lang];
            } else {
            sum += data.languages[lang];
            }
        }
    
        const localUncertain = Math.max(0, 100 - sum);
        data.languages["Uncertain"] = Number(localUncertain.toFixed(2));
    
        // Save cleaned distribution per time range
        languageData["short_term"] = data.languages;
    
        } catch (error) {
        console.error(`Failed to fetch language distribution for ${"short_term"}:`, error);
        }

        try {
        const response = await axios.get("http://localhost:5000/get_top_songs_language_distribution", {
            params: {
            time_range: "medium_term",
            user_id: user.id
            }
        });
    
        const data = response.data;

        let sum = 0;
        for (const lang in data.languages) {
            if (data.languages[lang] < 0.9) {
            delete data.languages[lang];
            } else {
            sum += data.languages[lang];
            }
        }
    
        const localUncertain = Math.max(0, 100 - sum);
        data.languages["Uncertain"] = Number(localUncertain.toFixed(2));
    
        // Save cleaned distribution per time range
        languageData["medium_term"] = data.languages;
    
        } catch (error) {
        console.error(`Failed to fetch language distribution for ${"medium_term"}:`, error);
        }

        try {
        const response = await axios.get("http://localhost:5000/get_top_songs_language_distribution", {
            params: {
            time_range: "long_term",
            user_id: user.id
            }
        });
    
        const data = response.data;

        let sum = 0;
        for (const lang in data.languages) {
            if (data.languages[lang] < 0.9) {
            delete data.languages[lang];
            } else {
            sum += data.languages[lang];
            }
        }
    
        const localUncertain = Math.max(0, 100 - sum);
        data.languages["Uncertain"] = Number(localUncertain.toFixed(2));
    
        // Save cleaned distribution per time range
        languageData["long_term"] = data.languages;
    
        } catch (error) {
        console.error(`Failed to fetch language distribution for ${"long_term"}:`, error);
        }
    setTopDataFetched(true);

    return languageData;
    };
    
    //fetches lyrics for top tracks in groups of 5and stores in context
    const fetchLyricsInChunks = async (tracks, chunkSize = 5, delay = 1000, setTopData) => {
        for (let i = 0; i < tracks.length; i += chunkSize) {
          const chunk = tracks.slice(i, i + chunkSize);
      
          const chunkResults = await Promise.all(chunk.map(async (track) => {
            if (track.lyrics) return track;
      
            try {
              const response = await axios.get("http://localhost:5000/get-lyrics", {
                params: {
                  name: track.name,
                  artist: track.artist
                }
              });
      
              return {
                ...track,
                lyrics: response.data.lyrics || "No lyrics found"
              };
            } catch (error) {
              console.error(`Error for ${track.name}:`, error);
              return {
                ...track,
                lyrics: "Error fetching lyrics"
              };
            }
          }));
      
          // merge the new lyrics into the existing state
          setTopData(prev => {
            const updatedTracks = prev.topTracks.map(track => {
              const updated = chunkResults.find(t => t.name === track.name && t.artist === track.artist);
              return updated ? updated : track;
            });
            return {
              ...prev,
              topTracks: updatedTracks
            };
          });
      
          if (i + chunkSize < tracks.length) {
            await sleep(delay);
          }
        }
      };
      

      const fetchSentiment = async () => {
        try {
          const response = await axios.get("http://localhost:5000/get-sentiment", {
            params: {
              user_id: user.id,
            },
          });
          
          const sentimentData = response.data;
          let mostPositive = {"short_term":[], "medium_term":[], "long_term":[]};
          let mostNegative = {"short_term":[], "medium_term":[], "long_term":[]};


          const updateTracksWithSentiment = (originalTracks, sentimentTracks, timeRange) => {
            return originalTracks.map((track) => {
              const match = sentimentTracks.find(
                (sTrack) =>
                  sTrack.name === track.name &&
                  (!sTrack.artist || sTrack.artist === track.artist)
              );

              // Top 5 most positive by sentiment.pos
                if (match.sentiment?.pos > 0) {
                    mostPositive[timeRange].push(match);
                    mostPositive[timeRange].sort((a, b) => b.sentiment.pos - a.sentiment.pos);
                    if (mostPositive[timeRange].length > 5) {
                    mostPositive[timeRange].pop(); // remove weakest positive
                    }
                }
                
                // Top 5 most negative by sentiment.neg
                if (match.sentiment?.neg > 0) {
                    mostNegative[timeRange].push(match);
                    mostNegative[timeRange].sort((a, b) => b.sentiment.neg - a.sentiment.neg);
                    if (mostNegative[timeRange].length > 5) {
                    mostNegative[timeRange].pop(); // remove weakest negative
                    }
                }
  


              return match
                ? {
                    ...track,
                    sentiment: match.sentiment, // Add sentiment data
                  }
                : track;
            });
          };
      
          setTopDataShort((prev) => ({
            ...prev,
            topTracks: updateTracksWithSentiment(prev.topTracks, sentimentData.short_term, "short_term"),
            mostPositiveSent: mostPositive["short_term"],
            mostNegativeSent: mostNegative["short_term"]
          }));
      
          setTopDataMedium((prev) => ({
            ...prev,
            topTracks: updateTracksWithSentiment(prev.topTracks, sentimentData.medium_term, "medium_term"),
            mostPositiveSent: mostPositive["medium_term"],
            mostNegativeSent: mostNegative["medium_term"]
          }));
      
          setTopDataLong((prev) => ({
            ...prev,
            topTracks: updateTracksWithSentiment(prev.topTracks, sentimentData.long_term, "long_term"),
            mostPositiveSent: mostPositive["long_term"],
            mostNegativeSent: mostNegative["long_term"]
          }));

          
          return response.data;
        } catch (error) {
          console.error(`Error fetching sentiment:`, error);
        }
      };


      const fetchWordClouds = async () => {
        if (!user?.id) return;
      
        try {
          const response = await axios.get("http://localhost:5000/get-wordclouds", {
            params: { user_id: user.id },
          });
      
          const { short_term, medium_term, long_term } = response.data;
      
          setTopDataShort(prev => ({ ...prev, wordCloud: short_term }));
          setTopDataMedium(prev => ({ ...prev, wordCloud: medium_term }));
          setTopDataLong(prev => ({ ...prev, wordCloud: long_term }));
        } catch (error) {
          console.error("Error fetching word clouds:", error);
        }
      };      


      const fetchLexicalRichness = async () => {
        try {
          const response = await axios.get("http://localhost:5000/get-top-songs-lex-richness", {
            params: {
              user_id: user.id,
            },
          });
      
          const lexicalData = response.data;
          let mostRich = { short_term: [], medium_term: [], long_term: [] };
      
          const updateTracksWithLexical = (originalTracks, lexicalTracks, timeRange) => {
            return originalTracks.map((track) => {
              const match = lexicalTracks.find(
                (lTrack) =>
                  lTrack.name === track.name &&
                  (!lTrack.artist || lTrack.artist === track.artist)
              );
      
              // Top 5 by MTLD (lexical richness)
              if (match?.mtld > 0) {
                mostRich[timeRange].push(match);
                mostRich[timeRange].sort((a, b) => b.mtld - a.mtld);
                if (mostRich[timeRange].length > 5) {
                  mostRich[timeRange].pop(); // Remove weakest rich entry
                }
              }
      
              return match
                ? {
                    ...track,
                    lexicalRichness: {
                      mtld: match.mtld,
                      hdd: match.hdd,
                      mattr: match.mattr,
                    },
                  }
                : track;
            });
          };
      
          setTopDataShort((prev) => ({
            ...prev,
            topTracks: updateTracksWithLexical(prev.topTracks, lexicalData.short_term, "short_term"),
            mostLexicalRich: mostRich["short_term"]
          }));
      
          setTopDataMedium((prev) => ({
            ...prev,
            topTracks: updateTracksWithLexical(prev.topTracks, lexicalData.medium_term, "medium_term"),
            mostLexicalRich: mostRich["medium_term"]
          }));
      
          setTopDataLong((prev) => ({
            ...prev,
            topTracks: updateTracksWithLexical(prev.topTracks, lexicalData.long_term, "long_term"),
            mostLexicalRich: mostRich["long_term"]
          }));
      
          return lexicalData;
        } catch (error) {
          console.error(`Error fetching lexical richness:`, error);
        }
      };


      const fetchProfanity = async () => {
        try {
          const response = await axios.get("http://localhost:5000/get-top-songs-profanity", {
            params: {
              user_id: user.id,
            },
          });
      
          const profanityData = response.data;
          let mostProfane = { short_term: [], medium_term: [], long_term: [] };
      
          const updateTracksWithProfanity = (originalTracks, profanityTracks, timeRange) => {
            return originalTracks.map((track) => {
              const match = profanityTracks.find(
                (pTrack) =>
                  pTrack.name === track.name &&
                  (!pTrack.artist || pTrack.artist === track.artist)
              );
      
              if (match?.profane_word_count > 0) {
                mostProfane[timeRange].push(match);
                mostProfane[timeRange].sort((a, b) => b.profane_word_count - a.profane_word_count);
                if (mostProfane[timeRange].length > 5) {
                  mostProfane[timeRange].pop(); 
                }
              }
      
              return match
                ? {
                    ...track,
                    profanity: {
                      profane_word_count: match.profane_word_count,
                      profanity_ratio: match.profanity_ratio,
                    },
                  }
                : track;
            });
          };
      
          setTopDataShort((prev) => ({
            ...prev,
            topTracks: updateTracksWithProfanity(prev.topTracks, profanityData.short_term, "short_term"),
            mostProfane: mostProfane["short_term"]
          }));
      
          setTopDataMedium((prev) => ({
            ...prev,
            topTracks: updateTracksWithProfanity(prev.topTracks, profanityData.medium_term, "medium_term"),
            mostProfane: mostProfane["medium_term"]
          }));
      
          setTopDataLong((prev) => ({
            ...prev,
            topTracks: updateTracksWithProfanity(prev.topTracks, profanityData.long_term, "long_term"),
            mostProfane: mostProfane["long_term"]
          }));
      
          return profanityData;
        } catch (error) {
          console.error(`Error fetching profanity data:`, error);
        }
      };
      
      


    //stores all lyrics and language distributions in context
    useEffect(() => {
    const fetchAllLyricsAndDistributions = async () => {
        if (topDataFetched) return; // stops duplicate fetches
        if (!topDataShort.topTracks || !topDataMedium.topTracks || !topDataLong.topTracks) return;
        if(!user)return;

        await fetchLyricsInChunks(topDataShort.topTracks, 5, 1000, setTopDataShort);
        await fetchLyricsInChunks(topDataMedium.topTracks, 5, 1000, setTopDataMedium);
        await fetchLyricsInChunks(topDataLong.topTracks, 5, 1000, setTopDataLong);

        const languageDistributions = await fetchLanguageDistributions();
        await fetchSentiment();
        await fetchWordClouds();
        await fetchLexicalRichness();
        await fetchProfanity();


        setTopDataShort(prev => ({
        ...prev,
        languageDistribution: languageDistributions.short_term || {},
        }));
    
        setTopDataMedium(prev => ({
        ...prev,
        languageDistribution: languageDistributions.medium_term || {},
        }));
    
        setTopDataLong(prev => ({
        ...prev,
        languageDistribution: languageDistributions.long_term || {},
        }));

        setAllDataFetched(true);
    
    };
    
    fetchAllLyricsAndDistributions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataStored]);



    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation Bar */}
            <nav className="bg-black p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center justify-center space-x-6 ml-10">
                    <img src={SpotilyticsIcon} alt="logo" width="150" height="200" />
                
                    {user ? (
                        <Link 
                            to={`/dashboard?user_id=${user.id}`}
                            onClick={() => setActivePage("overview")}
                            className={`px-6 py-2 bg-gray-900 font-semibold rounded-full transition 
                            duration-300 hover:bg-green-500 hover:text-black shadow-md hover:shadow-lg
                            ${activePage === "overview" ? "bg-green-500 text-black" : "bg-gray-900 text-white"}`}
                        >
                            Overview
                        </Link>
                    ) : (
                        <span>Loading...</span>
                    )}
                    {user ? (
                        <Link 
                            to={`/dashboard/topsongs?user_id=${user.id}`}
                            onClick={() => setActivePage("top_tracks")}
                            className={`px-6 py-2 bg-gray-900 font-semibold rounded-full transition 
                            duration-300 hover:bg-green-500 hover:text-black shadow-md hover:shadow-lg
                            ${activePage === "top_tracks" ? "bg-green-500 text-black" : "bg-gray-900 text-white"}`}
                        >
                            Top Tracks
                        </Link>
                    ) : (
                        <span>Loading...</span>
                    )}
                    {user ? (
                        <Link 
                            to={`/dashboard/playlists?user_id=${user.id}`}
                            onClick={() => setActivePage("playlists")}
                            className={`px-6 py-2 bg-gray-900 font-semibold rounded-full transition 
                            duration-300 hover:bg-green-500 hover:text-black shadow-md hover:shadow-lg
                            ${activePage === "playlists" ? "bg-green-500 text-black" : "bg-gray-900 text-white"}`}
                        >
                            Playlists
                        </Link>
                    ) : (
                        <span>Loading...</span>
                    )}
                    
                </div>

                {/* User profile pic and name */}
                {user ? (
                        <div>
                        {/* Profile image (click to toggle dropdown) */}
                            <div ref={dropdownRef} className="flex items-center space-x-5 mr-8 font-semibold">
                                {open && (
                                <div className="bg-green-500 rounded-md shadow-lg">
                                    <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm text-black hover:bg-green-400 hover:text-black rounded-md"
                                    >
                                    Logout
                                    </button>
                                </div>
                                )}

                                {user.images?.[0]?.url && (
                                    <img src={user.images[0].url} alt="Profile" className="w-10 h-10 transform transition-transform duration-200 hover:scale-110 rounded-full cursor-pointer" onClick={() => setOpen(!open)} />
                                )}
                                <span>{user.display_name}</span>
                            </div>
                            
                        </div>
                ) : (
                    <a href="http://localhost:5000/login" className="text-sm text-green-400">
                        Login with Spotify
                    </a>
                )}
            </nav>

            {/* Page Content */}
            <div className="p-6">
            
                <div>
                    {location.pathname === "/dashboard" && (



                    <div className="flex justify-between items-center space-x-6 ml-26 mt-8 mr-16">
                        <div className="flex items-center text-5xl font-bold ml-16 w-1/2">
                            <img src={user?.images[0]?.url} alt="Profile" className="w-20 h-20 ml-20 rounded-full" />
                            <h className="ml-10">Welcome, {user?.display_name}!</h>
                        </div>

                        <div className="flex space-x-4 mb-3 mt-6 ml-12 min-h-[90px] w-1/3">
                            <button 
                                onClick={() => setTimeRange("short_term")} 
                                className={`px-4 py-4 max-w-[110px] rounded-full ${timeRange === "short_term" ? "bg-green-500 text-black" : "bg-gray-900 text-white"} transition 
                                    duration-300 hover:bg-green-500 hover:text-black font-semibold`}>
                                Last Month
                            </button>
                            <button 
                                onClick={() => setTimeRange("medium_term")} 
                                className={`px-4 py-4 max-w-[110px] rounded-full ${timeRange === "medium_term" ? "bg-green-500 text-black" : "bg-gray-900 text-white"} transition 
                                    duration-300 hover:bg-green-500 hover:text-black font-semibold`}>
                                Last 6 Months
                            </button>
                            <button 
                                onClick={() => setTimeRange("long_term")} 
                                className={`px-4 py-4 max-w-[110px] rounded-full ${timeRange === "long_term" ? "bg-green-500 text-black" : "bg-gray-900 text-white"}  transition 
                                    duration-300 hover:bg-green-500 hover:text-black font-semibold`}>
                                Last 12 Months
                            </button>
                        </div>


                        <div className="relative bg-gray-900 p-6 rounded-lg shadow-md w-1/4 max-h-[130px]">
                            {/* Info Icon in Top Right */}
                            <div className="absolute top-3 right-3">
                                <div className="relative group">
                                <Info className="w-4 h-4 text-white cursor-pointer" />
                                <div className="absolute right-0 mt-1 w-56 bg-green-500 text-black text-md font-semibold 
                                rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                                duration-200 z-10 p-2 pointer-events-none">
                                Popularity is rated from 0 to 100 based on Spotify's internal metrics.
                                Here are the average ratings for your top tracks and artists!
                                </div>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">Popularity Ratings</h2>
                            <p className="text-gray-300">
                                🎵 Top Tracks Popularity: {currentData.trackPopularity}/100
                            </p>
                            <p className="text-gray-300">
                                🎤 Top Artists Popularity: {currentData.artistPopularity}/100
                            </p>
                        </div>

                    </div>
                    )}
                </div>


                <div>
                    {location.pathname === "/dashboard" && (
                        <div className="flex justify-between space-x-6 mt-16 ml-32 mr-16">
                            {/* Top Artists */}
                            <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">
                                <h2 className="text-3xl font-bold text-white mb-4">Top Artists</h2>
                                <ul className="space-y-6 mt-6">
                                    {currentData.topArtists?.map((artist, index) => (
                                        <li key={index} className="flex items-center space-x-4 text-gray-300  max-h-[45px]">
                                            
                                            {/* Artist info */}
                                            <div className="text-xl">{index + 1}  </div>
                                            {/* Artist image */}
                                            <img
                                                src={artist.image}
                                                alt={`${artist.name} artist`}
                                                className="w-12 h-12 rounded shadow"
                                            />
                                            <div className="text-xl"> {artist.name}</div>
                                            
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Top Tracks */}
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
                    )}
                </div>



                <Routes>
                    <Route path="topsongs" element={<TopSongs />} />
                    <Route path="playlists" element={<Playlists />} />
                    
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
