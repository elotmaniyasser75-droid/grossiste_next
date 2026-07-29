
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Edit2, Phone, Mail, MapPin, Building } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Badge, Modal, ConfirmModal } from '../../components/ui/index.jsx';
import {
  formatCurrency, formatDate, calculateClientBalance,
  getCommandeStatusColor, getPaymentStatusColor
} from '../../utils/helpers';
import ClientForm from './ClientForm';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('commandes');

  const client = state.clients.find(c => c.id === id);

  const balance = useMemo(() =>
    client ? calculateClientBalance(id, state.commandes, state.paiements) : null,
    [client, state.commandes, state.paiements]
  );

  if (!client) return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate('/clients')}><ArrowLeft size={16} /> Retour</button>
      <p style={{ marginTop: '24px', color: 'var(--color-text-secondary)' }}>Client introuvable.</p>
    </div>
  );

  const clientCommandes = state.commandes
    .filter(c => c.clientId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const clientPaiements = state.paiements
    .filter(p => p.clientId === id)
    .sort((a, b) => new Date(b.datePaiement) - new Date(a.datePaiement));

  const handleEdit = (data) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: { ...client, ...data } });
    toast('Client mis à jour.', 'success');
    setShowEdit(false);
  };

  const creances = clientCommandes.filter(c => {
    if (c.statut === 'Annulée') return false;
    return (c.totalTTC - (c.montantPaye || 0)) > 0.01;
  });

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/clients')}>Clients</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{client.nom}</span>
      </div>

      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/clients')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{client.nom}</h1>
            <p className="page-subtitle">{client.contact && `${client.contact} — `}{client.ville}</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
            <Edit2 size={15} /> Modifier
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/commandes/new', { state: { clientId: id } })}>
            + Nouvelle commande
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left: Info + Financial Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Informations</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { icon: Phone, value: client.telephone, label: 'Téléphone' },
                { icon: Mail, value: client.email, label: 'Email' },
                { icon: MapPin, value: client.adresse ? `${client.adresse}, ${client.ville}` : client.ville, label: 'Adresse' },
                { icon: Building, value: client.ice, label: 'ICE' },
              ].filter(i => i.value).map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color="var(--color-text-muted)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{label}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{value}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📅</span>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Conditions paiement</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{client.conditionsPaiement}</div>
                </div>
              </div>
              {client.notes && (
                <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {client.notes}
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card">
            <div className="card-header"><span className="card-title">Résumé financier</span></div>
            <div className="card-body">
              <div className="fin-summary">
                <div className="fin-row">
                  <span className="fin-label">Total acheté</span>
                  <span className="fin-value">{formatCurrency(balance?.totalFacture)}</span>
                </div>
                <div className="fin-row">
                  <span className="fin-label">Total payé</span>
                  <span className="fin-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(balance?.totalPaye)}</span>
                </div>
                <div className="fin-row">
                  <span className="fin-label">Solde restant</span>
                  <span className="fin-value" style={{ color: balance?.soldeRestant > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 700 }}>
                    {formatCurrency(balance?.soldeRestant)}
                  </span>
                </div>
                <div className="fin-row" style={{ borderBottom: 'none' }}>
                  <span className="fin-label">Nombre de commandes</span>
                  <span className="fin-value">{balance?.nbCommandes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tabs */}
        <div>
          <div className="card">
            <div className="tabs" style={{ padding: '0 var(--space-6)' }}>
              {[['commandes', 'Commandes'], ['paiements', 'Paiements'], ['creances', 'Créances']].map(([key, label]) => (
                <button key={key} className={`tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>
                  {label}
                  {key === 'creances' && creances.length > 0 && (
                    <span className="badge badge-red" style={{ marginLeft: 6, padding: '1px 6px' }}>{creances.length}</span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'commandes' && (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N° Commande</th>
                      <th>Date</th>
                      <th>Total TTC</th>
                      <th>Payé</th>
                      <th>Solde</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientCommandes.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>Aucune commande</td></tr>
                    ) : clientCommandes.map(cmd => (
                      <tr key={cmd.id} className="clickable" onClick={() => navigate(`/commandes/${cmd.id}`)}>
                        <td><span className="td-mono">{cmd.numero}</span></td>
                        <td className="td-secondary">{formatDate(cmd.createdAt)}</td>
                        <td className="td-amount">{formatCurrency(cmd.totalTTC)}</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{formatCurrency(cmd.montantPaye)}</td>
                        <td style={{ color: cmd.totalTTC - cmd.montantPaye > 0.01 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                          {formatCurrency(Math.max(0, cmd.totalTTC - (cmd.montantPaye || 0)))}
                        </td>
                        <td><Badge className={getCommandeStatusColor(cmd.statut)}>{cmd.statut}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'paiements' && (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Référence</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPaiements.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>Aucun paiement</td></tr>
                    ) : clientPaiements.map(p => (
                      <tr key={p.id}>
                        <td className="td-secondary">{formatDate(p.datePaiement)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(p.montant)}</td>
                        <td><Badge className="badge-blue">{p.modePaiement}</Badge></td>
                        <td className="td-secondary">{p.reference || '—'}</td>
                        <td className="td-secondary">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'creances' && (
              <div className="card-body">
                {creances.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-success)' }}>
                    <p style={{ fontWeight: 600 }}>✓ Aucune créance en cours</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '8px' }}>Ce client est à jour de ses paiements.</p>
                  </div>
                ) : creances.map(cmd => {
                  const solde = cmd.totalTTC - (cmd.montantPaye || 0);
                  const isOverdue = cmd.echeance && new Date(cmd.echeance) < new Date();
                  return (
                    <div key={cmd.id} style={{
                      background: isOverdue ? 'var(--color-danger-light)' : 'var(--color-warning-light)',
                      border: `1px solid ${isOverdue ? 'var(--color-danger-border)' : 'var(--color-warning-border)'}`,
                      borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '12px',
                    }}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{cmd.numero}</span>
                        <Badge className={isOverdue ? 'badge-red' : 'badge-yellow'}>
                          {isOverdue ? 'En retard' : 'À venir'}
                        </Badge>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                        {[
                          { label: 'Facturé', val: formatCurrency(cmd.totalTTC) },
                          { label: 'Payé', val: formatCurrency(cmd.montantPaye || 0) },
                          { label: 'Restant', val: formatCurrency(solde) },
                        ].map(({ label, val }) => (
                          <div key={label}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{label}</div>
                            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        Échéance: {formatDate(cmd.echeance)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier le client" size="lg">
        <ClientForm initial={client} onSave={handleEdit} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
