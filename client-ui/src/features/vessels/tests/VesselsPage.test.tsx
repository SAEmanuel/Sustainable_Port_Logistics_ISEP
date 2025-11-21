import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Vessel } from "../domain/vessel";
import VesselsPage from "../pages/Vessel";

// mock dinâmico do hook useVessels
const useVesselsMock = vi.fn();

vi.mock("../hooks/useVessels", () => ({
    useVessels: () => useVesselsMock(),
}));

const baseItems: Vessel[] = [
    {
        id: "1",
        name: "Ever Pride",
        owner: "Evergreen",
        imoNumber: "1234567",
        vesselTypeId: "VT1",
    },
    {
        id: "2",
        name: "MSC Helena",
        owner: "MSC",
        imoNumber: "7654321",
        vesselTypeId: "VT2",
    },
];

function makeBaseState(
    overrides: Partial<ReturnType<typeof useVesselsMock>> = {}
) {
    return {
        items: baseItems,
        filtered: baseItems,
        loading: false,
        vesselTypes: [],
        vesselTypeCounts: [],
        selected: null,
        setSelected: vi.fn(),
        searchMode: "local",
        setSearchMode: vi.fn(),
        searchValue: "",
        setSearchValue: vi.fn(),
        executeSearch: vi.fn(),
        form: { imoNumber: "", name: "", owner: "", vesselTypeName: "" },
        setForm: vi.fn(),
        handleCreate: vi.fn(),
        isCreateOpen: false,
        setIsCreateOpen: vi.fn(),
        editData: {},
        setEditData: vi.fn(),
        handleSaveEdit: vi.fn(),
        isEditOpen: false,
        setIsEditOpen: vi.fn(),
        setEditIMO: vi.fn(),
        isStatsOpen: false,
        setIsStatsOpen: vi.fn(),
        getVesselTypeNameById: vi.fn().mockReturnValue("Panamax"),
        val: (x: any) => (typeof x === "string" ? x : x?.value),
        isDeleteOpen: false,
        setIsDeleteOpen: vi.fn(),
        reload: vi.fn(),
        ...overrides,
    };
}

describe("VesselsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renderiza o header, search bar e cards de vessels", () => {
        useVesselsMock.mockReturnValue(makeBaseState());

        render(<VesselsPage />);

        // header (usa i18n → key)
        expect(screen.getByText("Vessel.title")).toBeTruthy();
        expect(screen.getByText("Vessel.count (2)")).toBeTruthy();

        // cards com nomes dos navios
        expect(screen.getAllByText("Ever Pride").length).toBeGreaterThan(0);
        expect(screen.getAllByText("MSC Helena").length).toBeGreaterThan(0);

        // search input (placeholder com key)
        expect(
            screen.getByPlaceholderText("Vessel.searchPlaceholder")
        ).toBeTruthy();
    });

    it("quando há um vessel selecionado mostra o slide de detalhes", () => {
        const selected = baseItems[0];

        useVesselsMock.mockReturnValue(
            makeBaseState({
                selected,
            })
        );

        const { container } = render(<VesselsPage />);

        // garante que o slide existe
        const slide = container.querySelector(".vt-slide") as HTMLElement;
        expect(slide).toBeTruthy();

        // texto dentro do slide (evita conflito com os cards)
        expect(within(slide).getByText(selected.name)).toBeTruthy();
        expect(within(slide).getByText(selected.owner)).toBeTruthy();

        // botões Edit / View Type / Delete também dentro do slide
        expect(within(slide).getByText("Edit")).toBeTruthy();
        expect(within(slide).getByText("View Type")).toBeTruthy();
        expect(within(slide).getByText("Delete")).toBeTruthy();
    });

    it("clicar em Edit no slide chama setEditData, setEditIMO e abre o modal de edição", () => {
        const selected = baseItems[0];
        const setEditData = vi.fn();
        const setEditIMO = vi.fn();
        const setIsEditOpen = vi.fn();
        const setSelected = vi.fn();

        useVesselsMock.mockReturnValue(
            makeBaseState({
                selected,
                setEditData,
                setEditIMO,
                setIsEditOpen,
                setSelected,
            })
        );

        render(<VesselsPage />);

        const editBtn = screen.getByText("Edit");
        fireEvent.click(editBtn);

        expect(setEditData).toHaveBeenCalledTimes(1);
        expect(setEditData).toHaveBeenCalledWith({
            name: selected.name,
            owner: selected.owner,
        });

        expect(setEditIMO).toHaveBeenCalledTimes(1);
        expect(setEditIMO).toHaveBeenCalledWith("1234567");

        expect(setIsEditOpen).toHaveBeenCalledWith(true);
        expect(setSelected).toHaveBeenCalledWith(null);
    });

    it("clicar em Delete no slide abre o modal de delete", () => {
        const selected = baseItems[0];
        const setIsDeleteOpen = vi.fn();

        useVesselsMock.mockReturnValue(
            makeBaseState({
                selected,
                setIsDeleteOpen,
            })
        );

        render(<VesselsPage />);

        const delBtn = screen.getByText("Delete");
        fireEvent.click(delBtn);

        expect(setIsDeleteOpen).toHaveBeenCalledWith(true);
    });
});
