import React from "react";

const loginWithSpotify = () => {
  window.location.href = "http://localhost:5000/login";
};


const Login = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-900 p-8 rounded-2xl text-center text-white">
        <h1 className="text-5xl font-semibold mb-4">Spotilytics *logo goes here*</h1> 
        <p className="text-gray-400 mb-6 mt-6">Analytics for your music listening habits</p>

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
