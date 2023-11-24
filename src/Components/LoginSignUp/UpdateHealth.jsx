import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import "./MainView.css";
import "./MyDrugs.css";
import menu_icon from "../Assets/menu.png";
import productData from "../Assets/Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20230511.xml";

const UpdateHealth = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [productNames, setProductNames] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [filteredProductNames, setFilteredProductNames] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedProductNames, setSelectedProductNames] = useState([]);
    const [diseases, setDiseases] = useState({
        kaszel: false,
        katar: false,
        goraczka: false,
        bolBrzucha: false,
    });
    const [filteredLeki, setFilteredLeki] = useState([]);

    const handleCheckboxChange = (checkboxName, isChecked) => {
        setDiseases({
            ...diseases,
            [checkboxName]: isChecked,
        });
    };

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

        if (productData) {
            // Wczytaj zawartość pliku XML
            fetch(productData)
                .then((response) => response.text())
                .then((xmlText) => {
                    // Przetwórz XML
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

                    // Filtrowanie leków w zależności od checkboxa "kaszel"
                    if (diseases.kaszel) {
                        console.log("kaszel");

                        const filteredLeki = productInfo.filter((productInfo) => {
                            const productName = productInfo.split(" ")[0]; // Pobierz nazwę produktu
                            const productNode = Array.from(productNodes).find((node) =>
                                node.getAttribute("nazwaProduktu") === productName
                            );

                            if (productNode) {
                                const substancjeCzynne = productNode.querySelectorAll("substancjaCzynna");
                                const containsBromoheksyny = Array.from(substancjeCzynne).some((substancja) =>
                                    substancja.getAttribute("nazwaSubstancji") === "bromoheksyny chlorowodorek"
                                );

                                console.log("containsBromoheksyny:", containsBromoheksyny);

                                return containsBromoheksyny;
                            }

                            return false;
                        });

                        setFilteredLeki(filteredLeki);
                    } else {
                        setFilteredLeki([]); // Wyłącz filtry, jeśli checkbox "kaszel" nie jest zaznaczony
                    }
                })
                .catch((error) => {
                    console.error("Błąd podczas pobierania pliku XML:", error);
                });
        }
    }, [diseases.kaszel, productData]);





    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Po wylogowaniu przekieruj użytkownika na stronę logowania
            navigate("/");
        } catch (error) {
            console.error("Błąd podczas wylogowywania:", error);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handleProductSelect = (event) => {
        const selectedOptions = event.target.selectedOptions;
        const selectedProductNames = Array.from(selectedOptions).map(
            (option) => option.value
        );
        setSelectedProducts(selectedProductNames);
        setSelectedProductNames(selectedProductNames);
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

            <button
                className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`}
                onClick={toggleSidebar}
            >
                <img src={menu_icon} alt="" />
            </button>

            <div className="content with-background">
                <h1>Stan zdrowia</h1>
                <div className="health">
                    <label>
                        <input
                            type="checkbox"
                            checked={diseases.kaszel}
                            onChange={(e) => handleCheckboxChange("kaszel", e.target.checked)}
                        />
                        Kaszel
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={diseases.katar}
                            onChange={(e) => handleCheckboxChange("katar", e.target.checked)}
                        />
                        Katar
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={diseases.goraczka}
                            onChange={(e) =>
                                handleCheckboxChange("goraczka", e.target.checked)
                            }
                        />
                        Gorączka
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={diseases.bolBrzucha}
                            onChange={(e) =>
                                handleCheckboxChange("bolBrzucha", e.target.checked)
                            }
                        />
                        Ból brzucha
                    </label>
                </div>

                <div className="product-list">
                    {filteredLeki.length > 0 && (
                        <select
                            multiple
                            value={selectedProducts}
                            onChange={handleProductSelect}
                        >
                            {filteredLeki.map((productInfo, index) => (
                                <option key={index} value={productInfo}>
                                    {productInfo}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

            </div>
        </div>
    );
};

export default UpdateHealth;
