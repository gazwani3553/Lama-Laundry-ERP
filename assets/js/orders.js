// ===========================================
// Lama Laundry ERP v2.1 Professional
// orders.js
// Part 1
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

const tableBody = document.getElementById("ordersTableBody");
const orderForm = document.getElementById("orderForm");
const modal = document.getElementById("orderModal");

const newOrderBtn = document.getElementById("newOrderBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const refreshBtn = document.getElementById("refreshOrders");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

// حقول النموذج

const customerSelect = document.getElementById("customerName");
const phoneInput = document.getElementById("customerPhone");

const serviceSelect = document.getElementById("serviceType");
const unitPriceInput = document.getElementById("unitPrice");

const piecesInput = document.getElementById("pieces");
const totalAmountInput = document.getElementById("totalAmount");

const orderNumberInput = document.getElementById("orderNumber");
const statusInput = document.getElementById("orderStatus");
const notesInput = document.getElementById("notes");

// بطاقات الإحصائيات

const totalOrdersCard = document.getElementById("totalOrders");
const newOrdersCard = document.getElementById("newOrders");
const readyOrdersCard = document.getElementById("readyOrders");
const deliveredOrdersCard = document.getElementById("deliveredOrders");

// ===========================================
// البيانات
// ===========================================

let orders = [];
let customers = [];
let services = [];

let unsubscribe = null;
let editId = null;

// ===========================================
// إنشاء رقم الطلب
// ===========================================

function generateOrderNumber() {
    return "LM" + Date.now();
}

// ===========================================
// إنشاء فاتورة تلقائياً
// ===========================================

function generateInvoiceNumber() {
    return "INV" + Date.now();
}

async function createInvoice(order) {

    const invoice = {

        invoiceNumber: generateInvoiceNumber(),

        orderId: order.id || "",

        orderNumber: order.orderNumber,

        customerId: order.customerId,

        customerName: order.customerName,

        customerPhone: order.customerPhone,

        serviceId: order.serviceId,

        serviceType: order.serviceType,

        pieces: order.pieces,

        total: order.totalAmount,

        paymentMethod: "نقداً",

        paymentStatus: "غير مدفوعة",

        notes: order.notes || "",

        createdDate: new Date().toLocaleDateString("ar-SA"),

        createdAt: serverTimestamp()

    };

    await addDoc(
        collection(db, "invoices"),
        invoice
    );

}
// ===========================================
// فتح النافذة
// ===========================================

function openModal() {

    if (!modal) return;

    modal.classList.remove("hidden");

    if (!editId) {

        orderForm.reset();

        orderNumberInput.value = generateOrderNumber();

        totalAmountInput.value = "0.00";

        statusInput.value = "طلب جديد";
    }
}

// ===========================================
// إغلاق النافذة
// ===========================================

function closeOrderModal() {

    if (!modal) return;

    modal.classList.add("hidden");

    editId = null;

    orderForm.reset();
}

// ===========================================
// تحميل العملاء
// ===========================================

async function loadCustomers() {

    customers = [];

    const snapshot = await getDocs(
        collection(db, "customers")
    );

    snapshot.forEach(docSnap => {

        customers.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    customerSelect.innerHTML = `
        <option value="">
            اختر العميل
        </option>
    `;

    customers.forEach(customer => {

        customerSelect.innerHTML += `
            <option value="${customer.id}">
                ${customer.name}
            </option>
        `;

    });

}

// ===========================================
// تحميل الخدمات
// ===========================================

async function loadServices() {

    services = [];

    const snapshot = await getDocs(
        collection(db, "services")
    );

    snapshot.forEach(docSnap => {

        services.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    serviceSelect.innerHTML = `
        <option value="">
            اختر الخدمة
        </option>
    `;

    services
        .filter(service => service.active !== false)
        .forEach(service => {

            serviceSelect.innerHTML += `
                <option value="${service.id}">
                    ${service.name}
                </option>
            `;

        });

}

// ===========================================
// اختيار العميل
// ===========================================

customerSelect?.addEventListener("change", () => {

    const customer = customers.find(
        c => c.id === customerSelect.value
    );

    if (!customer) return;

    phoneInput.value = customer.phone || "";

});

// ===========================================
// اختيار الخدمة
// ===========================================

serviceSelect?.addEventListener("change", () => {

    const service = services.find(
        s => s.id === serviceSelect.value
    );

    if (!service) return;

    unitPriceInput.value =
        Number(service.price || 0).toFixed(2);

    calculateTotal();

});

// ===========================================
// حساب الإجمالي
// ===========================================

piecesInput?.addEventListener(
    "input",
    calculateTotal
);

unitPriceInput?.addEventListener(
    "input",
    calculateTotal
);

function calculateTotal() {

    const price =
        Number(unitPriceInput.value || 0);

    const pieces =
        Number(piecesInput.value || 0);

    totalAmountInput.value =
        (price * pieces).toFixed(2);

}

// ===========================================
// تحميل الطلبات (Realtime)
// ===========================================

async function loadOrders() {

    try {

        if (!tableBody) return;

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

                orders = [];

                snapshot.forEach((docSnap) => {

                    const data = docSnap.data();

                    orders.push({
                        id: docSnap.id,
                        ...data,

                        customerName:
                            data.customerName ??
                            data.name ??
                            "",

                        customerPhone:
                            data.customerPhone ??
                            data.phone ??
                            "",

                        serviceType:
                            data.serviceType ??
                            data.service ??
                            "",

                        pieces: Number(
                            data.pieces ??
                            data.items ??
                            1
                        ),

                        unitPrice: Number(
                            data.unitPrice ??
                            0
                        ),

                        totalAmount: Number(
                            data.totalAmount ??
                            data.total ??
                            data.price ??
                            0
                        ),

                        status:
                            data.status ??
                            "طلب جديد",

                        createdDate:
                            data.createdDate ??
                            "-"

                    });

                });

                renderTable();

                updateCards();

            },
            (error) => {

                console.error(
                    "Realtime Orders Error:",
                    error
                );

            }
        );

    } catch (error) {

        console.error(
            "Load Orders Error:",
            error
        );

    }

}

// ===========================================
// رسم الجدول
// ===========================================

function renderTable(list = orders) {

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;padding:25px;">
                    لا توجد طلبات
                </td>
            </tr>
        `;

        return;
    }

    list.forEach((order) => {

        let statusClass = "status-new";

        switch (order.status) {

            case "قيد الغسيل":
                statusClass = "status-wash";
                break;

            case "قيد الكي":
                statusClass = "status-iron";
                break;

            case "جاهز":
                statusClass = "status-ready";
                break;

            case "تم التسليم":
                statusClass = "status-delivered";
                break;

            case "ملغي":
                statusClass = "status-cancel";
                break;
        }

        tableBody.innerHTML += `

<tr>

<td>${order.orderNumber || "-"}</td>

<td>${order.customerName}</td>

<td>${order.customerPhone}</td>

<td>${order.serviceType}</td>

<td>${order.pieces}</td>

<td>${Number(order.totalAmount).toFixed(2)} ر.س</td>

<td>

<span class="${statusClass}">
${order.status}
</span>

</td>

<td>${order.createdDate}</td>

<td>

<div class="action-buttons">

<button
class="edit-btn"
data-id="${order.id}"
title="تعديل">

<i class="fas fa-edit"></i>

</button>

<button
class="print-btn"
data-id="${order.id}"
title="طباعة">

<i class="fas fa-print"></i>

</button>

<button
class="delete-btn"
data-id="${order.id}"
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

    if (totalOrdersCard)
        totalOrdersCard.textContent = orders.length;

    if (newOrdersCard)
        newOrdersCard.textContent =
            orders.filter(
                o => o.status === "طلب جديد"
            ).length;

    if (readyOrdersCard)
        readyOrdersCard.textContent =
            orders.filter(
                o => o.status === "جاهز"
            ).length;

    if (deliveredOrdersCard)
        deliveredOrdersCard.textContent =
            orders.filter(
                o => o.status === "تم التسليم"
            ).length;

}

// ===========================================
// البحث
// ===========================================

searchInput?.addEventListener(
    "input",
    filterOrders
);

// ===========================================
// الفلترة
// ===========================================

statusFilter?.addEventListener(
    "change",
    filterOrders
);

function filterOrders() {

    const keyword =
        searchInput.value
        .trim()
        .toLowerCase();

    const status =
        statusFilter.value;

    const filtered = orders.filter((order) => {

        const matchSearch =

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

        return matchSearch && matchStatus;

    });

    renderTable(filtered);

}

// ===========================================
// حفظ الطلب (إضافة / تعديل)
// ===========================================

if (orderForm) {

    orderForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const customer = customers.find(
            c => c.id === customerSelect.value
        );

        const service = services.find(
            s => s.id === serviceSelect.value
        );

        const data = {

            customerId: customer?.id || "",

            customerName: customer?.name || "",

            customerPhone: customer?.phone || "",

            serviceId: service?.id || "",

            serviceType: service?.name || "",

            unitPrice: Number(unitPriceInput.value || 0),

            pieces: Number(piecesInput.value || 1),

            totalAmount: Number(totalAmountInput.value || 0),

            status: statusInput.value,

            notes: notesInput.value.trim(),

            createdDate: new Date().toLocaleDateString("ar-SA")

        };

        try {

            if (editId) {

                await updateDoc(
                    doc(db, "orders", editId),
                    data
                );

            } else {

    data.orderNumber = generateOrderNumber();

    const docRef = await addDoc(
        collection(db, "orders"),
        {
            ...data,
            createdAt: serverTimestamp()
        }
    );

    await createInvoice({

        id: docRef.id,

        orderNumber: data.orderNumber,

        customerId: data.customerId,

        customerName: data.customerName,

        customerPhone: data.customerPhone,

        serviceId: data.serviceId,

        serviceType: data.serviceType,

        pieces: data.pieces,

        totalAmount: data.totalAmount,

        notes: data.notes

    });



   alert("تم إنشاء الطلب والفاتورة بنجاح");

}

            closeOrderModal();

        } catch (error) {

            console.error(
                "Save Order Error:",
                error
            );

            alert("حدث خطأ أثناء حفظ الطلب");

        }

    });

}

// ===========================================
// تعديل الطلب
// ===========================================

function editOrder(id) {

    const order = orders.find(
        o => o.id === id
    );

    if (!order) return;

    editId = id;

    openModal();

    orderNumberInput.value =
        order.orderNumber || "";

    customerSelect.value =
        order.customerId || "";

    phoneInput.value =
        order.customerPhone || "";

    serviceSelect.value =
        order.serviceId || "";

    unitPriceInput.value =
        Number(order.unitPrice || 0).toFixed(2);

    piecesInput.value =
        order.pieces || 1;

    totalAmountInput.value =
        Number(order.totalAmount || 0).toFixed(2);

    statusInput.value =
        order.status || "طلب جديد";

    notesInput.value =
        order.notes || "";

}

// ===========================================
// حذف الطلب
// ===========================================

async function deleteOrder(id) {

    const ok = confirm(
        "هل تريد حذف الطلب؟"
    );

    if (!ok) return;

    try {

        await deleteDoc(
            doc(db, "orders", id)
        );

    } catch (error) {

        console.error(
            "Delete Error:",
            error
        );

        alert("تعذر حذف الطلب");

    }

}

// ===========================================
// طباعة الفاتورة
// ===========================================

function printOrder(id) {

    const order = orders.find(
        o => o.id === id
    );

    if (!order) return;

    localStorage.setItem(
        "invoiceOrder",
        JSON.stringify(order)
    );

    window.open(
        "invoice.html",
        "_blank"
    );

}

// ===========================================
// ربط أزرار الجدول
// ===========================================

function bindButtons() {

    document
        .querySelectorAll(".edit-btn")
        .forEach(btn => {

            btn.onclick = () =>
                editOrder(btn.dataset.id);

        });

    document
        .querySelectorAll(".delete-btn")
        .forEach(btn => {

            btn.onclick = () =>
                deleteOrder(btn.dataset.id);

        });

    document
        .querySelectorAll(".print-btn")
        .forEach(btn => {

            btn.onclick = () =>
                printOrder(btn.dataset.id);

        });

}

// ===========================================
// ربط أزرار الواجهة
// ===========================================

newOrderBtn?.addEventListener(
    "click",
    () => {

        editId = null;

        openModal();

    }
);

closeModal?.addEventListener(
    "click",
    closeOrderModal
);

cancelBtn?.addEventListener(
    "click",
    closeOrderModal
);

// إغلاق النافذة عند الضغط خارجها

window.addEventListener(
    "click",
    (e) => {

        if (e.target === modal) {

            closeOrderModal();

        }

    }
);

// ===========================================
// زر التحديث
// ===========================================

refreshBtn?.addEventListener(
    "click",
    () => {

        loadOrders();

    }
);

// ===========================================
// تحديث الإجمالي عند تغيير السعر
// ===========================================

unitPriceInput?.addEventListener(
    "keyup",
    calculateTotal
);

piecesInput?.addEventListener(
    "keyup",
    calculateTotal
);

// ===========================================
// تنظيف النموذج
// ===========================================

function resetForm() {

    orderForm.reset();

    editId = null;

    orderNumberInput.value =
        generateOrderNumber();

    totalAmountInput.value = "0.00";

    statusInput.value = "طلب جديد";

}

// ===========================================
// بدء التشغيل
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await loadCustomers();

            await loadServices();

            await loadOrders();

            resetForm();

            console.log(
                "✅ Orders Module Loaded Successfully"
            );

        } catch (error) {

            console.error(
                "Initialization Error:",
                error
            );

        }

    }
);

// ===========================================
// تنظيف الاشتراك عند مغادرة الصفحة
// ===========================================

window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribe) {

            unsubscribe();

        }

    }
);

// ===========================================
// نهاية الملف
// Lama Laundry ERP v2.1 Professional
// orders.js
// ===========================================