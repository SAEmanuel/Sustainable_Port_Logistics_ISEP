import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import IncidentTypeTable from "../components/IncidentTypeTable";
import type { IncidentType } from "../domain/incidentType";

// Mock básico do t function
vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const mockItems: IncidentType[] = [
    {
        id: "1",
        code: "T-INC001",
        name: "Fire",
        description: "Fire incident",
        severity: "Critical",
        parentCode: null,
    },
    {
        id: "2",
        code: "T-INC002",
        name: "Small Fire",
        description: "Small fire incident",
        severity: "Minor",
        parentCode: "T-INC001",
    },
];

describe("IncidentTypeTable", () => {
    it("renderiza mensagem de 'noData' quando a lista está vazia", () => {
        const onEdit = vi.fn();
        const onSelect = vi.fn();

        render(
            <IncidentTypeTable
                items={[]}
                onEdit={onEdit}
                onSelect={onSelect}
                selectedCode={null}
            />
        );

        expect(screen.getByText("incidentType.noData")).toBeTruthy();
    });



    it("chama onSelect ao clicar na linha", () => {
        const onEdit = vi.fn();
        const onSelect = vi.fn();

        render(
            <IncidentTypeTable
                items={mockItems}
                onEdit={onEdit}
                onSelect={onSelect}
                selectedCode={null}
            />
        );

        const row = screen.getByText("Fire").closest("tr")!;
        fireEvent.click(row);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(mockItems[0]);
    });

    it("chama onEdit ao clicar no botão de editar (e não chama onSelect)", () => {
        const onEdit = vi.fn();
        const onSelect = vi.fn();

        render(
            <IncidentTypeTable
                items={mockItems}
                onEdit={onEdit}
                onSelect={onSelect}
                selectedCode={null}
            />
        );

        const editButtons = screen.getAllByText("incidentType.actions.edit");
        fireEvent.click(editButtons[0]);

        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(onEdit).toHaveBeenCalledWith(mockItems[0]);

        // O stopPropagation deve impedir que o onSelect da linha dispare
        expect(onSelect).not.toHaveBeenCalled();
    });

    it("aplica classe de seleção na linha correta", () => {
        render(
            <IncidentTypeTable
                items={mockItems}
                onEdit={vi.fn()}
                onSelect={vi.fn()}
                selectedCode="T-INC001"
            />
        );

        const row = screen.getByText("Fire").closest("tr");
        expect(row?.className).toContain("it-row-selected");
    });
});