import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import "../style/physicalResource.css";
import {FaCogs} from "react-icons/fa";
import { Link } from "react-router-dom";

import {
    getAllPhysicalResources,
    getPhysicalResourceByCode,
    getPhysicalResourcesByDescription,
    getPhysicalResourcesByStatus,
    getPhysicalResourcesByType
} from "../services/physicalResourceService";

import { PhysicalResourceStatus, PhysicalResourceType } from "../types/physicalResource";
import type { PhysicalResource } from "../types/physicalResource";

import PhysicalResourceTable from "../components/PhysicalResourceTable";
import PhysicalResourceSearch from "../components/PhysicalResourceSearch";
import PhysicalResourceDetails from "../components/PhysicalResourceDetails";
import PhysicalResourceCreateModal from "../components/PhysicalResourceCreateModal";

type FilterType = "all" | "code" | "description" | "type" | "status";

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
            toast.error(t("errors.loadAll"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (type: FilterType, value: string | number) => {
        setIsLoading(true);
        setError(null);
        try {
            let data: PhysicalResource[] = [];

            switch (type) {
                case "code":
                    const singleResource = await getPhysicalResourceByCode(value as string);
                    data = singleResource ? [singleResource] : [];
                    break;
                case "description":
                    data = await getPhysicalResourcesByDescription(value as string);
                    break;
                case "type":
                    data = await getPhysicalResourcesByType(value as PhysicalResourceType);
                    break;
                case "status":
                    data = await getPhysicalResourcesByStatus(value as PhysicalResourceStatus);
                    break;
                case "all":
                default:
                    await loadPhysicalResources(); // Recarrega tudo
                    return;
            }

            setPhysicalResources(data);

        } catch (err) {
            setError(err as Error);
            setPhysicalResources([]); // Limpa a tabela se der 404
            toast.error(t("errors.search"));
        } finally {
            setIsLoading(false);
        }
    };

    const resourceStats = useMemo(() => {
        const total = physicalResources.length;
        const available = physicalResources.filter(
            r => r.physicalResourceStatus === PhysicalResourceStatus.Available
        ).length;
        const maintenance = physicalResources.filter(
            r => r.physicalResourceStatus === PhysicalResourceStatus.UnderMaintenance
        ).length;
        return { total, available, maintenance };
    }, [physicalResources]);


    const handleShowDetails = (resource: PhysicalResource) => {
        setSelectedPhysicalResource(resource);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedPhysicalResource(null);
        loadPhysicalResources();
    };

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handlePhysicalResourceCreated = () => {
        loadPhysicalResources();
        handleCloseCreateModal();
    };

    return (
        <div className="physical-resource-page-container">
            {}
            <div className="physical-resource-header">

                {}
                <Link to="/dashboard" className="pr-back-button" title={t("physicalResource.actions.backToDashboard")}>
                    ‹
                </Link>

                {}
                <h1>
                    <FaCogs className="pr-icon" /> {t("physicalResource.title")}
                </h1>
            </div>

            {}
            <div className="pr-controls-container">
                {}
                <div className="pr-stats-grid">
                    <div className="pr-stat-card total">
                        <span className="stat-icon">📦</span>
                        <span className="stat-value">{resourceStats.total}</span>
                        <span className="stat-title">{t("physicalResource.stats.total")}</span>
                    </div>
                    <div className="pr-stat-card available">
                        <span className="stat-icon">✅</span>
                        <span className="stat-value">{resourceStats.available}</span>
                        <span className="stat-title">{t("physicalResource.stats.available")}</span>
                    </div>
                    <div className="pr-stat-card maintenance">
                        <span className="stat-icon">🔧</span>
                        <span className="stat-value">{resourceStats.maintenance}</span>
                        <span className="stat-title">{t("physicalResource.stats.maintenance")}</span>
                    </div>
                </div>

                {}
                <div className="pr-action-box">
                    <PhysicalResourceSearch onSearch={handleSearch} />
                    <button
                        onClick={handleOpenCreateModal}
                        className="create-pr-button"
                    >
                        {t("physicalResource.createButton")}
                    </button>
                </div>
            </div>
            {}

            {isLoading && <p>{t("physicalResource.loading")}</p>}
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