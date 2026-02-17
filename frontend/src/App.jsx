import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import BackgroundAnimation from './components/BackgroundAnimation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <BackgroundAnimation />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} AetherNode - Monitoring. All systems nominal.</p>
          <div className="footer-links">
            <Link to="/admin" className="admin-link">Admin Access</Link>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
