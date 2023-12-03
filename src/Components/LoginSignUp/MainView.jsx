import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from "moment";
import './CalendarStyles.css'; // Importuj plik ze stylami kalendarza


const MainView = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [events, setEvents] = useState([]); // Dodaj stan events
    const [patientMedications, setPatientMedications] = useState([]); // Dodaj stan dla leków pacjenta
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB'); // Format dd/mm/yyyy


    useEffect(() => {
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);

        // Pobierz leki pacjenta
        const medicationsRef = collection(db, "leki");
        const medicationsQuery = query(medicationsRef, where("email", "==", email));

        getDocs(medicationsQuery)
            .then((querySnapshot) => {
                const medications = [];
                querySnapshot.forEach((doc) => {
                    const medicationData = doc.data();
                    medications.push(medicationData);
                });

                // Pobierz historię brania leków dzisiaj
                const today = new Date();
                const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

                const checkedMedicationsRef = collection(db, "checkedMedications");
                const checkedMedicationsQuery = query(
                    checkedMedicationsRef,
                    where("email", "==", email),
                    where("checkedDate", "==", formattedDate)
                );

                return getDocs(checkedMedicationsQuery)
                    .then((querySnapshot) => {
                        const takenMedications = new Set();

                        querySnapshot.forEach((doc) => {
                            const medicationData = doc.data();
                            const medicationName = medicationData.medicationName;

                            takenMedications.add(medicationName);
                        });

                        // Filtruj leki pacjenta, pomijając te, które zostały już wzięte dzisiaj
                        const remainingMedications = medications.filter(
                            (medication) => !takenMedications.has(medication.nazwaProduktu)
                        );

                        setPatientMedications(remainingMedications);
                    })
                    .catch((error) => {
                        console.error("Błąd podczas pobierania historii brania leków z Firestore:", error);
                    });
            })

            .catch((error) => {
                console.error("Błąd podczas pobierania leków pacjenta z Firestore:", error);
            });

        const medicationsRef2 = collection(db, "checkedMedications");
        const q = query(medicationsRef2, where("email", "==", email));

        getDocs(q)
            .then((querySnapshot) => {
                const events = [];
                querySnapshot.forEach((doc) => {
                    const medicationData = doc.data();
                    const { medicationName, checkedDate, checkedTime } = medicationData;

                    // Przetwórz datę i godzinę na obiekt Date
                    const dateParts = checkedDate.split("/"); // Załóżmy, że data jest w formacie dd/mm/yyyy
                    const timeParts = checkedTime.split(":");
                    const start = new Date(
                        parseInt(dateParts[2]), // Rok
                        parseInt(dateParts[1]) - 1, // Miesiąc (odejmujemy 1, bo miesiące są od 0 do 11)
                        parseInt(dateParts[0]), // Dzień
                        parseInt(timeParts[0]), // Godzina
                        parseInt(timeParts[1]) // Minuta
                    );
                    const end = new Date(start.getTime() + 60 * 60 * 1000); // Załóżmy, że wydarzenia trwają godzinę

                    events.push({
                        title: medicationName,
                        start,
                        end,
                    });
                });
                setEvents(events);
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania danych z Firestore:", error);
            });
    }, [auth.currentUser.email]);

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

    const localizer = momentLocalizer(moment);

    const MyCalendar = () => {
        return (
            <>
                <div className="patient-medications">
                    <h3>Leki pacjenta:</h3>
                    <ul>
                        {patientMedications.map((medication, index) => (
                            <li key={index}>
                                {medication.nazwaProduktu} - {medication.dawkowanie}
                            </li>
                        ))}
                    </ul>
                </div>

                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                />
            </>
        );
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
                <h1>
                    {nickname && <p>Witaj, {nickname}!</p>}
                </h1>
                <MyCalendar />
            </div>
        </div>
    );
};

export default MainView;
