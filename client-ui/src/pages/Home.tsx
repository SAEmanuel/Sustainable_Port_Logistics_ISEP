import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../app/store";
import { Roles } from "../app/types";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaShip, FaWarehouse, FaTasks, FaUsersCog } from "react-icons/fa";
import "./css/home.css";

export default function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAppStore((s) => s.user);

    useEffect(() => {
        AOS.init({ duration: 1000, once: true });
    }, []);

    const handleAccess = () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (user.isActive === false) {
            navigate("/inactive");
            return;
        }

        if (!user.role) {
            navigate("/pending-approval");
            return;
        }


        switch (user.role) {
            case Roles.Administrator:
            case Roles.PortAuthorityOfficer:
            case Roles.LogisticsOperator:
            case Roles.ShippingAgentRepresentative:
            case Roles.ProjectManager:
                navigate("/dashboard");
                break;
            default:
                navigate("/pending-approval");
                break;
        }
    };

    return (
        <>
            <section className="hero" data-aos="fade-up">
                <div className="hero-content">
                    <h2>{t("welcomeTitle")}</h2>
                    <p>{t("welcomeText")}</p>
                    <button onClick={handleAccess}>{t("accessButton")}</button>
                </div>
            </section>

            {/* ABOUT */}
            <section className="about" data-aos="fade-up">
                <h3>{t("aboutTitle")}</h3>
                <p>{t("aboutText")}</p>
            </section>

            {/* FEATURES */}
            <section className="features">
                <div className="feature-card" data-aos="zoom-in" data-aos-delay="0">
                    <div className="card-inner">
                        <FaShip size={40} color="#1a73e8" />
                        <h4>{t("vesselTitle")}</h4>
                        <p>{t("vesselText")}</p>
                    </div>
                </div>

                <div className="feature-card" data-aos="zoom-in" data-aos-delay="100">
                    <div className="card-inner">
                        <FaWarehouse size={40} color="#1a73e8" />
                        <h4>{t("storageTitle")}</h4>
                        <p>{t("storageText")}</p>
                    </div>
                </div>

                <div className="feature-card" data-aos="zoom-in" data-aos-delay="200">
                    <div className="card-inner">
                        <FaTasks size={40} color="#1a73e8" />
                        <h4>{t("resourcesTitle")}</h4>
                        <p>{t("resourcesText")}</p>
                    </div>
                </div>

                <div className="feature-card" data-aos="zoom-in" data-aos-delay="300">
                    <div className="card-inner">
                        <FaUsersCog size={40} color="#1a73e8" />
                        <h4>{t("rolesTitle")}</h4>
                        <p>{t("rolesText")}</p>
                    </div>
                </div>
            </section>

            {/* CALLOUT */}
            <section className="callout" data-aos="fade-up" data-aos-delay="400">
                <h2>{t("bannerText")}</h2>
            </section>
        </>
    );
}