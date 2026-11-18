import { useState } from 'react';
import { HardHat, LogIn, UserPlus } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';
type User = { id: string; nome: string; email: string };
type Props = { onAuthenticated: (token: string, user: User) => void };

export default function AuthPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (mode === 'register' && senha !== confirm) { setError('As senhas não coincidem.'); return; }
    setBusy(true);
    try {
      const response = await fetch(API + (mode === 'login' ? '/api/auth/login' : '/api/auth/register'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, senha } : { nome, email, senha })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || (response.status === 401 ? 'E-mail ou senha incorretos.' : 'Não foi possível concluir. Tente novamente.'));
      onAuthenticated(data.token, data.user);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao conectar à API.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><span className="auth-logo"><HardHat size={25}/></span><div>obra<span>flow</span><small>GESTÃO INTELIGENTE</small></div></div>
      <div className="auth-heading"><span className="eyebrow">{mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'COMECE AGORA'}</span><h1>{mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</h1><p>{mode === 'login' ? 'Entre para acompanhar suas obras e finanças.' : 'Cadastre-se para gerenciar suas obras com segurança.'}</p></div>
      <form onSubmit={submit} className="auth-form">
        {mode === 'register' && <label>Nome completo<input required maxLength={100} autoComplete="name" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome"/></label>}
        <label>E-mail<input required type="email" maxLength={180} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
        <label>Senha<input required type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Mínimo de 8 caracteres"/></label>
        {mode === 'register' && <label>Confirmar senha<input required type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Digite a senha novamente"/></label>}
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? <><LogIn size={17}/> Entrar</> : <><UserPlus size={17}/> Criar conta</>}</button>
      </form>
      <div className="auth-switch">{mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'} <button onClick={()=>{setMode(mode === 'login' ? 'register' : 'login');setError('')}}>{mode === 'login' ? 'Cadastre-se' : 'Fazer login'}</button></div>
      <p className="auth-security">Seus dados ficam separados por conta.</p>
    </section>
  </main>;
}
