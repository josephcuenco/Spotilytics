import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Songs from "./Songs";
import Languages from "./Languages";
import Artists from "./Artists";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 p-4 flex justify-center space-x-6 shadow-lg">
        <Link to="/dashboard/songs" className="hover:text-green-400">Songs</Link>
        <Link to="/dashboard/languages" className="hover:text-green-400">Languages</Link>
        <Link to="/dashboard/artists" className="hover:text-green-400">Artists</Link>
      </nav>

      {/* Page Content */}
      <div className="p-6">
        <Routes>
          <Route path="songs" element={<Songs />} />
          <Route path="languages" element={<Languages />} />
          <Route path="artists" element={<Artists />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
