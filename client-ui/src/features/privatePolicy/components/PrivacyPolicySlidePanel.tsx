import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PrivacyPolicy } from "../domain/privacyPolicy";

type Props = {
    policy: PrivacyPolicy;
    onClose: () => void;
};

export const PrivacyPolicySlidePanel: FC<Props> = ({ policy, onClose }) => {
    const { t } = useTranslation();
    const [lang, setLang] = useState<"PT" | "EN">("PT");

    const isPT = lang === "PT";

    const content = isPT ? policy.contentPT : policy.contentEn;
    const title = isPT ? policy.titlePT : (policy as any).titleEn ?? policy.titlePT;

    return (
        <aside className="pp-slide">
            <div className="pp-slide-header">
                <button
                    className="pp-slide-close"
                    type="button"
                    onClick={onClose}
                    aria-label={t("common.close", { defaultValue: "Fechar" })}
                >
                    ✕
                </button>

                <div className="pp-slide-header-main">
                    <div className="pp-slide-tag-row">
                        <span className="pp-pill">
                            {t("PrivacyPolicy.version", {
                                defaultValue: "Versão",
                            })}{" "}
                            {policy.version}
                        </span>

                        <span
                            className={
                                "pp-pill " +
                                (policy.isCurrent ? "pp-pill-live" : "pp-pill-muted")
                            }
                        >
                            {policy.isCurrent
                                ? t("PrivacyPolicy.current", { defaultValue: "Atual" })
                                : t("PrivacyPolicy.old", { defaultValue: "Antiga" })}
                        </span>
                    </div>

                    <h2 className="pp-slide-title">{title}</h2>

                    <div className="pp-slide-meta">
                        <span>
                            {t("PrivacyPolicy.createdAt", {
                                defaultValue: "Criada em",
                            })}{" "}
                            <strong>{policy.createdAt.toLocaleString()}</strong>
                        </span>
                        <span className="pp-dot">•</span>
                        <span>
                            {t("PrivacyPolicy.effectiveFrom", {
                                defaultValue: "Efetiva desde",
                            })}{" "}
                            <strong>
                                {policy.effectiveFrom
                                    ? policy.effectiveFrom.toLocaleDateString()
                                    : "—"}
                            </strong>
                        </span>
                        <span className="pp-dot">•</span>
                        <span>
                            {t("PrivacyPolicy.createdBy", {
                                defaultValue: "Criada por",
                            })}{" "}
                            <strong>{policy.createdByAdmin}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Toggle de idioma */}
            <div className="pp-slide-lang-toggle">
                <button
                    type="button"
                    className={
                        "pp-lang-btn " + (isPT ? "pp-lang-btn--active" : "")
                    }
                    onClick={() => setLang("PT")}
                >
                    PT
                </button>
                <button
                    type="button"
                    className={
                        "pp-lang-btn " + (!isPT ? "pp-lang-btn--active" : "")
                    }
                    onClick={() => setLang("EN")}
                >
                    EN
                </button>
            </div>

            {/* Conteúdo */}
            <div className="pp-slide-body">
                {content ? (
                    <p className="pp-slide-text">
                        {content}
                    </p>
                ) : (
                    <p className="pp-slide-empty">
                        {t("PrivacyPolicy.noContentForLang", {
                            defaultValue: "Não há conteúdo disponível neste idioma.",
                        })}
                    </p>
                )}
            </div>
        </aside>
    );
};
