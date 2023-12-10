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
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from "firebase/auth";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";


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

        if (!email || !password || !nickname) {
            alert("Wszystkie pola są wymagane.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Uzyskaj userId użytkownika
            const userId = user.uid;

            // Dodaj dane do kolekcji "users" w Firestore
            const db = getFirestore(app);
            const usersCollection = collection(db, 'users');

            const userData = {
                userId: userId,
                nickname: nickname,
                email: email,
                // Dodaj inne dane, które chcesz przekazać
            };

            // Sprawdź, czy adres e-mail zawiera "@lekarz.pl"
            if (email.includes("@lekarz.pl")) {
                // Jeśli tak, dodaj dodatkowe dane
                userData.rola = "L";
            }

            // Dodaj dokument do kolekcji "users"
            await addDoc(usersCollection, userData);

            setAction("Logowanie"); // Przekierowanie na stronę logowania
            setEmail("");
            setPassword("");
            setNickname("");
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
            alert("Nieudane logowanie. Sprawdź adres e-mail i hasło.");
        }
    };


    const handleResetPassword = () => {
        // Wysłanie e-maila z linkiem do resetowania hasła na adres powiązany z kontem
        sendPasswordResetEmail(auth, email)
            .then(() => {
                console.log("E-mail z linkiem do resetowania hasła został wysłany.");
            })
            .catch((error) => {
                console.error("Błąd podczas wysyłania e-maila z linkiem do resetowania hasła:", error);
            });
    };

    const handleGoogleLogin = async () => {
        try {
            // Uzyskaj dostęp do obiektu autentykacji
            const auth = getAuth();

            // Utwórz dostawcę logowania do Google
            const provider = new GoogleAuthProvider();

            // Uruchom proces logowania z Google
            const userCredential = await signInWithPopup(auth, provider);

            // Zaloguj użytkownika
            const user = userCredential.user;
            setIsLoggedIn(true);

            // Przejście do odpowiedniego widoku na podstawie adresu e-mail
            if (user.email.includes("@lekarz.pl")) {
                navigate('/mainviewdoc');
            } else {
                navigate('/mainview');
            }
        } catch (error) {
            console.error("Błąd podczas logowania z Googlem:", error);
            alert("Nieudane logowanie z Googlem.");
        }
    };


    return (
        <div className='container'>
            <div className="header">
                <div className="text">{isLoggedIn ? "Zalogowano" : action}</div>

                <div className="underline"></div>

                <div className="submit-container">
                    <div className={action === "Logowanie" ? "submit gray" : "submit"} onClick={() => { setAction("Rejestracja") }}>Rejestracja</div>
                    <div className={action === "Rejestracja" ? "submit gray" : "submit"} onClick={() => { setAction("Logowanie") }}>Logowanie</div>
                </div>
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

                    {action === "Rejestracja" ? <div></div> : <div className="forgot-password" onClick={handleResetPassword}>
                        Zapomniałeś hasła? Wpisz swój mail w formularz i <span>Kliknij</span>
                    </div>}

                    <div className="buttons-container">
                        <div className="submitG" onClick={() => handleGoogleLogin()}>G</div>
                        <button className="confirm-button" onClick={isLoggedIn ? null : (action === "Rejestracja" ? handleRegister : handleLogin)}>Potwierdź</button>
                    </div>



                </div>
            )}
        </div>
    );
}

export default LoginSignup;

document.body.classList.add('login-signup');