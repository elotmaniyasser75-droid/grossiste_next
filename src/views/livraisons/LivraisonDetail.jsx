
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Printer, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Badge, ConfirmModal } from '../../components/ui/index.jsx';
import { formatDate, getLivraisonStatusColor } from '../../utils/helpers';

const DRIVERS = ['Youssef Ait Said', 'Driss Ouali', 'Khalid Mansouri'];
const VEHICLES = ['Ford Transit - 234 A 56', 'Renault Master - 456 B 78', 'Mercedes Sprinter - 789 C 90'];

export default function LivraisonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDeliver, setConfirmDeliver] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const livraison = state.livraisons.find(l => l.id === id);
  const commande = livraison ? state.commandes.find(c => c.id === livraison.commandeId) : null;
  const client = livraison ? state.clients.find(c => c.id === livraison.clientId) : null;

  if (!livraison) return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate('/livraisons')}><ArrowLeft size={16} /> Retour</button>
      <p style={{ marginTop: 24 }}>Livraison introuvable.</p>
    </div>
  );

  const startEdit = () => {
    setEditForm({
      chauffeur: livraison.chauffeur || '',
      vehicule: livraison.vehicule || '',
      dateLivraison: livraison.dateLivraison ? livraison.dateLivraison.split('T')[0] : '',
      adresse: livraison.adresse || '',
      notes: livraison.notes || '',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    dispatch({
      type: 'UPDATE_LIVRAISON',
      payload: {
        id,
        ...editForm,
        dateLivraison: editForm.dateLivraison ? new Date(editForm.dateLivraison).toISOString() : livraison.dateLivraison,
      }
    });
    toast('Livraison mise à jour.', 'success');
    setEditing(false);
  };

  const handleMarkDelivered = () => {
    dispatch({ type: 'MARK_LIVRAISON_DELIVERED', payload: id });
    toast('Livraison marquée comme livrée. Commande mise à jour.', 'success');
    setConfirmDeliver(false);
  };

  const handleAdvance = () => {
    const next = livraison.statut === 'À préparer' ? 'En préparation'
      : livraison.statut === 'En préparation' ? 'En livraison' : null;
    if (next) {
      dispatch({ type: 'UPDATE_LIVRAISON', payload: { id, statut: next } });
      toast(`Livraison passée en "${next}".`, 'success');
    }
  };

  const set = f => e => setEditForm(v => ({ ...v, [f]: e.target.value }));

  return (
    <div>
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/livraisons')}>Livraisons</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{livraison.numero}</span>
      </div>

      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/livraisons')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{livraison.numero}</h1>
            <p className="page-subtitle">{client?.nom} — {formatDate(livraison.dateLivraison)}</p>
          </div>
        </div>
        <div className="page-actions">
          {livraison.statut !== 'Livrée' && livraison.statut !== 'Échec' && (
            <>
              {livraison.statut !== 'En livraison' && (
                <button className="btn btn-secondary btn-sm" onClick={handleAdvance}>Avancer →</button>
              )}
              {livraison.statut === 'En livraison' && (
                <button className="btn btn-success btn-sm" onClick={() => setConfirmDeliver(true)}>
                  <CheckCircle size={14} /> Marquer livrée
                </button>
              )}
            </>
          )}
          <button className="btn btn-secondary btn-sm" onClick={startEdit}>Modifier</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/livraisons/${id}/bl`)}>
            <Printer size={14} /> Bon de livraison
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Delivery info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Informations livraison</span>
            <Badge className={getLivraisonStatusColor(livraison.statut)}>{livraison.statut}</Badge>
          </div>
          <div className="card-body">
            {!editing ? (
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">N° Livraison</div>
                  <div className="info-value" style={{ fontFamily: 'monospace' }}>{livraison.numero}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">N° Commande</div>
                  <div className="info-value" style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                    onClick={() => navigate(`/commandes/${livraison.commandeId}`)}>
                    {commande?.numero}
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
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Adresse</div>
                  <div className="info-value">{livraison.adresse || '—'}</div>
                </div>
                {livraison.notes && (
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="info-label">Notes</div>
                    <div className="info-value" style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>{livraison.notes}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Chauffeur</label>
                  <select className="form-select" value={editForm.chauffeur} onChange={set('chauffeur')}>
                    <option value="">--</option>
                    {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Véhicule</label>
                  <select className="form-select" value={editForm.vehicule} onChange={set('vehicule')}>
                    <option value="">--</option>
                    {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date livraison</label>
                  <input className="form-input" type="date" value={editForm.dateLivraison} onChange={set('dateLivraison')} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Adresse</label>
                  <input className="form-input" value={editForm.adresse} onChange={set('adresse')} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={editForm.notes} onChange={set('notes')} rows={2} />
                </div>
                <div className="flex gap-3" style={{ gridColumn: '1 / -1' }}>
                  <button className="btn btn-secondary" onClick={() => setEditing(false)}>Annuler</button>
                  <button className="btn btn-primary" onClick={saveEdit}>Enregistrer</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Client info */}
        <div className="card">
          <div className="card-header"><span className="card-title">Client</span></div>
          <div className="card-body">
            {client ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{client.nom}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{client.contact}</div>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>📞 {client.telephone}</div>
                <div style={{ fontSize: 'var(--font-size-sm)' }}>📍 {client.adresse}, {client.ville}</div>
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}
                  onClick={() => navigate(`/clients/${client.id}`)}>
                  Voir le profil client →
                </button>
              </div>
            ) : <p className="text-muted">Client introuvable.</p>}
          </div>
        </div>
      </div>

      {/* Products */}
      {commande && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header"><span className="card-title">Produits à livrer</span></div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Produit</th>
                  <th style={{ textAlign: 'right' }}>Quantité</th>
                  <th style={{ textAlign: 'right' }}>Prix unitaire</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(commande.lignes || []).map((l, i) => (
                  <tr key={i}>
                    <td><span className="td-mono">{l.reference || '—'}</span></td>
                    <td className="td-primary">{l.nom}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{l.quantite}</td>
                    <td style={{ textAlign: 'right' }}>{l.prixUnitaire?.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{l.total?.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeliver}
        onClose={() => setConfirmDeliver(false)}
        onConfirm={handleMarkDelivered}
        title="Confirmer la livraison ?"
        message="Cette livraison et la commande associée seront marquées comme livrées."
        confirmLabel="Confirmer"
        variant="warning"
      />
    </div>
  );
}
