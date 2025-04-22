import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import IdeaGenerator from './pages/IdeaGenerator';
import RoadmapPlanner from './pages/RoadmapPlanner';

function App() {
  return (
    <Router>
      <nav style={{ padding: '10px', backgroundColor: 'darkblue' }}>
        <Link style={{ color: 'white', marginRight: '10px' }} to="/">Home</Link>
        <Link style={{ color: 'white', marginRight: '10px' }} to="/idea-generator">Idea Generator</Link>
        <Link style={{ color: 'white', marginRight: '10px' }} to="/roadmap-planner">Roadmap Planner</Link>
      </nav>
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/idea-generator" element={<IdeaGenerator />} />
          <Route path="/roadmap-planner" element={<RoadmapPlanner />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
