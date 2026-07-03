// ===========================================
// Lama Laundry ERP v1.0
// invoices.js
// الجزء الأول
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ===========================================
// عناصر الصفحة
// ===========================================

const tableBody = document.getElementById("invoicesTableBody");

const form = document.getElementById("invoiceForm");

const modal = document.getElementById("invoiceModal");

const newBtn = document.getElementById("newInvoiceBtn");

const closeBtn = document.getElementById("closeInvoiceModal");

const cancelBtn = document.getElementById("cancelInvoiceBtn");

const refreshBtn = document.getElementById("refreshInvoices");

const searchInput = document.getElementById("searchInvoice");

const paymentFilter = document.getElementById("paymentFilter");

let invoices = [];

let editId = null;

// ===========================================
// فتح وإغلاق النافذة
// ===========================================

newBtn.onclick = () => {

    editId = null;

    form.reset();

    document.getElementById("invoiceModalTitle").textContent = "فاتورة جديدة";

    modal.classList.remove("hidden");

};

closeBtn.onclick = () => modal.classList.add("hidden");

cancelBtn.onclick = () => modal.classList.add("hidden");

// ===========================================
// إنشاء رقم فاتورة
// ===========================================

function generateInvoiceNumber() {

    return "INV-" + Date.now();

}

// ===========================================
// تحميل الفواتير
// ===========================================

