"use strict";

document.addEventListener("DOMContentLoaded", initBills);

const BILL_HISTORY_KEY = "novapay__bill_history_v1";

const BILL_PROVIDERS = {
    electricity: [
        "Sample Electric Utility",
        " Power Company",
        " Energy Services"
    ],
    internet: [
        "Sample Broadband",
        " Fiber Internet",
        " Home Internet"
    ],
    mobile: [
        "Sample Mobile Network",
        " Wireless",
        " Telecom"
    ],
    water: [
        "Sample Water Utility",
        " Water Services",
        " City Water"
    ],
    television: [
        "Sample TV Subscription",
        " Entertainment",
        " Satellite TV"
    ]
};

const BILL_LABELS = {
    electricity: "Electricity",
    internet: "Internet",
    mobile: "Mobile airtime / data",
    water: "Water",
    television: "TV subscription"
};

const BILL_ICONS = {
    electricity: "ϟ",
    internet: "⌁",
    mobile: "▤",
    water: "◉",
    television: "▣"
};

let pendingBillPayment = null;
let activeReceipt = null;
let billsToastTimeout = null;


// =====================================================
// INITIALIZATION
// =====================================================

function initBills() {
    const user = getBillsUser();

    const name = user.full_name || user.name || "NovaPay User";
    const role = user.role || "Customer";

    document.getElementById("sidebarUserName").textContent = name;
    document.getElementById("sidebarUserRole").textContent = role;
    document.getElementById("sidebarAvatar").textContent =
        getBillsInitials(name);

    bindBillEvents();
    updateProviderOptions();
    updateBillSummary();
    renderBillHistory();
}


// =====================================================
// USER HELPERS
// =====================================================

function getBillsUser() {
    const key = window.NovaPayConfig?.USER_KEY || "novapay_user";

    try {
        return JSON.parse(sessionStorage.getItem(key) || "null") || {};
    } catch {
        return {};
    }
}

function getBillsInitials(name) {
    return String(name || "NovaPay User")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join("")
        .toUpperCase();
}

function logoutBillsUser() {
    if (
        window.NovaPayApp &&
        typeof window.NovaPayApp.logout === "function"
    ) {
        window.NovaPayApp.logout();
        return;
    }

    sessionStorage.removeItem("novapay_access_token");
    sessionStorage.removeItem("novapay_refresh_token");
    sessionStorage.removeItem("novapay_user");

    window.location.href = "./login.html";
}


// =====================================================
// EVENTS
// =====================================================

function bindBillEvents() {
    document.getElementById("billPaymentForm")
        .addEventListener("submit", reviewBillPayment);

    document.getElementById("billCategory")
        .addEventListener("change", () => {
            selectBillCategory(
                document.getElementById("billCategory").value
            );
        });

    document.getElementById("billProvider")
        .addEventListener("change", updateBillSummary);

    document.getElementById("billCurrency")
        .addEventListener("change", updateBillSummary);

    document.getElementById("billAmount")
        .addEventListener("input", updateBillSummary);

    document.querySelectorAll(".category-card").forEach(button => {
        button.addEventListener("click", () => {
            selectBillCategory(button.dataset.category);
        });
    });

    document.getElementById("closeReviewModal")
        .addEventListener("click", closeReviewModal);

    document.getElementById("editBillButton")
        .addEventListener("click", closeReviewModal);

    document.getElementById("confirmBillButton")
        .addEventListener("click", simulateBillPayment);

    document.getElementById("closeReceiptButton")
        .addEventListener("click", closeReceiptModal);

    document.getElementById("printReceiptButton")
        .addEventListener("click", printReceipt);

    document.getElementById("clearBillHistory")
        .addEventListener("click", clearBillHistory);

    document.getElementById("logoutButton")
        .addEventListener("click", logoutBillsUser);

    document.getElementById("reviewModal")
        .addEventListener("click", event => {
            if (event.target.id === "reviewModal") {
                closeReviewModal();
            }
        });

    document.getElementById("receiptModal")
        .addEventListener("click", event => {
            if (event.target.id === "receiptModal") {
                closeReceiptModal();
            }
        });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeReviewModal();
            closeReceiptModal();
        }
    });
}


// =====================================================
// CATEGORY AND PROVIDER SELECTION
// =====================================================

function selectBillCategory(category) {
    if (!BILL_PROVIDERS[category]) return;

    document.getElementById("billCategory").value = category;

    document.querySelectorAll(".category-card").forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.category === category
        );
    });

    updateProviderOptions();
    updateBillSummary();
}

function updateProviderOptions() {
    const category = document.getElementById("billCategory").value;
    const providerSelect = document.getElementById("billProvider");

    const providers = BILL_PROVIDERS[category] || [];

    providerSelect.replaceChildren();

    providers.forEach(provider => {
        const option = document.createElement("option");
        option.value = provider;
        option.textContent = provider;
        providerSelect.appendChild(option);
    });

    const accountHelp = document.getElementById("accountHelp");

    const helpText = {
        electricity: "Enter a sample meter or customer reference.",
        internet: "Enter a sample broadband account reference.",
        mobile: "Enter a sample phone number for this demo.",
        water: "Enter a sample water account reference.",
        television: "Enter a sample subscriber reference."
    };

    accountHelp.textContent =
        helpText[category] || "Use a sample reference for this .";
}


