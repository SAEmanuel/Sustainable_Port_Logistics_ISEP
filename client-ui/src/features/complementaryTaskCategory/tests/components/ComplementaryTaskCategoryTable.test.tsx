import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComplementaryTaskCategoryTable from "../../components/ComplementaryTaskCategoryTable";
import type { ComplementaryTaskCategory } from "../../domain/complementaryTaskCategory";


vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe("ComplementaryTaskCategoryTable", () => {
    const mockCategories: ComplementaryTaskCategory[] = [
        {
            id: "1",
            code: "CAT01",
            name: "Maintenance Tasks",
            description: "General maintenance",
            category: "Maintenance",
            isActive: true,
            defaultDuration: 60
        },
        {
            id: "2",
            code: "CLN01",
            name: "Cleaning",
            description: "Standard cleaning",
            category: "Cleaning and Housekeeping",
            isActive: false,
            defaultDuration: null
        }
    ];

    const mockOnEdit = vi.fn();
    const mockOnToggleStatus = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should display no data message when list is empty", () => {
        render(
            <ComplementaryTaskCategoryTable
                categories={[]}
                onEdit={mockOnEdit}
                onToggleStatus={mockOnToggleStatus}
            />
        );
        expect(screen.getByText("ctc.noData")).toBeInTheDocument();
    });

    it("should render table rows correctly", () => {
        render(
            <ComplementaryTaskCategoryTable
                categories={mockCategories}
                onEdit={mockOnEdit}
                onToggleStatus={mockOnToggleStatus}
            />
        );

        expect(screen.getByText("CAT01")).toBeInTheDocument();
        expect(screen.getByText("Cleaning")).toBeInTheDocument();


        expect(screen.getByText("status.active")).toBeInTheDocument();
        expect(screen.getByText("status.inactive")).toBeInTheDocument();


        expect(screen.getByText("60 min")).toBeInTheDocument();
        expect(screen.getAllByText("-")).toHaveLength(1);
    });

    it("should call onEdit when clicking edit button", async () => {
        render(
            <ComplementaryTaskCategoryTable
                categories={mockCategories}
                onEdit={mockOnEdit}
                onToggleStatus={mockOnToggleStatus}
            />
        );

        const editButtons = screen.getAllByTitle("actions.edit");
        await userEvent.click(editButtons[0]);

        expect(mockOnEdit).toHaveBeenCalledWith(mockCategories[0]);
    });

    it("should call onToggleStatus when clicking deactivate/activate button", async () => {
        render(
            <ComplementaryTaskCategoryTable
                categories={mockCategories}
                onEdit={mockOnEdit}
                onToggleStatus={mockOnToggleStatus}
            />
        );


        const deactivateBtn = screen.getByTitle("actions.deactivate");
        await userEvent.click(deactivateBtn);
        expect(mockOnToggleStatus).toHaveBeenCalledWith(mockCategories[0]);


        const activateBtn = screen.getByTitle("actions.activate");
        await userEvent.click(activateBtn);
        expect(mockOnToggleStatus).toHaveBeenCalledWith(mockCategories[1]);
    });
});