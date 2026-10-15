import { useState } from 'react';
import { Activity, ArrowRight, Plus } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (isAuthenticated) return <Navigate to={location.state?.from || '/'} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await signIn({ email, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="login-screen">
      <div className="login-panel">
        <a className="brand login-brand" href="/">
          <span className="brand-mark"><Plus size={19} strokeWidth={3} /></span>
          <span>careflow<small>CLINIC MANAGEMENT</small></span>
        </a>
        <div className="login-illustration">
          <span className="login-orbit orbit-one" />
          <span className="login-orbit orbit-two" />
          <div className="login-illustration-mark"><Activity size={42} /></div>
          <span className="login-float float-one"><Plus size={18} /></span>
          <span className="login-float float-two"><Activity size={15} /></span>
        </div>
        <p className="eyebrow">YOUR CLINIC, IN SYNC</p>
        <h1>Better care starts<br />with a better flow.</h1>
        <p className="login-description">A calmer way to manage your day, your patients, and the moments that matter.</p>
        <div className="login-dots"><i /><i /><i /></div>
      </div>
      <div className="login-form-side">
        <form className="login-form" onSubmit={submit}>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to Careflow</h2>
          <p className="login-subtitle">Enter your clinic credentials to continue.</p>
          {error && <div className="login-error" role="alert">{error}</div>}
          <label className="field">
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@clinic.com" autoComplete="username" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          </label>
          <button className="button button-primary login-submit" type="submit" disabled={pending}>
            {pending ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}
          </button>
          <p className="login-footnote">Need access? Contact your clinic administrator.</p>
        </form>
        <span className="login-copyright">© 2025 Careflow Health Systems</span>
      </div>
    </main>
  );
}
