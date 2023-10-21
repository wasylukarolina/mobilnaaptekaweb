import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from "../Assets/menu.png";
import delete_icon from "../Assets/delete.png";

import './MyDrugs.css';

const MyDrugs = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [userDrugs, setUserDrugs] = useState([]); // Tablica do przechowywania leków użytkownika
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [selectedDrug, setSelectedDrug] = useState(null);


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

    const handleDrugClick = (drug) => {
        setSelectedDrug(drug);
    };

    const handleDeleteDrug = async (drugToDelete) => {
        if (!drugToDelete) {
            return;
        }

        try {
            const userId = auth.currentUser.uid;
            const db = getFirestore(auth.app);
            const lekiRef = collection(db, "leki");

            // Znajdź i usuń lek na podstawie warunków (userId i nazwaProduktu)
            const q = query(
                lekiRef,
                where("userId", "==", userId),
                where("nazwaProduktu", "==", drugToDelete.nazwaProduktu)
            );

            const querySnapshot = await getDocs(q);

            querySnapshot.forEach(async (doc) => {
                const userDrug = doc.data();
                if (userDrug.id === drugToDelete.id) {
                    await deleteDoc(doc.ref);
                }
            });

            // Zamknij modal po usunięciu leku
            setSelectedDrug(null);
        } catch (error) {
            console.error("Błąd podczas usuwania leku z bazy danych:", error);
        }
    };

// Dodaj useEffect do ponownego pobierania danych z bazy po zmianie stanu
    useEffect(() => {
        const userId = auth.currentUser.uid;
        const db = getFirestore(auth.app);
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
    }, [selectedDrug]);

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

            <button
                className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`}
                onClick={toggleSidebar}
            >
                <img src={menu_icon} alt="" />
            </button>

            <div className="content with-background">
                <h1>Moje leki</h1>
                <div className="drug-field">
                    <ul>
                        {userDrugs.map((drug, index) => (
                            <li
                                key={index}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className={index === hoveredIndex ? "hovered" : ""}
                                onClick={() => handleDrugClick(drug)}
                            >
                                <strong>Nazwa leku:</strong> {drug.nazwaProduktu}
                                <br />
                                <strong>Data ważności:</strong> {drug.dataWaznosci}
                            </li>

                        ))}
                    </ul>
                </div>

                {/* Wyświetlanie modala z informacjami o leku */}
                {selectedDrug && (
                    <div className="drug-modal">
                        <h2>Informacje o leku</h2>
                        <div className="drug-info">
                            <p>
                                <strong>Nazwa leku:</strong> {selectedDrug.nazwaProduktu}
                            </p>

                            <button
                                onClick={() => handleDeleteDrug(selectedDrug)}
                            >
                                <img src={delete_icon} alt="" />
                            </button>
                        </div>

                        <p><strong>Data ważności:</strong> {selectedDrug.dataWaznosci}</p>
                        <p><strong>Liczba tabletek:</strong> {selectedDrug.tabletsCount}</p>
                        {Array.isArray(selectedDrug.dawkowanie) && selectedDrug.dawkowanie.length > 1 ? (
                            <div>
                                <p><strong>Dawkowanie:</strong></p>
                                <ul className="centered-list">
                                    {selectedDrug.dawkowanie.map((dawkowanie, index) => (
                                        <li key={index}>
                                            <input type="checkbox" id={`checkbox-${index}`} />
                                            <label htmlFor={`checkbox-${index}`}>{dawkowanie}</label>
                                        </li>
                                    ))}
                                </ul>
                            </div>


                        ) : (
                            <p style={{ textAlign: "center" }}><strong>Dawkowanie:</strong> {selectedDrug.dawkowanie}</p>
                        )}
                        <div className="close-button">
                            <button onClick={() => setSelectedDrug(null)}>Zamknij</button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default MyDrugs;
