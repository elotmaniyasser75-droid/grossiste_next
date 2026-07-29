
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  FileText, CheckCircle, AlertTriangle, Play, RefreshCw,
  Info, Database, Upload, Download, ArrowRight, Check, Eye
} from 'lucide-react';
import { Badge, Modal, ConfirmModal, KpiCard } from '../../components/ui/index.jsx';
import { formatCurrency, formatDate } from '../../utils/helpers';

// Helper for formatting currencies
const fm = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0,00 DH';
  const suffix = ' DH';
  return val.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix;
};

export default function BilansWorkspace() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [selectedEx, setSelectedEx] = useState('2026');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Selected exercise data
  const exercise = state.exercices.find(e => e.id === selectedEx) || { id: selectedEx, dateDebut: '', dateFin: '', statut: 'Brouillon' };
  const balance = state.balances[selectedEx] || [];
  const mappings = state.mappings || {};
  const checklist = state.travauxCloture[selectedEx] || [];
  const etic = state.eticInputs[selectedEx] || { introduction: '', faitsMarquants: '', methodesEvaluation: '' };

  // Drill down details modal
  const [drillModal, setDrillModal] = useState(null); // { title: '', total: 0, accounts: [ {compte, intitule, solde} ] }

  // Manual account editing
  const [editRow, setEditRow] = useState(null); // { compte, debitN, creditN, debitN1, creditN1 }

  // CSV Importer
  const [csvText, setCsvText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Status flow transition
  const handleSetStatus = (newStatut) => {
    dispatch({ type: 'SET_EXERCICE_STATUT', payload: { id: selectedEx, statut: newStatut } });
    toast(`Statut de l'exercice ${selectedEx} mis à jour : ${newStatut}`, 'success');
  };

  // Sync from platform data
  const handleSyncPlatform = () => {
    // 1. Calculate live client balances (3421)
    const clientEncours = state.clients.reduce((sum, c) => {
      const balance = state.commandes
        .filter(cmd => cmd.clientId === c.id && cmd.statut !== 'Annulée')
        .reduce((s, cmd) => s + (cmd.totalTTC - (cmd.montantPaye || 0)), 0);
      return sum + balance;
    }, 0);

    // 2. Calculate stock value (3111) at cost
    const stockVal = state.produits.reduce((sum, p) => sum + (p.stock * p.prixAchat), 0);

    // 3. Calculate sales revenue (7111)
    const salesVal = state.commandes
      .filter(cmd => cmd.statut !== 'Annulée')
      .reduce((sum, cmd) => sum + cmd.totalHT, 0);

    // 4. Calculate TVA facturée (4455)
    const tvaVal = state.commandes
      .filter(cmd => cmd.statut !== 'Annulée')
      .reduce((sum, cmd) => sum + cmd.tva, 0);

    // 5. Calculate liquid cash / payments (5141)
    const bankVal = state.paiements.reduce((sum, p) => sum + p.montant, 0);

    // Update in Context
    dispatch({ type: 'UPDATE_BALANCE_ACCOUNT', payload: { exerciceId: selectedEx, compte: '3421', field: 'debitN', value: clientEncours } });
    dispatch({ type: 'UPDATE_BALANCE_ACCOUNT', payload: { exerciceId: selectedEx, compte: '3111', field: 'debitN', value: stockVal } });
    dispatch({ type: 'UPDATE_BALANCE_ACCOUNT', payload: { exerciceId: selectedEx, compte: '7111', field: 'creditN', value: salesVal } });
    dispatch({ type: 'UPDATE_BALANCE_ACCOUNT', payload: { exerciceId: selectedEx, compte: '4455', field: 'creditN', value: tvaVal } });
    dispatch({ type: 'UPDATE_BALANCE_ACCOUNT', payload: { exerciceId: selectedEx, compte: '5141', field: 'debitN', value: bankVal } });

    toast('✓ Données actualisées en temps réel depuis la plateforme grossiste.', 'success');
  };

  // CSV paste parse logic
  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split('\n');
    const imported = [];
    lines.forEach(l => {
      if (!l.trim()) return;
      const parts = l.split(';');
      if (parts.length >= 4) {
        const compte = parts[0].trim();
        const intitule = parts[1].trim();
        const debitN = parseFloat(parts[2]) || 0;
        const creditN = parseFloat(parts[3]) || 0;
        const debitN1 = parseFloat(parts[4]) || 0;
        const creditN1 = parseFloat(parts[5]) || 0;
        if (compte && intitule) {
          imported.push({ compte, intitule, debitN, creditN, debitN1, creditN1 });
        }
      }
    });
    if (imported.length > 0) {
      dispatch({ type: 'IMPORT_BALANCE', payload: { exerciceId: selectedEx, balance: imported } });
      toast(`✓ ${imported.length} comptes importés avec succès.`, 'success');
      setShowImportModal(false);
      setCsvText('');
    } else {
      toast('Format CSV invalide. Utilisez le format : Compte;Intitulé;DébitN;CréditN;[DébitN-1;CréditN-1]', 'danger');
    }
  };

  // Generate complete package CSV for download
  const handleExportCsv = () => {
    let csv = 'Compte;Intitulé;Débit N;Crédit N;Solde N;Débit N-1;Crédit N-1;Solde N-1\n';
    balance.forEach(r => {
      const soldeN = r.debitN - r.creditN;
      const soldeN1 = r.debitN1 - r.creditN1;
      csv += `${r.compte};${r.intitule};${r.debitN};${r.creditN};${soldeN};${r.debitN1};${r.creditN1};${soldeN1}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `balance_${selectedEx}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Fichier Excel/CSV généré et téléchargé.', 'success');
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Intermediate calculations helper
  const getSumForCategory = (category, nVersion = 'N') => {
    return balance
      .filter(r => mappings[r.compte] === category)
      .reduce((sum, r) => {
        const val = nVersion === 'N' ? (r.debitN - r.creditN) : (r.debitN1 - r.creditN1);
        return sum + val;
      }, 0);
  };

  const getAccountsForCategory = (category) => {
    return balance
      .filter(r => mappings[r.compte] === category)
      .map(r => ({
        compte: r.compte,
        intitule: r.intitule,
        soldeN: r.debitN - r.creditN,
        soldeN1: r.debitN1 - r.creditN1
      }));
  };

  const getSumForGroup = (categories, nVersion = 'N') => {
    return categories.reduce((sum, cat) => sum + getSumForCategory(cat, nVersion), 0);
  };

  // ACTIF calculations
  const actifSections = useMemo(() => {
    return [
      { key: 'immob_nv', label: 'Immobilisations en non-valeur', cats: ['IMMO_NON_VALEUR'] },
      { key: 'immob_inc', label: 'Immobilisations incorporelles', cats: ['IMMO_INCORPORELLE'] },
      { key: 'immob_corp', label: 'Immobilisations corporelles', cats: ['IMMO_CORPORELLE'] },
      { key: 'immob_fin', label: 'Immobilisations financières', cats: ['IMMO_FINANCIERE'] },
      { key: 'stocks', label: 'Stocks de marchandises', cats: ['STOCK_MARCHANDISES'] },
      { key: 'clients', label: 'Clients et comptes rattachés', cats: ['CLIENTS'] },
      { key: 'etat_deb', label: 'État débiteur (TVA récupérable, etc.)', cats: ['ETAT_DEBITEUR'] },
      { key: 'reg_act', label: 'Comptes de régularisation - actif', cats: ['REGULARISATION_ACTIF'] },
      { key: 'tres_act', label: 'Banques & caisses', cats: ['BANQUE_ACTIF', 'CAISSE_ACTIF'] },
    ];
  }, []);

  const totalActifN = useMemo(() => {
    let tot = 0;
    actifSections.forEach(s => {
      tot += getSumForGroup(s.cats, 'N');
    });
    // Subtract amortization balances (which are credited accounts mapped to AMORT_IMMO)
    tot -= Math.abs(getSumForCategory('AMORT_IMMO', 'N'));
    return tot;
  }, [actifSections, balance, mappings]);

  const totalActifN1 = useMemo(() => {
    let tot = 0;
    actifSections.forEach(s => {
      tot += getSumForGroup(s.cats, 'N1');
    });
    tot -= Math.abs(getSumForCategory('AMORT_IMMO', 'N1'));
    return tot;
  }, [actifSections, balance, mappings]);

  // PASSIF calculations
  const passifSections = useMemo(() => {
    return [
      { key: 'capitaux', label: 'Capitaux propres', cats: ['CAPITAUX_PROPRES'] },
      { key: 'dettes_fin', label: 'Dettes de financement', cats: ['DETTES_FINANCEMENT'] },
      { key: 'fournisseurs', label: 'Fournisseurs et comptes rattachés', cats: ['FOURNISSEURS'] },
      { key: 'personnel_cred', label: 'Dettes personnel', cats: ['DETTES_PERSONNEL'] },
      { key: 'social_cred', label: 'Organismes sociaux', cats: ['ORGANISMES_SOCIAUX'] },
      { key: 'etat_cred', label: 'État créditeur', cats: ['ETAT_CREDITEUR'] },
      { key: 'reg_pass', label: 'Comptes de régularisation - passif', cats: ['REGULARISATION_PASSIF'] },
      { key: 'tres_pass', label: 'Trésorerie-Passif (Découverts)', cats: ['BANQUE_PASSIF'] },
    ];
  }, []);

  // Passif values are normally credit-balanced (negative in debit-credit calculation). 
  // We multiply by -1 to display them positive.
  const totalPassifN = useMemo(() => {
    let tot = 0;
    passifSections.forEach(s => {
      tot += Math.abs(getSumForGroup(s.cats, 'N'));
    });
    return tot;
  }, [passifSections, balance, mappings]);

  const totalPassifN1 = useMemo(() => {
    let tot = 0;
    passifSections.forEach(s => {
      tot += Math.abs(getSumForGroup(s.cats, 'N1'));
    });
    return tot;
  }, [passifSections, balance, mappings]);

  const balanceCheck = Math.abs(totalActifN - totalPassifN) < 0.05;
  const balanceCheckDiff = Math.abs(totalActifN - totalPassifN);

  // CPC calculations
  const ventesN = Math.abs(getSumForCategory('VENTES_MARCHANDISES', 'N')) + Math.abs(getSumForCategory('VENTES_BIENS_PRODUITS', 'N'));
  const ventesN1 = Math.abs(getSumForCategory('VENTES_MARCHANDISES', 'N1')) + Math.abs(getSumForCategory('VENTES_BIENS_PRODUITS', 'N1'));
  
  const achatsN = getSumForCategory('ACHATS_MARCHANDISES', 'N') + getSumForCategory('ACHATS_MATIERES', 'N') + getSumForCategory('VARIATION_STOCKS', 'N');
  const achatsN1 = getSumForCategory('ACHATS_MARCHANDISES', 'N1') + getSumForCategory('ACHATS_MATIERES', 'N1') + getSumForCategory('VARIATION_STOCKS', 'N1');

  const chargesExtN = getSumForCategory('CHARGES_EXTERNES', 'N');
  const chargesExtN1 = getSumForCategory('CHARGES_EXTERNES', 'N1');

  const personnelN = getSumForCategory('CHARGES_PERSONNEL', 'N');
  const personnelN1 = getSumForCategory('CHARGES_PERSONNEL', 'N1');

  const dotationsN = getSumForCategory('DOTATIONS_EXPLOITATION', 'N');
  const dotationsN1 = getSumForCategory('DOTATIONS_EXPLOITATION', 'N1');

  const impotsTaxesN = getSumForCategory('IMPOTS_TAXES', 'N');
  const impotsTaxesN1 = getSumForCategory('IMPOTS_TAXES', 'N1');

  const resultExploitN = ventesN - (achatsN + chargesExtN + personnelN + dotationsN + impotsTaxesN);
  const resultExploitN1 = ventesN1 - (achatsN1 + chargesExtN1 + personnelN1 + dotationsN1 + impotsTaxesN1);

  const finProdN = Math.abs(getSumForCategory('PRODUITS_FINANCIERS', 'N'));
  const finProdN1 = Math.abs(getSumForCategory('PRODUITS_FINANCIERS', 'N1'));

  const finChargN = getSumForCategory('CHARGES_FINANCIERES', 'N');
  const finChargN1 = getSumForCategory('CHARGES_FINANCIERES', 'N1');

  const resultFinN = finProdN - finChargN;
  const resultFinN1 = finProdN1 - finChargN1;

  const resultCourantN = resultExploitN + resultFinN;
  const resultCourantN1 = resultExploitN1 + resultFinN1;

  const nonCourantProdN = Math.abs(getSumForCategory('PRODUITS_NON_COURANTS', 'N'));
  const nonCourantProdN1 = Math.abs(getSumForCategory('PRODUITS_NON_COURANTS', 'N1'));

  const nonCourantChargN = getSumForCategory('CHARGES_NON_COURANTS', 'N');
  const nonCourantChargN1 = getSumForCategory('CHARGES_NON_COURANTS', 'N1');

  const resultNonCourantN = nonCourantProdN - nonCourantChargN;
  const resultNonCourantN1 = nonCourantProdN1 - nonCourantChargN1;

  const isN = getSumForCategory('IMPOT_RESULTATS', 'N');
  const isN1 = getSumForCategory('IMPOT_RESULTATS', 'N1');

  const resultNetN = resultCourantN + resultNonCourantN - isN;
  const resultNetN1 = resultCourantN1 + resultNonCourantN1 - isN1;

  // Run automatic audit checks
  const runAudits = useMemo(() => {
    const alerts = [];
    
    // 1. Total debit vs total credit
    const totalDebN = balance.reduce((s, r) => s + r.debitN, 0);
    const totalCredN = balance.reduce((s, r) => s + r.creditN, 0);
    if (Math.abs(totalDebN - totalCredN) > 0.05) {
      alerts.push({ type: 'erreur', text: `Déséquilibre de la Balance : Total débit (${totalDebN.toLocaleString()}) ≠ Total crédit (${totalCredN.toLocaleString()}). Écart : ${(totalDebN - totalCredN).toFixed(2)} DH.` });
    }

    // 2. Total active vs total passive
    if (!balanceCheck) {
      alerts.push({ type: 'erreur', text: `Bilan déséquilibré : Total Actif (${totalActifN.toLocaleString()}) ≠ Total Passif (${totalPassifN.toLocaleString()}). Différence : ${balanceCheckDiff.toLocaleString()} DH.` });
    }

    // 3. Unmapped accounts
    const unmapped = balance.filter(r => !mappings[r.compte]);
    if (unmapped.length > 0) {
      alerts.push({ type: 'attention', text: `${unmapped.length} comptes comptables n'ont aucune catégorie associée dans le Mapping.` });
    }

    // 4. Missing N-1 data
    const missingN1 = balance.filter(r => (r.debitN > 0 || r.creditN > 0) && (r.debitN1 === 0 && r.creditN1 === 0));
    if (missingN1.length > 3) {
      alerts.push({ type: 'attention', text: `Plusieurs comptes mouvementés en N n'ont aucune valeur d'historique renseignée pour N-1.` });
    }

    // 5. Missing critical accounts
    const crit = ['1117', '3111', '5141'];
    crit.forEach(c => {
      if (!balance.some(row => row.compte.startsWith(c))) {
        alerts.push({ type: 'erreur', text: `Compte critique manquant ou inactif dans la balance : classe commençant par ${c}.` });
      }
    });

    return alerts;
  }, [balance, mappings, balanceCheck, totalActifN, totalPassifN, balanceCheckDiff]);

  // Intermediate values for drill down popup
  const showDrill = (title, category) => {
    const list = getAccountsForCategory(category);
    const total = list.reduce((s, r) => s + (r.soldeN), 0);
    setDrillModal({ title, total, accounts: list });
  };

  const showDrillGroup = (title, categories) => {
    let list = [];
    categories.forEach(cat => {
      list = [...list, ...getAccountsForCategory(cat)];
    });
    const total = list.reduce((s, r) => s + (r.soldeN), 0);
    setDrillModal({ title, total, accounts: list });
  };

  // Tab checklist counters
  const validatedClotureCount = checklist.filter(c => c.statut === 'Validé').length;

  return (
    <div className="page">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Calcul des Bilans Annuels</h1>
          <p className="page-subtitle">Préparation des liasses fiscales selon le CGNC marocain</p>
        </div>
        <div className="flex gap-3 items-center">
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Exercice :</label>
          <select className="form-select" style={{ width: 100, padding: '4px 8px' }} value={selectedEx} onChange={e => setSelectedEx(e.target.value)}>
            {state.exercices.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.id}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Eye size={13} /> Aperçu Impression</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}><Download size={13} /> Export CSV</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs no-print">
        {[
          { id: 'dashboard', label: 'Vue d\'ensemble' },
          { id: 'balance', label: 'Balance Générale' },
          { id: 'cloture', label: `Travaux de clôture (${validatedClotureCount}/${checklist.length})` },
          { id: 'bilan', label: 'Bilan' },
          { id: 'cpc', label: 'CPC' },
          { id: 'esg', label: 'ESG' },
          { id: 'financement', label: 'Financement' },
          { id: 'etic', label: 'ETIC' },
          { id: 'controles', label: `Contrôles (${runAudits.filter(a => a.type === 'erreur').length} err)` },
          { id: 'mapping', label: 'Mapping Comptable' },
        ].map(t => (
          <button key={t.id} className={`tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SCREEN 1: VUE D'ENSEMBLE ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="kpi-grid">
            <div className="kpi-card" onClick={() => setActiveTab('balance')}>
              <div className="kpi-card-header"><span className="kpi-label">Lignes de Balance</span></div>
              <div className="kpi-value">{balance.length}</div>
              <div className="kpi-change text-success">Prêtes pour calculs</div>
            </div>
            <div className="kpi-card" onClick={() => setActiveTab('cloture')}>
              <div className="kpi-card-header"><span className="kpi-label">Travaux de clôture</span></div>
              <div className="kpi-value">{validatedClotureCount} / {checklist.length}</div>
              <div className="kpi-change text-warning">Validés à ce jour</div>
            </div>
            <div className="kpi-card" onClick={() => setActiveTab('bilan')}>
              <div className="kpi-card-header"><span className="kpi-label">Équilibre Actif/Passif</span></div>
              <div className="kpi-value" style={{ color: balanceCheck ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {balanceCheck ? 'Équilibré' : 'Déséquilibré'}
              </div>
              <div className="kpi-change">Écart : {fm(balanceCheckDiff)}</div>
            </div>
            <div className="kpi-card" onClick={() => setActiveTab('controles')}>
              <div className="kpi-card-header"><span className="kpi-label">Erreurs d'audit</span></div>
              <div className="kpi-value" style={{ color: runAudits.some(a => a.type === 'erreur') ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {runAudits.filter(a => a.type === 'erreur').length}
              </div>
              <div className="kpi-change">{runAudits.filter(a => a.type === 'attention').length} avertissements</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Avancement de la clôture {selectedEx}</span></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                    <span>Statut actuel de l'exercice :</span>
                    <Badge className={exercise.statut === 'Clôturé' ? 'badge-green' : 'badge-yellow'}>{exercise.statut}</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                    <span>Période comptable :</span>
                    <strong>Du {formatDate(exercise.dateDebut)} au {formatDate(exercise.dateFin)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                    <span>Actif net total :</span>
                    <strong>{fm(totalActifN)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                    <span>Résultat net provisoire :</span>
                    <span style={{ fontWeight: 700, color: resultNetN >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{fm(resultNetN)}</span>
                  </div>
                  <div className="flex gap-2 justify-end mt-2 no-print">
                    <button className="btn btn-secondary btn-sm" disabled={exercise.statut === 'Brouillon'} onClick={() => handleSetStatus('Brouillon')}>Remettre en Brouillon</button>
                    <button className="btn btn-secondary btn-sm" disabled={exercise.statut === 'En préparation'} onClick={() => handleSetStatus('En préparation')}>Lancer la préparation</button>
                    <button className="btn btn-primary btn-sm" disabled={exercise.statut === 'Controllé'} onClick={() => handleSetStatus('Controllé')}>Marquer comme contrôlé</button>
                    <button className="btn btn-success btn-sm" disabled={exercise.statut === 'Clôturé'} onClick={() => handleSetStatus('Clôturé')}>Clôturer définitivement</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">⚠️ Mentions Légales</span></div>
              <div className="card-body">
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Les états de synthèse générés par ce prototype constituent un outil d'aide à la préparation comptable. Ils doivent être impérativement vérifiés par un professionnel compétent (expert-comptable ou comptable agréé) avant toute transmission officielle aux administrations compétentes ou utilisation légale.
                </p>
                <div style={{ marginTop: 12, padding: 8, background: 'var(--color-bg)', borderRadius: 8, fontSize: '0.7rem' }}>
                  Norme : CGNC Maroc 2026<br />
                  Conforme à la loi 9-88.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: BALANCE Comptable ── */}
      {activeTab === 'balance' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Balance de l'exercice {selectedEx}</span>
            <div className="flex gap-2 no-print">
              <button className="btn btn-secondary btn-sm" onClick={handleSyncPlatform}>
                <RefreshCw size={13} /> Synchro plateforme grossiste
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)}>
                <Upload size={13} /> Importer Balance CSV
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Compte</th>
                  <th>Intitulé du compte</th>
                  <th style={{ textAlign: 'right' }}>Débit N</th>
                  <th style={{ textAlign: 'right' }}>Crédit N</th>
                  <th style={{ textAlign: 'right' }}>Solde N</th>
                  <th style={{ textAlign: 'right' }}>Débit N-1</th>
                  <th style={{ textAlign: 'right' }}>Crédit N-1</th>
                  <th style={{ textAlign: 'right' }}>Solde N-1</th>
                  <th className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {balance.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>Aucune ligne comptable. Chargez les données.</td></tr>
                ) : balance.map(row => {
                  const solde = row.debitN - row.creditN;
                  const soldeN1 = row.debitN1 - row.creditN1;
                  const isEditing = editRow?.compte === row.compte;

                  return (
                    <tr key={row.compte}>
                      <td><span className="td-mono">{row.compte}</span></td>
                      <td className="td-primary">{row.intitule}</td>
                      <td style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <input type="number" className="form-input text-right" style={{ width: 80, padding: 4 }} value={editRow.debitN} onChange={e => setEditRow({ ...editRow, debitN: e.target.value })} />
                        ) : row.debitN.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <input type="number" className="form-input text-right" style={{ width: 80, padding: 4 }} value={editRow.creditN} onChange={e => setEditRow({ ...editRow, creditN: e.target.value })} />
                        ) : row.creditN.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{solde.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <input type="number" className="form-input text-right" style={{ width: 80, padding: 4 }} value={editRow.debitN1} onChange={e => setEditRow({ ...editRow, debitN1: e.target.value })} />
                        ) : row.debitN1.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <input type="number" className="form-input text-right" style={{ width: 80, padding: 4 }} value={editRow.creditN1} onChange={e => setEditRow({ ...editRow, creditN1: e.target.value })} />
                        ) : row.creditN1.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{soldeN1.toLocaleString()}</td>
                      <td className="no-print" style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <button className="btn btn-ghost btn-sm text-success" onClick={() => {
                              dispatch({
                                type: 'UPDATE_BALANCE_ACCOUNT',
                                payload: {
                                  exerciceId: selectedEx,
                                  compte: row.compte,
                                  field: 'debitN',
                                  value: editRow.debitN
                                }
                              });
                              dispatch({
                                type: 'UPDATE_BALANCE_ACCOUNT',
                                payload: {
                                  exerciceId: selectedEx,
                                  compte: row.compte,
                                  field: 'creditN',
                                  value: editRow.creditN
                                }
                              });
                              dispatch({
                                type: 'UPDATE_BALANCE_ACCOUNT',
                                payload: {
                                  exerciceId: selectedEx,
                                  compte: row.compte,
                                  field: 'debitN1',
                                  value: editRow.debitN1
                                }
                              });
                              dispatch({
                                type: 'UPDATE_BALANCE_ACCOUNT',
                                payload: {
                                  exerciceId: selectedEx,
                                  compte: row.compte,
                                  field: 'creditN1',
                                  value: editRow.creditN1
                                }
                              });
                              setEditRow(null);
                              toast('Ligne enregistrée.', 'success');
                            }}>Enregistrer</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditRow(null)}>Annuler</button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditRow({ ...row })}>Modifier</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: TRAVAUX DE CLÔTURE ── */}
      {activeTab === 'cloture' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Checklist de régularisation comptable ({selectedEx})</span></div>
          <div className="card-body">
            <p className="page-subtitle" style={{ marginBottom: 16 }}>Renseignez l'état d'avancement des ajustements de fin de période.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {checklist.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={item.statut === 'Validé'} onChange={() => {
                      dispatch({ type: 'TOGGLE_CLOTURE_CHECK', payload: { exerciceId: selectedEx, key: item.key } });
                    }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Statut : {item.statut === 'Validé' ? '🟢 Validé' : '🟡 En attente'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input className="form-input" style={{ width: 300 }} placeholder="Notes / Observations..." value={item.notes} onChange={e => {
                      dispatch({ type: 'TOGGLE_CLOTURE_CHECK', payload: { exerciceId: selectedEx, key: item.key, statut: item.statut, notes: e.target.value } });
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 4: BILAN ACTIF & PASSIF ── */}
      {activeTab === 'bilan' && (
        <div className="space-y-4">
          {/* Actif */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Bilan Actif ({selectedEx} / {parseInt(selectedEx) - 1})</span>
              <Badge className={balanceCheck ? 'badge-green' : 'badge-red'}>
                {balanceCheck ? '🟢 Bilan Équilibré' : `🔴 Bilan Déséquilibré (${fm(balanceCheckDiff)})`}
              </Badge>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Actif</th>
                    <th style={{ textAlign: 'right' }}>Brut</th>
                    <th style={{ textAlign: 'right' }}>Amort. & Prov.</th>
                    <th style={{ textAlign: 'right' }}>Net N</th>
                    <th style={{ textAlign: 'right' }}>Net N-1</th>
                    <th style={{ textAlign: 'right' }}>Variation</th>
                  </tr>
                </thead>
                <tbody>
                  {actifSections.map(s => {
                    const brut = getSumForGroup(s.cats, 'N');
                    // Amortization mapping logic: amort is assigned to AMORT_IMMO
                    const amort = s.key.startsWith('immob') ? Math.abs(getSumForCategory('AMORT_IMMO', 'N')) : 0;
                    const netN = brut - amort;
                    const brutN1 = getSumForGroup(s.cats, 'N1');
                    const amortN1 = s.key.startsWith('immob') ? Math.abs(getSumForCategory('AMORT_IMMO', 'N1')) : 0;
                    const netN1 = brutN1 - amortN1;
                    const diff = netN - netN1;

                    return (
                      <tr key={s.key} className="clickable" onClick={() => showDrillGroup(s.label, s.cats)}>
                        <td style={{ fontWeight: 600 }}>{s.label}</td>
                        <td style={{ textAlign: 'right' }}>{brut.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{amort > 0 ? `(${amort.toLocaleString()})` : '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{netN.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{netN1.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {diff >= 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td>TOTAL ACTIF</td>
                    <td style={{ textAlign: 'right' }}>{(totalActifN + Math.abs(getSumForCategory('AMORT_IMMO', 'N'))).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>({Math.abs(getSumForCategory('AMORT_IMMO', 'N')).toLocaleString()})</td>
                    <td style={{ textAlign: 'right', fontSize: 'var(--font-size-base)' }}>{totalActifN.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontSize: 'var(--font-size-base)' }}>{totalActifN1.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{(totalActifN - totalActifN1).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Passif */}
          <div className="card">
            <div className="card-header"><span className="card-title">Bilan Passif</span></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Passif</th>
                    <th style={{ textAlign: 'right' }}>N</th>
                    <th style={{ textAlign: 'right' }}>N-1</th>
                    <th style={{ textAlign: 'right' }}>Variation</th>
                  </tr>
                </thead>
                <tbody>
                  {passifSections.map(s => {
                    const solde = Math.abs(getSumForGroup(s.cats, 'N'));
                    const soldeN1 = Math.abs(getSumForGroup(s.cats, 'N1'));
                    const diff = solde - soldeN1;

                    return (
                      <tr key={s.key} className="clickable" onClick={() => showDrillGroup(s.label, s.cats)}>
                        <td style={{ fontWeight: 600 }}>{s.label}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{solde.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{soldeN1.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {diff >= 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td>TOTAL PASSIF</td>
                    <td style={{ textAlign: 'right', fontSize: 'var(--font-size-base)' }}>{totalPassifN.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontSize: 'var(--font-size-base)' }}>{totalPassifN1.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{(totalPassifN - totalPassifN1).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 5: CPC ── */}
      {activeTab === 'cpc' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Compte de Produits et Charges (CPC)</span></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rubrique CPC</th>
                  <th style={{ textAlign: 'right' }}>Exercice N</th>
                  <th style={{ textAlign: 'right' }}>Exercice N-1</th>
                  <th style={{ textAlign: 'right' }}>Variation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="clickable" onClick={() => showDrill('Ventes de marchandises', 'VENTES_MARCHANDISES')}>
                  <td style={{ fontWeight: 600 }}>Ventes de marchandises (A)</td>
                  <td style={{ textAlign: 'right' }}>{ventesN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{ventesN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(ventesN - ventesN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Achats de marchandises', 'ACHATS_MARCHANDISES')}>
                  <td style={{ fontWeight: 600 }}>Achats de marchandises revendus (B)</td>
                  <td style={{ textAlign: 'right' }}>{achatsN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{achatsN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(achatsN - achatsN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Charges externes', 'CHARGES_EXTERNES')}>
                  <td style={{ fontWeight: 600 }}>Charges externes (Locations, transport, honoraires, etc.)</td>
                  <td style={{ textAlign: 'right' }}>{chargesExtN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{chargesExtN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(chargesExtN - chargesExtN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Charges de personnel', 'CHARGES_PERSONNEL')}>
                  <td style={{ fontWeight: 600 }}>Charges de personnel (Rémunérations + CNSS)</td>
                  <td style={{ textAlign: 'right' }}>{personnelN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{personnelN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(personnelN - personnelN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Impôts et taxes', 'IMPOTS_TAXES')}>
                  <td style={{ fontWeight: 600 }}>Impôts et taxes directs</td>
                  <td style={{ textAlign: 'right' }}>{impotsTaxesN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{impotsTaxesN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(impotsTaxesN - impotsTaxesN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Dotations d\'exploitation', 'DOTATIONS_EXPLOITATION')}>
                  <td style={{ fontWeight: 600 }}>Dotations d'exploitation aux amortissements</td>
                  <td style={{ textAlign: 'right' }}>{dotationsN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{dotationsN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(dotationsN - dotationsN1).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>I. RÉSULTAT D'EXPLOITATION</td>
                  <td style={{ textAlign: 'right', color: resultExploitN >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{resultExploitN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{resultExploitN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(resultExploitN - resultExploitN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Produits financiers', 'PRODUITS_FINANCIERS')}>
                  <td>Produits financiers</td>
                  <td style={{ textAlign: 'right' }}>{finProdN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{finProdN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(finProdN - finProdN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Charges financières', 'CHARGES_FINANCIERES')}>
                  <td>Charges financières</td>
                  <td style={{ textAlign: 'right' }}>{finChargN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{finChargN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(finChargN - finChargN1).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>II. RÉSULTAT FINANCIER</td>
                  <td style={{ textAlign: 'right' }}>{resultFinN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{resultFinN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(resultFinN - resultFinN1).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                  <td>III. RÉSULTAT COURANT (I + II)</td>
                  <td style={{ textAlign: 'right' }}>{resultCourantN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{resultCourantN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(resultCourantN - resultCourantN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Produits non courants', 'PRODUITS_NON_COURANTS')}>
                  <td>Produits non courants</td>
                  <td style={{ textAlign: 'right' }}>{nonCourantProdN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{nonCourantProdN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(nonCourantProdN - nonCourantProdN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Charges non courants', 'CHARGES_NON_COURANTS')}>
                  <td>Charges non courantes</td>
                  <td style={{ textAlign: 'right' }}>{nonCourantChargN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{nonCourantChargN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(nonCourantChargN - nonCourantChargN1).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>IV. RÉSULTAT NON COURANT</td>
                  <td style={{ textAlign: 'right' }}>{resultNonCourantN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{resultNonCourantN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(resultNonCourantN - resultNonCourantN1).toLocaleString()}</td>
                </tr>
                <tr className="clickable" onClick={() => showDrill('Impôt sur les bénéfices (IS)', 'IMPOT_RESULTATS')}>
                  <td style={{ fontWeight: 600 }}>V. IMPÔTS SUR LES RÉSULTATS (IS)</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{isN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{isN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(isN - isN1).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#e2e8f0', fontWeight: 900, fontSize: 'var(--font-size-base)' }}>
                  <td>VI. RÉSULTAT NET DE L'EXERCICE</td>
                  <td style={{ textAlign: 'right', color: resultNetN >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{resultNetN.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{resultNetN1.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(resultNetN - resultNetN1).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SCREEN 6: ESG ── */}
      {activeTab === 'esg' && (
        <div className="card">
          <div className="card-header"><span className="card-title">État des Soldes de Gestion (ESG)</span></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Indicateurs ESG</th>
                  <th>Formule comptable</th>
                  <th style={{ textAlign: 'right' }}>Valeur N</th>
                  <th>Source réglementaire</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>1. Marge brute sur ventes en l'état</td>
                  <td>Ventes de marchandises - Achats revendus de march.</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{(ventesN - achatsN).toLocaleString()} DH</td>
                  <td><Badge className="badge-blue">CGNC Annexes TFR</Badge></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>2. Consommation de l'exercice</td>
                  <td>Achats consommés + Autres charges externes</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{chargesExtN.toLocaleString()} DH</td>
                  <td><Badge className="badge-blue">CGNC Annexes TFR</Badge></td>
                </tr>
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ fontWeight: 700 }}>3. Valeur Ajoutée (VA)</td>
                  <td>Marge brute - Consommation de l'exercice</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{(ventesN - achatsN - chargesExtN).toLocaleString()} DH</td>
                  <td><Badge className="badge-blue">CGNC Annexes TFR</Badge></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>4. Excédent Brut d'Exploitation (EBE)</td>
                  <td>Valeur Ajoutée - Charges de personnel - Impôts/taxes</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{(ventesN - achatsN - chargesExtN - personnelN - impotsTaxesN).toLocaleString()} DH</td>
                  <td><Badge className="badge-blue">CGNC Annexes TFR</Badge></td>
                </tr>
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ fontWeight: 700 }}>5. Résultat d'Exploitation</td>
                  <td>EBE - Dotations d'exploitation</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{resultExploitN.toLocaleString()} DH</td>
                  <td><Badge className="badge-blue">CGNC Annexes TFR</Badge></td>
                </tr>
                <tr style={{ background: '#f1f5f9' }}>
                  <td style={{ fontWeight: 700 }}>6. Capacité d'Autofinancement (CAF)</td>
                  <td>Résultat net + Dotations - Reprises (excl. circulant)</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{(resultNetN + dotationsN).toLocaleString()} DH</td>
                  <td><Badge className="badge-blue">CGNC Annexes CAF</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SCREEN 7: TABLEAU DE FINANCEMENT ── */}
      {activeTab === 'financement' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Tableau de Financement (Ressources & Emplois stables)</span></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Emplois Stables (Besoins)</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                  <th>Ressources Stables (Origines)</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Acquisitions d'immobilisations</td>
                  <td style={{ textAlign: 'right' }}>{(getSumForCategory('IMMO_CORPORELLE', 'N') - getSumForCategory('IMMO_CORPORELLE', 'N1') > 0 ? getSumForCategory('IMMO_CORPORELLE', 'N') - getSumForCategory('IMMO_CORPORELLE', 'N1') : 0).toLocaleString()} DH</td>
                  <td>Capacité d'Autofinancement (CAF)</td>
                  <td style={{ textAlign: 'right' }}>{(resultNetN + dotationsN).toLocaleString()} DH</td>
                </tr>
                <tr>
                  <td>Remboursement des dettes de financement</td>
                  <td style={{ textAlign: 'right' }}>{(getSumForCategory('DETTES_FINANCEMENT', 'N1') - getSumForCategory('DETTES_FINANCEMENT', 'N') > 0 ? getSumForCategory('DETTES_FINANCEMENT', 'N1') - getSumForCategory('DETTES_FINANCEMENT', 'N') : 0).toLocaleString()} DH</td>
                  <td>Cession d'immobilisations</td>
                  <td style={{ textAlign: 'right' }}>0 DH</td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>TOTAL EMPLOIS STABLES</td>
                  <td style={{ textAlign: 'right' }}>{(getSumForCategory('DETTES_FINANCEMENT', 'N1') - getSumForCategory('DETTES_FINANCEMENT', 'N') > 0 ? getSumForCategory('DETTES_FINANCEMENT', 'N1') - getSumForCategory('DETTES_FINANCEMENT', 'N') : 0).toLocaleString()} DH</td>
                  <td>TOTAL RESSOURCES STABLES</td>
                  <td style={{ textAlign: 'right' }}>{(resultNetN + dotationsN).toLocaleString()} DH</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SCREEN 8: ETIC ── */}
      {activeTab === 'etic' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header"><span className="card-title">État des Informations Complémentaires (ETIC)</span></div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Tableau A1 : Introduction (Méthodes d'évaluation) <Badge className="badge-blue">Manuel</Badge></label>
                <textarea className="form-textarea" rows={3} value={etic.introduction} onChange={e => {
                  dispatch({ type: 'UPDATE_ETIC', payload: { exerciceId: selectedEx, data: { introduction: e.target.value } } });
                }} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Tableau A2 : Faits marquants de l'exercice <Badge className="badge-blue">Manuel</Badge></label>
                <textarea className="form-textarea" rows={3} value={etic.faitsMarquants} onChange={e => {
                  dispatch({ type: 'UPDATE_ETIC', payload: { exerciceId: selectedEx, data: { faitsMarquants: e.target.value } } });
                }} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Tableau B1 : Détail des créances clients <Badge className="badge-green">Automatique</Badge></span></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Compte</th>
                    <th>Nom du client</th>
                    <th style={{ textAlign: 'right' }}>Encours brut</th>
                    <th>Conditions de paiement</th>
                    <th>Ville</th>
                  </tr>
                </thead>
                <tbody>
                  {state.clients.map(c => {
                    const balance = state.commandes
                      .filter(cmd => cmd.clientId === c.id && cmd.statut !== 'Annulée')
                      .reduce((s, cmd) => s + (cmd.totalTTC - (cmd.montantPaye || 0)), 0);

                    return (
                      <tr key={c.id}>
                        <td>342110</td>
                        <td className="td-primary">{c.nom}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{balance.toLocaleString()} DH</td>
                        <td className="td-secondary">{c.conditionsPaiement}</td>
                        <td>{c.ville}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 9: AUDITS ET CONTROLES ── */}
      {activeTab === 'controles' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Rapport de conformité comptable (Lancer les contrôles)</span></div>
          <div className="card-body">
            {runAudits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <CheckCircle size={40} color="var(--color-success)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontWeight: 700 }}>Félicitations, aucun problème détecté !</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Votre balance est équilibrée, le mapping est complet et le bilan actif/passif est cohérent.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {runAudits.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'start', padding: 12, borderRadius: 8, background: a.type === 'erreur' ? 'var(--color-danger-light)' : 'var(--color-warning-light)', border: `1px solid ${a.type === 'erreur' ? 'var(--color-danger-border)' : 'var(--color-warning-border)'}` }}>
                    <AlertTriangle size={18} color={a.type === 'erreur' ? 'var(--color-danger)' : 'var(--color-warning)'} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', color: a.type === 'erreur' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                        {a.type}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 2, fontWeight: 500 }}>
                        {a.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SCREEN 10: MAPPING COMPTABLE ── */}
      {activeTab === 'mapping' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Configuration du Plan de Comptes (CGNC)</span></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Compte</th>
                  <th>Intitulé</th>
                  <th>Rubrique de destination</th>
                  <th>Aperçu Rubrique</th>
                </tr>
              </thead>
              <tbody>
                {balance.map(row => (
                  <tr key={row.compte}>
                    <td><span className="td-mono">{row.compte}</span></td>
                    <td className="td-primary">{row.intitule}</td>
                    <td>
                      <select className="form-select" style={{ padding: '4px 8px' }} value={mappings[row.compte] || ''} onChange={e => {
                        dispatch({ type: 'UPDATE_MAPPING', payload: { [row.compte]: e.target.value } });
                      }}>
                        <option value="">-- Mappage requis --</option>
                        <option value="CAPITAUX_PROPRES">Capitaux Propres (Passif)</option>
                        <option value="DETTES_FINANCEMENT">Dettes de Financement (Passif)</option>
                        <option value="IMMO_NON_VALEUR">Immo. Non-valeur (Actif)</option>
                        <option value="IMMO_INCORPORELLE">Immo. Incorporelle (Actif)</option>
                        <option value="IMMO_CORPORELLE">Immo. Corporelle (Actif)</option>
                        <option value="IMMO_FINANCIERE">Immo. Financière (Actif)</option>
                        <option value="AMORT_IMMO">Amortissements Actif (Déduction)</option>
                        <option value="STOCK_MARCHANDISES">Stocks de Marchandises (Actif)</option>
                        <option value="CLIENTS">Clients & Rattachés (Actif)</option>
                        <option value="ETAT_DEBITEUR">État Débiteur (Actif)</option>
                        <option value="REGULARISATION_ACTIF">Régularisation Actif</option>
                        <option value="FOURNISSEURS">Fournisseurs & Rattachés (Passif)</option>
                        <option value="DETTES_PERSONNEL">Rémunérations Personnel (Passif)</option>
                        <option value="ORGANISMES_SOCIAUX">CNSS & Retraite (Passif)</option>
                        <option value="ETAT_CREDITEUR">État Créditeur (Passif)</option>
                        <option value="REGULARISATION_PASSIF">Régularisation Passif</option>
                        <option value="BANQUE_ACTIF">Banques Actif</option>
                        <option value="CAISSE_ACTIF">Caisse Actif</option>
                        <option value="BANQUE_PASSIF">Banque Passif (Découvert)</option>
                        <option value="ACHATS_MARCHANDISES">Achats de Marchandises (CPC)</option>
                        <option value="VARIATION_STOCKS">Variation de Stocks (CPC)</option>
                        <option value="ACHATS_MATIERES">Achats de Matières premières (CPC)</option>
                        <option value="CHARGES_EXTERNES">Charges Externes (CPC)</option>
                        <option value="IMPOTS_TAXES">Impôts et Taxes directs (CPC)</option>
                        <option value="CHARGES_PERSONNEL">Charges de Personnel (CPC)</option>
                        <option value="DOTATIONS_EXPLOITATION">Dotations d'exploitation aux amort. (CPC)</option>
                        <option value="CHARGES_FINANCIERES">Charges Financières (CPC)</option>
                        <option value="CHARGES_NON_COURANTES">Charges Non Courantes (CPC)</option>
                        <option value="IMPOT_RESULTATS">Impôts sur les bénéfices (CPC)</option>
                        <option value="VENTES_MARCHANDISES">Ventes de marchandises (CPC)</option>
                        <option value="VENTES_BIENS_PRODUITS">Ventes de biens produits (CPC)</option>
                        <option value="PRODUITS_EXPLOITATION_AUTRES">Autres produits d'expl. (CPC)</option>
                        <option value="PRODUITS_FINANCIERS">Produits Financiers (CPC)</option>
                        <option value="PRODUITS_NON_COURANTS">Produits Non Courants (CPC)</option>
                      </select>
                    </td>
                    <td>
                      {mappings[row.compte] ? (
                        <Badge className="badge-blue">{mappings[row.compte]}</Badge>
                      ) : (
                        <Badge className="badge-red">Non mappé ⚠️</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL IMPORT CSV ── */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Coller la balance comptable" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Collez vos lignes de balance ci-dessous. Format : <strong>Compte;Intitulé;DébitN;CréditN;[DébitN-1;CréditN-1]</strong> (un compte par ligne, colonnes séparées par des points-virgules).
          </p>
          <textarea className="form-textarea" rows={8} style={{ fontFamily: 'monospace', fontSize: 13 }} placeholder="1117;Capital social;0;500000;0;500000&#10;2340;Matériel de transport;180000;0;180000;0" value={csvText} onChange={e => setCsvText(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleImportCsv}>Lancer l'importation</button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL DRILL DOWN DETAILS ── */}
      <Modal isOpen={!!drillModal} onClose={() => setDrillModal(null)} title={drillModal?.title || "Détail du solde"} size="md">
        {drillModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: 6 }}>
              <strong>Comptes contributeurs</strong>
              <strong style={{ fontSize: 'var(--font-size-base)' }}>Total: {fm(drillModal.total)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {drillModal.accounts.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textAlign: 'center' }}>Aucun compte associé à cette rubrique.</p>
              ) : drillModal.accounts.map(a => (
                <div key={a.compte} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--color-bg)', borderRadius: 6, fontSize: 'var(--font-size-sm)' }}>
                  <span><strong className="td-mono">{a.compte}</strong> — {a.intitule}</span>
                  <span style={{ fontWeight: 600 }}>{fm(a.soldeN)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn btn-secondary" onClick={() => setDrillModal(null)}>Fermer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
