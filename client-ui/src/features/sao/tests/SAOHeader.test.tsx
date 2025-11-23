import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SAOHeader from "../components/SAOHeader";

const t = (key: string, opts?: any) =>
  opts && typeof opts.count === "number" ? `${key} (${opts.count})` : key;

describe("SAOHeader", () => {
  it("renderiza o título correcto", () => {
    render(<SAOHeader count={5} onOpenCreate={() => {}} t={t} />);

    expect(screen.getByText("sao.title")).toBeInTheDocument();
  });

  it("renderiza o count usando a função de tradução", () => {
    render(<SAOHeader count={7} onOpenCreate={() => {}} t={t} />);

    expect(screen.getByText("sao.count (7)")).toBeInTheDocument();
  });

  it("renderiza o botão + add", () => {
    render(<SAOHeader count={0} onOpenCreate={() => {}} t={t} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("+");
  });

  it("chama onOpenCreate quando o botão é clicado", () => {
    const onOpenCreate = vi.fn();

    render(<SAOHeader count={3} onOpenCreate={onOpenCreate} t={t} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onOpenCreate).toHaveBeenCalledTimes(1);
  });

  it("snapshot - estrutura estável", () => {
    const { container } = render(
      <SAOHeader count={10} onOpenCreate={() => {}} t={t} />
    );

    expect(container).toMatchSnapshot();
  });
});
