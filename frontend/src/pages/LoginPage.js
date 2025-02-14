import React from "react";

const CLIENT_ID = "c868abc7e737484fa8c9d686cfdff89d";
const REDIRECT_URI = "http://localhost:3000/dashboard"; 
const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-private%20user-read-email`;

const Login = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg text-center text-white">
        <h1 className="text-2xl font-semibold mb-4">Welcome to Spotilytics!</h1>
        <p className="text-white mb-6">Discover everything from your top artists and songs to the linguistic trends and musical composition of your music library.</p>
        <p className="text-gray-400 mb-6">Click the button below to login with Spotify.</p>
        <a
          href={AUTH_URL}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all"
        >
          Login with Spotify
        </a>
      </div>
    </div>
  );
};

export default Login;
