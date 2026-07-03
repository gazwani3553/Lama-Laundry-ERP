// ===========================================
// Lama Laundry ERP v2 Professional
// delivery.js
// ===========================================

import { db } from "../../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ===========================================
// عناصر الصفحة
// ===========================================

const tableBody = document.getElementById("deliveryTableBody");

const form = document.getElementById("deliveryForm");

const modal = document.getElementById("deliveryModal");

const newBtn = document.getElementById("newDeliveryBtn");

const closeBtn = document.getElementById("closeDeliveryModal");

const cancelBtn = document.getElementById("cancelDeliveryBtn");

const refreshBtn = document.getElementById("refreshDelivery");

const searchInput = document.getElementById("searchDelivery");

const statusFilter = document.getElementById("deliveryFilter");

// بطاقات الإحصائيات
const deliveryCountCard = document.getElementById("deliveryCount");

const waitingDeliveryCard = document.getElementById("waitingDelivery");

const completedDeliveryCard = document.getElementById("completedDelivery");

// المصفوفة الرئيسية
const deliveries = [];

let editId = null;

let currentFilter = "";

let currentKeyword = "";

// ===========================================
// فتح وإغلاق النافذة
// ===========================================

if (newBtn) {

    newBtn.onclick = () => {

        editId = null;

        form.reset();

        document.getElementById("deliveryModalTitle").textContent =
            "إضافة عملية توصيل";

        document.getElementById("deliveryStatus").value =
            "بانتظار التوصيل";

        modal.classList.remove("hidden");

    };

}

if (closeBtn) {

    closeBtn.onclick = () => {

        modal.classList.add("hidden");

    };

}

if (cancelBtn) {

    cancelBtn.onclick = () => {

        modal.classList.add("hidden");

    };

}

// ===========================================
// تحميل بيانات التوصيل
// ===========================================

