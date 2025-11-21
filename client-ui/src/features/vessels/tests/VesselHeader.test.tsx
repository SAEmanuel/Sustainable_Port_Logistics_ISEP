// src/features/vessels/tests/VesselHeader.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VesselHeader } from "../components/VesselHeader";

// mock simples do useTranslation
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, opts?: any) => {
            if (key === "Vessel.count") {
                return `Vessel.count (${opts?.count})`;
            }
            return key;
        },
    }),
}));

describe("VesselHeader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renderiza título e contagem com a key de tradução", () => {
        render(
            <VesselHeader
                count={3}
                onCreate={() => {}}
                onOpenStats={() => {}}
            />
        );

        // título
        expect(screen.getByText("Vessel.title")).toBeTruthy();

        // contagem formatada pelo nosso mock
        expect(screen.getByText("Vessel.count (3)")).toBeTruthy();
    });

    it("botão + chama onCreate", () => {
        const onCreate = vi.fn();

        render(
            <VesselHeader
                count={2}
                onCreate={onCreate}
                onOpenStats={() => {}}
            />
        );

        const addBtn = screen
            .getAllByRole("button")
            .find(b => b.textContent?.includes("Vessel.buttons.add"))!;

        fireEvent.click(addBtn);

        expect(onCreate).toHaveBeenCalledTimes(1);
    });

    it("botão de stats chama onOpenStats", () => {
        const onOpenStats = vi.fn();

        render(
            <VesselHeader
                count={2}
                onCreate={() => {}}
                onOpenStats={onOpenStats}
            />
        );

        const statsBtn = screen
            .getAllByRole("button")
            .find(b => b.textContent?.includes("Vessel.buttons.stats"))!;

        fireEvent.click(statsBtn);

        expect(onOpenStats).toHaveBeenCalledTimes(1);
    });
});