async function loadInvoices() {

    invoices = [];

    tableBody.innerHTML = "";

    const q = query(
        collection(db, "invoices"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {

        invoices.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    renderTable();

    updateCards();

}



// ===========================================
// رسم جدول الفواتير
// ===========================================

function renderTable(list = invoices) {

    tableBody.innerHTML = "";

    list.forEach(invoice => {

        let statusClass = "payment-unpaid";

        switch (invoice.paymentStatus) {

            case "مدفوعة":
                statusClass = "payment-paid";
                break;

            case "مدفوعة جزئياً":
                statusClass = "payment-partial";
                break;

            case "غير مدفوعة":
                statusClass = "payment-unpaid";
                break;
        }

        tableBody.innerHTML += `

<tr>

<td>${invoice.invoiceNumber}</td>

<td>${invoice.orderNumber}</td>

<td>${invoice.customerName}</td>

<td>${Number(invoice.total).toFixed(2)} ر.س</td>

<td>${invoice.paymentMethod}</td>

<td>
<span class="payment-status ${statusClass}">
${invoice.paymentStatus}
</span>
</td>

<td>${invoice.createdDate || "-"}</td>

<td>

<div class="action-buttons">

<button
class="edit-btn"
data-id="${invoice.id}"
title="تعديل">

<i class="fas fa-pen"></i>

</button>

<button
class="print-btn"
data-id="${invoice.id}"
title="طباعة">

<i class="fas fa-print"></i>

</button>

<button
class="delete-btn"
data-id="${invoice.id}"
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

    document.getElementById("invoiceCount").textContent =
        invoices.length;

    document.getElementById("paidInvoices").textContent =
        invoices.filter(i => i.paymentStatus === "مدفوعة").length;

    const totalRevenue = invoices.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0
    );

    document.getElementById("invoiceRevenue").textContent =
        totalRevenue.toFixed(2) + " ر.س";

}

// ===========================================
// ربط الأزرار
// ===========================================

function bindButtons() {

    document.querySelectorAll(".edit-btn").forEach(btn => {

        btn.onclick = () => editInvoice(btn.dataset.id);

    });

    document.querySelectorAll(".delete-btn").forEach(btn => {

        btn.onclick = () => removeInvoice(btn.dataset.id);

    });

    document.querySelectorAll(".print-btn").forEach(btn => {

        btn.onclick = () => printInvoice(btn.dataset.id);

    });

}

// ===========================================
// حفظ فاتورة (إضافة / تعديل)
// ===========================================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const data = {

        invoiceNumber: editId ? undefined : generateInvoiceNumber(),

        orderNumber: document.getElementById("orderNumber").value.trim(),

        customerName: document.getElementById("customerName").value.trim(),

        total: Number(document.getElementById("invoiceTotal").value),

        paymentMethod: document.getElementById("paymentMethod").value,

        paymentStatus: document.getElementById("paymentStatus").value,

        notes: document.getElementById("invoiceNotes").value.trim(),

        createdDate: new Date().toLocaleDateString("ar-SA"),

        createdAt: serverTimestamp()

    };

    try {

        if (editId) {

            if (data.invoiceNumber === undefined) {
                delete data.invoiceNumber;
            }

            delete data.createdAt;

            await updateDoc(
                doc(db, "invoices", editId),
                data
            );

        } else {

            await addDoc(
                collection(db, "invoices"),
                data
            );

        }

        modal.classList.add("hidden");

        form.reset();

        editId = null;

        await loadInvoices();

    } catch (err) {

        console.error(err);

        alert("حدث خطأ أثناء حفظ الفاتورة.");

    }

});

// ===========================================
// تعديل فاتورة
// ===========================================

function editInvoice(id) {

    const invoice = invoices.find(i => i.id === id);

    if (!invoice) return;

    editId = id;

    document.getElementById("invoiceModalTitle").textContent = "تعديل الفاتورة";

    document.getElementById("orderNumber").value = invoice.orderNumber || "";

    document.getElementById("customerName").value = invoice.customerName || "";

    document.getElementById("invoiceTotal").value = invoice.total || 0;

    document.getElementById("paymentMethod").value = invoice.paymentMethod || "نقداً";

    document.getElementById("paymentStatus").value = invoice.paymentStatus || "غير مدفوعة";

    document.getElementById("invoiceNotes").value = invoice.notes || "";

    modal.classList.remove("hidden");

}

// ===========================================
// حذف فاتورة
// ===========================================

async function removeInvoice(id) {

    if (!confirm("هل تريد حذف هذه الفاتورة؟")) return;

    try {

        await deleteDoc(doc(db, "invoices", id));

        await loadInvoices();

    } catch (err) {

        console.error(err);

        alert("تعذر حذف الفاتورة.");

    }

}

// ===========================================
// البحث
// ===========================================

searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = invoices.filter(invoice => {

        const number = (invoice.invoiceNumber || "").toLowerCase();
        const customer = (invoice.customerName || "").toLowerCase();

        return (
            number.includes(keyword) ||
            customer.includes(keyword)
        );

    });

    renderTable(filtered);

});

// ===========================================
// فلترة حالة الدفع
// ===========================================

paymentFilter.addEventListener("change", () => {

    const value = paymentFilter.value;

    if (value === "") {

        renderTable(invoices);

        return;

    }

    renderTable(
        invoices.filter(i => i.paymentStatus === value)
    );

});

// ===========================================
// تحديث البيانات
// ===========================================

refreshBtn.addEventListener("click", loadInvoices);

// ===========================================
// طباعة الفاتورة
// ===========================================

function printInvoice(id) {

    const invoice = invoices.find(i => i.id === id);

    if (!invoice) return;

    const win = window.open("", "_blank");

    win.document.write(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>فاتورة ${invoice.invoiceNumber}</title>
<style>
body{font-family:Cairo,sans-serif;padding:40px;direction:rtl}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{border:1px solid #ddd;padding:10px;text-align:center}
h2{text-align:center}
</style>
</head>
<body>

<h2>مغاسل لمى الذكية</h2>

<table>

<tr><th>رقم الفاتورة</th><td>${invoice.invoiceNumber}</td></tr>
<tr><th>رقم الطلب</th><td>${invoice.orderNumber}</td></tr>
<tr><th>العميل</th><td>${invoice.customerName}</td></tr>
<tr><th>الإجمالي</th><td>${Number(invoice.total).toFixed(2)} ر.س</td></tr>
<tr><th>طريقة الدفع</th><td>${invoice.paymentMethod}</td></tr>
<tr><th>حالة الدفع</th><td>${invoice.paymentStatus}</td></tr>
<tr><th>الملاحظات</th><td>${invoice.notes || "-"}</td></tr>

</table>

<script>
window.print();
window.onafterprint=()=>window.close();
<\/script>

</body>
</html>
`);

    win.document.close();

}

// ===========================================
// بدء التشغيل
// ===========================================

loadInvoices();