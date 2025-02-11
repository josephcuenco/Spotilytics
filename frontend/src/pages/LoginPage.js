import React from "react";

const CLIENT_ID = "your_spotify_client_id";
const REDIRECT_URI = "http://localhost:3000/callback"; // Change this to your deployed URL
const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-private%20user-read-email`;

const Login = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <a
        href={AUTH_URL}
        className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700"
      >
        Login with Spotify
      </a>
    </div>
  );
};

export default Login;
