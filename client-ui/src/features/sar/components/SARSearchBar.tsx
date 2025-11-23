interface SARSearchBarProps {
  t: any;
  searchMode: "email" | "name";
  setSearchMode: (mode: "email" | "name") => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onClearSearch: () => void;
  onExecuteSearch: () => void;
}

export default function SARSearchBar({
  t,
  searchMode,
  setSearchMode,
  searchValue,
  onSearchValueChange,
  onClearSearch,
  onExecuteSearch,
}: SARSearchBarProps) {
  return (
    <>
      {/* Search mode */}
      <div className="vt-search-mode">
        {t("sar.searchMode")}
        <button
          className={searchMode === "email" ? "active" : ""}
          onClick={() => setSearchMode("email")}
        >
          {t("sar.searchByEmailButton")}
        </button>
        <button
          className={searchMode === "name" ? "active" : ""}
          onClick={() => setSearchMode("name")}
        >
          {t("sar.searchByNameButton") ?? "Name"}
        </button>
      </div>

      {/* Search box */}
      <div className="vt-search-box">
        <div className="vt-search-wrapper">
          <input
            placeholder={t("sar.searchPlaceholder")}
            className="vt-search"
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onExecuteSearch()}
          />
          {searchValue && (
            <button
              className="vt-clear-input"
              onClick={onClearSearch}
            >
              ✕
            </button>
          )}
        </div>
        <button className="vt-search-btn" onClick={onExecuteSearch}>
          🔍
        </button>
      </div>
    </>
  );
}
