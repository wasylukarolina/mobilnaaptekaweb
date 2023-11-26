import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import productData from '../Assets/Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20230511.xml';
import './NewDrug.css';


const NewDrug = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [productNames, setProductNames] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [filteredProductNames, setFilteredProductNames] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedProductNames, setSelectedProductNames] = useState([]);
    const [expiryDate, setExpiryDate] = useState(""); // Nowe pole daty ważności
    const [doseCount, setDoseCount] = useState(1); // Nowe pole liczby dawkowań
    const [doseTimes, setDoseTimes] = useState([]); // Nowe pole godzin dawek
    const [customDosing, setCustomDosing] = useState(false); // Nowe pole
    const [interval, setInterval] = useState(0); // Domyślnie ustaw na 0
    const [pojemnosc, setPojemnosc] = useState("");
    const [isDuplicateDrug, setIsDuplicateDrug] = useState(false);
    const [iloscTabletekJednorazowo, setIloscTabletekJednorazowo] = useState(1); // Domyślna wartość suwaka
    const [formattedDisplayDate, setFormattedDisplayDate] = useState("");
    const [isHoveredSearchInput, setIsHoveredSearchInput] = useState(false);
    const [isHoveredExpiryDate, setIsHoveredExpiryDate] = useState(false);
    const [isHoveredTabletsCount, setIsHoveredTabletsCount] = useState(false);
    const [isHoveredDoseCount, setIsHoveredDoseCount] = useState(false);
    const [isHoveredDoseTimes, setIsHoveredDoseTimes] = useState(false);

    useEffect(() => {
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));

        const searchInputContainer = document.querySelector(".search-input-container");
        const expiryDateContainer = document.querySelector(".expiry-date");
        const tabletsCountContainer = document.querySelector(".tablets-count");
        const doseCountContainer = document.querySelector(".dose-count");
        const doseTimesContainer = document.querySelector(".dose-times");

        if (searchInputContainer) {
            searchInputContainer.addEventListener("mouseenter", () => {
                setIsHoveredSearchInput(true);
            });

            searchInputContainer.addEventListener("mouseleave", () => {
                setIsHoveredSearchInput(false);
            });
        }

        if (expiryDateContainer) {
            expiryDateContainer.addEventListener("mouseenter", () => {
                setIsHoveredExpiryDate(true);
            });

            expiryDateContainer.addEventListener("mouseleave", () => {
                setIsHoveredExpiryDate(false);
            });
        }

        if (tabletsCountContainer) {
            tabletsCountContainer.addEventListener("mouseenter", () => {
                setIsHoveredTabletsCount(true);
            });

            tabletsCountContainer.addEventListener("mouseleave", () => {
                setIsHoveredTabletsCount(false);
            });
        }

        if (doseCountContainer) {
            doseCountContainer.addEventListener("mouseenter", () => {
                setIsHoveredDoseCount(true);
            });

            doseCountContainer.addEventListener("mouseleave", () => {
                setIsHoveredDoseCount(false);
            });
        }

        if (doseTimesContainer) {
            doseTimesContainer.addEventListener("mouseenter", () => {
                setIsHoveredDoseTimes(true);
            });

            doseTimesContainer.addEventListener("mouseleave", () => {
                setIsHoveredDoseTimes(false);
            });
        }

        getDocs(q)
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
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


        return () => {
            // Usuń nasłuchiwanie zdarzeń po odmontowaniu komponentu
            if (searchInputContainer) {
                searchInputContainer.removeEventListener("mouseenter", () => {
                    setIsHoveredSearchInput(true);
                });

                searchInputContainer.removeEventListener("mouseleave", () => {
                    setIsHoveredSearchInput(false);
                });
            }

            if (expiryDateContainer) {
                expiryDateContainer.removeEventListener("mouseenter", () => {
                    setIsHoveredExpiryDate(true);
                });

                expiryDateContainer.removeEventListener("mouseleave", () => {
                    setIsHoveredExpiryDate(false);
                });
            }

            if (tabletsCountContainer) {
                tabletsCountContainer.removeEventListener("mouseenter", () => {
                    setIsHoveredTabletsCount(true);
                });

                tabletsCountContainer.removeEventListener("mouseleave", () => {
                    setIsHoveredTabletsCount(false);
                });
            }

            if (doseCountContainer) {
                doseCountContainer.removeEventListener("mouseenter", () => {
                    setIsHoveredDoseCount(true);
                });

                doseCountContainer.removeEventListener("mouseleave", () => {
                    setIsHoveredDoseCount(false);
                });
            }

            if (doseTimesContainer) {
                doseTimesContainer.removeEventListener("mouseenter", () => {
                    setIsHoveredDoseTimes(true);
                });

                doseTimesContainer.removeEventListener("mouseleave", () => {
                    setIsHoveredDoseTimes(false);
                });
            }
        };
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
            const day = selectedDate.getDate();
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            // Utwórz format "rrrr-mm-dd"
            const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
            setExpiryDate(formattedDate);

            setFormattedDisplayDate(`${day < 10 ? '0' : ''}${day}-${month < 10 ? '0' : ''}${month}-${year}`);
        } else {
            // Możesz dodać tutaj obsługę błędu lub wyświetlić komunikat o nieprawidłowej dacie
            // Na przykład:
            alert("Nie można ustawić daty wcześniejszej niż dzisiejsza data. Nie używaj przeterminowanych leków.");
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
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);
        const lekiRef = collection(db, "leki");

        if (
            !selectedProductNames[0] ||
            !expiryDate ||
            !pojemnosc ||
            (customDosing && doseTimes.some(time => !time))
        ) {
            alert("Uzupełnij wszystkie pola");
            return;
        }

        // Sprawdź, czy wybrany lek istnieje już w bazie dla tego użytkownika
        const existingDrugQuery = query(lekiRef, where("email", "==", email), where("nazwaProduktu", "==", selectedProductNames[0]));
        const existingDrugSnapshot = await getDocs(existingDrugQuery);

        if (existingDrugSnapshot.size > 0) {
            // Lek o takiej nazwie już istnieje w bazie dla tego użytkownika
            const existingDrugDoc = existingDrugSnapshot.docs[0];
            const existingDrugData = existingDrugDoc.data();

            // Zaktualizuj datę ważności, liczbę tabletek i dawkowanie
            const newExpiryDate = existingDrugData.dataWaznosci < expiryDate ? expiryDate : existingDrugData.dataWaznosci;
            const newTabletsCount = existingDrugData.pojemnosc + parseInt(pojemnosc, 10);
            const newDawkowanie = customDosing ? doseTimes.filter(time => time !== "") : [doseTimes[0]];

            try {
                // Zaktualizuj dokument w bazie danych
                await updateDoc(existingDrugDoc.ref, {
                    dataWaznosci: newExpiryDate,
                    pojemnosc: newTabletsCount,
                    dawkowanie: newDawkowanie,
                });

                // Dodaj alert po pomyślnym zaktualizowaniu
                alert("Lek został zaktualizowany w bazie Firestore.");
            } catch (error) {
                console.error("Błąd podczas aktualizacji leku w bazie Firestore:", error);
            }

            // Zatrzymaj proces zapisywania
            return;
        }

        if (customDosing) {
            // Obsługa niestandardowego dawkowania
            const email= auth.currentUser.email;
            const db = getFirestore(auth.app);
            const lekiRef = collection(db, "leki");
            const newLek = {
                email,
                nazwaProduktu: selectedProductNames[0], // Załóżmy, że zapisujemy tylko pierwszy wybrany lek
                dataWaznosci: expiryDate,
                dawkowanie: doseTimes.filter(time => time !== ""),
                pojemnosc: parseInt(pojemnosc, 10), // Dodaj liczbę tabletek
                iloscTabletekJednorazowo: iloscTabletekJednorazowo,
            };

            try {
                await addDoc(lekiRef, newLek);
                console.log("Lek został zapisany w bazie Firestore.");

                // Dodaj alert po pomyślnym zapisie
                alert("Lek został pomyślnie zapisany!");
            } catch (error) {
                console.error("Błąd podczas zapisywania leku w bazie Firestore:", error);
            }
        } else {
            // Obsługa standardowego dawkowania
            if (doseCount && expiryDate && doseTimes[0]) {
                const email = auth.currentUser.email;
                const db = getFirestore(auth.app);
                const lekiRef = collection(db, "leki");
                const newLek = {
                    email,
                    nazwaProduktu: selectedProductNames[0], // Załóżmy, że zapisujemy tylko pierwszy wybrany lek
                    dataWaznosci: expiryDate,
                    dawkowanie: [doseTimes[0]],
                    pojemnosc: parseInt(pojemnosc, 10), // Dodaj liczbę tabletek
                    iloscTabletekJednorazowo: iloscTabletekJednorazowo,
                };

                if (doseCount > 1) {
                    const intervalInput = document.querySelector("#interval");
                    const intervalValue = intervalInput ? parseInt(intervalInput.value, 10) : 0;

                    for (let i = 1; i < doseCount; i++) {
                        const previousTime = newLek.dawkowanie[newLek.dawkowanie.length - 1];
                        if (!isNaN(intervalValue)) { // Sprawdź, czy intervalValue jest liczbą
                            const [hours, minutes] = previousTime.split(":").map(Number);
                            let nextHours = hours + intervalValue;
                            if (nextHours >= 24) {
                                nextHours -= 24;
                            }
                            const nextTime = `${nextHours < 10 ? "0" : ""}${nextHours}:${minutes < 10 ? "0" : ""}${minutes}`;
                            newLek.dawkowanie.push(nextTime);
                        }
                    }
                }

                try {
                    await addDoc(lekiRef, newLek);
                    console.log("Lek został zapisany w bazie Firestore.");

                    // Dodaj alert po pomyślnym zapisie
                    alert("Lek został pomyślnie zapisany!");
                } catch (error) {
                    console.error("Błąd podczas zapisywania leku w bazie Firestore:", error);
                }
            }
        }
    };

    const addDoseTime = () => {
        // Dodaj nową godzinę do stanu doseTimes
        const newDoseTimes = [...doseTimes, ""];
        setDoseTimes(newDoseTimes);
    };

    const renderDoseTimeFields = () => {
        if (customDosing) {
            return doseCount > 0 ? (
                <>
                    {doseTimes.map((doseTime, index) => (
                        <div key={index} className="dose-time-field">
                            <input
                                type="time"
                                value={doseTime || ""}
                                onChange={(e) => handleDoseTimeChange(e, index)}
                            />
                        </div>
                    ))}
                    {customDosing && (
                        <button onClick={addDoseTime} disabled={doseTimes.length >= 12}>
                            +
                        </button>
                    )}
                </>
            ) : null;
        } else if (!customDosing && doseCount > 1) {
            return (
                <>
                    <input
                        type="time"
                        value={doseTimes[0] || ""}
                        onChange={(e) => handleDoseTimeChange(e, 0)}
                    />
                    <input
                        type="number"
                        id="interval"
                        placeholder="Liczba godzin między dawkami"
                        value={interval}
                        onChange={(e) => setInterval(parseInt(e.target.value, 10))}
                    />
                </>
            );
        } else {
            return (
                <input
                    type="time"
                    value={doseTimes[0] || ""}
                    onChange={(e) => handleDoseTimeChange(e, 0)}
                />
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
                    <Link to="/updatehealth">PROPONUJ LEK</Link>
                    <Link to="/drugonce">WZIĄŁEM LEK</Link>
                    <Link to="/doctors">LEKARZE</Link>
                    <button className="logout-button" onClick={handleLogout}>Wyloguj</button>
                </div>
            </div>

            <button className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`} onClick={toggleSidebar}>
                <img src={menu_icon} alt="" />
            </button>

            <div className="content with-background">
                <h1> </h1>
                <div className="drug-entry-field">

                    <h2>Wyszukaj lub wybierz lek:</h2>
                    <div className="search-input-container">
                        {isHoveredSearchInput}
                    <input
                            type="text"
                            placeholder="Wyszukaj lub wybierz lek"
                            value={selectedProducts[0] || ""}
                            onChange={(e) => {
                                const text = e.target.value;
                                setSelectedProducts([text]); // Zaktualizuj wybrany lek
                                handleFilterChange(text); // Obsłuż filtrowanie leków na podstawie wprowadzonego tekstu
                            }}
                        />
                    </div>

                    <div className="product-list">
                        {filteredProductNames.length > 0 && (
                            <select
                                multiple
                                value={selectedProducts}
                                onChange={handleProductSelect}
                            >
                                {filteredProductNames.map((productInfo, index) => (
                                    <option key={index} value={productInfo}>
                                        {productInfo}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>


                    <h3>Data ważności:</h3>

                    {/* Pole daty ważności */}
                    <div className="expiry-date">
                        <input
                            type="date"
                            value={expiryDate} // Wartość zapisywana w formie "dd-mm-yyyy"
                            onChange={handleExpiryDateChange}
                        />
                    </div>

                    <h3>Liczba tabletek:</h3>
                    <div className="tablets-count">
                        <input
                            type="number"
                            value={pojemnosc}
                            placeholder="Liczba tabletek"
                            onChange={(e) => {
                                const newValue = parseInt(e.target.value, 10);
                                if (!isNaN(newValue) && newValue >= 0 && newValue <= 120) {
                                    setPojemnosc(newValue);
                                }
                            }}
                        />

                        <div className="range-container">
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.5"
                                value={iloscTabletekJednorazowo}
                                onChange={(e) => setIloscTabletekJednorazowo(parseFloat(e.target.value))}
                            />
                            <div className="range-value">{iloscTabletekJednorazowo}</div>
                        </div>
                    </div>

                    <div className="labels">
                        <h3>Niestandardowe dawkowanie:</h3>

                        <div className="dose-count custom-dosing-container">
                            <div className="custom-dosing-field">
                                <input
                                    type="checkbox"
                                    checked={customDosing}
                                    onChange={handleCustomDosingChange}
                                />
                            </div>

                            {customDosing ? (
                                null

                            ) :
                                <div className="dose-count-field">
                                    <button
                                        onClick={() => setDoseCount((prevCount) => Math.max(prevCount - 1, 1))}
                                        disabled={doseCount <= 1}
                                    >
                                        -
                                    </button>
                                    <span>Dawki: {doseCount}</span>
                                    <button
                                        onClick={() => setDoseCount((prevCount) => Math.min(prevCount + 1, 24))}
                                        disabled={doseCount >= 24}
                                    >
                                        +
                                    </button>
                                </div>}
                                </div>
                    </div>


                    <h3>Godziny dawek:</h3>
                    <div className="dose-times">
                        {renderDoseTimeFields()}
                    </div>

                    <button id="save-button" onClick={handleSaveToFirestore}>
                        Zatwierdź
                    </button>

                </div>

                <div className="hover-text-container">
                    {isHoveredSearchInput && (
                        <div className="hover-text">Wpisz nazwę regularnie branego leku</div>
                    )}

                    {isHoveredExpiryDate && (
                        <div className="hover-text2">Zaznacz datę ważności opakowania</div>
                    )}

                    {isHoveredTabletsCount && (
                        <div className="hover-text3">Wpisz liczbę tabletek znajdujących się w opakowaniu i zaznacz ile tabletek bierzesz jednorazowo</div>

                    )}

                    {isHoveredDoseCount && (
                        <div className="hover-text4">Jeśli bierzesz tabletki w równych odstępach czasu pozostaw pole odznaczone i wybierz liczbę dawek. Jeśli między dawkami są różne odstępy godzin zaznacz checkbox. </div>

                    )}

                    {isHoveredDoseTimes && (
                        <div className="hover-text5">Pole z zegarem służy do wpisywania godziny. Obok wpisz liczbę godzin między dawkami. Plus służy do dodawania kolejnych godzin dawek. </div>

                    )}
                </div>
            </div>
        </div>
    );
};

export default NewDrug;