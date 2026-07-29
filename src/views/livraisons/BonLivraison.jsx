
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/helpers';

export default function BonLivraison() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const printRef = useRef(null);

  const livraison = state.livraisons.find(l => l.id === id);
  const commande = livraison ? state.commandes.find(c => c.id === livraison.commandeId) : null;
  const client = livraison ? state.clients.find(c => c.id === livraison.clientId) : null;
  const entreprise = state.parametres.entreprise;

  if (!livraison || !commande) return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Retour</button>
      <p style={{ marginTop: 24 }}>Bon de livraison introuvable.</p>
    </div>
  );

  const handlePrint = () => window.print();

  return (
    <div>
      <div className="page-header no-print">
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">Bon de Livraison</h1>
            <p className="page-subtitle">{livraison.numero}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} /> Imprimer / PDF
        </button>
      </div>

      {/* Document */}
      <div ref={printRef} className="bl-document card" style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Header */}
        <div className="bl-header">
          <div>
            <div className="bl-company-name">{entreprise.nom}</div>
            <div className="bl-company-detail">
              {entreprise.adresse}<br />
              {entreprise.telephone}<br />
              {entreprise.email}<br />
              {entreprise.ice && `ICE: ${entreprise.ice}`}
            </div>
          </div>
          <div className="bl-doc-title">
            <div className="bl-doc-type">BON DE LIVRAISON</div>
            <div className="bl-doc-number">{livraison.numero}</div>
            <div className="bl-doc-date">Date: {formatDate(livraison.dateLivraison || livraison.createdAt)}</div>
            <div className="bl-doc-date" style={{ marginTop: 4, fontSize: 11 }}>
              Commande: {commande.numero}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="bl-parties">
          <div>
            <div className="bl-party-label">Expéditeur</div>
            <div className="bl-party-name">{entreprise.nom}</div>
            <div className="bl-party-detail">{entreprise.adresse}<br />{entreprise.telephone}</div>
          </div>
          <div>
            <div className="bl-party-label">Destinataire</div>
            <div className="bl-party-name">{client?.nom}</div>
            <div className="bl-party-detail">
              {client?.contact && `${client.contact}\n`}
              {client?.adresse && `${client.adresse}\n`}
              {client?.ville && `${client.ville}\n`}
              {client?.telephone}
            </div>
          </div>
        </div>

        {/* Driver info */}
        {(livraison.chauffeur || livraison.vehicule) && (
          <div style={{
            background: '#f8fafc', borderRadius: 8, padding: '12px 16px',
            marginBottom: 24, display: 'flex', gap: 32, fontSize: 13
          }}>
            {livraison.chauffeur && (
              <div>
                <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chauffeur</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{livraison.chauffeur}</div>
              </div>
            )}
            {livraison.vehicule && (
              <div>
                <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Véhicule</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{livraison.vehicule}</div>
              </div>
            )}
            <div>
              <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date livraison</span>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{formatDate(livraison.dateLivraison)}</div>
            </div>
          </div>
        )}

        {/* Products table */}
        <table className="bl-items-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Référence</th>
              <th style={{ width: '50%' }}>Désignation</th>
              <th style={{ width: '18%', textAlign: 'center' }}>Quantité</th>
              <th style={{ width: '20%', textAlign: 'center' }}>Unité</th>
            </tr>
          </thead>
          <tbody>
            {(commande.lignes || []).map((l, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.reference || '—'}</td>
                <td style={{ fontWeight: 500 }}>{l.nom}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{l.quantite}</td>
                <td style={{ textAlign: 'center', color: '#64748b' }}>
                  {state.produits.find(p => p.id === l.produitId)?.unite || 'Unité'}
                </td>
              </tr>
            ))}
            {/* Empty rows for handwriting */}
            {Array.from({ length: Math.max(0, 3 - (commande.lignes || []).length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ height: 32 }}></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes */}
        {livraison.notes && (
          <div style={{ margin: '20px 0', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13 }}>
            <strong>Notes:</strong> {livraison.notes}
          </div>
        )}

        {/* Signatures */}
        <div className="bl-signatures">
          <div>
            <div className="bl-sig-label">Préparé par</div>
            <div className="bl-sig-line">Nom: ___________________</div>
            <div className="bl-sig-line" style={{ marginTop: 8 }}>Signature:</div>
          </div>
          <div>
            <div className="bl-sig-label">Reçu par le client</div>
            <div className="bl-sig-line">Nom: ___________________</div>
            <div className="bl-sig-line" style={{ marginTop: 8 }}>Signature:</div>
          </div>
          <div>
            <div className="bl-sig-label">Cachet de l'entreprise</div>
            <div style={{ height: 70, border: '1px dashed #cbd5e1', borderRadius: 8, marginTop: 8 }}></div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 30, paddingTop: 16, borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
          {entreprise.nom} — {entreprise.adresse} — {entreprise.telephone}
          {entreprise.ice && ` — ICE: ${entreprise.ice}`}
        </div>
      </div>
    </div>
  );
}
