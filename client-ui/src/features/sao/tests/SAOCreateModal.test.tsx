import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SAOCreateModal from "../components/SAOCreateModal";

const t = (key: string) => key;

describe("SAOCreateModal", () => {
  it("não renderiza nada quando isOpen é false", () => {
    const { container } = render(
      <SAOCreateModal
        isOpen={false}
        legalName=""
        altName=""
        address=""
        taxnumber=""
        onChangeLegalName={() => {}}
        onChangeAltName={() => {}}
        onChangeAddress={() => {}}
        onChangeTaxnumber={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        t={t}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renderiza os campos e labels quando isOpen é true", () => {
    render(
      <SAOCreateModal
        isOpen={true}
        legalName=""
        altName=""
        address=""
        taxnumber=""
        onChangeLegalName={() => {}}
        onChangeAltName={() => {}}
        onChangeAddress={() => {}}
        onChangeTaxnumber={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        t={t}
      />
    );

    expect(screen.getByText("sao.add")).toBeInTheDocument();
    expect(screen.getByText("sao.details.legalName *")).toBeInTheDocument();
    expect(screen.getByText("sao.details.altName")).toBeInTheDocument();
    expect(screen.getByText("sao.details.address")).toBeInTheDocument();
    expect(screen.getByText("sao.details.taxnumber *")).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBe(4);
  });

  it("chama os handlers de alteração ao escrever nos inputs", () => {
    const onChangeLegalName = vi.fn();
    const onChangeAltName = vi.fn();
    const onChangeAddress = vi.fn();
    const onChangeTaxnumber = vi.fn();

    render(
      <SAOCreateModal
        isOpen={true}
        legalName=""
        altName=""
        address=""
        taxnumber=""
        onChangeLegalName={onChangeLegalName}
        onChangeAltName={onChangeAltName}
        onChangeAddress={onChangeAddress}
        onChangeTaxnumber={onChangeTaxnumber}
        onSave={() => {}}
        onCancel={() => {}}
        t={t}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const legalNameInput = inputs[0];
    const altNameInput = inputs[1];
    const addressInput = inputs[2];
    const taxnumberInput = inputs[3];

    fireEvent.change(legalNameInput, { target: { value: "Legal" } });
    fireEvent.change(altNameInput, { target: { value: "Alt" } });
    fireEvent.change(addressInput, { target: { value: "Rua X" } });
    fireEvent.change(taxnumberInput, { target: { value: "123456789" } });

    expect(onChangeLegalName).toHaveBeenCalledWith("Legal");
    expect(onChangeAltName).toHaveBeenCalledWith("Alt");
    expect(onChangeAddress).toHaveBeenCalledWith("Rua X");
    expect(onChangeTaxnumber).toHaveBeenCalledWith("123456789");
  });

  it("botão save chama onSave", () => {
    const onSave = vi.fn();

    render(
      <SAOCreateModal
        isOpen={true}
        legalName=""
        altName=""
        address=""
        taxnumber=""
        onChangeLegalName={() => {}}
        onChangeAltName={() => {}}
        onChangeAddress={() => {}}
        onChangeTaxnumber={() => {}}
        onSave={onSave}
        onCancel={() => {}}
        t={t}
      />
    );

    const saveBtn = screen.getByText("sao.save");
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("botão cancel chama onCancel", () => {
    const onCancel = vi.fn();

    render(
      <SAOCreateModal
        isOpen={true}
        legalName=""
        altName=""
        address=""
        taxnumber=""
        onChangeLegalName={() => {}}
        onChangeAltName={() => {}}
        onChangeAddress={() => {}}
        onChangeTaxnumber={() => {}}
        onSave={() => {}}
        onCancel={onCancel}
        t={t}
      />
    );

    const cancelBtn = screen.getByText("sao.cancel");
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
