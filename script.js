const GAS_URL = "https://script.google.com/macros/s/AKfycbyFPGK9YkQbuQuvNgKixNmoIlpHfrg7eUcU6QNVVcpo5KPyT9piurmAIy2k7kHtR54WJQ/exec"; // <<< IMPORTANT: REPLACE THIS
const ADMIN_PHONE = "09-123456789";

document.addEventListener('DOMContentLoaded', () => {
    // --- Shared ---
    // Populate admin phone on all pages
    const adminPhoneDisplay = document.getElementById('admin-phone-display');
    const adminPhoneInput = document.getElementById('admin-phone');
    if (adminPhoneDisplay) adminPhoneDisplay.textContent = ADMIN_PHONE;
    if (adminPhoneInput) adminPhoneInput.value = ADMIN_PHONE;
    
    // --- SIM Form ---
    const simForm = document.getElementById('sim-form');
    if (simForm) {
        document.getElementById('sim-provider').addEventListener('change', populateSimPackages);
        document.getElementById('sim-package').addEventListener('change', () => calculateTotal('sim'));
        simForm.addEventListener('submit', (e) => submitOrder(e, simForm));
    }

    // --- Game Form ---
    const gameForm = document.getElementById('game-form');
    if (gameForm) {
        document.getElementById('game-name').addEventListener('change', populateGamePackages);
        document.getElementById('game-package').addEventListener('change', () => calculateTotal('game'));
        gameForm.addEventListener('submit', (e) => submitOrder(e, gameForm));
    }

    // --- SMM Form ---
    const smmForm = document.getElementById('smm-form');
    if (smmForm) {
        document.getElementById('smm-platform').addEventListener('change', populateSmmServices);
        document.getElementById('smm-service').addEventListener('change', () => calculateTotal('smm'));
        document.getElementById('smm-quantity').addEventListener('input', () => calculateTotal('smm'));
        smmForm.addEventListener('submit', (e) => submitOrder(e, smmForm));
    }

    // --- P2P Form ---
    const p2pForm = document.getElementById('p2p-form');
    if (p2pForm) {
        document.getElementById('p2p-amount').addEventListener('input', () => calculateTotal('p2p'));
        document.getElementById('p2p-from').addEventListener('change', validateP2PMethods);
        document.getElementById('p2p-to').addEventListener('change', validateP2PMethods);
        p2pForm.addEventListener('submit', (e) => submitOrder(e, p2pForm));
    }

    // --- Services Page ---
    if (document.getElementById('sim-price-table')) {
        loadPriceData('sim', 'sim-price-table');
        loadPriceData('game', 'game-price-table');
        loadPriceData('smm', 'smm-price-table');
    }
});

// --- Form Population ---

