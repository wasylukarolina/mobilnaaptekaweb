import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from "../Assets/menu.png";
import './MyDrugs.css';

const MyDrugs = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [userDrugs, setUserDrugs] = useState([]); // Tablica do przechowywania leków użytkownika
    const [hoveredIndex, setHoveredIndex] = useState(null);

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

        // Pobieramy leki użytkownika
        const lekiRef = collection(db, "leki");
        const userDrugsQuery = query(lekiRef, where("userId", "==", userId));

        getDocs(userDrugsQuery)
            .then((querySnapshot) => {
                const drugs = [];
                querySnapshot.forEach((doc) => {
                    drugs.push(doc.data());
                });
                setUserDrugs(drugs);
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania leków z Firestore:", error);
            });
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Błąd podczas wylogowywania:", error);
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
                    <Link to="/updatehealth">AKTUALIZUJ STAN ZDROWIA</Link>
                    <button className="logout-button" onClick={handleLogout}>Wyloguj</button>
                </div>
            </div>

            <button
                className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`}
                onClick={toggleSidebar}
            >
                <img src={menu_icon} alt="" />
            </button>

            <div className="content">
                <h1>Moje leki</h1>
                <ul>
                    {userDrugs.map((drug, index) => (
                        <li
                            key={index}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={index === hoveredIndex ? "hovered" : ""}
                        >
                            <strong>Nazwa leku:</strong> {drug.nazwaProduktu}
                            <br />
                            <strong>Data ważności:</strong> {drug.dataWaznosci}
                            <br />
                            {/* Dodaj inne informacje o leku, jeśli potrzebujesz */}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MyDrugs;
