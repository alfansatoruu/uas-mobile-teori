import React, { useEffect } from 'react';
import './loading_screen.css';

const Loader = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
    }, 6000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className='container'>
      <div className="loader">
        <div className="tall-stack">
          <div className="butter falling-element"></div>
          <div className="pancake falling-element"></div>
          <div className="pancake falling-element"></div>
          <div className="pancake falling-element"></div>
          <div className="pancake falling-element"></div>
          <div className="pancake falling-element"></div>
          <div className="pancake falling-element"></div>
          <div className="plate">
            <div className="plate-bottom"></div>
            <div className="shadow"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
