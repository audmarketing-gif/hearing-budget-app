import React, { useState } from 'react';
import { signInWithEmailAndPassword, auth } from '../services/firebase';
import { Ear, AlertCircle, Loader2 } from 'lucide-react';

const BrandLogo = () => (
  <div className="flex flex-col items-center select-none mb-8">
    <h1 className="text-3xl font-black text-blue-900 tracking-tighter leading-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>
      VISION CARE
    </h1>
    <div className="flex w-full mt-1 shadow-sm max-w-[200px]">
      <div className="bg-blue-900 text-white text-[10px] font-bold py-0.5 px-2 flex-grow text-center flex items-center justify-center tracking-wider">
        HEAR<Ear size={10} className="mx-[0.5px] -mt-[1px]" strokeWidth={3} />NG
      </div>
      <div className="bg-cyan-500 text-white text-[10px] font-bold py-0.5 px-2 flex-grow text-center tracking-wider">
        SOLUTIONS
      </div>
    </div>
  </div>
);

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Try again later.');
      } else {
        setError('Authentication failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-stone-100 w-full max-w-md transition-all duration-300">
        <BrandLogo />
        
        <h2 className="text-center text-xl font-bold text-stone-800 mb-2">
          Team Portal Access
        </h2>
        <p className="text-center text-sm text-stone-500 mb-6">
          Enter your credentials to manage the budget.
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg text-sm mb-4 flex items-center animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800"
              placeholder="name@visioncare.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-800"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-stone-400">
          Authorized personnel only.
        </div>
      </div>
    </div>
  );
};

export default Auth;