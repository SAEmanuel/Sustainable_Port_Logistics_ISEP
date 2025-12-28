import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComplementaryTaskCategorySearch from "../../components/ComplementaryTaskCategorySearch";
import toast from "react-hot-toast";


vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));


vi.mock("react-hot-toast");

describe("ComplementaryTaskCategorySearch", () => {
    const mockOnSearch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render with initial state (code filter and search button)", () => {
        render(<ComplementaryTaskCategorySearch onSearch={mockOnSearch} />);

        expect(screen.getByRole("combobox")).toHaveValue("code");
        expect(screen.getByPlaceholderText("ctc.searchPlaceholder.code")).toBeInTheDocument();
        expect(screen.getByText("actions.search")).toBeInTheDocument();
    });

    it("should call onSearch with correct values when searching by name", async () => {
        render(<ComplementaryTaskCategorySearch onSearch={mockOnSearch} />);


        const typeSelect = screen.getByRole("combobox");
        await userEvent.selectOptions(typeSelect, "name");

        const input = screen.getByPlaceholderText("ctc.searchPlaceholder.name");
        await userEvent.type(input, "Maintenance");

        const searchBtn = screen.getByText("actions.search");
        await userEvent.click(searchBtn);

        expect(mockOnSearch).toHaveBeenCalledWith("name", "Maintenance");
    });

    it("should show error toast if searching with empty value", async () => {
        render(<ComplementaryTaskCategorySearch onSearch={mockOnSearch} />);

        const searchBtn = screen.getByText("actions.search");
        await userEvent.click(searchBtn);

        expect(toast.error).toHaveBeenCalledWith("errors.emptySearch");
        expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it("should render a select input when filter type is 'category'", async () => {
        render(<ComplementaryTaskCategorySearch onSearch={mockOnSearch} />);

        const typeSelect = screen.getByRole("combobox");
        await userEvent.selectOptions(typeSelect, "category");


        const selects = screen.getAllByRole("combobox");
        expect(selects).toHaveLength(2);

        const categorySelect = selects[1];
        await userEvent.selectOptions(categorySelect, "Maintenance");

        const searchBtn = screen.getByText("actions.search");
        await userEvent.click(searchBtn);

        expect(mockOnSearch).toHaveBeenCalledWith("category", "Maintenance");
    });

    it("should clear filters and call onSearch with 'all' when clicking clear button", async () => {
        render(<ComplementaryTaskCategorySearch onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText("ctc.searchPlaceholder.code");
        await userEvent.type(input, "some-code");

        const clearBtn = screen.getByText("actions.clear");
        await userEvent.click(clearBtn);


        expect(screen.getByRole("combobox")).toHaveValue("code");
        expect(input).toHaveValue("");


        expect(mockOnSearch).toHaveBeenCalledWith("all", "");
    });
});