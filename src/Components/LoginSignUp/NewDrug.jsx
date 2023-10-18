import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import productData from '../Assets/Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20230511.xml';

const NewDrug = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [productNames, setProductNames] = useState([]);
    const [filterText, setFilterText] = useState("");

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

        fetch(productData)
            .then((response) => response.text())
            .then((xmlText) => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                const productNodes = xmlDoc.querySelectorAll("produktLeczniczy");
                const names = Array.from(productNodes).map((productNode) => {
                    return productNode.getAttribute("nazwaProduktu");
                });

                setProductNames(names);
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania pliku XML:", error);
            });
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
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
                    <Link to="/updatehealth">AKTUALIZUJ STAN ZDROWIA</Link>
                    <button className="logout-button" onClick={handleLogout}>Wyloguj</button>
                </div>
            </div>

            <button className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`} onClick={toggleSidebar}>
                <img src={menu_icon} alt="" />
            </button>

            <div className="content">
                <h1>Dodaj lek</h1>
                <h2>Wyszukaj lub wybierz lek:</h2>
                <input
                    type="text"
                    placeholder="Wyszukaj lek"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
                <select value={filterText} onChange={(e) => setFilterText(e.target.value)}>
                    <option value="">Wybierz lek</option>
                    {productNames
                        .filter((productName) =>
                            productName.toLowerCase().includes(filterText.toLowerCase())
                        )
                        .map((productName, index) => (
                            <option key={index} value={productName}>
                                {productName}
                            </option>
                        ))}
                </select>
            </div>
        </div>
    );
};

export default NewDrug;
