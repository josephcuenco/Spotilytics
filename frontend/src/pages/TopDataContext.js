import React, { createContext, useState, useContext } from "react";

const TopDataContext = createContext();

export const TopDataProvider = ({ children }) => {
  const [topDataShort, setTopDataShort] = useState({ topTracks: [], topArtists: [], artistPopularity: 0, trackPopularity: 0,
     languageDistribution: {}, mostPositiveSent: [], mostNegativeSent: [], wordCloud: "", mostLexicalRich: [], mostProfane: [] });
  const [topDataMedium, setTopDataMedium] = useState({ topTracks: [], topArtists: [], artistPopularity: 0, trackPopularity: 0,
     languageDistribution: {}, mostPositiveSent: [], mostNegativeSent: [], wordCloud: "", mostLexicalRich: [], mostProfane: [] });
  const [topDataLong, setTopDataLong] = useState({ topTracks: [], topArtists: [], artistPopularity: 0, trackPopularity: 0,
     languageDistribution: {}, mostPositiveSent: [], mostNegativeSent: [], wordCloud: "", mostLexicalRich: [], mostProfane: [] });
  const [topDataFetched, setTopDataFetched] = useState(false);
  const [allDataFetched, setAllDataFetched] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState({playlists: []});


  return (
    <TopDataContext.Provider value={{
      topDataShort, setTopDataShort,
      topDataMedium, setTopDataMedium,
      topDataLong, setTopDataLong,
      topDataFetched, setTopDataFetched,
      userPlaylists, setUserPlaylists,
      allDataFetched, setAllDataFetched
          }}>
      {children}
    </TopDataContext.Provider>
  );
};

export const useTopData = () => useContext(TopDataContext);
