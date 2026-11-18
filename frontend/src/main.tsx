import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthPage from './AuthPage';
import './styles.css';

type User = { id: string; nome: string; email: string };
const API = import.meta.env.VITE_API_URL || '';

function Root() {
  const [token, setToken] = useState(() => localStorage.getItem('obraflow_token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    fetch(API + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(async response => {
        if (!response.ok) throw new Error('Sessão expirada');
        setUser(await response.json());
      })
      .catch(() => { localStorage.removeItem('obraflow_token'); setToken(''); setUser(null); })
      .finally(() => setChecking(false));
  }, []);

  function authenticated(nextToken: string, nextUser: User) {
    localStorage.setItem('obraflow_token', nextToken);
    setToken(nextToken); setUser(nextUser);
  }
  function logout() {
    localStorage.removeItem('obraflow_token');
    setToken(''); setUser(null);
  }

  if (checking) return <div className="auth-loading">Carregando sua sessão...</div>;
  if (!token || !user) return <AuthPage onAuthenticated={authenticated}/>;
  return <App token={token} user={user} onLogout={logout}/>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
