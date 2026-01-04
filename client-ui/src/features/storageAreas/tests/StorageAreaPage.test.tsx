// src/features/storageAreas/tests/StorageAreaPage.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StorageAreaDto } from "../dto/storageAreaDtos";
import StorageAreaPage from "../pages/StorageAreaPage.tsx";

// ==== mocks globais ====
const navMock = vi.fn();
const useStorageAreasMock = vi.fn();

// react-router
vi.mock("react-router-dom", () => ({
    useNavigate: () => navMock,
}));

// i18n
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// hook
vi.mock("../hooks/useStorageAreas", () => ({
    useStorageAreas: () => useStorageAreasMock(),
}));

// componentes filhos
vi.mock("../components/StorageAreaHeader", () => ({
    StorageAreaHeader: (props: any) => (
        <header>
            <div>HEADER count: {props.count}</div>
            <button onClick={props.onCreate}>create-btn</button>
        </header>
    ),
}));

vi.mock("../components/StorageAreaStrip", () => ({
    StorageAreaStrip: (props: any) => (
        <aside>
            <div>STRIP items: {props.items.length}</div>
            <button onClick={() => props.onSelect(props.items[0])}>
                select-first
            </button>
        </aside>
    ),
}));

vi.mock("../components/StorageAreaMainPanel", () => ({
    StorageAreaMainPanel: (props: any) => (
        <main>
            <div data-testid="main-selected">
                {props.selected ? props.selected.id : "none"}
            </div>
            <button onClick={props.onOpenDistances}>open-distances</button>
            <button onClick={() => props.onCellClick(1, 2, 3)}>open-cell</button>
        </main>
    ),
}));

vi.mock("../components/modals/StorageAreaDistancesModal", () => ({
    StorageAreaDistancesModal: (props: any) =>
        props.open ? <div>DistancesModal OPEN</div> : null,
}));

vi.mock("../components/modals/StorageAreaContainerModal", () => ({
    StorageAreaContainerModal: (props: any) =>
        props.open ? (
            <div>
                ContainerModal OPEN –{" "}
                {props.cellPos
                    ? `${props.cellPos.bay}/${props.cellPos.row}/${props.cellPos.tier}`
                    : "no-pos"}
            </div>
        ) : null,
}));

// importar a page com o MESMO casing que no router

const sampleStorageArea: StorageAreaDto = {
    id: "A1",
    name: "Yard A",
    description: "",
    type: "Yard",
    maxBays: 2,
    maxRows: 1,
    maxTiers: 1,
    maxCapacityTeu: 10,
    currentCapacityTeu: 5,
    physicalResources: [],
    distancesToDocks: [],
};

function makeHookState(overrides: Partial<ReturnType<typeof useStorageAreasMock>> = {}) {
    return {
        loading: false,
        query: "",
        setQuery: vi.fn(),
        filtered: [sampleStorageArea],
        selected: sampleStorageArea,
        setSelected: vi.fn(),
        slices: [],
        isDistancesOpen: false,
        setIsDistancesOpen: vi.fn(),
        isCellOpen: false,
        setIsCellOpen: vi.fn(),
        cellLoading: false,
        cellError: null,
        cellInfo: null,
        cellPos: null,
        openCellModal: vi.fn(),
        ...overrides,
    };
}

describe("StorageAreaPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useStorageAreasMock.mockReturnValue(makeHookState());
    });

    it("mostra o header com o count correto e a strip com nº de items", () => {
        render(<StorageAreaPage />);

        expect(screen.getByText("HEADER count: 1")).toBeTruthy();
        expect(screen.getByText("STRIP items: 1")).toBeTruthy();
    });

    it("botão create navega para /storage-areas/new", () => {
        render(<StorageAreaPage />);

        const createBtn = screen.getByText("create-btn");
        fireEvent.click(createBtn);

        expect(navMock).toHaveBeenCalledWith("/storage-areas/new");
    });

    it("passa selected ao main panel (id visível)", () => {
        render(<StorageAreaPage />);

        const mainSelected = screen.getByTestId("main-selected");
        expect(mainSelected.textContent).toBe("A1");
    });

    it("clicar em open-distances chama setIsDistancesOpen(true)", () => {
        const setIsDistancesOpen = vi.fn();
        useStorageAreasMock.mockReturnValueOnce(
            makeHookState({ setIsDistancesOpen })
        );

        render(<StorageAreaPage />);

        const btn = screen.getByText("open-distances");
        fireEvent.click(btn);

        expect(setIsDistancesOpen).toHaveBeenCalledWith(true);
    });

    it("clicar em open-cell chama openCellModal com as coords", () => {
        const openCellModal = vi.fn();
        useStorageAreasMock.mockReturnValueOnce(
            makeHookState({ openCellModal })
        );

        render(<StorageAreaPage />);

        const btn = screen.getByText("open-cell");
        fireEvent.click(btn);

        expect(openCellModal).toHaveBeenCalledWith(1, 2, 3);
    });
});
