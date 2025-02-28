import { React, useEffect, useState } from "react";
import { Routes, Route, Link , useLocation } from "react-router-dom";
import axios from "axios";
import Spotilytics from "../images/Spotilytics.ico";
import Language from "./Language";
import Musicality from "./Musicality";
import MusicTheory from "./MusicTheory";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [topData, setTopData] = useState({ topTracks: [], topArtists: [], topAlbums: [] });

    const location = useLocation();

    useEffect(() => {
        const fetchUserData = async () => {
            const params = new URLSearchParams(window.location.search);
            const userId = params.get('user_id');
            // console.log("Extracted userId:", userId);

            if (!userId) {
                console.error("No user_id found in URL");
                return;
            }

            try {
                // Fetch user profile data
                const userResponse = await axios.get('http://localhost:5000/user', {
                    params: { user_id: userId }
                });
                // console.log("Fetched user data via axios:", userResponse.data);
                setUser(userResponse.data);

                // Fetch user's top tracks, artists, and albums
                const topDataResponse = await axios.get("http://localhost:5000/user-top", {
                    params: { user_id: userId }
                });
                // console.log("Fetched user top data:", topDataResponse.data);
                setTopData(topDataResponse.data);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchUserData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Navigation Bar */}
            <nav className="bg-gray-900 p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center space-x-4 ml-10 mt-10">
                    <img src={Spotilytics.ico} alt="logo" className="w-10 h-10" />
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
                        <h1 className="text-5xl font-bold mt-16 ml-32">
                            Welcome, {user?.display_name}!
                        </h1>
                    )}
                </div>


                <div className="flex space-x-6 mt-10 ml-32">
                    <Link 
                        to="/dashboard" 
                        className="px-6 py-2 bg-gray-600 text-white rounded-full transition 
                        duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                    >
                        Overview
                    </Link>
                    <Link 
                        to="/dashboard/language" 
                        className="px-6 py-2 bg-gray-600 text-white rounded-full transition 
                        duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                    >
                        Language
                    </Link>
                    <Link 
                        to="/dashboard/musicality"
                        className="px-6 py-2 bg-gray-600 text-white rounded-full transition 
                        duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                    >
                        Musicality
                    </Link>
                    <Link 
                        to="/dashboard/musictheory"
                        className="px-6 py-2 bg-gray-600 text-white rounded-full transition 
                        duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                    >
                        Music Theory
                    </Link>
                </div>

                <div className="flex justify-between space-x-6 mt-12 ml-32 mr-16">
                    {/* Top Artists */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-1/3">
                        <h2 className="text-2xl font-bold text-white mb-4">Top Artists</h2>
                        <ul className="space-y-2">
                            {topData.topArtists?.map((artist, index) => (
                                <li key={index} className="text-gray-300">{index + 1}. {artist.name} </li>
                            ))}
                        </ul>
                    </div>

                    {/* Top Albums */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-1/3">
                        <h2 className="text-2xl font-bold text-white mb-4">Top Albums</h2>
                        <ul className="space-y-2">
                            {topData.topAlbums?.map((album, index) => (
                                <li key={index} className="text-gray-300">{index + 1}. {album}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Top Tracks */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-1/3">
                        <h2 className="text-2xl font-bold text-white mb-4">Top Tracks</h2>
                        <ul className="space-y-2">
                            {topData.topTracks?.map((track, index) => (
                                <li key={index} className="text-gray-300">{index + 1}. {track.name} - {track.artist}</li>
                            ))}
                        </ul>
                    </div>
                </div>



                <Routes>
                    <Route path="language" element={<Language />} />
                    <Route path="musicality" element={<Musicality />} />
                    <Route path="musictheory" element={<MusicTheory />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
