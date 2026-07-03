

<script type="module" src="assets/js/tracking.js"></script>

import { db } from "../../firebase/firebase-config.js";
import {

doc,
getDoc

} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

window.searchOrder=async()=>{

const id=document.getElementById("orderId").value;

const ref=doc(db,"orders",id);

const snap=await getDoc(ref);

if(snap.exists()){

const d=snap.data();

document.getElementById("result").innerHTML=`

<h3>العميل : ${d.name}</h3>

<p>الخدمة : ${d.service}</p>

<p>الحالة : ${d.status}</p>

<p>التاريخ : ${d.date}</p>

<p>الوقت : ${d.time}</p>

`;

}else{

document.getElementById("result").innerHTML="❌ لم يتم العثور على طلب بهذا الرقم.";

}

};
<footer>

<p>

© 2026 مغاسل لمى الذكية - جميع الحقوق محفوظة

</p>

</footer>
</script>
