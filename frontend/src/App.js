import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';


const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route path="/dashboard/*" element={<Dashboard />} />
          
        </Routes>
      </div>
    </Router>
  );
};

export default App;
