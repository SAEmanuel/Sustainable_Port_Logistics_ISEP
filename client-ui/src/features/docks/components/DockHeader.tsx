import { FaAnchor, FaPlus } from "react-icons/fa";
import type { FC } from "react";

type DockHeaderProps = {
    count: number;
    onCreateClick: () => void;
    title: string;
    subtitle: string;
};

export const DockHeader: FC<DockHeaderProps> = ({
                                                    count,
                                                    onCreateClick,
                                                    title,
                                                    subtitle,
                                                }) => {
    return (
        <div className="dk-title-area">
            <div>
                <h2 className="dk-title">
                    <FaAnchor /> {title}
                </h2>
                <p className="dk-sub">
                    {subtitle.replace("{{count}}", String(count))}
                </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <button className="dk-create-btn-top" onClick={onCreateClick}>
                    <FaPlus /> Adicionar Dock
                </button>
            </div>
        </div>
    );
};
