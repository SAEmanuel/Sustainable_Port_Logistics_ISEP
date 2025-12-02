import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import type { PrivacyPolicy } from "../domain/privacyPolicy";
import type { CreatePrivacyPolicyRequestDto } from "../dto/privacyPolicyDtos";

import {
    getPrivacyPolicies,
    createPrivacyPolicy,
} from "../services/privacyPolicyService";

import { PrivacyPolicyCardGrid } from "../components/PrivacyPolicyCardGrid";
import { useAppStore } from "../../../app/store";
import "../style/privacypolicy.css";
import { PrivacyPolicySlidePanel } from "../components/PrivacyPolicySlidePanel";
const PRIVACY_TEMPLATE_PT = `1. Introdução
Descreve, de forma simples, o objetivo da política e o contexto da aplicação.

2. Dados pessoais que tratamos
Lista os tipos de dados pessoais (ex.: identificação, contacto, login, logs técnicos, etc.).

3. Finalidades e base legal
Explica para que usamos os dados (ex.: gestão de conta, cumprimento de obrigações legais)
e qual a base legal (ex.: execução de contrato, obrigação legal, interesse legítimo).

4. Partilha de dados
Indica se há partilha com terceiros (ex.: fornecedores de infraestruturas, entidades públicas)
e em que condições.

5. Conservação dos dados
Define prazos ou critérios de conservação (ex.: enquanto a conta estiver ativa, prazos legais).

6. Direitos dos titulares
Explica os direitos (acesso, retificação, apagamento, oposição, portabilidade, reclamação)
e como podem ser exercidos.

7. Contactos e reclamações
Indica contactos para questões de proteção de dados (ex.: email de suporte ou DPO)
e referência à autoridade de controlo (ex.: CNPD em Portugal).

8. Atualizações desta política
Indica como e quando a política pode ser atualizada e como os utilizadores serão informados.`;

const PRIVACY_TEMPLATE_EN = `1. Introduction
Briefly describe the purpose of this policy and the context of the application.

2. Personal data we process
List the categories of personal data (e.g. identification, contact, login, technical logs, etc.).

3. Purposes and legal basis
Explain what we use the data for (e.g. account management, legal obligations)
and the legal basis (e.g. contract performance, legal obligation, legitimate interest).

4. Data sharing
Indicate whether data is shared with third parties (e.g. infrastructure providers, public authorities)
and under which conditions.

5. Data retention
Define retention periods or criteria (e.g. as long as the account is active, legal time limits).

6. Data subjects’ rights
Explain the rights (access, rectification, erasure, objection, portability, complaint)
and how they can be exercised.

7. Contacts and complaints
Provide contacts for data protection issues (e.g. support or DPO email)
and reference to the supervisory authority.

8. Updates to this policy
Indicate how and when this policy may be updated and how users will be informed.`;

const REQUIRED_SECTIONS_PT = [
    "1. Introdução",
    "2. Dados pessoais que tratamos",
    "3. Finalidades e base legal",
    "4. Partilha de dados",
    "5. Conservação dos dados",
    "6. Direitos dos titulares",
    "7. Contactos e reclamações",
    "8. Atualizações desta política",
];

const REQUIRED_SECTIONS_EN = [
    "1. Introduction",
    "2. Personal data we process",
    "3. Purposes and legal basis",
    "4. Data sharing",
    "5. Data retention",
    "6. Data subjects’ rights",
    "7. Contacts and complaints",
    "8. Updates to this policy",
];

const MIN_LOADING_TIME = 500;

async function runWithLoading<T>(promise: Promise<T>, text: string) {
    const id = toast.loading(text);
    const start = Date.now();
    try {
        return await promise;
    } finally {
        const elapsed = Date.now() - start;
        if (elapsed < MIN_LOADING_TIME) {
            await new Promise((res) => setTimeout(res, MIN_LOADING_TIME - elapsed));
        }
        toast.dismiss(id);
    }
}

