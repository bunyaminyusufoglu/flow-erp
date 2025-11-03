import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './theme.css';

// Initialize theme (light/dark/system) before app renders
function applyTheme(mode) {
  const root = document.documentElement;
  let target = mode;
  if (mode === 'system') {
    target = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', target);
}

const savedTheme = localStorage.getItem('theme') || 'system';
applyTheme(savedTheme);
if (savedTheme === 'system' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  try {
    mql.addEventListener('change', () => applyTheme('system'));
  } catch {
    // Safari fallback
    mql.addListener(() => applyTheme('system'));
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);