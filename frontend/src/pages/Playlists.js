import React, { useEffect, useState, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
  import axios from "axios";
import { useTopData } from "./TopDataContext";
import { Info } from "lucide-react";


const Playlists = () => {
  const [selectedPlaylist, setSelectedPlaylist] = useState({tracks_preview: [], languageDistribution: {}, mostPositiveSent: [], mostNegativeSent: [], wordCloud: "", mostLexicalRich: [], mostProfane: [],
  posAvg: 0, negAvg: 0, lexicalAvg: 0, profaneAvg: 0});
  const [playlistselected, setPlaylistselected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user_id, setUserID] = useState(null);
  const cancelFetchRef = useRef(false);
  const [currentPlaylistLoaded, setCurrentPlaylistLoaded] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState(null); // State to track which track is hovered
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

  const sentimentData = [
    ...(selectedPlaylist?.mostPositiveSent || []),
    ...(selectedPlaylist?.mostNegativeSent || [])
  ].map(track => ({
    name: track.name,
    artist: track.artist,
    positive: track.sentiment?.pos ?? 0,
    negative: track.sentiment?.neg ?? 0
  }));


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
    if(userPlaylists.length > 0)return;

    setLoading(true); // start loading

    axios.get("http://localhost:5000/user-playlists", {
      params: { user_id: userId },
    })
    .then((response) => {
      setUserPlaylists(response.data.playlists);
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
      
            updatedTracks = userPlaylists.find(p => p.id === pId).tracks_preview.map(track => {
              const updated = chunkResults.find(t => t.name === track.name && t.artist === track.artist);
              return updated ? updated : track;
            });

      
          if (i + chunkSize < tracks.length) {
            await sleep(delay);
          }
        }
        return updatedTracks;
      };


      const fetchSentiment = async (playlist_id) => {
        try {
          const response = await axios.get("http://localhost:5000/get_playlist_sentiment", {
            params: {
            "playlist_id": playlist_id,
            }
          });
                  
          const data = response.data;

          let sentimentData = {"posSent": [], "negSent": []};

          const updateTracksWithSentiment = (originalTracks, sentimentTracks) => {
            return originalTracks.map((track) => {
              const match = sentimentTracks.find(
                (sTrack) =>
                  sTrack.name === track.name &&
                  (!sTrack.artist || sTrack.artist === track.artist)
              );

              if (!match || !match.sentiment) {
                return track; // no match or no sentiment, return original
              }

              // Top 5 most positive by sentiment.pos
                if (match.sentiment?.pos > 0) {
                    sentimentData.posSent.push(match);
                    sentimentData.posSent.sort((a, b) => b.sentiment.pos - a.sentiment.pos);
                    if (sentimentData.posSent.length > 5) {
                      sentimentData.posSent.pop(); // remove weakest positive
                    }
                }
                
                // Top 5 most negative by sentiment.neg
                if (match.sentiment?.neg > 0) {
                    sentimentData.negSent.push(match);
                    sentimentData.negSent.sort((a, b) => b.sentiment.neg - a.sentiment.neg);
                    if (sentimentData.negSent.length > 5) {
                      sentimentData.negSent.pop(); // remove weakest negative
                    }
                }

  
              return match?.sentiment
                ? {
                    ...track,
                    sentiment: match?.sentiment, // Add sentiment data
                  }
                : track;
            });
          };

          setUserPlaylists(prev => (
              prev.map(playlist =>
              playlist.id === playlist_id
                ? { ...playlist, 
                  tracks_preview: updateTracksWithSentiment(playlist.tracks_preview, data),

                }
                : playlist
            )
          ));          

          return sentimentData;
        } catch (error) {
          console.error(`Failed to fetch sentiment for playlist:`, error);
        }
      };

      const fetchWordCloud = async (playlist_id) => {
        try {
          const response = await axios.get("http://localhost:5000/get-playlist-wordcloud", {
            params: {
            "playlist_id": playlist_id,
            }
          });
          
          const wordcloud = response.data;
          return wordcloud;
        } catch (error) {
          console.error("Error fetching word cloud:", error);
        }
      };

      const fetchLexicalRichness = async (playlist_id) => {
        try {
          const response = await axios.get("http://localhost:5000/get-playlist-lexical-richness", {
            params: {
            "playlist_id": playlist_id,
            }
          });
                  
          const lexicalData = response.data;

          let mostLexicalRich = [];

          const updateTracksWithLexical = (originalTracks, lexicalTracks) => {
            return originalTracks.map((track) => {
              const match = lexicalTracks.find(
                (lTrack) =>
                  lTrack.name === track.name &&
                  (!lTrack.artist || lTrack.artist === track.artist)
              );

              if (!match || !match.mtld) {
                return track; // no match or no lexical richness, return original
              }

              if (match?.mtld > 0) {
                mostLexicalRich.push(match);
                mostLexicalRich.sort((a, b) => b.mtld - a.mtld);
                if (mostLexicalRich.length > 5) {
                  mostLexicalRich.pop(); // remove weakest positive
                }
            }
      
              return match
                ? {
                    ...track,
                    lexicalRichness: {
                      mtld: match.mtld
                    },
                  }
                : track;
            });
          };

          setUserPlaylists(prev => (
              prev.map(playlist =>
              playlist.id === playlist_id
                ? { ...playlist, 
                  tracks_preview: updateTracksWithLexical(playlist.tracks_preview, lexicalData)
                }
                : playlist
            )
          ));          
          
          return mostLexicalRich;
        } catch (error) {
          console.error(`Failed to fetch lexical richness for playlist:`, error);
        }
      };


      const fetchProfanity = async (playlist_id) => {
        try {
          const response = await axios.get("http://localhost:5000/get-playlist-profanity", {
            params: {
            "playlist_id": playlist_id,
            }
          });
                  
          const profanityData = response.data;

          let mostProfane = [];

          const updateTracksWithProfanity = (originalTracks, profanityTracks) => {
            return originalTracks.map((track) => {
              const match = profanityTracks.find(
                (pTrack) =>
                  pTrack.name === track.name &&
                  (!pTrack.artist || pTrack.artist === track.artist)
              );

              if (!match || !match.profane_word_count) {
                return track; // no match or no profanity, return original
              }

              if (match?.profane_word_count > 0) {
                mostProfane.push(match);
                mostProfane.sort((a, b) => b.profane_word_count - a.profane_word_count);
                if (mostProfane.length > 5) {
                  mostProfane.pop(); 
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

          setUserPlaylists(prev => (
              prev.map(playlist =>
              playlist.id === playlist_id
                ? { ...playlist, 
                  tracks_preview: updateTracksWithProfanity(playlist.tracks_preview, profanityData)
                }
                : playlist
            )
          ));          
          
          return mostProfane;
        } catch (error) {
          console.error(`Failed to fetch profanity for playlist:`, error);
        }
      };

      //stores all lyrics and language distributions in context
      useEffect(() => {
      const fetchPlaylistLyricsAndData = async () => {
        cancelFetchRef.current = false;

        if(!playlistselected)return;
        if (userPlaylists.some(p => p.id === selectedPlaylist.id && p.dataFetched)){ 
          setCurrentPlaylistLoaded(true);
          return;
        }
          const updatedTracks = await fetchLyricsInChunks(userPlaylists.find(p => p.id === selectedPlaylist.id).tracks_preview, 5, 1000, selectedPlaylist.id);

          //attempt at stopping fetching if user clicks away
          if (cancelFetchRef.current) {
            console.log("Fetch cancelled.");
            return null;
          }

          //updates lyrics of tracks in playlist
          setUserPlaylists(prev => (
            prev.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, tracks_preview: updatedTracks || {} }
                : playlist
            )
          ));
          
  
          //updates language distribution of tracks in playlist
          const languageDistribution = await fetchLanguageDistribution(selectedPlaylist.id);
  
          setUserPlaylists(prev => (
            prev.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, languageDistribution: languageDistribution.data || {} }
                : playlist
            )
          ));

          const sentimentData = await fetchSentiment(selectedPlaylist.id);

          
          setUserPlaylists(prev => (
            prev.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, mostPositiveSent: sentimentData.posSent || [], mostNegativeSent: sentimentData.negSent || []
                }
                : playlist
            )
          ));      

          const lexicalData = await fetchLexicalRichness(selectedPlaylist.id);

          setUserPlaylists(prev => (
            prev.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, mostLexicalRich: lexicalData || [] }
                : playlist
            )
          ));

          const profanityData = await fetchProfanity(selectedPlaylist.id);

          setUserPlaylists(prev => (
            prev.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, mostProfane: profanityData || [] }
                : playlist
            )
          ));

          const wordcloud = await fetchWordCloud(selectedPlaylist.id);

          setUserPlaylists(prev => (
            prev.map(playlist =>
              playlist.id === selectedPlaylist.id
                ? { ...playlist, wordCloud: wordcloud, dataFetched: true }
                : playlist
            )
          ));
          
          setCurrentPlaylistLoaded(true);
      };
      
      fetchPlaylistLyricsAndData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [playlistselected]);


      useEffect(() => {

        if (!playlistselected) return;
        if(!currentPlaylistLoaded) return;
        
        const updated = userPlaylists.find(p => p.id === selectedPlaylist.id);


        const tracksWithSentiment = updated.tracks_preview.filter(t => t.sentiment);
        const positiveAvg = tracksWithSentiment.length > 0
          ? tracksWithSentiment.map(t => t.sentiment.pos).reduce((a, b) => a + b, 0) / tracksWithSentiment.length
          : 0;
        const negativeAvg = tracksWithSentiment.length > 0
          ? tracksWithSentiment.map(t => t.sentiment.neg).reduce((a, b) => a + b, 0) / tracksWithSentiment.length
          : 0;

        const tracksWithLexical = updated.tracks_preview.filter(t => t.lexicalRichness);
        const lexicalAvg = tracksWithLexical.length > 0
          ? tracksWithLexical.map(t => t.lexicalRichness.mtld).reduce((a, b) => a + b, 0) / tracksWithLexical.length
          : 0;
        
          const tracksWithProfanity = updated.tracks_preview.filter(t => t.profanity);
          const profaneAvg = tracksWithProfanity.length > 0
          ? tracksWithProfanity.map(t => t.profanity.profane_word_count).reduce((a, b) => a + b, 0) / tracksWithProfanity.length
          : 0;


          let word_cloud = "";
          if (updated.wordCloud) {
            const byteCharacters = atob(updated.wordCloud);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
    
            let image = new Blob([byteArray], { type: 'image/jpeg' });
            word_cloud = URL.createObjectURL(image);
            }


        if (updated) {
          setSelectedPlaylist({
            ...updated,
            languageDistribution: updated.languageDistribution || {},
            tracks_preview: updated.tracks_preview,
            mostPositiveSent: updated.mostPositiveSent,
            mostNegativeSent: updated.mostNegativeSent,
            posAvg: positiveAvg,
            negAvg: negativeAvg,
            wordCloud: word_cloud,
            lexicalAvg: lexicalAvg,
            profaneAvg: profaneAvg
          });
        }

  
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [currentPlaylistLoaded]);










  return (
    
    
    <div className="flex justify-between space-x-6 mt-8 ml-32 mr-16">
      {/* Left Side: Playlist Grid */}
      
      <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">
        {playlistselected ? (
            <div>

            <div>
            <button onClick={() => {
                    setPlaylistselected(false);
                    setSelectedPlaylist(null);
                    cancelFetchRef.current = true; // Cancel  in-progress fetch

                  }}
                      className="px-6 py-2 bg-green-500 text-black font-semibold rounded-full transition duration-300 hover:bg-green-400 hover:text-black shadow-md hover:shadow-lg"
                      >Back to playlists</button>
            </div>



            {currentPlaylistLoaded ? (
                <p></p>
              ) : (
                <div className='flex items-center space-x-3 mb-10 text-2xl font-bold text-green-500 mt-10'>
                <p>Please wait while we fetch your playlist data...</p>
                </div>
              )}
              
              {/* Sentiment */}
              <h2 className="text-2xl font-bold text-white mb-4 mt-10">Sentiment Analysis</h2>
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
                      Does this playlist have a more positive or negative sentiment?
                      </div>
                  </div>
                  </div>   
                                
                    <div className="flex items-center space-x-6">
                    <div className="text-xl">Positive: {selectedPlaylist.posAvg ? selectedPlaylist.posAvg.toFixed(3) : ""}</div>
                    <div className="text-xl">Negative: {selectedPlaylist.negAvg ? selectedPlaylist.negAvg.toFixed(3) : ""}</div>
                    <div className="text-xl">Overall: {(selectedPlaylist.posAvg && selectedPlaylist.negAvg) ? (selectedPlaylist.posAvg - selectedPlaylist.negAvg).toFixed(3) : ""}</div>
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
                    A word cloud that contains the most common words in this playlist!
                    </div>
                </div>
                </div>   
                <div className="flex justify-center items-center min-h-[250px]">
                    {!selectedPlaylist.wordCloud ? (
                        <div className="w-12 h-12 border-4 border-green-500 border-dashed rounded-full animate-spin
                        "> </div>
                        ) : ( 
                        selectedPlaylist.wordCloud && (
                          
                          <img src={selectedPlaylist.wordCloud} alt="Word Cloud" width={600} height={600}/>
                        )
                        )}
                </div>




                {/* Lexical Richness */}
                <h2 className="text-2xl font-bold text-white mb-4 mt-16">Lexical Richness</h2>
                <p className="text-gray-300 text-md">
                  Lexical richness is a measure of how unique the vocabulary is in a text.
                  Spotilytics uses the Measure of Textual Lexical Diversity (MTLD) to calculate lexical richness.
                  MTLD calculates how many words you can go through before (Unique words / Total words) drops below 0.72.
                  The higher the MTLD score, the more lexically rich the text is. In other words, how repetitive are the lyrics in this playlist?
  
                </p>
                  
                <div className='flex items-center space-x-3 mt-10'>
                  <h2 className="text-xl font-bold text-white mb-4">Average MTLD</h2>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                      <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                      rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                      duration-200 p-2 pointer-events-none">
                      A high MTLD score is greater than 60 and a low score is less than 30.
                      How does this playlist's average compare?
                      </div>
                  </div>
                  </div>   
                                
                    <div className="flex items-center space-x-6">
                      <div className="text-xl">{selectedPlaylist.lexicalAvg ? selectedPlaylist.lexicalAvg.toFixed(3) : ""}</div>
                    </div>
  
                  <div className="flex items-center space-x-3 mt-10">
                    <h2 className="text-xl font-bold text-white mb-4">Most Lexically Rich Tracks</h2>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                      <div className="absolute left-0 bottom-0 ml-6 w-64 bg-green-500 text-black text-md font-semibold 
                        rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                        duration-200 p-2 pointer-events-none z-10">
                        These are the 5 tracks with the most varied vocabulary and linguistic richness in this playlist.
                      </div>
                    </div>
                  </div>
  
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      layout="vertical"
                      data={selectedPlaylist.mostLexicalRich}
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

                
                  {/* Language Distribution */}
                  <div className='flex items-center space-x-3'>
                <h2 className="text-2xl font-bold text-white mb-4 mt-10">Language Distribution</h2>
                    <div className="relative group">
                  <Info className="w-4 h-4 text-white cursor-pointer mb-3 mt-10" />
                  <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                  rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                  duration-200 p-2 pointer-events-none">
                  Spotilytics' language detection is not perfect, which is why there is an uncertain percentage!
                  P.S. If the distribution looks wrong, try refreshing the page and returning to the playlist.
                  </div>
                </div>
                </div>

                <div className='flex justify-center items-center min-h-[250px]'>
                {!selectedPlaylist.languageDistribution ? (
                    <div className="w-12 h-12 border-4 border-green-500 border-dashed rounded-full animate-spin
                    "> </div>

                  ) : ( 
              selectedPlaylist.languageDistribution && ( 
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
            ))}
            </div>


                {/* Average Profanity */}
                <div className='flex items-center space-x-3 mt-10'>
                    <h2 className="text-2xl font-bold text-white mb-4">Profanity</h2>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-white cursor-pointer mb-3" />
                        <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                        rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                        duration-200 p-2 pointer-events-none">
                        Here is the average number of profane words in this playlist.
                        </div>
                    </div>
                    </div> 
                    <div className="flex items-center space-x-6">
                      <div className="text-xl">{selectedPlaylist.profaneAvg ? selectedPlaylist.profaneAvg.toFixed(3) : ""}</div>
                    </div>
    
                  <h2 className="text-2xl font-bold text-white mb-4 mt-16">Most Profane Tracks</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      layout="vertical"
                      data={selectedPlaylist.mostProfane}
                      margin={{ top: 20, right: 30, left: 15, bottom: 20 }}
                      barCategoryGap="15%"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={[0, 'dataMax + 5']}
                        tick={{ fill: "#ffffff" }}
                        label={{
                          value: "Profane Word Count",
                          position: "insideBottomRight",
                          fill: "#ffffff",
                          offset: 0
                        }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: "#ffffff", fontSize: 14 }}
                        interval={0}
                        width={180}
                      />
                      <Tooltip content={CustomTooltip} />
                      <Legend />
                      <Bar dataKey="profane_word_count" fill="#1DB954" name="Profane Word Count" />
                    </BarChart>
                  </ResponsiveContainer>



            
            </div>
        ) : (loading ? (
            <div>
              <h2 className="text-3xl font-bold mb-6">Pick a playlist!</h2>  
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">  
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="m-h-[300px] bg-gray-800 p-4 rounded-lg shadow-md animate-pulse"
                >
                  <div
                    className="w-full mb-4 bg-gray-700 rounded"
                    style={{ width: '100%', height: '300px', aspectRatio: '1/1' }}
                  />
                  <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            </div>
          ) : (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Pick a playlist!</h2>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {userPlaylists.map((playlist, index) => (
                      <div
                      key={index}
                      onClick={async () => {
                        setSelectedPlaylist(playlist);
                        setPlaylistselected(true);
                        setCurrentPlaylistLoaded(false);
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
      <div className="bg-gray-900 p-6 rounded-lg shadow-md w-1/2">
        {playlistselected ? (
          <>
            <div className='flex items-center space-x-3 mb-3'>
              <h2 className="text-2xl font-semibold">
                Preview of tracks in "{selectedPlaylist.name}"
              </h2>
              <div className="relative group">
                <Info className="w-4 h-4 text-white cursor-pointer mt-1" />
                <div className="absolute left-0 bottom-0 ml-6 w-60 bg-green-500 text-black text-md font-semibold 
                rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                duration-200 p-2 pointer-events-none">
                Spotilytics can only analyze the first 50 tracks in a playlist. 

              </div>
            </div>

            </div>
            <ul className="relative space-y-6 mt-6">
              {selectedPlaylist.tracks_preview?.map((track, idx) => (
                <li key={idx} 
                onMouseEnter={() => setHoveredTrack(track.name)} // Set hovered track on mouse enter
                onMouseLeave={() => setHoveredTrack(null)} // Reset when mouse leaves
                className="flex items-center space-x-4 text-gray-300 max-h-[45px]"
                >

                  <div className="text-xl">{idx + 1}  </div>

                  <img
                      src={track.image}
                      alt={`${track.name} artist`}
                      className="w-12 h-12 rounded shadow"
                  />
                  <div>
                    <div className="text-xl"> {track.name}</div>
                    <div className="text-md text-gray-400"> {track.artist}</div>
                </div>
                {hoveredTrack === track.name && track.sentiment && (
                  <div className="absolute right-0 bg-green-500 text-black font-semibold p-2 rounded shadow-lg">
                    Pos: {track.sentiment.pos}, Neg: {track.sentiment.neg}, MTLD: {(track.lexicalRichness.mtld)}, Profanity: {(track.profanity.profane_word_count)}
                  </div>
                )}

                </li>


              ))}
            </ul>
          </>
        ) : (
          <div>
            <div className='flex items-center space-x-3 mb-10 text-2xl font-bold text-white'>
              <p>Click on a playlist to see its tracks!</p>
            </div>

            <ul className="space-y-6 mt-6">
            {Array.from({ length: 15 }).map((_, idx) => (
              <li
                key={idx}
                className="flex items-center space-x-4 max-h-[45px] animate-pulse"
              >
                <div className="text-xl text-gray-500">{idx + 1}</div>
                <div className="w-12 h-12 bg-gray-700 rounded shadow" />
                <div>
                  <div className="bg-gray-700 h-5 w-40 mb-1 rounded" />
                  <div className="bg-gray-600 h-4 w-24 rounded" />
                </div>
              </li>
            ))}
          </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlists;
