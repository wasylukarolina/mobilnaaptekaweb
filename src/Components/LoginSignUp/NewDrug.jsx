import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import productData from '../Assets/Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20230511.xml';
import './NewDrug.css';


const NewDrug = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [productNames, setProductNames] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [filteredProductNames, setFilteredProductNames] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedProductNames, setSelectedProductNames] = useState([]);
    const [expiryDate, setExpiryDate] = useState(""); // Nowe pole daty ważności
    const [doseCount, setDoseCount] = useState(""); // Nowe pole liczby dawkowań
    const [doseTimes, setDoseTimes] = useState([]); // Nowe pole godzin dawek
    const [customDosing, setCustomDosing] = useState(false); // Nowe pole
    const [interval, setInterval] = useState(0); // Domyślnie ustaw na 0
    const [tabletsCount, setTabletsCount] = useState("");
    const [isDuplicateDrug, setIsDuplicateDrug] = useState(false);



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
                const productInfo = Array.from(productNodes).map((productNode) => {
                    const productName = productNode.getAttribute("nazwaProduktu");
                    const moc = productNode.getAttribute("moc");
                    const combinedName = `${productName} ${moc}`;
                    return combinedName;
                });

                setProductNames(productInfo);
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

    const handleFilterChange = (text) => {
        setFilterText(text);
        // Filtruj produkty na podstawie wprowadzonego tekstu
        const filtered = productNames.filter((productName) =>
            productName.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredProductNames(filtered);
    };

    const handleProductSelect = (event) => {
        const selectedOptions = event.target.selectedOptions;
        const selectedProductNames = Array.from(selectedOptions).map((option) => option.value);
        setSelectedProducts(selectedProductNames);
        setSelectedProductNames(selectedProductNames);
    };

    const handleExpiryDateChange = (event) => {
        const selectedDate = new Date(event.target.value);
        const currentDate = new Date();

        if (selectedDate >= currentDate) {
            setExpiryDate(event.target.value);
        } else {
            // Możesz dodać tutaj obsługę błędu lub wyświetlić komunikat o nieprawidłowej dacie
            // Na przykład:
            alert("Nie można ustawić daty wcześniejszej niż dzisiejsza data.");
        }
    };


    const handleDoseCountChange = (event) => {
        setDoseCount(event.target.value);
        // Reset godzin dawek po zmianie liczby dawkowań
        setDoseTimes([]);
    };

    const handleDoseTimeChange = (event, index) => {
        const newDoseTimes = [...doseTimes];
        newDoseTimes[index] = event.target.value;
        setDoseTimes(newDoseTimes);
    };

    const handleCustomDosingChange = (event) => {
        setCustomDosing(event.target.checked);
        // Reset pól godzin dawek po zmianie niestandardowej dawki
        setDoseTimes([]);
    };

    const handleSaveToFirestore = async () => {
        const userId = auth.currentUser.uid;
        const db = getFirestore(auth.app);
        const lekiRef = collection(db, "leki");

        // Sprawdź, czy wybrany lek istnieje już w bazie dla tego użytkownika
        const existingDrugQuery = query(lekiRef, where("userId", "==", userId), where("nazwaProduktu", "==", selectedProductNames[0]));

        const existingDrugSnapshot = await getDocs(existingDrugQuery);

        if (existingDrugSnapshot.size > 0) {
            // Lek o takiej nazwie już istnieje w bazie dla tego użytkownika
            setIsDuplicateDrug(true);
            alert("Lek już istnieje w twojej bazie.");
            return; // Zatrzymaj proces zapisywania
        }

            if (customDosing) {
                // Obsługa niestandardowego dawkowania
                const userId = auth.currentUser.uid;
                const db = getFirestore(auth.app);
                const lekiRef = collection(db, "leki");
                const newLek = {
                    userId,
                    nazwaProduktu: selectedProductNames[0], // Załóżmy, że zapisujemy tylko pierwszy wybrany lek
                    dataWaznosci: expiryDate,
                    dawkowanie: doseTimes.filter(time => time !== ""),
                    tabletsCount: parseInt(tabletsCount, 10), // Dodaj liczbę tabletek
                };

                try {
                    await addDoc(lekiRef, newLek);
                    console.log("Lek został zapisany w bazie Firestore.");
                    // Możesz dodać obsługę sukcesu lub nawigacji na inną stronę po zapisaniu.
                } catch (error) {
                    console.error("Błąd podczas zapisywania leku w bazie Firestore:", error);
                }
            } else {
                // Obsługa standardowego dawkowania
                if (doseCount && expiryDate && doseTimes[0]) {
                    const userId = auth.currentUser.uid;
                    const db = getFirestore(auth.app);
                    const lekiRef = collection(db, "leki");
                    const newLek = {
                        userId,
                        nazwaProduktu: selectedProductNames[0], // Załóżmy, że zapisujemy tylko pierwszy wybrany lek
                        dataWaznosci: expiryDate,
                        dawkowanie: [doseTimes[0]],
                        tabletsCount: parseInt(tabletsCount, 10), // Dodaj liczbę tabletek
                    };

                    const intervalInput = document.querySelector("#interval");
                    const interval = parseInt(intervalInput.value, 10); // Przekształć na liczbę całkowitą

                    for (let i = 1; i < doseCount; i++) {
                        const previousTime = newLek.dawkowanie[newLek.dawkowanie.length - 1];
                        if (!isNaN(interval)) { // Sprawdź, czy interval jest liczbą
                            const [hours, minutes] = previousTime.split(":").map(Number);
                            let nextHours = hours + interval;
                            if (nextHours >= 24) {
                                nextHours -= 24;
                            }
                            const nextTime = `${nextHours < 10 ? "0" : ""}${nextHours}:${minutes < 10 ? "0" : ""}${minutes}`;
                            newLek.dawkowanie.push(nextTime);
                        }
                    }

                    try {
                        await addDoc(lekiRef, newLek);
                        console.log("Lek został zapisany w bazie Firestore.");
                        // Możesz dodać obsługę sukcesu lub nawigacji na inną stronę po zapisaniu.
                    } catch (error) {
                        console.error("Błąd podczas zapisywania leku w bazie Firestore:", error);
                    }
                }
            }

    };

    const renderDoseTimeFields = () => {
        if (customDosing) {
            return doseCount > 0 ? (
                Array.from({ length: doseCount }).map((_, index) => (
                    <input
                        key={index}
                        type="time"
                        value={doseTimes[index] || ""}
                        onChange={(e) => handleDoseTimeChange(e, index)}
                    />
                ))
            ) : null;
        } else {
            return (
                <>
                    <input
                        type="time"
                        value={doseTimes[0] || ""}
                        onChange={(e) => handleDoseTimeChange(e, 0)}
                    />
                    <input
                        type="number"
                        id="interval" // Dodaj id, aby później odnaleźć to pole
                        placeholder="Liczba godzin między dawkami"
                        value={interval} // Dodaj wartość do przechowywania liczby godzin
                        onChange={(e) => setInterval(parseInt(e.target.value, 10))} // Aktualizuj stan "interval" po zmianie
                    />

                </>
            );
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
                    style={{
                        width: '493px',  // Stała szerokość
                    }}
                    type="text"
                    placeholder="Wyszukaj lek"
                    value={filterText}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <div className="product-list">
                    {filteredProductNames.length > 0 && (
                        <select
                            style={{
                                width: '500px',  // Stała szerokość
                            }}
                            multiple value={selectedProducts} onChange={handleProductSelect}>
                            {filteredProductNames.map((productInfo, index) => (
                                <option key={index} value={productInfo}>
                                    {productInfo}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {selectedProductNames.length > 0 && (
                    <div className="selected-products">
                        <h3>Wybrane leki:</h3>
                        <ul>
                            {selectedProductNames.map((productName, index) => (
                                <li key={index}>{productName}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Pole daty ważności */}
                <div className="expiry-date">
                    <h3>Data ważności:</h3>
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                    />
                </div>

                <div className="tablets-count">
                    <h3>Liczba tabletek:</h3>
                    <input
                        type="number"
                        value={tabletsCount}
                        onChange={(e) => setTabletsCount(e.target.value)}
                    />
                </div>


                {/* Pole liczby dawkowań */}
                <div className="dose-count">
                    <h3>Liczba dawkowań:</h3>
                    <select
                        value={doseCount}
                        onChange={handleDoseCountChange}
                    >
                        <option value="">Wybierz liczbę dawkowań</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>

                <div className="custom-dosing">
                    <h3>Niestandardowe dawkowanie:</h3>
                    <input
                        type="checkbox"
                        checked={customDosing}
                        onChange={handleCustomDosingChange}
                    />
                </div>

                <div className="dose-times">
                    <h3>Godziny dawek:</h3>
                    {renderDoseTimeFields()}
                </div>

                <button onClick={handleSaveToFirestore}>Zatwierdź</button>
            </div>
        </div>
    );
};

export default NewDrug;