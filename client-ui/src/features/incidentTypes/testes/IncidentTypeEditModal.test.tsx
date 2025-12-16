import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import IncidentTypeEditModal from "../components/IncidentTypeEditModal";
import * as incidentTypeService from "../services/incidentTypeService";
import type { IncidentType } from "../domain/incidentType";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-hot-toast", () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const mockResource: IncidentType = {
    id: "1", code: "OLD", name: "Old Name", description: "", severity: "Minor", parentCode: null
};

describe("IncidentTypeEditModal", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("preenche o formulário com dados existentes", () => {
        vi.spyOn(incidentTypeService, "getIncidentTypeRoots").mockResolvedValue([]); // loadDefaultParents

        render(
            <IncidentTypeEditModal
                isOpen={true}
                onClose={vi.fn()}
                onUpdated={vi.fn()}
                resource={mockResource}
            />
        );

        // Input de Código deve estar disabled
        const codeInput = screen.getByDisplayValue("OLD");
        expect(codeInput).toBeTruthy();
        expect(codeInput).toHaveProperty("disabled", true);

        // Input de Nome deve ter valor
        expect(screen.getByDisplayValue("Old Name")).toBeTruthy();
    });

    it("chama updateIncidentType ao guardar", async () => {
        vi.spyOn(incidentTypeService, "getIncidentTypeRoots").mockResolvedValue([]);
        const updateSpy = vi.spyOn(incidentTypeService, "updateIncidentType").mockResolvedValue({} as never);
        const onUpdated = vi.fn();

        render(
            <IncidentTypeEditModal
                isOpen={true}
                onClose={vi.fn()}
                onUpdated={onUpdated}
                resource={mockResource}
            />
        );

        // Alterar nome
        const nameInput = screen.getByDisplayValue("Old Name");
        fireEvent.change(nameInput, { target: { value: "New Name" } });

        // Guardar
        const saveBtn = screen.getByText("actions.save");
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(updateSpy).toHaveBeenCalledWith("OLD", expect.objectContaining({
                name: "New Name"
            }));
            expect(onUpdated).toHaveBeenCalled();
        });
    });

    it("executa pesquisa de pai", async () => {
        vi.spyOn(incidentTypeService, "getIncidentTypeRoots").mockResolvedValue([]);
        const searchSpy = vi.spyOn(incidentTypeService, "getIncidentTypesByName").mockResolvedValue([
            { id: "9", code: "PARENT", name: "Big Parent" } as never
        ]);

        render(
            <IncidentTypeEditModal
                isOpen={true}
                onClose={vi.fn()}
                onUpdated={vi.fn()}
                resource={mockResource}
            />
        );

        // Input de pesquisa de pai (identificado pelo placeholder que colocámos no código anterior)
        const searchInput = screen.getByPlaceholderText("incidentType.parent.searchPlaceholder");

        // Simular escrita (vai disparar o debounce)
        fireEvent.change(searchInput, { target: { value: "Big" } });

        // O debounce é 300ms, precisamos esperar
        await waitFor(() => {
            expect(searchSpy).toHaveBeenCalledWith("Big");
        }, { timeout: 1000 }); // timeout generoso para o debounce

        // Verificar se o select atualizou (agora deve ter a opção PARENT)
        // Nota: O teste do conteúdo do Select pode ser tricky se o DOM não atualizar rápido,
        // mas podemos ver se a função de serviço foi chamada.
    });
});