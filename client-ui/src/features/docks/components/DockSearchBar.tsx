import type { FC, KeyboardEvent, ChangeEvent } from "react";
import { FaSearch } from "react-icons/fa";

type DockSearchBarProps = {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    onClear: () => void;
};

export const DockSearchBar: FC<DockSearchBarProps> = ({
                                                          value,
                                                          placeholder,
                                                          onChange,
                                                          onSearch,
                                                          onClear,
                                                      }) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onSearch();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="dk-search-box">
            <div className="dk-search-wrapper">
                <input
                    placeholder={placeholder}
                    className="dk-search"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                {value !== "" && (
                    <button className="dk-clear-input" onClick={onClear}>
                        ✕
                    </button>
                )}
            </div>
            <button className="dk-search-btn" onClick={onSearch}>
                <FaSearch />
            </button>
        </div>
    );
};
