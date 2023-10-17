import React, { useState } from "react";
import './LoginSignup.css';
import email_icon from '../Assets/email.png';
import pass_icon from '../Assets/pass.png';
import person_icon from '../Assets/person.png';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, app } from "../../firebaseConfig";
import { useNavigate } from 'react-router-dom';
import MainView from "./MainView";
import { getDatabase, ref, set } from 'firebase/database';



const LoginSignup = () => {
    const [action, setAction] = useState("Rejestracja");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate(); // Dodajemy navigate

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            console.error("Nieprawidłowy adres e-mail");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Uzyskaj userId użytkownika
            const userId = user.uid;

            // Dodaj dane do tabeli w bazie danych
            const db = getDatabase(app); // Inicjuj dostęp do bazy danych z użyciem 'app'
            const dbRef = ref(db, 'nicknames/' + userId); // Zaktualizowaliśmy nazwę tabeli na 'nicknames'
            const userData = {
                nickname: nickname, // Pobierz nick z pola formularza
                // Dodaj inne dane, które chcesz przekazać
            };

            set(dbRef, userData);

            setAction("Logowanie");
            setEmail("");
            setPassword("");
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            console.error("Nieprawidłowy adres e-mail");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(userCredential);
            setIsLoggedIn(true);
            navigate('/mainview');
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <div className='container'>
            <div className="header">
                <div className="text">{isLoggedIn ? "Zalogowano" : action}</div>
                <div className="underline"></div>
            </div>
            <div className="inputs">
                {action === "Logowanie" ? <div></div> : <div className="input">
                    <img src={person_icon} alt="" />
                    <input type="text" placeholder="Nick" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </div>}

                <div className="input">
                    <img src={email_icon} alt="" />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="input">
                    <img src={pass_icon} alt="" />
                    <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
            </div>

            {isLoggedIn ? null : (
                <div>
                    {action === "Rejestracja" ? <div></div> : <div className="forgot-password">Zapomniałeś hasła? <span>Kliknij</span></div>}
                    <div className="submit-container">
                        <div className={action === "Logowanie" ? "submit gray" : "submit"} onClick={() => { setAction("Rejestracja") }}>Rejestracja</div>
                        <div className={action === "Rejestracja" ? "submit gray" : "submit"} onClick={() => { setAction("Logowanie") }}>Logowanie</div>
                    </div>
                    <button className="confirm-button" onClick={isLoggedIn ? null : (action === "Rejestracja" ? handleRegister : handleLogin)}>Potwierdź</button>
                </div>
            )}
        </div>
    );
}

export default LoginSignup;
