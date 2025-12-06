import "../style/dataRightsStyle.css";

import { useDataRightsRequests } from "../hooks/useDataRightsRequests";
import { DataRightsHeader } from "../components/DataRightsHeader";
import { DataRightsStrip } from "../components/DataRightsStrip";
import { DataRightsMainPanel } from "../components/DataRightsMainPanel";
import { DataRightsCreatePanel } from "../components/DataRightsCreatePanel";

export default function DataRightsRequestsPage() {
    const {
        loading,
        filtered,
        selected,
        setSelected,
        query,
        setQuery,
        creating,
        setType,
        updateRectification,
        setCreating,
        submitNewRequest,
        isCreateOpen,
        setIsCreateOpen,
    } = useDataRightsRequests();

    return (
        <div className="dr-wrapper">
            <DataRightsHeader
                count={filtered.length}
                query={query}
                onQueryChange={setQuery}
                onToggleCreate={() => setIsCreateOpen(v => !v)}
                isCreateOpen={isCreateOpen}
            />

            <div className="dr-content">
                <div className="dr-left">
                    <DataRightsStrip
                        items={filtered}
                        loading={loading}
                        selectedId={selected?.id ?? null}
                        onSelect={setSelected}
                    />
                    <DataRightsMainPanel selected={selected} />
                </div>

                {isCreateOpen && (
                    <div className="dr-right">
                        <DataRightsCreatePanel
                            creating={creating}
                            setType={setType}
                            updateRectification={updateRectification}
                            setCreating={setCreating}
                            onSubmit={submitNewRequest}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
