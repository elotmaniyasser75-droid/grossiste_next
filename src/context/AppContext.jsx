import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  INITIAL_CLIENTS, INITIAL_PRODUITS, INITIAL_COMMANDES,
  INITIAL_LIVRAISONS, INITIAL_PAIEMENTS, INITIAL_MOUVEMENTS_STOCK,
  INITIAL_PARAMETRES
} from '../data/seedData';
import {
  DEFAULT_MAPPINGS, INITIAL_BALANCE_2026
} from '../data/seedCompta';
import { generateId, generateMouvementId } from '../utils/helpers';

// ============================================================
// STORAGE KEY
// ============================================================
const STORAGE_KEY = 'atlas_distribution_v1';

// ============================================================
// INITIAL STATE
// ============================================================
const defaultState = {
  clients: INITIAL_CLIENTS,
  produits: INITIAL_PRODUITS,
  commandes: INITIAL_COMMANDES,
  livraisons: INITIAL_LIVRAISONS,
  paiements: INITIAL_PAIEMENTS,
  mouvementsStock: INITIAL_MOUVEMENTS_STOCK,
  parametres: INITIAL_PARAMETRES,
  // Bilan/Compta states:
  exercices: [
    { id: '2026', dateDebut: '2026-01-01', dateFin: '2026-12-31', statut: 'Brouillon' },
    { id: '2025', dateDebut: '2025-01-01', dateFin: '2025-12-31', statut: 'Clôturé' }
  ],
  balances: {
    '2026': INITIAL_BALANCE_2026,
    '2025': INITIAL_BALANCE_2026.map(row => ({
      ...row,
      debitN: row.debitN1,
      creditN: row.creditN1,
      debitN1: Math.round(row.debitN1 * 0.9 * 100) / 100,
      creditN1: Math.round(row.creditN1 * 0.9 * 100) / 100
    }))
  },
  mappings: DEFAULT_MAPPINGS,
  travauxCloture: {
    '2026': [
      { key: 'immob', label: 'Vérification et calcul des amortissements', statut: 'A faire', notes: '' },
      { key: 'stocks', label: 'Inventaire physique des stocks de marchandises', statut: 'A faire', notes: '' },
      { key: 'clients', label: 'Lettrage des comptes clients et provisions pour créances douteuses', statut: 'A faire', notes: '' },
      { key: 'banque', label: 'Rapprochements bancaires de fin d\'exercice', statut: 'A faire', notes: '' },
      { key: 'cca_pca', label: 'Régularisation des charges et produits constatés d\'avance', statut: 'A faire', notes: '' }
    ],
    '2025': [
      { key: 'immob', label: 'Vérification et calcul des amortissements', statut: 'Validé', notes: 'OK' },
      { key: 'stocks', label: 'Inventaire physique des stocks de marchandises', statut: 'Validé', notes: 'Fait' },
      { key: 'clients', label: 'Lettrage des comptes clients', statut: 'Validé', notes: 'Soldes validés' },
      { key: 'banque', label: 'Rapprochements bancaires de fin d\'exercice', statut: 'Validé', notes: 'Rapproché' },
      { key: 'cca_pca', label: 'Régularisation des charges et produits constatés d\'avance', statut: 'Validé', notes: 'Néant' }
    ]
  },
  eticInputs: {
    '2026': {
      introduction: 'Les états de synthèse ont été établis conformément aux règles du CGNC marocain.',
      faitsMarquants: 'Activité stable avec une légère augmentation des ventes de marchandises au Maroc.',
      methodesEvaluation: 'Les marchandises en stock sont évaluées au Coût Moyen Pondéré (CUMP).'
    },
    '2025': {
      introduction: 'Les états de synthèse ont été établis conformément aux règles du CGNC marocain.',
      faitsMarquants: 'Premier exercice complet d\'activité.',
      methodesEvaluation: 'Les marchandises en stock sont évaluées au Coût Moyen Pondéré (CUMP).'
    }
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return defaultState;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

// ============================================================
// REDUCER
// ============================================================
function reducer(state, action) {
  let newState;

  switch (action.type) {

    // ── CLIENTS ──────────────────────────────────────────────
    case 'ADD_CLIENT':
      newState = { ...state, clients: [...state.clients, action.payload] };
      break;
    case 'UPDATE_CLIENT':
      newState = {
        ...state,
        clients: state.clients.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c),
      };
      break;
    case 'DELETE_CLIENT':
      newState = { ...state, clients: state.clients.filter(c => c.id !== action.payload) };
      break;

    // ── PRODUITS ─────────────────────────────────────────────
    case 'ADD_PRODUIT':
      newState = { ...state, produits: [...state.produits, action.payload] };
      break;
    case 'UPDATE_PRODUIT':
      newState = {
        ...state,
        produits: state.produits.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p),
      };
      break;
    case 'DELETE_PRODUIT':
      newState = { ...state, produits: state.produits.filter(p => p.id !== action.payload) };
      break;

    // ── STOCK MOVEMENT ───────────────────────────────────────
    case 'ADD_MOUVEMENT_STOCK': {
      const { produitId, type, quantite, raison, notes, commandeId } = action.payload;
      const produit = state.produits.find(p => p.id === produitId);
      if (!produit) { newState = state; break; }

      const quantiteAvant = produit.stock;
      let quantiteApres;
      if (type === 'entree') quantiteApres = quantiteAvant + quantite;
      else if (type === 'sortie') quantiteApres = Math.max(0, quantiteAvant - quantite);
      else quantiteApres = quantite; // ajustement

      const mouvement = {
        id: generateMouvementId(),
        produitId,
        type,
        quantite,
        quantiteAvant,
        quantiteApres,
        raison: raison || '',
        notes: notes || '',
        commandeId: commandeId || null,
        createdAt: new Date().toISOString(),
      };

      newState = {
        ...state,
        produits: state.produits.map(p =>
          p.id === produitId ? { ...p, stock: quantiteApres } : p
        ),
        mouvementsStock: [...state.mouvementsStock, mouvement],
      };
      break;
    }

    // ── COMMANDES ────────────────────────────────────────────
    case 'ADD_COMMANDE':
      newState = { ...state, commandes: [...state.commandes, action.payload] };
      break;

    case 'UPDATE_COMMANDE':
      newState = {
        ...state,
        commandes: state.commandes.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c),
      };
      break;

    case 'CONFIRM_COMMANDE': {
      // Decrease stock for each ligne
      const commande = state.commandes.find(c => c.id === action.payload);
      if (!commande) { newState = state; break; }

      let produits = [...state.produits];
      const mouvements = [...state.mouvementsStock];

      (commande.lignes || []).forEach(ligne => {
        const pIdx = produits.findIndex(p => p.id === ligne.produitId);
        if (pIdx !== -1) {
          const avant = produits[pIdx].stock;
          const apres = Math.max(0, avant - ligne.quantite);
          mouvements.push({
            id: generateId('mov'),
            produitId: ligne.produitId,
            type: 'sortie',
            quantite: ligne.quantite,
            quantiteAvant: avant,
            quantiteApres: apres,
            raison: `Commande ${commande.numero}`,
            notes: '',
            commandeId: commande.id,
            createdAt: new Date().toISOString(),
          });
          produits[pIdx] = { ...produits[pIdx], stock: apres };
        }
      });

      newState = {
        ...state,
        produits,
        mouvementsStock: mouvements,
        commandes: state.commandes.map(c =>
          c.id === action.payload ? { ...c, statut: 'Confirmée' } : c
        ),
      };
      break;
    }

    case 'CANCEL_COMMANDE': {
      // Restore stock if was confirmed+
      const commande = state.commandes.find(c => c.id === action.payload);
      if (!commande) { newState = state; break; }

      const wasStockDeducted = ['Confirmée', 'Préparation', 'Prête', 'Livrée'].includes(commande.statut);
      let produits = [...state.produits];
      const mouvements = [...state.mouvementsStock];

      if (wasStockDeducted) {
        (commande.lignes || []).forEach(ligne => {
          const pIdx = produits.findIndex(p => p.id === ligne.produitId);
          if (pIdx !== -1) {
            const avant = produits[pIdx].stock;
            const apres = avant + ligne.quantite;
            mouvements.push({
              id: generateId('mov'),
              produitId: ligne.produitId,
              type: 'entree',
              quantite: ligne.quantite,
              quantiteAvant: avant,
              quantiteApres: apres,
              raison: `Annulation ${commande.numero}`,
              notes: '',
              commandeId: commande.id,
              createdAt: new Date().toISOString(),
            });
            produits[pIdx] = { ...produits[pIdx], stock: apres };
          }
        });
      }

      newState = {
        ...state,
        produits,
        mouvementsStock: mouvements,
        commandes: state.commandes.map(c =>
          c.id === action.payload ? { ...c, statut: 'Annulée' } : c
        ),
      };
      break;
    }

    case 'ADVANCE_COMMANDE_STATUS': {
      const statusFlow = ['Brouillon', 'Confirmée', 'Préparation', 'Prête', 'Livrée'];
      const commande = state.commandes.find(c => c.id === action.payload);
      if (!commande) { newState = state; break; }
      const idx = statusFlow.indexOf(commande.statut);
      if (idx === -1 || idx >= statusFlow.length - 1) { newState = state; break; }
      const nextStatus = statusFlow[idx + 1];

      let produits = state.produits;
      let mouvements = state.mouvementsStock;

      // If going from Brouillon/Draft to Confirmée — deduct stock
      if (commande.statut === 'Brouillon' && nextStatus === 'Confirmée') {
        produits = [...state.produits];
        mouvements = [...state.mouvementsStock];
        (commande.lignes || []).forEach(ligne => {
          const pIdx = produits.findIndex(p => p.id === ligne.produitId);
          if (pIdx !== -1) {
            const avant = produits[pIdx].stock;
            const apres = Math.max(0, avant - ligne.quantite);
            mouvements.push({
              id: generateId('mov'),
              produitId: ligne.produitId,
              type: 'sortie',
              quantite: ligne.quantite,
              quantiteAvant: avant,
              quantiteApres: apres,
              raison: `Confirmation ${commande.numero}`,
              notes: '',
              commandeId: commande.id,
              createdAt: new Date().toISOString(),
            });
            produits[pIdx] = { ...produits[pIdx], stock: apres };
          }
        });
      }

      newState = {
        ...state,
        produits,
        mouvementsStock: mouvements,
        commandes: state.commandes.map(c =>
          c.id === action.payload ? { ...c, statut: nextStatus } : c
        ),
      };
      break;
    }

    // ── LIVRAISONS ───────────────────────────────────────────
    case 'ADD_LIVRAISON':
      newState = { ...state, livraisons: [...state.livraisons, action.payload] };
      break;

    case 'UPDATE_LIVRAISON':
      newState = {
        ...state,
        livraisons: state.livraisons.map(l => l.id === action.payload.id ? { ...l, ...action.payload } : l),
      };
      break;

    case 'MARK_LIVRAISON_DELIVERED': {
      // Mark delivery as Livrée, update linked commande to Livrée
      const livraison = state.livraisons.find(l => l.id === action.payload);
      newState = {
        ...state,
        livraisons: state.livraisons.map(l =>
          l.id === action.payload ? { ...l, statut: 'Livrée' } : l
        ),
        commandes: state.commandes.map(c =>
          c.id === livraison?.commandeId ? { ...c, statut: 'Livrée' } : c
        ),
      };
      break;
    }

    // ── PAIEMENTS ────────────────────────────────────────────
    case 'ADD_PAIEMENT': {
      const paiement = action.payload;
      // Update commande's montantPaye and statutPaiement
      const commandes = state.commandes.map(c => {
        if (c.id !== paiement.commandeId) return c;
        const newMontantPaye = (c.montantPaye || 0) + paiement.montant;
        let statutPaiement;
        if (newMontantPaye >= c.totalTTC - 0.01) statutPaiement = 'Payé';
        else if (newMontantPaye > 0) statutPaiement = 'Partiellement payé';
        else statutPaiement = c.statutPaiement;
        return { ...c, montantPaye: Math.round(newMontantPaye * 100) / 100, statutPaiement };
      });
      newState = {
        ...state,
        paiements: [...state.paiements, paiement],
        commandes,
      };
      break;
    }

    // ── PARAMETRES ───────────────────────────────────────────
    case 'UPDATE_PARAMETRES':
      newState = { ...state, parametres: { ...state.parametres, ...action.payload } };
      break;

    // ── COMPTA BILAN ANNUEL ──────────────────────────────────
    case 'SET_EXERCICE_STATUT': {
      const { id, statut } = action.payload;
      newState = {
        ...state,
        exercices: state.exercices.map(e => e.id === id ? { ...e, statut } : e)
      };
      break;
    }

    case 'UPDATE_BALANCE_ACCOUNT': {
      const { exerciceId, compte, field, value } = action.payload;
      const balance = state.balances[exerciceId] || [];
      const updatedBalance = balance.map(row => {
        if (row.compte !== compte) return row;
        return { ...row, [field]: parseFloat(value) || 0 };
      });
      newState = {
        ...state,
        balances: {
          ...state.balances,
          [exerciceId]: updatedBalance
        }
      };
      break;
    }

    case 'IMPORT_BALANCE': {
      const { exerciceId, balance } = action.payload;
      newState = {
        ...state,
        balances: {
          ...state.balances,
          [exerciceId]: balance
        }
      };
      break;
    }

    case 'UPDATE_MAPPING': {
      newState = {
        ...state,
        mappings: {
          ...state.mappings,
          ...action.payload
        }
      };
      break;
    }

    case 'TOGGLE_CLOTURE_CHECK': {
      const { exerciceId, key, statut, notes } = action.payload;
      const list = state.travauxCloture[exerciceId] || [];
      const updatedList = list.map(item => {
        if (item.key !== key) return item;
        return { ...item, statut: statut !== undefined ? statut : (item.statut === 'Validé' ? 'A faire' : 'Validé'), notes: notes !== undefined ? notes : item.notes };
      });
      newState = {
        ...state,
        travauxCloture: {
          ...state.travauxCloture,
          [exerciceId]: updatedList
        }
      };
      break;
    }

    case 'UPDATE_ETIC': {
      const { exerciceId, data } = action.payload;
      newState = {
        ...state,
        eticInputs: {
          ...state.eticInputs,
          [exerciceId]: {
            ...(state.eticInputs[exerciceId] || {}),
            ...data
          }
        }
      };
      break;
    }

    // ── RESET ────────────────────────────────────────────────
    case 'RESET_TO_DEMO':
      newState = defaultState;
      break;

    default:
      newState = state;
  }

  saveState(newState);
  return newState;
}

// ============================================================
// CONTEXT
// ============================================================
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
