import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../../firebaseConfig";

const MainView = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");

    useEffect(() => {
        const userId = auth.currentUser.uid;
        const db = getFirestore(auth.app);

        // Utwórz zapytanie do bazy danych Firestore, aby pobrać dokument z kolekcji "users"
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userId", "==", userId));

        // Pobierz dokumenty pasujące do zapytania
        getDocs(q)
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    // Pobierz nickname z dokumentu
                    const userData = doc.data();
                    setNickname(userData.nickname);
                });
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania danych z Firestore:", error);
            });
    }, []);

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <div>

            <button onClick={handleLogout}>Wyloguj</button>

            <h1>
            {nickname && <p>Witaj, {nickname}!</p>} </h1>

        </div>
    );
};

export default MainView;
