// ===========================================
// Lama Laundry ERP v2.1 Professional
// invoices.js
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
    orderBy,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ===========================================
// عناصر الصفحة
// ===========================================

const tableBody = document.getElementById("invoicesTableBody");

const invoiceForm = document.getElementById("invoiceForm");

const modal = document.getElementById("invoiceModal");

const newInvoiceBtn = document.getElementById("newInvoiceBtn");

const closeModal = document.getElementById("closeInvoiceModal");

const cancelBtn = document.getElementById("cancelInvoiceBtn");

const refreshBtn = document.getElementById("refreshInvoices");

const searchInput = document.getElementById("searchInvoice");

const paymentFilter = document.getElementById("paymentFilter");

// حقول النموذج

const invoiceNumberInput =
    document.getElementById("invoiceNumber");

const orderNumberInput =
    document.getElementById("orderNumber");

const customerNameInput =
    document.getElementById("customerName");

const invoiceTotalInput =
    document.getElementById("invoiceTotal");

const paymentMethodInput =
    document.getElementById("paymentMethod");

const paymentStatusInput =
    document.getElementById("paymentStatus");

const invoiceNotesInput =
    document.getElementById("invoiceNotes");

// بطاقات الإحصائيات

const invoiceCountCard =
    document.getElementById("invoiceCount");

const paidInvoicesCard =
    document.getElementById("paidInvoices");

const invoiceRevenueCard =
    document.getElementById("invoiceRevenue");

const pendingInvoicesCard =
    document.getElementById("pendingInvoices");

// عناصر إضافية

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const loadingOverlay =
    document.getElementById("loadingOverlay");

// ===========================================
// البيانات
// ===========================================

let invoices = [];

let unsubscribe = null;

let editId = null;

// ===========================================
// إنشاء رقم فاتورة
// ===========================================

function generateInvoiceNumber() {

    return "INV" + Date.now();

}

// ===========================================
// فتح النافذة
// ===========================================

function openModal() {

    modal.classList.remove("hidden");

    if (!editId) {

        invoiceForm.reset();

        invoiceNumberInput.value =
            generateInvoiceNumber();

        paymentStatusInput.value =
            "غير مدفوعة";

        paymentMethodInput.value =
            "نقداً";

    }

}

// ===========================================
// إغلاق النافذة
// ===========================================

function closeInvoiceModal() {

    modal.classList.add("hidden");

    invoiceForm.reset();

    editId = null;

}

// ===========================================
// Toast
// ===========================================

function showToast(message) {

    if (!toast) return;

    toastMessage.textContent = message;

    toast.classList.remove("hidden");

    setTimeout(() => {

        toast.classList.add("hidden");

    }, 3000);

}

// ===========================================
// شاشة التحميل
// ===========================================

function showLoading() {

    loadingOverlay?.classList.remove("hidden");

}

function hideLoading() {

    loadingOverlay?.classList.add("hidden");

}

// ===========================================
// تحميل الفواتير (Realtime)
// ===========================================

async function loadInvoices() {

    try {

        showLoading();

        if (unsubscribe) {

            unsubscribe();

        }

        const q = query(
            collection(db, "invoices"),
            orderBy("createdAt", "desc")
        );

        unsubscribe = onSnapshot(

            q,

            (snapshot) => {

                invoices = [];

                snapshot.forEach((docSnap) => {

                    const data = docSnap.data();

                    invoices.push({

                        id: docSnap.id,

                        ...data,

                        invoiceNumber:
                            data.invoiceNumber ?? "-",

                        orderNumber:
                            data.orderNumber ?? "-",

                        customerName:
                            data.customerName ?? "-",

                        total:
                            Number(
                                data.total ??
                                data.invoiceTotal ??
                                0
                            ),

                        paymentMethod:
                            data.paymentMethod ??
                            "نقداً",

                        paymentStatus:
                            data.paymentStatus ??
                            "غير مدفوعة",

                        createdDate:
                            data.createdDate ?? "-"

                    });

                });

                renderTable();

                updateCards();

                hideLoading();

            },

            (error) => {

                console.error(
                    "Realtime Invoice Error:",
                    error
                );

                hideLoading();

                showToast(
                    "تعذر تحميل الفواتير"
                );

            }

        );

    } catch (error) {

        console.error(
            "Load Invoice Error:",
            error
        );

        hideLoading();

    }

}

