const apiUrl = 'https://fake-mtfzuspqq-ahmer-rehmans-projects.vercel.app';  // Update with your API URL

let currentUser = null;

function register() {
    const name = document.getElementById('register-name').value;
    const mobile = document.getElementById('register-mobile').value;
    const pin = document.getElementById('register-pin').value;

    fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, pin })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('register-message').innerText = data.message || 'Registration successful!';
    })
    .catch(error => console.error('Error:', error));
}

function login() {
    const mobile = document.getElementById('login-mobile').value;
    const pin = document.getElementById('login-pin').value;

    fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, pin })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            document.getElementById('login-message').innerText = data.message;
        } else {
            currentUser = data;
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('user-section').style.display = 'block';
            updateUserDetails();
        }
    })
    .catch(error => console.error('Error:', error));
}

function logout() {
    currentUser = null;
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('user-section').style.display = 'none';
}

function updateUserDetails() {
    document.getElementById('user-details').innerText = `Name: ${currentUser.name}, Mobile: ${currentUser.mobile}, Balance: ${currentUser.balance}`;
}

function deposit() {
    const amount = document.getElementById('deposit-amount').value;

    fetch(`${apiUrl}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, pin: currentUser.pin, amount })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('deposit-message').innerText = data.message;
        if (!data.message.includes('failed')) {
            currentUser.balance += parseFloat(amount);
            updateUserDetails();
        }
    })
    .catch(error => console.error('Error:', error));
}

function generateWithdrawOTP() {
    fetch(`${apiUrl}/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, pin: currentUser.pin })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('withdraw-message').innerText = data.message;
    })
    .catch(error => console.error('Error:', error));
}

function withdraw() {
    const amount = document.getElementById('withdraw-amount').value;
    const otp = document.getElementById('withdraw-otp').value;

    fetch(`${apiUrl}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, pin: currentUser.pin, amount, otp })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('withdraw-message').innerText = data.message;
        if (!data.message.includes('failed')) {
            currentUser.balance -= parseFloat(amount);
            updateUserDetails();
        }
    })
    .catch(error => console.error('Error:', error));
}

function generateTransferOTP() {
    fetch(`${apiUrl}/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, pin: currentUser.pin })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('transfer-message').innerText = data.message;
    })
    .catch(error => console.error('Error:', error));
}

function transfer() {
    const receiverMobile = document.getElementById('transfer-mobile').value;
    const amount = document.getElementById('transfer-amount').value;
    const otp = document.getElementById('transfer-otp').value;

    fetch(`${apiUrl}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, pin: currentUser.pin, receiverMobile, amount, otp })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('transfer-message').innerText = data.message;
        if (!data.message.includes('failed')) {
            currentUser.balance -= parseFloat(amount);
            updateUserDetails();
        }
    })
    .catch(error => console.error('Error:', error));
}

function viewTransactions() {
    fetch(`${apiUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, pin: currentUser.pin })
    })
    .then(response => response.json())
    .then(data => {
        const transactionHistory = document.getElementById('transaction-history');
        transactionHistory.innerHTML = '<h4>Transaction History</h4>';
        data.forEach(transaction => {
            transactionHistory.innerHTML += `<p>${transaction.date}: ${transaction.type} ${transaction.amount} to/from ${transaction.receiverMobile}</p>`;
        });
    })
    .catch(error => console.error('Error:', error));
}
