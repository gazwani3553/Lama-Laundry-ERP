// ===========================================
// Lama Laundry ERP v1.0
// dashboard.js
// الجزء الأول
// ===========================================

import { db } from "../../firebase/firebase-config.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
// ===========================================
// عناصر الصفحة
// ===========================================

const dashboardOrders = document.getElementById("dashboardOrders");
const dashboardCustomers = document.getElementById("dashboardCustomers");
const dashboardRevenue = document.getElementById("dashboardRevenue");
const dashboardPending = document.getElementById("dashboardPending");

const latestOrdersTable = document.getElementById("latestOrdersTable");
const latestCustomersTable = document.getElementById("latestCustomersTable");
const latestInvoicesTable = document.getElementById("latestInvoicesTable");
const lowStockTable = document.getElementById("lowStockTable");

const refreshBtn = document.getElementById("refreshDashboard");
const orders = [];
const customers = [];
const invoices = [];
const inventory = [];

let unsubscribeOrders = null;
let unsubscribeCustomers = null;
let unsubscribeInvoices = null;
let unsubscribeInventory = null;

// ===========================================
// تحميل البيانات (Realtime)
// ===========================================

function loadDashboard() {

    // ---------------- الطلبات ----------------

    if (unsubscribeOrders) unsubscribeOrders();

    unsubscribeOrders = onSnapshot(

        collection(db, "orders"),

        (snapshot) => {

            orders.length = 0;

            snapshot.forEach(doc => {

                orders.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            refreshDashboard();

        }

    );

    // ---------------- العملاء ----------------

    if (unsubscribeCustomers) unsubscribeCustomers();

    unsubscribeCustomers = onSnapshot(

        collection(db, "customers"),

        (snapshot) => {

            customers.length = 0;

            snapshot.forEach(doc => {

                customers.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            refreshDashboard();

        }

    );

    // ---------------- الفواتير ----------------

    if (unsubscribeInvoices) unsubscribeInvoices();

    unsubscribeInvoices = onSnapshot(

        collection(db, "invoices"),

        (snapshot) => {

            invoices.length = 0;

            snapshot.forEach(doc => {

                invoices.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            refreshDashboard();

        }

    );

    // ---------------- المخزون ----------------

    if (unsubscribeInventory) unsubscribeInventory();

    unsubscribeInventory = onSnapshot(

        collection(db, "inventory"),

        (snapshot) => {

            inventory.length = 0;

            snapshot.forEach(doc => {

                inventory.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            refreshDashboard();

        }

    );

}

// ===========================================
// تحديث لوحة التحكم
// ===========================================

function refreshDashboard() {

    buildCards();

    buildTables();

    drawCharts();

    updateNotifications();

}
// ===========================================
// بطاقات الإحصائيات
// ===========================================

function buildCards() {

    if (dashboardOrders) {
        dashboardOrders.textContent = orders.length;
    }

    if (dashboardCustomers) {
        dashboardCustomers.textContent = customers.length;
    }

    if (dashboardRevenue) {

        dashboardRevenue.textContent =
            invoices
                .reduce((sum, invoice) => {

                    return sum + Number(invoice.total || 0);

                }, 0)
                .toFixed(2) + " ر.س";

    }

    if (dashboardPending) {

        dashboardPending.textContent =
            orders.filter(order =>

                order.status === "طلب جديد" ||
                order.status === "قيد الغسيل" ||
                order.status === "قيد الكي"

            ).length;

    }

}// ===========================================
// تعبئة الجداول
// ===========================================

function buildTables() {

    // ---------------- الطلبات ----------------

    if (latestOrdersTable) {

        latestOrdersTable.innerHTML = "";

        [...orders]
            .reverse()
            .slice(0, 5)
            .forEach(order => {

                latestOrdersTable.innerHTML += `
<tr>
    <td>${order.orderNumber || "-"}</td>
    <td>${order.customerName || "-"}</td>
    <td>${order.status || "-"}</td>
</tr>`;

            });

    }

    // ---------------- العملاء ----------------

    if (latestCustomersTable) {

        latestCustomersTable.innerHTML = "";

        [...customers]
            .reverse()
            .slice(0, 5)
            .forEach(customer => {

                latestCustomersTable.innerHTML += `
<tr>
    <td>${customer.name || "-"}</td>
    <td>${customer.phone || "-"}</td>
</tr>`;

            });

    }

    // ---------------- الفواتير ----------------

    if (latestInvoicesTable) {

        latestInvoicesTable.innerHTML = "";

        [...invoices]
            .reverse()
            .slice(0, 5)
            .forEach(invoice => {

                latestInvoicesTable.innerHTML += `
<tr>
    <td>${invoice.invoiceNumber || "-"}</td>
    <td>${Number(invoice.total || 0).toFixed(2)} ر.س</td>
</tr>`;

            });

    }

    // ---------------- المخزون ----------------

    if (lowStockTable) {

        lowStockTable.innerHTML = "";

        inventory
            .filter(item =>
                Number(item.quantity || 0) <= Number(item.minimumQuantity || 0)
            )
            .slice(0, 5)
            .forEach(item => {

                lowStockTable.innerHTML += `
<tr>
    <td>${item.name || "-"}</td>
    <td>${item.quantity || 0}</td>
</tr>`;

            });

    }

}

// ===========================================
// الرسوم البيانية
// ===========================================

function drawCharts() {

    const revenueCanvas = document.getElementById("revenueChart");
    const statusCanvas = document.getElementById("statusChart");

    if (!revenueCanvas || !statusCanvas) return;

    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
    }

    if (window.statusChartInstance) {
        window.statusChartInstance.destroy();
    }

    // ---------------- الإيرادات الشهرية ----------------

    const monthNames = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر"
    ];

    const monthlyRevenue = new Array(12).fill(0);

    invoices.forEach(invoice => {

        if (!invoice.createdAt?.toDate) return;

        const date = invoice.createdAt.toDate();

        monthlyRevenue[date.getMonth()] += Number(invoice.total || 0);

    });

    window.revenueChartInstance = new Chart(revenueCanvas, {

        type: "line",

        data: {

            labels: monthNames,

            datasets: [

                {

                    label: "الإيرادات",

                    data: monthlyRevenue,

                    tension: 0.35,

                    fill: false

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false

        }

    });

    // ---------------- حالة الطلبات ----------------

    const status = {

        "طلب جديد": 0,
        "قيد الغسيل": 0,
        "قيد الكي": 0,
        "جاهز": 0,
        "تم التسليم": 0,
        "ملغي": 0

    };

    orders.forEach(order => {

        if (status.hasOwnProperty(order.status)) {

            status[order.status]++;

        }

    });

    window.statusChartInstance = new Chart(statusCanvas, {

        type: "doughnut",

        data: {

            labels: Object.keys(status),

            datasets: [

                {

                    data: Object.values(status)

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}

// ===========================================
// تحديث البيانات
// ===========================================

if (refreshBtn) {

    refreshBtn.addEventListener("click", loadDashboard);

}
// ===========================================
// أدوات مساعدة
// ===========================================

function formatCurrency(value) {

    return Number(value || 0).toLocaleString("ar-SA", {

        minimumFractionDigits: 2,
        maximumFractionDigits: 2

    }) + " ر.س";

}

function formatDate(date) {

    if (!date) return "-";

    if (date?.toDate) {

        return date.toDate().toLocaleDateString("ar-SA");

    }

    try {

        return new Date(date).toLocaleDateString("ar-SA");

    } catch {

        return "-";

    }

}

// ===========================================
// إشعارات لوحة التحكم
// ===========================================

function updateNotifications() {

    const notifications = document.getElementById("notificationsCount");

    if (!notifications) return;

    const lowStock = inventory.filter(item =>

        Number(item.quantity || 0) <= Number(item.minimumQuantity || 0)

    ).length;

    const pendingOrders = orders.filter(order =>

        order.status !== "تم التسليم" &&
        order.status !== "ملغي"

    ).length;

    notifications.textContent = lowStock + pendingOrders;

}

// ===========================================
// التحديث التلقائي
// ===========================================

let dashboardRefreshInterval = null;

function startDashboardAutoRefresh() {

    if (dashboardRefreshInterval) {

        clearInterval(dashboardRefreshInterval);

    }

    dashboardRefreshInterval = setInterval(() => {

        loadDashboard();

    }, 60000);

}

// ===========================================
// بدء التشغيل
// ===========================================
document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

});
// ===========================================
// تنظيف الموارد عند مغادرة الصفحة
// ===========================================

window.addEventListener("beforeunload", () => {

    if (unsubscribeOrders) {
        unsubscribeOrders();
    }

    if (unsubscribeCustomers) {
        unsubscribeCustomers();
    }

    if (unsubscribeInvoices) {
        unsubscribeInvoices();
    }

    if (unsubscribeInventory) {
        unsubscribeInventory();
    }

    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
    }

    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
    }

    if (window.statusChartInstance) {
        window.statusChartInstance.destroy();
    }

});