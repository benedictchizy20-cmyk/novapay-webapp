"use strict";

document.addEventListener("DOMContentLoaded", initCards);

const CARD_STORAGE_KEY = "novapay_demo_card_v1";
const CARD_ACTIVITY_KEY = "novapay_demo_card_activity_v1";

let cardState = null;
let detailsVisible = false;
let toastTimeout = null;

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        showToast("Browser storage is unavailable.", true);
        return false;
    }
}

function getDemoUser() {
    const key = window.NovaPayConfig?.USER_KEY || "novapay_user";

    try {
        return JSON.parse(sessionStorage.getItem(key) || "null") || {};
    } catch {
        return {};
    }
}

function getDemoInitials(name) {
    return String(name || "NovaPay User")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join("")
        .toUpperCase();
}

function initCards() {
    const user = getDemoUser();

    const name = user.full_name || user.name || "NovaPay User";
    const role = user.role || "Customer";

    document.getElementById("sidebarUserName").textContent = name;
    document.getElementById("sidebarUserRole").textContent = role;
    document.getElementById("sidebarAvatar").textContent =
        getDemoInitials(name);

    cardState = readStorage(CARD_STORAGE_KEY, null);

    if (!cardState) {
        cardState = {
            frozen: false,
            lastFour: "4242",
            expiry: "12/30",
            cvv: "123",
            createdAt: new Date().toISOString()
        };

        saveStorage(CARD_STORAGE_KEY, cardState);
    }

    bindCardEvents();
    renderCard();
    renderCardActivity();
}

function bindCardEvents() {
    document.getElementById("toggleCardDetails")
        .addEventListener("click", toggleCardDetails);

    document.getElementById("showDetailsAction")
        .addEventListener("click", toggleCardDetails);

    document.getElementById("copyCardAction")
        .addEventListener("click", copyCardNumber);

    document.getElementById("copyDetailsNumber")
        .addEventListener("click", copyCardNumber);

    document.getElementById("freezeCardAction")
        .addEventListener("click", toggleFreeze);

    document.getElementById("newCardAction")
        .addEventListener("click", resetDemoCard);

    document.getElementById("clearCardActivity")
        .addEventListener("click", clearCardActivity);

    document.getElementById("logoutButton")
        .addEventListener("click", logoutDemoUser);
}

function renderCard() {
    const user = getDemoUser();
    const name = user.full_name || user.name || "NovaPay User";
    const holder = name.toUpperCase();

    const number = detailsVisible
        ? `4242 4242 4242 ${cardState.lastFour}`
        : `•••• •••• •••• ${cardState.lastFour}`;

    const expiry = detailsVisible ? cardState.expiry : "••/••";
    const cvv = detailsVisible ? cardState.cvv : "•••";

    document.getElementById("cardHolder").textContent = holder;
    document.getElementById("cardNumber").textContent = number;
    document.getElementById("cardExpiry").textContent = expiry;
    document.getElementById("toggleCardDetails").textContent =
        detailsVisible ? "Hide" : "Show";

    document.getElementById("detailsNumber").textContent = number;
    document.getElementById("detailsExpiry").textContent = expiry;
    document.getElementById("detailsCvv").textContent = cvv;
    document.getElementById("detailsHolder").textContent = holder;

    const statusDot = document.getElementById("cardStatusDot");
    const statusText = document.getElementById("cardStatusText");
    const statusDescription =
        document.getElementById("cardStatusDescription");

    const freezeTitle = document.getElementById("freezeActionTitle");
    const freezeDescription =
        document.getElementById("freezeActionDescription");

    if (cardState.frozen) {
        statusDot.classList.add("frozen");
        statusText.textContent = "Frozen  card";
        statusDescription.textContent =
            "The  card is frozen. Unfreeze it to return to the active preview.";
        freezeTitle.textContent = "Unfreeze card";
        freezeDescription.textContent = "Restore the active  state";
    } else {
        statusDot.classList.remove("frozen");
        statusText.textContent = "Active card";
        statusDescription.textContent =
            "Your card is ready to preview. ";
        freezeTitle.textContent = "Freeze card";
        freezeDescription.textContent = "Temporarily disable the  card";
    }
}

function toggleCardDetails() {
    detailsVisible = !detailsVisible;
    renderCard();

    showToast(
        detailsVisible
            ? " card details are visible."
            : " card details are hidden."
    );
}

async function copyCardNumber() {
    const number = `4242 4242 4242 ${cardState.lastFour}`;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(number);
        } else {
            const temporary = document.createElement("textarea");
            temporary.value = number;
            temporary.style.position = "fixed";
            temporary.style.opacity = "0";
            document.body.appendChild(temporary);
            temporary.select();

            const copied = document.execCommand("copy");
            temporary.remove();

            if (!copied) {
                throw new Error("Copy unavailable");
            }
        }

        showToast(" card number copied.");
        addCardActivity("Card number copied", " action");
    } catch {
        showToast("Copy failed. Please select the displayed number.", true);
    }
}

function toggleFreeze() {
    cardState.frozen = !cardState.frozen;

    if (!saveStorage(CARD_STORAGE_KEY, cardState)) {
        return;
    }

    renderCard();

    const activity = cardState.frozen
        ? " card frozen"
        : "card unfrozen";

    addCardActivity(activity, "Card settings");

    showToast(
        cardState.frozen
            ? " card frozen."
            : " card unfrozen."
    );
}

function resetDemoCard() {
    const confirmed = window.confirm(
        "Reset your  card preview? This does not create a real card."
    );

    if (!confirmed) return;

    const lastFour = String(
        Math.floor(1000 + Math.random() * 9000)
    );

    cardState = {
        frozen: false,
        lastFour,
        expiry: "12/30",
        cvv: "123",
        createdAt: new Date().toISOString()
    };

    detailsVisible = false;

    if (!saveStorage(CARD_STORAGE_KEY, cardState)) {
        return;
    }

    addCardActivity(" card preview reset", "Card settings");
    renderCard();

    showToast("card preview reset successfully.");
}

function getCardActivity() {
    return readStorage(CARD_ACTIVITY_KEY, []);
}

function addCardActivity(title, description) {
    const activity = getCardActivity();

    activity.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        description,
        createdAt: new Date().toISOString()
    });

    saveStorage(CARD_ACTIVITY_KEY, activity.slice(0, 30));
    renderCardActivity();
}

function renderCardActivity() {
    const container = document.getElementById("cardActivity");
    const activity = getCardActivity();

    container.replaceChildren();

    if (!activity.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No  card activity yet.";
        container.appendChild(empty);
        return;
    }

    activity.forEach(item => {
        const row = document.createElement("article");
        row.className = "activity-item";

        const left = document.createElement("div");
        const title = document.createElement("strong");
        const description = document.createElement("small");

        title.textContent = item.title;
        description.textContent = item.description;

        left.append(title, description);

        const date = document.createElement("time");
        date.textContent = formatCardDate(item.createdAt);

        row.append(left, date);
        container.appendChild(row);
    });
}

function formatCardDate(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleString();
}

function clearCardActivity() {
    if (!window.confirm("Clear all saved  card activity?")) {
        return;
    }

    saveStorage(CARD_ACTIVITY_KEY, []);
    renderCardActivity();
    showToast(" card activity cleared.");
}

function logoutDemoUser() {
    // Clear the existing NovaPay session using its normal logout
    // function if one is available.
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

function showToast(message, isError = false) {
    const toast = document.getElementById("cardsToast");

    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("visible");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2800);
}