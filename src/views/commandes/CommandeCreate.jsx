
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  generateCommandeNumber, generateId, calculateOrderTotals,
  calculateLineTotal, formatCurrency
} from '../../utils/helpers';

const CONDITIONS = ['Comptant', '7 jours', '15 jours', '30 jours'];
const TVA_RATE = 0.20;

function getEcheance(condition) {
  const now = new Date();
  const days = { 'Comptant': 0, '7 jours': 7, '15 jours': 15, '30 jours': 30 };
  const d = new Date(now.getTime() + (days[condition] || 30) * 86400000);
  return d.toISOString();
}

export default function CommandeCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState(location.state?.clientId || '');
  const [lignes, setLignes] = useState([]);
  const [condition, setCondition] = useState('30 jours');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [stockWarnings, setStockWarnings] = useState({});

  const client = state.clients.find(c => c.id === clientId);

  // Prefill condition from client
  useEffect(() => {
    if (client) setCondition(client.conditionsPaiement || '30 jours');
  }, [client]);

  const totals = useMemo(() => calculateOrderTotals(lignes, 0, TVA_RATE), [lignes]);

  const addLigne = () => {
    setLignes(l => [...l, { id: generateId('l'), produitId: '', nom: '', reference: '', quantite: 1, prixUnitaire: 0, remise: 0, total: 0 }]);
  };

  const removeLigne = (id) => setLignes(l => l.filter(x => x.id !== id));

  const updateLigne = (id, field, value) => {
    setLignes(prev => prev.map(l => {
      if (l.id !== id) return l;
      let updated = { ...l, [field]: value };
      if (field === 'produitId') {
        const produit = state.produits.find(p => p.id === value);
        if (produit) {
          updated = { ...updated, nom: produit.nom, reference: produit.reference, prixUnitaire: produit.prixVente };
        }
      }
      updated.total = calculateLineTotal(
        parseFloat(updated.quantite) || 0,
        parseFloat(updated.prixUnitaire) || 0,
        parseFloat(updated.remise) || 0
      );
      return updated;
    }));
  };

  // Stock warnings
  useEffect(() => {
    const warnings = {};
    lignes.forEach(l => {
      if (!l.produitId) return;
      const produit = state.produits.find(p => p.id === l.produitId);
      if (produit && parseInt(l.quantite) > produit.stock) {
        warnings[l.id] = `Stock insuffisant: ${produit.stock} ${produit.unite} disponibles.`;
      }
    });
    setStockWarnings(warnings);
  }, [lignes, state.produits]);

  const validateStep1 = () => {
    if (!clientId) { setErrors({ clientId: 'Veuillez sélectionner un client.' }); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (lignes.length === 0) { setErrors({ lignes: 'Ajoutez au moins un produit.' }); return false; }
    if (lignes.some(l => !l.produitId)) { setErrors({ lignes: 'Veuillez sélectionner un produit pour chaque ligne.' }); return false; }
    if (Object.keys(stockWarnings).length > 0) { setErrors({ lignes: 'Stock insuffisant pour certains produits.' }); return false; }
    return true;
  };

  const handleNext = () => {
    setErrors({});
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const handleConfirm = () => {
    const numero = generateCommandeNumber();
    const echeance = getEcheance(condition);
    const commande = {
      id: generateId('cmd'),
      numero,
      clientId,
      lignes: lignes.map(l => ({ ...l, id: undefined })),
      ...totals,
      montantPaye: 0,
      statut: 'Confirmée',
      statutPaiement: totals.totalTTC <= 0 ? 'Payé' : 'Non payé',
      conditionPaiement: condition,
      echeance,
      notes,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_COMMANDE', payload: commande });
    // Deduct stock
    lignes.forEach(l => {
      if (l.produitId && parseInt(l.quantite) > 0) {
        dispatch({
          type: 'ADD_MOUVEMENT_STOCK',
          payload: {
            produitId: l.produitId,
            type: 'sortie',
            quantite: parseInt(l.quantite),
            raison: `Commande ${numero}`,
            notes: '',
            commandeId: commande.id,
          }
        });
      }
    });

    toast(`✓ Commande ${numero} créée et stock mis à jour.`, 'success');
    navigate(`/commandes/${commande.id}`);
  };

  const STEPS = ['Client', 'Produits', 'Confirmation'];

  return (
    <div>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/commandes')}>Commandes</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Nouvelle commande</span>
      </div>

      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/commandes')}><ArrowLeft size={18} /></button>
          <h1 className="page-title">Nouvelle commande</h1>
        </div>
      </div>

      {/* Step indicator */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div className={`step-circle ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : 'pending'}`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className="step-label" style={{ marginTop: 6 }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, minWidth: 60, maxWidth: 120,
                    background: step > i + 1 ? 'var(--color-success)' : 'var(--color-border)',
                    margin: '0 0', marginBottom: 18,
                    transition: 'background 0.3s',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Client */}
      {step === 1 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Étape 1 — Sélectionner un client</span></div>
          <div className="card-body">
            <div className="form-group" style={{ maxWidth: 500 }}>
              <label className="form-label required">Client</label>
              <select className={`form-select${errors.clientId ? ' error' : ''}`} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">-- Sélectionner un client --</option>
                {state.clients.map(c => <option key={c.id} value={c.id}>{c.nom} — {c.ville}</option>)}
              </select>
              {errors.clientId && <div className="form-error">{errors.clientId}</div>}
            </div>
            {client && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary-border)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{client.nom}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {client.contact && `${client.contact} • `}{client.telephone && `${client.telephone} • `}{client.ville}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Conditions: {client.conditionsPaiement}
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-5">
              <button className="btn btn-secondary" onClick={() => navigate('/commandes')}>Annuler</button>
              <button className="btn btn-primary" onClick={handleNext}>Suivant →</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Étape 2 — Ajouter des produits</span>
            <button className="btn btn-secondary btn-sm" onClick={addLigne}><Plus size={14} /> Ajouter une ligne</button>
          </div>
          <div className="card-body">
            {errors.lignes && <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: 'var(--font-size-sm)' }}>{errors.lignes}</div>}

            <div style={{ overflowX: 'auto' }}>
              <table className="ligne-table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Produit</th>
                    <th style={{ width: '12%' }}>Qté</th>
                    <th style={{ width: '15%' }}>Prix unitaire (DH)</th>
                    <th style={{ width: '10%' }}>Remise (%)</th>
                    <th style={{ width: '15%' }}>Total (DH)</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                        Cliquez sur "Ajouter une ligne" pour commencer
                      </td>
                    </tr>
                  ) : lignes.map(l => (
                    <React.Fragment key={l.id}>
                      <tr>
                        <td>
                          <select
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}
                            value={l.produitId}
                            onChange={e => updateLigne(l.id, 'produitId', e.target.value)}
                          >
                            <option value="">-- Produit --</option>
                            {state.produits.map(p => (
                              <option key={p.id} value={p.id}>{p.nom} (Stock: {p.stock} {p.unite})</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number" min="1" value={l.quantite}
                            onChange={e => updateLigne(l.id, 'quantite', e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number" min="0" step="0.01" value={l.prixUnitaire}
                            onChange={e => updateLigne(l.id, 'prixUnitaire', e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number" min="0" max="100" value={l.remise}
                            onChange={e => updateLigne(l.id, 'remise', e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, textAlign: 'right' }}>{formatCurrency(l.total)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => removeLigne(l.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                      {stockWarnings[l.id] && (
                        <tr>
                          <td colSpan={6} style={{ padding: '4px 8px 8px', color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
                            ⚠️ {stockWarnings[l.id]}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            {lignes.length > 0 && (
              <div style={{ maxWidth: 360, marginLeft: 'auto', marginTop: '20px' }}>
                <div className="summary-box">
                  {[
                    { label: 'Sous-total HT', val: formatCurrency(totals.sousTotal) },
                    { label: `TVA (${(TVA_RATE * 100).toFixed(0)}%)`, val: formatCurrency(totals.tva) },
                  ].map(r => (
                    <div key={r.label} className="summary-row">
                      <span>{r.label}</span><span className="amount">{r.val}</span>
                    </div>
                  ))}
                  <div className="summary-row total">
                    <span>TOTAL TTC</span>
                    <span>{formatCurrency(totals.totalTTC)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-5">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Retour</button>
              <button className="btn btn-primary" onClick={handleNext}>Suivant →</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Étape 3 — Confirmation</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '12px' }}>Client</div>
                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 700 }}>{client?.nom}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{client?.ville}</div>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '12px' }}>Conditions de paiement</div>
                <select className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ fontWeight: 600, marginBottom: '12px' }}>Produits commandés</div>
            <table className="data-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Réf</th>
                  <th style={{ textAlign: 'right' }}>Qté</th>
                  <th style={{ textAlign: 'right' }}>Prix unit.</th>
                  <th style={{ textAlign: 'right' }}>Remise</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={l.id || i}>
                    <td className="td-primary">{l.nom}</td>
                    <td><span className="td-mono">{l.reference}</span></td>
                    <td style={{ textAlign: 'right' }}>{l.quantite}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(l.prixUnitaire)}</td>
                    <td style={{ textAlign: 'right' }}>{l.remise > 0 ? `${l.remise}%` : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes internes, instructions de livraison..." />
              </div>
              <div className="summary-box">
                {[
                  { label: 'Sous-total HT', val: formatCurrency(totals.sousTotal) },
                  { label: `TVA (${(TVA_RATE * 100).toFixed(0)}%)`, val: formatCurrency(totals.tva) },
                ].map(r => (
                  <div key={r.label} className="summary-row">
                    <span>{r.label}</span><span className="amount">{r.val}</span>
                  </div>
                ))}
                <div className="summary-row total">
                  <span>TOTAL TTC</span><span>{formatCurrency(totals.totalTTC)}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 'var(--font-size-sm)', marginTop: '16px' }}>
              ⚠️ En confirmant, le stock des produits sélectionnés sera automatiquement mis à jour.
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← Retour</button>
              <button className="btn btn-success" onClick={handleConfirm}>
                <CheckCircle size={16} /> Confirmer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
