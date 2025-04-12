import React from "react";
import SpotilyticsIcon from "../images/Spotilytics.png";

const loginWithSpotify = () => {
  window.location.href = "http://localhost:5000/login";
};


const Login = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="bg-black p-8 rounded-2xl text-center text-white">
        <img src={SpotilyticsIcon} alt="logo" width="300" height="400" />
        <p className="text-white mb-6 mt-3">Analytics for your music listening habits</p>

        <button
          onClick={loginWithSpotify}
          className="bg-green-700 hover:bg-green-800 text-green-500 font-bold py-3 px-6 rounded-lg shadow-md transition-all"
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
};

export default Login;
