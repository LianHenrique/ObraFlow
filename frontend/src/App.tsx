import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Building2, CalendarDays, Check, ChevronDown, CircleHelp, ClipboardList, HardHat, LayoutDashboard, Plus, Search, Settings2, TrendingUp, Wallet, X, Trash2 } from 'lucide-react'

type Obra = { id: number; nome: string; cliente: string; endereco: string; orcamento: number; dataInicio: string; previsaoEntrega?: string | null; status: string }
type Resumo = { totalObras: number; obrasEmAndamento: number; orcamentoTotal: number; totalDespesas: number; saldoDisponivel: number }
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const [obras, setObras] = useState<Obra[]>([])
  const [resumo, setResumo] = useState<Resumo>({ totalObras: 0, obrasEmAndamento: 0, orcamentoTotal: 0, totalDespesas: 0, saldoDisponivel: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome: '', cliente: '', endereco: '', orcamento: '', dataInicio: new Date().toISOString().slice(0, 10), previsaoEntrega: '', status: 'Em andamento' })

  async function load() {
    try {
      setError('')
      const [obrasResponse, resumoResponse] = await Promise.all([fetch(`${API}/api/obras`), fetch(`${API}/api/dashboard/resumo`)])
      if (!obrasResponse.ok || !resumoResponse.ok) throw new Error('Não foi possível carregar os dados da API.')
      setObras(await obrasResponse.json())
      setResumo(await resumoResponse.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao conectar à API.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => obras.filter(o => `${o.nome} ${o.cliente} ${o.status}`.toLowerCase().includes(search.toLowerCase())), [obras, search])
  const statusClass = (status: string) => status.toLowerCase().replaceAll(' ', '-')

  async function createObra(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true)
    try {
      const response = await fetch(`${API}/api/obras`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, orcamento: Number(form.orcamento), dataInicio: new Date(`${form.dataInicio}T12:00:00`).toISOString(), previsaoEntrega: form.previsaoEntrega ? new Date(`${form.previsaoEntrega}T12:00:00`).toISOString() : null }) })
      if (!response.ok) throw new Error('Confira os dados e tente novamente.')
      setModal(false); setForm({ nome: '', cliente: '', endereco: '', orcamento: '', dataInicio: new Date().toISOString().slice(0, 10), previsaoEntrega: '', status: 'Em andamento' }); await load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao cadastrar obra.') }
    finally { setSaving(false) }
  }

  async function deleteObra(obra: Obra) {
    if (!confirm(`Deseja excluir a obra “${obra.nome}” e todas as despesas vinculadas?`)) return
    try { const response = await fetch(`${API}/api/obras/${obra.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error(); await load() }
    catch { alert('Não foi possível excluir a obra.') }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><HardHat size={22}/></div><span>obra<span className="brand-light">flow</span><small>GESTÃO INTELIGENTE</small></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav><a className="nav-item active"><LayoutDashboard size={18}/> Visão geral</a><a className="nav-item"><Building2 size={18}/> Obras <span className="nav-count">{obras.length}</span></a><a className="nav-item"><Wallet size={18}/> Financeiro</a><a className="nav-item"><ClipboardList size={18}/> Relatórios</a></nav>
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={18}/><strong>Precisa de ajuda?</strong><p>Acompanhe suas obras com mais controle.</p></div><a className="nav-item"><Settings2 size={18}/> Configurações</a><div className="profile"><div className="avatar">LH</div><div><strong>Administrador</strong><small>Conta de demonstração</small></div><ChevronDown size={16}/></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Visão geral</strong></div><div className="top-actions"><span className="live-dot">Sistema online</span><div className="avatar small-avatar">LH</div></div></header>
      <section className="page-heading"><div><div className="eyebrow">TERÇA-FEIRA, 17 DE NOVEMBRO</div><h1>Visão geral</h1><p>Acompanhe o desempenho e a evolução das suas obras.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={18}/> Nova obra</button></section>

      {error && <div className="error-banner">{error} <button onClick={() => void load()}>Tentar novamente</button></div>}
      <section className="metrics-grid">
        <Metric title="Total de obras" value={String(resumo.totalObras)} note="Obras cadastradas" icon={<Building2/>} tone="blue"/>
        <Metric title="Em andamento" value={String(resumo.obrasEmAndamento)} note="Projetos ativos" icon={<Activity/>} tone="green"/>
        <Metric title="Orçamento total" value={money(resumo.orcamentoTotal)} note="Valor planejado" icon={<Wallet/>} tone="purple"/>
        <Metric title="Despesas registradas" value={money(resumo.totalDespesas)} note="Total lançado" icon={<TrendingUp/>} tone="orange"/>
      </section>

      <section className="overview-grid">
        <div className="panel balance-panel"><div className="panel-heading"><div><span className="eyebrow">RESUMO FINANCEIRO</span><h2>Saldo disponível</h2></div><span className="panel-icon"><Wallet size={19}/></span></div><div className="balance-value">{money(resumo.saldoDisponivel)}</div><div className="balance-caption">Orçamento total menos despesas registradas</div><div className="balance-track"><span style={{ width: `${resumo.orcamentoTotal > 0 ? Math.min(100, resumo.totalDespesas / resumo.orcamentoTotal * 100) : 0}%` }}/></div><div className="balance-legend"><span><i className="legend-dot spent"/> Despesas <strong>{money(resumo.totalDespesas)}</strong></span><span><i className="legend-dot available"/> Orçamento <strong>{money(resumo.orcamentoTotal)}</strong></span></div></div>
        <div className="panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Atividade das obras</h2></div><CalendarDays size={19} className="muted-icon"/></div><div className="quick-stat"><div className="quick-stat-icon green-bg"><Check size={18}/></div><div><strong>{resumo.obrasEmAndamento} obras ativas</strong><small>Em execução neste momento</small></div></div><div className="quick-stat"><div className="quick-stat-icon blue-bg"><Building2 size={18}/></div><div><strong>{resumo.totalObras} projetos cadastrados</strong><small>Na sua carteira de obras</small></div></div></div>
      </section>

      <section className="panel projects-panel"><div className="projects-header"><div><span className="eyebrow">GERENCIAMENTO</span><h2>Suas obras</h2><p>Consulte e gerencie os projetos cadastrados.</p></div><div className="table-actions"><label className="search-box"><Search size={17}/><input placeholder="Buscar obra ou cliente..." value={search} onChange={e => setSearch(e.target.value)}/></label><button className="filter-button"><Settings2 size={16}/> Filtros</button></div></div>
        <div className="table-wrap"><table><thead><tr><th>OBRA / CLIENTE</th><th>ORÇAMENTO</th><th>INÍCIO</th><th>STATUS</th><th></th></tr></thead><tbody>
          {loading ? <tr><td colSpan={5} className="empty-state">Carregando obras...</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="empty-state">{search ? 'Nenhuma obra encontrada.' : 'Nenhuma obra cadastrada. Clique em “Nova obra” para começar.'}</td></tr> : filtered.map(obra => <tr key={obra.id}><td><div className="project-name"><div className="project-avatar"><Building2 size={17}/></div><div><strong>{obra.nome}</strong><small>{obra.cliente}</small></div></div></td><td className="amount-cell">{money(obra.orcamento)}</td><td>{new Date(obra.dataInicio).toLocaleDateString('pt-BR')}</td><td><span className={`status-pill ${statusClass(obra.status)}`}>{obra.status}</span></td><td><button className="icon-button danger" title="Excluir obra" onClick={() => void deleteObra(obra)}><Trash2 size={16}/></button></td></tr>)}
        </tbody></table></div><div className="table-footer"><span>Exibindo {filtered.length} de {obras.length} obras</span><span>Atualizado em tempo real <i className="live-dot"/></span></div>
      </section>
      <footer className="footer">© 2026 ObraFlow <span>Feito para simplificar a gestão de obras.</span></footer>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}><form className="modal" onSubmit={createObra}><div className="modal-header"><div><span className="eyebrow">NOVO PROJETO</span><h2>Cadastrar obra</h2></div><button type="button" className="icon-button" onClick={() => setModal(false)}><X size={20}/></button></div><label>Nome da obra<input required value={form.nome} onChange={e => setForm({...form, nome:e.target.value})} placeholder="Ex.: Residencial Jardim"/></label><label>Cliente<input required value={form.cliente} onChange={e => setForm({...form, cliente:e.target.value})} placeholder="Nome do cliente"/></label><label>Endereço<input value={form.endereco} onChange={e => setForm({...form, endereco:e.target.value})} placeholder="Endereço da obra"/></label><div className="form-row"><label>Orçamento (R$)<input required min="0.01" step="0.01" type="number" value={form.orcamento} onChange={e => setForm({...form, orcamento:e.target.value})} placeholder="150000,00"/></label><label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}><option>Em andamento</option><option>Planejamento</option><option>Concluída</option><option>Paralisada</option></select></label></div><div className="form-row"><label>Data de início<input type="date" required value={form.dataInicio} onChange={e => setForm({...form, dataInicio:e.target.value})}/></label><label>Previsão de entrega<input type="date" value={form.previsaoEntrega} onChange={e => setForm({...form, previsaoEntrega:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Salvando...' : <><Plus size={17}/> Cadastrar obra</>}</button></div></form></div>}
  </div>
}

function Metric({ title, value, note, icon, tone }: { title: string; value: string; note: string; icon: React.ReactNode; tone: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{title}</span><div className={`metric-icon ${tone}`}>{icon}</div></div><strong className="metric-value">{value}</strong><div className="metric-note"><span className="note-indicator"><ArrowUpRight size={13}/></span>{note}</div></article>
}
