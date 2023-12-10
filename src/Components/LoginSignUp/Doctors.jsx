import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs, getDoc, deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import './Doctors.css';

const Doctors = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [doctorsList, setDoctorsList] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [isPatient, setIsPatient] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const db = getFirestore(auth.app);
                const usersRef = collection(db, "users");
                const snapshot = await getDocs(usersRef);

                const doctors = [];
                snapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.email && userData.email.includes("@lekarz.pl")) {
                        doctors.push(userData);
                    }
                });

                setDoctorsList(doctors);
            } catch (error) {
                console.error("Błąd podczas pobierania danych z Firestore:", error);
            }
        };


        setIsPatient(selectedDoctor?.patients?.includes(auth.currentUser.email) || false);
        fetchData();
    }, [selectedDoctor]);

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

    const handleDoctorClick = async (doctor) => {
        setSelectedDoctor(doctor);

        try {
            const db = getFirestore(auth.app);
            const doctorsRef = collection(db, "doctors");

            // Sprawdź, czy istnieje dokument o nazwie takiej, jak mail wybranego lekarza
            const doctorDocRef = doc(doctorsRef, doctor.email);
            const doctorDocSnapshot = await getDoc(doctorDocRef);

            // Sprawdź, czy aktualny użytkownik jest już w pacjentach lekarza
            const isPatient = doctorDocSnapshot.data()?.patients?.includes(auth.currentUser.email) || false;
            setIsPatient(isPatient);
        } catch (error) {
            console.error("Błąd podczas sprawdzania statusu pacjenta:", error);
        }
    };

    const handleCloseModal = () => {
        setSelectedDoctor(null);
    };


    const handleShareData = async () => {
        try {
            const db = getFirestore(auth.app);
            const doctorsRef = collection(db, "doctors");

            // Sprawdź, czy istnieje dokument o nazwie takiej, jak mail wybranego lekarza
            const doctorDocRef = doc(doctorsRef, selectedDoctor.email);
            const doctorDocSnapshot = await getDoc(doctorDocRef);

            // Sprawdź, czy aktualny użytkownik jest już w pacjentach lekarza
            if (!doctorDocSnapshot.data()?.patients.includes(auth.currentUser.email)) {
                // Jeśli dokument nie istnieje, dodaj go
                if (!doctorDocSnapshot.exists()) {
                    await setDoc(doctorDocRef, { patients: [auth.currentUser.email] });
                    console.log("Utworzono nowego lekarza w tabeli doctors.");
                } else {
                    // Jeśli dokument istnieje, zaktualizuj pole pacjenta
                    await updateDoc(doctorDocRef, {
                        patients: [...doctorDocSnapshot.data().patients, auth.currentUser.email]
                    });
                    console.log("Zaktualizowano dane lekarza w tabeli doctors.");
                }

                console.log("Udostępniono dane lekarzowi");
            } else {
                console.log("Użytkownik już jest w pacjentach lekarza.");
            }

            // Zaktualizuj stan isPatient po operacji udostępniania danych
            setIsPatient(true);
        } catch (error) {
            console.error("Błąd podczas udostępniania danych:", error);
        }
    }

    const handleRemoveData = async () => {
        try {
            const db = getFirestore(auth.app);
            const doctorsRef = collection(db, "doctors");

            // Sprawdź, czy istnieje dokument o nazwie takiej, jak mail wybranego lekarza
            const doctorDocRef = doc(doctorsRef, selectedDoctor.email);
            const doctorDocSnapshot = await getDoc(doctorDocRef);

            // Sprawdź, czy aktualny użytkownik istnieje w pacjentach lekarza
            if (doctorDocSnapshot.data().patients.includes(auth.currentUser.email)) {
                const updatedPatients = doctorDocSnapshot.data().patients.filter(patient => patient !== auth.currentUser.email);

                // Jeśli lista pacjentów jest pusta, usuń cały dokument
                if (updatedPatients.length === 0) {
                    await deleteDoc(doctorDocRef);
                } else {
                    // W przeciwnym razie zaktualizuj pole pacjentów
                    await updateDoc(doctorDocRef, { patients: updatedPatients });
                }

                console.log("Usunięto dane lekarza");
            } else {
                console.log("Użytkownik nie istnieje w pacjentach lekarza.");
            }

            // Zaktualizuj stan isPatient po operacji usuwania danych
            setIsPatient(false);
        } catch (error) {
            console.error("Błąd podczas usuwania danych:", error);
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
                <h1>Lista lekarzy:</h1>
                <div className="doctor-field">
                    <ul>
                        {doctorsList.map((doctor, index) => (
                            <li
                                key={index}
                                onClick={() => handleDoctorClick(doctor)}
                            >
                                {doctor.nickname}
                            </li>
                        ))}
                    </ul>
                </div>

                {selectedDoctor && (
                    <div className="doctor-modal">
                        <h2>Informacje o lekarzu</h2>
                        <div className="doctor-info">
                            <p>
                                <strong>Nick lekarza:</strong> {selectedDoctor.nickname}
                            </p>
                            <p>
                                <strong>Email lekarza:</strong> {selectedDoctor.email}
                            </p>
                        </div>
                        <div className="buttons">
                            <div className="button-add">
                                <button
                                    onClick={handleShareData}
                                    disabled={isPatient}
                                >
                                    Udostępnij dane
                                </button>
                            </div>

                            <div className="button-add">
                                <button
                                    onClick={handleRemoveData}
                                    disabled={!isPatient}
                                >
                                    Usuń dane
                                </button>
                            </div>
                        </div>


                        <div className="close-button">
                            <button onClick={handleCloseModal}>Zamknij</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Doctors;
