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

/*==================================================
    Lama Laundry ERP v2.1 Professional
    Services Module
==================================================*/

const COLLECTION_NAME = "services";

const servicesRef = collection(db, COLLECTION_NAME);

class ServiceManager {

    constructor() {

        this.state = {

            services: [],
            filtered: [],
            loading: false,
            unsubscribe: null,
            currentId: null

        };

        this.dom = {};

    }

    init() {

        this.cacheDOM();

        this.bindEvents();

        this.resetForm();

        this.subscribe();

    }

    cacheDOM() {

        this.dom.tableBody =
            document.getElementById("servicesTable");

        this.dom.modal =
            document.getElementById("serviceModal");

        this.dom.form =
            document.getElementById("serviceForm");

        this.dom.addBtn =
            document.getElementById("addServiceBtn");

        this.dom.cancelBtn =
            document.getElementById("cancelModal");

        this.dom.search =
            document.getElementById("searchService");

        this.dom.id =
            document.getElementById("serviceId");

        this.dom.name =
            document.getElementById("serviceName");

        this.dom.code =
            document.getElementById("serviceCode");

        this.dom.color =
            document.getElementById("serviceColor");

        this.dom.icon =
            document.getElementById("serviceIcon");

        this.dom.sort =
            document.getElementById("serviceSort");

        this.dom.active =
            document.getElementById("serviceActive");

        this.dom.price =
            document.getElementById("servicePrice");

        this.dom.duration =
            document.getElementById("serviceDuration");

        this.dom.category =
            document.getElementById("serviceCategory");

        this.dom.description =
            document.getElementById("serviceDescription");

    }

    bindEvents() {

        this.dom.addBtn?.addEventListener(
            "click",
            () => {

                this.resetForm();

                this.openModal();

            }
        );

        this.dom.cancelBtn?.addEventListener(
            "click",
            () => this.closeModal()
        );

        window.addEventListener(
            "click",
            (e) => {

                if (e.target === this.dom.modal) {

                    this.closeModal();

                }

            }
        );

        this.dom.search?.addEventListener(
            "input",
            () => this.search()
        );

        this.dom.form?.addEventListener(
            "submit",
            (e) => this.save(e)
        );

    }

    showLoading() {

        this.dom.tableBody.innerHTML = `

<tr>

<td colspan="12" class="text-center">

<i class="fas fa-spinner fa-spin"></i>

جاري تحميل الخدمات...

</td>

</tr>

`;

    }

    showEmpty() {

        this.dom.tableBody.innerHTML = `

<tr>

<td colspan="12" class="text-center">

لا توجد خدمات

</td>

</tr>

`;

    }

    showError(message) {

        this.dom.tableBody.innerHTML = `

<tr>

<td colspan="12" class="text-danger text-center">

${message}

</td>

</tr>

`;

    }

    toast(message, type = "success") {

        if (window.showToast) {

            window.showToast(message, type);

        } else {

            alert(message);

        }

    }

    openModal() {

        this.dom.modal.style.display = "flex";

    }

    closeModal() {

        this.dom.modal.style.display = "none";

    }

    resetForm() {

        this.dom.form.reset();

        this.dom.id.value = "";

        this.dom.color.value = "#0d6efd";

        this.dom.sort.value =
            this.state.services.length + 1;

        this.dom.active.value = "true";

        if (this.dom.price)
            this.dom.price.value = 0;

        if (this.dom.duration)
            this.dom.duration.value = 60;

        if (this.dom.category)
            this.dom.category.value = "الغسيل";

        if (this.dom.description)
            this.dom.description.value = "";

    }

    //========================================
    // Firebase Listener
    //========================================

    subscribe() {

        this.showLoading();

        if (this.state.unsubscribe) {

            this.state.unsubscribe();

        }

        const q = query(
            servicesRef,
            orderBy("sort", "asc")
        );

        this.state.unsubscribe = onSnapshot(

            q,

            (snapshot) => {

                this.state.services = [];

                snapshot.forEach((docSnap) => {

                    this.state.services.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                });

                this.state.filtered = [

                    ...this.state.services

                ];

                this.render();

            },

            (error) => {

                console.error(error);

                this.showError(

                    "تعذر تحميل الخدمات"

                );

            }

        );

    }

    //========================================
    // Search
    //========================================

    search() {

        const keyword = this.dom.search.value
            .trim()
            .toLowerCase();

        this.state.filtered =
            this.state.services.filter(service => {

                return (

                    (service.name || "")
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (service.code || "")
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (service.category || "")
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (service.description || "")
                    .toLowerCase()
                    .includes(keyword)

                );

            });

        this.render();

    }

    //========================================
    // Helpers
    //========================================

    badge(active) {

        return active

            ? `<span class="badge bg-success">نشطة</span>`

            : `<span class="badge bg-danger">معطلة</span>`;

    }