// =====================================================
// AMOUNT CALCULATIONS
// =====================================================

function getSelectedCurrency() {
    return document.getElementById("billCurrency").value || "USD";
}

function formatBillMoney(amount, currency) {
    const value = Number(amount);

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number.isFinite(value) ? value : 0);
    } catch {
        return `${currency} ${Number(value || 0).toFixed(2)}`;
    }
}

function updateBillSummary() {
    const amount = Number(document.getElementById("billAmount").value);
    const currency = getSelectedCurrency();

    const validAmount = Number.isFinite(amount) && amount > 0
        ? amount
        : 0;

    // This demo has no service fee and never debits a real balance.
    const fee = 0;
    const total = validAmount + fee;

    document.getElementById("summaryAmount").textContent =
        formatBillMoney(validAmount, currency);

    document.getElementById("summaryFee").textContent =
        formatBillMoney(fee, currency);

    document.getElementById("summaryTotal").textContent =
        formatBillMoney(total, currency);
}


// =====================================================
// REVIEW PAYMENT
// =====================================================

function reviewBillPayment(event) {
    event.preventDefault();

    hideBillMessage();

    const form = document.getElementById("billPaymentForm");

    if (!form.reportValidity()) return;

    const formData = new FormData(form);

    const category = String(formData.get("category") || "");
    const provider = String(formData.get("provider") || "").trim();
    const account = String(formData.get("account") || "").trim();
    const currency = String(formData.get("currency") || "");
    const amount = Number(formData.get("amount"));
    const description = String(
        formData.get("description") || ""
    ).trim();

    if (!BILL_PROVIDERS[category]) {
        showBillMessage("Please select a valid bill category.", true);
        return;
    }

    if (!BILL_PROVIDERS[category].includes(provider)) {
        showBillMessage("Please select a valid  provider.", true);
        return;
    }

    if (account.length < 3) {
        showBillMessage(
            "Enter a customer reference containing at least 3 characters.",
            true
        );
        return;
    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1000000
    ) {
        showBillMessage(
            "Enter an amount greater than zero and no more than 1,000,000.",
            true
        );
        return;
    }

    pendingBillPayment = {
        id: createBillReference(),
        category,
        categoryLabel: BILL_LABELS[category],
        icon: BILL_ICONS[category],
        provider,
        account,
        currency,
        amount,
        fee: 0,
        total: amount,
        description,
        status: "paid",
        createdAt: new Date().toISOString()
    };

    renderPaymentReview(pendingBillPayment);

    document.getElementById("reviewModal").hidden = false;
    document.getElementById("confirmBillButton").disabled = false;
    document.getElementById("confirmBillButton").textContent =
        "Simulate payment";
}

function renderPaymentReview(payment) {
    const container = document.getElementById("reviewDetails");
    container.replaceChildren();

    const rows = [
        ["Category", payment.categoryLabel],
        ["Provider", payment.provider],
        ["Customer reference", payment.account],
        ["Currency", payment.currency],
        ["Amount", formatBillMoney(payment.amount, payment.currency)],
        ["Service fee", formatBillMoney(payment.fee, payment.currency)],
        ["Total", formatBillMoney(payment.total, payment.currency)],
        ["Mode", "Frontend simulation only"]
    ];

    rows.forEach(([label, value]) => {
        container.appendChild(
            createReviewRow(label, value)
        );
    });
}

function createReviewRow(label, value) {
    const row = document.createElement("div");
    row.className = "review-row";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);

    return row;
}

function closeReviewModal() {
    document.getElementById("reviewModal").hidden = true;
}


// =====================================================
// SIMULATE PAYMENT
// =====================================================

function simulateBillPayment() {
    if (!pendingBillPayment) {
        showBillMessage("Review your payment details first.", true);
        closeReviewModal();
        return;
    }

    const button = document.getElementById("confirmBillButton");

    button.disabled = true;
    button.textContent = "Processing ...";

    // This is deliberately a local simulation. No API request,
    // bank transfer, balance deduction, or provider payment occurs.
    const payment = {
        ...pendingBillPayment,
        id: createBillReference(),
        status: "paid",
        createdAt: new Date().toISOString()
    };

    const history = getBillHistory();
    history.unshift(payment);

    if (!saveBillHistory(history.slice(0, 100))) {
        button.disabled = false;
        button.textContent = " payment";
        return;
    }

    closeReviewModal();

    pendingBillPayment = null;
    activeReceipt = payment;

    renderBillHistory();
    renderReceipt(payment);

    document.getElementById("receiptModal").hidden = false;

    button.disabled = false;
    button.textContent = " payment";

    document.getElementById("billPaymentForm").reset();
    document.getElementById("billCategory").value = "electricity";

    selectBillCategory("electricity");
    updateBillSummary();

    showBillToast("payment recorded in this browser.");
}

