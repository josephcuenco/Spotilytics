import React, { useEffect, useState } from "react";
import axios from "axios";

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistselected, setPlaylistselected] = useState(false);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user_id");

    setLoading(true); // start loading

    axios.get("http://localhost:5000/user-playlists", {
      params: { user_id: userId },
    })
    .then((response) => {
      setPlaylists(response.data);
    })
    .catch((error) => {
      console.error("Error fetching playlists:", error);
    }).finally(() => {
        setLoading(false); // stop loading
    });
  }, []);

  return (
    <div className="flex mt-8 ml-32 mr-16 space-x-12">
      {/* Left Side: Playlist Grid */}
      <div className="w-1/2">
        {playlistselected ? (
            <div>
            <button onClick={() => setPlaylistselected(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-full transition duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                >Back</button>

            <p className="mt-16"> DATA GOES HERE</p>
            </div>
        ) : (loading ? (
            <p className="text-lg text-gray-400">Loading playlists...</p>
          ) : (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Pick a playlist!</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {playlists.map((playlist, index) => (
                                    <div
                                    key={index}
                                    onClick={() => {setSelectedPlaylist(playlist);
                                        setPlaylistselected(true);
                                    }}
                                    className="cursor-pointer m-h-[300px] bg-gray-900 p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-green-700 transition duration-300"
                                    >
                                    {playlist.image && (
                                        <img
                                        src={playlist.image}
                                        alt={playlist.name}
                                        className="w-full h-10 object-cover rounded mb-4"
                                        style={{ width: '100%', height: '300px', aspectRatio: '1/1' }}
                                        />
                                    )}
                                    <h3 className="text-xl font-semibold">{playlist.name}</h3>
                                    <p className="text-gray-400">{playlist.tracks_total} tracks</p>
                                    </div>
                                ))}
                            </div>
                 </div>
          )
            )}
      </div>

      {/* Right Side: Tracks from Selected Playlist */}
      <div className="w-1/2">
        {selectedPlaylist ? (
          <>
            <h2 className="text-2xl font-semibold mb-4">
              Preview of tracks in "{selectedPlaylist.name}"
            </h2>
            <ul className="space-y-3">
              {selectedPlaylist.tracks_preview?.map((track, idx) => (
                <li key={idx} className="bg-gray-900 p-3 rounded-lg">
                  <p className="text-white font-medium">{track.track_name}</p>
                  <p className="text-gray-400 text-sm">by {track.artist_name}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-500 text-lg mt-12">Click on a playlist to see its tracks</p>
        )}
      </div>
    </div>
  );
};

export default Playlists;
