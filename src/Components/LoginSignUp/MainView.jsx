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

        const medicationsRef = collection(db, "leki");
        const medicationsQuery = query(medicationsRef, where("email", "==", email));

        const checkedMedicationsRef = collection(db, "checkedMedications");
        const q = query(checkedMedicationsRef, where("email", "==", email));

        Promise.all([getDocs(medicationsQuery), getDocs(q)])
            .then(([medicationsSnapshot, checkedMedicationsSnapshot]) => {
                const events = [];

                medicationsSnapshot.forEach((doc) => {
                    const medicationData = doc.data();
                    const { nazwaProduktu, dawkowanie } = medicationData;

                    dawkowanie.forEach((dose) => {
                        const [hours, minutes] = dose.split(":");
                        const doseTime = new Date();
                        doseTime.setHours(hours, minutes, 0, 0);

                        const currentTime = new Date();
                        if (currentTime > doseTime) {
                            events.push({
                                title: `${nazwaProduktu} (notTakenLate)`,
                                start: doseTime,
                                end: new Date(doseTime.getTime() + 60 * 1000),
                            });
                        } else {
                            events.push({
                                title: `${nazwaProduktu} (notTaken)`,
                                start: doseTime,
                                end: new Date(doseTime.getTime() + 60 * 1000),
                            });
                        }
                    });
                });

                checkedMedicationsSnapshot.forEach((doc) => {
                    const medicationData = doc.data();
                    const { medicationName, checkedDate, checkedTime, actualTime } = medicationData;

                    const dateParts = checkedDate.split("/");
                    const checkedTimeParts = checkedTime.split(":");
                    const checkedStart = new Date(
                        parseInt(dateParts[2]),
                        parseInt(dateParts[1]) - 1,
                        parseInt(dateParts[0]),
                        parseInt(checkedTimeParts[0]),
                        parseInt(checkedTimeParts[1])
                    );

                    if (actualTime) {
                        const actualTimeParts = actualTime.split(":");
                        const actualStart = new Date(
                            parseInt(dateParts[2]),
                            parseInt(dateParts[1]) - 1,
                            parseInt(dateParts[0]),
                            parseInt(actualTimeParts[0]),
                            parseInt(actualTimeParts[1])
                        );

                        const timeDifferenceMinutes = (actualStart.getTime() - checkedStart.getTime()) / (60 * 1000);

                        if (timeDifferenceMinutes >= 60) {
                            events.push({
                                title: `${medicationName} (Late)`,
                                start: actualStart,
                                end: new Date(actualStart.getTime() + 60 * 1000),
                            });
                        } else {
                            // Dodaj warunek, który sprawdzi, czy istnieje (notTaken) lub (notTakenLate) i usuwa go
                            const index = events.findIndex(
                                (event) =>
                                    event.title === `${medicationName} (notTaken)` ||
                                    event.title === `${medicationName} (notTakenLate)`
                            );
                            if (index !== -1) {
                                events.splice(index, 1);
                            }

                            // Dodaj (onTime) zamiast (notTaken) lub (notTakenLate)
                            events.push({
                                title: `${medicationName} (onTime)`,
                                start: checkedStart,
                                end: new Date(checkedStart.getTime() + 60 * 1000),
                            });
                        }
                    } else {
                        // Jeśli actualTime nie istnieje, traktuj to jako (onTime)
                        events.push({
                            title: `${medicationName} (onTime)`,
                            start: checkedStart,
                            end: new Date(checkedStart.getTime() + 60 * 1000),
                        });
                    }
                });

                setEvents(events);
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania danych z Firestore:", error);
            });
    }, [auth.currentUser.email]);


    const MyCalendar = () => {
        const eventStyleGetter = (event, start, end, isSelected) => {
            const medicationName = event.title.replace(" (Late)", ""); // Remove "(Late)" before checking on the patient's medication list

            // Check if the medication is on the patient's medication list to be taken
            const isMedicationInList = patientMedications.some(
                (medication) => medication.nazwaProduktu === medicationName
            );

            // Check if the medication has "(Late)" in the title
            if (event.title.includes("(Late)")) {
                // Display in yellow
                return {
                    style: {
                        backgroundColor: "yellow",
                        borderRadius: "5px",
                        opacity: 0.8,
                        color: "black",
                        border: "1px solid yellow",
                        display: "block",
                        cursor: "pointer",
                    },
                };
            }

            // Check if the medication has "(onTime)" in the title
            if (event.title.includes("(onTime)")) {
                // Display in green
                return {
                    style: {
                        backgroundColor: "#356F90",
                        borderRadius: "5px",
                        opacity: 0.8,
                        color: "white",
                        border: "1px solid #356F90",
                        display: "block",
                        cursor: "pointer",
                    },
                };
            }

            // Check if the medication has "(notTaken)" in the title
            if (event.title.includes("(notTaken)")) {
                // Display in gray
                return {
                    style: {
                        backgroundColor: "grey",
                        borderRadius: "5px",
                        opacity: 0.8,
                        color: "white",
                        border: "1px solid grey",
                        display: "block",
                        cursor: "pointer",
                    },
                };
            }

            // Check if the medication has "(notTakenLate)" in the title
            if (event.title.includes("(notTakenLate)")) {
                // Display in black with white text
                return {
                    style: {
                        backgroundColor: "black",
                        borderRadius: "5px",
                        opacity: 0.8,
                        color: "white",
                        border: "1px solid black",
                        display: "block",
                        cursor: "pointer",
                    },
                };
            }

            // If none of the above conditions are met, use the default style (in red)
            return {
                style: {
                    backgroundColor: "red",
                    borderRadius: "5px",
                    opacity: 0.8,
                    color: "white",
                    border: "1px solid #3174ad",
                    display: "block",
                    cursor: "pointer",
                },
            };
        };


        return (
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                eventPropGetter={eventStyleGetter}
            />
        );
    };



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

    const getPatientMedications = async () => {
        const email = auth.currentUser.email;
        const medicationsRef = collection(db, "leki");
        const medicationsQuery = query(medicationsRef, where("email", "==", email));

        try {
            const querySnapshot = await getDocs(medicationsQuery);
            const medications = [];

            querySnapshot.forEach((doc) => {
                const medicationData = doc.data();
                medications.push(medicationData);
            });

            // Aktualizacja listy leków pacjenta
            setPatientMedications(medications);
        } catch (error) {
            console.error("Błąd podczas pobierania leków pacjenta:", error);
        }
    };

// Wywołaj funkcję getPatientMedications w useEffect
    useEffect(() => {
        getPatientMedications();
    }, [auth.currentUser.email]);


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