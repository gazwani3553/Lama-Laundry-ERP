// ===========================================
// Lama Laundry ERP v2.1 Professional
// pickup.js
// الجزء الأول
// ===========================================

import { db } from "../../firebase/firebase-config.js";

import {

    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc

} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ===========================================
// عناصر الصفحة
// ===========================================

const tableBody =
document.getElementById("pickupTableBody");

const searchInput =
document.getElementById("searchPickup");

const statusFilter =
document.getElementById("pickupFilter");

const refreshBtn =
document.getElementById("refreshPickup");

// ===========================================
// البيانات
// ===========================================

const pickups = [];

let unsubscribe = null;

// ===========================================
// تحميل الطلبات
// ===========================================

function loadPickups() {

    if (unsubscribe) {

        unsubscribe();

    }

    const q = query(

        collection(db, "orders"),

        orderBy("createdAt", "desc")

    );

    unsubscribe = onSnapshot(

        q,

        (snapshot) => {

            pickups.length = 0;

            snapshot.forEach(docSnap => {

                const order = {

                    id: docSnap.id,

                    ...docSnap.data()

                };

                // فقط الطلبات التي تحتاج استلام

                if (

                    order.status === "طلب جديد"

                    ||

                    order.status === "بانتظار الاستلام"

                    ||

                    order.status === "في الطريق"

                ) {

                    pickups.push(order);

                }

            });

            renderTable();

            updateCards();

        },

        (error) => {

            console.error(

                "Pickup Realtime:",

                error

            );

        }

    );

}

// ===========================================
// رسم جدول الاستلام
// ===========================================

function renderTable(list = pickups) {

    if (!tableBody) return;

    tableBody.innerHTML = "";

    list.forEach(order => {

        let statusClass = "status-waiting";

        switch (order.status) {

            case "في الطريق":

                statusClass = "status-route";

                break;

            case "بانتظار الاستلام":

                statusClass = "status-waiting";

                break;

            case "طلب جديد":

                statusClass = "status-new";

                break;

            default:

                statusClass = "status-waiting";

                break;

        }

        tableBody.innerHTML += `

<tr>

<td>${order.orderNumber || "-"}</td>

<td>${order.customerName || "-"}</td>

<td>${order.customerPhone || "-"}</td>

<td>${order.address || "-"}</td>

<td>${order.serviceType || "-"}</td>

<td>${order.pickupDate || "-"}</td>

<td>

<span class="pickup-status ${statusClass}">

${order.status || "-"}

</span>

</td>

<td>

<div class="action-buttons">

<button
class="route-btn"
data-id="${order.id}"
title="في الطريق">

<i class="fas fa-truck"></i>

</button>

<button
class="done-btn"
data-id="${order.id}"
title="تم الاستلام">

<i class="fas fa-check"></i>

</button>

<button
class="map-btn"
data-id="${order.id}"
title="فتح الموقع">

<i class="fas fa-location-dot"></i>

</button>

</div>

</td>

</tr>

`;

    });

    bindButtons();

}

// ===========================================
// تحديث البطاقات
// ===========================================

function updateCards() {

    const pickupCount =
    document.getElementById("pickupCount");

    const waitingPickup =
    document.getElementById("waitingPickup");

    const completedPickup =
    document.getElementById("completedPickup");

    if (pickupCount) {

        pickupCount.textContent = pickups.length;

    }

    if (waitingPickup) {

        waitingPickup.textContent = pickups.filter(

            order =>

                order.status === "طلب جديد"

                ||

                order.status === "بانتظار الاستلام"

        ).length;

    }

    if (completedPickup) {

        completedPickup.textContent = pickups.filter(

            order =>

                order.pickupCompleted === true

        ).length;

    }

}

// ===========================================
// ربط الأزرار
// ===========================================

function bindButtons() {

    document.querySelectorAll(".route-btn").forEach(btn => {

        btn.onclick = () => startPickup(btn.dataset.id);

    });

    document.querySelectorAll(".done-btn").forEach(btn => {

        btn.onclick = () => completePickup(btn.dataset.id);

    });

    document.querySelectorAll(".map-btn").forEach(btn => {

        btn.onclick = () => openLocation(btn.dataset.id);

    });

}

// ===========================================
// في الطريق
// ===========================================

async function startPickup(id) {

    try {

        await updateDoc(

            doc(db, "orders", id),

            {

                status: "في الطريق",

                pickupStarted: true,

                pickupStartedAt: new Date().toLocaleString("ar-SA")

            }

        );

    }

    catch (error) {

        console.error(

            "Start Pickup Error:",

            error

        );

        alert("تعذر تحديث حالة الطلب.");

    }

}

// ===========================================
// تم الاستلام
// ===========================================

async function completePickup(id) {

    try {

        await updateDoc(

            doc(db, "orders", id),

            {

                status: "قيد الغسيل",

                pickupCompleted: true,

                pickupCompletedAt: new Date().toLocaleString("ar-SA")

            }

        );

    }

    catch (error) {

        console.error(

            "Complete Pickup Error:",

            error

        );

        alert("تعذر تحديث حالة الطلب.");

    }

}

// ===========================================
// فتح الموقع
// ===========================================

function openLocation(id) {

    const order = pickups.find(

        item => item.id === id

    );

    if (!order) return;

    if (!order.address) {

        alert("لا يوجد عنوان للعميل.");

        return;

    }

    window.open(

        "https://www.google.com/maps/search/?api=1&query=" +

        encodeURIComponent(order.address),

        "_blank"

    );

}

// ===========================================
// البحث + الفلترة
// ===========================================

function filterPickups() {

    const keyword = (searchInput?.value || "")
        .trim()
        .toLowerCase();

    const status = statusFilter?.value || "";

    const filtered = pickups.filter(order => {

        const matchKeyword =

            (order.orderNumber || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (order.customerName || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (order.customerPhone || "")
                .toLowerCase()
                .includes(keyword);

        const matchStatus =

            status === ""

            ||

            order.status === status;

        return matchKeyword && matchStatus;

    });

    renderTable(filtered);

}

if (searchInput) {

    searchInput.addEventListener(

        "input",

        filterPickups

    );

}

if (statusFilter) {

    statusFilter.addEventListener(

        "change",

        filterPickups

    );

}

// ===========================================
// تحديث البيانات
// ===========================================

if (refreshBtn) {

    refreshBtn.addEventListener(

        "click",

        loadPickups

    );

}

// ===========================================
// بدء التشغيل
// ===========================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        loadPickups();

    }

);

// ===========================================
// تنظيف الموارد
// ===========================================

window.addEventListener(

    "beforeunload",

    () => {

        if (unsubscribe) {

            unsubscribe();

        }

    }

);
