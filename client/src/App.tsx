import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WelcomePage from './Pages/Welcome/WelcomePage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
    </Routes>
  );
};

export default App;
