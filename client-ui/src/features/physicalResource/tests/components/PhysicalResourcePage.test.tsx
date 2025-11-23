import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PhysicalResourcePage from "../../pages/PhysicalResource.tsx";
import * as service from "../../services/physicalResourceService.ts";
import { BrowserRouter } from "react-router-dom";

import type { PhysicalResource } from "../../domain/physicalResource.ts";
import { PhysicalResourceStatus, PhysicalResourceType } from "../../domain/physicalResource.ts";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-hot-toast", () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

const mockGetAll = vi.spyOn(service, "getAllPhysicalResources");

const sampleData: PhysicalResource[] = [
    {
        id: "1",
        code: { value: "C-01" },
        description: "Crane 1",
        physicalResourceType: PhysicalResourceType.STSCrane,
        physicalResourceStatus: PhysicalResourceStatus.Available,
        operationalCapacity: 100,
        setupTime: 10,
        qualificationID: null
    }
];

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("PhysicalResourcePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAll.mockResolvedValue(sampleData);
    });

    it("carrega e exibe recursos", async () => {
        renderWithRouter(<PhysicalResourcePage />);

        await waitFor(() => {
            expect(screen.getByText("Crane 1")).toBeTruthy();
        });
        expect(mockGetAll).toHaveBeenCalled();
    });

    it("exibe estatísticas", async () => {
        renderWithRouter(<PhysicalResourcePage />);
        await waitFor(() => {
            expect(mockGetAll).toHaveBeenCalled();
        });

        expect(screen.getByText("physicalResource.stats.total")).toBeTruthy();
    });

    it("abre modal de criar ao clicar no botão", async () => {
        renderWithRouter(<PhysicalResourcePage />);

        await waitFor(() => {
            expect(mockGetAll).toHaveBeenCalled();
        });

        const createBtn = screen.getByText("physicalResource.createButton");
        fireEvent.click(createBtn);

        expect(screen.getByText("physicalResource.steps.selectTypePrompt")).toBeTruthy();
    });
});