    currency(value) {

        return Number(value || 0)

            .toLocaleString("ar-SA", {

                minimumFractionDigits: 2,
                maximumFractionDigits: 2

            }) + " ر.س";

    }

    duration(minutes) {

        minutes = Number(minutes || 0);

        if (!minutes) return "-";

        if (minutes < 60) {

            return `${minutes} دقيقة`;

        }

        const h = Math.floor(minutes / 60);

        const m = minutes % 60;

        return m === 0

            ? `${h} ساعة`

            : `${h} ساعة ${m} دقيقة`;

    }

    //========================================
    // Render
    //========================================

    render() {

        if (!this.state.filtered.length) {

            this.showEmpty();

            return;

        }

        this.dom.tableBody.innerHTML = "";

        this.state.filtered.forEach(

            (service, index) => {

                this.dom.tableBody.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>

<div style="font-weight:600">

${service.name || "-"}

</div>

${service.description
? `<small style="color:#888">${service.description}</small>`
: ""}

</td>

<td>

<span class="badge bg-secondary">

${service.code || "-"}

</span>

</td>

<td>

<span
style="
display:inline-block;
width:18px;
height:18px;
border-radius:50%;
background:${service.color || "#0d6efd"};
border:1px solid #ddd;
">
</span>

</td>

<td>

<i class="${service.icon || "fas fa-soap"}"></i>

</td>

<td>

${service.category || "-"}

</td>

<td>

${this.currency(service.price)}

</td>

<td>

${this.duration(service.duration)}

</td>

<td>

${service.sort ?? "-"}

</td>
<td>

<button
class="action-btn edit-btn"
onclick="serviceManager.edit('${service.id}')">

<i class="fas fa-pen"></i>

</button>

${

service.active

? `<button
class="action-btn delete-btn"
onclick="serviceManager.disable('${service.id}')"
title="تعطيل">

<i class="fas fa-ban"></i>

</button>`

: `<button
class="action-btn"
style="background:#198754;color:#fff"
onclick="serviceManager.disable('${service.id}')"
title="تفعيل">

<i class="fas fa-check"></i>

</button>`

}

</td>

</tr>

`;

            }

        );

    }

    //========================================
    // Validation
    //========================================

    isDuplicateName(name, currentId = "") {

        const value = name.trim().toLowerCase();

        return this.state.services.some(service =>

            service.id !== currentId &&

            (service.name || "")
                .trim()
                .toLowerCase() === value

        );

    }

    isDuplicateCode(code, currentId = "") {

        const value = code.trim().toUpperCase();

        return this.state.services.some(service =>

            service.id !== currentId &&

            (service.code || "")
                .trim()
                .toUpperCase() === value

        );

    }

    //========================================
    // Save
    //========================================

    async save(e) {

        e.preventDefault();

        const id = this.dom.id.value.trim();

        const name = this.dom.name.value.trim();

        const code = this.dom.code.value
            .trim()
            .toUpperCase();

        if (!name) {

            this.toast(
                "يرجى إدخال اسم الخدمة",
                "error"
            );

            return;

        }

        if (!code) {

            this.toast(
                "يرجى إدخال رمز الخدمة",
                "error"
            );

            return;

        }

        if (this.isDuplicateName(name, id)) {

            this.toast(
                "اسم الخدمة موجود مسبقاً",
                "warning"
            );

            return;

        }

        if (this.isDuplicateCode(code, id)) {

            this.toast(
                "رمز الخدمة مستخدم مسبقاً",
                "warning"
            );

            return;

        }

        const data = {

            name,

            code,

            color: this.dom.color.value,

            icon: this.dom.icon.value.trim(),

            category: this.dom.category.value,

            description:
                this.dom.description.value.trim(),

            price: Number(
                this.dom.price.value || 0
            ),

            duration: Number(
                this.dom.duration.value || 0
            ),

            sort: Number(
                this.dom.sort.value || 0
            ),

            active:

                this.dom.active.value === "true",

            updatedAt:

                serverTimestamp()

        };

        try {

            if (id) {

                await updateDoc(

                    doc(db, COLLECTION_NAME, id),

                    data

                );

                this.toast(
                    "تم تحديث الخدمة بنجاح"
                );

            } else {

                data.createdAt =
                    serverTimestamp();

                data.usedCount = 0;

                await addDoc(

                    servicesRef,

                    data

                );

                this.toast(
                    "تمت إضافة الخدمة بنجاح"
                );

            }

            this.closeModal();

            this.resetForm();

        }

        catch (error) {

            console.error(error);

            this.toast(

                "تعذر حفظ البيانات",

                "error"

            );

        }

    }

    //========================================
    // Edit
    //========================================

    edit(id) {

        const service =

            this.state.services.find(

                s => s.id === id

            );

        if (!service) return;

        this.dom.id.value =
            service.id;

        this.dom.name.value =
            service.name || "";

        this.dom.code.value =
            service.code || "";

        this.dom.color.value =
            service.color || "#0d6efd";

        this.dom.icon.value =
            service.icon || "";

        this.dom.category.value =
            service.category || "";

        this.dom.description.value =
            service.description || "";

        this.dom.price.value =
            service.price || 0;

        this.dom.duration.value =
            service.duration || 60;

        this.dom.sort.value =
            service.sort || 1;

        this.dom.active.value =

            service.active

                ? "true"

                : "false";

        this.openModal();

    }

    //========================================
    // Disable Service
    //========================================
async disable(id) {

    const service = this.state.services.find(
        s => s.id === id
    );

    if (!service) return;

    const newStatus = !service.active;

    const message = newStatus
        ? `هل تريد تفعيل الخدمة "${service.name}"؟`
        : `هل تريد تعطيل الخدمة "${service.name}"؟`;

    if (!confirm(message)) return;

    try {

        await updateDoc(

            doc(db, COLLECTION_NAME, id),

            {

                active: newStatus,

                updatedAt: serverTimestamp()

            }

        );

        this.toast(

            newStatus
                ? "تم تفعيل الخدمة"
                : "تم تعطيل الخدمة"

        );

    }

    catch (error) {

        console.error(error);

        this.toast(
            "حدث خطأ",
            "error"
        );

    }

}

    //========================================
    // Permanent Delete
    //========================================

    async forceDelete(id) {

        const password = prompt(

            "أدخل كلمة مرور المدير"

        );

        if (password !== "admin123") {

            return;

        }

        try {

            await deleteDoc(

                doc(db, COLLECTION_NAME, id)

            );

            this.toast(

                "تم حذف الخدمة نهائياً"

            );

        }

        catch (error) {

            console.error(error);

            this.toast(

                "تعذر حذف الخدمة",

                "error"

            );

        }

    }

    //========================================
    // Sorting
    //========================================

    sort(field = "sort") {

        const compare = {

            name: (a, b) =>

                (a.name || "").localeCompare(

                    b.name || "",

                    "ar"

                ),

            price: (a, b) =>

                Number(a.price || 0) -

                Number(b.price || 0),

            duration: (a, b) =>

                Number(a.duration || 0) -

                Number(b.duration || 0),

            sort: (a, b) =>

                Number(a.sort || 0) -

                Number(b.sort || 0)

        };

        this.state.filtered.sort(

            compare[field] || compare.sort

        );

        this.render();

    }

}

//========================================
// Bootstrap
//========================================

const serviceManager = new ServiceManager();

window.serviceManager = serviceManager;

window.sortByName = () =>

    serviceManager.sort("name");

window.sortByPrice = () =>

    serviceManager.sort("price");

window.sortByDuration = () =>

    serviceManager.sort("duration");

window.sortByOrder = () =>

    serviceManager.sort("sort");

window.refreshServices = () =>

    serviceManager.subscribe();

window.forceDeleteService = (id) =>

    serviceManager.forceDelete(id);

document.addEventListener(

    "DOMContentLoaded",

    () => {

        serviceManager.init();

    }

);

//========================================
// Extra Utilities
//========================================

ServiceManager.prototype.exportData = function () {

    const data = JSON.stringify(

        this.state.services,

        null,

        2

    );

    const blob = new Blob(

        [data],

        {

            type: "application/json"

        }

    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "services-backup.json";

    link.click();

    URL.revokeObjectURL(url);

};

ServiceManager.prototype.importData = function (list = []) {

    if (!Array.isArray(list)) return;

    this.state.services = [...list];

    this.state.filtered = [...list];

    this.render();

};

//========================================
// Statistics
//========================================

ServiceManager.prototype.statistics = function () {

    return {

        total:

            this.state.services.length,

        active:

            this.state.services.filter(

                s => s.active

            ).length,

        inactive:

            this.state.services.filter(

                s => !s.active

            ).length,

        averagePrice:

            this.state.services.length

                ? this.state.services.reduce(

                    (sum, s) =>

                        sum + Number(s.price || 0),

                    0

                ) / this.state.services.length

                : 0

    };

};

//========================================
// Cleanup
//========================================

ServiceManager.prototype.destroy = function () {

    if (this.state.unsubscribe) {

        this.state.unsubscribe();

        this.state.unsubscribe = null;

    }

};

//========================================
// Global API
//========================================

window.exportServices = () =>

    serviceManager.exportData();

window.importServices = (list) =>

    serviceManager.importData(list);

window.serviceStatistics = () =>

    serviceManager.statistics();

//========================================
// End Of File
// Lama Laundry ERP v2.1 Professional
//========================================