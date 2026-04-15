import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.jsx";
import { seedDefaultUsers } from "./features/auth/store/authStore";
import "./index.css";

seedDefaultUsers().then(() => {
    createRoot(document.getElementById("root")).render(
        <StrictMode>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </StrictMode>,
    );
});
