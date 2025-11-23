import { FaBuilding } from "react-icons/fa";

interface SAOHeaderProps {
    count: number;
    onOpenCreate: () => void;
    t: any;
}

export default function SAOHeader({ count, onOpenCreate, t }: SAOHeaderProps) {
    return (
        <div className="sao-title-area">
            <div className="sao-title-box">
                <h2 className="sao-title">
                    <FaBuilding className="sao-icon" /> {t("sao.title")}
                </h2>
                <p className="sao-sub">
                    {t("sao.count", { count })}
                </p>
            </div>

            <button
                className="sao-create-btn-top"
                onClick={onOpenCreate}
            >
                + {t("sao.add")}
            </button>
        </div>
    );
}
