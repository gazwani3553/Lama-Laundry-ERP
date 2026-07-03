// ===========================================
// Lama Laundry ERP v1.0
// inventory.js
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
    orderBy,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ===========================================
// عناصر الصفحة
// ===========================================

const tableBody = document.getElementById("inventoryTableBody");
const form = document.getElementById("itemForm");
const modal = document.getElementById("itemModal");

const newBtn = document.getElementById("newItemBtn");
const closeBtn = document.getElementById("closeItemModal");
const cancelBtn = document.getElementById("cancelItemBtn");

const refreshBtn = document.getElementById("refreshInventory");

const searchInput = document.getElementById("searchItem");
const stockFilter = document.getElementById("stockFilter");

const items = [];

let editId = null;

let unsubscribe = null;

// ===========================================
// فتح وإغلاق النافذة
// ===========================================

if (newBtn && modal && form) {

    newBtn.onclick = () => {

        editId = null;

        form.reset();

        const title = document.getElementById("itemModalTitle");

        if (title) {

            title.textContent = "إضافة صنف";

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
// تحميل المخزون (Realtime)
// ===========================================

function loadInventory() {

    try {

        if (!tableBody) return;

        if (unsubscribe) {

            unsubscribe();

        }

        const q = query(

            collection(db, "inventory"),

            orderBy("createdAt", "desc")

        );

        unsubscribe = onSnapshot(

            q,

            (snapshot) => {

                items.length = 0;

                snapshot.forEach(docSnap => {

                    items.push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                });

                renderTable();

                updateCards();

            },

            (error) => {

                console.error(

                    "Realtime Inventory Error:",

                    error

                );

            }

        );

    }

    catch (error) {

        console.error(

            "Load Inventory Error:",

            error

        );

    }

}
// ===========================================
// رسم جدول المخزون
// ===========================================

function renderTable(list = items) {

    if (!tableBody) return;

    tableBody.innerHTML = "";

    list.forEach(item => {

        let status = "متوفر";
        let statusClass = "stock-ok";

        const qty = Number(item.quantity || 0);
        const min = Number(item.minimumQuantity || 0);

        if (qty <= 0) {

            status = "منتهي";
            statusClass = "stock-out";

        } else if (qty <= min) {

            status = "منخفض";
            statusClass = "stock-low";

        }

        tableBody.innerHTML += `

<tr>

<td>${item.code || "-"}</td>

<td>${item.name || "-"}</td>

<td>${item.category || "-"}</td>

<td>${qty}</td>

<td>${min}</td>

<td>${Number(item.unitPrice || 0).toFixed(2)} ر.س</td>

<td>

<span class="stock-status ${statusClass}">

${status}

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
class="plus-btn"
data-id="${item.id}"
title="إضافة للمخزون">

<i class="fas fa-plus"></i>

</button>

<button
class="minus-btn"
data-id="${item.id}"
title="صرف من المخزون">

<i class="fas fa-minus"></i>

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
// تحديث البطاقات
// ===========================================

function updateCards() {

    const itemsCount = document.getElementById("itemsCount");
    const lowStockCount = document.getElementById("lowStockCount");
    const inventoryValue = document.getElementById("inventoryValue");

    if (itemsCount) {

        itemsCount.textContent = items.length;

    }

    if (lowStockCount) {

        lowStockCount.textContent = items.filter(item =>

            Number(item.quantity || 0) <=
            Number(item.minimumQuantity || 0)

        ).length;

    }

    if (inventoryValue) {

        const totalValue = items.reduce((sum, item) => {

            return sum +

                Number(item.quantity || 0) *

                Number(item.unitPrice || 0);

        }, 0);

        inventoryValue.textContent =

            totalValue.toFixed(2) + " ر.س";

    }

}

// ===========================================
// ربط الأزرار
// ===========================================

function bindButtons() {

    document.querySelectorAll(".edit-btn").forEach(btn => {

        btn.onclick = () => editItem(btn.dataset.id);

    });

    document.querySelectorAll(".delete-btn").forEach(btn => {

        btn.onclick = () => removeItem(btn.dataset.id);

    });

    document.querySelectorAll(".plus-btn").forEach(btn => {

        btn.onclick = () => increaseStock(btn.dataset.id);

    });

    document.querySelectorAll(".minus-btn").forEach(btn => {

        btn.onclick = () => decreaseStock(btn.dataset.id);

    });

}

// ===========================================
// حفظ الصنف
// ===========================================

if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const data = {

            code: document.getElementById("itemCode").value.trim(),

            name: document.getElementById("itemName").value.trim(),

            category: document.getElementById("itemCategory").value.trim(),

            quantity: Number(document.getElementById("itemQuantity").value || 0),

            minimumQuantity: Number(document.getElementById("minimumQuantity").value || 0),

            unitPrice: Number(document.getElementById("unitPrice").value || 0),

            notes: document.getElementById("itemNotes").value.trim(),

            createdDate: new Date().toLocaleDateString("ar-SA")

        };

        if (!editId) {

            data.createdAt = serverTimestamp();

        }

        try {

            if (editId) {

                await updateDoc(

                    doc(db, "inventory", editId),

                    data

                );

            } else {

                await addDoc(

                    collection(db, "inventory"),

                    data

                );

            }

            if (modal) {

                modal.classList.add("hidden");

            }

            form.reset();

            editId = null;

            await loadInventory();

        } catch (error) {

            console.error("Save Inventory Error:", error);

            alert("حدث خطأ أثناء حفظ الصنف.");

        }

    });

}// ===========================================
// تعديل صنف
// ===========================================

function editItem(id) {

    const item = items.find(i => i.id === id);

    if (!item) return;

    editId = id;

    const title = document.getElementById("itemModalTitle");

    if (title) {

        title.textContent = "تعديل الصنف";

    }

    document.getElementById("itemCode").value =
        item.code || "";

    document.getElementById("itemName").value =
        item.name || "";

    document.getElementById("itemCategory").value =
        item.category || "";

    document.getElementById("itemQuantity").value =
        item.quantity || 0;

    document.getElementById("minimumQuantity").value =
        item.minimumQuantity || 0;

    document.getElementById("unitPrice").value =
        item.unitPrice || 0;

    document.getElementById("itemNotes").value =
        item.notes || "";

    if (modal) {

        modal.classList.remove("hidden");

    }

}

// ===========================================
// حذف صنف
// ===========================================

async function removeItem(id) {

    if (!confirm("هل تريد حذف هذا الصنف؟")) return;

    try {

        await deleteDoc(

            doc(db, "inventory", id)

        );

        await loadInventory();

    } catch (error) {

        console.error("Delete Inventory Error:", error);

        alert("تعذر حذف الصنف.");

    }

}

// ===========================================
// زيادة المخزون
// ===========================================

async function increaseStock(id) {

    const item = items.find(i => i.id === id);

    if (!item) return;

    const qty = Number(

        prompt("أدخل الكمية المراد إضافتها:", "1")

    );

    if (!Number.isFinite(qty) || qty <= 0) return;

    try {

        await updateDoc(

            doc(db, "inventory", id),

            {

                quantity: Number(item.quantity || 0) + qty

            }

        );

        await loadInventory();

    } catch (error) {

        console.error("Increase Stock Error:", error);

        alert("تعذر تحديث المخزون.");

    }

}

// ===========================================
// صرف من المخزون
// ===========================================

async function decreaseStock(id) {

    const item = items.find(i => i.id === id);

    if (!item) return;

    const qty = Number(

        prompt("أدخل الكمية المراد صرفها:", "1")

    );

    if (!Number.isFinite(qty) || qty <= 0) return;

    const newQty = Math.max(

        0,

        Number(item.quantity || 0) - qty

    );

    try {

        await updateDoc(

            doc(db, "inventory", id),

            {

                quantity: newQty

            }

        );

        await loadInventory();

    } catch (error) {

        console.error("Decrease Stock Error:", error);

        alert("تعذر تحديث المخزون.");

    }

}

// ===========================================
// البحث + الفلترة
// ===========================================

function filterInventory() {

    const keyword = (searchInput?.value || "")
        .trim()
        .toLowerCase();

    const stock = stockFilter?.value || "";

    const filtered = items.filter(item => {

        const qty = Number(item.quantity || 0);

        const min = Number(item.minimumQuantity || 0);

        const matchKeyword =

            (item.code || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (item.name || "")
                .toLowerCase()
                .includes(keyword);

        let matchStock = true;

        if (stock === "متوفر") {

            matchStock = qty > min;

        } else if (stock === "منخفض") {

            matchStock = qty > 0 && qty <= min;

        } else if (stock === "منتهي") {

            matchStock = qty <= 0;

        }

        return matchKeyword && matchStock;

    });

    renderTable(filtered);

}

if (searchInput) {

    searchInput.addEventListener(

        "input",

        filterInventory

    );

}

if (stockFilter) {

    stockFilter.addEventListener(

        "change",

        filterInventory

    );

}

// ===========================================
// تحديث البيانات
// ===========================================

if (refreshBtn) {

    refreshBtn.addEventListener(

        "click",

        loadInventory

    );

}

// ===========================================
// بدء التشغيل
// ===========================================

document.addEventListener("DOMContentLoaded", () => {

    loadInventory();

});


// ===========================================
// تنظيف الموارد
// ===========================================

window.addEventListener("beforeunload", () => {

    if (unsubscribe) {

        unsubscribe();

    }

});