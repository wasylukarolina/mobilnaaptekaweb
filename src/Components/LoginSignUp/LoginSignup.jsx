import React, { useState } from "react";
import './LoginSignup.css';
import email_icon from '../Assets/email.png';
import pass_icon from '../Assets/pass.png';
import person_icon from '../Assets/person.png';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
//import { useNavigate } from 'react-router-dom';


const LoginSignup = () => {

    const [action, setAction] = useState("Rejestracja");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); // Dodaj stan dla pola hasła


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
            console.log(userCredential);
            const user = userCredential.user;

            // Po udanej rejestracji, zmień akcję na "Logowanie"
            setAction("Logowanie");

            // Zresetuj pola email i password do pustych ciągów znaków
            setEmail("");
            setPassword("");

            // Możesz dodać kod obsługi po udanej rejestracji, np. przekierowanie do innej strony
        } catch (error) {
            console.error(error);
            // Dodaj kod obsługi błędu, np. wyświetlenie komunikatu o błędzie
        }
    };

    //const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            console.error("Nieprawidłowy adres e-mail");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(userCredential);

            // Przekieruj użytkownika po zalogowaniu na widok "Main"
            //navigate("/main");

            console.log("Zalogowano pomyślnie!");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className='container'>
            <div className="header">
                <div className="text">{action}</div>
                <div className="underline"></div>
            </div>
            <div className="inputs">
                {action === "Logowanie" ? <div></div> : <div className="input">
                    <img src={person_icon} alt="" />
                    <input type="text" placeholder="Nick" />
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

            {action === "Rejestracja" ? <div></div> : <div className="forgot-password">Zapomniałeś hasła? <span>Kliknij</span></div>}
            <div className="submit-container">
                <div className={action === "Logowanie" ? "submit gray" : "submit"} onClick={() => { setAction("Rejestracja") }}>Rejestracja</div>
                <div className={action === "Rejestracja" ? "submit gray" : "submit"} onClick={() => { setAction("Logowanie") }}>Logowanie</div>
            </div>
            <button className="confirm-button" onClick={handleRegister}>Potwierdź</button>
        </div>
    )
}

export default LoginSignup;
