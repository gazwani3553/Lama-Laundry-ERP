// ===========================================
// Lama Laundry ERP v1.0
// customers.js
// الجزء الأول
// ===========================================
import { db } from "../../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
// ===========================================
// عناصر الصفحة
// ===========================================

const tableBody = document.getElementById("customersTableBody");
const form = document.getElementById("customerForm");
const modal = document.getElementById("customerModal");

const newBtn = document.getElementById("newCustomerBtn");
const closeBtn = document.getElementById("closeCustomerModal");
const cancelBtn = document.getElementById("cancelCustomerBtn");

const searchInput = document.getElementById("searchCustomer");
const refreshBtn = document.getElementById("refreshCustomers");

const customers = [];

let unsubscribe = null;

let editId = null;

// تحديث إحصائيات العميل
// ===========================================

async function updateCustomerStatistics(customerId) {

    if (!customerId) return;

    try {

        const ordersQuery = query(
            collection(db, "orders"),
            where("customerId", "==", customerId)
        );

        const snapshot = await getDocs(ordersQuery);

        let ordersCount = 0;
        let totalSpent = 0;
        let lastVisit = "-";

        snapshot.forEach(docSnap => {

            const order = docSnap.data();

            ordersCount++;

            totalSpent += Number(order.totalAmount || 0);

            if (order.createdDate) {

                lastVisit = order.createdDate;

            }

        });

        await updateDoc(

            doc(db, "customers", customerId),

            {

                ordersCount,

                totalSpent,

                lastVisit

            }

        );

    }

    catch (error) {

        console.error(
            "Customer Statistics Error:",
            error
        );

    }

}
// ===========================================
// فتح وإغلاق النافذة
// ===========================================

if (newBtn && modal && form) {

    newBtn.onclick = () => {

        editId = null;

        form.reset();

        const title = document.getElementById("customerModalTitle");

        if (title) {

            title.textContent = "عميل جديد";

        }

        modal.classList.remove("hidden");

    };

}

if (closeBtn && modal) {

    closeBtn.onclick = () => {

        modal.classList.add("hidden");

    };

}

if (cancelBtn && modal) {

    cancelBtn.onclick = () => {

        modal.classList.add("hidden");

    };

}

// ===========================================
// تحميل العملاء
// ===========================================
async function loadCustomers() {

    try {

        if (!tableBody) return;

        if (unsubscribe) {

            unsubscribe();

        }

        const q = query(

            collection(db, "customers"),

            orderBy("createdAt", "desc")

        );

        unsubscribe = onSnapshot(

            q,

            (snapshot) => {

                customers.length = 0;

                snapshot.forEach(docSnap => {

                    customers.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                });

                renderTable();

                updateCards();

            },

            (error) => {

                console.error(

                    "Realtime Error:",

                    error

                );

            }

        );

    }

    catch (error) {

        console.error(

            "Load Customers Error:",

            error

        );

    }

}

// ===========================================
// رسم جدول العملاء
// ===========================================

