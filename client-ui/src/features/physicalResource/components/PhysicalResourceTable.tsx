import { useTranslation } from "react-i18next";
import type { PhysicalResource } from "../types/physicalResource";
import { PhysicalResourceStatus } from "../types/physicalResource";
import "../style/physicalResource.css";

interface PhysicalResourceTableProps {
    resources: PhysicalResource[];
    onDetails: (resource: PhysicalResource) => void;
}

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

function PhysicalResourceTable({ resources, onDetails }: PhysicalResourceTableProps) {
    const { t } = useTranslation();

    if (resources.length === 0) {
        return <p>{t("physicalResource.noResourcesFound")}</p>;
    }

    return (
        <table className="pr-table">
            <thead>
            <tr>
                <th>{t("physicalResource.table.code")}</th>
                <th>{t("physicalResource.table.description")}</th>
                <th>{t("physicalResource.table.type")}</th>
                <th>{t("physicalResource.table.status")}</th>
                <th>{t("physicalResource.table.actions")}</th>
            </tr>
            </thead>
            <tbody>
            {resources.map((resource) => (
                <tr key={resource.id}>
                    <td>{resource.code.value}</td>
                    <td>{resource.description}</td>
                    <td>{t(`physicalResource.types.${resource.physicalResourceType}`)}</td>

                    {}
                    <td>
                            <span className={`status-pill ${getStatusClass(resource.physicalResourceStatus)}`}>
                                {t(`physicalResource.status.${resource.physicalResourceStatus}`)}
                            </span>
                    </td>
                    {}

                    <td>
                        <button
                            onClick={() => onDetails(resource)}
                            className="pr-details-button"
                        >
                            {t("physicalResource.actions.details")}
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default PhysicalResourceTable;