async function loadDeliveries() {

    try {

        deliveries.length = 0;

        tableBody.innerHTML = "";

        const q = query(
            collection(db, "deliveries"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((docSnap) => {

            deliveries.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        applyFilters();

        updateCards();

    } catch (error) {

        console.error(error);

        alert("تعذر تحميل بيانات التوصيل.");

    }

}

// ===========================================
// تطبيق البحث والفلترة
// ===========================================

function applyFilters() {

    let list = [...deliveries];

    if (currentFilter) {

        list = list.filter(item => item.status === currentFilter);

    }

    if (currentKeyword) {

        const keyword = currentKeyword.toLowerCase();

        list = list.filter(item => {

            return (

                (item.orderNumber || "").toLowerCase().includes(keyword) ||

                (item.customerName || "").toLowerCase().includes(keyword) ||

                (item.phone || "").toLowerCase().includes(keyword) ||

                (item.address || "").toLowerCase().includes(keyword) ||

                (item.driver || "").toLowerCase().includes(keyword)

            );

        });

    }

    renderTable(list);

}

// ===========================================
// رسم الجدول
// ===========================================

function renderTable(list = deliveries) {

    tableBody.innerHTML = "";

    if (list.length === 0) {

        tableBody.innerHTML = `

<tr>

<td colspan="8" class="text-center">

لا توجد عمليات توصيل.

</td>

</tr>

`;

        return;

    }

    list.forEach(item => {

        let statusClass = "status-waiting";

        switch (item.status) {

            case "خرج للتوصيل":

                statusClass = "status-route";

                break;

            case "تم التسليم":

                statusClass = "status-completed";

                break;

            default:

                statusClass = "status-waiting";

        }

        tableBody.innerHTML += `

<tr>

<td>${item.orderNumber || "-"}</td>

<td>${item.customerName || "-"}</td>

<td>${item.phone || "-"}</td>

<td>${item.address || "-"}</td>

<td>${item.driver || "-"}</td>

<td>${item.deliveryDateTime || "-"}</td>

<td>

<span class="delivery-status ${statusClass}">

${item.status}

</span>

</td>

<td>

<div class="action-buttons">

<button
class="edit-btn"
data-id="${item.id}"
title="تعديل">

<i class="fas fa-pen"></i>

</button>

<button
class="map-btn"
data-id="${item.id}"
title="الموقع">

<i class="fas fa-location-dot"></i>

</button>

<button
class="done-btn"
data-id="${item.id}"
title="تم التسليم">

<i class="fas fa-check"></i>

</button>

<button
class="delete-btn"
data-id="${item.id}"
title="حذف">

<i class="fas fa-trash"></i>

</button>

</div>

</td>

</tr>

`;

    });

    bindButtons();

}

// ===========================================
// تحديث بطاقات الإحصائيات
// ===========================================

function updateCards() {

    deliveryCountCard.textContent = deliveries.length;

    waitingDeliveryCard.textContent =

        deliveries.filter(d =>

            d.status === "بانتظار التوصيل"

        ).length;

    completedDeliveryCard.textContent =

        deliveries.filter(d =>

            d.status === "تم التسليم"

        ).length;

}

// ===========================================
// ربط أزرار الجدول
// ===========================================

function bindButtons() {

    document.querySelectorAll(".edit-btn").forEach(btn => {

        btn.onclick = () => editDelivery(btn.dataset.id);

    });

    document.querySelectorAll(".delete-btn").forEach(btn => {

        btn.onclick = () => removeDelivery(btn.dataset.id);

    });

    document.querySelectorAll(".done-btn").forEach(btn => {

        btn.onclick = () => completeDelivery(btn.dataset.id);

    });

    document.querySelectorAll(".map-btn").forEach(btn => {

        btn.onclick = () => openLocation(btn.dataset.id);

    });

}

// ===========================================
// حفظ عملية التوصيل
// ===========================================

if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const data = {

            orderNumber:
                document.getElementById("deliveryOrderNumber").value.trim(),

            customerName:
                document.getElementById("deliveryCustomerName").value.trim(),

            phone:
                document.getElementById("deliveryPhone").value.trim(),

            address:
                document.getElementById("deliveryAddress").value.trim(),

            driver:
                document.getElementById("deliveryDriver").value.trim(),

            deliveryDateTime:
                document.getElementById("deliveryDateTime").value,

            status:
                document.getElementById("deliveryStatus").value,

            notes:
                document.getElementById("deliveryNotes").value.trim(),

            updatedAt: serverTimestamp()

        };

        if (!editId) {

            data.createdAt = serverTimestamp();

            data.createdDate = new Date().toLocaleDateString("ar-SA");

        }

        try {

            if (editId) {

                await updateDoc(
                    doc(db, "deliveries", editId),
                    data
                );

            } else {

                await addDoc(
                    collection(db, "deliveries"),
                    data
                );

            }

            modal.classList.add("hidden");

            form.reset();

            editId = null;

            await loadDeliveries();

        } catch (error) {

            console.error(error);

            alert("حدث خطأ أثناء حفظ عملية التوصيل.");

        }

    });

}

// ===========================================
// تعديل عملية التوصيل
// ===========================================

function editDelivery(id) {

    const item = deliveries.find(d => d.id === id);

    if (!item) return;

    editId = id;

    document.getElementById("deliveryModalTitle").textContent =
        "تعديل عملية التوصيل";

    document.getElementById("deliveryOrderNumber").value =
        item.orderNumber || "";

    document.getElementById("deliveryCustomerName").value =
        item.customerName || "";

    document.getElementById("deliveryPhone").value =
        item.phone || "";

    document.getElementById("deliveryAddress").value =
        item.address || "";

    document.getElementById("deliveryDriver").value =
        item.driver || "";

    document.getElementById("deliveryDateTime").value =
        item.deliveryDateTime || "";

    document.getElementById("deliveryStatus").value =
        item.status || "بانتظار التوصيل";

    document.getElementById("deliveryNotes").value =
        item.notes || "";

    modal.classList.remove("hidden");

}

// ===========================================
// حذف عملية توصيل
// ===========================================

async function removeDelivery(id) {

    if (!confirm("هل تريد حذف عملية التوصيل؟"))
        return;

    try {

        await deleteDoc(
            doc(db, "deliveries", id)
        );

        await loadDeliveries();

    } catch (error) {

        console.error(error);

        alert("تعذر حذف عملية التوصيل.");

    }

}

// ===========================================
// إنهاء عملية التوصيل
// ===========================================

async function completeDelivery(id) {

    try {

        await updateDoc(
            doc(db, "deliveries", id),
            {
                status: "تم التسليم",
                updatedAt: serverTimestamp()
            }
        );

        await loadDeliveries();

    } catch (error) {

        console.error(error);

        alert("تعذر تحديث حالة التوصيل.");

    }

}

// ===========================================
// فتح الموقع في خرائط Google
// ===========================================

function openLocation(id) {

    const item = deliveries.find(d => d.id === id);

    if (!item) return;

    if (!item.address) {

        alert("لا يوجد عنوان للعميل.");

        return;

    }

    window.open(

        "https://www.google.com/maps/search/?api=1&query=" +

        encodeURIComponent(item.address),

        "_blank"

    );

}

// ===========================================
// البحث
// ===========================================

if (searchInput) {

    searchInput.addEventListener("input", () => {

        currentKeyword = searchInput.value.trim();

        applyFilters();

    });

}

// ===========================================
// الفلترة
// ===========================================

if (statusFilter) {

    statusFilter.addEventListener("change", () => {

        currentFilter = statusFilter.value;

        applyFilters();

    });

}

// ===========================================
// تحديث البيانات
// ===========================================

if (refreshBtn) {

    refreshBtn.addEventListener("click", async () => {

        refreshBtn.disabled = true;

        refreshBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i>';

        await loadDeliveries();

        refreshBtn.disabled = false;

        refreshBtn.innerHTML =
            '<i class="fas fa-rotate"></i>';

    });

}

// ===========================================
// إغلاق النافذة عند الضغط خارجها
// ===========================================

window.addEventListener("click", (e) => {

    if (e.target === modal) {

        modal.classList.add("hidden");

    }

});

// ===========================================
// تشغيل الصفحة
// ===========================================

document.addEventListener("DOMContentLoaded", () => {

    loadDeliveries();

});

