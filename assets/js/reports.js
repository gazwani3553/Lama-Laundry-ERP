// ======================================================
// Lama Laundry ERP v2 Professional
// reports.js
// الجزء الأول (Core + Firebase + Data Store)
// ======================================================

import { db } from "../../firebase/firebase-config.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ======================================================
// عناصر الصفحة
// ======================================================

const salesTodayEl       = document.getElementById("salesToday");
const ordersTodayEl      = document.getElementById("ordersToday");
const customersTodayEl   = document.getElementById("customersToday");
const monthlyRevenueEl   = document.getElementById("monthlyRevenue");

const topCustomersTable  = document.getElementById("topCustomersTable");
const topServicesTable   = document.getElementById("topServicesTable");
const lowStockTable      = document.getElementById("lowStockTable");
const latestOrdersTable  = document.getElementById("latestOrdersTable");

const refreshBtn         = document.getElementById("refreshReports");
const printBtn           = document.getElementById("printReport");

const salesChartCanvas   = document.getElementById("salesChart");
const ordersChartCanvas  = document.getElementById("ordersChart");

// ======================================================
// قاعدة البيانات المحلية (Cache)
// ======================================================

const store = {

    orders: [],
    customers: [],
    inventory: [],
    invoices: []

};

// ======================================================
// Firebase Listeners
// ======================================================

const listeners = {

    orders: null,
    customers: null,
    inventory: null,
    invoices: null

};

// ======================================================
// Chart Instances
// ======================================================

let salesChart = null;
let ordersChart = null;

// ======================================================
// تنسيق الأرقام
// ======================================================

const currencyFormatter = new Intl.NumberFormat("ar-SA", {

    minimumFractionDigits: 2,
    maximumFractionDigits: 2

});

function money(value = 0) {

    return `${currencyFormatter.format(Number(value || 0))} ر.س`;

}

// ======================================================
// تنسيق التاريخ
// ======================================================

function formatDate(date) {

    if (!date) return "";

    if (date.toDate) {

        date = date.toDate();

    }

    return new Intl.DateTimeFormat("ar-SA").format(date);

}

// ======================================================
// تحويل Timestamp
// ======================================================

function toDate(value) {

    if (!value) return null;

    if (value.toDate) {

        return value.toDate();

    }

    return new Date(value);

}

// ======================================================
// تنظيف Listener سابق
// ======================================================

function removeListener(name) {

    if (listeners[name]) {

        listeners[name]();

        listeners[name] = null;

    }

}

// ======================================================
// تشغيل Listener
// ======================================================

function listenCollection(name) {

    removeListener(name);

    listeners[name] = onSnapshot(

        collection(db, name),

        snapshot => {

            store[name] = snapshot.docs.map(doc => ({

                id: doc.id,
                ...doc.data()

            }));

            refreshReports();

        },

        error => {

            console.error(`خطأ أثناء تحميل ${name}`, error);

        }

    );

}

// ======================================================
// تحميل البيانات
// ======================================================

function loadReports() {

    listenCollection("orders");

    listenCollection("customers");

    listenCollection("inventory");

    listenCollection("invoices");

}

// ======================================================
// تحديث الصفحة بالكامل
// ======================================================

function refreshReports() {

    buildDashboard();

    buildTables();

    drawCharts();

}

// ======================================================
// Dashboard v2 Professional
// الجزء الثاني
// ======================================================

function buildDashboard() {

    const today = new Date();

    const currentMonth = today.getMonth();

    const currentYear = today.getFullYear();

    // ==========================================
    // طلبات اليوم
    // ==========================================

    const todayOrders = store.orders.filter(order => {

        const date = toDate(order.createdAt);

        if (!date) return false;

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        );

    });

    // ==========================================
    // عملاء اليوم
    // ==========================================

    const todayCustomers = store.customers.filter(customer => {

        const date = toDate(customer.createdAt);

        if (!date) return false;

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        );

    });

    // ==========================================
    // فواتير اليوم
    // ==========================================

    const todayInvoices = store.invoices.filter(invoice => {

        const date = toDate(invoice.createdAt);

        if (!date) return false;

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        );

    });

    // ==========================================
    // فواتير الشهر الحالي
    // ==========================================

    const monthInvoices = store.invoices.filter(invoice => {

        const date = toDate(invoice.createdAt);

        if (!date) return false;

        return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        );

    });

    // ==========================================
    // الحسابات
    // ==========================================

    const todaySales = todayInvoices.reduce((sum, invoice) => {

        return sum + Number(invoice.total || 0);

    }, 0);

    const monthlyRevenue = monthInvoices.reduce((sum, invoice) => {

        return sum + Number(invoice.total || 0);

    }, 0);

    const averageOrder = todayOrders.length

        ? todaySales / todayOrders.length

        : 0;

    // ==========================================
    // تحديث البطاقات
    // ==========================================

    if (salesTodayEl) {

        salesTodayEl.textContent = money(todaySales);

    }

    if (ordersTodayEl) {

        ordersTodayEl.textContent = todayOrders.length;

    }

    if (customersTodayEl) {

        customersTodayEl.textContent = todayCustomers.length;

    }

    if (monthlyRevenueEl) {

        monthlyRevenueEl.textContent = money(monthlyRevenue);

    }

    // ==========================================
    // حفظ القيم لاستخدامها في الطباعة لاحقاً
    // ==========================================

    window.reportSummary = {

        todaySales,
        monthlyRevenue,
        ordersToday: todayOrders.length,
        customersToday: todayCustomers.length,
        averageOrder

    };

}

