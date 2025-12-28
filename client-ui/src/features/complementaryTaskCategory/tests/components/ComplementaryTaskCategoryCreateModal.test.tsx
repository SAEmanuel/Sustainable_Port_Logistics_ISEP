import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComplementaryTaskCategoryCreateModal from "../../components/ComplementaryTaskCategoryCreateModal";
import * as service from "../../services/complementaryTaskCategoryService";
import toast from "react-hot-toast";

// Mock translations
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock toast
vi.mock("react-hot-toast");

describe("ComplementaryTaskCategoryCreateModal", () => {
    const mockOnClose = vi.fn();
    const mockOnCreated = vi.fn();

    beforeAll(() => {
        Object.defineProperty(window, 'localStorage', {
            value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
            writable: true,
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should not render anything when isOpen is false", () => {
        const { container } = render(
            <ComplementaryTaskCategoryCreateModal
                isOpen={false}
                onClose={mockOnClose}
                onCreated={mockOnCreated}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("should render Step 1 (category selection) initially", () => {
        render(
            <ComplementaryTaskCategoryCreateModal
                isOpen={true}
                onClose={mockOnClose}
                onCreated={mockOnCreated}
            />
        );

        expect(screen.getByText("ctc.selectCategory")).toBeInTheDocument();
        expect(screen.getByText("ctc.categories.Maintenance")).toBeInTheDocument();
    });

    it("should move to Step 2 when a category is selected", async () => {
        render(
            <ComplementaryTaskCategoryCreateModal
                isOpen={true}
                onClose={mockOnClose}
                onCreated={mockOnCreated}
            />
        );

        await userEvent.click(screen.getByText("ctc.categories.Maintenance"));

        expect(screen.getByLabelText("ctc.form.code")).toBeInTheDocument();
        expect(screen.getByLabelText("ctc.form.name")).toBeInTheDocument();
    });

    it("should call createCTC and onCreated when form is valid and submitted", async () => {
        const createSpy = vi.spyOn(service, "createCTC").mockResolvedValue({} as any);

        render(
            <ComplementaryTaskCategoryCreateModal
                isOpen={true}
                onClose={mockOnClose}
                onCreated={mockOnCreated}
            />
        );

        // Step 1
        await userEvent.click(screen.getByText("ctc.categories.Cleaning and Housekeeping"));

        // Step 2
        await userEvent.type(screen.getByLabelText("ctc.form.code"), "CLN-01");
        await userEvent.type(screen.getByLabelText("ctc.form.name"), "Cleaning Category");

        const createBtn = screen.getByText("ctc.actions.create");
        await userEvent.click(createBtn);

        await waitFor(() => {
            expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
                code: "CLN-01",
                name: "Cleaning Category",
                category: "Cleaning and Housekeeping"
            }));
            expect(toast.success).toHaveBeenCalledWith("ctc.success.created");
            expect(mockOnCreated).toHaveBeenCalled();
        });
    });

    it("should show error toast if code is missing in Step 2", async () => {
        const { container } = render(
            <ComplementaryTaskCategoryCreateModal
                isOpen={true}
                onClose={mockOnClose}
                onCreated={mockOnCreated}
            />
        );

        await userEvent.click(screen.getByText("ctc.categories.Maintenance"));

        // Trigger submit bypassing HTML5 required validation
        const form = container.querySelector('form');
        if (form) fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("ctc.errors.codeRequired");
        });
        expect(service.createCTC).not.toHaveBeenCalled();
    });

    it("should show error toast if name is missing in Step 2", async () => {
        const { container } = render(
            <ComplementaryTaskCategoryCreateModal
                isOpen={true}
                onClose={mockOnClose}
                onCreated={mockOnCreated}
            />
        );

        await userEvent.click(screen.getByText("ctc.categories.Maintenance"));
        await userEvent.type(screen.getByLabelText("ctc.form.code"), "CODE123");

        const form = container.querySelector('form');
        if (form) fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("ctc.errors.nameRequired");
        });
    });

    it("should return to Step 1 when clicking back button", async () => {
        render(
            <ComplementaryTaskCategoryCreateModal
                isOpen={true}
                onClose={mockOnClose}
                onCreated={mockOnCreated}
            />
        );

        await userEvent.click(screen.getByText("ctc.categories.Maintenance"));
        expect(screen.getByText("ctc.actions.back")).toBeInTheDocument();

        await userEvent.click(screen.getByText("ctc.actions.back"));
        expect(screen.getByText("ctc.selectCategory")).toBeInTheDocument();
    });
});