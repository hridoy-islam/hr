import React, { useState } from 'react';
import { CirclePicker } from 'react-color';

const ThemeUpdater = () => {
  const [theme, setTheme] = useState('#2196f3'); // Defaulting to blue

  const handleColorChange = (color) => {
    setTheme(color.hex);
  };

  // 3. Event handler for hovering over a color swatch
  const handleSwatchHover = (color, event) => {
    console.log("Hovering over:", color.hex);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Choose Your Theme</h2>
      
      {/* 4. Implement the CirclePicker with your specified props */}
      <CirclePicker
        width="252px"
        colors={[
          "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", 
          "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", 
          "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", 
          "#ff5722", "#795548", "#607d8b"
        ]}
        circleSize={28}
        circleSpacing={14}
        onChangeComplete={handleColorChange}
        onSwatchHover={handleSwatchHover}
      />

      {/* 5. A visual demonstration of the theme updating */}
      <div 
        style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: theme, 
          color: '#fff',
          borderRadius: '8px',
          width: '252px',
          textAlign: 'center',
          transition: 'background-color 0.3s ease'
        }}
      >
        Current Theme: {theme}
      </div>
    </div>
  );
};

export default ThemeUpdater;