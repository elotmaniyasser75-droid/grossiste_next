
import React, { useState, useMemo } from 'react';
import { Search, Layers, Plus, ArrowUpCircle, ArrowDownCircle, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Modal, Badge, EmptyState } from '../../components/ui/index.jsx';
import { formatDate, formatDateTime, getStockStatus } from '../../utils/helpers';

const MOUVEMENT_TYPES = [
  { value: 'entree', label: 'Entrée de stock', color: 'badge-green' },
  { value: 'sortie', label: 'Sortie de stock', color: 'badge-red' },
  { value: 'ajustement', label: 'Ajustement manuel', color: 'badge-blue' },
];

function MouvementForm({ produits, onSave, onCancel }) {
  const [form, setForm] = useState({ produitId: '', type: 'entree', quantite: '', raison: '', notes: '' });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const selectedProduit = produits.find(p => p.id === form.produitId);

  const validate = () => {
    const e = {};
    if (!form.produitId) e.produitId = 'Sélectionnez un produit.';
    if (!form.quantite || parseInt(form.quantite) <= 0) e.quantite = 'Quantité invalide.';
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const qty = parseInt(form.quantite);
    // Check sufficient stock for sortie
    if (form.type === 'sortie' && selectedProduit && qty > selectedProduit.stock) {
      setErrors({ quantite: `Stock insuffisant. Stock actuel: ${selectedProduit.stock} ${selectedProduit.unite}.` });
      return;
    }

    onSave({ ...form, quantite: qty });
  };

  const newStock = () => {
    if (!selectedProduit || !form.quantite || isNaN(form.quantite)) return null;
    const qty = parseInt(form.quantite);
    if (form.type === 'entree') return selectedProduit.stock + qty;
    if (form.type === 'sortie') return Math.max(0, selectedProduit.stock - qty);
    return qty; // ajustement
  };

  const preview = newStock();

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label required">Produit</label>
          <select className={`form-select${errors.produitId ? ' error' : ''}`} value={form.produitId} onChange={set('produitId')}>
            <option value="">-- Sélectionner un produit --</option>
            {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (Stock: {p.stock} {p.unite})</option>)}
          </select>
          {errors.produitId && <div className="form-error">{errors.produitId}</div>}
        </div>

        <div className="form-group">
          <label className="form-label required">Type de mouvement</label>
          <select className="form-select" value={form.type} onChange={set('type')}>
            {MOUVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label required">
            {form.type === 'ajustement' ? 'Nouveau stock' : 'Quantité'}
          </label>
          <input className={`form-input${errors.quantite ? ' error' : ''}`} type="number" min="0" value={form.quantite} onChange={set('quantite')} placeholder="0" />
          {errors.quantite && <div className="form-error">{errors.quantite}</div>}
          {preview !== null && selectedProduit && (
            <div className="form-hint" style={{ color: preview === 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
              Stock après: {preview} {selectedProduit.unite}
              {preview === 0 && ' — ⚠️ Rupture de stock'}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Raison</label>
          <input className="form-input" value={form.raison} onChange={set('raison')} placeholder="Ex: Livraison fournisseur, casse..." />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} rows={2} placeholder="Notes complémentaires..." />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-5">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary">Enregistrer le mouvement</button>
      </div>
    </form>
  );
}

export default function StockList() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [activeTab, setActiveTab] = useState('stock');
  const [showMouvement, setShowMouvement] = useState(false);

  const filtered = useMemo(() => {
    let list = state.produits;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.nom.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q));
    }
    if (statusFilter === 'Rupture') list = list.filter(p => p.stock === 0);
    if (statusFilter === 'Faible') list = list.filter(p => p.stock > 0 && p.stock <= p.stockMinimum);
    if (statusFilter === 'OK') list = list.filter(p => p.stock > p.stockMinimum);
    return list.sort((a, b) => a.stock - b.stock);
  }, [state.produits, search, statusFilter]);

  const mouvements = useMemo(() =>
    [...state.mouvementsStock].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [state.mouvementsStock]
  );

  const handleMouvement = (data) => {
    dispatch({ type: 'ADD_MOUVEMENT_STOCK', payload: data });
    toast(`Mouvement de stock enregistré.`, 'success');
    setShowMouvement(false);
  };

  const getProduitName = (id) => state.produits.find(p => p.id === id)?.nom || id;

  const ruptures = state.produits.filter(p => p.stock === 0).length;
  const faibles = state.produits.filter(p => p.stock > 0 && p.stock <= p.stockMinimum).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion du stock</h1>
          <p className="page-subtitle">
            {state.produits.length} produits —
            {ruptures > 0 && <span style={{ color: 'var(--color-danger)', marginLeft: 6 }}>{ruptures} en rupture</span>}
            {faibles > 0 && <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>{faibles} en stock faible</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowMouvement(true)}>
          <Plus size={16} /> Mouvement de stock
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${activeTab === 'stock' ? ' active' : ''}`} onClick={() => setActiveTab('stock')}>
          Stock actuel
        </button>
        <button className={`tab${activeTab === 'mouvements' ? ' active' : ''}`} onClick={() => setActiveTab('mouvements')}>
          Historique des mouvements
          {mouvements.length > 0 && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>({mouvements.length})</span>}
        </button>
      </div>

      {activeTab === 'stock' && (
        <>
          <div className="table-controls">
            <div className="search-input-wrapper">
              <Search size={14} className="search-input-icon" />
              <input className="search-input" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-tabs">
              {['Tous', 'OK', 'Faible', 'Rupture'].map(f => (
                <button key={f} className={`filter-tab${statusFilter === f ? ' active' : ''}`} onClick={() => setStatusFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Stock actuel</th>
                  <th>Stock minimum</th>
                  <th>Unité</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={Layers} title="Aucun produit" description="Aucun produit ne correspond à votre recherche." /></td></tr>
                ) : filtered.map(p => {
                  const status = getStockStatus(p.stock, p.stockMinimum);
                  return (
                    <tr key={p.id}>
                      <td><span className="td-mono">{p.reference || '—'}</span></td>
                      <td className="td-primary">{p.nom}</td>
                      <td><Badge className="badge-blue">{p.categorie}</Badge></td>
                      <td>
                        <span style={{
                          fontWeight: 700, fontSize: 'var(--font-size-base)',
                          color: status === 'rupture' ? 'var(--color-danger)' : status === 'faible' ? 'var(--color-warning)' : 'var(--color-text)',
                        }}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="td-secondary">{p.stockMinimum}</td>
                      <td className="td-secondary">{p.unite}</td>
                      <td>
                        {status === 'rupture' && <Badge className="badge-red">🔴 Rupture</Badge>}
                        {status === 'faible' && <Badge className="badge-yellow">🟡 Stock faible</Badge>}
                        {status === 'ok' && <Badge className="badge-green">🟢 En stock</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'mouvements' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Stock avant</th>
                <th>Stock après</th>
                <th>Raison</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Layers} title="Aucun mouvement" description="Les mouvements de stock apparaîtront ici." /></td></tr>
              ) : mouvements.map(m => (
                <tr key={m.id}>
                  <td className="td-secondary">{formatDateTime(m.createdAt)}</td>
                  <td className="td-primary">{getProduitName(m.produitId)}</td>
                  <td>
                    {m.type === 'entree' && <Badge className="badge-green"><ArrowUpCircle size={10} /> Entrée</Badge>}
                    {m.type === 'sortie' && <Badge className="badge-red"><ArrowDownCircle size={10} /> Sortie</Badge>}
                    {m.type === 'ajustement' && <Badge className="badge-blue"><Settings size={10} /> Ajustement</Badge>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.type === 'entree' ? '+' : m.type === 'sortie' ? '-' : '='}{m.quantite}</td>
                  <td className="td-secondary">{m.quantiteAvant}</td>
                  <td style={{ fontWeight: 600, color: m.quantiteApres === 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {m.quantiteApres}
                  </td>
                  <td className="td-secondary">{m.raison || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showMouvement} onClose={() => setShowMouvement(false)} title="Mouvement de stock" size="md">
        <MouvementForm produits={state.produits} onSave={handleMouvement} onCancel={() => setShowMouvement(false)} />
      </Modal>
    </div>
  );
}
