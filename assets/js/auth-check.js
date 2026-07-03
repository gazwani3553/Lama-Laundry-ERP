import { auth } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

    if (!user) {

      window.location.replace("../login/login.html");

        return;

    }

    window.currentUser = user;

});