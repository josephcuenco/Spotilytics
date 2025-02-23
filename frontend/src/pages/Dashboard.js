import { React, useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Songs from "./Songs";
import Languages from "./Languages";
import Artists from "./Artists";
import axios from "axios";

const Dashboard = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const params = new URLSearchParams(window.location.search);
            const userId = params.get('user_id');
            console.log("Extracted userId:", userId);
            if (!userId) {
                console.error("No user_id found in URL");
                return;
            }
    
            try {
                const response = await axios.get('http://localhost:5000/user', {
                    params: { user_id: userId }
                });
                console.log("Fetched user data via axios:", response.data);
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching user data via axios:", error);
            }
        };
    
        fetchUserData();
    }, []);
    
    

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Navigation Bar */}
            <nav className="bg-gray-800 p-4 flex justify-between items-center shadow-lg">
                <div className="flex space-x-6">
                    <Link to="/dashboard/songs" className="hover:text-green-400">Songs</Link>
                    <Link to="/dashboard/languages" className="hover:text-green-400">Languages</Link>
                    <Link to="/dashboard/artists" className="hover:text-green-400">Artists</Link>
                </div>

                {/* User Info Section */}
                {user ? (
                    <div className="flex items-center space-x-4">
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
                <Routes>
                    <Route path="songs" element={<Songs />} />
                    <Route path="languages" element={<Languages />} />
                    <Route path="artists" element={<Artists />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
