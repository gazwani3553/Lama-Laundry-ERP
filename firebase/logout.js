// firebase/logout.js

import { auth } from "./firebase-config.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        if (!confirm("هل تريد تسجيل الخروج؟")) return;

        try {

            await signOut(auth);

            window.location.replace("login.html");

        } catch (err) {

            console.error(err);

            alert("تعذر تسجيل الخروج.");

        }

    });

}