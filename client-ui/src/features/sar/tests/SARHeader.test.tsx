import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SARHeader from "../components/SARHeader";

const t = (key: string, opts?: any) =>
  opts && typeof opts.count === "number" ? `${key} (${opts.count})` : key;

describe("SARHeader", () => {
  it("renders the correct title", () => {
    render(
      <SARHeader
        t={t}
        totalItems={5}
        onCreateClick={() => {}}
        icon={<span data-testid="icon">I</span>}
      />
    );

    expect(screen.getByText("sar.title")).toBeInTheDocument();
  });

  it("renders the count using the translation function", () => {
    render(<SARHeader t={t} totalItems={7} onCreateClick={() => {}} />);

    expect(screen.getByText("sar.count (7)")).toBeInTheDocument();
  });

  it("renders the + add button", () => {
    render(<SARHeader t={t} totalItems={0} onCreateClick={() => {}} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("+");
  });

  it("calls onCreateClick when the + button is clicked", () => {
    const onCreateClick = vi.fn();

    render(<SARHeader t={t} totalItems={3} onCreateClick={onCreateClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it("snapshot - keeps structure stable", () => {
    const { container } = render(
      <SARHeader t={t} totalItems={10} onCreateClick={() => {}} />
    );

    expect(container).toMatchSnapshot();
  });
});
