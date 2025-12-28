import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComplementaryTaskCategoryDetailsModal from "../../components/ComplementaryTaskCategoryDetailsModal";
import type { ComplementaryTaskCategory } from "../../domain/complementaryTaskCategory";


vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe("ComplementaryTaskCategoryDetailsModal", () => {
    const mockCategory: ComplementaryTaskCategory = {
        id: "1",
        code: "CAT01",
        name: "Test Category",
        description: "This is a test description",
        category: "Maintenance",
        defaultDuration: 45,
        isActive: true
    };

    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should not render anything when isOpen is false", () => {
        const { container } = render(
            <ComplementaryTaskCategoryDetailsModal
                isOpen={false}
                onClose={mockOnClose}
                category={mockCategory}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("should not render anything when category is null", () => {
        const { container } = render(
            <ComplementaryTaskCategoryDetailsModal
                isOpen={true}
                onClose={mockOnClose}
                category={null}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("should render all category details correctly", () => {
        render(
            <ComplementaryTaskCategoryDetailsModal
                isOpen={true}
                onClose={mockOnClose}
                category={mockCategory}
            />
        );

        expect(screen.getByText("ctc.detailsTitle")).toBeInTheDocument();
        expect(screen.getByText("CAT01")).toBeInTheDocument();
        expect(screen.getByText("Test Category")).toBeInTheDocument();
        expect(screen.getByText("45 min")).toBeInTheDocument();
        expect(screen.getByText("status.active")).toBeInTheDocument();
    });

    it("should show '-' for missing duration and description", () => {
        const minimalCategory: ComplementaryTaskCategory = {
            ...mockCategory,
            defaultDuration: null,
            description: ""
        };

        render(
            <ComplementaryTaskCategoryDetailsModal
                isOpen={true}
                onClose={mockOnClose}
                category={minimalCategory}
            />
        );


        const dashes = screen.getAllByText("-");
        expect(dashes).toHaveLength(2);
    });

    it("should call onClose when clicking the close button", async () => {
        render(
            <ComplementaryTaskCategoryDetailsModal
                isOpen={true}
                onClose={mockOnClose}
                category={mockCategory}
            />
        );

        const closeBtn = screen.getByText("actions.close");
        await userEvent.click(closeBtn);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when clicking the 'X' button", async () => {
        render(
            <ComplementaryTaskCategoryDetailsModal
                isOpen={true}
                onClose={mockOnClose}
                category={mockCategory}
            />
        );


        const xBtn = screen.getByText("×");
        await userEvent.click(xBtn);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});