import { React, useEffect, useState } from "react";
import axios from "axios";

const Playlists = () => {
    const [playlists, setPlaylists] = useState([]);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get("user_id");
        
        axios.get("http://localhost:5000/user-playlists", {
            params: { user_id: userId }
        })
        .then((response) => {
            setPlaylists(response.data);
        })
        .catch((error) => {
            console.error("Error fetching playlists:", error);
        });
    }, []);
    

    return (
        <div className="mt-8 ml-32 mr-16">
            <h2 className="text-3xl font-bold mb-6">Your Playlists</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {playlists.map((playlist, index) => (
                    <a
                        key={index}
                        href={playlist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-green-700 transition duration-300"
                    >
                        {playlist.image && (
                            <img
                                src={playlist.image}
                                alt={playlist.name}
                                className="w-full h-12 object-cover rounded mb-4"
                                style={{ width: '100%', height: 'auto', aspectRatio: '1/1' }}
                            />
                        )}
                        <h3 className="text-xl font-semibold">{playlist.name}</h3>
                        <p className="text-gray-400">{playlist.tracks_total} tracks</p>
                    </a>
                ))}
            </div>
        </div>
    );
    
};

export default Playlists;



