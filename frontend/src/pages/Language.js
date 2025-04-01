import React, { useState, useEffect } from 'react';

const Language = () => {
  
  const [lyricsLanguages, setLyricsLanguages] = useState('');
  const [songTitle, setSongTitle] = useState('Shape of You');  // Set default song title
  const [artistName, setArtistName] = useState('Ed Sheeran');  // Set default artist

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!songTitle || !artistName) {
        setLyricsLanguages('Song title and artist name are required.');
        return;
      }
    
      try {
        const response = await fetch(
          `http://localhost:5000/song-lyrics?song_title=${encodeURIComponent(songTitle)}&artist_name=${encodeURIComponent(artistName)}`
        );
    
        if (!response.ok) {
          const errorData = await response.json();
          setLyricsLanguages(errorData.error || 'Error fetching lyrics.');
          return;
        }
    
        const data = await response.json();
    
        const languagesFormatted = data.languages
        .map(lang => `${lang.name} (${(lang.confidence * 100).toFixed(2)}%)`)
        .join(", ");

      setLyricsLanguages(languagesFormatted || 'Lyrics language could not be determined.');
      } catch (error) {
        setLyricsLanguages('Error fetching lyrics.');
      }
    };

    fetchLyrics();
  }, [songTitle, artistName]);  

  return (
    <div className="ml-32 mt-16">
      <h1 className="text-5xl font-bold">Language</h1>

      <input
        type="text"
        value={songTitle}
        onChange={(e) => setSongTitle(e.target.value)}
        placeholder="Enter song title"
        className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 mt-8"  
      />
      <input
        type="text"
        value={artistName}
        onChange={(e) => setArtistName(e.target.value)}
        placeholder="Enter artist name"
        className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 mt-8"
      />



      <div className="mt-8">
        <p className="text-2xl font-semibold">Song: {songTitle} by {artistName}</p>

        <div className="mt-4 p-4 border border-gray-300 rounded-lg">
          <h2 className="text-2xl font-bold">Languages:</h2>
          <pre className="whitespace-pre-wrap">{lyricsLanguages}</pre>
        </div>
      </div>
    </div>
  );
};

export default Language;
