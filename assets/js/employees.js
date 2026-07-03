// ======================================================
// Lama Laundry ERP v2 Professional
// employees.js
// الجزء الأول (Core + Firebase + Data Store)
// ======================================================

import { db } from "../../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ======================================================
// عناصر الصفحة
// ======================================================

const tableBody = document.getElementById("employeesTableBody");
const form = document.getElementById("employeeForm");
const modal = document.getElementById("employeeModal");

const newBtn = document.getElementById("newEmployeeBtn");
const closeBtn = document.getElementById("closeEmployeeModal");
const cancelBtn = document.getElementById("cancelEmployeeBtn");

const refreshBtn = document.getElementById("refreshEmployees");

const searchInput = document.getElementById("searchEmployee");
const roleFilter = document.getElementById("employeeFilter");

const employeesCount = document.getElementById("employeesCount");
const activeEmployees = document.getElementById("activeEmployees");
const driversCount = document.getElementById("driversCount");

// ======================================================
// Data Store
// ======================================================

const employees = [];

let editId = null;

let unsubscribeEmployees = null;

// ======================================================
// أدوات مساعدة
// ======================================================

function money(value = 0) {

    return Number(value || 0).toLocaleString("ar-SA", {

        minimumFractionDigits: 2,
        maximumFractionDigits: 2

    }) + " ر.س";

}

function safeText(value) {

    return String(value || "").trim();

}

function safeNumber(value) {

    const number = Number(value);

    return isNaN(number) ? 0 : number;

}

// ======================================================
// نافذة الموظف
// ======================================================

function openModal(title = "إضافة موظف") {

    editId = null;

    form.reset();

    document.getElementById("employeeModalTitle").textContent = title;

    modal.classList.remove("hidden");

}

function closeModal() {

    modal.classList.add("hidden");

}

// ======================================================
// الأزرار
// ======================================================

if (newBtn) {

    newBtn.addEventListener("click", () => {

        openModal();

    });

}

if (closeBtn) {

    closeBtn.addEventListener("click", closeModal);

}

if (cancelBtn) {

    cancelBtn.addEventListener("click", closeModal);

}

// ======================================================
// تحميل الموظفين (Realtime)
// ======================================================

function loadEmployees() {

    if (unsubscribeEmployees) {

        unsubscribeEmployees();

    }

    const q = query(

        collection(db, "employees"),

        orderBy("createdAt", "desc")

    );

    unsubscribeEmployees = onSnapshot(

        q,

        snapshot => {

            employees.length = 0;

            snapshot.forEach(docSnap => {

                employees.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            });

            renderTable();

            updateCards();

        },

        error => {

            console.error(

                "Employees Listener Error:",

                error

            );

        }

    );

}

// ======================================================
// Employees Table v2 Professional
// الجزء الثاني
// ======================================================

