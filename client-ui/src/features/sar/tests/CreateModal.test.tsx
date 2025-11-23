// src/features/sar/tests/CreateModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateModal from "../components/CreateModal";
import toast from "react-hot-toast";
import { createSAR } from "../services/sarService";
import { getSAOs } from "../../sao/services/saoService";
import { NATIONALITIES } from "../constants/nationalities";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../services/sarService", () => ({
  createSAR: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../sao/services/saoService", () => ({
  getSAOs: vi.fn().mockResolvedValue([
    {
      shippingOrganizationCode: { value: "SAO1" },
      legalName: "Org 1",
    },
  ]),
}));

vi.mock("../constants/nationalities", () => ({
  NATIONALITIES: ["Portugal", "Spain"],
}));

const mockedToast = toast as any;
const mockedCreateSAR = createSAR as any;
const mockedGetSAOs = getSAOs as any;
const mockedNationalities = NATIONALITIES as any;

const t = (key: string) => key;

describe("CreateModal (SAR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with basic fields", async () => {
    render(
      <CreateModal
        setIsCreateOpen={() => {}}
        refresh={async () => {}}
        t={t}
      />
    );

    expect(screen.getByText("sar.add")).toBeInTheDocument();
    expect(screen.getByText("sar.name *")).toBeInTheDocument();
    expect(screen.getByText("sar.citizenId *")).toBeInTheDocument();
    expect(screen.getByText("sar.nationality *")).toBeInTheDocument();
    expect(screen.getByText("sar.sao *")).toBeInTheDocument();
    expect(screen.getByText("sar.email *")).toBeInTheDocument();
    expect(screen.getByText("sar.phone *")).toBeInTheDocument();
    expect(screen.getByText("sar.status *")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedGetSAOs).toHaveBeenCalledTimes(1);
    });

    expect(mockedNationalities).toBeDefined();
  });

  it("submits valid data, calls createSAR, shows success, refresh and closes modal", async () => {
    const setIsCreateOpen = vi.fn();
    const refresh = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateModal
        setIsCreateOpen={setIsCreateOpen}
        refresh={refresh}
        t={t}
      />
    );

    await waitFor(() => {
      expect(mockedGetSAOs).toHaveBeenCalledTimes(1);
    });

    // order of inputs in the DOM:
    // 1) name (input)
    // 2) citizenId (input)
    // 3) email (input type="email")
    // 4) phone (input)
    const textInputs = screen.getAllByRole("textbox");
    const nameInput = textInputs[0];
    const citizenIdInput = textInputs[1];
    const emailInput = textInputs[2];
    const phoneInput = textInputs[3];

    // selects:
    // 1) nationality
    // 2) sao
    // 3) status
    const selects = screen.getAllByRole("combobox");
    const nationalitySelect = selects[0];
    const saoSelect = selects[1];
    const statusSelect = selects[2];

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(citizenIdInput, { target: { value: "P12345" } });
    fireEvent.change(nationalitySelect, { target: { value: "Portugal" } });
    fireEvent.change(saoSelect, { target: { value: "Org 1" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(phoneInput, {
      target: { value: "+351999999999" },
    });
    fireEvent.change(statusSelect, { target: { value: "activated" } });

    const saveBtn = screen.getByText("sar.save");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockedCreateSAR).toHaveBeenCalledTimes(1);
      expect(mockedToast.success).toHaveBeenCalledTimes(1);
      expect(mockedToast.success).toHaveBeenCalledWith("sar.created");
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(setIsCreateOpen).toHaveBeenCalledWith(false);
    });
  });

  it("cancel button closes the modal without calling API", () => {
    const setIsCreateOpen = vi.fn();

    render(
      <CreateModal
        setIsCreateOpen={setIsCreateOpen}
        refresh={async () => {}}
        t={t}
      />
    );

    const cancelBtn = screen.getByText("sar.cancel");
    fireEvent.click(cancelBtn);

    expect(setIsCreateOpen).toHaveBeenCalledTimes(1);
    expect(setIsCreateOpen).toHaveBeenCalledWith(false);
    expect(mockedCreateSAR).not.toHaveBeenCalled();
  });
});
