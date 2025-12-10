import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import type { DataRightsRequest, RequestStatus } from "../domain/dataRights";

type Props = {
    selected: DataRightsRequest | null;
};

type StepState = "done" | "active" | "pending";

const STATUS_ORDER: RequestStatus[] = [
    "WaitingForAssignment",
    "InProgress",
    "Completed",
    "Rejected",
];
const COMPANY_INFO = {
    name: "ThPA Port Services",
    addressLine1: "Pier A, Thessaloniki Port",
    addressLine2: "54625 Thessaloniki, Greece",
    phone: "+30 2310 000 000",
    email: "privacy@thpa-port.gr",
};

const TEAM_LOGO_URL = "client-ui/public/Logoo.png";




const STATUS_STEPS: {
    id: RequestStatus;
    icon: string;
    labelKey: string;
    defaultLabel: string;
}[] = [
    {
        id: "WaitingForAssignment",
        icon: "⏳",
        labelKey: "dataRights.timeline.waiting",
        defaultLabel: "Waiting for assignment",
    },
    {
        id: "InProgress",
        icon: "🛠️",
        labelKey: "dataRights.timeline.inProgress",
        defaultLabel: "In progress",
    },
    {
        id: "Completed",
        icon: "✅",
        labelKey: "dataRights.timeline.completed",
        defaultLabel: "Completed",
    },
    {
        id: "Rejected",
        icon: "❌",
        labelKey: "dataRights.timeline.rejected",
        defaultLabel: "Rejected",
    },
];

function getStepState(step: RequestStatus, current: RequestStatus): StepState {
    if (step === current) return "active";

    // regra especial: se está Rejected, o Completed não fica "done"
    if (current === "Rejected" && step === "Completed") return "pending";

    const stepIndex = STATUS_ORDER.indexOf(step);
    const currentIndex = STATUS_ORDER.indexOf(current);

    if (stepIndex === -1 || currentIndex === -1) return "pending";
    return currentIndex > stepIndex ? "done" : "pending";
}

