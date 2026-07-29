// ============================================================
// UTILITIES — Formatters, Generators, Calculations
// ============================================================

// --- Date & Currency Formatters ---
export const formatCurrency = (amount, devise = 'DH') => {
  if (amount === null || amount === undefined || isNaN(amount)) return `0,00 ${devise}`;
  return `${Number(amount).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
};

// --- ID & Number Generators ---
let cmdCounter = 26;
let livCounter = 19;
let payCounter = 22;
let cliCounter = 19;
let proCounter = 43;
let movCounter = 1;

export const generateCommandeNumber = () => {
  const year = new Date().getFullYear();
  return `CMD-${year}-${String(cmdCounter++).padStart(4, '0')}`;
};

export const generateLivraisonNumber = () => {
  const year = new Date().getFullYear();
  return `BL-${year}-${String(livCounter++).padStart(4, '0')}`;
};

export const generateClientId = () => `c${String(cliCounter++).padStart(3, '0')}`;
export const generateProduitId = () => `p${String(proCounter++).padStart(3, '0')}`;
export const generatePaiementId = () => `pay${String(payCounter++).padStart(3, '0')}`;
export const generateLivraisonId = () => `liv${String(livCounter - 1).padStart(3, '0')}`;
export const generateMouvementId = () => `mov${String(movCounter++).padStart(3, '0')}`;
export const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Reset counters (used after seed reset)
export const resetCounters = () => {
  cmdCounter = 26; livCounter = 19; payCounter = 22;
  cliCounter = 19; proCounter = 43; movCounter = 1;
};

// --- Order Calculations ---
export const calculateOrderTotals = (lignes, remiseGlobale = 0, tvaRate = 0.20) => {
  const sousTotal = lignes.reduce((sum, l) => {
    const lineTotal = l.quantite * l.prixUnitaire * (1 - (l.remise || 0) / 100);
    return sum + lineTotal;
  }, 0);
  const apresRemise = sousTotal * (1 - (remiseGlobale || 0) / 100);
  const tva = apresRemise * tvaRate;
  const totalTTC = apresRemise + tva;
  return {
    sousTotal: Math.round(sousTotal * 100) / 100,
    remise: remiseGlobale || 0,
    totalHT: Math.round(apresRemise * 100) / 100,
    tva: Math.round(tva * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
  };
};

export const calculateLineTotal = (quantite, prixUnitaire, remise = 0) => {
  return Math.round(quantite * prixUnitaire * (1 - remise / 100) * 100) / 100;
};

// --- Client Balance ---
export const calculateClientBalance = (clientId, commandes, paiements) => {
  const clientCommandes = commandes.filter(c => c.clientId === clientId && c.statut !== 'Annulée');
  const totalFacture = clientCommandes.reduce((sum, c) => sum + (c.totalTTC || 0), 0);
  const clientPaiements = paiements.filter(p => p.clientId === clientId);
  const totalPaye = clientPaiements.reduce((sum, p) => sum + (p.montant || 0), 0);
  return {
    totalFacture: Math.round(totalFacture * 100) / 100,
    totalPaye: Math.round(totalPaye * 100) / 100,
    soldeRestant: Math.round((totalFacture - totalPaye) * 100) / 100,
    nbCommandes: clientCommandes.length,
  };
};

// --- Stock status ---
export const getStockStatus = (stock, stockMinimum) => {
  if (stock === 0) return 'rupture';
  if (stock <= stockMinimum) return 'faible';
  return 'ok';
};

// --- Order status helpers ---
export const getCommandeStatusColor = (statut) => {
  const map = {
    'Brouillon': 'badge-gray',
    'Confirmée': 'badge-blue',
    'Préparation': 'badge-orange',
    'Prête': 'badge-purple',
    'Livrée': 'badge-green',
    'Annulée': 'badge-red',
  };
  return map[statut] || 'badge-gray';
};

export const getPaymentStatusColor = (statut) => {
  const map = {
    'Payé': 'badge-green',
    'Partiellement payé': 'badge-orange',
    'Non payé': 'badge-gray',
    'En retard': 'badge-red',
  };
  return map[statut] || 'badge-gray';
};

export const getLivraisonStatusColor = (statut) => {
  const map = {
    'À préparer': 'badge-yellow',
    'En préparation': 'badge-blue',
    'En livraison': 'badge-orange',
    'Livrée': 'badge-green',
    'Échec': 'badge-red',
  };
  return map[statut] || 'badge-gray';
};

// --- Dashboard stats ---
export const computeDashboardStats = (commandes, paiements, produits, livraisons) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const caTotal = commandes
    .filter(c => c.statut !== 'Annulée' && new Date(c.createdAt) >= startOfMonth)
    .reduce((s, c) => s + c.totalTTC, 0);

  const nbCommandes = commandes.filter(c => c.statut !== 'Annulée').length;

  const livraisonsAFaire = livraisons.filter(
    l => l.statut === 'À préparer' || l.statut === 'En préparation' || l.statut === 'En livraison'
  ).length;

  const creances = commandes
    .filter(c => c.statut !== 'Annulée')
    .reduce((s, c) => s + Math.max(0, c.totalTTC - c.montantPaye), 0);

  const alertesStock = produits.filter(p => p.stock <= p.stockMinimum);

  return {
    caTotal: Math.round(caTotal * 100) / 100,
    nbCommandes,
    livraisonsAFaire,
    creances: Math.round(creances * 100) / 100,
    alertesStock,
  };
};

// --- Sales chart data (last 30 days) ---
export const getSalesChartData = (commandes, days = 30) => {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const dayCommandes = commandes.filter(c => {
      if (c.statut === 'Annulée') return false;
      return c.createdAt && c.createdAt.startsWith(dayStr);
    });
    const total = dayCommandes.reduce((s, c) => s + c.totalTTC, 0);
    result.push({
      date: formatDateShort(day.toISOString()),
      ventes: Math.round(total * 100) / 100,
      commandes: dayCommandes.length,
    });
  }
  return result;
};

// --- Top products ---
export const getTopProduits = (commandes, produits, limit = 5) => {
  const counts = {};
  commandes.filter(c => c.statut !== 'Annulée').forEach(c => {
    (c.lignes || []).forEach(l => {
      if (!counts[l.produitId]) counts[l.produitId] = { quantite: 0, ca: 0 };
      counts[l.produitId].quantite += l.quantite;
      counts[l.produitId].ca += l.total;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1].ca - a[1].ca)
    .slice(0, limit)
    .map(([id, data]) => {
      const produit = produits.find(p => p.id === id);
      return { ...data, id, nom: produit?.nom || id };
    });
};

// --- Top clients ---
export const getTopClients = (commandes, clients, limit = 5) => {
  const totals = {};
  commandes.filter(c => c.statut !== 'Annulée').forEach(c => {
    if (!totals[c.clientId]) totals[c.clientId] = 0;
    totals[c.clientId] += c.totalTTC;
  });
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, total]) => {
      const client = clients.find(c => c.id === id);
      return { id, nom: client?.nom || id, total };
    });
};

export const truncate = (str, len = 30) =>
  str && str.length > len ? str.slice(0, len) + '…' : (str || '');
