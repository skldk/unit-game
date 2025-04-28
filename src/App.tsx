import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EconomySimulator from './pages/EconomySimulator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EconomySimulator />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;