import { db, serverTimestamp } from "../../../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    where
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

/* ==========================
   Collections
========================== */

const ordersRef = collection(db, "orders");
const customersRef = collection(db, "customers");
const servicesRef = collection(db, "services");

/* ==========================
   Orders
========================== */

export async function getOrders() {

    const q = query(
        ordersRef,
        orderBy("createdAt", "desc")
    );

    return await getDocs(q);

}

export async function getOrder(id) {

    return await getDoc(doc(db, "orders", id));

}

export async function addOrder(data) {

    data.createdAt = serverTimestamp();

    return await addDoc(ordersRef, data);

}

export async function updateOrder(id, data) {

    return await updateDoc(
        doc(db, "orders", id),
        data
    );

}

export async function deleteOrder(id) {

    return await deleteDoc(
        doc(db, "orders", id)
    );

}

/* ==========================
   Customers
========================== */

export async function getCustomers() {

    return await getDocs(customersRef);

}

/* ==========================
   Services
========================== */

export async function getServices() {

    return await getDocs(servicesRef);

}

/* ==========================
   Search
========================== */

export async function getOrdersByStatus(status){

    const q = query(
        ordersRef,
        where("status","==",status)
    );

    return await getDocs(q);

}