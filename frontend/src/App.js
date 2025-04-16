import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { TopDataProvider } from "./pages/TopDataContext";



const App = () => {
  
  return (
    <TopDataProvider>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route path="/dashboard/*" element={<Dashboard />} />
            
          </Routes>
        </div>
      </Router>
    </TopDataProvider>
  );
};

export default App;
