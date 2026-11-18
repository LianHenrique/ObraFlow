import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowUpRight, Building2, Check, ChevronDown, CircleHelp, ClipboardList, HardHat, LayoutDashboard, Plus, Search, TrendingUp, Wallet, X, Trash2, Pencil, Save } from 'lucide-react'
import Expenses from './Expenses'

type Obra = { id: number; nome: string; cliente: string; endereco: string; orcamento: number; dataInicio: string; previsaoEntrega?: string | null; status: string }
type Resumo = { totalObras: number; obrasEmAndamento: number; orcamentoTotal: number; totalDespesas: number; saldoDisponivel: number }
const API = import.meta.env.VITE_API_URL || ''
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const parseCurrencyInput = (value: string) => Number(value.replace(/\D/g, '') || 0) / 100
const dateForInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const initialForm = () => ({ nome: '', cliente: '', endereco: '', orcamento: '', dataInicio: new Date().toISOString().slice(0, 10), previsaoEntrega: '', status: 'Em andamento' })

export default function App() {
  const [page, setPage] = useState<'dashboard' | 'obras' | 'financeiro' | 'relatorios'>('dashboard')
  const [obras, setObras] = useState<Obra[]>([])
  const [resumo, setResumo] = useState<Resumo>({ totalObras: 0, obrasEmAndamento: 0, orcamentoTotal: 0, totalDespesas: 0, saldoDisponivel: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editingObra, setEditingObra] = useState<Obra | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Obra | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(initialForm)

  async function load() {
    try {
      setError('')
      const [worksResponse, summaryResponse] = await Promise.all([fetch(API + '/api/obras'), fetch(API + '/api/dashboard/resumo')])
      if (!worksResponse.ok || !summaryResponse.ok) throw new Error('Não foi possível carregar os dados da API.')
      setObras(await worksResponse.json())
      setResumo(await summaryResponse.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao conectar à API.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => obras.filter(o => (o.nome + ' ' + o.cliente + ' ' + o.status).toLowerCase().includes(search.toLowerCase())), [obras, search])
  const statusClass = (status: string) => status.toLowerCase().replaceAll(' ', '-')
  const pageTitle = page === 'dashboard' ? 'Visão geral' : page === 'obras' ? 'Obras' : page === 'financeiro' ? 'Financeiro' : 'Relatórios'

  function openCreateModal() {
    setEditingObra(null)
    setForm(initialForm())
    setModal(true)
  }

  function openEditModal(obra: Obra) {
    setEditingObra(obra)
    setForm({
      nome: obra.nome,
      cliente: obra.cliente,
      endereco: obra.endereco || '',
      orcamento: formatCurrencyInput(String(Math.round(obra.orcamento * 100))),
      dataInicio: dateForInput(obra.dataInicio),
      previsaoEntrega: dateForInput(obra.previsaoEntrega),
      status: obra.status
    })
    setModal(true)
  }

  function closeFormModal() {
    if (saving) return
    setModal(false)
    setEditingObra(null)
    setForm(initialForm())
  }

  async function saveObra(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        orcamento: parseCurrencyInput(form.orcamento),
        dataInicio: new Date(form.dataInicio + 'T12:00:00').toISOString(),
        previsaoEntrega: form.previsaoEntrega ? new Date(form.previsaoEntrega + 'T12:00:00').toISOString() : null
      }
      const response = await fetch(API + (editingObra ? '/api/obras/' + editingObra.id : '/api/obras'), {
        method: editingObra ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || 'Confira os dados e tente novamente.')
      }
      setModal(false)
      setEditingObra(null)
      setForm(initialForm())
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar obra.') }
    finally { setSaving(false) }
  }

  async function deleteObra() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(API + '/api/obras/' + deleteTarget.id, { method: 'DELETE' })
      if (!response.ok) throw new Error('Não foi possível excluir a obra.')
      setDeleteTarget(null)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível excluir a obra.') }
    finally { setDeleting(false) }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><HardHat size={22}/></div><span>obra<span className="brand-light">flow</span><small>GESTÃO INTELIGENTE</small></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        <button className={'nav-item ' + (page === 'dashboard' ? 'active' : '')} onClick={() => setPage('dashboard')}><LayoutDashboard size={18}/> Visão geral</button>
        <button className={'nav-item ' + (page === 'obras' ? 'active' : '')} onClick={() => setPage('obras')}><Building2 size={18}/> Obras <span className="nav-count">{obras.length}</span></button>
        <button className={'nav-item ' + (page === 'financeiro' ? 'active' : '')} onClick={() => setPage('financeiro')}><Wallet size={18}/> Financeiro</button>
        <button className={'nav-item ' + (page === 'relatorios' ? 'active' : '')} onClick={() => setPage('relatorios')}><ClipboardList size={18}/> Relatórios</button>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={18}/><strong>Precisa de ajuda?</strong><p>Acompanhe suas obras com mais controle.</p></div><div className="profile"><div className="avatar">OF</div><div><strong>Administrador</strong><small>Conta de demonstração</small></div><ChevronDown size={16}/></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{pageTitle}</strong></div><div className="top-actions"><span className="live-dot">Sistema online</span><div className="avatar small-avatar">OF</div></div></header>
      {error && <div className="error-banner">{error}<button onClick={() => void load()}>Tentar novamente</button><button aria-label="Fechar aviso" onClick={() => setError('')}><X size={14}/></button></div>}
      {page === 'financeiro' ? <Expenses/> : page === 'relatorios' ? <><section className="page-heading"><div><div className="eyebrow">ANÁLISE E DESEMPENHO</div><h1>Relatórios</h1><p>Resumo consolidado da carteira de obras.</p></div><button className="secondary-button" onClick={() => window.print()}>Imprimir relatório</button></section><section className="metrics-grid"><Metric title="Obras cadastradas" value={String(resumo.totalObras)} note="Total de projetos" icon={<Building2/>} tone="blue"/><Metric title="Obras em andamento" value={String(resumo.obrasEmAndamento)} note="Projetos ativos" icon={<Activity/>} tone="green"/><Metric title="Orçamento total" value={money(resumo.orcamentoTotal)} note="Valor planejado" icon={<Wallet/>} tone="purple"/><Metric title="Despesas acumuladas" value={money(resumo.totalDespesas)} note="Total lançado" icon={<TrendingUp/>} tone="orange"/></section><section className="panel projects-panel report-panel"><div className="projects-header"><div><span className="eyebrow">DISTRIBUIÇÃO</span><h2>Resumo por obra</h2></div></div><div className="table-wrap"><table><thead><tr><th>OBRA</th><th>CLIENTE</th><th>ORÇAMENTO</th><th>STATUS</th></tr></thead><tbody>{obras.map(o => <tr key={o.id}><td className="amount-cell">{o.nome}</td><td>{o.cliente}</td><td>{money(o.orcamento)}</td><td><span className={'status-pill ' + statusClass(o.status)}>{o.status}</span></td></tr>)}</tbody></table></div></section></> : <>
        <section className="page-heading"><div><div className="eyebrow">{page === 'obras' ? 'GERENCIAMENTO DE PROJETOS' : 'PAINEL DE CONTROLE'}</div><h1>{pageTitle}</h1><p>{page === 'obras' ? 'Cadastre, consulte e acompanhe seus projetos.' : 'Acompanhe o desempenho e a evolução das suas obras.'}</p></div><button className="primary-button" onClick={openCreateModal}><Plus size={18}/> Nova obra</button></section>
        {page === 'dashboard' && <>
          <section className="metrics-grid"><Metric title="Total de obras" value={String(resumo.totalObras)} note="Obras cadastradas" icon={<Building2/>} tone="blue"/><Metric title="Em andamento" value={String(resumo.obrasEmAndamento)} note="Projetos ativos" icon={<Activity/>} tone="green"/><Metric title="Orçamento total" value={money(resumo.orcamentoTotal)} note="Valor planejado" icon={<Wallet/>} tone="purple"/><Metric title="Despesas registradas" value={money(resumo.totalDespesas)} note="Total lançado" icon={<TrendingUp/>} tone="orange"/></section>
          <section className="overview-grid"><div className="panel balance-panel"><div className="panel-heading"><div><span className="eyebrow">RESUMO FINANCEIRO</span><h2>Saldo disponível</h2></div><span className="panel-icon"><Wallet size={19}/></span></div><div className="balance-value">{money(resumo.saldoDisponivel)}</div><div className="balance-caption">Orçamento total menos despesas registradas</div><div className="balance-track"><span style={{ width: (resumo.orcamentoTotal > 0 ? Math.min(100, resumo.totalDespesas / resumo.orcamentoTotal * 100) : 0) + '%' }}/></div><div className="balance-legend"><span><i className="legend-dot spent"/> Despesas <strong>{money(resumo.totalDespesas)}</strong></span><span><i className="legend-dot available"/> Orçamento <strong>{money(resumo.orcamentoTotal)}</strong></span></div></div><div className="panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Atividade das obras</h2></div></div><div className="quick-stat"><div className="quick-stat-icon green-bg"><Check size={18}/></div><div><strong>{resumo.obrasEmAndamento} obras ativas</strong><small>Em execução neste momento</small></div></div><div className="quick-stat"><div className="quick-stat-icon blue-bg"><Building2 size={18}/></div><div><strong>{resumo.totalObras} projetos cadastrados</strong><small>Na sua carteira de obras</small></div></div></div></section>
        </>}
        <section className="panel projects-panel"><div className="projects-header"><div><span className="eyebrow">{page === 'obras' ? 'CARTEIRA DE PROJETOS' : 'GERENCIAMENTO'}</span><h2>{page === 'obras' ? 'Todas as obras' : 'Suas obras'}</h2><p>Consulte e gerencie os projetos cadastrados.</p></div><div className="table-actions"><label className="search-box"><Search size={17}/><input placeholder="Buscar obra ou cliente..." value={search} onChange={e => setSearch(e.target.value)}/></label></div></div>
          <div className="table-wrap"><table><thead><tr><th>OBRA / CLIENTE</th><th>ORÇAMENTO</th><th>INÍCIO</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="empty-state">Carregando obras...</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="empty-state">{search ? 'Nenhuma obra encontrada.' : 'Nenhuma obra cadastrada. Clique em “Nova obra” para começar.'}</td></tr> : filtered.map(obra => <tr key={obra.id}><td><div className="project-name"><div className="project-avatar"><Building2 size={17}/></div><div><strong>{obra.nome}</strong><small>{obra.cliente}</small></div></div></td><td className="amount-cell">{money(obra.orcamento)}</td><td>{new Date(obra.dataInicio).toLocaleDateString('pt-BR')}</td><td><span className={'status-pill ' + statusClass(obra.status)}>{obra.status}</span></td><td><div className="row-actions"><button className="icon-button edit" title="Editar obra" aria-label={'Editar obra ' + obra.nome} onClick={() => openEditModal(obra)}><Pencil size={16}/></button><button className="icon-button danger" title="Excluir obra" aria-label={'Excluir obra ' + obra.nome} onClick={() => setDeleteTarget(obra)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div><div className="table-footer"><span>Exibindo {filtered.length} de {obras.length} obras</span><span>Atualizado após cada operação <i className="live-dot"/></span></div>
        </section>
      </>}
      <footer className="footer">© 2026 ObraFlow <span>Feito para simplificar a gestão de obras.</span></footer>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeFormModal() }}><form className="modal" onSubmit={saveObra}><div className="modal-header"><div><span className="eyebrow">{editingObra ? 'ATUALIZAÇÃO DO PROJETO' : 'NOVO PROJETO'}</span><h2>{editingObra ? 'Editar obra' : 'Cadastrar obra'}</h2></div><button type="button" className="icon-button" aria-label="Fechar" onClick={closeFormModal}><X size={20}/></button></div><label>Nome da obra<input required maxLength={120} value={form.nome} onChange={e => setForm({...form, nome:e.target.value})} placeholder="Ex.: Residencial Jardim"/></label><label>Cliente<input required maxLength={120} value={form.cliente} onChange={e => setForm({...form, cliente:e.target.value})} placeholder="Nome do cliente"/></label><label>Endereço<input maxLength={200} value={form.endereco} onChange={e => setForm({...form, endereco:e.target.value})} placeholder="Endereço da obra"/></label><div className="form-row"><label>Orçamento (R$)<input required inputMode="numeric" value={form.orcamento} onChange={e => setForm({...form, orcamento:formatCurrencyInput(e.target.value)})} placeholder="150.000,00"/><small className="field-hint">Digite o valor em reais. Ex.: 15000000 = R$ 150.000,00</small></label><label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}><option>Em andamento</option><option>Planejamento</option><option>Concluída</option><option>Paralisada</option></select></label></div><div className="form-row"><label>Data de início<input type="date" required value={form.dataInicio} onChange={e => setForm({...form, dataInicio:e.target.value})}/></label><label>Previsão de entrega<input type="date" value={form.previsaoEntrega} onChange={e => setForm({...form, previsaoEntrega:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={closeFormModal}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Salvando...' : editingObra ? <><Save size={17}/> Salvar alterações</> : <><Plus size={17}/> Cadastrar obra</>}</button></div></form></div>}
    {deleteTarget && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null) }}><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><div className="confirm-icon"><Trash2 size={22}/></div><div className="confirm-content"><span className="eyebrow">CONFIRMAÇÃO</span><h2 id="delete-title">Excluir obra?</h2><p id="delete-description">Você está prestes a excluir <strong>{deleteTarget.nome}</strong> e todas as despesas vinculadas. Essa ação não poderá ser desfeita.</p></div><div className="modal-actions"><button className="secondary-button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="danger-button" disabled={deleting} onClick={() => void deleteObra()}>{deleting ? 'Excluindo...' : <><Trash2 size={16}/> Excluir obra</>}</button></div></section></div>}
    </div>
}

function Metric({ title, value, note, icon, tone }: { title: string; value: string; note: string; icon: React.ReactNode; tone: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{title}</span><div className={'metric-icon ' + tone}>{icon}</div></div><strong className="metric-value">{value}</strong><div className="metric-note"><span className="note-indicator"><ArrowUpRight size={13}/></span>{note}</div></article>
}
