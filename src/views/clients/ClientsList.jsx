
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Plus, Search, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Modal, ConfirmModal, EmptyState, Badge } from '../../components/ui/index.jsx';
import {
  formatCurrency, generateClientId, calculateClientBalance,
  formatDate
} from '../../utils/helpers';
import ClientForm from './ClientForm';

const FILTERS = ['Tous', 'Actifs', 'Créances', 'En retard'];

export default function ClientsList() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const clientsWithBalance = useMemo(() =>
    state.clients.map(c => {
      const bal = calculateClientBalance(c.id, state.commandes, state.paiements);
      const hasOverdue = state.commandes.some(cmd =>
        cmd.clientId === c.id && cmd.statut !== 'Annulée' &&
        (cmd.totalTTC - (cmd.montantPaye || 0)) > 0.01 &&
        cmd.echeance && new Date(cmd.echeance) < new Date()
      );
      return { ...c, ...bal, hasOverdue };
    }),
    [state.clients, state.commandes, state.paiements]
  );

  const filtered = useMemo(() => {
    let list = clientsWithBalance;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.telephone?.includes(q) ||
        c.ville?.toLowerCase().includes(q) ||
        c.contact?.toLowerCase().includes(q)
      );
    }
    if (filter === 'Actifs') list = list.filter(c => c.statut === 'actif');
    if (filter === 'Créances') list = list.filter(c => c.soldeRestant > 0.01);
    if (filter === 'En retard') list = list.filter(c => c.hasOverdue);
    return list;
  }, [clientsWithBalance, search, filter]);

  const handleSave = (data) => {
    if (editingClient) {
      dispatch({ type: 'UPDATE_CLIENT', payload: { ...editingClient, ...data } });
      toast('Client mis à jour avec succès.', 'success');
    } else {
      dispatch({
        type: 'ADD_CLIENT',
        payload: { ...data, id: generateClientId(), statut: 'actif', createdAt: new Date().toISOString() }
      });
      toast('Client ajouté avec succès.', 'success');
    }
    setShowForm(false);
    setEditingClient(null);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_CLIENT', payload: deleteId });
    toast('Client supprimé.', 'info');
    setDeleteId(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{state.clients.length} clients enregistrés</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingClient(null); setShowForm(true); }}>
            <Plus size={16} /> Nouveau client
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search size={14} className="search-input-icon" />
          <input
            className="search-input"
            placeholder="Rechercher par nom, téléphone, ville..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>Tél.</th>
              <th>Ville</th>
              <th>Cmd.</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Solde</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    icon={Users}
                    title="Aucun client trouvé"
                    description="Modifiez votre recherche ou ajoutez un nouveau client."
                  />
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="clickable" onClick={() => navigate(`/clients/${c.id}`)}>
                <td>
                  <div className="td-primary">{c.nom}</div>
                  {c.ice && <div className="td-secondary" style={{ fontSize: '0.7rem' }}>ICE: {c.ice}</div>}
                </td>
                <td className="td-secondary">{c.contact || '—'}</td>
                <td className="td-secondary">{c.telephone || '—'}</td>
                <td className="td-secondary">{c.ville || '—'}</td>
                <td style={{ textAlign: 'center' }}>{c.nbCommandes}</td>
                <td className="td-amount" style={{ whiteSpace: 'nowrap' }}>{formatCurrency(c.totalFacture)}</td>
                <td className="td-amount" style={{ color: c.soldeRestant > 0.01 ? 'var(--color-danger)' : 'var(--color-success)', whiteSpace: 'nowrap' }}>
                  {formatCurrency(c.soldeRestant)}
                </td>
                <td>
                  {c.hasOverdue
                    ? <Badge className="badge-red">En retard</Badge>
                    : c.soldeRestant > 0.01
                      ? <Badge className="badge-orange">Créance</Badge>
                      : <Badge className="badge-green">À jour</Badge>
                  }
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingClient(c); setShowForm(true); }}>
                      Modifier
                    </button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleteId(c.id)}>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingClient(null); }}
        title={editingClient ? 'Modifier le client' : 'Nouveau client'}
        size="lg"
      >
        <ClientForm
          initial={editingClient}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingClient(null); }}
        />
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        message="Cette action est irréversible. Toutes les données associées à ce client seront conservées mais le client sera supprimé."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
