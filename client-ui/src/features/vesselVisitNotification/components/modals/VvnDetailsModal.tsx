import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VesselVisitNotificationDto } from '../../dto/vvnTypesDtos';
import '../../style/vvnDetails.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vvn: VesselVisitNotificationDto | null;
}

const VvnDetailsModal: React.FC<Props> = ({ isOpen, onClose, vvn }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'info' | 'cargo' | 'crew' | 'tasks'>('info');

    if (!isOpen || !vvn) return null;

    const formatDate = (date: string | null | undefined) => {
        if (!date) return '---';
        return new Date(date).toLocaleString([], {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="vvn-details-overlay">
            <div className="vvn-details-content">
                {/* Header Fixo */}
                <div className="vvn-details-header">
                    <div className="vvn-title-group">
                        <h2>{t('vvn.details.title') || 'VVN Details'} - {vvn.code}</h2>
                    </div>
                    <button className="vvn-close-x" onClick={onClose}>&times;</button>
                </div>


                <div className="vvn-tabs">
                    {['info', 'cargo', 'crew', 'tasks'].map((tab) => (
                        <button
                            key={tab}
                            className={activeTab === tab ? 'active' : ''}
                            onClick={() => setActiveTab(tab as any)}
                        >
                            {t(`vvn.tabs.${tab}`) || tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="vvn-details-body">
                    {activeTab === 'info' && (
                        <div className="vvn-grid-info">
                            <div className="vvn-field">
                                <label>Vessel IMO</label>
                                <span>{vvn.vesselImo}</span>
                            </div>
                            <div className="vvn-field">
                                <label>Status</label>
                                <span className={`vvn-status-pill ${vvn.status?.toLowerCase()}`}>{vvn.status}</span>
                            </div>
                            <div className="vvn-field">
                                <label>ETA</label>
                                <span>{formatDate(vvn.estimatedTimeArrival)}</span>
                            </div>
                            <div className="vvn-field">
                                <label>ETD</label>
                                <span>{formatDate(vvn.estimatedTimeDeparture)}</span>
                            </div>
                            <div className="vvn-field full">
                                <label>Volume</label>
                                <span>{vvn.volume} m³</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cargo' && (
                        <div className="vvn-grid-info">
                            <div className="vvn-field full">
                                <label>Cargo Manifests</label>
                                <div className="manifest-box">
                                    <p><strong>Loading:</strong> {vvn.loadingCargoManifest?.entries.length || 0} items</p>
                                    <p><strong>Unloading:</strong> {vvn.unloadingCargoManifest?.entries.length || 0} items</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'crew' && (
                        <div className="vvn-grid-info">
                            <div className="vvn-field">
                                <label>Captain</label>
                                <span>{vvn.crewManifest?.captainName || 'N/A'}</span>
                            </div>
                            <div className="vvn-field">
                                <label>Total Crew</label>
                                <span>{vvn.crewManifest?.totalCrew || 0}</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="vvn-tasks-section">
                            <label className="section-label">{t('vvn.tasks.title') || 'Associated Tasks'}</label>
                            <div className="vvn-tasks-list">
                                {vvn.tasks && vvn.tasks.length > 0 ? (
                                    vvn.tasks.map((task) => (
                                        <div key={task.id} className="vvn-task-card">
                                            <div className="task-header">
                                                <span className="task-title">{task.title}</span>
                                                <span className={`task-status-badge ${task.status?.toLowerCase()}`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            {task.description && <p className="task-desc">{task.description}</p>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-tasks">{t('vvn.tasks.empty') || 'No tasks associated.'}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="vvn-details-footer">
                    <button onClick={onClose} className="vvn-btn-primary">
                        {t('actions.close') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VvnDetailsModal;