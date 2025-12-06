import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import dataRightsService from "../service/dataRightsService";
import { mapRequestsDto } from "../mappers/dataRightsMapper";
import type {
    DataRightsRequest,
    CreatingDataRightsRequest,
    RequestType,
    RectificationPayload,
} from "../domain/dataRights";

// Se usares Auth0:
import { useAuth0 } from "@auth0/auth0-react";

function emptyRectification(): RectificationPayload {
    return {
        newName: "",
        newEmail: "",
        newPicture: "",
        isActive: null,
        newPhoneNumber: "",
        newNationality: "",
        newCitizenId: "",
        reason: "",
    };
}

function emptyCreating(): CreatingDataRightsRequest {
    return {
        type: "Access",
        rectification: emptyRectification(),
        deletionReason: "",
    };
}

export function useDataRightsRequests() {
    const { t } = useTranslation();
    const { user } = useAuth0(); // ajusta se usares outro auth

    const [items, setItems] = useState<DataRightsRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<DataRightsRequest | null>(null);

    const [creating, setCreating] = useState<CreatingDataRightsRequest>(
        emptyCreating()
    );
    const [isCreateOpen, setIsCreateOpen] = useState(true); // painel “Novo pedido”

    const email = user?.email;
    const userId = user?.sub ?? ""; // ou o teu auth0UserId

    async function reload() {
        if (!email) return;
        try {
            setLoading(true);
            const dtos = await dataRightsService.getRequestsForUser(email);
            const mapped = mapRequestsDto(dtos);
            setItems(mapped);
            if (mapped.length && !selected) setSelected(mapped[0]);
        } catch (e: any) {
            toast.error(
                e?.response?.data ??
                t("dataRights.toast.listError", "Error loading your requests")
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (email) reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    const filtered = useMemo(() => {
        if (!query.trim()) return items;
        const q = query.toLowerCase();

        return items.filter(r => {
            const txt =
                `${r.requestId} ${r.type} ${r.status} ${r.userEmail}`.toLowerCase();
            return txt.includes(q);
        });
    }, [items, query]);

    async function submitNewRequest() {
        if (!email || !userId) {
            toast.error(
                t("dataRights.toast.noUser", "You must be logged in to create a request")
            );
            return;
        }

        try {
            let payload: string | undefined = undefined;

            if (creating.type === "Rectification") {
                const p = { ...creating.rectification };

                // limpar campos vazios para não mandar lixo
                Object.keys(p).forEach(k => {
                    const key = k as keyof RectificationPayload;
                    if (
                        p[key] === "" ||
                        p[key] === undefined ||
                        p[key] === null
                    ) {
                        delete p[key];
                    }
                });

                payload = JSON.stringify(p);
            } else if (creating.type === "Deletion") {
                if (!creating.deletionReason.trim()) {
                    toast.error(
                        t(
                            "dataRights.toast.deletionReasonRequired",
                            "Please provide a reason for deletion"
                        )
                    );
                    return;
                }
                payload = JSON.stringify({
                    reason: creating.deletionReason.trim(),
                });
            } else {
                // Access não pode ter payload
                payload = undefined;
            }

            const dto = {
                userId,
                userEmail: email,
                type: creating.type,
                payload,
            } as const;

            const created = await dataRightsService.createRequest(dto);
            const mapped = mapRequestDto(created);

            setItems(prev => [mapped, ...prev]);
            setSelected(mapped);
            setCreating(emptyCreating());
            toast.success(
                t(
                    "dataRights.toast.created",
                    "Your data rights request has been created ✅"
                )
            );
        } catch (e: any) {
            toast.error(
                e?.response?.data ??
                t(
                    "dataRights.toast.createError",
                    "Error creating data rights request"
                )
            );
        }
    }

    function setType(type: RequestType) {
        setCreating(prev => ({
            ...prev,
            type,
        }));
    }

    function updateRectification(partial: Partial<RectificationPayload>) {
        setCreating(prev => ({
            ...prev,
            rectification: {
                ...prev.rectification,
                ...partial,
            },
        }));
    }

    return {
        // data
        items,
        filtered,
        loading,
        selected,
        setSelected,

        // search
        query,
        setQuery,

        // create
        creating,
        setType,
        updateRectification,
        setCreating,
        submitNewRequest,
        isCreateOpen,
        setIsCreateOpen,

        // util
        reload,
    };
}

function mapRequestDto(dto: any): DataRightsRequest {
    // helper local (se quiseres, usa o mapper partilhado)
    return { ...dto };
}
