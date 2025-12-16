import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import IncidentTypeHierarchyPanel from "../components/IncidentTypeHierarchyPanel";
import type { IncidentType } from "../domain/incidentType";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock html2canvas e jspdf para evitar erros, pois não estamos a testar o download real aqui
vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("jspdf", () => ({ default: vi.fn() }));

const subtreeMock: IncidentType[] = [
    { id: "1", code: "A", name: "Alpha", severity: "Major", parentCode: null } as never,
    { id: "2", code: "B", name: "Beta", severity: "Minor", parentCode: "A" } as never,
];

describe("IncidentTypeHierarchyPanel", () => {
    it("mostra mensagem de vazio quando nada está selecionado", () => {
        render(
            <IncidentTypeHierarchyPanel
                selected={null}
                subtree={[]}
                loading={false}
                error={null}
                onNodeSelect={vi.fn()}
                onRefresh={vi.fn()}
            />
        );
        expect(screen.getByText("incidentType.hierarchy.empty")).toBeTruthy();
    });

    it("mostra loading spinner", () => {
        render(
            <IncidentTypeHierarchyPanel
                selected={{ code: "A" } as never}
                subtree={[]}
                loading={true}
                error={null}
                onNodeSelect={vi.fn()}
                onRefresh={vi.fn()}
            />
        );
        expect(screen.getByText("incidentType.hierarchy.loading")).toBeTruthy();
    });

    it("renderiza a árvore corretamente", () => {
        render(
            <IncidentTypeHierarchyPanel
                selected={{ code: "A", name: "Alpha" } as never}
                subtree={subtreeMock}
                loading={false}
                error={null}
                onNodeSelect={vi.fn()}
                onRefresh={vi.fn()}
            />
        );

        // Header
        expect(screen.getByText("A — Alpha")).toBeTruthy();

        // Nós da árvore
        expect(screen.getByText("A")).toBeTruthy();
        expect(screen.getByText("B")).toBeTruthy();
    });


    it("chama onNodeSelect ao clicar num nó", () => {
        const onNodeSelect = vi.fn();
        render(
            <IncidentTypeHierarchyPanel
                selected={{ code: "A" } as never}
                subtree={subtreeMock}
                loading={false}
                error={null}
                onNodeSelect={onNodeSelect}
                onRefresh={vi.fn()}
            />
        );

        const nodeBtn = screen.getByText("B").closest("button");
        fireEvent.click(nodeBtn!);

        expect(onNodeSelect).toHaveBeenCalledWith("B");
    });
});