import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from "../Assets/menu.png";
import delete_icon from "../Assets/delete.png";

import './MyDrugs.css';

const MyDrugs = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [userDrugs, setUserDrugs] = useState([]); // Tablica do przechowywania leków użytkownika
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [selectedTime, setSelectedTime] = useState(""); // Define selectedTime in state
    const [isChecked, setIsChecked] = useState([]); // Tablica do przechowywania stanu checkboxów
    const currentDate = new Date();


    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;


    useEffect(() => {
        const userId = auth.currentUser.uid;
        const db = getFirestore(auth.app);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userId", "==", userId));
        const checkedMedicationsRef = collection(db, "checkedMedications");

        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;


        const checkCheckedMedications = async () => {
            try {
                const userId = auth.currentUser.uid;
                const db = getFirestore(auth.app);
                const checkedMedicationsRef = collection(db, "checkedMedications");
                const currentDate = new Date();
                const day = currentDate.getDate();
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                const formattedDate = `${day}/${month}/${year}`;

                const promises = userDrugs.map(async (drug) => {
                    const checkedTimes = [];
                    for (const time of drug.dawkowanie) {
                        const timeQuery = query(
                            checkedMedicationsRef,
                            where("userId", "==", userId),
                            where("medicationName", "==", drug.nazwaProduktu),
                            where("checkedDate", "==", formattedDate),
                            where("checkedTime", "==", time)
                        );
                        const timeQuerySnapshot = await getDocs(timeQuery);

                        checkedTimes.push(timeQuerySnapshot.size > 0); // Sprawdź, czy wynik zapytania jest większy niż 0
                    }
                    return checkedTimes.includes(true);
                });

                const results = await Promise.all(promises);
                setIsChecked(results);
            } catch (error) {
                console.error("Błąd podczas sprawdzania danych z Firestore:", error);
            }
        };

        checkCheckedMedications();

    }, [userDrugs]);

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

            // Usunięcie leku z listy userDrugs
            const updatedUserDrugs = userDrugs.filter((drug) => drug.id !== drugToDelete.id);
            setUserDrugs(updatedUserDrugs);

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

    const handleCheckboxChange = async (drug, index, selectedTime) => {
        try {
            const userId = auth.currentUser.uid;
            const db = getFirestore(auth.app);
            const checkedMedicationsRef = collection(db, "checkedMedications");

            const currentDate = new Date();
            const selectedDate = new Date(currentDate);
            const currentHour = currentDate.getHours();
            const selectedHourInt = parseInt(selectedTime.split(":")[0], 10);

            const day = selectedDate.getDate();
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();
            const hour = selectedHourInt;
            const minute = parseInt(selectedTime.split(":")[1], 10);
            const formattedDate = `${day}/${month}/${year}`;

            // Znajdź wybrany czas dla danego leku
            const time = drug.dawkowanie[index];

            if (time && parseInt(time.split(":")[0], 10) > currentHour) {
                const existingDocQuery = query(
                    checkedMedicationsRef,
                    where("userId", "==", userId),
                    where("medicationName", "==", drug.nazwaProduktu),
                    where("checkedDate", "==", formattedDate),
                    where("checkedTime", "==", time)
                );

                const existingDocSnapshot = await getDocs(existingDocQuery);

                if (existingDocSnapshot.size === 0) {
                    // Dodaj informacje o zaznaczonym leku do tabeli "checkedMedications"
                    await addDoc(checkedMedicationsRef, {
                        userId,
                        medicationName: drug.nazwaProduktu,
                        checkedDate: formattedDate,
                        checkedTime: time,
                    });
                } else {
                    // Usuń dokument z tabeli "checkedMedications", jeśli istnieje
                    existingDocSnapshot.forEach(async (doc) => {
                        await deleteDoc(doc.ref);
                    });
                }
            }
        } catch (error) {
            console.error("Błąd podczas dodawania lub usuwania zaznaczonego leku:", error);
        }
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

                {/*// Wyświetlanie modala z informacjami o leku*/}
                {selectedDrug && (
                    <div className="drug-modal">
                        <h2>Informacje o leku</h2>
                        <div className="drug-info">
                            <p>
                                <strong>Nazwa leku:</strong> {selectedDrug.nazwaProduktu}
                            </p>

                            <button onClick={() => handleDeleteDrug(selectedDrug)}>
                                <img src={delete_icon} alt="" />
                            </button>
                        </div>

                        <p><strong>Data ważności:</strong> {selectedDrug.dataWaznosci}</p>
                        <p><strong>Liczba tabletek:</strong> {selectedDrug.tabletsCount}</p>
                        <div>
                            <p><strong>Dawkowanie:</strong></p>
                            <ul className="centered-list">
                                {selectedDrug.dawkowanie.map((dawkowanie, index) => (
                                    <li key={index}>
                                        <input
                                            type="checkbox"
                                            id={`checkbox-${index}`}
                                            onChange={() => handleCheckboxChange(selectedDrug, index, selectedTime)}
                                        />

                                        <label htmlFor={`checkbox-${index}`}>{dawkowanie}</label>
                                    </li>
                                ))}
                            </ul>
                        </div>

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
