const GAS_URL = 'https://script.google.com/macros/s/AKfycbycXyGUk_E-T-eGpo6RxCUkfLWBmKMgtwPK6wx5g-KuiY7qB1T9YDYQ-JRC9nIR-saTTg/exec';
let userId = localStorage.getItem('userId');
let role = localStorage.getItem('role') || 'Customer';

if(!userId) {
  userId = 'USER' + Date.now();
  localStorage.setItem('userId', userId);
  localStorage.setItem('role', role);
}

document.addEventListener('DOMContentLoaded',()=>{
  const uidEl = document.getElementById('user-id');
  const roleEl = document.getElementById('user-role');
  if(uidEl) uidEl.textContent = userId;
  if(roleEl) roleEl.textContent = role;
  roleEl.classList.add(role.toLowerCase());
});

function copyAdminPhone(){
  const phone = document.getElementById('adminPhone');
  phone.select();
  phone.setSelectionRange(0, 99999);
  document.execCommand('copy');
  alert('Admin phone copied');
}

function calculateTotalPrice(form, itemField='package', qtyField='qty', priceField='totalPrice'){
  const item = form.querySelector(`#${itemField}`).value;
  const qty = parseInt(form.querySelector(`#${qtyField}`).value);
  form.querySelector(`#${priceField}`).value = getPrice(item, role, qty);
}

async function submitForm(formId, category){
  const form = document.getElementById(formId);
  form.addEventListener('submit', async(e)=>{
    e.preventDefault();
    let data = {};
    [...form.elements].forEach(el=>{
      if(el.id) data[el.id] = el.value;
    });
    data.userId = userId;
    data.role = role;
    data.category = category;
    const resp = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await resp.json();
    alert(result.message || 'Order submitted');
  });
}

function calculateP2PReceive(){
  const amountEl = document.getElementById('amount');
  const receiveEl = document.getElementById('receiveAmount');
  amountEl.addEventListener('input', ()=>{
    const amount = parseFloat(amountEl.value)||0;
    receiveEl.value = amount - (amount*0.02);
  });
}

function initStatusPage(){
  fetch(GAS_URL, { method:'GET', mode:'cors' })
  .then(res=>res.json())
  .then(data=>{
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';
    data.orders.forEach(order=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${order.OrderID}</td><td>${order.Category}</td><td>${order.Service||order.Game||order.Platform}</td>
                      <td>${order.Qty||order.Amount}</td><td>${order.Total||order.Receive}</td><td>${order.Status}</td>
                      <td>${order.UserID}</td><td>${order.Role}</td>`;
      tbody.appendChild(tr);
    });
  });
      }
