// ===========================================
// Lama Laundry ERP v1.0
// login.js
// ===========================================

import { auth } from "../firebase/firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// ===========================================
// عناصر الصفحة
// ===========================================

const form = document.getElementById("loginForm");

const email = document.getElementById("email");

const password = document.getElementById("password");

const message = document.getElementById("loginMessage");

// ===========================================
// إذا كان المستخدم مسجل دخول مسبقاً
// ===========================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        window.location.href = "../dashboard/index.html";

    }

});

// ===========================================
// تسجيل الدخول
// ===========================================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.style.color = "#1976d2";
    message.textContent = "جاري تسجيل الدخول...";

    try {

        await signInWithEmailAndPassword(

            auth,

            email.value.trim(),

            password.value

        );

        message.style.color = "#2e7d32";
        message.textContent = "تم تسجيل الدخول بنجاح";

        setTimeout(() => {

            window.location.href = "../dashboard/index.html";

        }, 700);

    } catch (error) {

        console.error(error);

        message.style.color = "#d32f2f";

        switch (error.code) {

            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                message.textContent = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
                break;

            case "auth/invalid-email":
                message.textContent = "صيغة البريد الإلكتروني غير صحيحة.";
                break;

            case "auth/too-many-requests":
                message.textContent = "تم إيقاف المحاولات مؤقتًا، حاول لاحقًا.";
                break;

            default:
                message.textContent = "حدث خطأ أثناء تسجيل الدخول.";

        }

    }

});