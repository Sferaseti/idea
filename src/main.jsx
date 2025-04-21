import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';

function App() {
  return (
    <div className="app">
      <h1>FounderPal Tools App</h1>
      <p>This is a simple React application published using GitHub Pages.</p>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
