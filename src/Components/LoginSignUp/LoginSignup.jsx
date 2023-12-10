import React, { useState } from "react";
import './LoginSignup.css';
import email_icon from '../Assets/email.png';
import pass_icon from '../Assets/pass.png';
import person_icon from '../Assets/person.png';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, app } from "../../firebaseConfig";
import { useNavigate } from 'react-router-dom';
import MainView from "./MainView";
import { getDatabase, ref, set } from 'firebase/database';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from "firebase/auth";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { setPersistence, browserSessionPersistence } from 'firebase/auth';



const LoginSignup = () => {
    const [action, setAction] = useState("Rejestracja");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailLog, setEmailLog] = useState("");
    const [passwordLog, setPasswordLog] = useState("");
    const [nickname, setNickname] = useState("");
    const [emailReg, setEmailReg] = useState("");
    const [passwordReg, setPasswordReg] = useState("");
    const [nicknameReg, setNicknameReg] = useState("");
    const navigate = useNavigate(); // Dodajemy navigate

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!isValidEmail(emailReg)) {
            console.error("Nieprawidłowy adres e-mail");
            return;
        }

        if (!emailReg || !passwordReg || !nicknameReg) {
            alert("Wszystkie pola są wymagane.");
            return;
        }

        try {

            const userCredential = await createUserWithEmailAndPassword(auth, emailReg, passwordReg);
            const userReg = userCredential.user;

            // Uzyskaj userId użytkownika
            const userId = userReg.uid;

            // Dodaj dane do kolekcji "users" w Firestore
            const db = getFirestore(app);
            const usersCollection = collection(db, 'users');

            const userData = {
                userId: userId,
                nickname: nicknameReg,
                email: emailReg,
                // Dodaj inne dane, które chcesz przekazać
            };

            // Sprawdź, czy adres e-mail zawiera "@lekarz.pl"
            if (emailReg.includes("@lekarz.pl")) {
                // Jeśli tak, dodaj dodatkowe dane
                userData.rola = "L";
            }

            // Dodaj dokument do kolekcji "users"
            await addDoc(usersCollection, userData);

            setEmailReg("");
            setPasswordReg("");
            setNicknameReg("");

            alert("Rejestracja udana. Teraz możesz się zalogować!");
            setAction("Logowanie");  // Dodaj tę linię
        } catch (error) {
            console.error(error);
        }
    }


    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isValidEmail(emailLog)) {
            console.error("Nieprawidłowy adres e-mail");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailLog, passwordLog);
            console.log(userCredential);

            // Sprawdź, czy adres e-mail zawiera "@lekarz.pl"
            if (emailLog.includes("@lekarz.pl")) {
                navigate('/mainviewdoc'); // Przekierowanie na stronę lekarza
            } else {
                navigate('/mainview'); // Przekierowanie na standardową stronę
            }
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
                <div className="text">{action}</div>
                <div className="underline"></div>
                <div className="submit-container">
                    <div className={action === "Logowanie" ? "submit gray" : "submit"} onClick={() => {
                        setAction("Rejestracja")
                    }}>Rejestracja
                    </div>
                    <div className={action === "Rejestracja" ? "submit gray" : "submit"} onClick={() => {
                        setAction("Logowanie")
                    }}>Logowanie
                    </div>
                </div>
            </div>

            <div className="inputs">
                {action === "Logowanie" ? (
                    // Sekcja dla Logowania
                    <>
                        <div className="input">
                            <img src={email_icon} alt=""/>
                            <input type="email" placeholder="Email" value={emailLog} onChange={(e) => setEmailLog(e.target.value)}/>
                        </div>
                        <div className="input">
                            <img src={pass_icon} alt=""/>
                            <input type="password" placeholder="Hasło" value={passwordLog} onChange={(e) => setPasswordLog(e.target.value)}/>
                        </div>
                    </>
                ) : (
                    // Sekcja dla Rejestracji
                    <>
                        <div className="input">
                            <img src={person_icon} alt=""/>
                            <input type="text" placeholder="Nick" value={nicknameReg} onChange={(e) => setNicknameReg(e.target.value)}/>
                        </div>
                        <div className="input">
                            <img src={email_icon} alt=""/>
                            <input type="email" placeholder="Email" value={emailReg} onChange={(e) => setEmailReg(e.target.value)}/>
                        </div>
                        <div className="input">
                            <img src={pass_icon} alt=""/>
                            <input type="password" placeholder="Hasło" value={passwordReg} onChange={(e) => setPasswordReg(e.target.value)}/>
                        </div>
                    </>
                )}

            </div>

            <div>
                {action === "Rejestracja" ? null : (
                    <div className="forgot-password" onClick={handleResetPassword}>
                        Zapomniałeś hasła? Wpisz swój mail w formularz i <span>Kliknij</span>
                    </div>
                )}

                <div className="buttons-container">
                    {action === "Rejestracja" ? (
                        <button className="confirm-button" onClick={handleRegister}>Zarejestruj</button>
                    ) : (
                        <>
                            <div className="submitG" onClick={() => handleGoogleLogin()}>G</div>
                            <button className="confirm-button" onClick={handleLogin}>Zaloguj</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
export default LoginSignup;
