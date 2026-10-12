"use strict";

/* =====================================================
   NOVAPAY LOAN SYSTEM
   - User loan applications
   - Application status
   - Loan notifications
   - Admin approval and rejection
===================================================== */

document.addEventListener("DOMContentLoaded", initializeLoans);

let currentLoanUser = null;
let currentLoans = [];
let currentNotifications = [];


// =====================================================
// INITIALIZATION
// =====================================================

async function initializeLoans() {
    currentLoanUser = getSavedUser();

    if (!getAccessToken()) {
        window.location.href = "./login.html";
        return;
    }

    renderSidebarProfile();
    configureEvents();

    await loadProfile();
    await loadLoans();
    await loadNotifications();

    if (isAdmin()) {
        document.getElementById("adminNavSection").hidden = false;
        document.getElementById("adminReviewPanel").hidden = false;
        await loadAdminLoans();
    }
}


// =====================================================
// AUTHENTICATION HELPERS
// =====================================================

function getAccessToken() {
    if (
        window.NovaPayApp &&
        typeof window.NovaPayApp.getAccessToken === "function"
    ) {
        return window.NovaPayApp.getAccessToken();
    }

    const key =
        window.NovaPayConfig?.ACCESS_TOKEN_KEY ||
        "novapay_access_token";

    return sessionStorage.getItem(key);
}

function getSavedUser() {
    if (
        window.NovaPayApp &&
        typeof window.NovaPayApp.getCurrentUser === "function"
    ) {
        return window.NovaPayApp.getCurrentUser();
    }

    const key =
        window.NovaPayConfig?.USER_KEY ||
        "novapay_user";

    try {
        return JSON.parse(sessionStorage.getItem(key) || "null");
    } catch {
        return null;
    }
}

function isAdmin() {
    const role = String(
        currentLoanUser?.role ||
        currentLoanUser?.user?.role ||
        ""
    ).toLowerCase();

    return role === "admin" || role === "super_admin";
}


// =====================================================
// API REQUEST HELPER
// =====================================================

async function loanRequest(path, options = {}) {
    const token = getAccessToken();

    if (!token) {
        window.location.href = "./login.html";
        throw new Error("Your session has expired. Please log in again.");
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
    };

    const requestOptions = {
        ...options,
        headers
    };

    if (
        options.body !== undefined &&
        !(options.body instanceof FormData)
    ) {
        headers["Content-Type"] = "application/json";

        if (typeof options.body !== "string") {
            requestOptions.body = JSON.stringify(options.body);
        }
    }

    const baseUrl =
        window.NovaPayConfig?.API_BASE_URL ||
        "http://localhost:7000/api";

    const response = await fetch(
        `${baseUrl}${path}`,
        requestOptions
    );

    let result;

    try {
        result = await response.json();
    } catch {
        result = {};
    }

    if (response.status === 401) {
        throw new Error(
            result.message ||
            "Your session has expired. Please log in again."
        );
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message ||
            "The request could not be completed."
        );
    }

    return result;
}


// =====================================================
// SAFE DOM HELPERS
// =====================================================

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
}

function showMessage(elementId, message, type = "success") {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.hidden = false;
    element.className = `form-message ${type}`;
    element.textContent = message;
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);

    if (element) {
        element.hidden = true;
        element.textContent = "";
    }
}

function formatMoney(amount, currency = "USD") {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return `${currency} 0.00`;
    }

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            maximumFractionDigits: 2
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString();
}

function humanizeStatus(status) {
    const value = String(status || "pending");

    return value.charAt(0).toUpperCase() + value.slice(1);
}

function createStatusBadge(status) {
    const normalized = String(status || "pending").toLowerCase();

    const badge = createElement(
        "span",
        `status-badge ${normalized}`,
        humanizeStatus(normalized)
    );

    return badge;
}


// =====================================================
// SIDEBAR PROFILE
// =====================================================

function renderSidebarProfile() {
    const name =
        currentLoanUser?.full_name ||
        currentLoanUser?.user?.full_name ||
        currentLoanUser?.name ||
        "NovaPay User";

    const role =
        currentLoanUser?.role ||
        currentLoanUser?.user?.role ||
        "Customer";

    document.getElementById("sidebarUserName").textContent = name;
    document.getElementById("sidebarUserRole").textContent = role;

    const avatar = document.getElementById("sidebarAvatar");

    avatar.textContent = getInitials(name);
}

function getInitials(name) {
    return String(name || "N")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join("")
        .toUpperCase();
}


// =====================================================
// PROFILE PREFILL
// =====================================================