// ======================================================
// Reports Tables v2 Professional
// الجزء الثالث
// ======================================================

function buildTables() {

    buildTopCustomers();

    buildTopServices();

    buildLowStock();

    buildLatestOrders();

}

// ======================================================
// أفضل العملاء
// ======================================================

function buildTopCustomers() {

    if (!topCustomersTable) return;

    topCustomersTable.innerHTML = "";

    const customersMap = {};

    store.invoices.forEach(invoice => {

        const name =
            invoice.customerName ||
            "عميل";

        if (!customersMap[name]) {

            customersMap[name] = {

                name,
                orders: 0,
                total: 0

            };

        }

        customersMap[name].orders++;

        customersMap[name].total +=
            Number(invoice.total || 0);

    });

    Object.values(customersMap)

        .sort((a, b) => b.total - a.total)

        .slice(0, 5)

        .forEach(customer => {

            topCustomersTable.innerHTML += `

<tr>

<td>${customer.name}</td>

<td>${customer.orders}</td>

<td>${money(customer.total)}</td>

</tr>

`;

        });

    if (!topCustomersTable.innerHTML) {

        topCustomersTable.innerHTML = `

<tr>

<td colspan="3">

لا توجد بيانات

</td>

</tr>

`;

    }

}

// ======================================================
// أكثر الخدمات طلباً
// ======================================================

function buildTopServices() {

    if (!topServicesTable) return;

    topServicesTable.innerHTML = "";

    const servicesMap = {};

    store.orders.forEach(order => {

        // النظام الجديد

        if (Array.isArray(order.services)) {

            order.services.forEach(service => {

                const name =
                    service.name ||
                    service.serviceName ||
                    service.type ||
                    "غير محدد";

                servicesMap[name] =
                    (servicesMap[name] || 0) + 1;

            });

        }

        // النظام القديم

        else {

            const name =
                order.serviceType ||
                "غير محدد";

            servicesMap[name] =
                (servicesMap[name] || 0) + 1;

        }

    });

    Object.entries(servicesMap)

        .sort((a, b) => b[1] - a[1])

        .slice(0, 5)

        .forEach(([service, count]) => {

            topServicesTable.innerHTML += `

<tr>

<td>${service}</td>

<td>${count}</td>

</tr>

`;

        });

    if (!topServicesTable.innerHTML) {

        topServicesTable.innerHTML = `

<tr>

<td colspan="2">

لا توجد بيانات

</td>

</tr>

`;

    }

}

// ======================================================
// المخزون المنخفض
// ======================================================

function buildLowStock() {

    if (!lowStockTable) return;

    lowStockTable.innerHTML = "";

    store.inventory

        .filter(item => {

            return Number(item.quantity || 0)

                <=

                Number(item.minimumQuantity || 0);

        })

        .sort((a, b) =>

            Number(a.quantity || 0)

            -

            Number(b.quantity || 0)

        )

        .slice(0, 5)

        .forEach(item => {

            lowStockTable.innerHTML += `

<tr>

<td>${item.name || "-"}</td>

<td>${item.quantity || 0}</td>

</tr>

`;

        });

    if (!lowStockTable.innerHTML) {

        lowStockTable.innerHTML = `

<tr>

<td colspan="2">

المخزون ممتاز

</td>

</tr>

`;

    }

}

// ======================================================
// آخر الطلبات
// ======================================================

function buildLatestOrders() {

    if (!latestOrdersTable) return;

    latestOrdersTable.innerHTML = "";

    [...store.orders]

        .sort((a, b) => {

            const first = toDate(b.createdAt);

            const second = toDate(a.createdAt);

            return first - second;

        })

        .slice(0, 5)

        .forEach(order => {

            latestOrdersTable.innerHTML += `

<tr>

<td>${order.orderNumber || "-"}</td>

<td>${order.customerName || "-"}</td>

<td>${money(order.totalAmount || order.total || 0)}</td>

</tr>

`;

        });

    if (!latestOrdersTable.innerHTML) {

        latestOrdersTable.innerHTML = `

<tr>

<td colspan="3">

لا توجد طلبات

</td>

</tr>

`;

    }

}

