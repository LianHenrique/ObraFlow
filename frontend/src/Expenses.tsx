import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, Wallet, Pencil, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { apiFetch } from './api'

type Obra = { id: number; nome: string }
type Lancamento = { id: number; descricao: string; categoria: string; valor: number; data: string; obraId?: number | null; obra?: { nome: string } }
type Tipo = 'despesa' | 'receita'
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const today = () => new Date().toISOString().slice(0, 10)
const dateValue = (value: string) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? today() : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
const currencyMask = (value: string) => { const digits = value.replace(/\D/g, ''); return digits ? (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '' }
const currencyNumber = (value: string) => Number(value.replace(/\D/g, '') || 0) / 100

export default function Expenses({ token }: { token: string }) {
  const [despesas, setDespesas] = useState<Lancamento[]>([])
  const [receitas, setReceitas] = useState<Lancamento[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [tipo, setTipo] = useState<Tipo>('despesa')
  const [search, setSearch] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Lancamento | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ descricao: '', categoria: 'Material', valor: '', data: today(), obraId: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Lancamento | null>(null)

  async function load() {
    try {
      const responses = await Promise.all([apiFetch('/api/despesas', token), apiFetch('/api/receitas', token), apiFetch('/api/obras', token)])
      if (responses.some(r => !r.ok)) throw new Error('Não foi possível consultar os lançamentos.')
      setDespesas(await responses[0].json()); setReceitas(await responses[1].json()); setObras(await responses[2].json()); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar o financeiro.') }
  }
  useEffect(() => { void load() }, [token])

  const all = tipo === 'despesa' ? despesas : receitas
  const filtered = useMemo(() => all.filter(item => {
    const d = dateValue(item.data)
    const textMatch = (item.descricao + ' ' + item.categoria + ' ' + (item.obra?.nome ?? '')).toLowerCase().includes(search.toLowerCase())
    return textMatch && (!inicio || d >= inicio) && (!fim || d <= fim)
  }), [all, search, inicio, fim])
  const totalDespesas = despesas.reduce((s, x) => s + x.valor, 0)
  const totalReceitas = receitas.reduce((s, x) => s + x.valor, 0)
  const totalFiltrado = filtered.reduce((s, x) => s + x.valor, 0)

  function openNew() { setEditing(null); setForm({ descricao: '', categoria: tipo === 'despesa' ? 'Material' : 'Serviço', valor: '', data: today(), obraId: '' }); setShowForm(true) }
  function openEdit(item: Lancamento) { setEditing(item); setForm({ descricao: item.descricao, categoria: item.categoria, valor: currencyMask(String(Math.round(item.valor * 100))), data: dateValue(item.data), obraId: item.obraId ? String(item.obraId) : '' }); setShowForm(true) }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { descricao: form.descricao.trim(), categoria: form.categoria, valor: currencyNumber(form.valor), data: new Date(form.data + 'T12:00:00').toISOString(), obraId: form.obraId ? Number(form.obraId) : null }
      const base = tipo === 'despesa' ? '/api/despesas' : '/api/receitas'
      const response = await apiFetch(editing ? base + '/' + editing.id : base, token, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.message || 'Não foi possível salvar o lançamento.') }
      setShowForm(false); setEditing(null); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar lançamento.') }
    finally { setSaving(false) }
  }

  async function remove() {
    if (!deleteTarget) return
    const base = tipo === 'despesa' ? '/api/despesas/' : '/api/receitas/'
    const response = await apiFetch(base + deleteTarget.id, token, { method: 'DELETE' })
    if (response.ok) { setDeleteTarget(null); await load() } else setError('Não foi possível excluir o lançamento.')
  }

  const categories = tipo === 'despesa' ? ['Material','Mão de obra','Equipamentos','Transporte','Alimentação','Outros'] : ['Serviço','Medição','Adiantamento','Reembolso','Outros']
  return <>
    <section className="page-heading"><div><div className="eyebrow">CONTROLE FINANCEIRO</div><h1>Financeiro</h1><p>Acompanhe entradas, saídas e o resultado das suas obras.</p></div><button className="primary-button" onClick={openNew}><Plus size={18}/> Novo lançamento</button></section>
    {error && <div className="error-banner">{error}<button onClick={() => void load()}>Tentar novamente</button></div>}
    <section className="metrics-grid expense-summary">
      <article className="metric-card"><div className="metric-top"><span>Receitas registradas</span><div className="metric-icon green"><ArrowUpCircle/></div></div><strong className="metric-value">{money(totalReceitas)}</strong><div className="metric-note">{receitas.length} entrada(s)</div></article>
      <article className="metric-card"><div className="metric-top"><span>Despesas registradas</span><div className="metric-icon orange"><ArrowDownCircle/></div></div><strong className="metric-value">{money(totalDespesas)}</strong><div className="metric-note">{despesas.length} saída(s)</div></article>
      <article className="metric-card"><div className="metric-top"><span>Resultado financeiro</span><div className="metric-icon blue"><Wallet/></div></div><strong className="metric-value">{money(totalReceitas-totalDespesas)}</strong><div className="metric-note">Receitas menos despesas</div></article>
      <article className="metric-card"><div className="metric-top"><span>Total no filtro</span><div className="metric-icon purple"><Wallet/></div></div><strong className="metric-value">{money(totalFiltrado)}</strong><div className="metric-note">{filtered.length} lançamento(s) exibidos</div></article>
    </section>
    <section className="panel projects-panel finance-panel">
      <div className="projects-header finance-header"><div><span className="eyebrow">MOVIMENTAÇÕES</span><h2>Fluxo financeiro</h2><p>Consulte e edite seus lançamentos por período.</p></div><div className="finance-filters"><div className="finance-tabs"><button className={tipo==='receita'?'selected':''} onClick={()=>setTipo('receita')}>Receitas</button><button className={tipo==='despesa'?'selected':''} onClick={()=>setTipo('despesa')}>Despesas</button></div><label className="search-box"><Search size={16}/><input placeholder="Buscar lançamento..." value={search} onChange={e=>setSearch(e.target.value)}/></label></div></div>
      <div className="date-filters"><label>De<input type="date" value={inicio} onChange={e=>setInicio(e.target.value)}/></label><label>Até<input type="date" value={fim} onChange={e=>setFim(e.target.value)}/></label><button className="secondary-button" onClick={()=>{setInicio('');setFim('');setSearch('')}}>Limpar filtros</button></div>
      <div className="table-wrap"><table><thead><tr><th>DESCRIÇÃO</th><th>OBRA</th><th>CATEGORIA</th><th>DATA</th><th>VALOR</th><th>AÇÕES</th></tr></thead><tbody>{filtered.length===0?<tr><td colSpan={6} className="empty-state">Nenhum lançamento encontrado.</td></tr>:filtered.map(item=><tr key={item.id}><td className="amount-cell">{item.descricao}</td><td>{obras.find(o=>o.id===item.obraId)?.nome ?? '—'}</td><td>{item.categoria}</td><td>{new Date(item.data).toLocaleDateString('pt-BR')}</td><td className="amount-cell">{money(item.valor)}</td><td><div className="row-actions"><button className="icon-button edit" title="Editar lançamento" onClick={()=>openEdit(item)}><Pencil size={16}/></button><button className="icon-button danger" title="Excluir lançamento" onClick={()=>setDeleteTarget(item)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
      <div className="table-footer"><span>{filtered.length} lançamento(s)</span><strong>{money(totalFiltrado)}</strong></div>
    </section>
    {showForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setShowForm(false)}}><form className="modal" onSubmit={save}><div className="modal-header"><div><span className="eyebrow">{editing?'EDITAR LANÇAMENTO':'NOVO LANÇAMENTO'}</span><h2>{editing?'Editar':'Registrar'} {tipo==='despesa'?'despesa':'receita'}</h2></div><button type="button" className="icon-button" onClick={()=>setShowForm(false)}>×</button></div>
      <label>Descrição<input required maxLength={120} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder={tipo==='despesa'?'Ex.: Compra de cimento':'Ex.: Pagamento de medição'}/></label>
      <div className="form-row"><label>Valor (R$)<input className="currency-input" required inputMode="numeric" value={form.valor} onChange={e=>setForm({...form,valor:currencyMask(e.target.value)})} placeholder="0,00"/><small className="field-hint">Digite os números; a formatação brasileira é aplicada automaticamente.</small></label><label>Categoria<select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}>{categories.map(x=><option key={x}>{x}</option>)}</select></label></div>
      <div className="form-row"><label>Obra (opcional)<select value={form.obraId} onChange={e=>setForm({...form,obraId:e.target.value})}><option value="">Sem obra vinculada</option>{obras.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></label><label>Data<input type="date" required value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/></label></div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving?'Salvando...':editing?'Salvar alterações':'Salvar lançamento'}</button></div>
    </form></div>}
    {deleteTarget && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDeleteTarget(null)}}><section className="confirm-modal" role="alertdialog" aria-modal="true"><div className="confirm-icon"><Trash2 size={22}/></div><div className="confirm-content"><span className="eyebrow">CONFIRMAÇÃO</span><h2>Excluir lançamento?</h2><p>Deseja excluir <strong>{deleteTarget.descricao}</strong>? Esta ação não poderá ser desfeita.</p></div><div className="modal-actions"><button className="secondary-button" onClick={()=>setDeleteTarget(null)}>Cancelar</button><button className="danger-button" onClick={()=>void remove()}><Trash2 size={16}/> Excluir</button></div></section></div>}
  </>
}
