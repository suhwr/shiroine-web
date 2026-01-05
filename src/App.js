import React, { lazy, Suspense } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';

// Lazy load components
const Home = lazy(() => import('./components/Home'));
const Pricing = lazy(() => import('./components/Pricing'));

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, rgb(17, 17, 19))' }} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;