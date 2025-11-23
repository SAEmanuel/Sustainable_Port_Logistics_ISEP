import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DeleteModal from "../components/DeleteModal";
import toast from "react-hot-toast";
import { deleteSAR } from "../services/sarService";
import type { sar } from "../domain/sar";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../services/sarService", () => ({
  deleteSAR: vi.fn().mockResolvedValue({}),
}));

const mockedToast = toast as any;
const mockedDeleteSAR = deleteSAR as any;

const t = (key: string) => key;

const sampleSar: sar = {
  id: "sar-1",
  name: "John Doe",
  citizenId: { passportNumber: "P12345" },
  nationality: "Portugal",
  email: { address: "john@example.com" },
  phoneNumber: { number: "+351999999999" },
  sao: "Org 1",
  notifs: [],
  status: "activated",
};

describe("DeleteModal (SAR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

    it("renders the sar basic information", () => {
        render(
            <DeleteModal
            deleteModel={sampleSar}
            closeDelete={() => {}}
            refresh={async () => {}}
            t={t}
            />
        );

        // título do modal (heading)
        expect(
            screen.getByRole("heading", { name: "sar.delete" })
        ).toBeInTheDocument();

        // labels + valores
        expect(screen.getByText(/sar\.name\s*:/)).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();

        expect(screen.getByText(/sar\.email\s*:/)).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();

        expect(screen.getByText(/sar\.phone\s*:/)).toBeInTheDocument();
        expect(screen.getByText("+351999999999")).toBeInTheDocument();

        expect(screen.getByText(/sar\.sao\s*:/)).toBeInTheDocument();
        expect(screen.getByText("Org 1")).toBeInTheDocument();
    });

  it("cancel button only calls closeDelete", () => {
    const closeDelete = vi.fn();
    const refresh = vi.fn();

    render(
      <DeleteModal
        deleteModel={sampleSar}
        closeDelete={closeDelete}
        refresh={refresh}
        t={t}
      />
    );

    const cancelBtn = screen.getByText("sar.cancel");
    fireEvent.click(cancelBtn);

    expect(closeDelete).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
    expect(mockedDeleteSAR).not.toHaveBeenCalled();
  });

  it("delete button calls API, shows success, refresh and closes", async () => {
    const closeDelete = vi.fn();
    const refresh = vi.fn().mockResolvedValue(undefined);

    render(
      <DeleteModal
        deleteModel={sampleSar}
        closeDelete={closeDelete}
        refresh={refresh}
        t={t}
      />
    );

    const deleteButtons = screen.getAllByText("sar.delete");
    const deleteBtn = deleteButtons[deleteButtons.length - 1];

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockedDeleteSAR).toHaveBeenCalledTimes(1);
      expect(mockedDeleteSAR).toHaveBeenCalledWith("sar-1");
      expect(mockedToast.success).toHaveBeenCalledTimes(1);
      expect(mockedToast.success).toHaveBeenCalledWith("sar.deleted");
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(closeDelete).toHaveBeenCalledTimes(1);
    });
  });
});
