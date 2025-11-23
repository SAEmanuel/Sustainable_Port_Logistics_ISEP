import type { ReactNode } from "react";

interface SARHeaderProps {
  t: any;
  totalItems: number;
  onCreateClick: () => void;
  icon?: ReactNode;
}

export default function SARHeader({
  t,
  totalItems,
  onCreateClick,
  icon,
}: SARHeaderProps) {
  return (
    <div className="vt-title-area">
      <div className="vt-title-box">
        <h2 className="vt-title">
          {icon} {t("sar.title")}
        </h2>
        <p className="vt-sub">{t("sar.count", { count: totalItems })}</p>
      </div>
      <button
        className="vt-create-btn-top"
        onClick={onCreateClick}
      >
        + {t("sar.add")}
      </button>
    </div>
  );
}
