import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs, getDoc, doc, query, where } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { Link } from "react-router-dom";
import "./MainView.css";
import "./MainViewDoc.css";
import menu_icon from '../Assets/menu.png';
import './CalendarStyles.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from "moment";
import 'moment/locale/pl'; // Dodaj import dla lokalizacji moment (np. polska)

const MainViewDoc = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [events, setEvents] = useState([]);


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

    }, [auth.currentUser.email]);

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

    const handlePatientClick = async (patient) => {
        setSelectedPatient(patient);

        try {
            const db = getFirestore(auth.app);
            const medicationsRef = collection(db, "leki");
            const medicationsQuery = query(medicationsRef, where("email", "==", patient));

            const checkedMedicationsRef = collection(db, "checkedMedications");
            const q = query(checkedMedicationsRef, where("email", "==", patient));


            Promise.all([getDocs(medicationsQuery), getDocs(q)])
                .then(([medicationsSnapshot, checkedMedicationsSnapshot]) => {
                    const events = [];

                    medicationsSnapshot.forEach((doc) => {
                        const medicationData = doc.data();
                        const {nazwaProduktu, dawkowanie} = medicationData;

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
                        const {medicationName, checkedDate, checkedTime, actualTime} = medicationData;

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
        }
         catch (error) {
            console.error("Błąd podczas pobierania danych kalendarza pacjenta:", error);
        }
    };


    const eventStyleGetter = (event, start, end, isSelected) => {
        const medicationName = event.title.replace(" (Late)", ""); // Remove "(Late)" before checking on the patient's medication list


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


    const localizer = momentLocalizer(moment);

    return (
        <div className={`main-view ${isSidebarOpen ? "sidebar-open" : ""}`}>
            <div className="sidebar">
                <div className="centered-content">
                    <h2>MENU</h2>
                    <Link to="/mainview">STRONA GŁÓWNA</Link>
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
                            <strong>Email pacjenta:</strong> {selectedPatient}
                        </p>
                        <h3>Kalendarz pacjenta:</h3>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 500 }}
                            eventPropGetter={eventStyleGetter}
                        />
                        <div className="close-button-MOD">
                            <button onClick={() => setSelectedPatient(null)}>Zamknij</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainViewDoc;
