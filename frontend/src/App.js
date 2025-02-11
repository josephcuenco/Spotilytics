import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Temp from './pages/temp';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route path="/callback" element={<Temp />} />
          
        </Routes>
      </div>
    </Router>
  );
};

export default App;
