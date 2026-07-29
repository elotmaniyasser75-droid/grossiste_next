
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, AlertTriangle, Package, Clock, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';


export default function Topbar({ title }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Compute notifications
  const ruptures = state.produits.filter(p => p.stock === 0);
  const stockFaible = state.produits.filter(p => p.stock > 0 && p.stock <= p.stockMinimum);
  const enRetard = state.commandes.filter(c => {
    if (c.statut === 'Annulée') return false;
    const solde = c.totalTTC - (c.montantPaye || 0);
    return solde > 0.01 && c.echeance && new Date(c.echeance) < new Date();
  });
  const livraisonsDuJour = state.livraisons.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.dateLivraison && l.dateLivraison.startsWith(today) && l.statut !== 'Livrée';
  });

  const totalNotifs = ruptures.length + (stockFaible.length > 0 ? 1 : 0) + enRetard.length + livraisonsDuJour.length;

  const notifications = [
    ruptures.length > 0 && {
      type: 'red', icon: Package,
      text: `${ruptures.length} produit${ruptures.length > 1 ? 's' : ''} en rupture de stock`,
      action: () => navigate('/stock'),
    },
    stockFaible.length > 0 && {
      type: 'yellow', icon: AlertTriangle,
      text: `${stockFaible.length} produit${stockFaible.length > 1 ? 's' : ''} sous le stock minimum`,
      action: () => navigate('/stock'),
    },
    enRetard.length > 0 && {
      type: 'orange', icon: Clock,
      text: `${enRetard.length} paiement${enRetard.length > 1 ? 's' : ''} en retard`,
      action: () => navigate('/paiements'),
    },
    livraisonsDuJour.length > 0 && {
      type: 'blue', icon: Truck,
      text: `${livraisonsDuJour.length} livraison${livraisonsDuJour.length > 1 ? 's' : ''} prévue${livraisonsDuJour.length > 1 ? 's' : ''} aujourd'hui`,
      action: () => navigate('/livraisons'),
    },
  ].filter(Boolean);

  // Global search
  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const q = searchQ.toLowerCase();
    const results = [];
    state.clients.filter(c => c.nom.toLowerCase().includes(q) || c.telephone?.includes(q) || c.ville?.toLowerCase().includes(q))
      .slice(0, 3).forEach(c => results.push({ type: 'Client', label: c.nom, sub: c.ville, action: () => navigate(`/clients/${c.id}`) }));
    state.produits.filter(p => p.nom.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q))
      .slice(0, 3).forEach(p => results.push({ type: 'Produit', label: p.nom, sub: p.reference, action: () => navigate('/produits') }));
    state.commandes.filter(c => c.numero?.toLowerCase().includes(q))
      .slice(0, 3).forEach(c => results.push({ type: 'Commande', label: c.numero, sub: '', action: () => navigate(`/commandes/${c.id}`) }));
    setSearchResults(results.slice(0, 7));
  }, [searchQ, state]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const today = new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>

      {/* Search */}
      <div className="topbar-search" ref={searchRef} style={{ position: 'relative' }}>
        <Search size={15} className="topbar-search-icon" />
        <input
          className="topbar-search-input"
          placeholder="Rechercher clients, produits, commandes..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 300,
            overflow: 'hidden',
          }}>
            {searchResults.map((r, i) => (
              <div key={i}
                onClick={() => { r.action(); setSearchQ(''); setSearchResults([]); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px',
                  borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)', flexShrink: 0,
                }}>{r.type}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{r.label}</span>
                {r.sub && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{r.sub}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <span className="topbar-date">{today}</span>

        {/* Notifications */}
        <div className="notif-wrapper" ref={notifRef}>
          <button className="topbar-icon-btn" onClick={() => setShowNotif(v => !v)} aria-label="Notifications">
            <Bell size={16} />
            {totalNotifs > 0 && <span className="notif-dot" />}
          </button>

          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                {totalNotifs > 0 && (
                  <span className="badge badge-red">{totalNotifs}</span>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    Aucune notification
                  </div>
                ) : notifications.map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <div key={i} className="notif-item" onClick={() => { n.action(); setShowNotif(false); }}>
                      <div className={`notif-icon ${n.type}`}><Icon size={15} /></div>
                      <div>
                        <div className="notif-text">{n.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
