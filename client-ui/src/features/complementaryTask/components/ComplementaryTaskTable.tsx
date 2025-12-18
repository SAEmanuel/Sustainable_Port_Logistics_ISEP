import { useTranslation } from "react-i18next";
import type { ComplementaryTask } from "../domain/complementaryTask";
import type { ComplementaryTaskCategory } from "../../complementaryTaskCategory/domain/complementaryTaskCategory"; // Importar o tipo
import { FaExclamationTriangle } from "react-icons/fa";
import "../style/complementaryTask.css";

interface Props {
    tasks: ComplementaryTask[];
    categories: ComplementaryTaskCategory[]; // Recebemos a lista completa para poder buscar o ID
    onEdit: (task: ComplementaryTask) => void;
    onViewCategory: (categoryId: string) => void; // Explicitamos que espera um ID
    onFixCategory: (task: ComplementaryTask) => void;
}

function ComplementaryTaskTable({ tasks, categories, onEdit, onViewCategory, onFixCategory }: Props) {
    const { t } = useTranslation();

    if (tasks.length === 0) {
        return <p>{t("ct.noData") || "No tasks found."}</p>;
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString();
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "Completed": return "status-active";
            case "InProgress": return "status-warning";
            default: return "status-inactive";
        }
    };

    return (
        <table className="ct-table">
            <thead>
            <tr>
                <th>{t("ct.table.code") || "Code"}</th>
                <th>{t("ct.table.category") || "Category"}</th>
                <th>{t("ct.table.staff") || "Staff"}</th>
                <th>{t("ct.table.vve") || "VVE"}</th>
                <th>{t("ct.table.start") || "Start Time"}</th>
                <th>{t("ct.table.end") || "End Time"}</th>
                <th>{t("ct.table.status") || "Status"}</th>
                <th>{t("ct.table.actions") || "Actions"}</th>
            </tr>
            </thead>
            <tbody>
            {tasks.map((task) => {
                // Procuramos a categoria correspondente ao código da tarefa
                const matchedCategory = categories.find(c => c.code === task.category);

                // Se não encontrar, assumimos inativo por segurança, mas tentamos obter o ID se existir
                const isCategoryActive = matchedCategory ? matchedCategory.isActive : false;
                const categoryId = matchedCategory ? matchedCategory.id : null;

                const isCompleted = task.status === "Completed";
                const showDetails = isCategoryActive || isCompleted;

                return (
                    <tr key={task.id} className={!showDetails ? "row-warning" : ""}>
                        <td>{task.code}</td>
                        <td>
                            {showDetails ? (
                                <button
                                    onClick={() => categoryId && onViewCategory(categoryId)} // Envia o ID, não o código
                                    className="ct-details-button"
                                    title={t("actions.viewDetails")}
                                    disabled={!categoryId} // Previne clique se não encontrou a categoria
                                >
                                    {t("ct.details") || "Details"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => onFixCategory(task)}
                                    className="ct-danger-button"
                                    title={t("ct.categoryInactive") || "Category Inactive - Click to Fix"}
                                >
                                    <FaExclamationTriangle /> {t("ct.fix") || "Fix"}
                                </button>
                            )}
                        </td>
                        <td>{task.staff}</td>
                        <td>{task.vve}</td>
                        <td>{formatDate(task.timeStart)}</td>
                        <td>{formatDate(task.timeEnd)}</td>
                        <td>
                            <span className={`status-pill ${getStatusClass(task.status)}`}>
                                {t(`ct.status.${task.status}`) || task.status}
                            </span>
                        </td>
                        <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => onEdit(task)}
                                    className="pr-edit-button"
                                    disabled={isCompleted}
                                    style={isCompleted ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                                    title={isCompleted ? t("ct.errors.cannotEditCompleted") || "Cannot edit completed task" : ""}
                                >
                                    {t("ct.actions.edit")}
                                </button>
                            </div>
                        </td>
                    </tr>
                );
            })}
            </tbody>
        </table>
    );
}

export default ComplementaryTaskTable;