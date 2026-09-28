import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import CommandCenter from './pages/CommandCenter';
import RiskMap from './pages/RiskMap';
import FalseOnset from './pages/FalseOnset';
import Simulator from './pages/Simulator';
import SowingWindow from './pages/SowingWindow';
import OfficerDashboard from './pages/OfficerDashboard';
import Methodology from './pages/Methodology';
import { ForecastHistory } from './pages/ForecastHistory';
import { LocationProvider } from './context/LocationContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="command-center" element={<CommandCenter />} />
              <Route path="map" element={<RiskMap />} />
              <Route path="false-onset" element={<FalseOnset />} />
              <Route path="simulator" element={<Simulator />} />
              <Route path="sowing-window" element={<SowingWindow />} />
              <Route path="officer" element={<OfficerDashboard />} />
              <Route path="methodology" element={<Methodology />} />
              <Route path="history" element={<ForecastHistory />} />
            </Route>
          </Routes>
        </Router>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
