import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import type {
    RectificationApplyDto,
    RectificationPayloadDto,
} from "../../dto/dataRightsDtos";
import type { DataRightsRequest } from "../../domain/dataRights";
import dataRightsAdminService from "../../service/dataRightsAdminService";
import { mapRequestDto } from "../../mappers/dataRightsMapper";

type Props = {
    open: boolean;
    request: DataRightsRequest | null;
    onClose: () => void;
    onApplied: (updated: DataRightsRequest) => void;
};

/** constrói um form “vazio” para um dado requestId */
function buildInitialForm(requestId: string): RectificationApplyDto {
    return {
        requestId,
        rejectEntireRequest: false,
        globalReason: null,
        finalName: null,
        finalNameReason: null,
        finalEmail: null,
        finalEmailReason: null,
        finalPicture: null,
        finalPictureReason: null,
        finalIsActive: null,
        finalIsActiveReason: null,
        finalPhoneNumber: null,
        finalPhoneNumberReason: null,
        finalNationality: null,
        finalNationalityReason: null,
        finalCitizenId: null,
        finalCitizenIdReason: null,
        adminGeneralComment: null,
    };
}

/** "" -> null, senão devolve a própria string */
function emptyToNull(v?: string | null): string | null {
    // aceita undefined, null ou string
    if (v == null) return null; // cobre null e undefined

    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
}


