
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  TrendingUp, ShoppingCart, Truck, AlertCircle,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useApp } from '../context/AppContext';
import { KpiCard, Badge } from '../components/ui/index.jsx';
import {
  formatCurrency, formatDate, computeDashboardStats,
  getSalesChartData, getTopProduits, getCommandeStatusColor,
  getPaymentStatusColor, calculateClientBalance
} from '../utils/helpers';

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { clients, commandes, produits, paiements, livraisons } = state;

  const stats = useMemo(() => computeDashboardStats(commandes, paiements, produits, livraisons), [commandes, paiements, produits, livraisons]);
  const chartData = useMemo(() => getSalesChartData(commandes, 14), [commandes]);
  const topProduits = useMemo(() => getTopProduits(commandes, produits, 5), [commandes, produits]);

  // Recent orders (last 8)
  const recentCommandes = useMemo(() =>
    [...commandes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [commandes]
  );

  // Clients with balance
  const clientsWithBalance = useMemo(() =>
    clients.map(c => {
      const bal = calculateClientBalance(c.id, commandes, paiements);
      return { ...c, ...bal };
    }).filter(c => c.soldeRestant > 0.01)
      .sort((a, b) => b.soldeRestant - a.soldeRestant)
      .slice(0, 5),
    [clients, commandes, paiements]
  );

  // Stock alerts
  const alertesStock = useMemo(() =>
    produits.filter(p => p.stock <= p.stockMinimum).sort((a, b) => a.stock - b.stock).slice(0, 6),
    [produits]
  );

  // Quick stats
  const livraisonsMois = useMemo(() => {
    const now = new Date();
    return livraisons.filter(l => {
      const d = new Date(l.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [livraisons]);

  const getClientName = (id) => clients.find(c => c.id === id)?.nom || '—';

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/commandes')}>
          <KpiCard
            label="Chiffre d'affaires (mois)"
            value={formatCurrency(stats.caTotal)}
            icon={TrendingUp}
            iconBg="#eff6ff"
            iconColor="#2563eb"
            sub="Commandes confirmées ce mois"
          />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/commandes')}>
          <KpiCard
            label="Commandes"
            value={stats.nbCommandes}
            icon={ShoppingCart}
            iconBg="#f0fdf4"
            iconColor="#16a34a"
            sub={`${commandes.filter(c => c.statut === 'Brouillon').length} brouillons en attente`}
          />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/livraisons')}>
          <KpiCard
            label="Livraisons à effectuer"
            value={stats.livraisonsAFaire}
            icon={Truck}
            iconBg="#fff7ed"
            iconColor="#ea580c"
            sub="En cours ou à préparer"
          />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/paiements')}>
          <KpiCard
            label="Créances clients"
            value={formatCurrency(stats.creances)}
            icon={AlertCircle}
            iconBg="#fef2f2"
            iconColor="#dc2626"
            sub={`${clientsWithBalance.length} client${clientsWithBalance.length > 1 ? 's' : ''} avec solde`}
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        <div className="dashboard-col-left">

          {/* Sales Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Évolution des ventes — 14 derniers jours</span>
            </div>
            <div className="card-body">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Ventes']}
                      contentStyle={{
                        background: '#0f172a', border: 'none', borderRadius: '8px',
                        color: '#f1f5f9', fontSize: '11px', padding: '6px 10px',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area
                      type="monotone" dataKey="ventes"
                      stroke="#2563eb" strokeWidth={2}
                      fill="url(#colorVentes)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Commandes récentes</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/commandes')}>
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° Commande</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCommandes.map(cmd => (
                    <tr key={cmd.id} className="clickable" onClick={() => navigate(`/commandes/${cmd.id}`)}>
                      <td><span className="td-mono">{cmd.numero}</span></td>
                      <td><span className="td-primary">{getClientName(cmd.clientId)}</span></td>
                      <td className="td-secondary">{formatDate(cmd.createdAt)}</td>
                      <td className="td-amount">{formatCurrency(cmd.totalTTC)}</td>
                      <td><Badge className={getCommandeStatusColor(cmd.statut)}>{cmd.statut}</Badge></td>
                      <td><Badge className={getPaymentStatusColor(cmd.statutPaiement)}>{cmd.statutPaiement}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top produits</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/produits')}>
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {topProduits.length === 0 ? (
                <p className="text-muted text-sm">Aucune donnée disponible.</p>
              ) : (
                topProduits.map((p, i) => {
                  const maxCa = topProduits[0]?.ca || 1;
                  return (
                    <div key={p.id} style={{ marginBottom: '14px' }}>
                      <div className="flex justify-between items-center mb-2" style={{ marginBottom: '6px' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                          <span style={{ color: 'var(--color-text-muted)', marginRight: '8px', fontSize: '0.7rem' }}>#{i + 1}</span>
                          {p.nom}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{formatCurrency(p.ca)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(p.ca / maxCa) * 100}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="dashboard-col-right">

          {/* Stock Alerts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">⚠️ Alertes stock</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/stock')}>
                Gérer <ArrowRight size={14} />
              </button>
            </div>
            <div className="card-body" style={{ padding: '0 var(--space-6)' }}>
              {alertesStock.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    ✓ Stock en bon état
                  </p>
                </div>
              ) : alertesStock.map(p => (
                <div key={p.id} className="alert-item">
                  <span className="alert-item-icon">
                    {p.stock === 0 ? '🔴' : '🟡'}
                  </span>
                  <div className="alert-item-info">
                    <div className="alert-item-name">{p.nom}</div>
                    <div className="alert-item-detail">
                      Stock: {p.stock} {p.unite} — Min: {p.stockMinimum}
                    </div>
                  </div>
                  {p.stock === 0 && <Badge className="badge-red">Rupture</Badge>}
                  {p.stock > 0 && <Badge className="badge-yellow">Faible</Badge>}
                </div>
              ))}
            </div>
          </div>

          {/* Receivables */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Créances à surveiller</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/paiements')}>
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="card-body" style={{ padding: '0 var(--space-6)' }}>
              {clientsWithBalance.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    ✓ Aucune créance en cours
                  </p>
                </div>
              ) : clientsWithBalance.map(c => (
                <div key={c.id} className="alert-item" style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/clients/${c.id}`)}>
                  <div className="sidebar-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                    {c.nom.charAt(0)}
                  </div>
                  <div className="alert-item-info">
                    <div className="alert-item-name">{c.nom}</div>
                    <div className="alert-item-detail">{c.ville}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-danger)' }}>
                      {formatCurrency(c.soldeRestant)}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>restant</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Statistiques rapides</span>
            </div>
            <div className="card-body" style={{ padding: '0 var(--space-6)' }}>
              {[
                { label: 'Total clients', value: clients.length, icon: '👥', path: '/clients' },
                { label: 'Produits référencés', value: produits.length, icon: '📦', path: '/produits' },
                { label: 'Produits en rupture', value: produits.filter(p => p.stock === 0).length, icon: '🔴', path: '/stock' },
                { label: 'Livraisons ce mois', value: livraisonsMois, icon: '🚚', path: '/livraisons' },
              ].map((s, i) => (
                <div key={i} className="stat-row" style={{ cursor: 'pointer' }} onClick={() => navigate(s.path)}>
                  <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                  <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
