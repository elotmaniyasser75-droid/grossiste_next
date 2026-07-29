
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Truck, Search, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Badge, EmptyState, ConfirmModal, Modal } from '../../components/ui/index.jsx';
import { formatDate, getLivraisonStatusColor, generateLivraisonNumber, generateId } from '../../utils/helpers';

const STATUT_OPTIONS = ['Tous', 'À préparer', 'En préparation', 'En livraison', 'Livrée', 'Échec'];
const DRIVERS = ['Youssef Ait Said', 'Driss Ouali', 'Khalid Mansouri'];
const VEHICLES = ['Ford Transit - 234 A 56', 'Renault Master - 456 B 78', 'Mercedes Sprinter - 789 C 90'];

export default function LivraisonsList() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('Tous');
  const [markDeliveredId, setMarkDeliveredId] = useState(null);

  const getClientName = id => state.clients.find(c => c.id === id)?.nom || '—';
  const getCommandeNum = id => state.commandes.find(c => c.id === id)?.numero || '—';

  const filtered = useMemo(() => {
    let list = [...state.livraisons].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.numero?.toLowerCase().includes(q) ||
        getClientName(l.clientId).toLowerCase().includes(q) ||
        l.chauffeur?.toLowerCase().includes(q)
      );
    }
    if (statutFilter !== 'Tous') list = list.filter(l => l.statut === statutFilter);
    return list;
  }, [state.livraisons, state.clients, search, statutFilter]);

  const handleMarkDelivered = () => {
    dispatch({ type: 'MARK_LIVRAISON_DELIVERED', payload: markDeliveredId });
    toast('Livraison marquée comme livrée. La commande a été mise à jour.', 'success');
    setMarkDeliveredId(null);
  };

  const handleUpdateStatut = (id, statut) => {
    dispatch({ type: 'UPDATE_LIVRAISON', payload: { id, statut } });
    toast(`Livraison mise à jour: ${statut}`, 'info');
  };

  const pending = state.livraisons.filter(l => ['À préparer', 'En préparation', 'En livraison'].includes(l.statut)).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Livraisons</h1>
          <p className="page-subtitle">{state.livraisons.length} livraisons — {pending} en cours</p>
        </div>
      </div>

      <div className="table-controls" style={{ flexWrap: 'wrap' }}>
        <div className="search-input-wrapper">
          <Search size={14} className="search-input-icon" />
          <input className="search-input" placeholder="Rechercher par N°, client, chauffeur..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          {STATUT_OPTIONS.map(s => (
            <button key={s} className={`filter-tab${statutFilter === s ? ' active' : ''}`} onClick={() => setStatutFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Livraison</th>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Date prévue</th>
              <th>Chauffeur</th>
              <th>Véhicule</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><EmptyState icon={Truck} title="Aucune livraison" description="Les livraisons créées apparaîtront ici." /></td></tr>
            ) : filtered.map(l => (
              <tr key={l.id} className="clickable" onClick={() => navigate(`/livraisons/${l.id}`)}>
                <td><span className="td-mono">{l.numero}</span></td>
                <td><span className="td-mono">{getCommandeNum(l.commandeId)}</span></td>
                <td><span className="td-primary">{getClientName(l.clientId)}</span></td>
                <td className="td-secondary">{formatDate(l.dateLivraison)}</td>
                <td className="td-secondary">{l.chauffeur || '—'}</td>
                <td className="td-secondary">{l.vehicule || '—'}</td>
                <td><Badge className={getLivraisonStatusColor(l.statut)}>{l.statut}</Badge></td>
                <td onClick={e => e.stopPropagation()}>
                  {l.statut !== 'Livrée' && l.statut !== 'Échec' && (
                    <div className="flex gap-2">
                      {l.statut !== 'En livraison' && (
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => handleUpdateStatut(l.id, l.statut === 'À préparer' ? 'En préparation' : 'En livraison')}>
                          Avancer
                        </button>
                      )}
                      {l.statut === 'En livraison' && (
                        <button className="btn btn-success btn-sm" onClick={() => setMarkDeliveredId(l.id)}>
                          ✓ Livrée
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/livraisons/${l.id}/bl`)}>
                        BL
                      </button>
                    </div>
                  )}
                  {l.statut === 'Livrée' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/livraisons/${l.id}/bl`)}>
                      Voir BL
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!markDeliveredId}
        onClose={() => setMarkDeliveredId(null)}
        onConfirm={handleMarkDelivered}
        title="Marquer comme livrée ?"
        message="La livraison et la commande associée seront marquées comme livrées."
        confirmLabel="Confirmer la livraison"
        variant="warning"
      />
    </div>
  );
}
