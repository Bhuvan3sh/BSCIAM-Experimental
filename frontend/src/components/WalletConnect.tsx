import React from 'react';
import { Wallet, Shield, Lock } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const WalletConnect: React.FC = () => {
  const { wallet, userProfile, isLoading, error, connectWallet, disconnectWallet } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">BSCIAM</h1>
          <p className="text-dark-300 text-lg">Blockchain-based Secure Cloud Identity and Access Management</p>
        </div>

        {/* Main Card */}
        <div className="card animate-slide-up">
          {!wallet.isConnected ? (
            <div className="text-center">
              <div className="mb-6">
                <Wallet className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-white mb-2">Connect Your Wallet</h2>
                <p className="text-dark-400">
                  Connect your MetaMask wallet to access the BSCIAM authentication system
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect MetaMask
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-dark-300 mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">Secure Authentication</span>
                </div>
                <ul className="text-xs text-dark-400 space-y-1">
                  <li>• Your private keys never leave your wallet</li>
                  <li>• Decentralized identity management</li>
                  <li>• Blockchain-secured access control</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Wallet Connected</h2>
                <p className="text-dark-400 mb-4">
                  {userProfile 
                    ? `Welcome back, ${userProfile.username}! Successfully connected to MetaMask`
                    : 'Successfully connected to MetaMask'
                  }
                </p>
                {userProfile && (
                  <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">
                      🎉 Hello {userProfile.username}! Your reputation score is {userProfile.reputationScore} points.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-dark-700 rounded-lg">
                  <span className="text-dark-300">Address:</span>
                  <span className="text-white font-mono text-sm">
                    {wallet.account ? formatAddress(wallet.account) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-dark-700 rounded-lg">
                  <span className="text-dark-300">Balance:</span>
                  <span className="text-white font-mono text-sm">
                    {wallet.balance ? `${formatBalance(wallet.balance)} ETH` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-dark-700 rounded-lg">
                  <span className="text-dark-300">Network:</span>
                  <span className="text-white font-mono text-sm">
                    {wallet.chainId === '31337' ? 'Hardhat' : `Chain ${wallet.chainId}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={disconnectWallet}
                  className="flex-1 btn-secondary"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 btn-primary"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-dark-400 text-sm">
          <p>Built with React, TypeScript, and Tailwind CSS</p>
          <p className="mt-1">Powered by Ethereum and MetaMask</p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
