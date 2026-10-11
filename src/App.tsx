import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProjectorView from './pages/ProjectorView';
import AdminView from './pages/AdminView';
import LandingPage from './pages/LandingPage';

function App() {
  return (
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/projector" element={<ProjectorView />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
  );
}

export default App;