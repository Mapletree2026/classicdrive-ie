import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Directory from "@/pages/Directory";

function App() {
    return (
        <div className="App bg-grain">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Directory />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
