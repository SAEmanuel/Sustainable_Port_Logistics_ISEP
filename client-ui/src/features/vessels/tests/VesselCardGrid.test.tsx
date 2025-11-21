import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VesselCardGrid } from "../components/VesselCardGrid";
import type { Vessel } from "../domain/vessel";

const vessels: Vessel[] = [
    {
        id: "1",
        name: "Ever Pride",
        owner: "Evergreen",
        imoNumber: "1234567",
        vesselTypeId: "VT1",
    },
    {
        id: "2",
        name: "MSC Helena",
        owner: "MSC",
        imoNumber: { value: "7654321" },
        vesselTypeId: { value: "VT2" },
    },
];

describe("VesselCardGrid", () => {
    it("renderiza um card por cada vessel", () => {
        const onSelect = vi.fn();

        render(
            <VesselCardGrid
                vessels={vessels}
                onSelect={onSelect}
                val={x => (typeof x === "string" ? x : x.value)}
                getVesselTypeNameById={() => "Panamax"}
            />
        );

        // nomes dos navios
        expect(screen.getByText("Ever Pride")).toBeTruthy();
        expect(screen.getByText("MSC Helena")).toBeTruthy();

        // owners
        expect(screen.getByText("Evergreen")).toBeTruthy();
        expect(screen.getByText("MSC")).toBeTruthy();

        // IMO badges
        expect(screen.getByText("1234567")).toBeTruthy();
        expect(screen.getByText("7654321")).toBeTruthy();

        // labels Owner / Type
        expect(screen.getAllByText("Owner").length).toBe(2);
        expect(screen.getAllByText("Type").length).toBe(2);
    });

    it("usa getVesselTypeNameById para mostrar o tipo", () => {
        const onSelect = vi.fn();
        const getVesselTypeNameById = vi
            .fn()
            .mockImplementation(id => (id === "VT1" || id?.value === "VT1" ? "Panamax" : "Feeder"));

        render(
            <VesselCardGrid
                vessels={vessels}
                onSelect={onSelect}
                val={x => (typeof x === "string" ? x : x.value)}
                getVesselTypeNameById={getVesselTypeNameById}
            />
        );

        // tipos devolvidos pelo mock
        // como ambos acabam a devolver "Panamax"/"Feeder", só validamos que aparecem
        expect(screen.getAllByText(/Panamax|Feeder/).length).toBeGreaterThan(0);

        expect(getVesselTypeNameById).toHaveBeenCalledTimes(2);
    });

    it("clicar num card chama onSelect com o vessel correto", () => {
        const onSelect = vi.fn();

        render(
            <VesselCardGrid
                vessels={vessels}
                onSelect={onSelect}
                val={x => (typeof x === "string" ? x : x.value)}
                getVesselTypeNameById={() => "Panamax"}
            />
        );

        const everCard = screen.getByText("Ever Pride").closest(".vt-card")!;
        const mscCard = screen.getByText("MSC Helena").closest(".vt-card")!;

        fireEvent.click(everCard);
        fireEvent.click(mscCard);

        expect(onSelect).toHaveBeenCalledTimes(2);
        expect(onSelect.mock.calls[0][0]).toEqual(vessels[0]);
        expect(onSelect.mock.calls[1][0]).toEqual(vessels[1]);
    });

    it("renderiza vazio quando não há vessels", () => {
        const onSelect = vi.fn();

        const { container } = render(
            <VesselCardGrid
                vessels={[]}
                onSelect={onSelect}
                val={x => x}
                getVesselTypeNameById={() => ""}
            />
        );

        // não deve haver nenhum .vt-card
        expect(container.querySelectorAll(".vt-card").length).toBe(0);
    });
});
