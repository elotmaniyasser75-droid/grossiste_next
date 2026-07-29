
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Plus, Search, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, EmptyState } from '../../components/ui/index.jsx';
import {
  formatCurrency, formatDate, getCommandeStatusColor, getPaymentStatusColor
} from '../../utils/helpers';

const STATUS_OPTIONS = ['Tous', 'Brouillon', 'Confirmée', 'Préparation', 'Prête', 'Livrée', 'Annulée'];

export default function CommandesList() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');

  const getClientName = (id) => state.clients.find(c => c.id === id)?.nom || '—';

  const filtered = useMemo(() => {
    let list = [...state.commandes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.numero?.toLowerCase().includes(q) ||
        getClientName(c.clientId).toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'Tous') list = list.filter(c => c.statut === statusFilter);
    return list;
  }, [state.commandes, state.clients, search, statusFilter]);

  const totalCA = useMemo(() =>
    state.commandes.filter(c => c.statut !== 'Annulée').reduce((s, c) => s + c.totalTTC, 0),
    [state.commandes]
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Commandes</h1>
          <p className="page-subtitle">
            {state.commandes.filter(c => c.statut !== 'Annulée').length} commandes — CA total: {formatCurrency(totalCA)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/commandes/new')}>
          <Plus size={16} /> Nouvelle commande
        </button>
      </div>

      <div className="table-controls" style={{ flexWrap: 'wrap' }}>
        <div className="search-input-wrapper">
          <Search size={14} className="search-input-icon" />
          <input className="search-input" placeholder="Rechercher par N° ou client..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs" style={{ flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} className={`filter-tab${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Client</th>
              <th>Date</th>
              <th>Cond.</th>
              <th style={{ textAlign: 'right' }}>Total TTC</th>
              <th style={{ textAlign: 'right' }}>Solde</th>
              <th>Statut</th>
              <th>Paiement</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={ShoppingCart} title="Aucune commande" description="Créez votre première commande." />
              </td></tr>
            ) : filtered.map(cmd => {
              const solde = Math.max(0, cmd.totalTTC - (cmd.montantPaye || 0));
              return (
                <tr key={cmd.id} className="clickable" onClick={() => navigate(`/commandes/${cmd.id}`)}>
                  <td><span className="td-mono" style={{ fontSize: '0.68rem' }}>{cmd.numero}</span></td>
                  <td><span className="td-primary">{getClientName(cmd.clientId)}</span></td>
                  <td className="td-secondary" style={{ whiteSpace: 'nowrap' }}>{formatDate(cmd.createdAt)}</td>
                  <td className="td-secondary" style={{ whiteSpace: 'nowrap' }}>{cmd.conditionPaiement}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(cmd.totalTTC)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {formatCurrency(solde)}
                  </td>
                  <td><Badge className={getCommandeStatusColor(cmd.statut)}>{cmd.statut}</Badge></td>
                  <td><Badge className={getPaymentStatusColor(cmd.statutPaiement)}>{cmd.statutPaiement}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
