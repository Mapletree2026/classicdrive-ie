import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Directory from "@/pages/Directory";
import CarDetail from "@/pages/CarDetail";
import AuthVerify from "@/pages/AuthVerify";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function App() {
    return (
        <div className="App bg-paper">
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Directory />} />
                        <Route path="/car/:carId" element={<CarDetail />} />
                        <Route path="/auth/verify" element={<AuthVerify />} />
                    </Routes>
                </BrowserRouter>
                <Toaster theme="dark" />
            </AuthProvider>
        </div>
    );
}

export default App;
