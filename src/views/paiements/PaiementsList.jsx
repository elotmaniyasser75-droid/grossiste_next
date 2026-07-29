
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Plus, Search, CreditCard, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Badge, EmptyState, Modal, ConfirmModal } from '../../components/ui/index.jsx';
import {
  formatCurrency, formatDate, getPaymentStatusColor,
  generatePaiementId, generateId, isOverdue
} from '../../utils/helpers';

const MODES = ['Espèces', 'Virement', 'Chèque', 'Carte'];

function PaiementForm({ clients, commandes, initialCommandeId, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = {
      clientId: '',
      commandeId: initialCommandeId || '',
      montant: '',
      datePaiement: new Date().toISOString().split('T')[0],
      modePaiement: 'Espèces',
      reference: '',
      notes: '',
    };
    // Auto-fill client if commandeId is set initially
    if (initialCommandeId) {
      const cmd = commandes.find(c => c.id === initialCommandeId);
      if (cmd) {
        const solde = cmd.totalTTC - (cmd.montantPaye || 0);
        base.clientId = cmd.clientId;
        base.montant = Math.round(solde * 100) / 100;
      }
    }
    return base;
  });
  const [errors, setErrors] = useState({});

  // Re-sync when initialCommandeId changes (form is reused via state)
  useEffect(() => {
    if (!initialCommandeId) return;
    const cmd = commandes.find(c => c.id === initialCommandeId);
    if (cmd) {
      const solde = Math.max(0, cmd.totalTTC - (cmd.montantPaye || 0));
      setForm(v => ({
        ...v,
        commandeId: initialCommandeId,
        clientId: cmd.clientId,
        montant: Math.round(solde * 100) / 100,
      }));
    }
  }, [initialCommandeId]);

  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

  const selectedCommande = commandes.find(c => c.id === form.commandeId);
  const soldeCommande = selectedCommande
    ? Math.max(0, selectedCommande.totalTTC - (selectedCommande.montantPaye || 0))
    : null;

  // Filter commandes with balance for selected client
  const availableCommandes = form.clientId
    ? commandes.filter(c => c.clientId === form.clientId && c.statut !== 'Annulée' && (c.totalTTC - (c.montantPaye || 0)) > 0.01)
    : commandes.filter(c => c.statut !== 'Annulée' && (c.totalTTC - (c.montantPaye || 0)) > 0.01);

  const validate = () => {
    const e = {};
    if (!form.clientId) e.clientId = 'Sélectionnez un client.';
    if (!form.commandeId) e.commandeId = 'Sélectionnez une commande.';
    if (!form.montant || parseFloat(form.montant) <= 0) e.montant = 'Montant invalide.';
    if (soldeCommande !== null && parseFloat(form.montant) > soldeCommande + 0.01) {
      e.montant = `Le montant dépasse le solde restant (${formatCurrency(soldeCommande)}).`;
    }
    return e;
  };

  const handleSubmit = ev => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      montant: parseFloat(form.montant),
      datePaiement: new Date(form.datePaiement).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label required">Client</label>
          <select className={`form-select${errors.clientId ? ' error' : ''}`} value={form.clientId}
            onChange={e => setForm(v => ({ ...v, clientId: e.target.value, commandeId: '' }))}>
            <option value="">-- Sélectionner --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          {errors.clientId && <div className="form-error">{errors.clientId}</div>}
        </div>

        <div className="form-group">
          <label className="form-label required">Commande</label>
          <select className={`form-select${errors.commandeId ? ' error' : ''}`} value={form.commandeId} onChange={set('commandeId')}>
            <option value="">-- Sélectionner --</option>
            {availableCommandes.map(c => {
              const solde = c.totalTTC - (c.montantPaye || 0);
              return <option key={c.id} value={c.id}>{c.numero} — Solde: {formatCurrency(solde)}</option>;
            })}
          </select>
          {errors.commandeId && <div className="form-error">{errors.commandeId}</div>}
          {soldeCommande !== null && (
            <div className="form-hint">Solde restant: <strong>{formatCurrency(soldeCommande)}</strong></div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label required">Montant (DH)</label>
          <input className={`form-input${errors.montant ? ' error' : ''}`} type="number" step="0.01" min="0"
            value={form.montant} onChange={set('montant')} placeholder="0.00" />
          {errors.montant && <div className="form-error">{errors.montant}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={form.datePaiement} onChange={set('datePaiement')} />
        </div>

        <div className="form-group">
          <label className="form-label">Mode de paiement</label>
          <select className="form-select" value={form.modePaiement} onChange={set('modePaiement')}>
            {MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Référence</label>
          <input className="form-input" value={form.reference} onChange={set('reference')} placeholder="N° chèque, virement..." />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} rows={2} />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-4">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary">Enregistrer le paiement</button>
      </div>
    </form>
  );
}

function RelanceModal({ client, onClose }) {
  const msg = `Bonjour ${client?.nom},\n\nNous vous contactons au sujet de votre solde impayé auprès d'ATLAS DISTRIBUTION.\n\nMerci de régulariser votre situation dans les meilleurs délais.\n\nCordialement,\nATLAS DISTRIBUTION`;
  return (
    <Modal isOpen onClose={onClose} title="Message de relance" size="md">
      <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '16px', fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
        {msg}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(msg); }}>Copier</button>
        <button className="btn btn-primary" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
}

