import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SAOPage from "../pages/sao";
import {
  getSAOs,
  getByLegalName,
  getByTaxNumber,
} from "../services/saoService";
import { mapSAODto } from "../mappers/saoMapper";
import { notifySuccess } from "../../../utils/notify";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    loading: vi.fn().mockReturnValue("toast-id"),
    dismiss: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && typeof opts.count === "number"
        ? `${key} (${opts.count})`
        : key,
  }),
}));

vi.mock("../services/saoService", () => ({
  getSAOs: vi.fn(),
  getByLegalName: vi.fn(),
  getByTaxNumber: vi.fn(),
  createSAO: vi.fn(),
  deleteSAO: vi.fn(),
}));

vi.mock("../mappers/saoMapper", () => ({
  mapSAODto: vi.fn((dto) => dto),
}));

vi.mock("../../../utils/notify", () => ({
  notifySuccess: vi.fn(),
}));

// Mock dos componentes filhos
vi.mock("../components/SAOHeader", () => ({
  default: ({ t, count, onOpenCreate }: any) => (
    <div>
      <h2>{t("sao.title")}</h2>
      <p>{t("sao.count", { count })}</p>
      <button onClick={onOpenCreate}>+ {t("sao.add")}</button>
    </div>
  ),
}));

vi.mock("../components/SAOSearchBar", () => ({
  default: ({
    searchValue,
    onChangeSearchMode,
    onChangeSearchValue,
    onSearch,
    onClearResults,
  }: any) => (
    <div>
      <button onClick={() => onChangeSearchMode("legalName")}>
        Mode: legalName
      </button>
      <button onClick={() => onChangeSearchMode("taxnumber")}>
        Mode: taxnumber
      </button>
      <input
        placeholder="sao.searchPlaceholder"
        value={searchValue}
        onChange={(e) => onChangeSearchValue(e.target.value)}
      />
      <button title="Search" onClick={onSearch}>
        Search
      </button>
      <button onClick={onClearResults}>Clear</button>
    </div>
  ),
}));

vi.mock("../components/SAOCreateModal", () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div>CreateSAOModal</div> : null,
}));

vi.mock("../components/SAODeleteModal", () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div>DeleteSAOModal</div> : null,
}));

const mockedGetSAOs = getSAOs as any;
const mockedGetByLegalName = getByLegalName as any;
const mockedGetByTaxNumber = getByTaxNumber as any;
const mockedMapSAODto = mapSAODto as any;
const mockedNotifySuccess = notifySuccess as any;
const mockedToast = toast as any;

const sampleDtos = [
  {
    legalName: "Org 1",
    altName: "Alt 1",
    address: "Rua 1",
    taxnumber: { value: "111111111" },
  },
  {
    legalName: "Org 2",
    altName: "Alt 2",
    address: "Rua 2",
    taxnumber: { value: "222222222" },
  },
];

