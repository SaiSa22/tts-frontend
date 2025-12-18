import React, { useState } from 'react';

interface AuthProps {
  onLoginSuccess: (email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // --- TODO: REPLACE THIS WITH REAL BACKEND CALL ---
    // For now, we simulate a network delay and pretend it worked.
    setTimeout(() => {
        if (email && password.length >= 6) {
             onLoginSuccess(email);
        } else {
             setError("Invalid credentials. Password must be at least 6 chars.");
             setLoading(false);
        }
    }, 1000);
    // ------------------------------------------------
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500">
            {isLoginMode ? 'Enter your details to access the system' : 'Sign up to start creating alerts'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-200">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3.5 text-lg font-bold text-white rounded-xl shadow-lg transform transition-all active:scale-95 
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'}`}
          >
            {loading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
              className="text-blue-600 font-bold hover:underline focus:outline-none"
            >
              {isLoginMode ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