async function loadProfile() {
    try {
        const result = await loanRequest("/profile");

        const profile =
            result.profile ||
            result.user ||
            result.data ||
            result;

        const fullName =
            profile.full_name ||
            profile.name ||
            currentLoanUser?.full_name ||
            "";

        const email =
            profile.email ||
            currentLoanUser?.email ||
            "";

        const phone =
            profile.phone ||
            currentLoanUser?.phone ||
            "";

        document.getElementById("loanFullName").value = fullName;
        document.getElementById("loanEmail").value = email;
        document.getElementById("loanPhone").value = phone;

        currentLoanUser = {
            ...(currentLoanUser || {}),
            ...profile
        };

        renderSidebarProfile();
    } catch (error) {
        // The user can still fill in the form manually if profile
        // loading fails. Do not prevent loan applications here.
        console.warn("NOVAPAY LOAN PROFILE:", error.message);

        if (currentLoanUser) {
            document.getElementById("loanFullName").value =
                currentLoanUser.full_name || "";

            document.getElementById("loanEmail").value =
                currentLoanUser.email || "";

            document.getElementById("loanPhone").value =
                currentLoanUser.phone || "";
        }
    }
}


// =====================================================
// EVENT HANDLERS
// =====================================================

function configureEvents() {
    document
        .getElementById("loanApplicationForm")
        .addEventListener("submit", submitLoanApplication);

    document
        .getElementById("startApplicationButton")
        .addEventListener("click", () => {
            document.getElementById("applicationPanel").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

    document
        .getElementById("notificationButton")
        .addEventListener("click", () => {
            document.getElementById("notificationsPanel").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

    document
        .getElementById("adminReviewLink")
        .addEventListener("click", () => {
            document.getElementById("adminReviewPanel").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

    document
        .getElementById("logoutButton")
        .addEventListener("click", logoutUser);
}

function logoutUser() {
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
// SUBMIT LOAN APPLICATION
// =====================================================

async function submitLoanApplication(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = document.getElementById("submitLoanButton");

    hideMessage("loanFormMessage");

    if (!form.reportValidity()) {
        return;
    }

    const formData = new FormData(form);

    const payload = {
        full_name: String(formData.get("full_name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        country: String(formData.get("country") || "").trim(),
        residential_address:
            String(formData.get("residential_address") || "").trim(),
        employment_status:
            String(formData.get("employment_status") || "").trim(),
        monthly_income: Number(formData.get("monthly_income")),
        requested_amount: Number(formData.get("requested_amount")),
        currency: String(formData.get("currency") || ""),
        term_months: Number(formData.get("term_months")),
        loan_purpose: String(formData.get("loan_purpose") || "").trim()
    };

    if (
        !Number.isFinite(payload.monthly_income) ||
        payload.monthly_income <= 0 ||
        !Number.isFinite(payload.requested_amount) ||
        payload.requested_amount <= 0
    ) {
        showMessage(
            "loanFormMessage",
            "Monthly income and requested amount must be greater than zero.",
            "error"
        );

        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting application...";

    try {
        const result = await loanRequest("/loans", {
            method: "POST",
            body: payload
        });

        showMessage(
            "loanFormMessage",
            result.message || "Your application has been submitted.",
            "success"
        );

        form.reset();

        // Restore the user's saved contact details after reset.
        await loadProfile();

        await loadLoans();
        await loadNotifications();

        document.getElementById("loanList").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        showMessage(
            "loanFormMessage",
            error.message || "Unable to submit your application.",
            "error"
        );
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit application <span>→</span>';
    }
}


// =====================================================
// LOAD USER APPLICATIONS
// =====================================================

async function loadLoans() {
    const container = document.getElementById("loanList");

    container.replaceChildren(
        createElement("p", "empty-state", "Loading applications...")
    );

    try {
        const result = await loanRequest("/loans");

        currentLoans = Array.isArray(result.loans)
            ? result.loans
            : [];

        document.getElementById("totalApplications").textContent =
            currentLoans.length;

        document.getElementById("pendingApplications").textContent =
            currentLoans.filter(loan => loan.status === "pending").length;

        document.getElementById("approvedApplications").textContent =
            currentLoans.filter(loan => loan.status === "approved").length;

        renderMyLoans();
    } catch (error) {
        container.replaceChildren(
            createElement(
                "p",
                "empty-state",
                `Unable to load applications: ${error.message}`
            )
        );
    }
}

function renderMyLoans() {
    const container = document.getElementById("loanList");
    container.replaceChildren();

    if (currentLoans.length === 0) {
        container.appendChild(
            createElement(
                "p",
                "empty-state",
                "You have not submitted any loan applications yet."
            )
        );

        return;
    }

    currentLoans.forEach(loan => {
        container.appendChild(createLoanCard(loan));
    });
}

function createLoanCard(loan) {
    const card = createElement("article", "loan-card");

    const top = createElement("div", "loan-card-top");
    const information = createElement("div");

    information.appendChild(
        createElement("h3", "", "Loan application")
    );

    information.appendChild(
        createElement(
            "p",
            "",
            `Reference: ${loan.id}`
        )
    );

    information.appendChild(
        createElement(
            "p",
            "",
            `Submitted: ${formatDate(loan.created_at)}`
        )
    );

    const amount = createElement(
        "strong",
        "loan-amount",
        formatMoney(loan.requested_amount, loan.currency)
    );

    top.append(information, amount);
    card.appendChild(top);

    const meta = createElement("div", "loan-meta");

    meta.appendChild(createStatusBadge(loan.status));

    meta.appendChild(
        createElement(
            "span",
            "",
            `Term: ${loan.term_months} months`
        )
    );

    meta.appendChild(
        createElement(
            "span",
            "",
            `Country: ${loan.country}`
        )
    );

    card.appendChild(meta);

    card.appendChild(
        createElement(
            "p",
            "",
            `Purpose: ${loan.loan_purpose}`
        )
    );

    if (loan.reviewed_at) {
        card.appendChild(
            createElement(
                "p",
                "",
                `Reviewed: ${formatDate(loan.reviewed_at)}`
            )
        );
    }

    if (loan.admin_note) {
        const note = createElement("div", "review-note");

        note.appendChild(
            createElement("strong", "", "Review note")
        );

        note.appendChild(
            createElement("p", "", loan.admin_note)
        );

        card.appendChild(note);
    }

    return card;
}


// =====================================================
// LOAD LOAN NOTIFICATIONS
// =====================================================

async function loadNotifications() {
    const container = document.getElementById("loanNotifications");

    container.replaceChildren(
        createElement("p", "empty-state", "Loading notifications...")
    );

    try {
        const result = await loanRequest("/loans/notifications");

        currentNotifications = Array.isArray(result.notifications)
            ? result.notifications
            : [];

        const unreadCount = currentNotifications.filter(
            notification => !notification.is_read
        ).length;

        document.getElementById("notificationCount").textContent =
            unreadCount > 99 ? "99+" : unreadCount;

        renderNotifications();
    } catch (error) {
        container.replaceChildren(
            createElement(
                "p",
                "empty-state",
                `Unable to load notifications: ${error.message}`
            )
        );
    }
}

function renderNotifications() {
    const container = document.getElementById("loanNotifications");
    container.replaceChildren();

    if (currentNotifications.length === 0) {
        container.appendChild(
            createElement(
                "p",
                "empty-state",
                "You do not have any loan notifications yet."
            )
        );

        return;
    }

    currentNotifications.forEach(notification => {
        const item = createElement("article", "notification-item");

        item.appendChild(
            createElement("div", "notification-icon", "N")
        );

        const content = createElement("div", "notification-content");

        content.appendChild(
            createElement("strong", "", notification.title)
        );

        content.appendChild(
            createElement("p", "", notification.message)
        );

        content.appendChild(
            createElement("small", "", formatDate(notification.created_at))
        );

        item.appendChild(content);

        if (!notification.is_read) {
            item.appendChild(createElement("span", "unread-dot"));

            const markReadButton = createElement(
                "button",
                "review-button",
                "Mark read"
            );

            markReadButton.type = "button";

            markReadButton.addEventListener("click", async () => {
                markReadButton.disabled = true;

                try {
                    await loanRequest(
                        `/loans/notifications/${encodeURIComponent(notification.id)}/read`,
                        { method: "PATCH" }
                    );

                    notification.is_read = true;

                    await loadNotifications();
                } catch (error) {
                    markReadButton.disabled = false;

                    window.alert(
                        error.message || "Unable to mark notification as read."
                    );
                }
            });

            item.appendChild(markReadButton);
        }

        container.appendChild(item);
    });
}


// =====================================================
// ADMIN: LOAD ALL LOANS
// =====================================================

async function loadAdminLoans() {
    if (!isAdmin()) return;

    const container = document.getElementById("adminLoanList");

    container.replaceChildren(
        createElement("p", "empty-state", "Loading review queue...")
    );

    try {
        const result = await loanRequest("/loans/admin");

        const loans = Array.isArray(result.loans)
            ? result.loans
            : [];

        renderAdminLoans(loans);
    } catch (error) {
        container.replaceChildren(
            createElement(
                "p",
                "empty-state",
                `Unable to load the admin queue: ${error.message}`
            )
        );
    }
}

function renderAdminLoans(loans) {
    const container = document.getElementById("adminLoanList");
    container.replaceChildren();

    if (loans.length === 0) {
        container.appendChild(
            createElement(
                "p",
                "empty-state",
                "There are no loan applications to display."
            )
        );

        return;
    }

    loans.forEach(loan => {
        container.appendChild(createAdminLoanCard(loan));
    });
}

function addAdminDetail(container, label, value) {
    const item = createElement("div", "detail-item");

    item.appendChild(createElement("span", "", label));
    item.appendChild(createElement("strong", "", value || "Not provided"));

    container.appendChild(item);
}

function createAdminLoanCard(loan) {
    const card = createElement("article", "admin-loan-card");

    const top = createElement("div", "loan-card-top");
    const applicant = createElement("div");

    applicant.appendChild(
        createElement("h3", "", loan.full_name)
    );

    applicant.appendChild(
        createElement("p", "", loan.email)
    );

    applicant.appendChild(
        createElement("p", "", `Application ID: ${loan.id}`)
    );

    top.appendChild(applicant);
    top.appendChild(createStatusBadge(loan.status));
    card.appendChild(top);

    const details = createElement("div", "admin-loan-details");

    addAdminDetail(
        details,
        "Requested amount",
        formatMoney(loan.requested_amount, loan.currency)
    );

    addAdminDetail(
        details,
        "Monthly income",
        formatMoney(loan.monthly_income, loan.currency)
    );

    addAdminDetail(details, "Phone", loan.phone);
    addAdminDetail(details, "Country", loan.country);
    addAdminDetail(details, "Employment", loan.employment_status);
    addAdminDetail(
        details,
        "Requested term",
        `${loan.term_months} months`
    );

    addAdminDetail(
        details,
        "Submitted",
        formatDate(loan.created_at)
    );

    addAdminDetail(
        details,
        "Residential address",
        loan.residential_address
    );

    card.appendChild(details);

    const purpose = createElement("div", "review-note");

    purpose.appendChild(
        createElement("strong", "", "Loan purpose")
    );

    purpose.appendChild(
        createElement("p", "", loan.loan_purpose)
    );

    card.appendChild(purpose);

    if (loan.admin_note) {
        const previousNote = createElement("div", "review-note");

        previousNote.appendChild(
            createElement("strong", "", "Previous review note")
        );

        previousNote.appendChild(
            createElement("p", "", loan.admin_note)
        );

        card.appendChild(previousNote);
    }

    if (loan.status === "pending") {
        card.appendChild(createAdminReviewForm(loan));
    }

    return card;
}


// =====================================================
// ADMIN: REVIEW FORM
// =====================================================

function createAdminReviewForm(loan) {
    const form = createElement("form", "admin-review-form");

    const label = createElement("label", "");
    label.textContent = "Review note (optional)";

    const textarea = createElement("textarea", "");
    textarea.name = "admin_note";
    textarea.maxLength = 2000;
    textarea.placeholder =
        "Enter a clear reason or additional review information.";

    label.appendChild(textarea);
    form.appendChild(label);

    const actions = createElement("div", "review-actions");

    const approveButton = createElement(
        "button",
        "review-button approve-button",
        "Approve application"
    );

    approveButton.type = "button";

    const rejectButton = createElement(
        "button",
        "review-button reject-button",
        "Reject application"
    );

    rejectButton.type = "button";

    approveButton.addEventListener("click", () => {
        reviewLoan(loan.id, "approved", textarea.value, approveButton);
    });

    rejectButton.addEventListener("click", () => {
        reviewLoan(loan.id, "rejected", textarea.value, rejectButton);
    });

    actions.append(approveButton, rejectButton);
    form.appendChild(actions);

    return form;
}

async function reviewLoan(loanId, status, note, button) {
    if (!isAdmin()) {
        showMessage(
            "adminLoanMessage",
            "You are not authorized to review loan applications.",
            "error"
        );

        return;
    }

    const decision = status === "approved" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${decision} this loan?`)) {
        return;
    }

    hideMessage("adminLoanMessage");

    button.disabled = true;
    button.textContent = "Saving decision...";

    try {
        const result = await loanRequest(
            `/loans/admin/${encodeURIComponent(loanId)}/review`,
            {
                method: "PATCH",
                body: {
                    status,
                    admin_note: String(note || "").trim()
                }
            }
        );

        showMessage(
            "adminLoanMessage",
            result.message || "The application has been reviewed.",
            "success"
        );

        await loadAdminLoans();
        await loadLoans();
        await loadNotifications();
    } catch (error) {
        showMessage(
            "adminLoanMessage",
            error.message || "Unable to review this application.",
            "error"
        );

        button.disabled = false;
        button.textContent =
            status === "approved"
                ? "Approve application"
                : "Reject application";
    }
}