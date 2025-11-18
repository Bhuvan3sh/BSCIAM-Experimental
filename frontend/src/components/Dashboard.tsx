import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Activity, 
  LogOut, 
  FileText
} from 'lucide-react';
import FileManager from './files/FileManager';
import { useWallet } from '../context/WalletContext';

const Dashboard: React.FC = () => {
  const { 
    wallet, 
    isRegistered, 
    userProfile, 
    disconnectWallet, 
    registerUser, 
    getStoredFiles,
    getRecentActivities,
    getAllActivities,
    updateUsername,
    getAllUsers
  } = useWallet();
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'activity' | 'settings' | 'leaderboard'>('dashboard');
  const [newUsername, setNewUsername] = useState('');
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  // Registration form is always shown when user is not registered
  const [registrationData, setRegistrationData] = useState({ username: '', email: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<{message: string; encryptionKey?: string} | null>(null);
  const [fileCount, setFileCount] = useState(0);

  // Prevent first-page flicker after connecting wallet by delaying render until init is done
  useEffect(() => {
    // minimal delay to allow context to settle
    const t = setTimeout(() => setInitializing(false), 50);
    return () => clearTimeout(t);
  }, []);

  // Update file count when wallet account changes
  useEffect(() => {
    const loadFileCount = async () => {
    if (wallet.account) {
        try {
          const files = await getStoredFiles();
      setFileCount(files.length);
        } catch (error) {
          console.error('Error loading file count:', error);
          setFileCount(0);
        }
    } else {
      setFileCount(0);
    }
    };
    
    loadFileCount();
  }, [wallet.account, getStoredFiles]);

  // Load leaderboard users when tab opens
  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'leaderboard') return;
      try {
        setLeaderboardLoading(true);
        const users = await getAllUsers();
        const sorted = users.sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0));
        setLeaderboardUsers(sorted);
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
        setLeaderboardUsers([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    load();
  }, [activeTab, getAllUsers]);

  // Debug logging
  console.log('Dashboard - isRegistered:', isRegistered, 'userProfile:', userProfile);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationData.username) {
      setRegistrationError('Username is required');
      return;
    }

    setIsRegistering(true);
    setRegistrationError(null);
    setRegistrationSuccess(null);
    
    try {
      const result = await registerUser(registrationData.username, registrationData.email);
      if (result.success) {
        setRegistrationSuccess({
          message: result.message,
          encryptionKey: result.encryptionKey
        });
        // Clear form data after successful registration
        setRegistrationData({ username: '', email: '' });
      } else {
        setRegistrationError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setRegistrationError('An unexpected error occurred during registration');
    } finally {
      setIsRegistering(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Removed legacy mock access requests and badges

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="float-slow absolute -top-20 -right-10 w-64 h-64 rounded-full bg-primary-600/10 blur-3xl"></div>
        <div className="float-slow absolute bottom-0 left-0 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" style={{animationDelay:'-2s'}}></div>
      </div>
      <div className="bg-dark-800 shadow-lg border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <Shield className="w-8 h-8 text-primary-500" />
                  <span className="text-xl font-bold text-white">BSCIAM</span>
                </div>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {([
                  { key: 'dashboard', label: 'Dashboard' },
                  { key: 'files', label: 'Files' },
                  { key: 'settings', label: 'Settings' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as any)}
                    className={`${activeTab === t.key ? 'border-primary-500 text-white' : 'border-transparent text-dark-300 hover:border-dark-400 hover:text-white'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-dark-300" />
                <span className="text-sm text-white">
                  {userProfile?.username || formatAddress(wallet.account || '')}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="flex items-center space-x-1 text-sm text-dark-300 hover:text-white transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {initializing ? (
                <div className="card"><div className="px-4 py-8 sm:p-10 text-center text-dark-300">Loading...</div></div>
              ) : !isRegistered ? (
                <div className="card">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-white">
                      Complete your registration
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-dark-300">
                      <p>Please provide some additional information to complete your registration.</p>
                    </div>
                    <form className="mt-5 space-y-4" onSubmit={handleRegistration}>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="w-full sm:max-w-xs">
                            <label htmlFor="username" className="block text-sm font-medium text-white mb-1">
                              Username *
                            </label>
                            <input
                              type="text"
                              name="username"
                              id="username"
                              className="input"
                              placeholder="Choose a username"
                              value={registrationData.username}
                              onChange={(e) => setRegistrationData({...registrationData, username: e.target.value})}
                              required
                            />
                          </div>
                          <div className="w-full sm:max-w-xs">
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                              Email (optional)
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              className="input"
                              placeholder="your@email.com"
                              value={registrationData.email}
                              onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                            />
                          </div>
                        </div>
                        {registrationError && (
                          <p className="mt-1 text-sm text-red-600">{registrationError}</p>
                        )}
                        {registrationSuccess && (
                          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-md">
                            <p className="text-sm text-green-400">{registrationSuccess.message}</p>
                            {registrationSuccess.encryptionKey && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-green-300">Your encryption key (keep it safe!):</p>
                                <div className="mt-1 p-2 bg-green-900/30 rounded text-xs font-mono break-all text-green-200">
                                  {registrationSuccess.encryptionKey}
                                </div>
                                <p className="mt-2 text-xs text-red-400">
                                  ⚠️ Please save this key in a secure place. You'll need it to access your encrypted files.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isRegistering}
                          className={`btn-primary ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isRegistering ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Registering...
                            </>
                          ) : 'Register'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Welcome Card */}
                  <div className="card glass card-hover fade-in">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-600 rounded-md p-3 glow pulse-soft">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-dark-300 truncate">
                              Welcome back, {userProfile?.username || 'User'}
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-white">
                                {wallet.account ? (
                                  <span className="font-mono">{formatAddress(wallet.account)}</span>
                                ) : 'No wallet connected'}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  {activeTab === 'dashboard' && (
                    <>
                      {/* Quick Stats */}
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="card glass card-hover fade-in">
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 glow">
                                <Shield className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-dark-300 truncate">Access Level</dt>
                                  <dd>
                                    <div className="text-lg font-medium text-white">Standard</div>
                                  </dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="card glass card-hover fade-in" style={{animationDelay:'60ms'}}>
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 glow">
                                <Activity className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-dark-300 truncate">Reputation</dt>
                                  <dd>
                                    <div className="text-lg font-medium text-white">
                                      {userProfile?.reputationScore || 0}
                                    </div>
                                  </dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="card glass card-hover fade-in" style={{animationDelay:'120ms'}}>
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 glow">
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-dark-300 truncate">Files Stored</dt>
                                  <dd>
                                    <div className="text-lg font-medium text-white">
                                      {fileCount}
                                    </div>
                                  </dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="card glass card-hover fade-in">
                        <div className="px-4 py-5 sm:p-6">
                          <h3 className="text-lg leading-6 font-medium text-white mb-3">Quick Actions</h3>
                          <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => setActiveTab('files')} className="btn-primary">Manage Files</button>
                            <button type="button" onClick={() => setActiveTab('settings')} className="btn-secondary">Settings</button>
                            {/* Leaderboard removed */}
                          </div>
                        </div>
                      </div>

                      {/* About Project */}
                      <div className="card glass card-hover fade-in">
                        <div className="px-4 py-5 sm:p-6">
                          <h3 className="text-lg leading-6 font-medium text-white mb-2">About BSCIAM</h3>
                          <p className="text-sm text-dark-300 mb-3">
                            BSCIAM is a blockchain-based secure cloud identity and access management framework.
                            Files are encrypted client-side with your personal key and stored locally for this demo.
                            Smart-contracts back user identity and token logic, while the UI enforces key-based access
                            for upload, download, and delete.
                          </p>
                          <ul className="list-disc list-inside text-sm text-dark-300 space-y-1">
                            <li>Client-side AES encryption before storage</li>
                            <li>Per-account encryption key verification</li>
                            <li>Activity tracking with reputation points</li>
                            <li>Non-custodial wallet login</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'files' && (
                    <div className="card">
                      <div className="px-4 py-5 border-b border-dark-700 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-white">Secure File Storage</h3>
                        <p className="mt-1 text-sm text-dark-300">Upload and manage your encrypted files. All files are encrypted before storage.</p>
                      </div>
                      <div className="px-4 py-5 sm:p-6">
                        <FileManager walletAddress={wallet.account || ''} />
                      </div>
                    </div>
                  )}

                  {/* Activity tab removed per request */}

                  {activeTab === 'settings' && (
                    <div className="card">
                      <div className="px-4 py-5 sm:p-6 space-y-4">
                        <h3 className="text-lg leading-6 font-medium text-white">Settings</h3>
                        <div className="max-w-md">
                          <label className="block text-sm font-medium text-white mb-1">Change Username</label>
                          <input
                            type="text"
                            className="input mb-2"
                            placeholder="Enter new username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newUsername.trim()) {
                                updateUsername(newUsername.trim());
                                setNewUsername('');
                              }
                            }}
                            className="btn-primary"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard removed */}
                  {/* Legacy recent activity removed */}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