export default function PaiementsList() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('paiements');
  const [showForm, setShowForm] = useState(!!location.state?.commandeId);
  const [selectedCommandeId, setSelectedCommandeId] = useState(location.state?.commandeId || null);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('Tous');
  const [relanceClient, setRelanceClient] = useState(null);

  const openPayForm = (commandeId = null) => {
    setSelectedCommandeId(commandeId);
    setShowForm(true);
  };

  const getClientName = id => state.clients.find(c => c.id === id)?.nom || '—';

  // Commandes with balance (for receivables tab)
  const creances = useMemo(() => {
    return state.commandes
      .filter(c => c.statut !== 'Annulée')
      .map(c => {
        const solde = Math.max(0, c.totalTTC - (c.montantPaye || 0));
        const overdue = c.echeance && new Date(c.echeance) < new Date() && solde > 0.01;
        return { ...c, solde, overdue };
      })
      .filter(c => c.solde > 0.01)
      .sort((a, b) => (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0) || b.solde - a.solde);
  }, [state.commandes]);

  // Filtered paiements
  const filteredPaiements = useMemo(() => {
    let list = [...state.paiements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => getClientName(p.clientId).toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q));
    }
    return list;
  }, [state.paiements, state.clients, search]);

  // Filtered créances
  const filteredCreances = useMemo(() => {
    let list = creances;
    if (statutFilter === 'En retard') list = list.filter(c => c.overdue);
    if (statutFilter === 'Partiellement payé') list = list.filter(c => (c.montantPaye || 0) > 0 && !c.overdue);
    if (statutFilter === 'Non payé') list = list.filter(c => !c.montantPaye || c.montantPaye === 0);
    return list;
  }, [creances, statutFilter]);

  const handleSavePaiement = (data) => {
    const paiement = {
      id: generateId('pay'),
      ...data,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PAIEMENT', payload: paiement });
    toast(`✓ Paiement de ${formatCurrency(data.montant)} enregistré.`, 'success');
    setShowForm(false);
    setSelectedCommandeId(null);
  };

  const totalCreances = creances.reduce((s, c) => s + c.solde, 0);
  const totalEnRetard = creances.filter(c => c.overdue).reduce((s, c) => s + c.solde, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Paiements & Créances</h1>
          <p className="page-subtitle">
            Créances totales: {formatCurrency(totalCreances)}
            {totalEnRetard > 0 && <span style={{ color: 'var(--color-danger)', marginLeft: 12 }}>⚠️ En retard: {formatCurrency(totalEnRetard)}</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Enregistrer un paiement
        </button>
      </div>

      <div className="tabs">
        <button className={`tab${activeTab === 'paiements' ? ' active' : ''}`} onClick={() => setActiveTab('paiements')}>
          Historique paiements <span style={{ marginLeft: 4, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>({state.paiements.length})</span>
        </button>
        <button className={`tab${activeTab === 'creances' ? ' active' : ''}`} onClick={() => setActiveTab('creances')}>
          Créances clients <span style={{ marginLeft: 4, fontSize: '0.7rem', color: creances.length > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>({creances.length})</span>
        </button>
      </div>

      {activeTab === 'paiements' && (
        <>
          <div className="table-controls">
            <div className="search-input-wrapper">
              <Search size={14} className="search-input-icon" />
              <input className="search-input" placeholder="Rechercher par client ou référence..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Commande</th>
                  <th>Montant</th>
                  <th>Mode</th>
                  <th>Référence</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaiements.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={CreditCard} title="Aucun paiement" description="Les paiements enregistrés apparaîtront ici." /></td></tr>
                ) : filteredPaiements.map(p => {
                  const cmd = state.commandes.find(c => c.id === p.commandeId);
                  return (
                    <tr key={p.id}>
                      <td className="td-secondary">{formatDate(p.datePaiement)}</td>
                      <td className="td-primary">{getClientName(p.clientId)}</td>
                      <td>
                        {cmd ? (
                          <span className="td-mono" style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                            onClick={() => navigate(`/commandes/${cmd.id}`)}>
                            {cmd.numero}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(p.montant)}</td>
                      <td><Badge className="badge-blue">{p.modePaiement}</Badge></td>
                      <td className="td-secondary">{p.reference || '—'}</td>
                      <td className="td-secondary">{p.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'creances' && (
        <>
          <div className="table-controls">
            <div className="filter-tabs">
              {['Tous', 'En retard', 'Partiellement payé', 'Non payé'].map(f => (
                <button key={f} className={`filter-tab${statutFilter === f ? ' active' : ''}`} onClick={() => setStatutFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>N° Commande</th>
                  <th>Total</th>
                  <th>Payé</th>
                  <th>Restant</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreances.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState icon={CreditCard} title="Aucune créance" description="Toutes les commandes sont réglées." /></td></tr>
                ) : filteredCreances.map(c => {
                  const client = state.clients.find(cl => cl.id === c.clientId);
                  return (
                    <tr key={c.id} className="clickable" onClick={() => navigate(`/commandes/${c.id}`)}>
                      <td className="td-primary">{getClientName(c.clientId)}</td>
                      <td><span className="td-mono">{c.numero}</span></td>
                      <td className="td-amount">{formatCurrency(c.totalTTC)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(c.montantPaye || 0)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatCurrency(c.solde)}</td>
                      <td className="td-secondary" style={{ color: c.overdue ? 'var(--color-danger)' : 'inherit' }}>
                        {formatDate(c.echeance)}
                        {c.overdue && ' ⚠️'}
                      </td>
                      <td>
                        <Badge className={c.overdue ? 'badge-red' : (c.montantPaye || 0) > 0 ? 'badge-orange' : 'badge-gray'}>
                          {c.overdue ? 'En retard' : (c.montantPaye || 0) > 0 ? 'Partiel' : 'Non payé'}
                        </Badge>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button className="btn btn-primary btn-sm" onClick={() => openPayForm(c.id)}>Payer</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setRelanceClient(client)} title="Relancer">
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelectedCommandeId(null); }} title="Enregistrer un paiement" size="lg">
        <PaiementForm
          clients={state.clients}
          commandes={state.commandes}
          initialCommandeId={selectedCommandeId}
          onSave={handleSavePaiement}
          onCancel={() => { setShowForm(false); setSelectedCommandeId(null); }}
        />
      </Modal>

      {relanceClient && <RelanceModal client={relanceClient} onClose={() => setRelanceClient(null)} />}
    </div>
  );
}
