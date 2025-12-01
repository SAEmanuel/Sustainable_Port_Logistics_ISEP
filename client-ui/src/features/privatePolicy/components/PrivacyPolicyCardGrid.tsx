

import type { FC } from "react";
import type { PrivacyPolicy } from "../domain/privacyPolicy";
import { useTranslation } from "react-i18next";

type PrivacyPolicyCardGridProps = {
    policies: PrivacyPolicy[];
    loading: boolean;
    onSelect: (p: PrivacyPolicy) => void;
};

export const PrivacyPolicyCardGrid: FC<PrivacyPolicyCardGridProps> = ({
                                                                          policies,
                                                                          loading,
                                                                          onSelect,
                                                                      }) => {
    const { t } = useTranslation();

    if (loading) return null;

    return (
        <div className="pp-card-grid">
            {policies.map((p) => (
                <div
                    key={p.id}
                    className="pp-card"
                    onClick={() => onSelect(p)}
                >
                    <div className="pp-card-header">
            <span className="pp-card-title">
              {t("PrivacyPolicy.version", {
                  defaultValue: "Versão",
              })}{" "}
                {p.version}
            </span>
                        <span className={`pp-badge ${p.isCurrent ? "pp-badge-green" : "pp-badge-gray"}`}>
              {p.isCurrent
                  ? t("PrivacyPolicy.current", { defaultValue: "Atual" })
                  : t("PrivacyPolicy.old", { defaultValue: "Antiga" })}
            </span>
                    </div>

                    <div className="pp-card-body">
                        <div className="pp-row-item">
              <span className="pp-label">
                {t("PrivacyPolicy.titlePt", { defaultValue: "Título (PT)" })}
              </span>
                            <span className="pp-chip">{p.titlePT}</span>
                        </div>

                        <div className="pp-row-item">
              <span className="pp-label">
                {t("PrivacyPolicy.createdAt", { defaultValue: "Criada em" })}
              </span>
                            <span className="pp-chip">
                {p.createdAt.toLocaleString()}
              </span>
                        </div>

                        <div className="pp-row-item">
              <span className="pp-label">
                {t("PrivacyPolicy.effectiveFrom", {
                    defaultValue: "Efetiva desde",
                })}
              </span>
                            <span className="pp-chip">
                {p.effectiveFrom
                    ? p.effectiveFrom.toLocaleDateString()
                    : "—"}
              </span>
                        </div>

                        <div className="pp-row-item">
              <span className="pp-label">
                {t("PrivacyPolicy.createdBy", {
                    defaultValue: "Criada por",
                })}
              </span>
                            <span className="pp-chip">{p.createdByAdmin}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
