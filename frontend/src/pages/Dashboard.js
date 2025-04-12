import { React, useEffect, useState, useCallback } from "react";
import { Routes, Route, Link , useLocation } from "react-router-dom";
import axios from "axios";
import SpotilyticsIcon from "../images/Spotilytics.png";
import Language from "./Language";
import Playlists from "./Playlists";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [topData, setTopData] = useState({ topTracks: [], topArtists: [], 
        artistPopularity: 0, trackPopularity: 0})
    const location = useLocation();
    const [timeRange, setTimeRange] = useState("long_term");
    const [userId, setUserId] = useState(null);

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
    }, [timeRange]);

        // refetch when time range changes
        useEffect(() => { fetchUserData();}, [fetchUserData]);
    

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation Bar */}
            <nav className="bg-black p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center justify-center space-x-4 ml-3">
                    <img src={SpotilyticsIcon} alt="logo" width="150" height="200" />
                </div>

                {/* User profile pic and name */}
                {user ? (
                    <div className="flex items-center space-x-4 mr-10">
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



                    <div className="flex justify-between space-x-6 ml-32 mr-16">
                        <h1 className="text-5xl font-bold mt-16 ml-16 w-1/2">
                            Welcome, {user?.display_name}!
                        </h1>

                        <div className="flex space-x-4 mt-6 ml-16">
                            <button 
                                onClick={() => setTimeRange("short_term")} 
                                className={`px-4 py-2 rounded-full ${timeRange === "short_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
                                Last 3 Months
                            </button>
                            <button 
                                onClick={() => setTimeRange("medium_term")} 
                                className={`px-4 py-2 rounded-full ${timeRange === "medium_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
                                Last 6 Months
                            </button>
                            <button 
                                onClick={() => setTimeRange("long_term")} 
                                className={`px-4 py-2 rounded-full ${timeRange === "long_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
                                Last 12 Months
                            </button>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/3">
                            <h2 className="text-2xl font-bold text-white mb-4">Popularity Ratings</h2>
                            <p className="text-gray-300">🎵 Top Songs Popularity: {topData.trackPopularity}/100</p>
                            <p className="text-gray-300">🎤 Top Artists Popularity: {topData.artistPopularity}/100</p>
                        </div>

                    </div>
                    )}
                </div>


                <div className="flex space-x-6 mt-10 ml-32">
                    {user ? (
                        <Link 
                            to={`/dashboard?user_id=${user.id}`}
                            className="px-6 py-2 bg-gray-900 text-white rounded-full transition 
                            duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                        >
                            Overview
                        </Link>
                    ) : (
                        <span>Loading...</span>
                    )}
                    <Link 
                        to={`/dashboard/language?user_id=${userId}`} 
                        className="px-6 py-2 bg-gray-900 text-white rounded-full transition 
                        duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                    >       
                        Language
                    </Link>
                    {user ? (
                        <Link 
                            to={`/dashboard/playlists?user_id=${user.id}`}
                            className="px-6 py-2 bg-gray-900 text-white rounded-full transition 
                            duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                        >
                            Playlists
                        </Link>
                    ) : (
                        <span>Loading...</span>
                    )}
                    
                </div>

                <div>
                    {location.pathname === "/dashboard" && (
                        <div className="flex justify-between space-x-6 mt-12 ml-32 mr-16">
                            {/* Top Artists */}
                            <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">
                                <h2 className="text-2xl font-bold text-white mb-4">Top Artists</h2>
                                <ul className="space-y-4">
                                    {topData.topArtists?.map((artist, index) => (
                                        <li key={index} className="flex items-center space-x-4 text-gray-300">
                                            {/* Artist image */}
                                            <img
                                                src={artist.image}
                                                alt={`${artist.name} artist`}
                                                className="w-12 h-12 rounded shadow"
                                            />
                                            
                                            {/* Artist info */}
                                            <div>
                                                <div className="font-semibold">{index + 1}. {artist.name}</div>
                                            </div>
                                            
                                        
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Top Tracks */}
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
                    )}
                </div>



                <Routes>
                    <Route path="language" element={<Language />} />
                    <Route path="playlists" element={<Playlists />} />
                    
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