export function RectificationDecisionModal({
                                               open,
                                               request,
                                               onClose,
                                               onApplied,
                                           }: Props) {
    const { t } = useTranslation();

    // Agora o form NUNCA é null; começamos com um dummy requestId ""
    const [form, setForm] = useState<RectificationApplyDto>(
        () => buildInitialForm(""),
    );
    const [originalPayload, setOriginalPayload] =
        useState<RectificationPayloadDto | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !request) {
            setOriginalPayload(null);
            return;
        }

        // payload original pedido pelo user (RectificationPayloadDto)
        try {
            if (request.payload) {
                const parsed = JSON.parse(
                    request.payload,
                ) as RectificationPayloadDto;
                setOriginalPayload(parsed);
            } else {
                setOriginalPayload(null);
            }
        } catch {
            setOriginalPayload(null);
        }

        // repõe o form com base no request atual
        setForm(buildInitialForm(request.requestId));
    }, [open, request]);

    // se não está aberto ou não há request → nada a renderizar
    if (!open || !request) return null;

    function updateForm(partial: Partial<RectificationApplyDto>) {
        setForm(prev => ({ ...prev, ...partial }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            setLoading(true);

            const dtoToSend: RectificationApplyDto = {
                ...form,
                globalReason: emptyToNull(form.globalReason),
                finalName: emptyToNull(form.finalName),
                finalNameReason: emptyToNull(form.finalNameReason),
                finalEmail: emptyToNull(form.finalEmail),
                finalEmailReason: emptyToNull(form.finalEmailReason),
                finalPicture: emptyToNull(form.finalPicture),
                finalPictureReason: emptyToNull(form.finalPictureReason),
                finalIsActive: form.finalIsActive,
                finalIsActiveReason: emptyToNull(form.finalIsActiveReason),
                finalPhoneNumber: emptyToNull(form.finalPhoneNumber),
                finalPhoneNumberReason: emptyToNull(
                    form.finalPhoneNumberReason,
                ),
                finalNationality: emptyToNull(form.finalNationality),
                finalNationalityReason: emptyToNull(
                    form.finalNationalityReason,
                ),
                finalCitizenId: emptyToNull(form.finalCitizenId),
                finalCitizenIdReason: emptyToNull(form.finalCitizenIdReason),
                adminGeneralComment: emptyToNull(form.adminGeneralComment),
            };

            const updatedDto = await dataRightsAdminService.applyRectification(dtoToSend);
            const mapped = mapRequestDto(updatedDto);

            toast.success(
                t(
                    "dataRights.admin.rectificationApplied",
                    "Rectification decision applied and user notified.",
                ),
            );

            onApplied(mapped);
            onClose();
        } catch (e: any) {
            const data = e?.response?.data;
            const msg =
                data?.detail ||
                data?.title ||
                data?.message ||
                e?.message ||
                t(
                    "dataRights.admin.rectificationError",
                    "Error applying rectification decision",
                );
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="dr-modal-overlay">
            <div className="dr-modal">
                <header className="dr-modal-header">
                    <h2>
                        ✏️{" "}
                        {t(
                            "dataRights.admin.rectificationTitle",
                            "Rectification request decision",
                        )}
                    </h2>
                    <button
                        type="button"
                        className="dr-modal-close"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✖
                    </button>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="dr-modal-body dr-grid-2"
                >
                    {/* COLUNA ESQUERDA – Pedido original */}
                    <div className="dr-rect-original">
                        <h3 className="dr-label">
                            {t(
                                "dataRights.admin.originalRequest",
                                "Original requested changes",
                            )}
                        </h3>
                        {originalPayload ? (
                            <pre className="dr-payload small">
                                {JSON.stringify(originalPayload, null, 2)}
                            </pre>
                        ) : (
                            <p className="dr-note">
                                {t(
                                    "dataRights.admin.noOriginalPayload",
                                    "No rectification payload was found.",
                                )}
                            </p>
                        )}
                    </div>

                    {/* COLUNA DIREITA – Decisão do admin */}
                    <div className="dr-rect-decision">
                        <label className="dr-checkbox-row">
                            <input
                                type="checkbox"
                                checked={form.rejectEntireRequest}
                                onChange={e =>
                                    updateForm({
                                        rejectEntireRequest: e.target.checked,
                                    })
                                }
                            />
                            <span>
                                {t(
                                    "dataRights.admin.rejectEntire",
                                    "Reject entire request (no changes applied)",
                                )}
                            </span>
                        </label>

                        <div className="dr-form-section">
                            <label className="dr-label">
                                {t(
                                    "dataRights.admin.globalReason",
                                    "Global reason (optional)",
                                )}
                            </label>
                            <textarea
                                rows={3}
                                className="dr-textarea"
                                value={form.globalReason ?? ""}
                                onChange={e =>
                                    updateForm({
                                        globalReason: e.target.value,
                                    })
                                }
                                placeholder={t(
                                    "dataRights.admin.globalReason_PH",
                                    "Explain briefly why you accepted / rejected the requested changes.",
                                )}
                            />
                        </div>

                        {!form.rejectEntireRequest && (
                            <>
                                <div className="dr-form-section dr-grid-2">
                                    <div>
                                        <label className="dr-label">
                                            {t(
                                                "dataRights.admin.finalName",
                                                "Final name",
                                            )}
                                        </label>
                                        <input
                                            className="dr-input"
                                            value={form.finalName ?? ""}
                                            onChange={e =>
                                                updateForm({
                                                    finalName: e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            className="dr-input subtle"
                                            placeholder={t(
                                                "dataRights.admin.reasonField_PH",
                                                "Reason (optional)",
                                            )}
                                            value={form.finalNameReason ?? ""}
                                            onChange={e =>
                                                updateForm({
                                                    finalNameReason:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="dr-label">
                                            {t(
                                                "dataRights.admin.finalEmail",
                                                "Final email",
                                            )}
                                        </label>
                                        <input
                                            className="dr-input"
                                            value={form.finalEmail ?? ""}
                                            onChange={e =>
                                                updateForm({
                                                    finalEmail: e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            className="dr-input subtle"
                                            placeholder={t(
                                                "dataRights.admin.reasonField_PH",
                                                "Reason (optional)",
                                            )}
                                            value={form.finalEmailReason ?? ""}
                                            onChange={e =>
                                                updateForm({
                                                    finalEmailReason:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="dr-form-section dr-grid-2">
                                    <div>
                                        <label className="dr-label">
                                            {t(
                                                "dataRights.admin.finalPhone",
                                                "Final phone number (SAR)",
                                            )}
                                        </label>
                                        <input
                                            className="dr-input"
                                            value={form.finalPhoneNumber ?? ""}
                                            onChange={e =>
                                                updateForm({
                                                    finalPhoneNumber:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            className="dr-input subtle"
                                            placeholder={t(
                                                "dataRights.admin.reasonField_PH",
                                                "Reason (optional)",
                                            )}
                                            value={
                                                form.finalPhoneNumberReason ??
                                                ""
                                            }
                                            onChange={e =>
                                                updateForm({
                                                    finalPhoneNumberReason:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="dr-label">
                                            {t(
                                                "dataRights.admin.finalNationality",
                                                "Final nationality (SAR)",
                                            )}
                                        </label>
                                        <input
                                            className="dr-input"
                                            value={form.finalNationality ?? ""}
                                            onChange={e =>
                                                updateForm({
                                                    finalNationality:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            className="dr-input subtle"
                                            placeholder={t(
                                                "dataRights.admin.reasonField_PH",
                                                "Reason (optional)",
                                            )}
                                            value={
                                                form.finalNationalityReason ??
                                                ""
                                            }
                                            onChange={e =>
                                                updateForm({
                                                    finalNationalityReason:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="dr-form-section dr-grid-2">
                                    <div>
                                        <label className="dr-label">
                                            {t(
                                                "dataRights.admin.finalCitizenId",
                                                "Final citizen ID / passport (SAR)",
                                            )}
                                        </label>
                                        <input
                                            className="dr-input"
                                            value={form.finalCitizenId ?? ""}
                                            onChange={e =>
                                                updateForm({
                                                    finalCitizenId:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            className="dr-input subtle"
                                            placeholder={t(
                                                "dataRights.admin.reasonField_PH",
                                                "Reason (optional)",
                                            )}
                                            value={
                                                form.finalCitizenIdReason ?? ""
                                            }
                                            onChange={e =>
                                                updateForm({
                                                    finalCitizenIdReason:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="dr-label">
                                            {t(
                                                "dataRights.admin.finalIsActive",
                                                "Final account status",
                                            )}
                                        </label>
                                        <select
                                            className="dr-input"
                                            value={
                                                form.finalIsActive === null
                                                    ? ""
                                                    : form.finalIsActive
                                                        ? "true"
                                                        : "false"
                                            }
                                            onChange={e => {
                                                const v = e.target.value;
                                                updateForm({
                                                    finalIsActive:
                                                        v === ""
                                                            ? null
                                                            : v === "true",
                                                });
                                            }}
                                        >
                                            <option value="">
                                                {t(
                                                    "dataRights.admin.keepAsIs",
                                                    "Keep as is",
                                                )}
                                            </option>
                                            <option value="true">
                                                {t(
                                                    "dataRights.admin.setActive",
                                                    "Set active",
                                                )}
                                            </option>
                                            <option value="false">
                                                {t(
                                                    "dataRights.admin.setInactive",
                                                    "Set inactive",
                                                )}
                                            </option>
                                        </select>
                                        <input
                                            className="dr-input subtle"
                                            placeholder={t(
                                                "dataRights.admin.reasonField_PH",
                                                "Reason (optional)",
                                            )}
                                            value={
                                                form.finalIsActiveReason ?? ""
                                            }
                                            onChange={e =>
                                                updateForm({
                                                    finalIsActiveReason:
                                                    e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="dr-form-section">
                                    <label className="dr-label">
                                        {t(
                                            "dataRights.admin.adminComment",
                                            "Admin general comment to user (optional)",
                                        )}
                                    </label>
                                    <textarea
                                        className="dr-textarea"
                                        rows={3}
                                        value={form.adminGeneralComment ?? ""}
                                        onChange={e =>
                                            updateForm({
                                                adminGeneralComment:
                                                e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </form>

                <footer className="dr-modal-footer">
                    <button
                        type="button"
                        className="dr-secondary-btn"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {t("dataRights.admin.cancel", "Cancel")}
                    </button>
                    <button
                        type="submit"
                        form={undefined} // o submit real é o do form acima
                        className="dr-primary-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading
                            ? t(
                                "dataRights.admin.saving",
                                "Saving decision...",
                            )
                            : t(
                                "dataRights.admin.applyDecision",
                                "Apply decision",
                            )}
                    </button>
                </footer>
            </div>
        </div>
    );
}
