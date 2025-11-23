import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PhysicalResourceCreateModal from "../../components/PhysicalResourceCreateModal";
import * as service from "../../services/physicalResourceService";
import * as qualifService from "../../../qualifications/services/qualificationService";

import type { PhysicalResource } from "../../domain/physicalResource";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-hot-toast", () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

const mockCreate = vi.spyOn(service, "createPhysicalResource");
const mockGetQualifs = vi.spyOn(qualifService, "getQualifications");

describe("PhysicalResourceCreateModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreate.mockResolvedValue({} as unknown as PhysicalResource);
        mockGetQualifs.mockResolvedValue([]);
    });

    it("não renderiza nada se isOpen = false", () => {
        const { container } = render(
            <PhysicalResourceCreateModal isOpen={false} onClose={() => {}} onCreated={() => {}} />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renderiza o passo 1 quando aberto", async () => {
        render(<PhysicalResourceCreateModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);

        await waitFor(() => expect(mockGetQualifs).toHaveBeenCalled());

        expect(screen.getByText("physicalResource.steps.selectTypePrompt")).toBeTruthy();
    });

    it("fluxo completo de criação", async () => {
        const onCreated = vi.fn();
        render(<PhysicalResourceCreateModal isOpen={true} onClose={() => {}} onCreated={onCreated} />);

        await waitFor(() => expect(mockGetQualifs).toHaveBeenCalled());

        // Passo 1: Selecionar Tipo
        const typeBtn = screen.getByText("physicalResource.types.Truck");
        fireEvent.click(typeBtn);

        // Passo 2: Preencher Detalhes

        // 1. Descrição
        const descInput = screen.getByLabelText("physicalResource.form.description");
        fireEvent.change(descInput, { target: { value: "New Truck" } });

        // 2. Capacidade (Obrigatório pela nova validação)
        const capInput = screen.getByLabelText("physicalResource.form.operationalCapacity");
        fireEvent.change(capInput, { target: { value: "100" } });

        // 3. Setup Time (Obrigatório pela nova validação)
        const setupInput = screen.getByLabelText("physicalResource.form.setupTime");
        fireEvent.change(setupInput, { target: { value: "10" } });

        // Clicar em Next
        const nextBtn = screen.getByText("physicalResource.actions.next");
        fireEvent.click(nextBtn);

        // Passo 3: Botão Criar (Agora deve aparecer porque passámos do passo 2)
        const createBtn = screen.getByText("physicalResource.actions.create");
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                description: "New Truck",
                operationalCapacity: 100,
                setupTime: 10
            }));
            expect(onCreated).toHaveBeenCalled();
        });
    });
});