export async function getCurrentAdminEmail(): Promise<string | null> {
    const user = useAppStore.getState().user;

    if (!user) {
        toast.error("No such user");
        return null;
    }

    return user.email;
}

export default function PrivacyPolicyPage() {
    const { t } = useTranslation();

    const [items, setItems] = useState<PrivacyPolicy[]>([]);
    const [loading, setLoading] = useState(true);

    const [selected, setSelected] = useState<PrivacyPolicy | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    const [createData, setCreateData] = useState<{
        titleEn: string;
        titlePT: string;
        contentEn: string;
        contentPT: string;
        effectiveFrom: string;
        createdByAdmin: string;
    }>({
        titleEn: "",
        titlePT: "",
        contentEn: "",
        contentPT: "",
        effectiveFrom: "",
        createdByAdmin: "",
    });

    const [createErrors, setCreateErrors] = useState<{
        titleEn?: string;
        titlePT?: string;
        contentEn?: string;
        contentPT?: string;
        effectiveFrom?: string;
        createdByAdmin?: string;
    }>({});

    useEffect(() => {
        async function load() {
            try {
                const data = await runWithLoading<PrivacyPolicy[]>(
                    getPrivacyPolicies(),
                    t("PrivacyPolicy.messages.loading", {
                        defaultValue: "A carregar políticas...",
                    })
                );

                data.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                );

                setItems(data);
                toast.success(
                    t("PrivacyPolicy.messages.loaded", {
                        count: data.length,
                        defaultValue: "Encontradas {{count}} políticas",
                    })
                );
            } catch {
                toast.error(
                    t("PrivacyPolicy.messages.loadError", {
                        defaultValue: "Erro ao carregar políticas",
                    })
                );
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [t]);

    function validateCreate(): boolean {
        const next: typeof createErrors = {};
        if (!createData.titleEn.trim())
            next.titleEn = t("PrivacyPolicy.errors.titleEnRequired", {
                defaultValue: "Título EN é obrigatório",
            });
        if (!createData.titlePT.trim())
            next.titlePT = t("PrivacyPolicy.errors.titlePtRequired", {
                defaultValue: "Título PT é obrigatório",
            });
        if (!createData.contentEn.trim())
            next.contentEn = t("PrivacyPolicy.errors.contentEnRequired", {
                defaultValue: "Conteúdo EN é obrigatório",
            });
        if (!createData.contentPT.trim())
            next.contentPT = t("PrivacyPolicy.errors.contentPtRequired", {
                defaultValue: "Conteúdo PT é obrigatório",
            });
        if (!createData.effectiveFrom.trim())
            next.effectiveFrom = t("PrivacyPolicy.errors.effectiveFromRequired", {
                defaultValue: "Data de entrada em vigor é obrigatória",
            });

        const contentPtLower = createData.contentPT.toLowerCase();
        const missingPt = REQUIRED_SECTIONS_PT.filter(
            (s) => !contentPtLower.includes(s.toLowerCase())
        );
        if (missingPt.length > 0) {
            next.contentPT =
                t("PrivacyPolicy.errors.contentPtStructure", {
                    defaultValue:
                        "O conteúdo PT deve seguir o modelo base (faltam algumas secções obrigatórias).",
                }) +
                "\n" +
                missingPt.join(", ");
        }

        const contentEnLower = createData.contentEn.toLowerCase();
        const missingEn = REQUIRED_SECTIONS_EN.filter(
            (s) => !contentEnLower.includes(s.toLowerCase())
        );
        if (missingEn.length > 0) {
            next.contentEn =
                t("PrivacyPolicy.errors.contentEnStructure", {
                    defaultValue:
                        "O conteúdo EN deve seguir o modelo base (faltam algumas secções obrigatórias).",
                }) +
                "\n" +
                missingEn.join(", ");
        }

        setCreateErrors(next);
        return Object.keys(next).length === 0;
    }

    const handleOpenCreate = async () => {
        setCreateErrors({});

        const email = await getCurrentAdminEmail();
        if (!email) {
            // já mostrámos toast em getCurrentAdminEmail
            return;
        }

        setCreateData({
            titleEn: "",
            titlePT: "",
            contentEn: "",
            contentPT: "",
            effectiveFrom: "",
            createdByAdmin: email, // preenchido automaticamente
        });

        setIsCreateOpen(true);
    };

    async function handleCreate() {
        if (!validateCreate()) {
            toast.error(
                t("PrivacyPolicy.errors.formFix", {
                    defaultValue: "Corrige os erros do formulário.",
                })
            );
            return;
        }

        const payload: CreatePrivacyPolicyRequestDto = {
            titleEn: createData.titleEn.trim(),
            titlePT: createData.titlePT.trim(),
            contentEn: createData.contentEn.trim(),
            contentPT: createData.contentPT.trim(),
            effectiveFrom: new Date(createData.effectiveFrom).toISOString(),
            createdByAdmin: createData.createdByAdmin.trim(),
        };

        const created = await runWithLoading(
            createPrivacyPolicy(payload),
            t("PrivacyPolicy.modal.addTitle", {
                defaultValue: "Criar Política de Privacidade",
            })
        ).catch((e: any) => {
            const msg: string =
                e?.response?.data?.error ??
                e?.response?.data?.message ??
                e?.message ??
                "Erro ao criar política";
            toast.error(msg);
            return null;
        });

        if (!created) return;

        toast.success(
            t("PrivacyPolicy.messages.created", {
                defaultValue: "Política criada",
            })
        );

        const data = await getPrivacyPolicies();
        data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setItems(data);
        setIsCreateOpen(false);
        setCreateData({
            titleEn: "",
            titlePT: "",
            contentEn: "",
            contentPT: "",
            effectiveFrom: "",
            createdByAdmin: "",
        });
        setCreateErrors({});
    }

    // ==== DERIVADOS: política atual + histórico + pesquisa local ====
    const currentPolicy = items.find((p) => p.isCurrent);
    const historyPolicies = items.filter((p) => !p.isCurrent);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredHistory = normalizedSearch
        ? historyPolicies.filter((p) => {
            const titleEn = (p as any).titleEn ?? "";
            const composite = [
                String(p.version ?? ""),
                p.titlePT ?? "",
                titleEn,
                p.createdByAdmin ?? "",
                p.effectiveFrom
                    ? p.effectiveFrom.toLocaleDateString()
                    : "",
            ]
                .join(" ")
                .toLowerCase();

            return composite.includes(normalizedSearch);
        })
        : historyPolicies;

    return (
        <div className="pp-page">
            {selected && (
                <>
                    <div className="pp-overlay" onClick={() => setSelected(null)} />
                    <PrivacyPolicySlidePanel
                        policy={selected}
                        onClose={() => setSelected(null)}
                    />
                </>
            )}

            <button className="pp-back-btn" onClick={() => window.history.back()}>
                ←
            </button>

            <header className="pp-header">
                <div>
                    <h1>
                        {t("PrivacyPolicy.title", {
                            defaultValue: "Gestão de Políticas de Privacidade",
                        })}
                    </h1>
                    <p>
                        {t("PrivacyPolicy.count", {
                            count: items.length,
                            defaultValue: "{{count}} políticas registadas",
                        })}
                    </p>
                </div>
                <button
                    className="pp-primary-btn"
                    onClick={handleOpenCreate}
                >
                    {t("PrivacyPolicy.actions.add", {
                        defaultValue: "Nova Política",
                    })}
                </button>
            </header>

            {loading && <div className="pp-loading-bar" />}

            <div className="pp-layout">
                {/* SECÇÃO: POLÍTICA ATUAL EM DESTAQUE */}
                <section className="pp-section-current">
                    <div className="pp-section-header">
                        <div>
                            <h2>
                                {t("PrivacyPolicy.currentSectionTitle", {
                                    defaultValue: "Política atual em vigor",
                                })}
                            </h2>
                            <p>
                                {t("PrivacyPolicy.currentSectionSubtitle", {
                                    defaultValue:
                                        "Esta é a versão mostrada aos utilizadores no portal.",
                                })}
                            </p>
                        </div>
                    </div>

                    {currentPolicy ? (
                        <button
                            type="button"
                            className="pp-current-card"
                            onClick={() => setSelected(currentPolicy)}
                        >
                            <div className="pp-current-card-top">
                                <span className="pp-pill pp-pill-live">
                                    ●{" "}
                                    {t("PrivacyPolicy.current", {
                                        defaultValue: "Atual",
                                    })}
                                </span>
                                <span className="pp-current-version">
                                    {t("PrivacyPolicy.version", {
                                        defaultValue: "Versão",
                                    })}{" "}
                                    {currentPolicy.version}
                                </span>
                            </div>

                            <h3 className="pp-current-title">
                                {currentPolicy.titlePT}
                            </h3>

                            <div className="pp-current-meta">
                                <span>
                                    {t("PrivacyPolicy.effectiveFrom", {
                                        defaultValue: "Efetiva desde",
                                    })}{" "}
                                    <strong>
                                        {currentPolicy.effectiveFrom
                                            ? currentPolicy.effectiveFrom.toLocaleString()
                                            : "—"}
                                    </strong>
                                </span>
                                <span className="pp-dot">•</span>
                                <span>
                                    {t("PrivacyPolicy.createdBy", {
                                        defaultValue: "Criada por",
                                    })}{" "}
                                    <strong>{currentPolicy.createdByAdmin}</strong>
                                </span>
                            </div>

                            <div className="pp-current-footer">
                                <span className="pp-current-badge">
                                    {t("PrivacyPolicy.currentHint", {
                                        defaultValue:
                                            "Clique para ver a política completa",
                                    })}
                                </span>
                                <span className="pp-current-arrow">↗</span>
                            </div>
                        </button>
                    ) : (
                        <div className="pp-empty-current">
                            {t("PrivacyPolicy.noCurrent", {
                                defaultValue:
                                    "Ainda não existe nenhuma política marcada como atual.",
                            })}
                        </div>
                    )}
                </section>

                {/* SECÇÃO: PESQUISA + HISTÓRICO */}
                <section className="pp-section-history">
                    <div className="pp-section-header pp-section-header--row">
                        <div>
                            <h2>
                                {t("PrivacyPolicy.historyTitle", {
                                    defaultValue: "Histórico de versões",
                                })}
                            </h2>
                            <p>
                                {t("PrivacyPolicy.historySubtitle", {
                                    count: filteredHistory.length,
                                    defaultValue:
                                        "A ver {{count}} versão(ões) anterior(es).",
                                })}
                            </p>
                        </div>

                        <div className="pp-search">
                            <input
                                type="search"
                                placeholder={t(
                                    "PrivacyPolicy.searchPlaceholder",
                                    {
                                        defaultValue:
                                            "Procurar por título, versão ou autor...",
                                    }
                                )}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {!loading && filteredHistory.length === 0 ? (
                        <p className="pp-empty-history">
                            {normalizedSearch
                                ? t("PrivacyPolicy.noSearchResults", {
                                    defaultValue:
                                        "Nenhuma política encontrada para essa pesquisa.",
                                })
                                : t("PrivacyPolicy.noHistory", {
                                    defaultValue:
                                        "Ainda não existem versões anteriores.",
                                })}
                        </p>
                    ) : (
                        <PrivacyPolicyCardGrid
                            policies={filteredHistory}
                            loading={loading}
                            onSelect={setSelected}
                        />
                    )}
                </section>
            </div>

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div className="pp-modal-backdrop">
                    <div className="pp-modal">
                        <h2>
                            {t("PrivacyPolicy.modal.addTitle", {
                                defaultValue: "Criar Política de Privacidade",
                            })}
                        </h2>

                        <div className="pp-form">
                            <label>
                                <span>Título EN</span>
                                <input
                                    value={createData.titleEn}
                                    onChange={(e) =>
                                        setCreateData((p) => ({
                                            ...p,
                                            titleEn: e.target.value,
                                        }))
                                    }
                                />
                                {createErrors.titleEn && (
                                    <small className="pp-error">
                                        {createErrors.titleEn}
                                    </small>
                                )}
                            </label>

                            <label>
                                <span>Título PT</span>
                                <input
                                    value={createData.titlePT}
                                    onChange={(e) =>
                                        setCreateData((p) => ({
                                            ...p,
                                            titlePT: e.target.value,
                                        }))
                                    }
                                />
                                {createErrors.titlePT && (
                                    <small className="pp-error">
                                        {createErrors.titlePT}
                                    </small>
                                )}
                            </label>

                            <label>
                                <span>Conteúdo EN</span>

                                <div className="pp-template-bar">
        <span className="pp-template-hint">
            Use the base model with sections 1–8.
        </span>
                                    <button
                                        type="button"
                                        className="pp-template-btn"
                                        onClick={() =>
                                            setCreateData((p) => ({
                                                ...p,
                                                contentEn: PRIVACY_TEMPLATE_EN,
                                            }))
                                        }
                                    >
                                        Use base template
                                    </button>
                                </div>

                                <textarea
                                    value={createData.contentEn}
                                    onChange={(e) =>
                                        setCreateData((p) => ({ ...p, contentEn: e.target.value }))
                                    }
                                    rows={10}
                                />
                                {createErrors.contentEn && (
                                    <small className="pp-error">{createErrors.contentEn}</small>
                                )}
                            </label>


                            <label>
                                <span>Conteúdo PT</span>

                                <div className="pp-template-bar">
                        <span className="pp-template-hint">
                            Segue o modelo base com as secções 1–8.
                        </span>
                                    <button
                                        type="button"
                                        className="pp-template-btn"
                                        onClick={() =>
                                            setCreateData((p) => ({
                                                ...p,
                                                contentPT: PRIVACY_TEMPLATE_PT,
                                            }))
                                        }
                                    >
                                        Usar template base
                                    </button>
                                </div>

                                <textarea
                                    value={createData.contentPT}
                                    onChange={(e) =>
                                        setCreateData((p) => ({ ...p, contentPT: e.target.value }))
                                    }
                                    rows={10}
                                />
                                {createErrors.contentPT && (
                                    <small className="pp-error">{createErrors.contentPT}</small>
                                )}
                            </label>


                            <label>
                                <span>Efetiva desde</span>
                                <input
                                    type="datetime-local"
                                    value={createData.effectiveFrom}
                                    onChange={(e) =>
                                        setCreateData((p) => ({
                                            ...p,
                                            effectiveFrom: e.target.value,
                                        }))
                                    }
                                />
                                {createErrors.effectiveFrom && (
                                    <small className="pp-error">
                                        {createErrors.effectiveFrom}
                                    </small>
                                )}
                            </label>

                            {/* Info do admin atual (só para feedback visual) */}
                            {createData.createdByAdmin && (
                                <div className="pp-created-by-hint">
                                    {t("PrivacyPolicy.createdBy", {
                                        defaultValue: "Criada por",
                                    })}{" "}
                                    <strong>{createData.createdByAdmin}</strong>
                                </div>
                            )}
                        </div>

                        <div className="pp-modal-actions">
                            <button
                                className="pp-secondary-btn"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                {t("common.cancel", { defaultValue: "Cancelar" })}
                            </button>
                            <button
                                className="pp-primary-btn"
                                onClick={handleCreate}
                            >
                                {t("common.save", { defaultValue: "Guardar" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
