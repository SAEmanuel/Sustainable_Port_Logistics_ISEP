import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComplementaryTaskCategoryEditModal from "../../components/ComplementaryTaskCategoryEditModal";
import * as service from "../../services/complementaryTaskCategoryService";
import type { ComplementaryTaskCategory } from "../../domain/complementaryTaskCategory";
import toast from "react-hot-toast";

// Mock translations
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock toast
vi.mock("react-hot-toast");

describe("ComplementaryTaskCategoryEditModal", () => {
    const mockResource: ComplementaryTaskCategory = {
        id: "1",
        code: "CAT-01",
        name: "Initial Name",
        description: "Initial Description",
        category: "Maintenance",
        defaultDuration: 30,
        isActive: true
    };

    const mockOnClose = vi.fn();
    const mockOnUpdated = vi.fn();

    beforeAll(() => {
        Object.defineProperty(window, 'localStorage', {
            value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
            writable: true,
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render nothing when isOpen is false", () => {
        const { container } = render(
            <ComplementaryTaskCategoryEditModal
                isOpen={false}
                onClose={mockOnClose}
                onUpdated={mockOnUpdated}
                resource={mockResource}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("should populate form with initial resource data", () => {
        render(
            <ComplementaryTaskCategoryEditModal
                isOpen={true}
                onClose={mockOnClose}
                onUpdated={mockOnUpdated}
                resource={mockResource}
            />
        );

        expect(screen.getByLabelText(/ctc.form.code/)).toHaveValue("CAT-01");
        expect(screen.getByLabelText("ctc.form.name")).toHaveValue("Initial Name");
        expect(screen.getByLabelText("ctc.form.description")).toHaveValue("Initial Description");
        expect(screen.getByLabelText("ctc.steps.category")).toHaveValue("Maintenance");
        expect(screen.getByLabelText(/ctc.form.duration/)).toHaveValue(30);
    });

    it("should call updateCTC and onUpdated when form is valid and submitted", async () => {
        const updateSpy = vi.spyOn(service, "updateCTC").mockResolvedValue({} as any);

        render(
            <ComplementaryTaskCategoryEditModal
                isOpen={true}
                onClose={mockOnClose}
                onUpdated={mockOnUpdated}
                resource={mockResource}
            />
        );

        const nameInput = screen.getByLabelText("ctc.form.name");
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "Updated Name");

        const saveBtn = screen.getByText("actions.save");
        await userEvent.click(saveBtn);

        await waitFor(() => {
            expect(updateSpy).toHaveBeenCalledWith("CAT-01", expect.objectContaining({
                name: "Updated Name"
            }));
            expect(toast.success).toHaveBeenCalledWith("ctc.success.updated");
            expect(mockOnUpdated).toHaveBeenCalled();
        });
    });

    it("should show error toast if name is empty on submit", async () => {
        const { container } = render(
            <ComplementaryTaskCategoryEditModal
                isOpen={true}
                onClose={mockOnClose}
                onUpdated={mockOnUpdated}
                resource={mockResource}
            />
        );

        const nameInput = screen.getByLabelText("ctc.form.name");
        await userEvent.clear(nameInput);

        // Disparamos o submit diretamente no form para ignorar o bloqueio do 'required' no JSDOM
        const form = container.querySelector('form');
        if (form) fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("ctc.errors.nameRequired");
        });
        expect(service.updateCTC).not.toHaveBeenCalled();
    });

    it("should show error toast if duration is negative", async () => {
        const { container } = render(
            <ComplementaryTaskCategoryEditModal
                isOpen={true}
                onClose={mockOnClose}
                onUpdated={mockOnUpdated}
                resource={mockResource}
            />
        );

        const durationInput = screen.getByLabelText(/ctc.form.duration/);
        await userEvent.clear(durationInput);
        await userEvent.type(durationInput, "-10");

        const form = container.querySelector('form');
        if (form) fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("ctc.errors.invalidDuration");
        });
    });

    it("should handle API errors correctly", async () => {
        vi.spyOn(service, "updateCTC").mockRejectedValue(new Error("API Error"));

        render(
            <ComplementaryTaskCategoryEditModal
                isOpen={true}
                onClose={mockOnClose}
                onUpdated={mockOnUpdated}
                resource={mockResource}
            />
        );

        const saveBtn = screen.getByText("actions.save");
        await userEvent.click(saveBtn);

        await waitFor(() => {
            expect(screen.getByText("API Error")).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith("API Error");
        });
    });

    it("should call onClose when clicking cancel button", async () => {
        render(
            <ComplementaryTaskCategoryEditModal
                isOpen={true}
                onClose={mockOnClose}
                onUpdated={mockOnUpdated}
                resource={mockResource}
            />
        );

        const cancelBtn = screen.getByText("actions.cancel");
        await userEvent.click(cancelBtn);

        expect(mockOnClose).toHaveBeenCalled();
    });
});