import { auth } from "../../firebase/firebase-config.js";

import {
    signInWithEmailAndPassword,
    browserLocalPersistence,
    setPersistence
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

window.login = async () => {

    const btn = document.getElementById("loginBtn");
    const msg = document.getElementById("loginMessage");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (msg) {
        msg.textContent = "";
    }

    if (!email || !password) {

        if (msg) {
            msg.textContent = "يرجى إدخال البريد الإلكتروني وكلمة المرور";
            msg.style.color = "red";
        } else {
            alert("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        }

        return;
    }

    try {

        btn.disabled = true;
        btn.textContent = "جاري تسجيل الدخول...";

        await setPersistence(auth, browserLocalPersistence);

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        window.location.replace("dashboard.html");

    } catch (error) {

        console.error(error);

        if (msg) {
            msg.textContent = "بيانات الدخول غير صحيحة";
            msg.style.color = "red";
        } else {
            alert("بيانات الدخول غير صحيحة");
        }

    } finally {

        btn.disabled = false;
        btn.textContent = "دخول";

    }

};