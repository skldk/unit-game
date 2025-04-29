/**
 * Структура приложения:
 * 1. public/index.html содержит <div id="root">
 * 2. src/index.tsx монтирует React в этот div
 * 3. src/App.tsx определяет основной layout
 * 4. src/pages/EconomySimulator.tsx содержит основную логику игры
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);