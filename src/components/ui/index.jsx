
import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

// ── Modal ────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, size = 'md', children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm Modal ────────────────────────────────────────────
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', variant = 'danger' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-body" style={{ padding: '32px 24px 24px' }}>
          <div className={`confirm-icon ${variant}`}>
            {variant === 'danger' ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </div>
          <h2 className="confirm-title">{title}</h2>
          <p className="confirm-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className={`btn btn-${variant}`} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────
export function Badge({ children, className = 'badge-gray' }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

// ── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <div className="empty-state-icon"><Icon size={24} /></div>}
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────
export function KpiCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <div className="kpi-icon" style={{ background: iconBg }}>
            <Icon size={18} color={iconColor} />
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-change">{sub}</div>}
    </div>
  );
}

// ── Form components ──────────────────────────────────────────
export function FormGroup({ label, required, error, hint, children }) {
  return (
    <div className="form-group">
      {label && <label className={`form-label${required ? ' required' : ''}`}>{label}</label>}
      {children}
      {hint && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
