import React from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const { wallet } = useWallet();

  // Check if we're on the dashboard route
  const isDashboard = window.location.pathname === '/dashboard';

  if (isDashboard && wallet.isConnected) {
    return <Dashboard />;
  }

  return <WalletConnect />;
};

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
