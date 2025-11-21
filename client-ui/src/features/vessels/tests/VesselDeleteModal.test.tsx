// src/features/vessels/tests/VesselDeleteModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import VesselDeleteModal from "../components/modals/VesselDeleteModal";
import toast from "react-hot-toast";
import { apiDeleteVessel } from "../services/vesselService";
import type { Vessel } from "../domain/vessel";

vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
    },
}));

vi.mock("../services/vesselService", () => ({
    apiDeleteVessel: vi.fn().mockResolvedValue(undefined),
}));

const mockedToast = toast as any;
const mockedDelete = apiDeleteVessel as any;

const sampleVessel: Vessel = {
    id: "1",
    name: "Ever Pride",
    owner: "Evergreen",
    imoNumber: "1234567",
    vesselTypeId: "VT1",
};

describe("VesselDeleteModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("não renderiza nada se open = false ou vessel = null", () => {
        const { container: c1 } = render(
            <VesselDeleteModal
                open={false}
                vessel={sampleVessel}
                onClose={() => {}}
                onDeleted={() => {}}
            />
        );
        expect(c1.firstChild).toBeNull();

        const { container: c2 } = render(
            <VesselDeleteModal
                open={true}
                vessel={null}
                onClose={() => {}}
                onDeleted={() => {}}
            />
        );
        expect(c2.firstChild).toBeNull();
    });

    it("quando open = true renderiza info do vessel", () => {
        render(
            <VesselDeleteModal
                open={true}
                vessel={sampleVessel}
                onClose={() => {}}
                onDeleted={() => {}}
            />
        );

        expect(screen.getByText("Vessel.modal.deleteTitle")).toBeTruthy();
        expect(screen.getByText(sampleVessel.name)).toBeTruthy();
        expect(screen.getByText(sampleVessel.owner)).toBeTruthy();
        expect(screen.getByText("1234567")).toBeTruthy();
    });

    it("clicar em Delete chama API, onDeleted e onClose", async () => {
        const onClose = vi.fn();
        const onDeleted = vi.fn();

        render(
            <VesselDeleteModal
                open={true}
                vessel={sampleVessel}
                onClose={onClose}
                onDeleted={onDeleted}
            />
        );

        const delBtn = screen.getByText("Vessel.buttons.delete");
        fireEvent.click(delBtn);

        await waitFor(() => {
            expect(mockedDelete).toHaveBeenCalledTimes(1);
            expect(mockedDelete).toHaveBeenCalledWith(sampleVessel.id);
            expect(mockedToast.success).toHaveBeenCalledTimes(1);
            expect(onDeleted).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("botão Cancel apenas chama onClose", () => {
        const onClose = vi.fn();

        render(
            <VesselDeleteModal
                open={true}
                vessel={sampleVessel}
                onClose={onClose}
                onDeleted={() => {}}
            />
        );

        const cancelBtn = screen.getByText("Vessel.buttons.cancel");
        fireEvent.click(cancelBtn);

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockedDelete).not.toHaveBeenCalled();
    });
});
