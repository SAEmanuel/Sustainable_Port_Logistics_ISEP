import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SAOSearchBar from "../components/SAOSearchBar";
import type { SearchMode } from "../components/SAOSearchBar";

const t = (key: string) => key;

describe("SAOSearchBar", () => {
  it("renderiza os botões de modo de pesquisa e o input", () => {
    render(
      <SAOSearchBar
        searchMode="legalName"
        searchValue=""
        onChangeSearchMode={() => {}}
        onChangeSearchValue={() => {}}
        onSearch={() => {}}
        onClearResults={() => {}}
        t={t}
      />
    );

    expect(screen.getByText("sao.searchMode")).toBeInTheDocument();
    expect(screen.getByText("sao.details.legalName")).toBeInTheDocument();
    expect(screen.getByText("sao.details.taxnumber")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("sao.searchPlaceholder")
    ).toBeInTheDocument();
  });

  it("chama onChangeSearchMode quando se troca de modo", () => {
    const onChangeSearchMode = vi.fn();

    render(
      <SAOSearchBar
        searchMode="legalName"
        searchValue=""
        onChangeSearchMode={onChangeSearchMode}
        onChangeSearchValue={() => {}}
        onSearch={() => {}}
        onClearResults={() => {}}
        t={t}
      />
    );

    const legalNameBtn = screen.getByText("sao.details.legalName");
    const taxnumberBtn = screen.getByText("sao.details.taxnumber");

    fireEvent.click(legalNameBtn);
    fireEvent.click(taxnumberBtn);

    expect(onChangeSearchMode).toHaveBeenCalledWith("legalName");
    expect(onChangeSearchMode).toHaveBeenCalledWith("taxnumber");
  });

  it("chama onChangeSearchValue ao escrever no input", () => {
    const onChangeSearchValue = vi.fn();
    const onClearResults = vi.fn();

    render(
      <SAOSearchBar
        searchMode="legalName"
        searchValue=""
        onChangeSearchMode={() => {}}
        onChangeSearchValue={onChangeSearchValue}
        onSearch={() => {}}
        onClearResults={onClearResults}
        t={t}
      />
    );

    const input = screen.getByPlaceholderText("sao.searchPlaceholder");
    fireEvent.change(input, { target: { value: "Org 1" } });

    expect(onChangeSearchValue).toHaveBeenCalledWith("Org 1");
    expect(onClearResults).not.toHaveBeenCalled();
  });

  it("quando o valor fica vazio, chama onClearResults", () => {
    const onChangeSearchValue = vi.fn();
    const onClearResults = vi.fn();

    render(
      <SAOSearchBar
        searchMode="legalName"
        searchValue="inicial"
        onChangeSearchMode={() => {}}
        onChangeSearchValue={onChangeSearchValue}
        onSearch={() => {}}
        onClearResults={onClearResults}
        t={t}
      />
    );

    const input = screen.getByPlaceholderText("sao.searchPlaceholder");
    // simula apagar tudo
    fireEvent.change(input, { target: { value: "" } });

    expect(onChangeSearchValue).toHaveBeenCalledWith("");
    expect(onClearResults).toHaveBeenCalledTimes(1);
  });

  it("botão ✕ limpa o input e chama onClearResults", () => {
    const onChangeSearchValue = vi.fn();
    const onClearResults = vi.fn();

    render(
      <SAOSearchBar
        searchMode="legalName"
        searchValue="algo"
        onChangeSearchMode={() => {}}
        onChangeSearchValue={onChangeSearchValue}
        onSearch={() => {}}
        onClearResults={onClearResults}
        t={t}
      />
    );

    const clearBtn = screen.getByText("✕");
    fireEvent.click(clearBtn);

    expect(onChangeSearchValue).toHaveBeenCalledWith("");
    expect(onClearResults).toHaveBeenCalledTimes(1);
  });

  it("Enter no input dispara onSearch", () => {
    const onSearch = vi.fn();

    render(
      <SAOSearchBar
        searchMode="legalName"
        searchValue="Org 1"
        onChangeSearchMode={() => {}}
        onChangeSearchValue={() => {}}
        onSearch={onSearch}
        onClearResults={() => {}}
        t={t}
      />
    );

    const input = screen.getByPlaceholderText("sao.searchPlaceholder");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("botão de pesquisa dispara onSearch", () => {
    const onSearch = vi.fn();

    render(
      <SAOSearchBar
        searchMode="legalName"
        searchValue="Org 1"
        onChangeSearchMode={() => {}}
        onChangeSearchValue={() => {}}
        onSearch={onSearch}
        onClearResults={() => {}}
        t={t}
      />
    );

    const button = screen.getByText("🔍");
    fireEvent.click(button);

    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
