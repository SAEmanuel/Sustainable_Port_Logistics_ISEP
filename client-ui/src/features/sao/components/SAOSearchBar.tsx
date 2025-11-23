export type SearchMode = "legalName" | "taxnumber";

interface SAOSearchBarProps {
    searchMode: SearchMode;
    searchValue: string;
    onChangeSearchMode: (mode: SearchMode) => void;
    onChangeSearchValue: (value: string) => void;
    onSearch: () => void;
    onClearResults: () => void;
    t: any;
}

export default function SAOSearchBar({
    searchMode,
    searchValue,
    onChangeSearchMode,
    onChangeSearchValue,
    onSearch,
    onClearResults,
    t
}: SAOSearchBarProps) {
    return (
        <>
            {/* BOTÕES DE MODO DE PESQUISA */}
            <div className="sao-search-mode">
                {t("sao.searchMode")}
                <button
                    className={searchMode === "legalName" ? "active" : ""}
                    onClick={() => onChangeSearchMode("legalName")}
                >
                    {t("sao.details.legalName")}
                </button>
                <button
                    className={searchMode === "taxnumber" ? "active" : ""}
                    onClick={() => onChangeSearchMode("taxnumber")}
                >
                    {t("sao.details.taxnumber")}
                </button>
            </div>

            {/* INPUT DE PESQUISA */}
            <div className="sao-search-box">
                <div className="sao-search-wrapper">
                    <input
                        placeholder={t("sao.searchPlaceholder")}
                        className="sao-search"
                        value={searchValue}
                        onChange={e => {
                            const value = e.target.value;
                            onChangeSearchValue(value);
                            if (value === "") {
                                onClearResults();
                            }
                        }}
                        onKeyDown={e => e.key === "Enter" && onSearch()}
                    />
                    {searchValue !== "" && (
                        <button
                            className="sao-clear-input"
                            onClick={() => {
                                onChangeSearchValue("");
                                onClearResults();
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <button className="sao-search-btn" onClick={onSearch}>
                    🔍
                </button>
            </div>
        </>
    );
}
