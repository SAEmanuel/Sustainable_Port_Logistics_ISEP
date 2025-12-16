import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import IncidentTypeCreateModal from "../components/IncidentTypeCreateModal";
import * as incidentTypeService from "../services/incidentTypeService"; // Importar para mockar

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-hot-toast", () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

describe("IncidentTypeCreateModal", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("não renderiza nada se isOpen for false", () => {
        render(<IncidentTypeCreateModal isOpen={false} onClose={vi.fn()} onCreated={vi.fn()} />);
        const title = screen.queryByText("incidentType.createModal.title");
        expect(title).toBeNull();
    });

    it("renderiza passo 1 (Parent Selection) ao abrir", async () => {
        // Mock do getRoots que é chamado no useEffect
        vi.spyOn(incidentTypeService, "getIncidentTypeRoots").mockResolvedValue([]);

        render(<IncidentTypeCreateModal isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />);

        // Título do passo 1
        expect(screen.getByText("incidentType.steps.parent")).toBeTruthy();
        // Opção "None" (Root)
        expect(screen.getByText("incidentType.parent.none")).toBeTruthy();
    });

    it("avança para passo 2 e submete formulário com sucesso", async () => {
        vi.spyOn(incidentTypeService, "getIncidentTypeRoots").mockResolvedValue([]);
        const createSpy = vi.spyOn(incidentTypeService, "createIncidentType").mockResolvedValue({} as never);
        const onCreated = vi.fn();

        render(<IncidentTypeCreateModal isOpen={true} onClose={vi.fn()} onCreated={onCreated} />);

        // Passo 1: Selecionar "None" (já é default) e clicar Next
        const nextBtn = screen.getByText("actions.next");
        fireEvent.click(nextBtn);

        // Passo 2: Preencher formulário
        expect(screen.getByText("incidentType.steps.details")).toBeTruthy();

        fireEvent.change(screen.getByPlaceholderText("incidentType.form.codePH"), { target: { value: "T-INC999" } });
        fireEvent.change(screen.getByPlaceholderText("incidentType.form.namePH"), { target: { value: "New Type" } });

        const submitBtn = screen.getByText("actions.create");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
                code: "T-INC999",
                name: "New Type",
                parentCode: null
            }));
            expect(onCreated).toHaveBeenCalled();
        });
    });

    it("mostra erro se submissão falhar", async () => {
        vi.spyOn(incidentTypeService, "getIncidentTypeRoots").mockResolvedValue([]);
        vi.spyOn(incidentTypeService, "createIncidentType").mockRejectedValue(new Error("API Error"));

        render(<IncidentTypeCreateModal isOpen={true} onClose={vi.fn()} onCreated={vi.fn()} />);

        // Ir para passo 2
        fireEvent.click(screen.getByText("actions.next"));

        // Preencher dados mínimos
        fireEvent.change(screen.getByPlaceholderText("incidentType.form.codePH"), { target: { value: "FAIL" } });
        fireEvent.change(screen.getByPlaceholderText("incidentType.form.namePH"), { target: { value: "Name" } });

        // Submeter
        fireEvent.click(screen.getByText("actions.create"));

        await waitFor(() => {
            expect(screen.getByText("API Error")).toBeTruthy();
        });
    });
});