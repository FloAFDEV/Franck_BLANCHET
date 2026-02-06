
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppression de toute logique liée à des clés API ou process.env
// L'application repose exclusivement sur IndexedDB (db.ts)

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
