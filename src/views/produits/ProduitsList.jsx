
import React, { useState, useMemo } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Modal, ConfirmModal, EmptyState, Badge } from '../../components/ui/index.jsx';
import { formatCurrency, generateProduitId, getStockStatus } from '../../utils/helpers';

const CATEGORIES = ['Toutes', 'Boissons', 'Eau', 'Jus', 'Café', 'Épicerie', 'Produits laitiers', 'Snacks', 'Hygiène', 'Tabac', 'Conserves'];
const UNITES = ['Canette', 'Bouteille', 'Sac', 'Sachet', 'Bidon', 'Boîte', 'Pack', 'Paquet', 'Pot', 'Tablette', 'Carton', 'Kg', 'Unité'];

function ProduitForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    reference: initial?.reference || '',
    nom: initial?.nom || '',
    categorie: initial?.categorie || 'Boissons',
    description: initial?.description || '',
    fournisseur: initial?.fournisseur || '',
    prixAchat: initial?.prixAchat || '',
    prixVente: initial?.prixVente || '',
    stock: initial?.stock ?? '',
    stockMinimum: initial?.stockMinimum || '',
    unite: initial?.unite || 'Unité',
  });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = 'Nom obligatoire.';
    if (!form.prixVente || isNaN(form.prixVente)) e.prixVente = 'Prix de vente invalide.';
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      prixAchat: parseFloat(form.prixAchat) || 0,
      prixVente: parseFloat(form.prixVente),
      stock: parseInt(form.stock) || 0,
      stockMinimum: parseInt(form.stockMinimum) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Référence</label>
          <input className="form-input" value={form.reference} onChange={set('reference')} placeholder="BOI-001" />
        </div>
        <div className="form-group">
          <label className="form-label required">Nom du produit</label>
          <input className={`form-input${errors.nom ? ' error' : ''}`} value={form.nom} onChange={set('nom')} placeholder="Ex: Coca-Cola 33cl" />
          {errors.nom && <div className="form-error">{errors.nom}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Catégorie</label>
          <select className="form-select" value={form.categorie} onChange={set('categorie')}>
            {CATEGORIES.filter(c => c !== 'Toutes').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fournisseur</label>
          <input className="form-input" value={form.fournisseur} onChange={set('fournisseur')} placeholder="Nom du fournisseur" />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Description</label>
          <input className="form-input" value={form.description} onChange={set('description')} placeholder="Description courte" />
        </div>
        <div className="form-group">
          <label className="form-label">Prix d'achat (DH)</label>
          <input className="form-input" type="number" step="0.01" min="0" value={form.prixAchat} onChange={set('prixAchat')} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label required">Prix de vente (DH)</label>
          <input className={`form-input${errors.prixVente ? ' error' : ''}`} type="number" step="0.01" min="0" value={form.prixVente} onChange={set('prixVente')} placeholder="0.00" />
          {errors.prixVente && <div className="form-error">{errors.prixVente}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Stock initial</label>
          <input className="form-input" type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Stock minimum</label>
          <input className="form-input" type="number" min="0" value={form.stockMinimum} onChange={set('stockMinimum')} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Unité</label>
          <select className="form-select" value={form.unite} onChange={set('unite')}>
            {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 justify-end mt-5">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary">{initial ? 'Enregistrer' : 'Ajouter le produit'}</button>
      </div>
    </form>
  );
}

function StockBadge({ stock, stockMinimum }) {
  const status = getStockStatus(stock, stockMinimum);
  if (status === 'rupture') return <Badge className="badge-red">🔴 Rupture</Badge>;
  if (status === 'faible') return <Badge className="badge-yellow">🟡 Stock faible</Badge>;
  return <Badge className="badge-green">🟢 En stock</Badge>;
}

export default function ProduitsList() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('Toutes');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = useMemo(() => {
    let list = state.produits;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.nom.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q) || p.fournisseur?.toLowerCase().includes(q));
    }
    if (categorie !== 'Toutes') list = list.filter(p => p.categorie === categorie);
    if (statusFilter === 'Rupture') list = list.filter(p => p.stock === 0);
    if (statusFilter === 'Faible') list = list.filter(p => p.stock > 0 && p.stock <= p.stockMinimum);
    if (statusFilter === 'OK') list = list.filter(p => p.stock > p.stockMinimum);
    return list;
  }, [state.produits, search, categorie, statusFilter]);

  const handleSave = (data) => {
    if (editing) {
      dispatch({ type: 'UPDATE_PRODUIT', payload: { ...editing, ...data } });
      toast('Produit mis à jour.', 'success');
    } else {
      dispatch({
        type: 'ADD_PRODUIT',
        payload: { ...data, id: generateProduitId(), createdAt: new Date().toISOString() }
      });
      toast('Produit ajouté avec succès.', 'success');
    }
    setShowForm(false); setEditing(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produits</h1>
          <p className="page-subtitle">{state.produits.length} produits référencés</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search size={14} className="search-input-icon" />
          <input className="search-input" placeholder="Rechercher par nom, référence, fournisseur..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-filter" value={categorie} onChange={e => setCategorie(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
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
              <th>Réf.</th>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Fournisseur</th>
              <th style={{ textAlign: 'right' }}>Achat</th>
              <th style={{ textAlign: 'right' }}>Vente</th>
              <th style={{ textAlign: 'right' }}>Stock</th>
              <th>Min.</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10}><EmptyState icon={Package} title="Aucun produit" description="Ajoutez un premier produit à votre catalogue." /></td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td><span className="td-mono">{p.reference || '—'}</span></td>
                <td>
                  <div className="td-primary">{p.nom}</div>
                  {p.description && <div className="td-secondary" style={{ fontSize: '0.7rem' }}>{p.description}</div>}
                </td>
                <td><Badge className="badge-blue">{p.categorie}</Badge></td>
                <td className="td-secondary">{p.fournisseur || '—'}</td>
                <td className="td-secondary" style={{ whiteSpace: 'nowrap' }}>{formatCurrency(p.prixAchat)}</td>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(p.prixVente)}</td>
                <td style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--color-danger)' : p.stock <= p.stockMinimum ? 'var(--color-warning)' : 'var(--color-text)' }}>
                  {p.stock} {p.unite}
                </td>
                <td className="td-secondary">{p.stockMinimum}</td>
                <td><StockBadge stock={p.stock} stockMinimum={p.stockMinimum} /></td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(p); setShowForm(true); }}>Modifier</button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleteId(p.id)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Modifier le produit' : 'Nouveau produit'} size="lg">
        <ProduitForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => { dispatch({ type: 'DELETE_PRODUIT', payload: deleteId }); toast('Produit supprimé.', 'info'); setDeleteId(null); }}
        title="Supprimer le produit" message="Ce produit sera supprimé du catalogue. Cette action est irréversible."
        confirmLabel="Supprimer" variant="danger"
      />
    </div>
  );
}