// ======================================================
// Reports Charts v2 Professional
// الجزء الرابع
// ======================================================

function drawCharts() {

    drawSalesChart();

    drawOrdersChart();

}

// ======================================================
// رسم المبيعات الشهرية
// ======================================================

function drawSalesChart() {

    if (!salesChartCanvas) return;

    if (salesChart) {

        salesChart.destroy();

    }

    const months = [

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

    const totals = new Array(12).fill(0);

    store.invoices.forEach(invoice => {

        const date = toDate(invoice.createdAt);

        if (!date) return;

        totals[date.getMonth()] += Number(

            invoice.total || 0

        );

    });

    salesChart = new Chart(

        salesChartCanvas,

        {

            type: "bar",

            data: {

                labels: months,

                datasets: [

                    {

                        label: "المبيعات",

                        data: totals,

                        borderWidth: 2,

                        borderRadius: 8,

                        maxBarThickness: 40

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                animation: {

                    duration: 700

                },

                interaction: {

                    intersect: false,

                    mode: "index"

                },

                plugins: {

                    legend: {

                        display: true,

                        position: "bottom"

                    },

                    tooltip: {

                        callbacks: {

                            label(context) {

                                return money(context.raw);

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true

                    }

                }

            }

        }

    );

}

// ======================================================
// رسم حالات الطلبات
// ======================================================

function drawOrdersChart() {

    if (!ordersChartCanvas) return;

    if (ordersChart) {

        ordersChart.destroy();

    }

    const status = {

        "طلب جديد": 0,
        "قيد الغسيل": 0,
        "قيد الكي": 0,
        "جاهز": 0,
        "خرج للتوصيل": 0,
        "تم التسليم": 0,
        "ملغي": 0

    };

    store.orders.forEach(order => {

        if (!status.hasOwnProperty(order.status)) {

            status[order.status] = 0;

        }

        status[order.status]++;

    });

    ordersChart = new Chart(

        ordersChartCanvas,

        {

            type: "doughnut",

            data: {

                labels: Object.keys(status),

                datasets: [

                    {

                        data: Object.values(status),

                        borderWidth: 1

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "65%",

                animation: {

                    animateRotate: true,

                    animateScale: true

                },

                plugins: {

                    legend: {

                        position: "bottom"

                    },

                    tooltip: {

                        callbacks: {

                            label(context) {

                                return `${context.label} : ${context.raw}`;

                            }

                        }

                    }

                }

            }

        }

    );

}

// ======================================================
// Reports Controls v2 Professional
// الجزء الخامس والأخير
// ======================================================

// ==========================================
// تحديث يدوي
// ==========================================

function refreshNow() {

    refreshReports();

}

if (refreshBtn) {

    refreshBtn.addEventListener("click", () => {

        refreshNow();

    });

}

// ==========================================
// طباعة التقرير
// ==========================================

if (printBtn) {

    printBtn.addEventListener("click", () => {

        const reportDate = new Date().toLocaleString("ar-SA");

        document.title =
            `تقرير مغاسل لمى - ${reportDate}`;

        window.print();

    });

}

// ==========================================
// تنظيف الموارد
// ==========================================

function cleanup() {

    Object.keys(listeners).forEach(key => {

        if (listeners[key]) {

            listeners[key]();

            listeners[key] = null;

        }

    });

    if (salesChart) {

        salesChart.destroy();

        salesChart = null;

    }

    if (ordersChart) {

        ordersChart.destroy();

        ordersChart = null;

    }

}

window.addEventListener(

    "beforeunload",

    cleanup

);

// ==========================================
// بدء التشغيل
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        loadReports();

    }

);

// ======================================================
// أدوات مساعدة
// ======================================================

function safeNumber(value) {

    const number = Number(value);

    return isNaN(number) ? 0 : number;

}

function sortByDate(list = []) {

    return [...list].sort((a, b) => {

        const first = toDate(b.createdAt);

        const second = toDate(a.createdAt);

        if (!first || !second) return 0;

        return first - second;

    });

}

function getCurrentMonthInvoices() {

    const now = new Date();

    return store.invoices.filter(invoice => {

        const date = toDate(invoice.createdAt);

        if (!date) return false;

        return (

            date.getMonth() === now.getMonth() &&

            date.getFullYear() === now.getFullYear()

        );

    });

}

function getTodayOrders() {

    const now = new Date();

    return store.orders.filter(order => {

        const date = toDate(order.createdAt);

        if (!date) return false;

        return (

            date.getDate() === now.getDate() &&

            date.getMonth() === now.getMonth() &&

            date.getFullYear() === now.getFullYear()

        );

    });

}

console.log(

    "%cLama Laundry ERP v2 Professional",

    "color:#0d6efd;font-size:16px;font-weight:bold;"

);

console.log(

    "Reports Module Loaded Successfully"

);