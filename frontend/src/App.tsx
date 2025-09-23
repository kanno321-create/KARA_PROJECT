import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@fluentui/react';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import Layout from './components/Layout';
import StableChatInterface from './pages/StableChatInterface';
import AIManager from './pages/AIManager';
import Estimates from './pages/Estimates';
import SalesPurchase from './pages/SalesPurchase';
import Email from './pages/Email';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Settings from './pages/Settings';

initializeIcons();

const theme = createTheme({
  palette: {
    themePrimary: '#0078d4',
    themeLighterAlt: '#eff6fc',
    themeLighter: '#deecf9',
    themeLight: '#c7e0f4',
    themeTertiary: '#71afe5',
    themeSecondary: '#2b88d8',
    themeDarkAlt: '#106ebe',
    themeDark: '#005a9e',
    themeDarker: '#004578',
    neutralLighterAlt: '#faf9f8',
    neutralLighter: '#f3f2f1',
    neutralLight: '#edebe9',
    neutralQuaternaryAlt: '#e1dfdd',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c6c4',
    neutralTertiary: '#a19f9d',
    neutralSecondary: '#605e5c',
    neutralPrimaryAlt: '#3b3a39',
    neutralPrimary: '#323130',
    neutralDark: '#201f1e',
    black: '#000000',
    white: '#ffffff',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<StableChatInterface />} />
          <Route path="/chat/*" element={<StableChatInterface />} />
          <Route path="/ai-manager" element={<StableChatInterface />} />
          <Route path="/estimates" element={<StableChatInterface />} />
          <Route path="/erp" element={<StableChatInterface />} />
          <Route path="/email" element={<StableChatInterface />} />
          <Route path="/calendar" element={<StableChatInterface />} />
          <Route path="/drawings" element={<StableChatInterface />} />
          <Route path="/mcp" element={<StableChatInterface />} />
          <Route path="/audit" element={<StableChatInterface />} />
          <Route path="/settings/*" element={<Settings />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
