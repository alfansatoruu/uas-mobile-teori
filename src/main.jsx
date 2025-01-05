import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Loader from './Loader.jsx'; // Path ke file Loader.jsx
import App from './App.jsx'; // Path ke file App.jsx

const Main = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false); // Setelah 6 detik, matikan loader
    }, 6000); // Durasi animasi loader

    return () => clearTimeout(timer); // Bersihkan timer jika komponen di-unmount
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return <App />;
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
