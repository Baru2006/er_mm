const GAS_URL= "https://script.google.com/macros/s/AKfycbxN4XqloXsVEenbEU9AeSUCEs2ivk6Y1Wi2MZ7_2LRp6cnrD0vnte8VQ28UTMmcxbc4/exec";

function copyAdminPhone(e){
var el=e.target;
var phone=el.getAttribute('data-phone')||el.dataset.phone;
navigator.clipboard.writeText(phone).then(function(){showMessageBox('Message','Copied: '+phone)}).catch(function(){showMessageBox('Message','Copy failed')});
}

function showMessageBox(title,msg){
var box=document.getElementById('messageBox')||document.querySelector('.message-box');
if(box){box.textContent=msg}
}

function populateSimPackages(){
var provider=document.getElementById('simProvider').value;
var select=document.getElementById('simPackage');
select.innerHTML='<option value="">Select Package</option>';
if(!provider){return}
for(var key in SERVICE_PRICES.sim){
if(key.indexOf(provider)!==-1){
var opt=document.createElement('option');
opt.value=key;
opt.textContent=SERVICE_PRICES.sim[key].name+' - '+SERVICE_PRICES.sim[key].price+' Ks';
select.appendChild(opt)
}
}
updateSimDescriptionAndPrice()
}

function updateSimDescriptionAndPrice(){
var sel=document.getElementById('simPackage').value;
var desc=document.getElementById('simServiceDesc');
var total=document.getElementById('simTotal');
if(!sel){desc.textContent='Choose a package to see details';total.textContent='0';return}
var s=SERVICE_PRICES.sim[sel];
desc.textContent=s.description;
total.textContent=(s.price*1).toString()
}

function updateGameDescriptionAndPrice(){
var sel=document.getElementById('gameService').value;
var desc=document.getElementById('gameServiceDesc');
var total=document.getElementById('gameTotal');
if(!sel){desc.textContent='Choose a game package';total.textContent='0';return}
var s=SERVICE_PRICES.game[sel];
desc.textContent=s.description;
total.textContent=(s.price*1).toString()
}

function updateSmmDescriptionAndPrice(){
var sel=document.getElementById('smmService').value;
var desc=document.getElementById('smmServiceDesc');
var unit=document.getElementById('smmUnitPrice');
var total=document.getElementById('smmTotal');
if(!sel){desc.textContent='Choose a service';unit.textContent='0';total.textContent='0';return}
var s=SERVICE_PRICES.smm[sel];
desc.textContent=s.description;
unit.textContent=s.price.toString();
updateSmmTotal()
}

function updateSmmTotal(){
var qty=parseInt(document.getElementById('smmQty').value||0,10);
var sel=document.getElementById('smmService').value;
if(!sel||isNaN(qty)){document.getElementById('smmTotal').textContent='0';return}
var unit=SERVICE_PRICES.smm[sel].price;
document.getElementById('smmTotal').textContent=(unit*qty).toString()
}

function updateP2PCalculation(){
var amount=parseFloat(document.getElementById('p2pAmount').value||0);
var from=document.getElementById('p2pFrom').value;
var to=document.getElementById('p2pTo').value;
var fee=0;
if(amount>0){fee=Math.round(amount*0.03)}
var receive=amount-fee;
document.getElementById('p2pFee').textContent=fee.toString();
document.getElementById('p2pReceive').textContent=(receive>0?receive.toString():'0');
}

function submitSimForm(e){
e.preventDefault();
var provider=document.getElementById('simProvider').value;
var pkg=document.getElementById('simPackage').value;
var phone=document.getElementById('simPhone').value;
var qty=document.getElementById('simQty').value;
var total=document.getElementById('simTotal').textContent;
var tx=document.getElementById('simTx').value;
if(!provider||!pkg||!phone||!tx){document.getElementById('simFormMessage').textContent='Please complete the form';return}
var payload={action:'submitSimOrder',provider:provider,service:pkg,phone:phone,qty:qty,total:total,transactionId:tx};
postToGAS(payload,'simForm','simFormMessage')
}

