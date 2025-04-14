import { React, useEffect, useState, useCallback } from "react";
import { Routes, Route, Link , useLocation } from "react-router-dom";
import axios from "axios";
import SpotilyticsIcon from "../images/Spotilytics.png";
import TopSongs from "./TopSongs";
import Playlists from "./Playlists";
import { Info } from "lucide-react";


const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [topData, setTopData] = useState({ topTracks: [], topArtists: [], 
        artistPopularity: 0, trackPopularity: 0})
    const location = useLocation();
    const [timeRange, setTimeRange] = useState("long_term");
    const [activePage, setActivePage] = useState("")

    const fetchUserData = useCallback(async () => {
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

            // Fetch user's top tracks and artists with selected time range
            const topDataResponse = await axios.get("http://localhost:5000/user-top", {
                params: { user_id: userId, time_range: timeRange }
            });
            setTopData(topDataResponse.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange]);

        // refetch when time range changes
        useEffect(() => { fetchUserData();}, [fetchUserData]);
    

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
                            className={`px-6 py-2 bg-gray-900 text-white font-semibold rounded-full transition 
                            duration-300 hover:bg-green-500 hover:text-black shadow-md hover:shadow-lg
                            ${activePage === "overview" ? "bg-green-500 text-black" : "bg-gray-900"}`}
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
                            className={`px-6 py-2 bg-gray-900 text-white font-semibold rounded-full transition 
                            duration-300 hover:bg-green-500 hover:text-black shadow-md hover:shadow-lg
                            ${activePage === "top_tracks" ? "bg-green-500 text-black" : "bg-gray-900"}`}
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
                            className={`px-6 py-2 bg-gray-900 text-white font-semibold rounded-full transition 
                            duration-300 hover:bg-green-500 hover:text-black shadow-md hover:shadow-lg
                            ${activePage === "playlists" ? "bg-green-500 text-black" : "bg-gray-900"}`}
                        >
                            Playlists
                        </Link>
                    ) : (
                        <span>Loading...</span>
                    )}
                    
                </div>

                {/* User profile pic and name */}
                {user ? (
                    <div className="flex items-center space-x-4 mr-10 font-semibold">
                        {user.images?.[0]?.url && (
                            <img src={user.images[0].url} alt="Profile" className="w-10 h-10 rounded-full" />
                        )}
                        <span>{user.display_name}</span>
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
                        <img src={user?.images[0].url} alt="Profile" className="w-20 h-20 ml-20 rounded-full" />
                        <h1 className="text-5xl font-bold ml-16 w-1/3">
                            Welcome, {user?.display_name}!
                        </h1>

                        <div className="flex space-x-4 mb-3 mt-3 ml-16 max-h-[130px] w-1/4">
                            <button 
                                onClick={() => setTimeRange("short_term")} 
                                className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "short_term" ? "bg-green-500 text-black" : "bg-gray-900"} transition 
                                    duration-300 hover:bg-green-500 hover:text-black text-white font-semibold`}>
                                Last Month
                            </button>
                            <button 
                                onClick={() => setTimeRange("medium_term")} 
                                className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "medium_term" ? "bg-green-500 text-black" : "bg-gray-900"} transition 
                                    duration-300 hover:bg-green-500 hover:text-black text-white font-semibold`}>
                                Last 6 Months
                            </button>
                            <button 
                                onClick={() => setTimeRange("long_term")} 
                                className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "long_term" ? "bg-green-500 text-black" : "bg-gray-900"}  transition 
                                    duration-300 hover:bg-green-500 hover:text-black text-white font-semibold`}>
                                Last 12 Months
                            </button>
                        </div>


                        <div className="relative bg-gray-900 p-6 rounded-lg shadow-md w-1/4 max-h-[130px]">
                            {/* Info Icon in Top Right */}
                            <div className="absolute top-3 right-3">
                                <div className="relative group">
                                <Info className="w-4 h-4 text-white cursor-pointer" />
                                <div className="absolute right-0 mt-1 w-56 bg-green-400 text-black text-md font-semibold 
                                rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                                duration-200 z-10 p-2 pointer-events-none">
                                Popularity is rated from 0 to 100 based on Spotify's internal metrics.
                                Here are the average ratings for your top tracks and artists!
                                </div>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">Popularity Ratings</h2>
                            <p className="text-gray-300">
                                🎵 Top Tracks Popularity: {topData.trackPopularity}/100
                            </p>
                            <p className="text-gray-300">
                                🎤 Top Artists Popularity: {topData.artistPopularity}/100
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
                                    {topData.topArtists?.map((artist, index) => (
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
                                    {topData.topTracks?.map((track, index) => (
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
