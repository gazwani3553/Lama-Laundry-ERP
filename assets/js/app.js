import { db } from "../../firebase/firebase-config.js";

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
const form = document.getElementById("orderForm");

const serviceSelect = document.getElementById("service");

async function loadServices() {

    if (!serviceSelect) return;

    serviceSelect.innerHTML =
        '<option value="">اختر الخدمة</option>';

 let snapshot;

try {
    snapshot = await getDocs(collection(db, "services"));
} catch (err) {
    console.error("خطأ في تحميل الخدمات:", err);
    return;
}

    snapshot.forEach((doc) => {

        const service = doc.data();

        const option = document.createElement("option");

        option.value = service.name;

        option.textContent =
            `${service.name} - ${service.price} ريال`;

        option.dataset.price = service.price;

        serviceSelect.appendChild(option);

    });

}

loadServices();
if (form) {

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

  const orderNumber = "LM" + Date.now();
const selectedOption =
serviceSelect.options[serviceSelect.selectedIndex];
const servicePrice = Number(selectedOption?.dataset?.price || 0);
await addDoc(collection(db, "orders"), {

  orderNumber,

  customerName: document.getElementById("name").value.trim(),

  customerPhone: document.getElementById("phone").value.trim(),

  address: document.getElementById("address").value.trim(),

  serviceType: serviceSelect.value,

  pieces: 1,

  totalAmount: servicePrice,

  date: document.getElementById("date").value,

  time: document.getElementById("time").value,

  notes: document.getElementById("notes").value.trim(),

  status: "طلب جديد",

  createdDate: new Date().toLocaleDateString("ar-SA"),

  createdAt: serverTimestamp()

});

  alert(
"تم إرسال الطلب بنجاح\n\nرقم الطلب:\n" + orderNumber
);

      form.reset();
document.getElementById("name").focus();

    } catch (err) {

      console.error(err);

      alert("حدث خطأ أثناء حفظ الطلب");

    }

  });

}