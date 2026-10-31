import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
// App.jsx is not used directly since main.jsx has BrowserRouter
// This is kept for reference
export default function App() {
  return <AppRoutes />;
}
