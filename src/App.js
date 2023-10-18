import logo from './logo.svg';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginSignup from "./Components/LoginSignUp/LoginSignup";
import MainView from "./Components/LoginSignUp/MainView";
import NewDrug from "./Components/LoginSignUp/NewDrug";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginSignup />} />
                <Route path="/mainview" element={<MainView />} />
                <Route path="/newdrug" element={<NewDrug />} />
            </Routes>
        </Router>
    );
}

export default App;
