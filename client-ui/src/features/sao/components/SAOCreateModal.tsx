interface SAOCreateModalProps {
    isOpen: boolean;
    legalName: string;
    altName: string;
    address: string;
    taxnumber: string;
    onChangeLegalName: (value: string) => void;
    onChangeAltName: (value: string) => void;
    onChangeAddress: (value: string) => void;
    onChangeTaxnumber: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    t: any;
}

export default function SAOCreateModal({
    isOpen,
    legalName,
    altName,
    address,
    taxnumber,
    onChangeLegalName,
    onChangeAltName,
    onChangeAddress,
    onChangeTaxnumber,
    onSave,
    onCancel,
    t
}: SAOCreateModalProps) {
    if (!isOpen) return null;

    return (
        <div className="sao-modal-overlay">
            <div className="sao-modal">
                <h3>{t("sao.add")}</h3>

                <label>{t("sao.details.legalName")} *</label>
                <input
                    className="sao-input"
                    value={legalName}
                    onChange={e => onChangeLegalName(e.target.value)}
                />

                <label>{t("sao.details.altName")}</label>
                <input
                    className="sao-input"
                    value={altName}
                    onChange={e => onChangeAltName(e.target.value)}
                />

                <label>{t("sao.details.address")}</label>
                <input
                    className="sao-input"
                    value={address}
                    onChange={e => onChangeAddress(e.target.value)}
                />

                <label>{t("sao.details.taxnumber")} *</label>
                <input
                    className="sao-input"
                    value={taxnumber}
                    onChange={e => onChangeTaxnumber(e.target.value)}
                />

                <div className="sao-modal-actions">
                    <button
                        className="sao-btn-cancel"
                        onClick={onCancel}
                    >
                        {t("sao.cancel")}
                    </button>
                    <button
                        className="sao-btn-save"
                        onClick={onSave}
                    >
                        {t("sao.save")}
                    </button>
                </div>
            </div>
        </div>
    );
}
