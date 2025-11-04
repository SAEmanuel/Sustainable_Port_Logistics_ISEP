import { useState } from "react";
import { useTranslation } from "react-i18next";
//import { toast } from "react-toastify";
import type { PhysicalResource } from "../types/physicalResource";
import { PhysicalResourceStatus } from "../types/physicalResource";
import { activatePhysicalResource, deactivatePhysicalResource } from "../services/physicalResourceService";
import "../style/physicalResource.css";

interface PhysicalResourceDetailsProps {
    resource: PhysicalResource;
    isOpen: boolean;
    onClose: () => void;
}

function PhysicalResourceDetails({ resource, isOpen, onClose }: PhysicalResourceDetailsProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Assegura que o recurso está sempre atualizado (embora o modal feche)
    const [currentResource, setCurrentResource] = useState(resource);

    const handleDeactivate = async () => {
        if (!window.confirm(t("physicalResource.confirm.deactivate"))) return;

        setIsLoading(true);
        try {
            const updatedResource = await deactivatePhysicalResource(currentResource.id);
            setCurrentResource(updatedResource); // Atualiza o estado local
            //toast.success(t("physicalResource.success.deactivated"));
            onClose(); // Fecha o modal (e a página irá recarregar)
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
            onClose(); // Fecha o modal (e a página irá recarregar)
        } catch (err) {
            //toast.error(t("physicalResource.errors.activateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    const isAvailable = currentResource.physicalResourceStatus === PhysicalResourceStatus.Available;

    return (
        <div className="pr-modal-overlay">
            <div className="pr-modal-content">
                <h2>{t("physicalResource.details.title", { code: currentResource.code })}</h2>

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
                        {t("common.close")}
                    </button>

                    {/* Botão de Edição (funcionalidade futura) */}
                    <button className="pr-edit-button" disabled={isLoading}>
                        {t("common.edit")}
                    </button>

                    {/* Botões de Ativar/Desativar */}
                    {isAvailable ? (
                        <button onClick={handleDeactivate} className="pr-deactivate-button" disabled={isLoading}>
                            {t("common.deactivate")}
                        </button>
                    ) : (
                        <button onClick={handleActivate} className="pr-activate-button" disabled={isLoading}>
                            {t("common.activate")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PhysicalResourceDetails;