export function DataRightsMainPanel({ selected }: Props) {
    const { t } = useTranslation();

    if (!selected) {
        return (
            <div className="dr-main-panel dr-main-empty">
                <div className="dr-ghost-card bounce-in">
                    <span className="dr-ghost-emoji">👆</span>
                    <p>
                        {t(
                            "dataRights.main.selectHint",
                            "Select a request above to see the details.",
                        )}
                    </p>
                </div>
            </div>
        );
    }

    const created = new Date(
        (selected.createdOn as any).value ?? selected.createdOn,
    ).toLocaleString();
    const updated = selected.updatedOn
        ? new Date(
            (selected.updatedOn as any).value ?? selected.updatedOn,
        ).toLocaleString()
        : "-";

    const handleDownloadPdf = () => {
        if (!selected.payload) return;

        let data: any;
        try {
            data = JSON.parse(selected.payload);
        } catch (e) {
            console.error("Invalid JSON payload", e);
            return;
        }

        // função que realmente constrói o PDF (é chamada depois do logo carregar)
        const buildPdf = (logoImg?: HTMLImageElement) => {
            const doc = new jsPDF({
                unit: "pt",
                format: "a4",
            });

            const marginX = 50;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let y = 60;

            const addLines = (
                text: string,
                options?: { bold?: boolean; size?: number; color?: number[] },
            ) => {
                const maxWidth = pageWidth - marginX * 2;
                if (options?.size) doc.setFontSize(options.size);
                //if (options?.color) doc.setTextColor(...options.color);
                else doc.setTextColor(0, 0, 0);

                doc.setFont(
                    "helvetica",
                    options?.bold ? "bold" : "normal",
                );

                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach((line: string | string[]) => {
                    if (y > pageHeight - 80) {
                        doc.addPage();
                        y = 60;
                    }
                    doc.text(line, marginX, y);
                    y += 16;
                });
            };

            // ========= CABEÇALHO =========
            // logo da equipa no canto esquerdo
            if (logoImg) {
                const logoWidth = 110;
                const ratio = logoImg.height / logoImg.width || 1;
                const logoHeight = logoWidth * ratio;
                doc.addImage(
                    logoImg,
                    "PNG",
                    marginX,
                    y - 20,
                    logoWidth,
                    logoHeight,
                );
            }

            // info da empresa no topo à direita
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            const rightBlockX = marginX + 140;
            doc.text(COMPANY_INFO.name, rightBlockX, y);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(COMPANY_INFO.addressLine1, rightBlockX, y + 16);
            doc.text(COMPANY_INFO.addressLine2, rightBlockX, y + 30);
            doc.text(
                `Tel: ${COMPANY_INFO.phone}`,
                rightBlockX,
                y + 44,
            );
            doc.text(
                `Email: ${COMPANY_INFO.email}`,
                rightBlockX,
                y + 58,
            );

            y += 90;

            // título principal
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("Data Rights Request", marginX, y);
            y += 26;

            // ========= META DO PEDIDO =========
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");

            addLines(`Request ID: ${selected.requestId}`);
            addLines(`Type: ${selected.type}`);
            addLines(`Status: ${selected.status}`);
            addLines(`Created at: ${new Date(
                (selected.createdOn as any).value ?? selected.createdOn,
            ).toLocaleString()}`);
            addLines(
                `Last update: ${
                    selected.updatedOn
                        ? new Date(
                            (selected.updatedOn as any).value ??
                            selected.updatedOn,
                        ).toLocaleString()
                        : "-"
                }`,
            );
            addLines(
                `Processed by: ${selected.processedBy ?? "—"}`,
            );

            // Foto do utilizador (se existir Picture data URL)
            const picture =
                data.Picture ?? data.picture ?? data.photo ?? null;
            if (
                typeof picture === "string" &&
                picture.startsWith("data:image")
            ) {
                try {
                    const imgMeta = picture.substring(
                        5,
                        picture.indexOf(";"),
                    ); // "image/jpeg"
                    const format = imgMeta.includes("png")
                        ? "PNG"
                        : "JPEG";

                    const imgX = pageWidth - marginX - 120;
                    const imgY = 90;
                    const imgSize = 110;

                    doc.addImage(
                        picture,
                        format,
                        imgX,
                        imgY,
                        imgSize,
                        imgSize,
                    );
                } catch (e) {
                    console.warn("Could not add picture to PDF", e);
                }
            }

            // linha separadora
            y += 10;
            doc.setDrawColor(200);
            doc.line(marginX, y, pageWidth - marginX, y);
            y += 28;

            // ========= SYSTEM DATA =========
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            addLines("System data", {
                bold: true,
                size: 13,
            });
            y += 4;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);

            const entries = Object.entries(data).filter(
                ([key]) =>
                    key.toLowerCase() !== "picture" &&
                    key.toLowerCase() !== "avatar",
            );

            for (const [key, value] of entries) {
                const valStr =
                    typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value);

                // chave em bold numa linha, valor na linha seguinte
                doc.setFont("helvetica", "bold");
                addLines(`${key}:`, { bold: true });
                doc.setFont("helvetica", "normal");
                addLines(valStr);
                y += 4;
            }
            

            // pequeno logo da equipa junto à assinatura (se existir)
            if (logoImg) {
                const smallW = 80;
                const ratio = logoImg.height / logoImg.width || 1;
                const smallH = smallW * ratio;
                doc.addImage(
                    logoImg,
                    "PNG",
                    pageWidth - marginX - smallW,
                    y - smallH,
                    smallW,
                    smallH,
                );
            }

            // ========= FOOTER EM TODAS AS PÁGINAS =========
            const footerText =
                "ThPA Port Services – Smart Port Operations Platform";
            const generatedText = `Generated on: ${new Date().toLocaleString()}`;

            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                const h = doc.internal.pageSize.getHeight();
                doc.setFontSize(8);
                doc.setTextColor(120);
                doc.setFont("helvetica", "normal");

                doc.text(footerText, marginX, h - 28);
                doc.text(
                    generatedText,
                    marginX,
                    h - 16,
                );
                doc.text(
                    `Page ${i} / ${pageCount}`,
                    pageWidth - marginX,
                    h - 16,
                    { align: "right" } as any,
                );
            }

            doc.save(`${selected.requestId}.pdf`);
        };

        // Carregar logo da equipa (async) e depois gerar PDF
        if (TEAM_LOGO_URL) {
            const logoImg = new Image();
            logoImg.src = TEAM_LOGO_URL;
            logoImg.onload = () => buildPdf(logoImg);
            logoImg.onerror = () => buildPdf();
        } else {
            buildPdf();
        }
    };


    return (
        <div className="dr-main-panel">
            <div className="dr-card-large fade-in">
                <h2 className="dr-card-title">
                    🔎 {t("dataRights.main.details", "Request details")}
                </h2>

                <p className="dr-card-subtitle">
                    {t("dataRights.main.requestId", "Request ID")}:{" "}
                    <strong>{selected.requestId}</strong>
                </p>

                <div className="dr-grid">
                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.type", "Type")}
                        </span>
                        <span className="dr-value dr-pill">
                            {selected.type === "Access" && "📄 "}
                            {selected.type === "Deletion" && "🧹 "}
                            {selected.type === "Rectification" && "✏️ "}
                            {selected.type}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.status", "Status")}
                        </span>
                        <span
                            className={`dr-value dr-pill dr-${selected.status}`}
                        >
                            {selected.status}
                        </span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.createdOn", "Created at")}
                        </span>
                        <span className="dr-value">{created}</span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.updatedOn", "Last update")}
                        </span>
                        <span className="dr-value">{updated}</span>
                    </div>

                    <div className="dr-field">
                        <span className="dr-label">
                            {t("dataRights.main.processedBy", "Processed by")}
                        </span>
                        <span className="dr-value">
                            {selected.processedBy ?? "—"}
                        </span>
                    </div>
                </div>

                {/* TIMELINE DE ESTADO */}
                <div className="dr-status-timeline">
                    {STATUS_STEPS.map(step => {
                        const state = getStepState(step.id, selected.status);
                        const isRejectStep = step.id === "Rejected";

                        return (
                            <div
                                key={step.id}
                                className={[
                                    "dr-status-step",
                                    `dr-status-${state}`,
                                    isRejectStep ? "dr-status-step-reject" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                <div className="dr-status-dot">
                                    <span className="dr-status-icon">
                                        {step.icon}
                                    </span>
                                </div>
                                <span className="dr-status-label">
                                    {t(step.labelKey, step.defaultLabel)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {selected.payload && (
                    <div className="dr-payload-box">
                        <div className="dr-payload-header">
                            <h3 className="dr-label">
                                {t(
                                    "dataRights.main.payload",
                                    "Payload / system data",
                                )}
                            </h3>

                            <button
                                type="button"
                                className="dr-pdf-btn"
                                onClick={handleDownloadPdf}
                            >
                                ⬇ <span>Download PDF</span>
                            </button>
                        </div>

                        <pre className="dr-payload">
                            {JSON.stringify(
                                JSON.parse(selected.payload),
                                null,
                                2,
                            )}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
