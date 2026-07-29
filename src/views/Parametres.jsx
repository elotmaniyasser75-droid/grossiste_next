
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ui/index.jsx';

export default function Parametres() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [entreprise, setEntreprise] = useState({ ...state.parametres.entreprise });
  const [saved, setSaved] = useState(false);

  const set = f => e => setEntreprise(v => ({ ...v, [f]: e.target.value }));

  const handleSave = (ev) => {
    ev.preventDefault();
    dispatch({ type: 'UPDATE_PARAMETRES', payload: { entreprise } });
    toast('Paramètres enregistrés.', 'success');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_TO_DEMO' });
    toast('Données de démonstration restaurées.', 'info');
    setConfirmReset(false);
    setEntreprise({ ...state.parametres.entreprise });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Configurez votre entreprise et les préférences de l'application</p>
        </div>
      </div>

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Company settings */}
        <div className="card">
          <div className="card-header"><span className="card-title">🏢 Informations de l'entreprise</span></div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-grid form-grid-2">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nom de l'entreprise</label>
                  <input className="form-input" value={entreprise.nom} onChange={set('nom')} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Adresse</label>
                  <input className="form-input" value={entreprise.adresse} onChange={set('adresse')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" value={entreprise.telephone} onChange={set('telephone')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={entreprise.email} onChange={set('email')} />
                </div>
                <div className="form-group">
                  <label className="form-label">ICE</label>
                  <input className="form-input" value={entreprise.ice} onChange={set('ice')} placeholder="Identifiant commun entreprise" />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="submit" className="btn btn-primary">
                  {saved ? '✓ Enregistré' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="card-header"><span className="card-title">⚙️ Préférences</span></div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Devise</label>
                <select className="form-select" value="DH" disabled>
                  <option value="DH">DH (Dirham marocain)</option>
                </select>
                <div className="form-hint">La devise est fixée en DH pour ce prototype.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Langue</label>
                <select className="form-select" value="fr" disabled>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">TVA par défaut</label>
                <select className="form-select" disabled>
                  <option value="20">20%</option>
                </select>
                <div className="form-hint">TVA standard Maroc 20%.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="card">
          <div className="card-header"><span className="card-title">🗄️ Données de l'application</span></div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Clients', value: state.clients.length },
                  { label: 'Produits', value: state.produits.length },
                  { label: 'Commandes', value: state.commandes.length },
                  { label: 'Livraisons', value: state.livraisons.length },
                  { label: 'Paiements', value: state.paiements.length },
                  { label: 'Mouvements', value: state.mouvementsStock.length },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                ℹ️ Les données sont sauvegardées automatiquement dans le <strong>localStorage</strong> de votre navigateur. Elles persistent entre les sessions.
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Réinitialisation</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Restaure toutes les données de démonstration originales. Toutes vos modifications seront perdues.
              </p>
              <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
                🔄 Réinitialiser les données de démonstration
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-header"><span className="card-title">ℹ️ À propos</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <div><strong>Atlas Distribution</strong> — Système de gestion pour grossiste</div>
              <div>Version: 1.0.0 — Prototype local</div>
              <div>Technologies: React 18 + Vite + localStorage</div>
              <div style={{ marginTop: 8, fontSize: 'var(--font-size-xs)' }}>
                Ce prototype est conçu pour être démontré à des clients potentiels. Il fonctionne entièrement hors ligne.
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Réinitialiser les données ?"
        message="Toutes vos modifications seront effacées et les données de démonstration originales seront restaurées. Cette action est irréversible."
        confirmLabel="Réinitialiser"
        variant="danger"
      />
    </div>
  );
}