function submitGameForm(e){
e.preventDefault();
var service=document.getElementById('gameService').value;
var gameId=document.getElementById('gameId').value;
var qty=document.getElementById('gameQty').value;
var total=document.getElementById('gameTotal').textContent;
var tx=document.getElementById('gameTx').value;
if(!service||!gameId||!tx){document.getElementById('gameFormMessage').textContent='Please complete the form';return}
var payload={action:'submitGameOrder',gameService:service,gameId:gameId,qty:qty,total:total,transactionId:tx};
postToGAS(payload,'gameForm','gameFormMessage')
}

function submitSmmForm(e){
e.preventDefault();
var service=document.getElementById('smmService').value;
var link=document.getElementById('smmLink').value;
var qty=document.getElementById('smmQty').value;
var total=document.getElementById('smmTotal').textContent;
var tx=document.getElementById('smmTx').value;
if(!service||!link||!qty||!tx){document.getElementById('smmFormMessage').textContent='Please complete the form';return}
var payload={action:'submitSmmOrder',platform:service,serviceKey:service,targetLink:link,qty:qty,total:total,transactionId:tx};
postToGAS(payload,'smmForm','smmFormMessage')
}

function submitP2PForm(e){
e.preventDefault();
var amount=parseFloat(document.getElementById('p2pAmount').value||0);
var from=document.getElementById('p2pFrom').value;
var to=document.getElementById('p2pTo').value;
var tx=document.getElementById('p2pTx').value;
if(!amount||!from||!to||!tx){document.getElementById('p2pFormMessage').textContent='Please complete the form';return}
if(from===to){document.getElementById('p2pFormMessage').textContent='From and To methods must be different';return}
var fee=Math.round(amount*0.03);
var receive=amount-fee;
var payload={action:'submitP2POrder',fromMethod:from,toMethod:to,amount:amount,fee:fee,receive:receive,transactionId:tx};
postToGAS(payload,'p2pForm','p2pFormMessage')
}

function postToGAS(payload,formId,messageId){
var messageEl=document.getElementById(messageId);
messageEl.textContent='Sending...';
fetch(GAS_URL,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify(payload)
}).then(function(res){return res.json()}).then(function(data){
if(data && data.success){messageEl.textContent='Order submitted. OrderID: '+data.orderId;var form=document.getElementById(formId);if(form){form.reset();var boxes=document.querySelectorAll('.message-box');if(boxes.length){boxes[0].textContent='Thank you'}}}else{messageEl.textContent='Submission failed: '+(data.error||'Unknown')}}
).catch(function(err){messageEl.textContent='Submission error';})
}

function searchOrders(){
var q=document.getElementById('statusQuery').value;
if(!q){document.getElementById('statusResults').innerHTML='<div class="message-box">Enter search term</div>';return}
fetch(GAS_URL+'?action=getOrders&q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(res){
if(res && res.orders){
var html='<table class="results-table"><tr><th>OrderID</th><th>Category</th><th>Service</th><th>Phone/Link</th><th>Total</th><th>Status</th><th>Time</th></tr>';
res.orders.forEach(function(o){html+='<tr><td>'+o.OrderID+'</td><td>'+o.Category+'</td><td>'+o.Service+'</td><td>'+(o.Phone||o.TargetLink||o.GameID||'')+'</td><td>'+o.Total+'</td><td>'+o.Status+'</td><td>'+o.Timestamp+'</td></tr>'});
html+='</table>';
document.getElementById('statusResults').innerHTML=html;
}else{document.getElementById('statusResults').innerHTML='<div class="message-box">No orders found</div>'}
}).catch(function(){document.getElementById('statusResults').innerHTML='<div class="message-box">Error fetching orders</div>'})
}

function fetchStats(){
fetch(GAS_URL+'?action=getStats').then(function(r){return r.json()}).then(function(s){
if(s && s.stats){document.getElementById('totalOrders').textContent=s.stats.totalOrders||'0';document.getElementById('todayRevenue').textContent=(s.stats.todayRevenue||0).toString();document.getElementById('pendingOrders').textContent=(s.stats.pending||0).toString()}}
).catch(function(){})
  }
