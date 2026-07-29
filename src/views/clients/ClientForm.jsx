
import React, { useState } from 'react';

const CONDITIONS = ['Comptant', '7 jours', '15 jours', '30 jours'];
const VILLES = ['Rabat', 'Casablanca', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Essaouira', 'Oujda', 'Autre'];

export default function ClientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: initial?.nom || '',
    contact: initial?.contact || '',
    telephone: initial?.telephone || '',
    email: initial?.email || '',
    adresse: initial?.adresse || '',
    ville: initial?.ville || '',
    ice: initial?.ice || '',
    conditionsPaiement: initial?.conditionsPaiement || '30 jours',
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = 'Le nom est obligatoire.';
    if (!form.telephone.trim()) e.telephone = 'Le téléphone est obligatoire.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label required">Nom / Entreprise</label>
          <input className={`form-input${errors.nom ? ' error' : ''}`} value={form.nom} onChange={set('nom')} placeholder="Ex: Café Atlas" />
          {errors.nom && <div className="form-error">{errors.nom}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Contact</label>
          <input className="form-input" value={form.contact} onChange={set('contact')} placeholder="Nom du responsable" />
        </div>
        <div className="form-group">
          <label className="form-label required">Téléphone</label>
          <input className={`form-input${errors.telephone ? ' error' : ''}`} value={form.telephone} onChange={set('telephone')} placeholder="0661 XX XX XX" />
          {errors.telephone && <div className="form-error">{errors.telephone}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="email@exemple.ma" />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Adresse</label>
          <input className="form-input" value={form.adresse} onChange={set('adresse')} placeholder="Rue, quartier..." />
        </div>
        <div className="form-group">
          <label className="form-label">Ville</label>
          <select className="form-select" value={form.ville} onChange={set('ville')}>
            <option value="">Sélectionner une ville</option>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">ICE</label>
          <input className="form-input" value={form.ice} onChange={set('ice')} placeholder="Identifiant commun entreprise" />
        </div>
        <div className="form-group">
          <label className="form-label">Conditions de paiement</label>
          <select className="form-select" value={form.conditionsPaiement} onChange={set('conditionsPaiement')}>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} placeholder="Notes internes..." rows={2} />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-5">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary">
          {initial ? 'Enregistrer' : 'Ajouter le client'}
        </button>
      </div>
    </form>
  );
}
