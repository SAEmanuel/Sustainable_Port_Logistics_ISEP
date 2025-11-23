import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PhysicalResourceSearch from "../../components/PhysicalResourceSearch.tsx";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("react-hot-toast", () => ({
    default: { error: vi.fn() },
}));

describe("PhysicalResourceSearch", () => {
    it("renderiza o select de tipo e input padrão", () => {
        render(<PhysicalResourceSearch onSearch={() => {}} />);
        expect(screen.getByLabelText("physicalResource.searchBy.title")).toBeTruthy();
        expect(screen.getByPlaceholderText("physicalResource.searchBy.code")).toBeTruthy();
    });

    it("mudar o tipo de filtro atualiza o input", () => {
        render(<PhysicalResourceSearch onSearch={() => {}} />);
        const typeSelect = screen.getByLabelText("physicalResource.searchBy.title");

        fireEvent.change(typeSelect, { target: { value: "type" } });

        const selectInput = screen.getByDisplayValue("physicalResource.form.selectOption");
        expect(selectInput.tagName).toBe("SELECT");
    });

    it("submeter o form chama onSearch", () => {
        const onSearch = vi.fn();
        render(<PhysicalResourceSearch onSearch={onSearch} />);

        const input = screen.getByPlaceholderText("physicalResource.searchBy.code");
        fireEvent.change(input, { target: { value: "ABC" } });

        const searchBtn = screen.getByText("physicalResource.actions.search");
        fireEvent.click(searchBtn);

        expect(onSearch).toHaveBeenCalledWith("code", "ABC");
    });

    it("botão Limpar reseta o filtro", () => {
        const onSearch = vi.fn();
        render(<PhysicalResourceSearch onSearch={onSearch} />);

        const clearBtn = screen.getByText("physicalResource.actions.clear");
        fireEvent.click(clearBtn);

        expect(onSearch).toHaveBeenCalledWith("all", "");
    });
});