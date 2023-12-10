import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LoginSignup from "./Components/LoginSignUp/LoginSignup";
import MainView from "./Components/LoginSignUp/MainView";
import NewDrug from "./Components/LoginSignUp/NewDrug";
import MyDrugs from "./Components/LoginSignUp/MyDrugs";
import Health from "./Components/LoginSignUp/Health";
import UpdateHealth from "./Components/LoginSignUp/UpdateHealth";
import DrugOnce from "./Components/LoginSignUp/DrugOnce";
import MainViewDoc from "./Components/LoginSignUp/MainViewDoc";
import Doctors from "./Components/LoginSignUp/Doctors";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseConfig";

function App() {
    const [user] = useAuthState(auth);

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        !user ? (
                            <LoginSignup />
                        ) : user.email.includes("@lekarz.pl") ? (
                            <Navigate to="/mainviewdoc" />
                        ) : (
                            <Navigate to="/mainview" />
                        )
                    }
                />

                {user ? (
                    <>
                        <Route path="/mainview" element={<MainView />} />
                        <Route path="/newdrug" element={<NewDrug />} />
                        <Route path="/mydrugs" element={<MyDrugs />} />
                        <Route path="/health" element={<Health />} />
                        <Route path="/updatehealth" element={<UpdateHealth />} />
                        <Route path="/drugonce" element={<DrugOnce />} />
                        <Route path="/mainviewdoc" element={<MainViewDoc />} />
                        <Route path="/doctors" element={<Doctors />} />
                    </>
                ) : null}
            </Routes>
        </Router>
    );
}

export default App;
