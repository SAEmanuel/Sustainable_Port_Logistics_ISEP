import React from 'react';
import { useTranslation } from 'react-i18next';
import type { VesselVisitExecutionDTO } from '../dto/vesselVisitExecutionDTO';
import { FaExternalLinkAlt } from 'react-icons/fa';
import '../style/vesselVisitExecutionDetails.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vve: VesselVisitExecutionDTO | null;
    onViewVvn: (vvnId: string) => void;
}

const VesselVisitExecutionDetailsModal: React.FC<Props> = ({ isOpen, onClose, vve, onViewVvn }) => {
    const { t } = useTranslation();

    if (!isOpen || !vve) return null;

    const formatDate = (date: Date | string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString([], {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="vve-details-overlay">
            <div className="vve-details-content">
                <div className="vve-details-header">
                    <h2>{t('vve.details.title') || 'Vessel Visit Execution Details'}</h2>
                    <button className="vve-close-x" onClick={onClose}>&times;</button>
                </div>

                <div className="vve-grid">
                    {/* ... (campos code, imo, arrival, status mantidos) ... */}
                    <div className="vve-item">
                        <label>{t('vve.form.code') || 'Visit Code'}</label>
                        <span className="vve-value-code">{vve.code}</span>
                    </div>

                    <div className="vve-item">
                        <label>{t('vve.form.vesselImo') || 'Vessel IMO'}</label>
                        <span>{vve.vesselImo}</span>
                    </div>

                    <div className="vve-item">
                        <label>{t('vve.form.actualArrivalTime') || 'Actual Arrival'}</label>
                        <span className="vve-date-highlight">{formatDate(vve.actualArrivalTime)}</span>
                    </div>

                    <div className="vve-item">
                        <label>{t('vve.form.status') || 'Status'}</label>
                        <span className={`vve-status-pill ${vve.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {vve.status}
                        </span>
                    </div>

                    <div className="vve-item full-width">
                        <label>{t('vve.form.creatorEmail') || 'Created By'}</label>
                        <p className="vve-email-box">{vve.creatorEmail}</p>
                    </div>

                    <div className="vve-item full-width">
                        <label>Vessel Visit Notification (VVN)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                            <button
                                onClick={() => onViewVvn(vve.vvnId)}
                                className="vve-close-button"
                                style={{ padding: '8px 15px', fontSize: '0.8rem', background: '#4361ee' }}
                            >
                                <FaExternalLinkAlt /> {t('vvn.viewDetails') || 'Ver Detalhes da VVN'}
                            </button>
                            <small style={{color: '#888', fontSize: '0.7rem'}}>{vve.vvnId}</small>
                        </div>
                    </div>
                </div>

                <div className="vve-footer">
                    <button onClick={onClose} className="vve-close-button">
                        {t('actions.close') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VesselVisitExecutionDetailsModal;