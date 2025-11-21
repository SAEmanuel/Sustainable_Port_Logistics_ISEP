import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VesselSearchBar } from "../components/VesselSearchBar";

describe("VesselSearchBar", () => {
    it("mostra modos de pesquisa e começa em local", () => {
        const setSearchMode = vi.fn();

        render(
            <VesselSearchBar
                searchMode={"local"}
                setSearchMode={setSearchMode}
                searchValue=""
                setSearchValue={() => {}}
                onSearch={() => {}}
                resetFilter={() => {}}
            />
        );

        const localBtn = screen.getByText("Vessel.modes.local");
        const imoBtn = screen.getByText("Vessel.modes.imo");

        expect(localBtn.className).toContain("active");
        expect(imoBtn.className).not.toContain("active");
    });

    it("clicar num modo chama setSearchMode", () => {
        const setSearchMode = vi.fn();

        render(
            <VesselSearchBar
                searchMode={"local"}
                setSearchMode={setSearchMode}
                searchValue=""
                setSearchValue={() => {}}
                onSearch={() => {}}
                resetFilter={() => {}}
            />
        );

        const imoBtn = screen.getByText("Vessel.modes.imo");
        fireEvent.click(imoBtn);

        expect(setSearchMode).toHaveBeenCalledWith("imo");
    });

    it("clicar no botão Search chama onSearch", () => {
        const onSearch = vi.fn();

        const { container } = render(
            <VesselSearchBar
                searchMode={"local"}
                setSearchMode={() => {}}
                searchValue="ever"
                setSearchValue={() => {}}
                onSearch={onSearch}
                resetFilter={() => {}}
            />
        );

        const searchBtn = container.querySelector(
            ".vt-search-btn"
        ) as HTMLButtonElement;

        fireEvent.click(searchBtn);

        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it("botão de limpar (✕) chama resetFilter e limpa o valor", () => {
        const setSearchValue = vi.fn();
        const resetFilter = vi.fn();

        render(
            <VesselSearchBar
                searchMode={"local"}
                setSearchMode={() => {}}
                searchValue="abc"
                setSearchValue={setSearchValue}
                onSearch={() => {}}
                resetFilter={resetFilter}
            />
        );

        const clearBtn = screen.getByText("✕");
        fireEvent.click(clearBtn);

        expect(setSearchValue).toHaveBeenCalledWith("");
        expect(resetFilter).toHaveBeenCalledTimes(1);
    });
});