function renderTable(list = customers) {

    if (!tableBody) return;

    tableBody.innerHTML = "";

    list.forEach((customer, index) => {

        tableBody.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>${customer.name || "-"}</td>

<td>${customer.phone || "-"}</td>

<td>${customer.address || "-"}</td>

<td>${customer.ordersCount || 0}</td>

<td>${Number(customer.totalSpent || 0).toFixed(2)} ر.س</td>

<td>${customer.lastVisit || "-"}</td>

<td>

<div class="action-buttons">

<button
class="edit-btn"
data-id="${customer.id}"
title="تعديل">

<i class="fas fa-pen"></i>

</button>

<button
class="orders-btn"
data-id="${customer.id}"
title="طلبات العميل">

<i class="fas fa-basket-shopping"></i>

</button>

<button
class="delete-btn"
data-id="${customer.id}"
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
// تحديث الإحصائيات
// ===========================================

function updateCards() {

    const customersCount = document.getElementById("customersCount");
    const vipCustomers = document.getElementById("vipCustomers");
    const todayCustomers = document.getElementById("todayCustomers");

    if (customersCount) {

        customersCount.textContent = customers.length;

    }

    if (vipCustomers) {

        vipCustomers.textContent = customers.filter(customer =>

            Number(customer.totalSpent || 0) >= 1000

        ).length;

    }

    if (todayCustomers) {

        const today = new Date().toLocaleDateString("ar-SA");

        todayCustomers.textContent = customers.filter(customer =>

            customer.createdDate === today

        ).length;

    }

}

// ===========================================
// ربط الأزرار
// ===========================================

function bindButtons() {

    document.querySelectorAll(".edit-btn").forEach(btn => {

        btn.onclick = () => editCustomer(btn.dataset.id);

    });

    document.querySelectorAll(".delete-btn").forEach(btn => {

        btn.onclick = () => removeCustomer(btn.dataset.id);

    });

    document.querySelectorAll(".orders-btn").forEach(btn => {

        btn.onclick = () => {

            window.location.href =
                `orders.html?customer=${btn.dataset.id}`;

        };

    });

}

function phoneExists(phone, currentId = "") {

    return customers.some(customer =>

        customer.id !== currentId &&

        (customer.phone || "").trim() === phone.trim()

    );

}

// ===========================================
// حفظ عميل (إضافة / تعديل)
// ===========================================

if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

console.log("وصل إلى الحفظ");

        const data = {

            name: document.getElementById("customerName").value.trim(),

            phone: document.getElementById("customerPhone").value.trim(),

            address: document.getElementById("customerAddress").value.trim(),

            notes: document.getElementById("customerNotes").value.trim(),

            lastVisit: new Date().toLocaleDateString("ar-SA"),

            createdDate: new Date().toLocaleDateString("ar-SA")

        };

        if (!editId) {

            data.ordersCount = 0;

            data.totalSpent = 0;

            data.createdAt = serverTimestamp();

        }
if (!data.name) {

    alert("يرجى إدخال اسم العميل");

    return;

}

if (!data.phone) {

    alert("يرجى إدخال رقم الجوال");

    return;

}

if (phoneExists(data.phone, editId)) {

    alert("رقم الجوال مسجل مسبقًا");

    return;

}
        try {

            if (editId) {

                await updateDoc(

                    doc(db, "customers", editId),

                    data

                );

            } else {

console.log("Saving...", data);

                await addDoc(

                    collection(db, "customers"),

                    data

                );

console.log("تم الحفظ");
            }

            if (modal) {

                modal.classList.add("hidden");

            }

          form.reset();

editId = null;

        } catch (error) {

            console.error("Save Customer Error:", error);

            alert("حدث خطأ أثناء حفظ العميل.");

        }

    });

}
// ===========================================
// تعديل عميل
// ===========================================

function editCustomer(id) {

    const customer = customers.find(c => c.id === id);

    if (!customer) return;

    editId = id;

    const title = document.getElementById("customerModalTitle");

    if (title) {

        title.textContent = "تعديل العميل";

    }

    document.getElementById("customerName").value =
        customer.name || "";

    document.getElementById("customerPhone").value =
        customer.phone || "";

    document.getElementById("customerAddress").value =
        customer.address || "";

    document.getElementById("customerNotes").value =
        customer.notes || "";

    if (modal) {

        modal.classList.remove("hidden");

    }

}

// ===========================================
// حذف عميل
// ===========================================

async function removeCustomer(id) {

    if (!confirm("هل تريد حذف هذا العميل؟")) return;

    try {

        await deleteDoc(

            doc(db, "customers", id)

        );

        await loadCustomers();

    } catch (error) {

        console.error("Delete Customer Error:", error);

        alert("تعذر حذف العميل.");

    }

}

// ===========================================
// البحث
// ===========================================

function filterCustomers() {

    const keyword = (searchInput?.value || "")
        .trim()
        .toLowerCase();

    const filtered = customers.filter(customer => {

        return (

            (customer.name || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (customer.phone || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (customer.address || "")
                .toLowerCase()
                .includes(keyword)

        );

    });

    renderTable(filtered);

}

if (searchInput) {

    searchInput.addEventListener(

        "input",

        filterCustomers

    );

}

// ===========================================
// تحديث البيانات
// ===========================================

if (refreshBtn) {

    refreshBtn.addEventListener(

        "click",

        loadCustomers

    );

}

// ===========================================
// بدء التشغيل
// ===========================================

document.addEventListener("DOMContentLoaded", () => {

    loadCustomers();

});