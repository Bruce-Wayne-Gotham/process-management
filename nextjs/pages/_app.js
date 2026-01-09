'use client';
import React from 'react';
import { initializeDatabase } from '../lib/db-init';

function MyApp({ Component, pageProps }) {
  React.useEffect(() => {
    // Initialize database on app startup
    initializeDatabase().then(result => {
      console.log('Database initialization result:', result);
    }).catch(err => {
      console.error('Database initialization error:', err);
    });
  }, []);

  return <Component {...pageProps} />
}

export default MyApp
