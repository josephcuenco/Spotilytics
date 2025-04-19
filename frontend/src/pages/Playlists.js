import React, { useEffect, useState, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from "axios";
import { useTopData } from "./TopDataContext";
import { Info } from "lucide-react";


const Playlists = () => {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistselected, setPlaylistselected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [user_id, setUserID] = useState(null);
  const cancelFetchRef = useRef(false);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


  const {
            userPlaylists, setUserPlaylists
          } = useTopData();
  

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
    setUserID(user_id);
    if(userPlaylists.playlists.length > 0)return;

    setLoading(true); // start loading

    axios.get("http://localhost:5000/user-playlists", {
      params: { user_id: userId },
    })
    .then((response) => {
      setUserPlaylists(response.data);
    })
    .catch((error) => {
      console.error("Error fetching playlists:", error);
    }).finally(() => {
        setLoading(false); // stop loading
    });
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchLanguageDistribution = async (playlist_id) => {
    const languageData = {};
        try {
        const response = await axios.get("http://localhost:5000/get_playlist_language_distribution", {
            params: {
            "playlist_id": playlist_id,
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
        languageData["data"] = data.languages;
    
        } catch (error) {
        console.error(`Failed to fetch language distribution for playlist:`, error);
        }

    return languageData;
    };
    
    //fetches lyrics for playlist in groups of 5 
    const fetchLyricsInChunks = async (tracks, chunkSize = 5, delay = 1000, pId) => {
      let updatedTracks = tracks;

        for (let i = 0; i < tracks.length; i += chunkSize) {
          if (cancelFetchRef.current) {
            console.log("Fetch cancelled.");
            return null;
          }

          const chunk = tracks.slice(i, i + chunkSize);
      
          const chunkResults = await Promise.all(chunk.map(async (track) => {
            if (cancelFetchRef.current) {
              console.log("Fetch cancelled.");
              return null;
            }
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
      
            updatedTracks = userPlaylists.playlists.find(p => p.id === pId).tracks_preview.map(track => {
              const updated = chunkResults.find(t => t.name === track.name && t.artist === track.artist);
              return updated ? updated : track;
            });

      
          if (i + chunkSize < tracks.length) {
            await sleep(delay);
          }
        }
        return updatedTracks;
      };

      //stores all lyrics and language distributions in context
      useEffect(() => {
      const fetchPlaylistLyricsAndData = async () => {
        cancelFetchRef.current = false;
        if(!playlistselected)return;
        if (userPlaylists.playlists.some(p => p.id === selectedPlaylist.id && p.languageDistribution)) return;

          setLanguageLoading(true);
          const updatedTracks = await fetchLyricsInChunks(userPlaylists.playlists.find(p => p.id === selectedPlaylist.id).tracks_preview, 5, 1000, selectedPlaylist.id);

          if (cancelFetchRef.current) {
            console.log("Fetch cancelled.");
            return null;
          }

          setUserPlaylists(prev => ({
            ...prev,
            playlists: prev.playlists.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, tracks_preview: updatedTracks || {} }
                : playlist
            )
          }));
  
          const languageDistribution = await fetchLanguageDistribution(selectedPlaylist.id);
  
          setUserPlaylists(prev => ({
            ...prev,
            playlists: prev.playlists.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, languageDistribution: languageDistribution.data || {} }
                : playlist
            )
          }));
          
          const updated = userPlaylists.playlists.find(p => p.id === selectedPlaylist.id);
          if (updated) {
            setSelectedPlaylist({
              ...updated,
              languageDistribution: languageDistribution.data || {},
              tracks_preview: updated.tracks_preview
            });
          }
          
          setLanguageLoading(false);
      };
      
      fetchPlaylistLyricsAndData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [playlistselected]);







  return (
    <div className="flex mt-8 ml-32 mr-16 space-x-12">
      {/* Left Side: Playlist Grid */}
      <div className="w-1/2">
        {playlistselected ? (
            <div>
            <button onClick={() => {
              setPlaylistselected(false);
              setSelectedPlaylist(null);
              cancelFetchRef.current = true; // Cancel  in-progress fetch

            }}
                className="px-6 py-2 bg-gray-900 text-white rounded-full transition duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                >Back</button>
            {languageLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-green-500 border-dashed rounded-full animate-spin"></div>
              </div>
            ) : selectedPlaylist.languageDistribution && !selectedPlaylist.languageDistribution.error ? (
              <div className="bg-gray-900 p-6 rounded-lg shadow-md mt-6">

                <div className='flex items-center space-x-3'>
                <h2 className="text-2xl font-bold text-white mb-4">Language Distribution</h2>
                    <div className="relative group">
                  <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                  <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                  rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                  duration-200 p-2 pointer-events-none">
                  Spotilytics' language detection is not perfect, which is why there is an uncertain percentage!
                  P.S. If the distribution looks wrong, try pressing back and returning to the playlist.
                  </div>
                </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(selectedPlaylist.languageDistribution).map(([language, value]) => ({
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
                      {Object.keys(selectedPlaylist.languageDistribution).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-400 mt-6">{selectedPlaylist.languageDistribution?.error || "No language data available."}</p>
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
                      {userPlaylists.playlists.map((playlist, index) => (
                      <div
                      key={index}
                      onClick={async () => {
                        setSelectedPlaylist(playlist);
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
                  <p className="text-white font-medium">{track.name}</p>
                  <p className="text-gray-400 text-sm">{track.artist}</p>
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
