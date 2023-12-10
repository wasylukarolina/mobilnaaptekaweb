import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));

        const diseasesRef = collection(db, "diseases");
        const userDiseasesDoc = doc(diseasesRef, email);

        // Pobieranie danych z Firebase
        getDoc(userDiseasesDoc)
            .then((userDiseasesSnap) => {
                const userDiseasesData = userDiseasesSnap.data();
                if (userDiseasesData) {
                    // Ustaw stan checkboxów na podstawie danych z Firebase
                    setCukrzyca(userDiseasesData.cukrzyca || false);
                    setAsthma(userDiseasesData.asthma || false);
                    setCiaza(userDiseasesData.ciaza || false);
                    setChorobySerca(userDiseasesData.chorobySerca || false);
                }
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

    const handleCheckboxChange = async (checkboxName, isChecked) => {
        try {
            const email = auth.currentUser.email;
            const db = getFirestore(auth.app);

            // Zamiast kolekcji "users" użyj kolekcji "diseases"
            const diseasesRef = collection(db, 'diseases');
            const userDiseasesDoc = doc(diseasesRef, email);

            // Pobierz aktualne dane o chorobach użytkownika
            const userDiseasesSnap = await getDoc(userDiseasesDoc);
            const userDiseases = userDiseasesSnap.data() || {};

            // Zaktualizuj dane o chorobach
            userDiseases[checkboxName] = isChecked;

            // Dodaj pole "email" do danych o chorobach
            userDiseases['email'] = email;

            // Zapisz zaktualizowane dane w Firebase
            await setDoc(userDiseasesDoc, userDiseases);

            // Zaktualizuj lokalny stan
            switch (checkboxName) {
                case 'cukrzyca':
                    setCukrzyca(isChecked);
                    break;
                case 'asthma':
                    setAsthma(isChecked);
                    break;
                case 'ciaza':
                    setCiaza(isChecked);
                    break;
                case 'chorobySerca':
                    setChorobySerca(isChecked);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Błąd podczas aktualizacji danych w Firebase:', error);
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
                    <Link to="/drugonce">WZIĄŁEM LEK</Link>
                    <Link to="/doctors">LEKARZE</Link>
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
                        <input
                            type="checkbox"
                            checked={cukrzyca}
                            onChange={(e) => handleCheckboxChange('cukrzyca', e.target.checked)}
                        />
                        Cukrzyca
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={asthma}
                            onChange={(e) => handleCheckboxChange('asthma', e.target.checked)}
                        />
                        Astma
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={ciaza}
                            onChange={(e) => handleCheckboxChange('ciaza', e.target.checked)}
                        />
                        Ciąża
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={chorobySerca}
                            onChange={(e) => handleCheckboxChange('chorobySerca', e.target.checked)}
                        />
                        Choroby serca
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Health;
