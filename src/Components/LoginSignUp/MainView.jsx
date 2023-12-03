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

const MainView = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [events, setEvents] = useState([]); // Dodaj stan events
    const [patientMedications, setPatientMedications] = useState([]); // Dodaj stan dla leków pacjenta
    const today = new Date();
    const [showNotTakenYesterdayModal, setShowNotTakenYesterdayModal] = useState(false);
    const [notTakenYesterdayMedicationsList, setNotTakenYesterdayMedicationsList] = useState([]);
    const [isCheckedMainView, setIsCheckedMainView] = useState({});


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

    const getNotTakenYesterdayMedications = async () => {
        const email = auth.currentUser.email;
        const db = getFirestore(auth.app);
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

            const checkedMedicationsRefYesterday = collection(db, "checkedMedications");
            const checkedMedicationsQueryYesterday = query(
                checkedMedicationsRefYesterday,
                where("email", "==", email),
                where("checkedDate", "==", formattedYesterday)
            );

            const querySnapshotYesterday = await getDocs(checkedMedicationsQueryYesterday);
            const takenYesterday = [];
            querySnapshotYesterday.forEach((doc) => {
                const medicationData = doc.data();
                takenYesterday.push(medicationData.medicationName);
            });

            const notTakenYesterdayMedications = medications.filter(
                (medication) => !isDoseTakenYesterday(medication.nazwaProduktu, medication.dawkowanie[0])
            );

            openNotTakenYesterdayModal(notTakenYesterdayMedications);
        } catch (error) {
            console.error("Błąd podczas pobierania leków pacjenta:", error);
        }
    };


    const openNotTakenYesterdayModal = (notTakenYesterdayMedications) => {
        setShowNotTakenYesterdayModal(true);
        setNotTakenYesterdayMedicationsList(notTakenYesterdayMedications);
    };

    const closeNotTakenYesterdayModal = () => {
        setShowNotTakenYesterdayModal(false);
        setNotTakenYesterdayMedicationsList([]); // Wyczyść listę leków po zamknięciu modala
    };

    const generateMedicationList = (medication) => {
        const medicationList = [];
        medication.dawkowanie.forEach((dose, doseIndex) => {
            const doseWithTime = `${medication.nazwaProduktu} - ${dose}`;
            const isDoseTaken = isDoseTakenToday(medication.nazwaProduktu, dose);

            // Dodaj warunek sprawdzający, czy dawka została wzięta
            if (!isDoseTaken) {
                medicationList.push(doseWithTime);
            }
        });

        // Jeśli lek ma tylko jedną wartość w polu dawkowanie, dodaj ją do listy bez dodatkowych sprawdzeń
        if (medication.dawkowanie.length === 1) {
            const doseWithTime = `${medication.nazwaProduktu} - ${medication.dawkowanie[0]}`;
            medicationList.push(doseWithTime);
        }

        return medicationList;
    };



    const isDoseTakenToday = (medicationName, dose) => {
        return events.some(
            (event) => event.title === medicationName && moment(event.start).format("HH:mm") === dose
        );
    };

    const handleCheckboxChangeMainView = async (medication, doseIndex) => {
        try {
            const currentDate = new Date();
            const currentHour = currentDate.getHours();

            // Odczytaj godzinę z `doseKey` bez zmiany
            const selectedTime = medication.dawkowanie[doseIndex];

            // Pobierz datę wczorajszą
            const yesterday = new Date(currentDate);
            yesterday.setDate(currentDate.getDate() - 1);
            const dayYesterday = yesterday.getDate();
            const monthYesterday = yesterday.getMonth() + 1;
            const yearYesterday = yesterday.getFullYear();
            const formattedDateYesterday = `${dayYesterday}/${monthYesterday}/${yearYesterday}`;

            // Sprawdź, czy dokument istnieje w bazie danych
            const existingDocQuery = query(
                checkedMedicationsRef,
                where("email", "==", email),
                where("medicationName", "==", medication.nazwaProduktu),
                where("checkedDate", "==", formattedDateYesterday),
                where("checkedTime", "==", selectedTime)
            );

            const existingDocSnapshot = await getDocs(existingDocQuery);

            if (existingDocSnapshot.size === 0) {
                // Dodaj dokument, jeśli nie istnieje
                await addDoc(checkedMedicationsRef, {
                    email,
                    medicationName: medication.nazwaProduktu,
                    checkedDate: formattedDateYesterday,
                    checkedTime: selectedTime,
                });
            } else {
                // Usuń dokument, jeśli istnieje
                existingDocSnapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
            }

            // Zaktualizuj stan checkboxa lokalnie
            const updatedIsChecked = { ...isCheckedMainView };
            const doseKey = `dose-${medication.nazwaProduktu}-${medication.dawkowanie[doseIndex].replace(":", "_")}`;
            updatedIsChecked[doseKey] = !updatedIsChecked[doseKey];
            setIsCheckedMainView(updatedIsChecked);

            // Możesz dodać dodatkową logikę tutaj, jeśli to konieczne

        } catch (error) {
            console.error("Błąd podczas dodawania lub usuwania zaznaczonego leku:", error);
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
                    <h3>Leki pacjenta:</h3>
                    <ul>
                        {patientMedications.map((medication, index) => (
                            generateMedicationList(medication).map((doseWithTime, doseIndex) => (
                                <li key={`${index}-${doseIndex}`}>
                                    {doseWithTime}
                                </li>
                            ))
                        ))}
                    </ul>



                    <button className="button" onClick={getNotTakenYesterdayMedications}>Leki, których nie wzięto wczoraj</button>

                    {showNotTakenYesterdayModal && (
                        <div className="modal">
                            <button onClick={closeNotTakenYesterdayModal}>Zamknij</button>
                            <h3>Leki, których nie wzięto wczoraj:</h3>
                            <ul>
                                {notTakenYesterdayMedicationsList.map((medication, index) => (
                                    <li key={index}>
                                        {medication.dawkowanie.map((dose, doseIndex) => {
                                            const doseWithTime = `${medication.nazwaProduktu} - ${dose}`;
                                            const doseKey = `dose-${medication.nazwaProduktu}-${dose.replace(":", "_")}`;
                                            return (
                                                <div key={`${index}-${doseIndex}`} className="checkbox-slider-container">
                                                    <div className="checkbox-slider">
                                                        <input
                                                            type="checkbox"
                                                            id={`checkbox-${index}-${doseIndex}`}
                                                            checked={isCheckedMainView[doseKey] || false}
                                                            onChange={() => handleCheckboxChangeMainView(medication, doseIndex)}
                                                        />
                                                        <label htmlFor={`checkbox-${index}-${doseIndex}`}>{doseWithTime}</label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}


                </div>


                <MyCalendar />

            </div>
        </div>
    );
};

export default MainView;
