import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LoginSignup from "./Components/LoginSignUp/LoginSignup";
import MainView from "./Components/LoginSignUp/MainView";
import NewDrug from "./Components/LoginSignUp/NewDrug";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseConfig";

function App() {
    const [user] = useAuthState(auth);

    return (
        <Router>
            <Routes>
                <Route path="/" element={!user ? <LoginSignup /> : <Navigate to="/mainview" />} />
                <Route
                    path="/mainview"
                    element={user ? <MainView /> : <Navigate to="/" replace />}
                />
                <Route path="/newdrug" element={user ? <NewDrug /> : <Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
