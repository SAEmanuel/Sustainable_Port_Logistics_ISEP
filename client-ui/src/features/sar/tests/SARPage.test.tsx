// src/features/sar/tests/SARPage.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SARPage from "../pages/sar";
import { getSARs, getByEmail } from "../services/sarService";
import { mapSARDto } from "../mappers/sarMapper";
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

vi.mock("../services/sarService", () => ({
  getSARs: vi.fn(),
  getByName: vi.fn(),
  getByEmail: vi.fn(),
}));

vi.mock("../mappers/sarMapper", () => ({
  mapSARDto: vi.fn((dto) => dto),
}));

vi.mock("../../../utils/notify", () => ({
  notifySuccess: vi.fn(),
}));

// Mock child components to keep tests focused on logic
vi.mock("../components/CreateModal", () => ({
  default: () => <div>CreateModal</div>,
}));

vi.mock("../components/EditModal", () => ({
  default: () => <div>EditModal</div>,
}));

vi.mock("../components/DeleteModal", () => ({
  default: () => <div>DeleteModal</div>,
}));

vi.mock("../components/SARHeader", () => ({
  default: ({ t, totalItems, onCreateClick }: any) => (
    <div>
      <h2>{t("sar.title")}</h2>
      <p>{t("sar.count", { count: totalItems })}</p>
      <button onClick={onCreateClick}>+ {t("sar.add")}</button>
    </div>
  ),
}));

vi.mock("../components/SARSearchBar", () => ({
  default: ({
    searchValue,
    onSearchValueChange,
    onExecuteSearch,
    onClearSearch,
  }: any) => (
    <div>
      <input
        placeholder="sar.searchPlaceholder"
        value={searchValue}
        onChange={(e) => onSearchValueChange(e.target.value)}
      />
      <button title="Search" onClick={onExecuteSearch}>
        Search
      </button>
      <button onClick={onClearSearch}>Clear</button>
    </div>
  ),
}));

const mockedGetSARs = getSARs as any;
const mockedGetByEmail = getByEmail as any;
const mockedMapSARDto = mapSARDto as any;
const mockedNotifySuccess = notifySuccess as any;
const mockedToast = toast as any;

const sampleDtos = [
  {
    id: "1",
    name: "Alice",
    citizenId: { passportNumber: "P1" },
    nationality: "PT",
    email: { address: "alice@example.com" },
    phoneNumber: { number: "111" },
    sao: "Org 1",
    notifs: [],
    status: "activated" as const,
  },
  {
    id: "2",
    name: "Bob",
    citizenId: { passportNumber: "P2" },
    nationality: "ES",
    email: { address: "bob@example.com" },
    phoneNumber: { number: "222" },
    sao: "Org 2",
    notifs: [],
    status: "deactivated" as const,
  },
];

describe("SARPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSARs.mockResolvedValue(sampleDtos);
    mockedGetByEmail.mockResolvedValue(sampleDtos[0]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads SARs on mount and renders table rows", async () => {
    render(<SARPage />);

    await waitFor(() => {
      expect(mockedGetSARs).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("sar.name")).toBeInTheDocument();
    expect(screen.getByText("sar.email")).toBeInTheDocument();
    expect(screen.getByText("sar.status")).toBeInTheDocument();
    expect(screen.getByText("sar.sao")).toBeInTheDocument();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    expect(mockedMapSARDto).toHaveBeenCalled();
    expect(mockedNotifySuccess).toHaveBeenCalledWith("sar.loadSuccess (2)");
  });

  it("opens CreateModal when clicking the + button in header", async () => {
    render(<SARPage />);

    await waitFor(() => {
      expect(mockedGetSARs).toHaveBeenCalledTimes(1);
    });

    const addButton = screen.getByText("+ sar.add");
    fireEvent.click(addButton);

    expect(screen.getByText("CreateModal")).toBeInTheDocument();
  });

  it("selects a row and shows slide details", async () => {
    render(<SARPage />);

    await waitFor(() => {
      expect(mockedGetSARs).toHaveBeenCalledTimes(1);
    });

    // there will be multiple "Alice" (table cell + slide); for click we want the table cell
    const aliceCells = screen.getAllByText("Alice");
    const aliceRow = aliceCells[0].closest("tr")!;
    fireEvent.click(aliceRow);

    // slide details use the actual SARPage markup
    await waitFor(() => {
      // check the heading inside the slide, not the table cell
      expect(
        screen.getByRole("heading", { level: 3, name: "Alice" })
      ).toBeInTheDocument();
      // email appears once in table and once in slide, that's fine
      expect(
        screen.getAllByText("alice@example.com").length
      ).toBeGreaterThanOrEqual(1);
    });

    const closeBtn = screen.getByRole("button", { name: "✕" });
    fireEvent.click(closeBtn);

    // row is still present in the table, but the slide heading should be gone
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByRole("heading", { level: 3, name: "Alice" })
    ).not.toBeInTheDocument();
  });

  it("filters by email using the search bar and getByEmail", async () => {
    render(<SARPage />);

    await waitFor(() => {
      expect(mockedGetSARs).toHaveBeenCalledTimes(1);
    });

    const input = screen.getByPlaceholderText("sar.searchPlaceholder");
    fireEvent.change(input, { target: { value: "alice@example.com" } });

    const searchButton = screen.getByTitle("Search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedGetByEmail).toHaveBeenCalledTimes(1);
      expect(mockedGetByEmail).toHaveBeenCalledWith({
        address: "alice@example.com",
      });
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("clear search resets the filtered list", async () => {
    render(<SARPage />);

    await waitFor(() => {
      expect(mockedGetSARs).toHaveBeenCalledTimes(1);
    });

    const input = screen.getByPlaceholderText("sar.searchPlaceholder");
    fireEvent.change(input, { target: { value: "alice@example.com" } });

    const searchButton = screen.getByTitle("Search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedGetByEmail).toHaveBeenCalledTimes(1);
    });

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("uses toast loading and dismiss around loadData", async () => {
    render(<SARPage />);

    await waitFor(() => {
      expect(mockedGetSARs).toHaveBeenCalledTimes(1);
    });

    // we just care that loading/dismiss were used at least once
    expect(mockedToast.loading).toHaveBeenCalled();
    expect(mockedToast.dismiss).toHaveBeenCalled();
  });
});
