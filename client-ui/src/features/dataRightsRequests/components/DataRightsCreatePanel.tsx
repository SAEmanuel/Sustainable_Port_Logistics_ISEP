import { useTranslation } from "react-i18next";
import type {
    CreatingDataRightsRequest,
    RequestType,
} from "../domain/dataRights";

type Props = {
    creating: CreatingDataRightsRequest;
    setType: (t: RequestType) => void;
    updateRectification: (p: Partial<CreatingDataRightsRequest["rectification"]>) => void;
    setCreating: (c: CreatingDataRightsRequest) => void;
    onSubmit: () => void;
};

export function DataRightsCreatePanel({
                                          creating,
                                          setType,
                                          updateRectification,
                                          setCreating,
                                          onSubmit,
                                      }: Props) {
    const { t } = useTranslation();

    const type = creating.type;

    return (
        <div className="dr-create-panel slide-in-up">
            <h2 className="dr-card-title">
                ✨ {t("dataRights.create.title", "Create a new request")}
            </h2>
            <p className="dr-card-subtitle">
                {t(
                    "dataRights.create.subtitle",
                    "Choose the type of request and fill in the details below."
                )}
            </p>

            {/* Selector de tipo */}
            <div className="dr-type-switch">
                <TypeButton
                    label="Access"
                    emoji="📄"
                    active={type === "Access"}
                    onClick={() => setType("Access")}
                />
                <TypeButton
                    label="Deletion"
                    emoji="🧹"
                    active={type === "Deletion"}
                    onClick={() => setType("Deletion")}
                />
                <TypeButton
                    label="Rectification"
                    emoji="✏️"
                    active={type === "Rectification"}
                    onClick={() => setType("Rectification")}
                />
            </div>

            {/* Form consoante o tipo */}
            {type === "Access" && (
                <div className="dr-form-section">
                    <p>
                        {t(
                            "dataRights.create.accessInfo",
                            "We will send you a summary of the personal data we store about you."
                        )}
                    </p>
                    <p className="dr-note">
                        ℹ️ {t(
                        "dataRights.create.accessNote",
                        "No additional information is required for this request."
                    )}
                    </p>
                </div>
            )}

            {type === "Deletion" && (
                <div className="dr-form-section">
                    <label className="dr-label">
                        {t(
                            "dataRights.create.deletionReason",
                            "Reason for deletion (optional but recommended)"
                        )}
                    </label>
                    <textarea
                        className="dr-textarea"
                        rows={3}
                        placeholder={t(
                            "dataRights.create.deletionReason_PH",
                            "Example: I no longer use the platform and want my data removed."
                        )}
                        value={creating.deletionReason}
                        onChange={e =>
                            setCreating({
                                ...creating,
                                deletionReason: e.target.value,
                            })
                        }
                    />
                    <p className="dr-note">
                        ⚠️{" "}
                        {t(
                            "dataRights.create.deletionWarning",
                            "Some data may need to be kept for legal or security reasons."
                        )}
                    </p>
                </div>
            )}

            {type === "Rectification" && (
                <div className="dr-form-section dr-grid-2">
                    <div>
                        <label className="dr-label">
                            {t("dataRights.create.newName", "New name")}
                        </label>
                        <input
                            className="dr-input"
                            value={creating.rectification.newName ?? ""}
                            onChange={e =>
                                updateRectification({ newName: e.target.value })
                            }
                            placeholder={t(
                                "dataRights.create.newName_PH",
                                "Only fill if you want to change"
                            )}
                        />
                    </div>
                    <div>
                        <label className="dr-label">
                            {t("dataRights.create.newEmail", "New email")}
                        </label>
                        <input
                            className="dr-input"
                            value={creating.rectification.newEmail ?? ""}
                            onChange={e =>
                                updateRectification({ newEmail: e.target.value })
                            }
                            placeholder={t(
                                "dataRights.create.newEmail_PH",
                                "Only fill if you want to change"
                            )}
                        />
                    </div>

                    <div>
                        <label className="dr-label">
                            {t("dataRights.create.newPicture", "New profile picture URL")}
                        </label>
                        <input
                            className="dr-input"
                            value={creating.rectification.newPicture ?? ""}
                            onChange={e =>
                                updateRectification({ newPicture: e.target.value })
                            }
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="dr-label">
                            {t("dataRights.create.isActive", "Mark account as active?")}
                        </label>
                        <select
                            className="dr-input"
                            value={
                                creating.rectification.isActive === null ||
                                creating.rectification.isActive === undefined
                                    ? ""
                                    : creating.rectification.isActive
                                        ? "true"
                                        : "false"
                            }
                            onChange={e => {
                                const v = e.target.value;
                                updateRectification({
                                    isActive:
                                        v === ""
                                            ? null
                                            : v === "true"
                                                ? true
                                                : false,
                                });
                            }}
                        >
                            <option value="">
                                {t("dataRights.create.keepAsIs", "Keep as is")}
                            </option>
                            <option value="true">
                                {t("dataRights.create.setActive", "Set as active")}
                            </option>
                            <option value="false">
                                {t("dataRights.create.setInactive", "Set as inactive")}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="dr-label">
                            {t(
                                "dataRights.create.newPhoneNumber",
                                "New phone number (SAR)"
                            )}
                        </label>
                        <input
                            className="dr-input"
                            value={creating.rectification.newPhoneNumber ?? ""}
                            onChange={e =>
                                updateRectification({
                                    newPhoneNumber: e.target.value,
                                })
                            }
                            placeholder="+3519..."
                        />
                    </div>

                    <div>
                        <label className="dr-label">
                            {t(
                                "dataRights.create.newNationality",
                                "New nationality (SAR)"
                            )}
                        </label>
                        <input
                            className="dr-input"
                            value={creating.rectification.newNationality ?? ""}
                            onChange={e =>
                                updateRectification({
                                    newNationality: e.target.value,
                                })
                            }
                            placeholder="Portugal, Spain..."
                        />
                    </div>

                    <div>
                        <label className="dr-label">
                            {t(
                                "dataRights.create.newCitizenId",
                                "New citizen ID / passport (SAR)"
                            )}
                        </label>
                        <input
                            className="dr-input"
                            value={creating.rectification.newCitizenId ?? ""}
                            onChange={e =>
                                updateRectification({
                                    newCitizenId: e.target.value,
                                })
                            }
                            placeholder="AB1234567"
                        />
                    </div>

                    <div className="dr-grid-full">
                        <label className="dr-label">
                            {t(
                                "dataRights.create.reason",
                                "Why do you want these changes?"
                            )}
                        </label>
                        <textarea
                            className="dr-textarea"
                            rows={3}
                            value={creating.rectification.reason ?? ""}
                            onChange={e =>
                                updateRectification({
                                    reason: e.target.value,
                                })
                            }
                            placeholder={t(
                                "dataRights.create.reason_PH",
                                "Briefly explain why these corrections are needed."
                            )}
                        />
                    </div>
                </div>
            )}

            <div className="dr-form-actions">
                <button
                    type="button"
                    className="dr-primary-btn"
                    onClick={onSubmit}
                >
                    🚀 {t("dataRights.create.submit", "Submit request")}
                </button>
                <p className="dr-note">
                    🔒{" "}
                    {t(
                        "dataRights.create.footerNote",
                        "Your request will be handled by our privacy team and you will be notified by email."
                    )}
                </p>
            </div>
        </div>
    );
}

type TypeButtonProps = {
    label: string;
    emoji: string;
    active: boolean;
    onClick: () => void;
};

function TypeButton({ label, emoji, active, onClick }: TypeButtonProps) {
    return (
        <button
            type="button"
            className={`dr-type-btn ${active ? "active" : ""}`}
            onClick={onClick}
        >
            <span className="dr-type-emoji">{emoji}</span>
            <span>{label}</span>
        </button>
    );
}
