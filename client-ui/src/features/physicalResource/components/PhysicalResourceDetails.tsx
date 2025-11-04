import {useEffect, useState} from "react";
import { useTranslation } from "react-i18next";
//import { toast } from "react-toastify";
import type { PhysicalResource } from "../types/physicalResource";
import { PhysicalResourceStatus } from "../types/physicalResource";
import { activatePhysicalResource, deactivatePhysicalResource } from "../services/physicalResourceService";
import "../style/physicalResource.css";
import PhysicalResourceEditModal from "./PhysicalResourceEditModal";

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

    // Atualiza o 'currentResource' se a prop 'resource' mudar
    useEffect(() => {
        setCurrentResource(resource);
    }, [resource]);

    const handleDeactivate = async () => {
        if (!window.confirm(t("physicalResource.confirm.deactivate"))) return;

        setIsLoading(true);
        try {
            const updatedResource = await deactivatePhysicalResource(currentResource.id);
            setCurrentResource(updatedResource); // Atualiza o estado local
            //toast.success(t("physicalResource.success.deactivated"));
            onClose();
        } catch (err) {
            //toast.error(t("physicalResource.errors.deactivateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!window.confirm(t("physicalResource.confirm.activate"))) return;

        setIsLoading(true);
        try {
            const updatedResource = await activatePhysicalResource(currentResource.id);
            setCurrentResource(updatedResource); // Atualiza o estado local
            //toast.success(t("physicalResource.success.activated"));
            onClose();
        } catch (err) {
            //toast.error(t("physicalResource.errors.activateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResourceUpdated = (updatedResource: PhysicalResource) => {
        setCurrentResource(updatedResource); // Atualiza a info mostrada nos detalhes
        setIsEditModalOpen(false); // Fecha o modal de edição
    };

    if (!isOpen) {
        return null;
    }

    const isAvailable = currentResource.physicalResourceStatus === PhysicalResourceStatus.Available;

    return (
        <> {}
            <div className="pr-modal-overlay">
                <div className="pr-modal-content">
                    {}
                    <h2>{t("physicalResource.details.title", { code: currentResource.code.value })}</h2>

                    <div className="pr-details-list">
                        <p><strong>{t("physicalResource.table.code")}:</strong> {currentResource.code.value}</p>
                        <p><strong>{t("physicalResource.table.description")}:</strong> {currentResource.description}</p>
                        <p><strong>{t("physicalResource.table.type")}:</strong> {currentResource.physicalResourceType}</p>
                        <p><strong>{t("physicalResource.table.status")}:</strong> {currentResource.physicalResourceStatus}</p>
                        <p><strong>{t("physicalResource.form.operationalCapacity")}:</strong> {currentResource.operationalCapacity}</p>
                        <p><strong>{t("physicalResource.form.setupTime")}:</strong> {currentResource.setupTime}</p>
                        <p><strong>{t("physicalResource.form.qualification")}:</strong> {currentResource.qualificationID || t("common.none")}</p>
                    </div>


                    <div className="pr-modal-actions">
                        <button onClick={onClose} className="pr-cancel-button" disabled={isLoading}>
                            {t("physicalResource.actions.close")}
                        </button>

                        {}
                        <button
                            className="pr-edit-button"
                            disabled={isLoading}
                            onClick={() => setIsEditModalOpen(true)} // Abre o modal de edição
                        >
                            {t("physicalResource.actions.edit")}
                        </button>

                        {}
                        {isAvailable ? (
                            <button onClick={handleDeactivate} className="pr-deactivate-button" disabled={isLoading}>
                                {t("physicalResource.actions.deactivate")}
                            </button>
                        ) : (
                            <button onClick={handleActivate} className="pr-activate-button" disabled={isLoading}>
                                {t("physicalResource.actions.activate")}
                            </button>
                        )}
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