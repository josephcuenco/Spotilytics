import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from "axios";

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistselected, setPlaylistselected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [languageDistribution, setLanguageDistribution] = useState(null);
  const [languageLoading, setLanguageLoading] = useState(false);

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
            {languageLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-green-500 border-dashed rounded-full animate-spin"></div>
              </div>
            ) : languageDistribution && !languageDistribution.error ? (
              <div className="bg-gray-900 p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-2xl font-bold text-white mb-4">Language Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(languageDistribution).map(([language, value]) => ({
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
                      {Object.keys(languageDistribution).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-400 mt-6">{languageDistribution?.error || "No language data available."}</p>
            )}
            </div>
        ) : (loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-green-500 border-dashed rounded-full animate-spin"></div>
          </div>
          ) : (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Pick a playlist!</h2>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {playlists.map((playlist, index) => (
                      <div
                      key={index}
                      onClick={async () => {
                        setSelectedPlaylist(playlist);
                        setPlaylistselected(true);
                        setLanguageLoading(true);
                        setLanguageDistribution(null); // reset
                      
                        const params = new URLSearchParams(window.location.search);
                        const userId = params.get("user_id");
                      
                        try {
                          const res = await axios.get("http://localhost:5000/playlist-lyrics", {
                            params: {
                              playlist_id: playlist.id,
                              user_id: userId
                            }
                          });
                      
                          let data = res.data.languages || {};
                          let sum = 0;
                          for (const lang in data) {
                            if (data[lang] < 0.9) {
                              delete data[lang];
                            }
                            if (data[lang]) {
                              sum += data[lang];
                            }
                          }
                          const localUncertain = Math.max(0, 100 - sum);
                          data["Uncertain"] = Number(localUncertain.toFixed(2));
                      
                          setLanguageDistribution(data);
                        } catch (error) {
                          console.error("Error fetching language distribution:", error);
                          setLanguageDistribution({ error: "Could not fetch language data." });
                        } finally {
                          setLanguageLoading(false);
                        }
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
