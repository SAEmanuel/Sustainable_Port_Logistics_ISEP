import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
//import { notifyLoading, notifySuccess, notifyError } from "../../../utils/notify";
import toast from "react-hot-toast";
//import { FaUsers } from "react-icons/fa";
import "../style/physicalResource.css";

import {
    getAllPhysicalResources,
    getPhysicalResourceByCode
} from "../services/physicalResourceService";


import type { PhysicalResource } from "../types/physicalResource";
import PhysicalResourceSearch from "../components/PhysicalResourceSearch.tsx";
import PhysicalResourceTable from "../components/PhysicalResourceTable.tsx";
import PhysicalResourceCreateModal from "../components/PhysicalResourceCreateModal.tsx";
import PhysicalResourceDetails from "../components/PhysicalResourceDetails";


function PhysicalResourcePage() {
    const { t } = useTranslation();
    const [physicalResources, setPhysicalResources] = useState<PhysicalResource[]>([]);
    const [selectedPhysicalResource, setSelectedPhysicalResource] = useState<PhysicalResource | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadPhysicalResources();
    }, []);

    const loadPhysicalResources = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllPhysicalResources();
            setPhysicalResources(data);
        } catch (err) {
            setError(err as Error);
            toast.error(t("physicalResource.errors.loadAll"));
        } finally {
            setIsLoading(false);
        }
    };

    // Handler para a busca (vamos buscar por 'code')
    const handleSearch = async (code: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Se a busca for limpa, recarrega todos
            if (code === "") {
                await loadPhysicalResources();
            } else {
                const data = await getPhysicalResourceByCode(code);
                setPhysicalResources([data]);
            }
        } catch (err) {
            setError(err as Error);
            setPhysicalResources([]); // Limpa a tabela se der erro (ex: 404)
            toast.error(t("physicalResource.errors.search"));
        } finally {
            setIsLoading(false);
        }
    };

    // // Handlers para o modal de Detalhes
    const handleShowDetails = (resource: PhysicalResource) => {
        setSelectedPhysicalResource(resource);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedPhysicalResource(null);
    };

    // Handlers para o modal de Criação
    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    // Handler para recarregar a lista após uma criação bem-sucedida
    const handlePhysicalResourceCreated = () => {
        loadPhysicalResources(); // Recarrega a lista
        handleCloseCreateModal();
    };

    return (
        <div className="physical-resource-page-container">
            <div className="physical-resource-header">
                <h1>{t("physicalResource.title")}</h1>
                <button
                    onClick={handleOpenCreateModal}
                    className="create-pr-button"
                >
                    {t("physicalResource.createButton")}
                </button>
            </div>

            <PhysicalResourceSearch onSearch={handleSearch} />

            {isLoading && <p>{t("common.loading")}</p>}
            {error && <p className="error-message">{error.message}</p>}

            <PhysicalResourceTable
                resources={physicalResources}
                onDetails={handleShowDetails}
            />

            {selectedPhysicalResource && (
                <PhysicalResourceDetails
                    resource={selectedPhysicalResource}
                    isOpen={isDetailsOpen}
                    onClose={handleCloseDetails}
                />
            )}

            <PhysicalResourceCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onCreated={handlePhysicalResourceCreated}
            />
        </div>
    );
}

export default PhysicalResourcePage;