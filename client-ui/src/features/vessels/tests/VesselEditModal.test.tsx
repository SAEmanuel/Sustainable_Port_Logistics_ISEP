// src/features/vessels/tests/VesselEditModal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VesselEditModal } from "../components/modals/VesselEditModal";
import type { UpdateVesselRequest } from "../domain/vessel";

describe("VesselEditModal", () => {
    it("não renderiza nada quando open = false", () => {
        const { container } = render(
            <VesselEditModal
                open={false}
                editData={{}}
                setEditData={() => {}}
                onSave={() => {}}
                onClose={() => {}}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it("renderiza campos de edição quando open = true", () => {
        render(
            <VesselEditModal
                open={true}
                editData={{ name: "Old name", owner: "Old owner" }}
                setEditData={() => {}}
                onSave={() => {}}
                onClose={() => {}}
            />
        );

        expect(screen.getByText("Vessel.modal.editTitle")).toBeTruthy();
        expect(screen.getByText("Vessel.fields.name")).toBeTruthy();
        expect(screen.getByText("Vessel.fields.owner")).toBeTruthy();
    });

    it("alterar inputs chama setEditData", () => {
        const setEditData = vi.fn();
        const initial: UpdateVesselRequest = { name: "Old", owner: "Owner" };

        render(
            <VesselEditModal
                open={true}
                editData={initial}
                setEditData={setEditData}
                onSave={() => {}}
                onClose={() => {}}
            />
        );

        const inputs = screen.getAllByRole("textbox");
        const nameInput = inputs[0];
        const ownerInput = inputs[1];

        fireEvent.change(nameInput, { target: { value: "New Name" } });
        fireEvent.change(ownerInput, { target: { value: "New Owner" } });

        expect(setEditData).toHaveBeenCalled();
    });

    it("botão Save chama onSave", () => {
        const onSave = vi.fn();

        render(
            <VesselEditModal
                open={true}
                editData={{ name: "X", owner: "Y" }}
                setEditData={() => {}}
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
            <VesselEditModal
                open={true}
                editData={{ name: "X", owner: "Y" }}
                setEditData={() => {}}
                onSave={() => {}}
                onClose={onClose}
            />
        );

        const cancelBtn = screen.getByText("Vessel.buttons.cancel");
        fireEvent.click(cancelBtn);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
