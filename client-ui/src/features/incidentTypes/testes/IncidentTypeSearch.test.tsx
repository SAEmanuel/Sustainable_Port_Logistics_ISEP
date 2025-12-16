import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import IncidentTypeSearch from "../components/IncidentTypeSearch";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock do toast
vi.mock("react-hot-toast", () => ({
    default: { error: vi.fn() },
}));

describe("IncidentTypeSearch", () => {
    it("renderiza o select de tipos de filtro", () => {
        render(<IncidentTypeSearch onSearch={vi.fn()} />);
        // Verifica se as opções existem (pelo value)
        expect(screen.getByDisplayValue("incidentType.search.roots")).toBeTruthy();
    });

    it("esconde o input de texto quando filtro é 'roots'", () => {
        render(<IncidentTypeSearch onSearch={vi.fn()} />);
        const input = screen.queryByPlaceholderText(/incidentType.searchPlaceholder/);
        expect(input).toBeNull();
    });

    it("mostra input de texto quando filtro é 'name'", () => {
        render(<IncidentTypeSearch onSearch={vi.fn()} />);

        const select = screen.getByRole("combobox");
        fireEvent.change(select, { target: { value: "name" } });

        const input = screen.getByPlaceholderText("incidentType.searchPlaceholder.name");
        expect(input).toBeTruthy();
    });

    it("chama onSearch ao submeter formulário", () => {
        const onSearch = vi.fn();
        render(<IncidentTypeSearch onSearch={onSearch} />);

        // Mudar para pesquisa por nome
        const select = screen.getByRole("combobox");
        fireEvent.change(select, { target: { value: "name" } });

        // Escrever texto
        const input = screen.getByPlaceholderText("incidentType.searchPlaceholder.name");
        fireEvent.change(input, { target: { value: "Fire" } });

        // Clicar em Search
        const btn = screen.getByText("actions.search");
        fireEvent.click(btn);

        expect(onSearch).toHaveBeenCalledWith("name", "Fire");
    });

    it("chama onSearch com reset ao clicar em Clear", () => {
        const onSearch = vi.fn();
        render(<IncidentTypeSearch onSearch={onSearch} />);

        const btnClear = screen.getByText("actions.clear");
        fireEvent.click(btnClear);

        expect(onSearch).toHaveBeenCalledWith("roots", "");
    });
});