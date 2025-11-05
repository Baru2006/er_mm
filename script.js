const GAS_URL = 'https://script.google.com/macros/s/AKfycbxX6WSqelBOxXYrCG_QsVVMduUvC1WzZMyRhHE3tNcZgDeXg7XrEQCSLh9wXcPQoInCLQ/exec';

document.getElementById('theme-toggle')?.addEventListener('click',()=>{
document.body.classList.toggle('dark');
localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light');
});
if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');

const simPackages = {MPT:{'3GB':1500,'5GB':2500},Telenor:{'1GB':1000},Ooredoo:{'2GB':2000}};
const gamePackages = {'Free Fire':3000,'PUBG':2000,'Mobile Legends':2500};
const smmPrices = {Facebook:2000,Instagram:4000,YouTube:8000};

function populateSimPackages(){
const network=document.getElementById('network');
const pkg=document.getElementById('package');
network?.addEventListener('change',()=>{
pkg.innerHTML='';
const nets=simPackages[network.value];
for(const p in nets){const o=document.createElement('option');o.value=p;o.text=`${p} - ${nets[p]} MMK`;pkg.appendChild(o);}
calculateSimTotal();
});
document.getElementById('qty')?.addEventListener('input',calculateSimTotal);
document.getElementById('package')?.addEventListener('change',calculateSimTotal);
network?.dispatchEvent(new Event('change'));
}

function calculateSimTotal(){
const network=document.getElementById('network').value;
const pkg=document.getElementById('package').value;
const qty=parseInt(document.getElementById('qty').value);
const total=simPackages[network][pkg]*qty;
document.getElementById('total').value=total;
}

function populateGamePackages(){
document.getElementById('game')?.addEventListener('change',calculateGameTotal);
document.getElementById('qty')?.addEventListener('input',calculateGameTotal);
calculateGameTotal();
}

function calculateGameTotal(){
const game=document.getElementById('game').value;
const qty=parseInt(document.getElementById('qty').value);
document.getElementById('total').value=gamePackages[game]*qty;
}

function populateSMMPrices(){
document.getElementById('platform')?.addEventListener('change',calculateSMMTotal);
document.getElementById('qty')?.addEventListener('input',calculateSMMTotal);
calculateSMMTotal();
}

function calculateSMMTotal(){
const plat=document.getElementById('platform').value;
const qty=parseInt(document.getElementById('qty').value);
document.getElementById('total').value=smmPrices[plat]*qty;
}

function calculateP2P(){
const amt=parseFloat(document.getElementById('amount').value);
const fee=(amt*0.02).toFixed(0);
document.getElementById('fee').value=fee;
document.getElementById('receive').value=(amt-fee).toFixed(0);
}

function submitOrderForm(e){
e.preventDefault();
const form=e.target;
const data={};
form.querySelectorAll('input,select').forEach(inp=>data[inp.id]=inp.value);
fetch(GAS_URL,{method:'POST',body:JSON.stringify(data)}).then(r=>r.json()).then(res=>{
if(res.success){alert('Order submitted! TXID: '+res.txid);form.reset();}});
}

function fetchOrders(){
fetch(GAS_URL+'?action=getOrders').then(r=>r.json()).then(data=>{
const list=document.getElementById('orders-list');list.innerHTML='';
data.forEach(o=>{const div=document.createElement('div');div.className='card';
div.innerHTML=`<p>OrderID: ${o.OrderID}</p><p>Service: ${o.Service}</p><p>Status: ${o.Status}</p>`;list.appendChild(div);});
});
}

function fetchStats(){
fetch(GAS_URL+'?action=getStats').then(r=>r.json()).then(s=>{
document.getElementById('total-orders').innerText=s.totalOrders;
document.getElementById('total-revenue').innerText=s.totalRevenue+' MMK';
});
    }