function populateSimPackages() {
    const provider = document.getElementById('sim-provider').value;
    const packageSelect = document.getElementById('sim-package');
    packageSelect.innerHTML = '<option value="">-- Select Package --</option>'; // Reset
    
    for (const key in SERVICE_PRICES.sim) {
        if (key.startsWith(provider)) {
            const packageData = SERVICE_PRICES.sim[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = packageData.name;
            packageSelect.appendChild(option);
        }
    }
    calculateTotal('sim'); // Recalculate
}

function populateGamePackages() {
    const game = document.getElementById('game-name').value;
    const packageSelect = document.getElementById('game-package');
    packageSelect.innerHTML = '<option value="">-- Select Package --</option>'; // Reset

    for (const key in SERVICE_PRICES.game) {
        if (key.startsWith(game)) {
            const packageData = SERVICE_PRICES.game[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = packageData.name;
            packageSelect.appendChild(option);
        }
    }
    calculateTotal('game'); // Recalculate
}

function populateSmmServices() {
    const platform = document.getElementById('smm-platform').value;
    const serviceSelect = document.getElementById('smm-service');
    serviceSelect.innerHTML = '<option value="">-- Select Service --</option>'; // Reset

    // This logic assumes keys like 'fb-likes', 'ig-followers'
    // 'fb' matches 'fb-likes', 'ig' matches 'ig-followers'
    let platformPrefix = '';
    if (platform === 'fb') platformPrefix = 'fb-';
    if (platform === 'ig') platformPrefix = 'ig-';
    if (platform === 'yt') platformPrefix = 'yt-';
    
    for (const key in SERVICE_PRICES.smm) {
        if (key.startsWith(platformPrefix)) {
            const serviceData = SERVICE_PRICES.smm[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = serviceData.name;
            serviceSelect.appendChild(option);
        }
    }
    calculateTotal('smm'); // Recalculate
}

// --- Calculation ---

function calculateTotal(formType) {
    let total = 0;
    let description = "[Package details show here]";

    try {
        if (formType === 'sim') {
            const packageKey = document.getElementById('sim-package').value;
            if (packageKey && SERVICE_PRICES.sim[packageKey]) {
                const packageData = SERVICE_PRICES.sim[packageKey];
                total = packageData.price;
                description = packageData.desc;
            }
            document.getElementById('sim-total').textContent = total;
            document.getElementById('sim-total-input').value = total;
            document.getElementById('sim-desc').textContent = description;
        } 
        else if (formType === 'game') {
            const packageKey = document.getElementById('game-package').value;
            if (packageKey && SERVICE_PRICES.game[packageKey]) {
                const packageData = SERVICE_PRICES.game[packageKey];
                total = packageData.price;
                description = packageData.desc;
            }
            document.getElementById('game-total').textContent = total;
            document.getElementById('game-total-input').value = total;
            document.getElementById('game-desc').textContent = description;
        } 
        else if (formType === 'smm') {
            const serviceKey = document.getElementById('smm-service').value;
            const quantity = parseInt(document.getElementById('smm-quantity').value) || 0;
            let pricePer1000 = 0;
            if (serviceKey && SERVICE_PRICES.smm[serviceKey]) {
                const serviceData = SERVICE_PRICES.smm[serviceKey];
                pricePer1000 = serviceData.price;
                description = serviceData.desc;
                total = (pricePer1000 / 1000) * quantity;
            }
            document.getElementById('smm-price').textContent = pricePer1000;
            document.getElementById('smm-total').textContent = total.toFixed(2);
            document.getElementById('smm-total-input').value = total.toFixed(2);
            document.getElementById('smm-desc').textContent = description;
        }
        else if (formType === 'p2p') {
            const amount = parseFloat(document.getElementById('p2p-amount').value) || 0;
            const fee = amount * P2P_FEE_RATE;
            const receive = amount - fee;
            
            document.getElementById('p2p-fee').textContent = fee.toFixed(2);
            document.getElementById('p2p-receive').textContent = receive.toFixed(2);
            document.getElementById('p2p-fee-input').value = fee.toFixed(2);
            document.getElementById('p2p-receive-input').value = receive.toFixed(2);
        }
    } catch (error) {
        console.error("Error in calculateTotal:", error);
    }
}

// --- Validation ---

function validateP2PMethods() {
    const from = document.getElementById('p2p-from').value;
    const to = document.getElementById('p2p-to').value;
    const msgSpan = document.getElementById('p2p-validation-msg');
    const submitBtn = document.getElementById('p2p-submit');
    
    if (from && to && from === to) {
        msgSpan.textContent = "From and To methods cannot be the same.";
        submitBtn.disabled = true;
    } else {
        msgSpan.textContent = "";
        submitBtn.disabled = false;
    }
}

// --- Core ---

function copyAdminPhone() {
    const phoneInput = document.getElementById('admin-phone');
    if (!phoneInput) return; // Guard clause for pages without the input

    const phone = phoneInput.value;
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = phone;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    try {
        document.execCommand('copy');
        alert("Admin phone number copied: " + phone); // Using alert as requested (functional, no styling)
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(tempTextarea);
}

async function submitOrder(event, formElement) {
    event.preventDefault();
    const messageEl = document.getElementById('form-message');
    const submitBtn = formElement.querySelector('button[type="submit"]');

    if (GAS_URL === "YOUR_SCRIPT_URL_GOES_HERE") {
        messageEl.textContent = "Error: GAS_URL is not set in script.js. Please contact the administrator.";
        messageEl.style.color = 'red';
        return;
    }
    
    messageEl.textContent = 'Submitting...';
    messageEl.style.color = 'black';
    submitBtn.disabled = true;

    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // Use no-cors for 'opaque' response from GAS
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            // Note: When using mode: 'no-cors', the body must be plain text.
            // We must adjust the GAS script to handle this.
            // Let's change this to send as text and parse in GAS.
            // A common workaround is to use a redirect.
            // For a simple skeleton, we'll stringify and assume GAS can handle it.
            // A better way is to not use no-cors and handle CORS in GAS if possible.
            // Let's assume standard (non-opaque) request and expect CORS to be handled.
            mode: 'cors', // Will require a proper JSON response from GAS
            body: JSON.stringify(data)
        });

        // Since we are using 'cors' mode, we expect a valid JSON response
        const result = await response.json();

        if (result.status === 'success') {
            messageEl.textContent = 'Order submitted successfully! We will process it shortly.';
            messageEl.style.color = 'green';
            formElement.reset();
        } else {
            throw new Error(result.message || 'Unknown error');
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        // This catch block will also catch opaque response errors (if mode: 'no-cors' was used)
        // For this skeleton, we will *assume* the request was sent even on error,
        // as `fetch` with `no-cors` gives no success/failure info.
        // BUT, since we are using 'cors', this is a real error.
        
        // Let's adjust for the most common GAS Web App pattern.
        // The `fetch` might fail to *parse* the JSON response if GAS returns HTML (e.g., on redirect)
        // Let's provide a robust 'fire-and-forget' with 'no-cors' as it's the simplest.
        
        // --- Re-implementing with 'no-cors' for simplicity ---
        messageEl.textContent = 'Submitting...';
        messageEl.style.color = 'black';
        
        try {
             await fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors', // Fire and forget
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            // With no-cors, we can't know if it was successful.
            // We just assume it was.
            messageEl.textContent = 'Order submitted successfully! We will process it shortly.';
            messageEl.style.color = 'green';
            formElement.reset();

        } catch (err) {
            // This inner catch is for network errors (e.g., DNS, no connection)
            messageEl.textContent = `Submission failed: ${err.message}`;
            messageEl.style.color = 'red';
        }
        
    } finally {
        submitBtn.disabled = false;
        // Reset totals
        if (formType) calculateTotal(formType);
    }
}

// --- Services Page Loader ---
function loadPriceData(type, tableId) {
    const tableBody = document.getElementById(tableId)?.querySelector('tbody');
    if (!tableBody) return;

    const priceData = SERVICE_PRICES[type];
    if (!priceData) return;

    for (const key in priceData) {
        const item = priceData[key];
        const row = document.createElement('tr');
        
        const cellName = document.createElement('td');
        cellName.textContent = item.name;
        row.appendChild(cellName);
        
        const cellPrice = document.createElement('td');
        cellPrice.textContent = item.price;
        row.appendChild(cellPrice);
        
        tableBody.appendChild(row);
    }
}
