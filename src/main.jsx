import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { bootSitePalette, mountApp } from '@phenomcanvas/ui';
import './tailwind.css';
import '@phenomcanvas/ui/styles-external-fonts.css';
import App from './App.jsx';

bootSitePalette();

mountApp(
  <React.StrictMode>
    <BrowserRouter basename="/notes">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