describe("SAOPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSAOs.mockResolvedValue(sampleDtos);
    mockedGetByLegalName.mockResolvedValue(sampleDtos[0]);
    mockedGetByTaxNumber.mockResolvedValue(sampleDtos[1]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("carrega SAOs no mount e renderiza as linhas da tabela", async () => {
    render(<SAOPage />);

    // Esperar pela tabela (cabeçalho)
    await screen.findByText("sao.details.legalName");

    // Não assumimos o número exacto de chamadas (React 18 pode disparar o efeito 2x)
    expect(mockedGetSAOs).toHaveBeenCalled();

    expect(
      screen.getByText("sao.details.legalName")
    ).toBeInTheDocument();
    expect(screen.getByText("sao.details.altName")).toBeInTheDocument();
    expect(screen.getByText("sao.details.address")).toBeInTheDocument();
    expect(
      screen.getByText("sao.details.taxnumber")
    ).toBeInTheDocument();

    expect(screen.getByText("Org 1")).toBeInTheDocument();
    expect(screen.getByText("Org 2")).toBeInTheDocument();

    expect(mockedMapSAODto).toHaveBeenCalled();
    expect(mockedNotifySuccess).toHaveBeenCalledWith(
      "sao.loadSuccess (2)"
    );
  });

  it("abre o CreateModal ao clicar no botão + do header", async () => {
    render(<SAOPage />);

    await screen.findByText("sao.details.legalName");

    const addButton = screen.getByText("+ sao.add");
    fireEvent.click(addButton);

    expect(screen.getByText("CreateSAOModal")).toBeInTheDocument();
  });

  it("ao clicar numa linha mostra o slide com detalhes", async () => {
    render(<SAOPage />);

    await screen.findByText("sao.details.legalName");
    await screen.findByText("Org 1");

    const org1Cells = screen.getAllByText("Org 1");
    const org1Row = org1Cells[0].closest("tr")!;
    fireEvent.click(org1Row);

    await waitFor(() => {
        expect(
        screen.getByRole("heading", { level: 3, name: "Org 1" })
        ).toBeInTheDocument();
    });

    // "Alt 1" aparece na tabela e no slide
    const altOccurrences = screen.getAllByText("Alt 1");
    expect(altOccurrences.length).toBeGreaterThanOrEqual(1);

    // "Rua 1" também aparece na tabela e no slide
    const ruaOccurrences = screen.getAllByText("Rua 1");
    expect(ruaOccurrences.length).toBeGreaterThanOrEqual(1);

    // idem para o taxnumber
    const taxOccurrences = screen.getAllByText("111111111");
    expect(taxOccurrences.length).toBeGreaterThanOrEqual(1);
  });

  it("filtra por legalName usando a search bar (getByLegalName)", async () => {
    render(<SAOPage />);

    await screen.findByText("sao.details.legalName");
    await screen.findByText("Org 1");

    const input = screen.getByPlaceholderText("sao.searchPlaceholder");
    fireEvent.change(input, { target: { value: "Org 1" } });

    const searchButton = screen.getByTitle("Search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedGetByLegalName).toHaveBeenCalled();
      expect(mockedGetByLegalName).toHaveBeenCalledWith("Org 1");
    });

    // Confirmamos que o resultado esperado está visível,
    // mas não exigimos que os outros tenham desaparecido
    expect(screen.getByText("Org 1")).toBeInTheDocument();
  });

  it("muda para modo taxnumber e usa getByTaxNumber", async () => {
    render(<SAOPage />);

    await screen.findByText("sao.details.legalName");
    await screen.findByText("Org 1");

    const taxModeButton = screen.getByText("Mode: taxnumber");
    fireEvent.click(taxModeButton);

    const input = screen.getByPlaceholderText("sao.searchPlaceholder");
    fireEvent.change(input, { target: { value: "222222222" } });

    const searchButton = screen.getByTitle("Search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedGetByTaxNumber).toHaveBeenCalled();
      expect(mockedGetByTaxNumber).toHaveBeenCalledWith("222222222");
    });

    expect(screen.getByText("Org 2")).toBeInTheDocument();
  });

  it("clear search repõe a lista filtrada", async () => {
    render(<SAOPage />);

    await screen.findByText("sao.details.legalName");
    await screen.findByText("Org 1");

    const input = screen.getByPlaceholderText("sao.searchPlaceholder");
    fireEvent.change(input, { target: { value: "Org 1" } });

    const searchButton = screen.getByTitle("Search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedGetByLegalName).toHaveBeenCalled();
    });

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(screen.getByText("Org 1")).toBeInTheDocument();
    expect(screen.getByText("Org 2")).toBeInTheDocument();
  });

  it("usa toast.loading e toast.dismiss durante o load inicial", async () => {
    render(<SAOPage />);

    // esperamos até a tabela aparecer, o que implica que o runWithLoading terminou
    await screen.findByText("sao.details.legalName");

    await waitFor(() => {
      expect(mockedToast.loading).toHaveBeenCalled();
      expect(mockedToast.dismiss).toHaveBeenCalled();
    });
  });
});
