import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PhysicalResourceTable from "../../components/PhysicalResourceTable.tsx";
import { type PhysicalResource, PhysicalResourceType, PhysicalResourceStatus } from "../../domain/physicalResource.ts";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

const sampleResources: PhysicalResource[] = [
    {
        id: "1",
        code: { value: "RES-001" },
        description: "Empilhadeira Principal",
        physicalResourceType: PhysicalResourceType.Forklift,
        physicalResourceStatus: PhysicalResourceStatus.Available,
        operationalCapacity: 100,
        setupTime: 10,
        qualificationID: null
    },
    {
        id: "2",
        code: { value: "RES-002" },
        description: "Camião de Transporte",
        physicalResourceType: PhysicalResourceType.Truck,
        physicalResourceStatus: PhysicalResourceStatus.Unavailable,
        operationalCapacity: 500,
        setupTime: 20,
        qualificationID: "Q1"
    },
];

describe("PhysicalResourceTable", () => {
    it("renderiza mensagem quando a lista está vazia", () => {
        render(
            <PhysicalResourceTable
                resources={[]}
                onDetails={() => {}}
            />
        );
        expect(screen.getByText("physicalResource.noResourcesFound")).toBeTruthy();
    });

    it("renderiza linhas da tabela para cada recurso", () => {
        render(
            <PhysicalResourceTable
                resources={sampleResources}
                onDetails={() => {}}
            />
        );

        expect(screen.getByText("RES-001")).toBeTruthy();
        expect(screen.getByText("RES-002")).toBeTruthy();
        expect(screen.getByText("Empilhadeira Principal")).toBeTruthy();
        expect(screen.getByText("Camião de Transporte")).toBeTruthy();
        // Verifica se a chave de tradução é renderizada
        expect(screen.getByText(`physicalResource.types.${PhysicalResourceType.Forklift}`)).toBeTruthy();
    });

    it("renderiza os status corretamente", () => {
        render(
            <PhysicalResourceTable
                resources={sampleResources}
                onDetails={() => {}}
            />
        );

        expect(screen.getByText(`physicalResource.status.${PhysicalResourceStatus.Available}`)).toBeTruthy();
    });

    it("clicar no botão Detalhes chama onDetails", () => {
        const onDetails = vi.fn();

        render(
            <PhysicalResourceTable
                resources={sampleResources}
                onDetails={onDetails}
            />
        );

        const buttons = screen.getAllByText("physicalResource.actions.details");
        fireEvent.click(buttons[0]);

        expect(onDetails).toHaveBeenCalledTimes(1);
        expect(onDetails).toHaveBeenCalledWith(sampleResources[0]);
    });
});