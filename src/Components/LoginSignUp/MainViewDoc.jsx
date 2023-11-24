import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs, getDoc, doc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import "./MainViewDoc.css";
import menu_icon from '../Assets/menu.png';


const MainViewDoc = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);


    useEffect(() => {
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);
        const doctorsRef = collection(db, "doctors");
        const doctorDocRef = doc(doctorsRef, email);

        getDoc(doctorDocRef)
            .then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const doctorData = docSnapshot.data();
                    setPatients(doctorData.patients || []);
                } else {
                    console.error("Dokument lekarza nie istnieje.");
                }
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania danych z Firestore:", error);
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

    const handlePatientClick = (patient) => {
        setSelectedPatient(patient);
    };


    return (
        <div className={`main-view ${isSidebarOpen ? "sidebar-open" : ""}`}>
            <div className="sidebar">
                <div className="centered-content">
                    <h2>MENU</h2>
                    <Link to="/mainview">STRONA GŁÓWNA</Link>
                    <Link to="/newdrug">DODAJ LEK</Link>
                    <button className="logout-button" onClick={handleLogout}>Wyloguj</button>
                </div>
            </div>

            <button className={`sidebar-toggle ${isSidebarOpen ? "right" : "left"}`} onClick={toggleSidebar}>
                <img src={menu_icon} alt="" />
            </button>

            <div className="content with-background">
                <h1>
                    {nickname && <p>Witaj, {nickname}!</p>}
                </h1>

                <h2>Lista pacjentów:</h2>
                <div className="patient-field">
                <ul>
                    {patients.map((patient, index) => (
                        <li key={index} onClick={() => handlePatientClick(patient)}>
                            {patient}
                        </li>
                    ))}
                </ul>
                </div>

                {selectedPatient && (
                    <div className="patient-modal">
                        <h2>Informacje o pacjencie</h2>
                        <p>
                            <strong>Imię i nazwisko pacjenta:</strong> {selectedPatient}
                        </p>
                        {/* Dodaj inne informacje o pacjencie, jeśli są dostępne */}
                        <div className="close-button">
                            <button onClick={() => setSelectedPatient(null)}>Zamknij</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MainViewDoc;
