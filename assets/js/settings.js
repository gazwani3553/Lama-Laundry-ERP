// ===========================================
// Lama Laundry ERP v1.0
// settings.js
// الجزء الأول
// ===========================================

import { db } from "../../firebase/firebase-config.js";

import {
    doc,
    onSnapshot,
    setDoc,
    getDocs,
    collection
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ===========================================
// عناصر الصفحة
// ===========================================

const saveBtn = document.getElementById("saveSettings");

const backupBtn = document.getElementById("backupBtn");

const restoreBtn = document.getElementById("restoreBtn");

const restoreFile = document.getElementById("restoreFile");

const themeMode = document.getElementById("themeMode");

// ===========================================
// تحميل الإعدادات
// ===========================================
let unsubscribeSettings = null;

function loadSettings() {

    const ref = doc(db, "settings", "system");

    if (unsubscribeSettings) {

        unsubscribeSettings();

    }

    unsubscribeSettings = onSnapshot(ref, (snap) => {

        if (!snap.exists()) return;

        const settings = snap.data();

        document.getElementById("laundryName").value =
            settings.laundryName || "";

        document.getElementById("laundryPhone").value =
            settings.laundryPhone || "";

        document.getElementById("laundryAddress").value =
            settings.laundryAddress || "";

        document.getElementById("invoicePrefix").value =
            settings.invoicePrefix || "INV";

        document.getElementById("vatRate").value =
            settings.vatRate ?? 15;

        document.getElementById("currency").value =
            settings.currency || "ر.س";

        document.getElementById("systemLanguage").value =
            settings.systemLanguage || "ar";

        document.getElementById("themeMode").value =
            settings.themeMode || "light";

        document.getElementById("autoPrint").value =
            settings.autoPrint || "yes";

    }, (error) => {

        console.error("Load Settings Error:", error);

    });

}
// ===========================================
// حفظ الإعدادات
// ===========================================

if (saveBtn) {

    saveBtn.addEventListener("click", async () => {

        const data = {

            laundryName:
                document.getElementById("laundryName")?.value.trim() || "",

            laundryPhone:
                document.getElementById("laundryPhone")?.value.trim() || "",

            laundryAddress:
                document.getElementById("laundryAddress")?.value.trim() || "",

            invoicePrefix:
                document.getElementById("invoicePrefix")?.value.trim() || "INV",

            vatRate:
                Number(document.getElementById("vatRate")?.value || 15),

            currency:
                document.getElementById("currency")?.value || "ر.س",

            systemLanguage:
                document.getElementById("systemLanguage")?.value || "ar",

            themeMode:
                document.getElementById("themeMode")?.value || "light",

            autoPrint:
                document.getElementById("autoPrint")?.value || "yes"

        };

        try {

            await setDoc(

                doc(db, "settings", "system"),

                data,

                {

                    merge: true

                }

            );

            alert("تم حفظ الإعدادات بنجاح.");

        } catch (error) {

            console.error("Save Settings Error:", error);

            alert("تعذر حفظ الإعدادات.");

        }

    });

}

// ===========================================
// إنشاء نسخة احتياطية
// ===========================================

if (backupBtn) {

    backupBtn.addEventListener("click", async () => {

        try {

            backupBtn.disabled = true;

    const collections = [

    "orders",
    "customers",
    "invoices",
    "inventory",
    "employees",
    "services",
    "pickups",
    "deliveries",
    "settings"

];
            const backup = {};

            for (const collectionName of collections) {

                const snapshot = await getDocs(

                    collection(db, collectionName)

                );

                backup[collectionName] = [];

                snapshot.forEach(docSnap => {

                    backup[collectionName].push({

                        id: docSnap.id,

                        ...docSnap.data()

                    });

                });

            }

            const blob = new Blob(

                [

                    JSON.stringify(

                        backup,

                        null,

                        2

                    )

                ],

                {

                    type: "application/json"

                }

            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =

                `lama-laundry-backup-${new Date().toISOString().slice(0,10)}.json`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            notify("تم إنشاء النسخة الاحتياطية بنجاح.");

        } catch (error) {

            console.error("Backup Error:", error);

           notify("تعذر إنشاء النسخة الاحتياطية.");

        } finally {

            backupBtn.disabled = false;

        }

    });

}// ===========================================
// استعادة نسخة احتياطية
// ===========================================

if (restoreBtn && restoreFile) {

    restoreBtn.addEventListener("click", () => {

        restoreFile.click();

    });

    restoreFile.addEventListener("change", async (e) => {

        try {

            const file = e.target.files[0];

            if (!file) return;

            const text = await file.text();

            const backup = JSON.parse(text);

            const confirmRestore = confirm(
                "سيتم استعادة جميع البيانات من النسخة الاحتياطية، هل تريد المتابعة؟"
            );

            if (!confirmRestore) {

                restoreFile.value = "";

                return;

            }

            restoreBtn.disabled = true;

            for (const collectionName of Object.keys(backup)) {

                const documents = backup[collectionName];

                if (!Array.isArray(documents)) continue;

                for (const item of documents) {

                    if (!item.id) continue;

                    const id = item.id;

                    const data = { ...item };

                    delete data.id;

                    await setDoc(

                        doc(db, collectionName, id),

                        data,

                        {

                            merge: true

                        }

                    );

                }

            }

          notify("تمت استعادة النسخة الاحتياطية بنجاح.");

        } catch (error) {

            console.error("Restore Error:", error);

          notify("تعذر استعادة النسخة الاحتياطية.");

        } finally {

            restoreBtn.disabled = false;

            restoreFile.value = "";

        }

    });

}

// ===========================================
// الوضع الداكن
// ===========================================

if (themeMode) {

    themeMode.addEventListener("change", (event) => {

        document.body.dataset.theme = event.target.value;

    });

}

// ===========================================
// بدء التشغيل
// ===========================================
document.addEventListener("DOMContentLoaded", () => {

    loadSettings();

});

window.addEventListener("beforeunload", () => {

    if (unsubscribeSettings) {

        unsubscribeSettings();

    }

});
// ===========================================
// نهاية الملف
// ===========================================