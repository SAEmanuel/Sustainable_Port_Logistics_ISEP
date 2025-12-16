import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IncidentType, Severity } from "../domain/incidentType";
import "../style/incidentType.css";

type TreeNode = IncidentType & { children: TreeNode[] };

function buildTree(list: IncidentType[], focusCode?: string | null): TreeNode[] {
    const map = new Map<string, TreeNode>();
    list.forEach(it => map.set(it.code, { ...it, children: [] }));

    // attach children
    map.forEach(node => {
        if (node.parentCode && map.has(node.parentCode)) {
            map.get(node.parentCode)!.children.push(node);
        }
    });

    // roots = nodes whose parent not in list OR parentCode null
    const roots: TreeNode[] = [];
    map.forEach(node => {
        if (!node.parentCode || !map.has(node.parentCode)) roots.push(node);
    });

    // if focusCode exists, return that node as single-root (when present)
    if (focusCode && map.has(focusCode)) return [map.get(focusCode)!];

    // sort for stable output
    const sortRec = (n: TreeNode) => {
        n.children.sort((a, b) => a.code.localeCompare(b.code));
        n.children.forEach(sortRec);
    };
    roots.sort((a, b) => a.code.localeCompare(b.code));
    roots.forEach(sortRec);

    return roots;
}

function SeverityPill({ severity }: { severity: Severity }) {
    const { t } = useTranslation();
    return (
        <span className={`severity-pill severity-${severity.toLowerCase()}`}>
      {t(`incidentType.severity.${severity}`)}
    </span>
    );
}

function TreeItem({
                      node,
                      selectedCode,
                      depth,
                      expanded,
                      toggle,
                      onSelect,
                  }: {
    node: TreeNode;
    selectedCode: string | null;
    depth: number;
    expanded: Set<string>;
    toggle: (code: string) => void;
    onSelect: (code: string) => void;
}) {
    const isSelected = selectedCode === node.code;
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.code);

    return (
        <div className="it-tree-node" style={{ marginLeft: depth * 16 }}>
            <div className={`it-tree-row ${isSelected ? "it-tree-row-selected" : ""}`}>
                <button
                    type="button"
                    className="it-tree-toggle"
                    disabled={!hasChildren}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) toggle(node.code);
                    }}
                    title={hasChildren ? (isExpanded ? "Collapse" : "Expand") : "No children"}
                >
                    {hasChildren ? (isExpanded ? "▾" : "▸") : "•"}
                </button>

                <button
                    type="button"
                    className="it-tree-main"
                    onClick={() => onSelect(node.code)}
                    title={`${node.code} — ${node.name}`}
                >
                    <span className="it-tree-code">{node.code}</span>
                    <span className="it-tree-name">{node.name}</span>
                    <SeverityPill severity={node.severity} />
                </button>
            </div>

            {hasChildren && isExpanded && (
                <div className="it-tree-children">
                    {node.children.map(child => (
                        <TreeItem
                            key={child.code}
                            node={child}
                            selectedCode={selectedCode}
                            depth={depth + 1}
                            expanded={expanded}
                            toggle={toggle}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function IncidentTypeHierarchyPanel({
                                                       selected,
                                                       subtree,
                                                       loading,
                                                       error,
                                                       onNodeSelect,
                                                       onRefresh,
                                                   }: {
    selected: IncidentType | null;
    subtree: IncidentType[];
    loading: boolean;
    error: string | null;
    onNodeSelect: (code: string) => void;
    onRefresh: () => void;
}) {
    const { t } = useTranslation();

    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const treeRoots = useMemo(() => {
        // default: focus on selected node as root (tree “centred”)
        const roots = buildTree(subtree, selected?.code ?? null);

        // auto-expand first level for better UX
        const next = new Set<string>();
        roots.forEach(r => next.add(r.code));
        setExpanded(prev => (prev.size ? prev : next));

        return roots;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtree, selected?.code]);

    const toggle = (code: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    return (
        <div className="it-hierarchy-card">
            <div className="it-hierarchy-header">
                <div>
                    <div className="it-hierarchy-title">{t("incidentType.hierarchy.title")}</div>
                    <div className="it-hierarchy-subtitle">
                        {selected ? `${selected.code} — ${selected.name}` : t("incidentType.hierarchy.subtitleEmpty")}
                    </div>
                </div>

                <button type="button" className="it-hierarchy-refresh" onClick={onRefresh} disabled={!selected || loading}>
                    {t("incidentType.hierarchy.refresh")}
                </button>
            </div>

            {!selected && (
                <div className="it-hierarchy-empty">
                    {t("incidentType.hierarchy.empty")}
                </div>
            )}

            {selected && loading && (
                <div className="it-hierarchy-loading">
                    {t("incidentType.hierarchy.loading")}
                </div>
            )}

            {selected && !loading && error && (
                <div className="it-hierarchy-error">
                    {error}
                </div>
            )}

            {selected && !loading && !error && subtree.length === 0 && (
                <div className="it-hierarchy-empty">
                    {t("incidentType.hierarchy.noSubtree")}
                </div>
            )}

            {selected && !loading && !error && subtree.length > 0 && (
                <div className="it-tree">
                    {treeRoots.map(root => (
                        <TreeItem
                            key={root.code}
                            node={root}
                            selectedCode={selected.code}
                            depth={0}
                            expanded={expanded}
                            toggle={toggle}
                            onSelect={onNodeSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
