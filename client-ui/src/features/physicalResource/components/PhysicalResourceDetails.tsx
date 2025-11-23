import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import type { PhysicalResource } from "../domain/physicalResource";
import { PhysicalResourceType, PhysicalResourceStatus } from "../domain/physicalResource";
import { activatePhysicalResource, deactivatePhysicalResource } from "../services/physicalResourceService";
import "../style/physicalResource.css";
import PhysicalResourceEditModal from "./PhysicalResourceEditModal";
import { getQualificationById } from "../../qualifications/services/qualificationService";


const getResourceIcon = (type: PhysicalResourceType | string) => {
    switch (type) {
        case PhysicalResourceType.STSCrane: return "🏗️";
        case PhysicalResourceType.YGCrane: return "🚧";
        case PhysicalResourceType.MCrane: return "🚛";
        case PhysicalResourceType.Truck: return "🚚";
        case PhysicalResourceType.Forklift: return "🛺";
        case PhysicalResourceType.RStacker: return "🚜";
        case PhysicalResourceType.SCarrier: return "📦";
        case PhysicalResourceType.TugBoat: return "🚤";
        default: return "⚙️";
    }
};

const getStatusClass = (status: PhysicalResourceStatus | string) => {
    switch (status) {
        case PhysicalResourceStatus.Available:
            return "status-available";
        case PhysicalResourceStatus.Unavailable:
            return "status-unavailable";
        case PhysicalResourceStatus.UnderMaintenance:
            return "status-undermaintenance";
        default:
            return "";
    }
};

interface PhysicalResourceDetailsProps {
    resource: PhysicalResource;
    isOpen: boolean;
    onClose: () => void;
}

function PhysicalResourceDetails({ resource, isOpen, onClose }: PhysicalResourceDetailsProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [currentResource, setCurrentResource] = useState(resource);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [qualificationName, setQualificationName] = useState<string | null>(null);
    const [isQualifLoading, setIsQualifLoading] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen && resource) {
            setIsAnimatingOut(false);
            setCurrentResource(resource);
            setQualificationName(null);

            if (resource.qualificationID) {
                setIsQualifLoading(true);
                getQualificationById(resource.qualificationID)
                    .then(data => setQualificationName(data.name))
                    .catch(() => setQualificationName(t("physicalResource.errors.loadQualificationDetails")))
                    .finally(() => setIsQualifLoading(false));
            }
        }
    }, [resource, isOpen, t]);


    const handleDeactivate = async () => {
        if (!window.confirm(t("physicalResource.confirm.deactivate"))) return;

        setIsLoading(true);
        try {
            const updatedResource = await deactivatePhysicalResource(currentResource.id);
            setCurrentResource(updatedResource);
            toast.success(t("physicalResource.success.deactivated"));
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            toast.error(t("physicalResource.errors.deactivateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!window.confirm(t("physicalResource.confirm.activate"))) return;

        setIsLoading(true);
        try {
            const updatedResource = await activatePhysicalResource(currentResource.id);
            setCurrentResource(updatedResource);
            toast.success(t("physicalResource.success.activated"));
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            toast.error(t("physicalResource.errors.activateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResourceUpdated = (updatedResource: PhysicalResource) => {
        setCurrentResource(updatedResource);
        setIsEditModalOpen(false);
        // Atualiza o nome da qualificação se tiver mudado
        if (updatedResource.qualificationID) {
            setIsQualifLoading(true);
            getQualificationById(updatedResource.qualificationID)
                .then(data => setQualificationName(data.name))
                .catch(() => setQualificationName(t("physicalResource.errors.loadQualificationDetails")))
                .finally(() => setIsQualifLoading(false));
        } else {
            setQualificationName(null);
        }
    };

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onClose();
            setIsAnimatingOut(false);
        }, 300);
    };

    if (!isOpen && !isAnimatingOut) {
        return null;
    }

    const isAvailable = currentResource.physicalResourceStatus === PhysicalResourceStatus.Available;

    return (
        <>
            <div className={`pr-modal-overlay ${isAnimatingOut ? 'anim-out' : ''}`}>
                {}
                <div className={`pr-details-modal-content ${isAnimatingOut ? 'anim-out' : ''}`}>

                    {}
                    <div className="pr-details-hero">
                        <div className="hero-icon-wrapper">
                            {getResourceIcon(currentResource.physicalResourceType)}
                        </div>
                        <div className="hero-text">
                            <h2>{currentResource.code.value}</h2>
                            <p className="details-description">{currentResource.description}</p>
                        </div>
                        <button
                            className="pr-edit-button pr-edit-button-corner"
                            disabled={isLoading}
                            onClick={() => setIsEditModalOpen(true)}
                            title={t("physicalResource.actions.edit")}
                        >
                            {t("physicalResource.actions.edit")}
                        </button>
                    </div>

                    {}
                    <div className="pr-details-grid">
                        {}
                        <div className="info-card">
                            <div className="info-card-header">
                                <span>⚡</span> {t("physicalResource.table.status")}
                            </div>
                            <div className="info-card-body">
                                <span className={`status-pill ${getStatusClass(currentResource.physicalResourceStatus)}`}>
                                    {t(`physicalResource.status.${currentResource.physicalResourceStatus}`)}
                                </span>
                            </div>
                        </div>

                        {}
                        <div className="info-card">
                            <div className="info-card-header">
                                <span>🎓</span> {t("physicalResource.form.qualification")}
                            </div>
                            <div className="info-card-body">
                                <p className="info-card-main-text">
                                    {isQualifLoading ? t("physicalResource.loading") : (qualificationName || t("physicalResource.form.none"))}
                                </p>
                            </div>
                        </div>

                        {}
                        <div className="info-card">
                            <div className="info-card-header">
                                <span>⚙️</span> {t("physicalResource.form.operationalCapacity")}
                            </div>
                            <div className="info-card-body">
                                <p className="info-card-main-text">{currentResource.operationalCapacity}</p>
                            </div>
                        </div>

                        {}
                        <div className="info-card">
                            <div className="info-card-header">
                                <span>⏱️</span> {t("physicalResource.form.setupTime")}
                            </div>
                            <div className="info-card-body">
                                <p className="info-card-main-text">
                                    {currentResource.setupTime}
                                    <span className="info-card-unit">{t("physicalResource.form.minutes")}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="pr-modal-actions">
                        {isAvailable ? (
                            <button onClick={handleDeactivate} className="pr-deactivate-button" disabled={isLoading}>
                                {t("physicalResource.actions.deactivate")}
                            </button>
                        ) : (
                            <button onClick={handleActivate} className="pr-activate-button" disabled={isLoading}>
                                {t("physicalResource.actions.activate")}
                            </button>
                        )}

                        <button onClick={handleClose} className="pr-cancel-button" disabled={isLoading}>
                            {t("physicalResource.actions.close")}
                        </button>

                    </div>
                </div>
            </div>

            {}
            <PhysicalResourceEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdated={handleResourceUpdated}
                resource={currentResource}
            />
        </>
    );
}

export default PhysicalResourceDetails;