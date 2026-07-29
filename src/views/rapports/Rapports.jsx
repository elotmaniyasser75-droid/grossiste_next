
import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency, getSalesChartData, getTopProduits, getTopClients,
  calculateClientBalance
} from '../../utils/helpers';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#ea580c'];

export default function Rapports() {
  const { state } = useApp();
  const [period, setPeriod] = useState('30');

  const chartData = useMemo(() => getSalesChartData(state.commandes, parseInt(period)), [state.commandes, period]);
  const topProduits = useMemo(() => getTopProduits(state.commandes, state.produits, 8), [state.commandes, state.produits]);
  const topClients = useMemo(() => getTopClients(state.commandes, state.clients, 8), [state.commandes, state.clients]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const cats = {};
    state.commandes.filter(c => c.statut !== 'Annulée').forEach(c => {
      (c.lignes || []).forEach(l => {
        const produit = state.produits.find(p => p.id === l.produitId);
        const cat = produit?.categorie || 'Autre';
        if (!cats[cat]) cats[cat] = 0;
        cats[cat] += l.total;
      });
    });
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [state.commandes, state.produits]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const months = {};
    state.commandes.filter(c => c.statut !== 'Annulée').forEach(c => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-MA', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { label, ventes: 0, commandes: 0 };
      months[key].ventes += c.totalTTC;
      months[key].commandes += 1;
    });
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, v]) => ({ ...v, ventes: Math.round(v.ventes * 100) / 100 }));
  }, [state.commandes]);

  // Stock stats
  const stockOk = state.produits.filter(p => p.stock > p.stockMinimum).length;
  const stockFaible = state.produits.filter(p => p.stock > 0 && p.stock <= p.stockMinimum).length;
  const stockRupture = state.produits.filter(p => p.stock === 0).length;

  // Delivery stats
  const livOk = state.livraisons.filter(l => l.statut === 'Livrée').length;
  const livEnCours = state.livraisons.filter(l => ['À préparer', 'En préparation', 'En livraison'].includes(l.statut)).length;
  const livEchec = state.livraisons.filter(l => l.statut === 'Échec').length;

  // Client balances
  const clientsWithBalance = state.clients.map(c => ({
    ...c,
    ...calculateClientBalance(c.id, state.commandes, state.paiements),
  })).filter(c => c.soldeRestant > 0.01).sort((a, b) => b.soldeRestant - a.soldeRestant);

  const totalCA = state.commandes.filter(c => c.statut !== 'Annulée').reduce((s, c) => s + c.totalTTC, 0);
  const totalPaye = state.paiements.reduce((s, p) => s + p.montant, 0);
  const totalCreances = Math.max(0, totalCA - totalPaye);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports</h1>
          <p className="page-subtitle">Analyse des ventes, stock et clients</p>
        </div>
        <div className="filter-tabs">
          {[['7', '7 jours'], ['14', '14 jours'], ['30', '30 jours']].map(([val, label]) => (
            <button key={val} className={`filter-tab${period === val ? ' active' : ''}`} onClick={() => setPeriod(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'CA total', value: formatCurrency(totalCA), sub: `${state.commandes.filter(c => c.statut !== 'Annulée').length} commandes` },
          { label: 'Total encaissé', value: formatCurrency(totalPaye), sub: `${state.paiements.length} paiements` },
          { label: 'Créances totales', value: formatCurrency(totalCreances), sub: `${clientsWithBalance.length} clients` },
          { label: 'Livraisons effectuées', value: livOk, sub: `${livEnCours} en cours` },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-label" style={{ marginBottom: 8 }}>{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-change">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Évolution des ventes ({period} jours)</span></div>
        <div className="card-body">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradRapport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [formatCurrency(v), 'Ventes']} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                <Area type="monotone" dataKey="ventes" stroke="#2563eb" strokeWidth={2} fill="url(#gradRapport)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Ventes par mois</span></div>
          <div className="card-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [formatCurrency(v), 'Ventes']} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                  <Bar dataKey="ventes" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Ventes par catégorie</span></div>
          <div className="card-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                  <Legend formatter={(value) => <span style={{ fontSize: 11, color: '#64748b' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top produits + Top clients */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Top produits</span></div>
          <div className="card-body">
            {topProduits.map((p, i) => {
              const maxCa = topProduits[0]?.ca || 1;
              return (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
                    <span><span style={{ color: 'var(--color-text-muted)', marginRight: 6, fontSize: '0.7rem' }}>#{i + 1}</span>{p.nom}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(p.ca)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(p.ca / maxCa) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Top clients</span></div>
          <div className="card-body">
            {topClients.map((c, i) => {
              const maxTotal = topClients[0]?.total || 1;
              return (
                <div key={c.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
                    <span><span style={{ color: 'var(--color-text-muted)', marginRight: 6, fontSize: '0.7rem' }}>#{i + 1}</span>{c.nom}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(c.total)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(c.total / maxTotal) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock + Delivery stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">État du stock</span></div>
          <div className="card-body">
            {[
              { label: '🟢 En stock', value: stockOk, color: 'var(--color-success)' },
              { label: '🟡 Stock faible', value: stockFaible, color: 'var(--color-warning)' },
              { label: '🔴 Rupture de stock', value: stockRupture, color: 'var(--color-danger)' },
            ].map(s => (
              <div key={s.label} className="stat-row">
                <span style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color, fontSize: 'var(--font-size-lg)' }}>{s.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Sur {state.produits.length} produits référencés
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Livraisons</span></div>
          <div className="card-body">
            {[
              { label: '🟢 Livrées', value: livOk, color: 'var(--color-success)' },
              { label: '🔵 En cours', value: livEnCours, color: 'var(--color-primary)' },
              { label: '🔴 Échec', value: livEchec, color: 'var(--color-danger)' },
            ].map(s => (
              <div key={s.label} className="stat-row">
                <span style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color, fontSize: 'var(--font-size-lg)' }}>{s.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Sur {state.livraisons.length} livraisons totales
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
