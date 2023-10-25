import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs, deleteDoc, addDoc, updateDoc  } from "firebase/firestore";
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
    const [userDrugs, setUserDrugs] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [isChecked, setIsChecked] = useState({}); // Zmieniono na obiekt


    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const db = getFirestore(auth.app);
    const userId = auth.currentUser.uid;
    const lekiRef = collection(db, "leki");
    const checkedMedicationsRef = collection(db, "checkedMedications");




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

    const handleDrugClick = async (drug) => {
        // Pobierz aktualną wartość tabletsCount z bazy danych za każdym razem, gdy otwierany jest modal
        try {
            const lekQuery = query(
                lekiRef,
                where("userId", "==", userId),
                where("nazwaProduktu", "==", drug.nazwaProduktu)
            );
            const lekQuerySnapshot = await getDocs(lekQuery);
            const lekDoc = lekQuerySnapshot.docs[0]; // Załóżmy, że istnieje tylko jeden pasujący dokument

            if (lekDoc.exists()) {
                const lekData = lekDoc.data();
                drug.tabletsCount = lekData.tabletsCount;
            }

            const checkedMedsQuery = query(
                checkedMedicationsRef,
                where("userId", "==", userId),
                where("checkedDate", "==", formattedDate),
                where("medicationName", "==", drug.nazwaProduktu)
            );

            const checkedMedsSnapshot = await getDocs(checkedMedsQuery);

            const updatedIsChecked = { ...isChecked };
            checkedMedsSnapshot.forEach((doc) => {
                const data = doc.data();
                const doseKey = `dose-${data.medicationName}-${data.checkedTime.replace(":", "_")}`;
                updatedIsChecked[doseKey] = true;
            });

            setIsChecked(updatedIsChecked);

            setSelectedDrug(drug);
        } catch (error) {
            console.error("Błąd podczas pobierania danych leku z bazy danych:", error);
        }
    };

    const handleDeleteDrug = async (drugToDelete) => {
        if (!drugToDelete) {
            return;
        }

        try {
            // Usuń lek bez konieczności odczytu z bazy danych
            const indexToRemove = userDrugs.findIndex((drug) => drug.id === drugToDelete.id);
            const updatedUserDrugs = [...userDrugs];
            updatedUserDrugs.splice(indexToRemove, 1);
            setUserDrugs(updatedUserDrugs);

            // Zamknij modal po usunięciu leku
            setSelectedDrug(null);


            // Usuń lek z bazy danych
            await deleteDoc(query(
                lekiRef,
                where("userId", "==", userId),
                where("nazwaProduktu", "==", drugToDelete.nazwaProduktu)
            ));

            // Odznacz checkboxy
            const updatedIsChecked = { ...isChecked };
            updatedIsChecked[drugToDelete.nazwaProduktu] = false;
            setIsChecked(updatedIsChecked);
        } catch (error) {
            console.error("Błąd podczas usuwania leku z bazy danych:", error);
        }
    };

    const handleCheckboxChange = async (drug, doseKey) => {
        try {
            const currentDate = new Date();
            const currentHour = currentDate.getHours();

            // Odczytaj godzinę z `doseKey`
            const selectedTime = doseKey.split("-")[2].replace("_", ":");

            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            // Sprawdź, czy dokument istnieje w bazie danych
            const existingDocQuery = query(
                checkedMedicationsRef,
                where("userId", "==", userId),
                where("medicationName", "==", drug.nazwaProduktu),
                where("checkedDate", "==", formattedDate),
                where("checkedTime", "==", selectedTime)
            );

            const existingDocSnapshot = await getDocs(existingDocQuery);

            if (existingDocSnapshot.size === 0) {
                // Dodaj dokument, jeśli nie istnieje
                await addDoc(checkedMedicationsRef, {
                    userId,
                    medicationName: drug.nazwaProduktu,
                    checkedDate: formattedDate,
                    checkedTime: selectedTime,
                });
            } else {
                // Usuń dokument, jeśli istnieje
                existingDocSnapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
            }

            // Zaktualizuj stan checkboxa lokalnie
            const updatedIsChecked = { ...isChecked };
            updatedIsChecked[doseKey] = !updatedIsChecked[doseKey];
            setIsChecked(updatedIsChecked);

            // Zmniejsz lub zwiększ wartość w polu "tabletsCount"
            const tabletsChange = updatedIsChecked[doseKey] ? -1 : 1;
            const newTabletsCount = drug.tabletsCount + tabletsChange;

            // Opcjonalnie: upewnij się, że nowa liczba tabletek nie jest ujemna
            const nonNegativeTabletsCount = Math.max(newTabletsCount, 0);

            // Pobierz odpowiedni dokument leku
            const lekQuery = query(
                lekiRef,
                where("userId", "==", userId),
                where("nazwaProduktu", "==", drug.nazwaProduktu)
            );

            const lekQuerySnapshot = await getDocs(lekQuery);
            const lekDoc = lekQuerySnapshot.docs[0]; // Załóżmy, że istnieje tylko jeden pasujący dokument

            // Zaktualizuj pole "tabletsCount" w tabeli "leki" przy użyciu updateDoc
            await updateDoc(lekDoc.ref, {
                tabletsCount: nonNegativeTabletsCount,
            });

            // Aktualizuj pole "Liczba tabletek" w stanie selectedDrug
            const updatedSelectedDrug = { ...selectedDrug };
            updatedSelectedDrug.tabletsCount = nonNegativeTabletsCount;
            setSelectedDrug(updatedSelectedDrug);
        } catch (error) {
            console.error("Błąd podczas dodawania lub usuwania zaznaczonego leku:", error);
        }
    };


    const fetchDataFromFirebase = async () => {
        try {
            // Pobierz dane leków użytkownika
            const userDrugsQuery = query(lekiRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(userDrugsQuery);
            const drugs = querySnapshot.docs.map((doc) => doc.data());
            setUserDrugs(drugs);

            // Pobierz dane o zaznaczonych lekach
            const checkedMedsQuery = query(
                checkedMedicationsRef,
                where("userId", "==", userId),
                where("checkedDate", "==", formattedDate)
            );
            const checkedMedsSnapshot = await getDocs(checkedMedsQuery);
            const checkedMedsData = {};
            checkedMedsSnapshot.forEach((doc) => {
                const data = doc.data();
                checkedMedsData[data.medicationName] = true;
            });
            setIsChecked(checkedMedsData);
        } catch (error) {
            console.error("Błąd podczas pobierania danych z Firebase:", error);
        }
    };

    useEffect(() => {
        fetchDataFromFirebase();
    }, []);



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
                                {selectedDrug.dawkowanie.map((dawkowanie, index) => {
                                    const doseKey = `dose-${selectedDrug.nazwaProduktu}-${dawkowanie.replace(":", "_")}`;
                                    return (
                                        <li key={index} className="checkbox-slider-container">
                                            <div className="checkbox-slider">
                                                <input
                                                    type="checkbox"
                                                    id={`checkbox-${index}`}
                                                    checked={isChecked[doseKey] || false}
                                                    onChange={() => handleCheckboxChange(selectedDrug, doseKey)}
                                                />
                                                <label htmlFor={`checkbox-${index}`}>{dawkowanie}</label>
                                            </div>
                                            <div className="slider-controls">
                                                <input
                                                    type="range"
                                                    min="0.25"
                                                    max="2"
                                                    step="0.25"
                                                    value={isChecked[doseKey] || 0}
                                                    onChange={(e) => {
                                                        const newValue = parseFloat(e.target.value);
                                                        const updatedIsChecked = { ...isChecked };
                                                        updatedIsChecked[doseKey] = newValue;
                                                        setIsChecked(updatedIsChecked);
                                                    }}
                                                />
                                                <span className="slider-value">
            {isChecked[doseKey] ? `${isChecked[doseKey]}x` : '0x'}
          </span>
                                            </div>
                                        </li>
                                    );
                                })}
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
