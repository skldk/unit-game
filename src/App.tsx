import React from 'react';
import EconomySimulator from './pages/EconomySimulator';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <EconomySimulator />
    </div>
  );
}

export default App;