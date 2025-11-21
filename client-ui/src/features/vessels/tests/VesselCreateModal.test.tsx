import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VesselCreateModal } from "../components/modals/VesselCreateModal";
import type { CreateVesselRequest } from "../domain/vessel";
import type { VesselType } from "../../vesselsTypes/domain/vesselType";

const baseForm: CreateVesselRequest = {
    imoNumber: "",
    name: "",
    owner: "",
    vesselTypeName: "",
};

const vesselTypes: VesselType[] = [
    {
        id: "VT1",
        name: "Panamax",
        description: "Panamax ship",
        maxBays: 10,
        maxRows: 12,
        maxTiers: 5,
        capacityTeu: 5000,
    },
];

describe("VesselCreateModal", () => {
    it("não renderiza nada quando open = false", () => {
        const { container } = render(
            <VesselCreateModal
                open={false}
                form={baseForm}
                setForm={() => {}}
                vesselTypes={vesselTypes}
                onSave={() => {}}
                onClose={() => {}}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it("renderiza formulário quando open = true", () => {
        render(
            <VesselCreateModal
                open={true}
                form={baseForm}
                setForm={() => {}}
                vesselTypes={vesselTypes}
                onSave={() => {}}
                onClose={() => {}}
            />
        );

        expect(screen.getByText("Vessel.modal.addTitle")).toBeTruthy();
        expect(screen.getByText("Vessel.fields.imo")).toBeTruthy();
        expect(screen.getByText("Vessel.fields.name")).toBeTruthy();
        expect(screen.getByText("Vessel.fields.owner")).toBeTruthy();
        expect(screen.getByText("Vessel.fields.type")).toBeTruthy();
    });

    it("botão Save chama onSave", () => {
        const onSave = vi.fn();

        render(
            <VesselCreateModal
                open={true}
                form={baseForm}
                setForm={() => {}}
                vesselTypes={vesselTypes}
                onSave={onSave}
                onClose={() => {}}
            />
        );

        const saveBtn = screen.getByText("Vessel.buttons.save");
        fireEvent.click(saveBtn);

        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("botão Cancel chama onClose", () => {
        const onClose = vi.fn();

        render(
            <VesselCreateModal
                open={true}
                form={baseForm}
                setForm={() => {}}
                vesselTypes={vesselTypes}
                onSave={() => {}}
                onClose={onClose}
            />
        );

        const cancelBtn = screen.getByText("Vessel.buttons.cancel");
        fireEvent.click(cancelBtn);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
