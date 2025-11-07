import {useState, useRef, useEffect} from "react";
import {useAppStore} from "../app/store";
import {FaUserCircle} from "react-icons/fa";
import LogoutButton from "./LogoutButton";

export default function UserMenu() {
    const user = useAppStore((s) => s.user);
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => setOpen(!open);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const role = user.role?.[0] || "Sem role";

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar / Ícone */}
            <button
                onClick={toggleMenu}
                title={user.name || "User menu"}
                className="flex items-center gap-2"
            >
                {user.picture ? (
                    <img
                        src={user.picture}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <FaUserCircle size={22}/>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 shadow-lg rounded-md p-2 z-50">
                    <div className="px-2 py-1 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 truncate">
                            {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{role}</p>
                    </div>

                    <div className="mt-2 space-y-1">
                        {role === "Administrator" && (
                            <>
                                <button className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">
                                    Painel de Administração
                                </button>
                                <button className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">
                                    Gerir Utilizadores
                                </button>
                            </>
                        )}

                        {role === "Logistics Operator" && (
                            <button className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">
                                Dashboard Logística
                            </button>
                        )}

                        {role === "Shipping Agent Representative" && (
                            <button className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">
                                Meus Navios
                            </button>
                        )}

                        {/* Logout */}
                        <div className="border-t border-gray-200 pt-2">
                            <LogoutButton/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}