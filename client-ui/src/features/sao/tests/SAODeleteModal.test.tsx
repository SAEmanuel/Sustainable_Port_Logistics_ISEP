import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SAODeleteModal from "../components/SAODeleteModal";
import toast from "react-hot-toast";
import { deleteSAO } from "../services/saoService";
import type { SAO } from "../domain/sao";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../services/saoService", () => ({
  deleteSAO: vi.fn().mockResolvedValue({}),
}));

const mockedToast = toast as any;
const mockedDeleteSAO = deleteSAO as any;

const t = (key: string) => key;

const sampleSao: SAO = {
  shippingOrganizationCode : {value : "SAO0000001"},
  legalName: "Org 1",
  altName: "Alt Org 1",
  address: "Rua X",
  taxnumber: { value: "123456789" },
};

describe("SAODeleteModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza nada se isOpen for false ou deleteModel for null", () => {
    const { container } = render(
      <SAODeleteModal
        isOpen={false}
        deleteModel={null}
        closeDelete={() => {}}
        refresh={async () => {}}
        t={t}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renderiza a informação básica do SAO quando aberto", () => {
    render(
      <SAODeleteModal
        isOpen={true}
        deleteModel={sampleSao}
        closeDelete={() => {}}
        refresh={async () => {}}
        t={t}
      />
    );

    // aqui usamos o heading em vez de getByText simples
    expect(
      screen.getByRole("heading", { name: "sao.delete" })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/sao\.details\.legalName\s*:/)
    ).toBeInTheDocument();
    expect(screen.getByText("Org 1")).toBeInTheDocument();

    expect(
      screen.getByText(/sao\.details\.altName\s*:/)
    ).toBeInTheDocument();
    expect(screen.getByText("Alt Org 1")).toBeInTheDocument();

    expect(
      screen.getByText(/sao\.details\.address\s*:/)
    ).toBeInTheDocument();
    expect(screen.getByText("Rua X")).toBeInTheDocument();

    expect(
      screen.getByText(/sao\.details\.taxnumber\s*:/)
    ).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
  });

  it("botão cancelar apenas chama closeDelete", () => {
    const closeDelete = vi.fn();
    const refresh = vi.fn();

    render(
      <SAODeleteModal
        isOpen={true}
        deleteModel={sampleSao}
        closeDelete={closeDelete}
        refresh={refresh}
        t={t}
      />
    );

    const cancelBtn = screen.getByText("sao.cancel");
    fireEvent.click(cancelBtn);

    expect(closeDelete).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
    expect(mockedDeleteSAO).not.toHaveBeenCalled();
  });

  it("botão delete chama API, mostra sucesso, faz refresh e fecha", async () => {
    const closeDelete = vi.fn();
    const refresh = vi.fn().mockResolvedValue(undefined);

    render(
      <SAODeleteModal
        isOpen={true}
        deleteModel={sampleSao}
        closeDelete={closeDelete}
        refresh={refresh}
        t={t}
      />
    );

    const deleteButtons = screen.getAllByText("sao.delete");
    const deleteBtn = deleteButtons[deleteButtons.length - 1];

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockedDeleteSAO).toHaveBeenCalledTimes(1);
      expect(mockedDeleteSAO).toHaveBeenCalledWith("Org 1");
      expect(mockedToast.success).toHaveBeenCalledTimes(1);
      expect(mockedToast.success).toHaveBeenCalledWith("sao.deleted");
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(closeDelete).toHaveBeenCalledTimes(1);
    });
  });
});
