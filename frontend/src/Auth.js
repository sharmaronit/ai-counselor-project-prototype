import { useState } from 'react';
import { supabase } from './supabaseClient';
import GlassCard from './components/GlassCard';
import './Auth.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ... (Your handleLogin and handleSignup functions are correct and stay the same) ...
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('Signup successful! Check your email for a confirmation link.');
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    // THE FIX: We add the `auth-container` className to this root div
    <div className="auth-container"> 
      <div className="auth-card">
        <GlassCard>
          <div className="auth-form-widget">
            <h1 className="auth-header">AI Counsellor</h1>
            <p className="auth-description">Sign in or create an account to continue</p>
            <form onSubmit={handleLogin}>
              <div>
                <input
                  className="auth-inputField"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  className="auth-inputField"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="auth-button-group">
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? '...' : 'Login'}
                </button>
                <button type="button" onClick={handleSignup} className="auth-button" disabled={loading}>
                  {loading ? '...' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}