import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Wallet } from 'lucide-react'

type Obra = { id: number; nome: string }
type Despesa = { id: number; descricao: string; categoria: string; valor: number; data: string; obraId: number; obra?: { nome: string } }
const API = import.meta.env.VITE_API_URL || ''
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Expenses() {
  const [items, setItems] = useState<Despesa[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ descricao: '', categoria: 'Material', valor: '', data: new Date().toISOString().slice(0, 10), obraId: '' })

  async function load() {
    try {
      const responses = await Promise.all([fetch(API + '/api/despesas'), fetch(API + '/api/obras')])
      if (!responses[0].ok || !responses[1].ok) throw new Error('Falha ao consultar a API.')
      setItems(await responses[0].json())
      setObras(await responses[1].json())
      setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar despesas.') }
  }
  useEffect(() => { void load() }, [])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch(API + '/api/despesas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, valor: Number(form.valor), obraId: Number(form.obraId), data: new Date(form.data + 'T12:00:00').toISOString() }) })
    if (!response.ok) { setError('Não foi possível salvar. Confira os dados e a obra selecionada.'); return }
    setShowForm(false)
    setForm({ descricao: '', categoria: 'Material', valor: '', data: new Date().toISOString().slice(0, 10), obraId: '' })
    await load()
  }

  async function remove(item: Despesa) {
    if (!confirm('Excluir a despesa "' + item.descricao + '"?')) return
    const response = await fetch(API + '/api/despesas/' + item.id, { method: 'DELETE' })
    if (response.ok) await load()
    else setError('Não foi possível excluir a despesa.')
  }

  const filtered = items.filter(item => (item.descricao + ' ' + item.categoria + ' ' + (item.obra?.nome ?? '')).toLowerCase().includes(search.toLowerCase()))
  const total = filtered.reduce((sum, item) => sum + item.valor, 0)

  return <><section className="page-heading"><div><div className="eyebrow">CONTROLE FINANCEIRO</div><h1>Despesas</h1><p>Registre e acompanhe os custos de cada obra.</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18}/> Nova despesa</button></section>
    {error && <div className="error-banner">{error}<button onClick={() => void load()}>Tentar novamente</button></div>}
    <section className="metrics-grid expense-summary"><article className="metric-card"><div className="metric-top"><span>Total de lançamentos</span><div className="metric-icon blue"><Wallet/></div></div><strong className="metric-value">{items.length}</strong><div className="metric-note">Despesas registradas</div></article><article className="metric-card"><div className="metric-top"><span>Total listado</span><div className="metric-icon orange"><Wallet/></div></div><strong className="metric-value">{money(total)}</strong><div className="metric-note">Soma dos resultados filtrados</div></article></section>
    <section className="panel projects-panel"><div className="projects-header"><div><span className="eyebrow">LANÇAMENTOS</span><h2>Histórico de despesas</h2><p>Todos os custos associados às obras.</p></div><label className="search-box"><Search size={17}/><input placeholder="Buscar despesa, categoria ou obra..." value={search} onChange={e => setSearch(e.target.value)}/></label></div>
      <div className="table-wrap"><table><thead><tr><th>DESCRIÇÃO</th><th>OBRA</th><th>CATEGORIA</th><th>DATA</th><th>VALOR</th><th></th></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={6} className="empty-state">Nenhuma despesa encontrada.</td></tr> : filtered.map(item => <tr key={item.id}><td className="amount-cell">{item.descricao}</td><td>{item.obra?.nome ?? ('Obra #' + item.obraId)}</td><td>{item.categoria}</td><td>{new Date(item.data).toLocaleDateString('pt-BR')}</td><td className="amount-cell">{money(item.valor)}</td><td><button className="icon-button danger" title="Excluir despesa" onClick={() => void remove(item)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
      <div className="table-footer"><span>{filtered.length} lançamento(s)</span><strong>{money(total)}</strong></div>
    </section>
    {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false) }}><form className="modal" onSubmit={save}><div className="modal-header"><div><span className="eyebrow">NOVO LANÇAMENTO</span><h2>Registrar despesa</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)}>×</button></div>
      <label>Descrição<input required maxLength={120} value={form.descricao} onChange={e => setForm({...form, descricao:e.target.value})} placeholder="Ex.: Compra de cimento"/></label>
      <div className="form-row"><label>Valor (R$)<input required type="number" min="0.01" step="0.01" value={form.valor} onChange={e => setForm({...form, valor:e.target.value})}/></label><label>Categoria<select value={form.categoria} onChange={e => setForm({...form, categoria:e.target.value})}>{['Material','Mão de obra','Equipamentos','Transporte','Alimentação','Outros'].map(x => <option key={x}>{x}</option>)}</select></label></div>
      <div className="form-row"><label>Obra<select required value={form.obraId} onChange={e => setForm({...form, obraId:e.target.value})}><option value="">Selecione uma obra</option>{obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></label><label>Data<input type="date" required value={form.data} onChange={e => setForm({...form, data:e.target.value})}/></label></div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" disabled={obras.length === 0}>Salvar despesa</button></div>
      {obras.length === 0 && <p className="form-hint">Cadastre uma obra antes de lançar despesas.</p>}
    </form></div>}
  </>
}
