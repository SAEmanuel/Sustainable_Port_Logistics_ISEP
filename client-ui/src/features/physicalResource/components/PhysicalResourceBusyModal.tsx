import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import type { PhysicalResource } from "../domain/physicalResource";
import type { UpdatePhysicalResourceRequest } from "../dtos/physicalResource";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../style/physicalResource.css";
import { SchedulingService } from "../../scheduling/services/SchedulingService";
import type { SaveScheduleDto, SchedulingOperationDto } from "../../scheduling/dtos/scheduling.dtos";

interface PhysicalResourceBusyModalProps {
    resource: PhysicalResource;
    isOpen: boolean;
    onClose: () => void;
}

function PhysicalResourceBusyModal({ isOpen, onClose, resource }: PhysicalResourceBusyModalProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [formData, setFormData] = useState<UpdatePhysicalResourceRequest & { busyFrom?: Date | null; busyTo?: Date | null }>({
        busyFrom: null,
        busyTo: null,
    });
    const [busyTime, setBusyTime] = useState(0);
    const [filteredPlans, setFilteredPlans] = useState<(SaveScheduleDto & {
        operations: SchedulingOperationDto[];
        craneBusyTime: number;
        totalPlanTime: number;
        numberOfOperationsForCrane: number;
    })[]>([]);

    useEffect(() => {
        if (isOpen && resource) {
            setIsAnimatingOut(false);
            setFormData({ busyFrom: null, busyTo: null });
            setError(null);
            setFilteredPlans([]);
            setBusyTime(0);
        }
    }, [isOpen, resource, t]);

    useEffect(() => {
        const fetchPlans = async () => {
            if (!formData.busyFrom || !formData.busyTo) return;
            setIsLoading(true);
            setError(null);

            try {
                const fetchedPlans = await SchedulingService.getPlansByCrane(
                    resource.code.value,
                    formData.busyFrom.toISOString(),
                    formData.busyTo.toISOString()
                );

                const plansWithStats = fetchedPlans
                    .map(plan => {
                        const opsForCrane = plan.operations.filter(op => op.crane === resource.code.value);

                        const craneBusyTime = opsForCrane.reduce(
                            (sum, op) => sum + (op.loadingDuration + op.unloadingDuration),
                            0
                        );

                        const totalPlanTime = plan.operations.reduce(
                            (sum, op) => sum + ((op.loadingDuration || 0) + (op.unloadingDuration || 0)),
                            0
                        );

                        return {
                            ...plan,
                            operations: opsForCrane,
                            craneBusyTime,
                            totalPlanTime,
                            numberOfOperationsForCrane: opsForCrane.length
                        };
                    })
                    .filter(plan => plan.operations.length > 0);

                setFilteredPlans(plansWithStats);

                const totalHours = plansWithStats.reduce((sum, plan) => sum + plan.craneBusyTime, 0);
                setBusyTime(totalHours);
            } catch (err) {
                const error = err as Error;
                setError(error);
                toast.error(error.message || t("physicalResource.errors.fetchPlansFailed"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, [formData.busyFrom, formData.busyTo, resource.code.value, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (!formData.description) {
                throw new Error(t("physicalResource.errors.descriptionRequired"));
            }
        } catch (err) {
            const error = err as Error;
            setError(error);
            toast.error(error.message || t("physicalResource.errors.updateFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onClose();
            setIsAnimatingOut(false);
        }, 300);
    };

    if (!isOpen && !isAnimatingOut) return null;

    return (
        <div className={`pr-modal-overlay ${isAnimatingOut ? 'anim-out' : ''}`}>
            <form onSubmit={handleSubmit} className={`pr-details-modal-content ${isAnimatingOut ? 'anim-out' : ''}`}>
                <div className="pr-details-hero">
                    <div className="hero-icon-wrapper">📅</div>
                    <div className="hero-text">
                        <h2>{t("physicalResource.Allocationform.title", { code: resource.code.value })}</h2>
                        <p className="details-description">{t(`physicalResource.types.${resource.physicalResourceType}`)}</p>
                    </div>
                </div>

                <div className="pr-busy-bars">
                    <div className="pr-busy-bar">
                        <span className="pr-busy-bar-label">{t("physicalResource.Allocationform.busyFrom")}</span>
                        <DatePicker
                            selected={formData.busyFrom}
                            onChange={(date: Date | null) => setFormData(prev => ({ ...prev, busyFrom: date }))}
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="pr-busy-bar">
                        <span className="pr-busy-bar-label">{t("physicalResource.Allocationform.busyTo")}</span>
                        <DatePicker
                            selected={formData.busyTo}
                            onChange={(date: Date | null) => setFormData(prev => ({ ...prev, busyTo: date }))}
                            minDate={formData.busyFrom || undefined}
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                </div>



                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="pr-table" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th>{t("physicalResource.Allocationform.table.planDate")}</th>
                                <th>{t("physicalResource.Allocationform.table.algorithm")}</th>
                                <th>{t("physicalResource.Allocationform.table.numOperations")}</th>
                                <th>{t("physicalResource.Allocationform.table.craneBusyTime")}</th>
                                <th>{t("physicalResource.Allocationform.table.totalPlanTime")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlans.length > 0 ? (
                                filteredPlans.map(plan => {
                                    const formattedDate = new Date(plan.planDate).toLocaleDateString('pt-PT'); // DD/MM/YYYY
                                    return (
                                        <tr key={`${plan.planDate}-${plan.algorithm}`}>
                                            <td>{formattedDate}</td>
                                            <td>{plan.algorithm}</td>
                                            <td>{plan.numberOfOperationsForCrane}</td>
                                            <td>{plan.craneBusyTime} h</td>
                                            <td>{plan.totalPlanTime} h</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', fontStyle: 'italic', color: '#888' }}>
                                        {t("physicalResource.Allocationform.noPlansFound", "No operation plans found in selected time interval")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pr-modal-actions">
                    <button type="button" onClick={handleClose} className="pr-cancel-button" disabled={isLoading}>
                        {t("physicalResource.actions.cancel")}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default PhysicalResourceBusyModal;