function renderTable(list = employees) {

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!list.length) {

        tableBody.innerHTML = `

<tr>

<td colspan="7" class="text-center">

لا يوجد موظفون

</td>

</tr>

`;

        return;

    }

    list.forEach(employee => {

        let statusClass = "status-active";

        switch (employee.status) {

            case "إجازة":
                statusClass = "status-leave";
                break;

            case "موقوف":
                statusClass = "status-suspended";
                break;

            default:
                statusClass = "status-active";
                break;

        }

        tableBody.innerHTML += `

<tr>

<td>

<strong>

${employee.name || "-"}

</strong>

</td>

<td>

${employee.phone || "-"}

</td>

<td>

${employee.role || "-"}

</td>

<td>

${money(employee.salary)}

</td>

<td>

<span class="employee-status ${statusClass}">

${employee.status || "نشط"}

</span>

</td>

<td>

${employee.hireDate || "-"}

</td>

<td>

<div class="action-buttons">

<button
class="edit-btn"
data-id="${employee.id}"
title="تعديل">

<i class="fas fa-pen"></i>

</button>

<button
class="salary-btn"
data-id="${employee.id}"
title="صرف الراتب">

<i class="fas fa-money-bill-wave"></i>

</button>

<button
class="delete-btn"
data-id="${employee.id}"
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

// ======================================================
// Dashboard Cards
// ======================================================

function updateCards() {

    if (employeesCount) {

        employeesCount.textContent =

            employees.length;

    }

    if (activeEmployees) {

        activeEmployees.textContent =

            employees.filter(employee =>

                employee.status === "نشط"

            ).length;

    }

    if (driversCount) {

        driversCount.textContent =

            employees.filter(employee =>

                employee.role === "سائق"

            ).length;

    }

    // إجمالي الرواتب (جاهز للاستخدام لاحقاً)

    const totalSalary = employees.reduce(

        (sum, employee) =>

            sum + safeNumber(employee.salary),

        0

    );

    window.employeeStatistics = {

        employees: employees.length,

        active:

            employees.filter(

                e => e.status === "نشط"

            ).length,

        drivers:

            employees.filter(

                e => e.role === "سائق"

            ).length,

        totalSalary

    };

}

// ======================================================
// Employee Save & Edit v2 Professional
// الجزء الثالث
// ======================================================

// ==========================================
// حفظ الموظف
// ==========================================

if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const saveButton = form.querySelector("button[type='submit']");

        if (saveButton) {

            saveButton.disabled = true;

        }

        const name = safeText(document.getElementById("employeeName").value);
        const phone = safeText(document.getElementById("employeePhone").value);
        const role = document.getElementById("employeeRole").value;
        const salary = safeNumber(document.getElementById("employeeSalary").value);
        const status = document.getElementById("employeeStatus").value;
        const hireDate = document.getElementById("hireDate").value;
        const notes = safeText(document.getElementById("employeeNotes").value);

        // ===============================
        // التحقق من البيانات
        // ===============================

        if (!name) {

            alert("يرجى إدخال اسم الموظف.");

            if (saveButton) saveButton.disabled = false;

            return;

        }

        if (!phone) {

            alert("يرجى إدخال رقم الجوال.");

            if (saveButton) saveButton.disabled = false;

            return;

        }

        if (salary < 0) {

            alert("قيمة الراتب غير صحيحة.");

            if (saveButton) saveButton.disabled = false;

            return;

        }

        // ===============================
        // منع تكرار رقم الجوال
        // ===============================

        const duplicate = employees.find(emp =>

            emp.phone === phone &&

            emp.id !== editId

        );

        if (duplicate) {

            alert("رقم الجوال مستخدم لموظف آخر.");

            if (saveButton) saveButton.disabled = false;

            return;

        }

        const employeeData = {

            name,
            phone,
            role,
            salary,
            status,
            hireDate,
            notes

        };

        try {

            if (editId) {

                await updateDoc(

                    doc(db, "employees", editId),

                    employeeData

                );

            }

            else {

                employeeData.createdDate =

                    new Date().toLocaleDateString("ar-SA");

                employeeData.createdAt =

                    serverTimestamp();

                await addDoc(

                    collection(db, "employees"),

                    employeeData

                );

            }

            closeModal();

            form.reset();

            editId = null;

        }

        catch (error) {

            console.error(

                "Employee Save Error:",

                error

            );

            alert("حدث خطأ أثناء حفظ الموظف.");

        }

        finally {

            if (saveButton) {

                saveButton.disabled = false;

            }

        }

    });

}

// ==========================================
// تعديل موظف
// ==========================================

function editEmployee(id) {

    const employee = employees.find(

        emp => emp.id === id

    );

    if (!employee) return;

    editId = id;

    document.getElementById("employeeModalTitle").textContent =

        "تعديل الموظف";

    document.getElementById("employeeName").value =
        employee.name || "";

    document.getElementById("employeePhone").value =
        employee.phone || "";

    document.getElementById("employeeRole").value =
        employee.role || "عامل";

    document.getElementById("employeeSalary").value =
        employee.salary || 0;

    document.getElementById("employeeStatus").value =
        employee.status || "نشط";

    document.getElementById("hireDate").value =
        employee.hireDate || "";

    document.getElementById("employeeNotes").value =
        employee.notes || "";

    modal.classList.remove("hidden");

}

// ======================================================
// Employees Actions v2 Professional
// الجزء الرابع
// ======================================================

// ==========================================
// حذف موظف
// ==========================================

async function removeEmployee(id) {

    const employee = employees.find(

        emp => emp.id === id

    );

    if (!employee) return;

    const confirmed = confirm(

        `هل تريد حذف الموظف "${employee.name}" ؟`

    );

    if (!confirmed) return;

    try {

        await deleteDoc(

            doc(db, "employees", id)

        );

    }

    catch (error) {

        console.error(

            "Delete Employee Error:",

            error

        );

        alert("تعذر حذف الموظف.");

    }

}

// ==========================================
// تسجيل صرف راتب
// ==========================================

async function recordSalary(id) {

    const employee = employees.find(

        emp => emp.id === id

    );

    if (!employee) return;

    const confirmed = confirm(

        `تأكيد صرف راتب ${employee.name} ؟`

    );

    if (!confirmed) return;

    const today = new Date();

    try {

        await addDoc(

            collection(db, "salaryPayments"),

            {

                employeeId: employee.id,

                employeeName: employee.name,

                role: employee.role,

                amount: safeNumber(employee.salary),

                paymentDate: today.toLocaleDateString("ar-SA"),

                paymentMonth: today.getMonth() + 1,

                paymentYear: today.getFullYear(),

                createdAt: serverTimestamp()

            }

        );

        alert("تم تسجيل عملية صرف الراتب بنجاح.");

    }

    catch (error) {

        console.error(

            "Salary Payment Error:",

            error

        );

        alert("حدث خطأ أثناء تسجيل صرف الراتب.");

    }

}

// ==========================================
// البحث والفلترة
// ==========================================

function filterEmployees() {

    const keyword = safeText(

        searchInput?.value

    ).toLowerCase();

    const role = roleFilter?.value || "";

    const filtered = employees.filter(employee => {

        const searchMatch =

            (employee.name || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (employee.phone || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (employee.role || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (employee.status || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (employee.notes || "")
            .toLowerCase()
            .includes(keyword);

        const roleMatch =

            role === ""

            ||

            employee.role === role;

        return searchMatch && roleMatch;

    });

    renderTable(filtered);

}

// ==========================================
// البحث المباشر
// ==========================================

if (searchInput) {

    searchInput.addEventListener(

        "input",

        filterEmployees

    );

}

// ==========================================
// الفلترة
// ==========================================

if (roleFilter) {

    roleFilter.addEventListener(

        "change",

        filterEmployees

    );

}

// ==========================================
// تحديث يدوي
// ==========================================

if (refreshBtn) {

    refreshBtn.addEventListener(

        "click",

        () => {

            renderTable();

            updateCards();

        }

    );

}


// ======================================================
// Employees Controls v2 Professional
// الجزء الخامس والأخير
// ======================================================

// ==========================================
// إعادة ربط أزرار الجدول
// ==========================================

function bindButtons() {

    document.querySelectorAll(".edit-btn").forEach(button => {

        button.addEventListener("click", () => {

            editEmployee(button.dataset.id);

        });

    });

    document.querySelectorAll(".delete-btn").forEach(button => {

        button.addEventListener("click", () => {

            removeEmployee(button.dataset.id);

        });

    });

    document.querySelectorAll(".salary-btn").forEach(button => {

        button.addEventListener("click", () => {

            recordSalary(button.dataset.id);

        });

    });

}

// ==========================================
// تنظيف الموارد
// ==========================================

function cleanup() {

    if (unsubscribeEmployees) {

        unsubscribeEmployees();

        unsubscribeEmployees = null;

    }

}

// ==========================================
// قبل إغلاق الصفحة
// ==========================================

window.addEventListener(

    "beforeunload",

    cleanup

);

// ==========================================
// تشغيل الصفحة
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        loadEmployees();

    }

);

// ==========================================
// أدوات إضافية
// ==========================================

function getEmployeeById(id) {

    return employees.find(

        employee => employee.id === id

    );

}

function getEmployeesByRole(role) {

    return employees.filter(

        employee => employee.role === role

    );

}

function getActiveEmployees() {

    return employees.filter(

        employee => employee.status === "نشط"

    );

}

function calculateTotalSalaries() {

    return employees.reduce(

        (total, employee) =>

            total + safeNumber(employee.salary),

        0

    );

}

function calculateAverageSalary() {

    if (!employees.length) return 0;

    return (

        calculateTotalSalaries()

        /

        employees.length

    );

}

window.employeeHelpers = {

    getEmployeeById,

    getEmployeesByRole,

    getActiveEmployees,

    calculateTotalSalaries,

    calculateAverageSalary

};

// ==========================================
// معلومات المطور
// ==========================================

console.log(

    "%cLama Laundry ERP v2 Professional",

    "color:#0d6efd;font-size:16px;font-weight:bold;"

);

console.log(

    "Employees Module Loaded Successfully"

);
