// src/features/sar/tests/EditModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditModal from "../components/EditModal";
import toast from "react-hot-toast";
import { updateSAR } from "../services/sarService";
import type { sar } from "../domain/sar";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../services/sarService", () => ({
  updateSAR: vi.fn().mockResolvedValue({}),
}));

const mockedToast = toast as any;
const mockedUpdateSAR = updateSAR as any;

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

describe("EditModal (SAR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial form values from editModel", () => {
    render(
      <EditModal
        editModel={sampleSar}
        closeEdit={() => {}}
        refresh={async () => {}}
        t={t}
      />
    );

    // in the edit form, there are:
    // 1) email (textbox)
    // 2) phone (textbox)
    const textInputs = screen.getAllByRole("textbox");
    const emailInput = textInputs[0] as HTMLInputElement;
    const phoneInput = textInputs[1] as HTMLInputElement;

    const statusSelect = screen.getByRole("combobox") as HTMLSelectElement;

    expect(emailInput.value).toBe("john@example.com");
    expect(phoneInput.value).toBe("+351999999999");
    expect(statusSelect.value).toBe("activated");
  });

  it("updates data and calls API, shows success, refresh and closes on submit", async () => {
    const closeEdit = vi.fn();
    const refresh = vi.fn().mockResolvedValue(undefined);

    render(
      <EditModal
        editModel={sampleSar}
        closeEdit={closeEdit}
        refresh={refresh}
        t={t}
      />
    );

    const textInputs = screen.getAllByRole("textbox");
    const emailInput = textInputs[0] as HTMLInputElement;
    const phoneInput = textInputs[1] as HTMLInputElement;
    const statusSelect = screen.getByRole("combobox") as HTMLSelectElement;

    fireEvent.change(emailInput, {
      target: { value: "new@example.com" },
    });
    fireEvent.change(phoneInput, {
      target: { value: "+351111111111" },
    });
    fireEvent.change(statusSelect, {
      target: { value: "deactivated" },
    });

    const saveBtn = screen.getByText("sar.update");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockedUpdateSAR).toHaveBeenCalledTimes(1);
      // first argument is the original email.address from editModel
      expect(mockedUpdateSAR.mock.calls[0][0]).toBe("john@example.com");
      expect(mockedToast.success).toHaveBeenCalledTimes(1);
      expect(mockedToast.success).toHaveBeenCalledWith("sar.updated");
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(closeEdit).toHaveBeenCalledTimes(1);
    });
  });

  it("cancel button closes the modal without calling API", () => {
    const closeEdit = vi.fn();

    render(
      <EditModal
        editModel={sampleSar}
        closeEdit={closeEdit}
        refresh={async () => {}}
        t={t}
      />
    );

    const cancelBtn = screen.getByText("sar.cancel");
    fireEvent.click(cancelBtn);

    expect(closeEdit).toHaveBeenCalledTimes(1);
    expect(mockedUpdateSAR).not.toHaveBeenCalled();
  });
});
