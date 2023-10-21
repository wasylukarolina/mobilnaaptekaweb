import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import { doc, setDoc } from 'firebase/firestore';
import "./Health.css"; // Import stylów dla komponentu Health

const Health = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [cukrzyca, setCukrzyca] = useState(false);
    const [asthma, setAsthma] = useState(false);
    const [ciaza, setCiaza] = useState(false);
    const [chorobySerca, setChorobySerca] = useState(false);

    useEffect(() => {
        const userId = auth.currentUser.uid;
        const db = getFirestore(auth.app);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userId", "==", userId));

        getDocs(q)
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    setNickname(userData.nickname);
                });
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania danych z Firestore:", error);
            });
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Po wylogowaniu przekieruj użytkownika na stronę logowania
            navigate('/');
        } catch (error) {
            console.error('Błąd podczas wylogowywania:', error);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={`main-view ${isSidebarOpen ? "sidebar-open" : ""}`}>
            <div className="sidebar">
                <div className="centered-content">
                    <h2>MENU</h2>
                    <Link to="/mainview">STRONA GŁÓWNA</Link>
                    <Link to="/newdrug">DODAJ LEK</Link>
                    <Link to="/mydrugs">MOJE LEKI</Link>
                    <Link to="/health">STAN ZDROWIA</Link>
                    <Link to="/updatehealth">PROPONUJ LEK</Link>
                    <Link to="/drugonce">WZIĄŁEM LEK</Link>
                    <button className="logout-button" onClick={handleLogout}>Wyloguj</button>
                </div>
            </div>

            <button className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`} onClick={toggleSidebar}>
                <img src={menu_icon} alt="" />
            </button>

            <div className="content with-background">
                <h1>Stan zdrowia</h1>
                <div className="health">
                    <label>
                        <input type="checkbox" checked={cukrzyca} onChange={() => setCukrzyca(!cukrzyca)} />
                        Cukrzyca
                    </label>
                    <label>
                        <input type="checkbox" checked={asthma} onChange={() => setAsthma(!asthma)} />
                        Astma
                    </label>
                    <label>
                        <input type="checkbox" checked={ciaza} onChange={() => setCiaza(!ciaza)} />
                        Ciąża
                    </label>
                    <label>
                        <input type="checkbox" checked={chorobySerca} onChange={() => setChorobySerca(!chorobySerca)} />
                        Choroby serca
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Health;
