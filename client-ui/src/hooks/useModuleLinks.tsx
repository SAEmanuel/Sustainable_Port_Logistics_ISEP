
import { useMemo } from "react";
import { Roles, type Role } from "../app/types";
import {
    FaUsers, FaCogs, FaCertificate, FaUniversity, FaShip, FaProjectDiagram, FaCalendarAlt
} from "react-icons/fa";
import {
    FiShuffle, FiTablet, FiAnchor, FiBox, FiFileText, FiMapPin, FiGrid
} from "react-icons/fi";
import { BsBookmarksFill } from "react-icons/bs";
import { BookAIcon } from "lucide-react";


export const roleColor: Record<Role, string> = {
    [Roles.Administrator]: "#e63946",
    [Roles.LogisticsOperator]: "#4361ee",
    [Roles.ShippingAgentRepresentative]: "#f3722c",
    [Roles.PortAuthorityOfficer]: "#2a9d8f",
    [Roles.ProjectManager]: "#9b59b6",
    [Roles.PortOperationsSupervisor]: "#ded418",
};


const routeConfig: Record<string, JSX.Element> = {
    "/dashboard": <FiGrid />,
    "/vvn": <FaUniversity />,
    "/qualifications": <FaCertificate />,
    "/staff-members": <FaUsers />,
    "/physical-resources": <FaCogs />,
    "/vessels": <FaShip />,
    "/projects": <FaProjectDiagram />,
    "/storage-areas": <FiBox />,
    "/docks": <FiMapPin />,
    "/vessel-types": <FiAnchor />,
    "/responsevvn": <FiFileText />,
    "/sao": <FiFileText />,
    "/datarights": <FiTablet />,
    "/datarightsAdmin": <FiShuffle />,
    "/ctc": <BsBookmarksFill />,
    "/ct": <BookAIcon />,
    "/users": <FaCogs />,
    "/planning-scheduling": <FaCalendarAlt />,
    "/sar": <FiFileText />,
    "/incidentType": <FiFileText />,
    "/3dSecene": <FiBox />
};

export type ModuleLink = {
    label: string;
    path: string;
    icon: JSX.Element;
    color: string;
};

export function useModuleLinks(t: (k: string) => string, role?: Role | string | null) {
    return useMemo<ModuleLink[]>(() => {
        if (!role) return [];


        const color = (Object.values(Roles).includes(role as Role))
            ? roleColor[role as Role]
            : "#333";

        const L: ModuleLink[] = [];


        const add = (labelKey: string, path: string, iconOverride?: JSX.Element) => {
            L.push({
                label: t(labelKey),
                path,
                icon: iconOverride || routeConfig[path] || <FiFileText />,
                color
            });
        };

        switch (role) {
            case Roles.LogisticsOperator:
                add("menu.dashboard", "/dashboard");
                add("dashboard.qualifications", "/qualifications");
                add("dashboard.physicalResources", "/physical-resources");
                add("dashboard.staffMembers", "/staff-members");
                add("dashboard.ct", "/ct");
                add("dashboard.port3d", "/3dSecene");
                add("dashboard.dd", "/datarights");
                break;

            case Roles.ShippingAgentRepresentative:
                add("dashboard.vvn", "/vvn");
                add("dashboard.dd", "/datarights");
                break;

            case Roles.PortOperationsSupervisor:
                add("dashboard.ctc", "/ctc");
                add("dashboard.dd", "/datarights");
                break;

            case Roles.PortAuthorityOfficer:
                add("dashboard.docks", "/docks");
                add("dashboard.responsevvn", "/responsevvn");
                add("dashboard.vessels", "/vessels");
                add("dashboard.vessel-types", "/vessel-types");
                add("dashboard.storage-areas", "/storage-areas");
                add("dashboard.sao", "/sao");
                add("menu.sar", "/sar");
                add("menu.incidentType", "/incidentType");
                add("dashboard.port3d", "/3dSecene");
                add("dashboard.dd", "/datarights");
                break;

            case Roles.ProjectManager:
                add("dashboard.planning", "/planning-scheduling");
                add("dashboard.port3d", "/3dSecene");
                add("dashboard.dd", "/datarights");
                break;

            case Roles.Administrator:
                add("dashboard.adminPanel", "/users");
                add("menu.vvn", "/vvn");
                add("dashboard.port3d", "/3dSecene");
                add("dashboard.dd", "/datarights");
                add("dashboard.ddAdmin", "/datarightsAdmin");
                add("menu.pp", "/pp");
                break;
        }
        return L;
    }, [role, t]);
}