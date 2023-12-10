import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import menu_icon from '../Assets/menu.png';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from "moment";
import './CalendarStyles.css'; // Importuj plik ze stylami kalendarza
import './MyDrugs.css';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import pl from "date-fns/locale/pl"; // importuj polskie tłumaczenie dla DatePicker
registerLocale("pl", pl); // zarejestruj polskie tłumaczenie dla DatePicker
setDefaultLocale("pl"); // ustaw polskie tłumaczenie jako domyślne dla DatePicker


const MainView = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [events, setEvents] = useState([]); // Dodaj stan events
    const [patientMedications, setPatientMedications] = useState([]); // Dodaj stan dla leków pacjenta
    const today = new Date();
    const [notTakenYesterdayMedicationsList, setNotTakenYesterdayMedicationsList] = useState([]);
    const [isCheckedMainView, setIsCheckedMainView] = useState({});
    const [selectedDateTime, setSelectedDateTime] = useState(new Date());
    const [showNotTakenYesterdayModal, setShowNotTakenYesterdayModal] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState(""); // Dodaj stan dla wybranego leku



    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const db = getFirestore(auth.app);
    const email = auth.currentUser.email;
    const lekiRef = collection(db, "leki");
    const checkedMedicationsRef = collection(db, "checkedMedications");

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

                console.log("Pobrane leki pacjenta:", medications);


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
                        const takenMedications = new Map(); // Używamy Map zamiast Set do przechowywania informacji o dawkowaniach

                        querySnapshot.forEach((doc) => {
                            const medicationData = doc.data();
                            const medicationName = medicationData.medicationName;
                            const checkedDose = medicationData.checkedDose || 1; // Jeśli dawka nie istnieje, przyjmujemy 1

                            if (!takenMedications.has(medicationName)) {
                                takenMedications.set(medicationName, checkedDose);
                            } else {
                                takenMedications.set(medicationName, takenMedications.get(medicationName) + checkedDose);
                            }
                        });

                        // Filtruj leki pacjenta, uwzględniając dawkowanie
                        const remainingMedications = medications.filter((medication) => {
                            const takenDose = takenMedications.get(medication.nazwaProduktu) || 0;
                            const requiredDose = medication.dawkowanie.length || 1;

                            return takenDose < requiredDose;
                        });

                        console.log("Pozostałe leki pacjenta:", remainingMedications);

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
                    const end = new Date(start.getTime() + 60 * 1000); // Załóżmy, że wydarzenia trwają minutę

                    events.push({
                        title: medicationName,
                        start,
                        end,
                    });
                });
                setEvents(events);
            })

        const anotherQuery = query(medicationsRef2, where("email", "==", email));
        // Drugi blok getDocs
        getDocs(anotherQuery)
            .then((anotherQuerySnapshot) => {
                const events = [];

                anotherQuerySnapshot.forEach((doc) => {
                    const medicationData = doc.data();
                    const { medicationName, checkedDate, checkedTime, actualTime } = medicationData;

                    // Przetwórz datę i godzinę na obiekt Date
                    const dateParts = checkedDate.split("/"); // Załóżmy, że data jest w formacie dd/mm/yyyy
                    const checkedTimeParts = checkedTime.split(":");

                    // Dodaj sprawdzenie, czy pole actualTime istnieje
                    if (actualTime) {
                        const actualTimeParts = actualTime.split(":");
                        const checkedStart = new Date(
                            parseInt(dateParts[2]), // Rok
                            parseInt(dateParts[1]) - 1, // Miesiąc (odejmujemy 1, bo miesiące są od 0 do 11)
                            parseInt(dateParts[0]), // Dzień
                            parseInt(checkedTimeParts[0]), // Godzina
                            parseInt(checkedTimeParts[1]) // Minuta
                        );

                        const actualStart = new Date(
                            parseInt(dateParts[2]), // Rok
                            parseInt(dateParts[1]) - 1, // Miesiąc (odejmujemy 1, bo miesiące są od 0 do 11)
                            parseInt(dateParts[0]), // Dzień
                            parseInt(actualTimeParts[0]), // Godzina
                            parseInt(actualTimeParts[1]) // Minuta
                        );

                        // Przyjmuj tylko wydarzenia, których różnica między actualTime a checkedTime wynosi 1 godzinę lub więcej
                        const timeDifferenceMinutes = (actualStart.getTime() - checkedStart.getTime()) / (60 * 1000);
                        console.log(`Różnica czasu dla leku ${medicationName}: ${timeDifferenceMinutes} minut`);

                        if (timeDifferenceMinutes >= 60) {
                            events.push({
                                title: `${medicationName} (Late)`,
                                start: actualStart,
                                end: new Date(actualStart.getTime() + 60 * 1000), // Załóżmy, że wydarzenia trwają minutę
                            });
                        }
                    }
                });

                setEvents((prevEvents) => [...prevEvents, ...events]);
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

    const isDoseTakenYesterday = (medicationName, dose) => {
        return events.some(
            (event) => event.title === medicationName && moment(event.start).format("HH:mm") === dose
        );
    };

    const handleMedicationChange = (value) => {
        setSelectedMedication(value);
    };

    const getNotTakenYesterdayMedications = async () => {
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);
        const today = new Date();

        // Ustaw datę na wczoraj
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formattedYesterday = yesterday.toLocaleDateString('en-GB');

        const medicationsRef = collection(db, "leki");
        const medicationsQuery = query(medicationsRef, where("email", "==", email));

        try {
            const querySnapshot = await getDocs(medicationsQuery);
            const medications = [];

            querySnapshot.forEach((doc) => {
                const medicationData = doc.data();
                medications.push(medicationData);
            });

            // Aktualizacja listy leków nie wziętych wczoraj
            setNotTakenYesterdayMedicationsList(medications);
            openNotTakenYesterdayModal(medications);
        } catch (error) {
            console.error("Błąd podczas pobierania leków pacjenta:", error);
        }
    };



    const openNotTakenYesterdayModal = () => {
        setShowNotTakenYesterdayModal(true);
    };

    const closeNotTakenYesterdayModal = () => {
        setShowNotTakenYesterdayModal(false);
    };


    const generateMedicationList = (medication) => {
        const medicationList = [];

        medication.dawkowanie.forEach((dose, doseIndex) => {
            const doseWithTime = `${medication.nazwaProduktu} - ${dose}`;
            const doseKey = `single-dose-${medication.nazwaProduktu}-${doseIndex}`;

            medicationList.push(
                <li key={doseKey}>
                    {doseWithTime}
                </li>
            );
        });

        return medicationList;
    };



    const isDoseTakenToday = (medicationName, dose) => {
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        return events.some(
            (event) =>
                event.title === medicationName &&
                moment(event.start).format("HH:mm") === dose &&
                moment(event.start).isAfter(todayMidnight)
        );
    };

    const handleAddMedication = async () => {
        try {
            const currentDate = new Date();
            const selectedDate = new Date(selectedDateTime);

            // Sprawdź, czy wybrana data jest przyszła
            if (selectedDate > currentDate) {
                alert("Niepoprawna data. Wybierz datę starszą lub równą dzisiaj.");
                return;
            }

            const email = auth.currentUser.email;
            const db = getFirestore(auth.app);

            // Dodaj informację do tabeli checkedMedications
            await addDoc(checkedMedicationsRef, {
                email,
                medicationName: selectedMedication,
                checkedDate: selectedDateTime.toLocaleDateString('en-GB'),
                checkedTime: selectedDateTime.toLocaleTimeString('en-US', { hour12: false }),
            });

            // Zamknij modal po dodaniu
            closeNotTakenYesterdayModal();
        } catch (error) {
            console.error("Błąd podczas dodawania leku:", error);
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
                <h1>
                    {nickname && <p>Witaj, {nickname}!</p>}
                </h1>

                <div className="patient-medications">

                    <button className="button" onClick={getNotTakenYesterdayMedications}>Zapomniałeś wprowadzić informacje o wzięciu leku?</button>

                    {showNotTakenYesterdayModal && (
                        <div className="modal">
                            <button className="close-button" onClick={closeNotTakenYesterdayModal}>Zamknij</button>
                            <h3>Wybierz lek, datę i godzinę:</h3>
                            <div className="medication-picker-container">
                                {/* Lista rozwijana z lekami użytkownika */}
                                <select onChange={(event) => handleMedicationChange(event.target.value)}>
                                    <option value="" disabled selected>Wybierz lek</option>
                                    {patientMedications.map((medication, index) => (
                                        <option key={index} value={medication.nazwaProduktu}>
                                            {medication.nazwaProduktu}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Wybór daty i godziny */}
                            <div className="date-time-picker-container">
                                <DatePicker
                                    selected={selectedDateTime}
                                    onChange={(date) => setSelectedDateTime(date)}
                                    showTimeSelect
                                    dateFormat="Pp"
                                />
                            </div>
                            {/* Dodaj przycisk "Dodaj" */}
                            <button
                                className="add-button"
                                onClick={handleAddMedication}
                                disabled={!selectedMedication || selectedDateTime >= new Date() || selectedDateTime.getDate() === new Date().getDate()}
                            >
                                Dodaj
                            </button>
                        </div>
                    )}





                </div>

                <MyCalendar />

            </div>
        </div>
    );
};

export default MainView;