// ===========================================
// رسم الجدول
// ===========================================

function renderTable(list = invoices) {

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (list.length === 0) {

        tableBody.innerHTML = `

<tr>

<td colspan="8" class="empty-table">

لا توجد فواتير حتى الآن

</td>

</tr>

`;

        return;

    }

    list.forEach((invoice) => {

        let statusClass = "payment-unpaid";

        switch (invoice.paymentStatus) {

            case "مدفوعة":

                statusClass = "payment-paid";

                break;

            case "مدفوعة جزئياً":

                statusClass = "payment-partial";

                break;

            default:

                statusClass = "payment-unpaid";

        }

        tableBody.innerHTML += `

<tr>

<td>${invoice.invoiceNumber}</td>

<td>${invoice.orderNumber}</td>

<td>${invoice.customerName}</td>

<td>${invoice.total.toFixed(2)} ر.س</td>

<td>${invoice.paymentMethod}</td>

<td>

<span class="payment-status ${statusClass}">

${invoice.paymentStatus}

</span>

</td>

<td>${invoice.createdDate}</td>

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
// تحديث البطاقات
// ===========================================

function updateCards() {

    invoiceCountCard.textContent =
        invoices.length;

    paidInvoicesCard.textContent =

        invoices.filter(

            i => i.paymentStatus === "مدفوعة"

        ).length;

    pendingInvoicesCard.textContent =

        invoices.filter(

            i => i.paymentStatus !== "مدفوعة"

        ).length;

    const revenue = invoices.reduce(

        (sum, invoice) =>

            sum + Number(invoice.total || 0),

        0

    );

    invoiceRevenueCard.textContent =

        revenue.toFixed(2) + " ر.س";

}

// ===========================================
// حفظ الفاتورة (إضافة / تعديل)
// ===========================================

invoiceForm?.addEventListener(

    "submit",

    async (e) => {

        e.preventDefault();

        showLoading();

        const data = {

            orderNumber:
                orderNumberInput.value.trim(),

            customerName:
                customerNameInput.value.trim(),

            total:
                Number(invoiceTotalInput.value || 0),

            paymentMethod:
                paymentMethodInput.value,

            paymentStatus:
                paymentStatusInput.value,

            notes:
                invoiceNotesInput.value.trim(),

            createdDate:
                new Date().toLocaleDateString("ar-SA")

        };

        try {

            if (editId) {

                await updateDoc(

                    doc(
                        db,
                        "invoices",
                        editId
                    ),

                    data

                );

                showToast(
                    "تم تحديث الفاتورة"
                );

            }

            else {

                data.invoiceNumber =
                    invoiceNumberInput.value ||
                    generateInvoiceNumber();

                data.createdAt =
                    serverTimestamp();

                await addDoc(

                    collection(
                        db,
                        "invoices"
                    ),

                    data

                );

                showToast(
                    "تم إنشاء الفاتورة"
                );

            }

            closeInvoiceModal();

        }

        catch (error) {

            console.error(error);

            alert(
                "حدث خطأ أثناء حفظ الفاتورة."
            );

        }

        finally {

            hideLoading();

        }

    }

);

// ===========================================
// تعديل فاتورة
// ===========================================

function editInvoice(id) {

    const invoice = invoices.find(

        item => item.id === id

    );

    if (!invoice) return;

    editId = id;

    openModal();

    invoiceNumberInput.value =
        invoice.invoiceNumber;

    orderNumberInput.value =
        invoice.orderNumber;

    customerNameInput.value =
        invoice.customerName;

    invoiceTotalInput.value =
        invoice.total;

    paymentMethodInput.value =
        invoice.paymentMethod;

    paymentStatusInput.value =
        invoice.paymentStatus;

    invoiceNotesInput.value =
        invoice.notes || "";

    document.getElementById(
        "invoiceModalTitle"
    ).textContent =
        "تعديل الفاتورة";

}

// ===========================================
// حذف فاتورة
// ===========================================

async function removeInvoice(id) {

    if (

        !confirm(

            "هل تريد حذف الفاتورة؟"

        )

    ) return;

    try {

        showLoading();

        await deleteDoc(

            doc(
                db,
                "invoices",
                id
            )

        );

        showToast(
            "تم حذف الفاتورة"
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "تعذر حذف الفاتورة."
        );

    }

    finally {

        hideLoading();

    }

}

// ===========================================
// ربط الأزرار
// ===========================================

function bindButtons() {

    document
        .querySelectorAll(".edit-btn")
        .forEach(btn => {

            btn.onclick = () =>

                editInvoice(
                    btn.dataset.id
                );

        });

    document
        .querySelectorAll(".delete-btn")
        .forEach(btn => {

            btn.onclick = () =>

                removeInvoice(
                    btn.dataset.id
                );

        });

    document
        .querySelectorAll(".print-btn")
        .forEach(btn => {

            btn.onclick = () =>

                printInvoice(
                    btn.dataset.id
                );

        });

}

// ===========================================
// البحث
// ===========================================

searchInput?.addEventListener(
    "input",
    filterInvoices
);

// ===========================================
// فلترة حالة الدفع
// ===========================================

paymentFilter?.addEventListener(
    "change",
    filterInvoices
);

function filterInvoices() {

    const keyword =
        searchInput.value
        .trim()
        .toLowerCase();

    const payment =
        paymentFilter.value;

    const filtered = invoices.filter(invoice => {

        const matchSearch =

            (invoice.invoiceNumber || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (invoice.orderNumber || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (invoice.customerName || "")
                .toLowerCase()
                .includes(keyword);

        const matchPayment =

            payment === ""

            ||

            invoice.paymentStatus === payment;

        return matchSearch && matchPayment;

    });

    renderTable(filtered);

}

// ===========================================
// طباعة الفاتورة
// ===========================================

function printInvoice(id) {

    const invoice = invoices.find(
        item => item.id === id
    );

    if (!invoice) return;

    localStorage.setItem(
        "invoicePreview",
        JSON.stringify(invoice)
    );

    window.print();

}

// ===========================================
// فتح وإغلاق النافذة
// ===========================================

newInvoiceBtn?.addEventListener(
    "click",
    () => {

        editId = null;

        document.getElementById(
            "invoiceModalTitle"
        ).textContent =
            "فاتورة جديدة";

        openModal();

    }
);

closeModal?.addEventListener(
    "click",
    closeInvoiceModal
);

cancelBtn?.addEventListener(
    "click",
    closeInvoiceModal
);

// إغلاق النافذة عند الضغط خارجها

window.addEventListener(
    "click",
    (e) => {

        if (e.target === modal) {

            closeInvoiceModal();

        }

    }
);

// ===========================================
// زر التحديث
// ===========================================

refreshBtn?.addEventListener(
    "click",
    loadInvoices
);

// ===========================================
// بدء التشغيل
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await loadInvoices();

            invoiceNumberInput.value =
                generateInvoiceNumber();

            console.log(
                "✅ Invoice Module Loaded Successfully"
            );

        }

        catch (error) {

            console.error(
                "Initialization Error:",
                error
            );

            hideLoading();

        }

    }
);

// ===========================================
// تنظيف الاشتراك
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
// invoices.js
// ===========================================
