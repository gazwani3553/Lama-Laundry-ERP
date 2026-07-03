import { db } from "../../firebase/firebase-config.js";

import {
collection,
query,
orderBy,
onSnapshot,
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const tbody = document.getElementById("driverBody");

const q = query(
    collection(db,"orders"),
    orderBy("createdAt","desc")
);

onSnapshot(q,(snapshot)=>{

    tbody.innerHTML="";

    snapshot.forEach((item)=>{

        const d = item.data();

        tbody.innerHTML += `

<tr>

<td>${d.orderNumber}</td>

<td>${d.name}</td>

<td>${d.address}</td>

<td>${d.status}</td>

<td>

<button onclick="pickup('${item.id}')">
استلام
</button>

<button onclick="deliver('${item.id}')">
تسليم
</button>

<button onclick="openMap('${d.address}')">
📍 الموقع
</button>

</td>
</tr>

`;

    });

});

window.pickup = async(id)=>{

    await updateDoc(doc(db,"orders",id),{

        status:"قيد التنفيذ"

    });

};

window.deliver = async(id)=>{

    await updateDoc(doc(db,"orders",id),{

        status:"تم التسليم"

    });

};
window.openMap = (address)=>{

window.open(

"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(address),

"_blank"

);

};