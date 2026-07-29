
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import {
  LayoutDashboard, Users, Package, Layers, ShoppingCart,
  Truck, CreditCard, BarChart2, Settings, Building2, FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/produits', icon: Package, label: 'Produits' },
  { to: '/stock', icon: Layers, label: 'Stock' },
  { to: '/commandes', icon: ShoppingCart, label: 'Commandes' },
  { to: '/livraisons', icon: Truck, label: 'Livraisons' },
  { to: '/paiements', icon: CreditCard, label: 'Paiements' },
  { to: '/rapports', icon: BarChart2, label: 'Rapports' },
  { to: '/bilans', icon: FileSpreadsheet, label: 'Bilans annuels' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar() {
  const { state } = useApp();
  const pathname = useLocation().pathname;

  // Compute alerts for badges
  const stockAlerts = state.produits.filter(p => p.stock <= p.stockMinimum).length;
  const pendingDeliveries = state.livraisons.filter(
    l => ['À préparer', 'En préparation', 'En livraison'].includes(l.statut)
  ).length;
  const overduePayments = state.commandes.filter(c => {
    if (c.statut === 'Annulée') return false;
    const solde = c.totalTTC - (c.montantPaye || 0);
    if (solde <= 0.01) return false;
    return c.echeance && new Date(c.echeance) < new Date();
  }).length;

  const badges = {
    '/stock': stockAlerts || null,
    '/livraisons': pendingDeliveries || null,
    '/paiements': overduePayments || null,
  };

  const { parametres } = state;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">{parametres.entreprise.nom}</div>
        <div className="sidebar-logo-sub">Système de gestion</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            href={to}
            className={`sidebar-link${pathname === to ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
            {badges[to] ? <span className="sidebar-badge">{badges[to]}</span> : null}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">AD</div>
          <div>
            <div className="sidebar-user-name">Admin</div>
            <div className="sidebar-user-role">Gestionnaire</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
