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
// import { PrivacyPolicyCreateModal } from "../components/PrivacyPolicyCreateModal"; // se quiseres modal

import "../style/privacypolicy.css";

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

export default function PrivacyPolicyPage() {
    const { t } = useTranslation();

    const [items, setItems] = useState<PrivacyPolicy[]>([]);
    const [loading, setLoading] = useState(true);

    const [selected, setSelected] = useState<PrivacyPolicy | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

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

                // opcional: ordenar por data desc
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
        if (!createData.createdByAdmin.trim())
            next.createdByAdmin = t("PrivacyPolicy.errors.createdByRequired", {
                defaultValue: "Nome do administrador é obrigatório",
            });

        setCreateErrors(next);
        return Object.keys(next).length === 0;
    }

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

    return (
        <div className="pp-page">
            {selected && (
                <div className="pp-overlay" onClick={() => setSelected(null)} />
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
                    onClick={() => {
                        setCreateErrors({});
                        setIsCreateOpen(true);
                    }}
                >
                    {t("PrivacyPolicy.actions.add", {
                        defaultValue: "Nova Política",
                    })}
                </button>
            </header>

            <PrivacyPolicyCardGrid
                policies={items}
                loading={loading}
                onSelect={setSelected}
            />

            {/* Aqui podes pôr um SlidePanel ou Modal para ver a política completa */}
            {/* {selected && (
          <PrivacyPolicySlidePanel
            policy={selected}
            onClose={() => setSelected(null)}
          />
      )} */}

            {/* CREATE MODAL (podes trocar por componente próprio como nas docks) */}
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
                                        setCreateData((p) => ({ ...p, titleEn: e.target.value }))
                                    }
                                />
                                {createErrors.titleEn && (
                                    <small className="pp-error">{createErrors.titleEn}</small>
                                )}
                            </label>

                            <label>
                                <span>Título PT</span>
                                <input
                                    value={createData.titlePT}
                                    onChange={(e) =>
                                        setCreateData((p) => ({ ...p, titlePT: e.target.value }))
                                    }
                                />
                                {createErrors.titlePT && (
                                    <small className="pp-error">{createErrors.titlePT}</small>
                                )}
                            </label>

                            <label>
                                <span>Conteúdo EN</span>
                                <textarea
                                    value={createData.contentEn}
                                    onChange={(e) =>
                                        setCreateData((p) => ({ ...p, contentEn: e.target.value }))
                                    }
                                />
                                {createErrors.contentEn && (
                                    <small className="pp-error">{createErrors.contentEn}</small>
                                )}
                            </label>

                            <label>
                                <span>Conteúdo PT</span>
                                <textarea
                                    value={createData.contentPT}
                                    onChange={(e) =>
                                        setCreateData((p) => ({ ...p, contentPT: e.target.value }))
                                    }
                                />
                                {createErrors.contentPT && (
                                    <small className="pp-error">{createErrors.contentPT}</small>
                                )}
                            </label>

                            <label>
                                <span>Efetiva desde</span>
                                <input
                                    type="date"
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

                            <label>
                                <span>Criada por</span>
                                <input
                                    value={createData.createdByAdmin}
                                    onChange={(e) =>
                                        setCreateData((p) => ({
                                            ...p,
                                            createdByAdmin: e.target.value,
                                        }))
                                    }
                                />
                                {createErrors.createdByAdmin && (
                                    <small className="pp-error">
                                        {createErrors.createdByAdmin}
                                    </small>
                                )}
                            </label>
                        </div>

                        <div className="pp-modal-actions">
                            <button
                                className="pp-secondary-btn"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                {t("common.cancel", { defaultValue: "Cancelar" })}
                            </button>
                            <button className="pp-primary-btn" onClick={handleCreate}>
                                {t("common.save", { defaultValue: "Guardar" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
