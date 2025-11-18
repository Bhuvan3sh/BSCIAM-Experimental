import React, { useEffect } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const { wallet } = useWallet();

  // Automatically redirect to dashboard when wallet connects
  useEffect(() => {
    if (wallet.isConnected) {
      // Update URL without reload
      if (window.location.pathname !== '/dashboard') {
        window.history.replaceState({}, '', '/dashboard');
      }
    } else {
      // Reset to root if disconnected
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [wallet.isConnected]);

  // Show Dashboard if wallet is connected, otherwise show WalletConnect
  if (wallet.isConnected) {
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
