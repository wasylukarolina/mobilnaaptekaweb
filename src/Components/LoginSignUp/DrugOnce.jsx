import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, addDoc, where, getDocs, updateDoc} from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import './MyDrugs.css';
import productData from "../Assets/Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20230511.xml";


const Health = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [productNames, setProductNames] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [filteredProductNames, setFilteredProductNames] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedProductNames, setSelectedProductNames] = useState([]);
    const [selectedTime, setSelectedTime] = useState(""); // Dodaj te zmienne do stanu komponentu


    useEffect(() => {
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));

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

    const handleProductSelect = (event) => {
        const selectedOptions = event.target.selectedOptions;
        const selectedProductNames = Array.from(selectedOptions).map((option) => option.value);
        setSelectedProducts(selectedProductNames);
        setSelectedProductNames(selectedProductNames);
    };

    const handleFilterChange = (text) => {
        setFilterText(text);
        // Filtruj produkty na podstawie wprowadzonego tekstu
        const filtered = productNames.filter((productName) =>
            productName.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredProductNames(filtered);
    };

    const handleSaveToFirestore = async () => {
        try {
            const email = auth.currentUser.email;
            const db = getFirestore(auth.app);
            const medicationsRef = collection(db, 'checkedMedications');
            const drugsRef = collection(db, 'leki');

            // Pobierz nazwę wybranego leku, datę i godzinę
            const selectedMedication = selectedProducts[0];

            // Pobierz aktualną datę i czas
            const currentDate = new Date();
            const selectedDate = new Date(currentDate);
            const selectedHour = selectedTime;

            // Porównaj wybraną godzinę z aktualną godziną
            const currentHour = currentDate.getHours();
            const selectedHourInt = parseInt(selectedHour.split(":")[0], 10); // Pobierz godzinę z czasu i przekształć na liczbę

            if (selectedHourInt > currentHour) {
                // Wybrana godzina jest wcześniejsza niż aktualna
                window.alert("Nie możesz wybrać późniejszej godziny niż obecna.");
            } else {
                // Pobierz dzień, miesiąc, rok, godzinę i minutę
                const day = selectedDate.getDate();
                const month = selectedDate.getMonth() + 1; // Miesiące są od 0 do 11, więc dodajemy 1
                const year = selectedDate.getFullYear();
                const hour = selectedHourInt;
                const minute = parseInt(selectedHour.split(":")[1], 10); // Pobierz minutę z czasu i przekształć na liczbę

                // Utwórz formaty daty i godziny
                const formattedDate = `${day}/${month}/${year}`;
                const formattedTime = `${hour}:${minute}`;

                // Sprawdź, czy wybrany lek jest już w tabeli "leki" i należy do aktualnie zalogowanego użytkownika
                const lekiQuery = query(
                    drugsRef,
                    where("email", "==", email),
                    where("nazwaProduktu", "==", selectedMedication)
                );
                const lekiSnapshot = await getDocs(lekiQuery);

                if (lekiSnapshot.empty) {
                    // Jeśli lek nie istnieje, dodaj go do tabeli "checkedMedications"
                    await addDoc(medicationsRef, {
                        email,
                        medicationName: selectedMedication,
                        checkedDate: formattedDate,
                        checkedTime: formattedTime,
                    });
                } else {

                    await addDoc(medicationsRef, {
                        email,
                        medicationName: selectedMedication,
                        checkedDate: formattedDate,
                        checkedTime: formattedTime,
                    })

                    // Jeśli lek istnieje, zmniejsz wartość w polu "tabletsCount" o 1
                    lekiSnapshot.forEach(async (lekDoc) => {
                        const lekData = lekDoc.data();
                        const currentTabletsCount = lekData.tabletsCount > 0 ? lekData.tabletsCount - 1 : 0;

                        // Zaktualizuj pole "tabletsCount" w tabeli "leki"
                        await updateDoc(lekDoc.ref, {
                            tabletsCount: currentTabletsCount,
                        });
                    });
                }

                // Zresetuj stan wybranych leków i godziny
                setSelectedProducts([]);
                setSelectedTime("");

                // Wyświetl alert
                window.alert('Dane zostały zapisane.');
            }
        } catch (error) {
            console.error('Błąd podczas zapisywania danych do Firebase:', error);
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

            <button className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`} onClick={toggleSidebar}>
                <img src={menu_icon} alt="" />
            </button>

            <div className="content with-background">
                <h1> </h1>
                <div className="drug-entry-field">
                    <h2>Wyszukaj lub wybierz lek:</h2>
                    <div className="search-input-container">
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

                    <h3>Wybierz godzinę:</h3>
                    <div className="dose-times time-picker">
                        <input
                            type="time"
                            id="selected-time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                        />
                    </div>

                    <button id="save-button" onClick={handleSaveToFirestore}>
                        Zatwierdź
                    </button>


                </div>
            </div>

        </div>
    );
};

export default Health;
