import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MainView = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleBlockedNavigation = (e) => {
            if (e.state && e.state.prevPathname === "/") {
                e.preventDefault();
                navigate("/mainview");
            }
        };

        const blockPopstate = () => {
            window.history.pushState({ prevPathname: "/" }, "");
            window.addEventListener("popstate", handleBlockedNavigation);
        };

        blockPopstate();

        return () => {
            window.removeEventListener("popstate", handleBlockedNavigation);
        };
    }, [navigate]);

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <div>
            <h1>Widok "Main"</h1>
            {/* Dodaj treść widoku "Main" */}
            <button onClick={handleLogout}>Wyloguj</button>
        </div>
    );
};

export default MainView;