function createBillReference() {
    const randomPart = Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase();

    return `NP-DEMO-${Date.now()}-${randomPart}`;
}


// =====================================================
// RECEIPT
// =====================================================

function renderReceipt(payment) {
    document.getElementById("receiptTitle").textContent =
        " payment complete";

    document.getElementById("receiptSubtitle").textContent =
        "payment was sent and no account was charged.";

    document.getElementById("receiptTotal").textContent =
        formatBillMoney(payment.total, payment.currency);

    const container = document.getElementById("receiptDetails");
    container.replaceChildren();

    const rows = [
        ["Demo reference", payment.id],
        ["Category", payment.categoryLabel],
        ["Provider", payment.provider],
        ["Customer reference", payment.account],
        ["Payment amount", formatBillMoney(payment.amount, payment.currency)],
        ["Service fee", formatBillMoney(payment.fee, payment.currency)],
        ["Status", " successful PAYMENT"],
        ["Date", formatBillDate(payment.createdAt)]
    ];

    rows.forEach(([label, value]) => {
        container.appendChild(
            createReceiptRow(label, value)
        );
    });
}

function createReceiptRow(label, value) {
    const row = document.createElement("div");
    row.className = "receipt-row";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);

    return row;
}

function closeReceiptModal() {
    document.getElementById("receiptModal").hidden = true;
}

function printReceipt() {
    if (!activeReceipt) {
        showBillToast("No receipt is available.", true);
        return;
    }

    window.print();
}


// =====================================================
// HISTORY
// =====================================================

function getBillHistory() {
    try {
        const value = localStorage.getItem(BILL_HISTORY_KEY);

        if (!value) return [];

        const history = JSON.parse(value);

        return Array.isArray(history) ? history : [];
    } catch {
        return [];
    }
}

function saveBillHistory(history) {
    try {
        localStorage.setItem(
            BILL_HISTORY_KEY,
            JSON.stringify(history)
        );

        return true;
    } catch {
        showBillToast(
            "Unable to save history. Check your browser storage settings.",
            true
        );

        return false;
    }
}

function renderBillHistory() {
    const container = document.getElementById("billHistory");
    const history = getBillHistory();

    container.replaceChildren();

    if (history.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No bill payments yet.";
        container.appendChild(empty);
        return;
    }

    history.forEach(payment => {
        container.appendChild(createHistoryItem(payment));
    });
}

function createHistoryItem(payment) {
    const item = document.createElement("article");
    item.className = "history-item";

    const left = document.createElement("div");
    left.className = "history-left";

    const icon = document.createElement("span");
    icon.className = "history-icon";
    icon.textContent = payment.icon || "▤";

    const copy = document.createElement("div");
    copy.className = "history-copy";

    const title = document.createElement("strong");
    title.textContent =
        `${payment.categoryLabel || "Bill"} · ${payment.provider}`;

    const reference = document.createElement("small");
    reference.textContent = `Reference: ${payment.id}`;

    const account = document.createElement("small");
    account.textContent = `Customer: ${payment.account}`;

    const date = document.createElement("small");
    date.textContent = formatBillDate(payment.createdAt);

    copy.append(title, reference, account, date);
    left.append(icon, copy);

    const right = document.createElement("div");
    right.className = "history-right";

    const amount = document.createElement("strong");
    amount.textContent = formatBillMoney(
        payment.total,
        payment.currency
    );

    const status = document.createElement("small");
    status.textContent = "SIMULATED";

    const actions = document.createElement("div");
    actions.className = "history-buttons";

    const receiptButton = document.createElement("button");
    receiptButton.type = "button";
    receiptButton.textContent = "View receipt";

    receiptButton.addEventListener("click", () => {
        activeReceipt = payment;
        renderReceipt(payment);
        document.getElementById("receiptModal").hidden = false;
    });

    actions.appendChild(receiptButton);
    right.append(amount, status, actions);

    item.append(left, right);

    return item;
}

function formatBillDate(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleString();
}

function clearBillHistory() {
    if (!window.confirm("Clear all  bill payment history?")) {
        return;
    }

    if (saveBillHistory([])) {
        renderBillHistory();
        showBillToast(" payment history cleared.");
    }
}


// =====================================================
// MESSAGES AND TOASTS
// =====================================================

function showBillMessage(message, isError = false) {
    const element = document.getElementById("billMessage");

    element.hidden = false;
    element.className = isError
        ? "bill-message error"
        : "bill-message";

    element.textContent = message;
}

function hideBillMessage() {
    const element = document.getElementById("billMessage");

    element.hidden = true;
    element.textContent = "";
}

function showBillToast(message, isError = false) {
    const toast = document.getElementById("billsToast");

    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("visible");

    clearTimeout(billsToastTimeout);

    billsToastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2800);
}