
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft, CheckCircle, Truck, XCircle, Edit2, Printer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Badge, ConfirmModal, Modal } from '../../components/ui/index.jsx';
import {
  formatCurrency, formatDate, getCommandeStatusColor,
  getPaymentStatusColor, generateLivraisonNumber, generateId
} from '../../utils/helpers';

const STATUS_FLOW = ['Brouillon', 'Confirmée', 'Préparation', 'Prête', 'Livrée'];

function AssignLivraisonForm({ onSave, onCancel, defaultAdresse }) {
  const [form, setForm] = useState({
    adresse: defaultAdresse || '',
    dateLivraison: new Date().toISOString().split('T')[0],
    chauffeur: '',
    vehicule: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.chauffeur.trim()) e.chauffeur = 'Chauffeur obligatoire.';
    return e;
  };

  const handleSubmit = ev => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const DRIVERS = ['Youssef Ait Said', 'Driss Ouali', 'Khalid Mansouri'];
  const VEHICLES = ['Ford Transit - 234 A 56', 'Renault Master - 456 B 78', 'Mercedes Sprinter - 789 C 90'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid form-grid-2">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Adresse de livraison</label>
          <input className="form-input" value={form.adresse} onChange={set('adresse')} placeholder="Adresse complète" />
        </div>
        <div className="form-group">
          <label className="form-label required">Chauffeur</label>
          <select className={`form-select${errors.chauffeur ? ' error' : ''}`} value={form.chauffeur} onChange={set('chauffeur')}>
            <option value="">-- Sélectionner --</option>
            {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.chauffeur && <div className="form-error">{errors.chauffeur}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Véhicule</label>
          <select className="form-select" value={form.vehicule} onChange={set('vehicule')}>
            <option value="">-- Sélectionner --</option>
            {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date de livraison</label>
          <input className="form-input" type="date" value={form.dateLivraison} onChange={set('dateLivraison')} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} rows={2} />
        </div>
      </div>
      <div className="flex gap-3 justify-end mt-4">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary">Créer la livraison</button>
      </div>
    </form>
  );
}

export default function CommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState(null);
  const [showLivraisonForm, setShowLivraisonForm] = useState(false);

  const commande = state.commandes.find(c => c.id === id);
  const client = state.clients.find(c => c.id === commande?.clientId);
  const livraison = state.livraisons.find(l => l.commandeId === id);

  if (!commande) return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate('/commandes')}><ArrowLeft size={16} /> Retour</button>
      <p style={{ marginTop: 24, color: 'var(--color-text-secondary)' }}>Commande introuvable.</p>
    </div>
  );

  const solde = Math.max(0, commande.totalTTC - (commande.montantPaye || 0));
  const currentStatusIdx = STATUS_FLOW.indexOf(commande.statut);
  const nextStatus = STATUS_FLOW[currentStatusIdx + 1];
  const canAdvance = commande.statut !== 'Livrée' && commande.statut !== 'Annulée';
  const canCancel = commande.statut !== 'Annulée' && commande.statut !== 'Livrée';

  const handleAdvance = () => {
    if (commande.statut === 'Brouillon') {
      // Deduct stock on confirm
      dispatch({ type: 'CONFIRM_COMMANDE', payload: id });
    } else {
      dispatch({ type: 'ADVANCE_COMMANDE_STATUS', payload: id });
    }
    toast(`Commande passée en "${nextStatus}".`, 'success');
    setConfirmAction(null);
  };

  const handleCancel = () => {
    dispatch({ type: 'CANCEL_COMMANDE', payload: id });
    toast('Commande annulée. Le stock a été restauré.', 'info');
    setConfirmAction(null);
  };

  const handleCreateLivraison = (data) => {
    const liv = {
      id: generateId('liv'),
      numero: generateLivraisonNumber(),
      commandeId: id,
      clientId: commande.clientId,
      adresse: data.adresse,
      dateLivraison: data.dateLivraison ? new Date(data.dateLivraison).toISOString() : new Date().toISOString(),
      chauffeur: data.chauffeur,
      vehicule: data.vehicule,
      statut: 'En préparation',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_LIVRAISON', payload: liv });
    toast(`Livraison ${liv.numero} créée.`, 'success');
    setShowLivraisonForm(false);
  };

  const handlePrintBL = () => {
    if (livraison) navigate(`/livraisons/${livraison.id}/bl`);
    else toast('Créez d\'abord une livraison.', 'warning');
  };

  return (
    <div>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/commandes')}>Commandes</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{commande.numero}</span>
      </div>

      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/commandes')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{commande.numero}</h1>
            <p className="page-subtitle">{formatDate(commande.createdAt)} — {client?.nom}</p>
          </div>
        </div>
        <div className="page-actions" style={{ flexWrap: 'wrap' }}>
          {canAdvance && nextStatus && (
            <button className="btn btn-primary btn-sm"
              onClick={() => setConfirmAction('advance')}>
              <CheckCircle size={14} /> → {nextStatus}
            </button>
          )}
          {commande.statut !== 'Annulée' && !livraison && ['Confirmée', 'Préparation', 'Prête'].includes(commande.statut) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowLivraisonForm(true)}>
              <Truck size={14} /> Créer livraison
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handlePrintBL}>
            <Printer size={14} /> Bon de livraison
          </button>
          {canCancel && (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmAction('cancel')}>
              <XCircle size={14} /> Annuler
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Order info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Informations commande</span></div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Numéro</div>
                  <div className="info-value" style={{ fontFamily: 'monospace' }}>{commande.numero}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Statut</div>
                  <div className="info-value"><Badge className={getCommandeStatusColor(commande.statut)}>{commande.statut}</Badge></div>
                </div>
                <div className="info-item">
                  <div className="info-label">Client</div>
                  <div className="info-value" style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                    onClick={() => navigate(`/clients/${client?.id}`)}>
                    {client?.nom}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Ville</div>
                  <div className="info-value">{client?.ville || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Date</div>
                  <div className="info-value">{formatDate(commande.createdAt)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Condition paiement</div>
                  <div className="info-value">{commande.conditionPaiement}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Échéance</div>
                  <div className="info-value" style={{ color: commande.echeance && new Date(commande.echeance) < new Date() && solde > 0 ? 'var(--color-danger)' : 'inherit' }}>
                    {formatDate(commande.echeance)}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Paiement</div>
                  <div className="info-value"><Badge className={getPaymentStatusColor(commande.statutPaiement)}>{commande.statutPaiement}</Badge></div>
                </div>
              </div>
              {commande.notes && (
                <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {commande.notes}
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <div className="card-header"><span className="card-title">Produits</span></div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Produit</th>
                    <th style={{ textAlign: 'right' }}>Qté</th>
                    <th style={{ textAlign: 'right' }}>Prix unitaire</th>
                    <th style={{ textAlign: 'right' }}>Remise</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(commande.lignes || []).map((l, i) => (
                    <tr key={i}>
                      <td><span className="td-mono">{l.reference || '—'}</span></td>
                      <td className="td-primary">{l.nom}</td>
                      <td style={{ textAlign: 'right' }}>{l.quantite}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(l.prixUnitaire)}</td>
                      <td style={{ textAlign: 'right' }}>{l.remise > 0 ? `${l.remise}%` : '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery info */}
          {livraison && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Livraison</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/livraisons/${livraison.id}`)}>
                  Voir détail →
                </button>
              </div>
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">N° Livraison</div>
                    <div className="info-value" style={{ fontFamily: 'monospace' }}>{livraison.numero}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Statut</div>
                    <div className="info-value">
                      <Badge className={
                        livraison.statut === 'Livrée' ? 'badge-green' :
                          livraison.statut === 'En livraison' ? 'badge-orange' :
                            livraison.statut === 'En préparation' ? 'badge-blue' : 'badge-yellow'
                      }>{livraison.statut}</Badge>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Chauffeur</div>
                    <div className="info-value">{livraison.chauffeur || '—'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Véhicule</div>
                    <div className="info-value">{livraison.vehicule || '—'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Date prévue</div>
                    <div className="info-value">{formatDate(livraison.dateLivraison)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Adresse</div>
                    <div className="info-value">{livraison.adresse || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Financial */}
        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">Résumé financier</span></div>
            <div className="card-body">
              <div className="fin-summary">
                <div className="fin-row">
                  <span className="fin-label">Sous-total HT</span>
                  <span className="fin-value">{formatCurrency(commande.sousTotal)}</span>
                </div>
                <div className="fin-row">
                  <span className="fin-label">TVA (20%)</span>
                  <span className="fin-value">{formatCurrency(commande.tva)}</span>
                </div>
                <div className="fin-row fin-total">
                  <span>Total TTC</span>
                  <span>{formatCurrency(commande.totalTTC)}</span>
                </div>
                <div className="fin-row" style={{ color: 'var(--color-success)' }}>
                  <span className="fin-label">Montant payé</span>
                  <span className="fin-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(commande.montantPaye || 0)}</span>
                </div>
                <div className={`fin-row ${solde > 0.01 ? 'fin-remaining' : ''}`}>
                  <span className="fin-label">Solde restant</span>
                  <span className="fin-value" style={{ color: solde > 0.01 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 700 }}>
                    {formatCurrency(solde)}
                  </span>
                </div>
              </div>

              {solde > 0.01 && (
                <button
                  className="btn btn-primary w-full mt-4"
                  style={{ width: '100%' }}
                  onClick={() => navigate('/paiements', { state: { commandeId: id } })}
                >
                  Enregistrer un paiement
                </button>
              )}
            </div>
          </div>

          {/* Status timeline */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Progression</span></div>
            <div className="card-body">
              {STATUS_FLOW.map((status, i) => {
                const isDone = currentStatusIdx > i;
                const isCurrent = currentStatusIdx === i;
                const isCancelled = commande.statut === 'Annulée';
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCurrent && !isCancelled ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-border)',
                      color: (isCurrent || isDone) ? 'white' : 'var(--color-text-muted)',
                      fontSize: '0.65rem', fontWeight: 700,
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent && !isCancelled ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}>
                      {status}
                    </span>
                  </div>
                );
              })}
              {commande.statut === 'Annulée' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>✕</div>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-danger)' }}>Annulée</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modals */}
      <ConfirmModal
        isOpen={confirmAction === 'advance'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAdvance}
        title={`Passer en "${nextStatus}" ?`}
        message={commande.statut === 'Brouillon'
          ? 'La commande sera confirmée et le stock sera automatiquement mis à jour.'
          : `La commande passera au statut "${nextStatus}".`}
        confirmLabel="Confirmer"
        variant="warning"
      />
      <ConfirmModal
        isOpen={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCancel}
        title="Annuler la commande ?"
        message="Le stock réservé sera restauré automatiquement. Cette action est irréversible."
        confirmLabel="Annuler la commande"
        variant="danger"
      />

      <Modal isOpen={showLivraisonForm} onClose={() => setShowLivraisonForm(false)} title="Créer une livraison" size="md">
        <AssignLivraisonForm
          onSave={handleCreateLivraison}
          onCancel={() => setShowLivraisonForm(false)}
          defaultAdresse={client ? `${client.adresse}, ${client.ville}` : ''}
        />
      </Modal>
    </div>
  );
}
