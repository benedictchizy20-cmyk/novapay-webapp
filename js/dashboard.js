
"use strict";

document.addEventListener("DOMContentLoaded", async function () {
    if (!NovaPayApp.requireAuth()) {
        return;
    }

    let user = NovaPayApp.getUser();

    if (!user) {
        NovaPayApp.logout(true);
        return;
    }

    /* =========================================================
       ELEMENTS
    ========================================================= */

    const topProfileImage = document.getElementById("topProfileImage");
    const topProfileFallback = document.getElementById("topProfileFallback");
    const topUserName = document.getElementById("topUserName");
    const topUserEmail = document.getElementById("topUserEmail");
    const welcomeName = document.getElementById("welcomeName");
    const balanceAmount = document.getElementById("balanceAmount");
    const accountNumber = document.getElementById("accountNumber");
    const currency = document.getElementById("currency");
    const accountStatus = document.getElementById("accountStatus");
    const summaryName = document.getElementById("summaryName");
    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarUserRole = document.getElementById("sidebarUserRole");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const transactionsList = document.getElementById("transactionsList");

    const adminQuickPay = document.getElementById("adminQuickPay");
    const quickPayButton = document.getElementById("quickPayButton");
    const quickPayMessage = document.getElementById("quickPayMessage");

    const adminApprovalCenter = document.getElementById("adminApprovalCenter");
    const pendingDepositCount = document.getElementById("pendingDepositCount");
    const pendingTransferCount = document.getElementById("pendingTransferCount");
    const pendingDepositsList = document.getElementById("pendingDepositsList");
    const pendingTransfersList = document.getElementById("pendingTransfersList");

    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const sidebarClose = document.getElementById("sidebarClose");

    /* =========================================================
       HELPERS
    ========================================================= */

    function getInitials(name) {
        if (!name) {
            return "N";
        }

        const parts = String(name).trim().split(/\s+/).filter(Boolean);

        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }

    function getCurrencyCode(value) {
        const valueString = String(value || "USD").trim().toUpperCase();

        const symbols = {
            "$": "USD",
            "USD": "USD",
            "₦": "NGN",
            "NGN": "NGN",
            "£": "GBP",
            "GBP": "GBP",
            "€": "EUR",
            "EUR": "EUR"
        };

        return symbols[valueString] || valueString;
    }

    function getCurrencySymbol(value) {
        const code = getCurrencyCode(value);

        const symbols = {
            USD: "$",
            NGN: "₦",
            GBP: "£",
            EUR: "€"
        };

        return symbols[code] || `${code} `;
    }

    function formatMoney(amount, currencyValue) {
        const symbol = getCurrencySymbol(currencyValue);
        const number = Number(amount ?? 0);

        return `${symbol}${number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function formatDateTime(dateValue) {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function escapeHTML(value) {
        if (typeof NovaPayApp.escapeHTML === "function") {
            return NovaPayApp.escapeHTML(String(value ?? ""));
        }

        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    /* =========================================================
       USER INFORMATION AND PHOTOS
    ========================================================= */

    function renderUserInformation() {
        const fullName = user.full_name || "User";
        const email = user.email || "No email";
        const initials = getInitials(fullName);

        setText(topUserName, fullName);
        setText(topUserEmail, email);
        setText(welcomeName, fullName.split(/\s+/)[0]);
        setText(sidebarUserName, fullName);
        setText(sidebarUserRole, user.role || "user");
        setText(summaryName, fullName);

        // Top profile image.
        if (topProfileImage && topProfileFallback) {
            if (user.profile_photo) {
                topProfileImage.onerror = function () {
                    topProfileImage.style.display = "none";
                    topProfileFallback.textContent = initials;
                    topProfileFallback.style.display = "flex";
                };

                topProfileImage.src = user.profile_photo;
                topProfileImage.alt = `${fullName}'s profile picture`;
                topProfileImage.style.display = "block";
                topProfileFallback.style.display = "none";
            } else {
                topProfileImage.style.display = "none";
                topProfileFallback.textContent = initials;
                topProfileFallback.style.display = "flex";
            }
        }

        // Sidebar profile image.
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = "";

            if (user.profile_photo) {
                const image = document.createElement("img");

                image.src = user.profile_photo;
                image.alt = `${fullName}'s profile picture`;

                image.onerror = function () {
                    sidebarAvatar.innerHTML = "";
                    sidebarAvatar.textContent = initials;
                };

                sidebarAvatar.appendChild(image);
            } else {
                sidebarAvatar.textContent = initials;
            }
        }
    }

    /* =========================================================
       ACCOUNT BALANCE AND STATUS
    ========================================================= */

    function renderAccountInformation() {
        const userCurrency = getCurrencyCode(user.currency || "USD");

        setText(
            balanceAmount,
            formatMoney(user.balance, userCurrency)
        );

        setText(accountNumber, user.account_number || "—");
        setText(currency, userCurrency);

        const status = String(user.account_status || "active").toLowerCase();

        setText(
            accountStatus,
            status.charAt(0).toUpperCase() + status.slice(1)
        );
    }

    let accountRefreshInProgress = false;

    async function refreshAccountData() {
        if (accountRefreshInProgress) {
            return;
        }

        accountRefreshInProgress = true;

        try {
            const result = await NovaPayAPI.getProfile();

            if (!result || !result.user) {
                throw new Error("The server did not return your account details.");
            }

            // The backend profile endpoint now includes live account data.
            user = {
                ...user,
                ...result.user
            };

            NovaPayApp.setUser(user);

            renderUserInformation();
            renderAccountInformation();
            renderAdminVisibility();

        } catch (error) {
            console.error("NOVAPAY ACCOUNT REFRESH ERROR:", error);
        } finally {
            accountRefreshInProgress = false;
        }
    }

    /* =========================================================
       ADMIN VISIBILITY
    ========================================================= */

    function renderAdminVisibility() {
        const role = String(user.role || "").toLowerCase();
        const isAdmin = role === "admin" || role === "super_admin";

        if (adminQuickPay) {
            adminQuickPay.style.display = isAdmin ? "block" : "none";
        }

        if (adminApprovalCenter) {
            adminApprovalCenter.style.display = isAdmin ? "block" : "none";
        }

        if (isAdmin) {
            showDepositApprovalEmptyState();
            showTransferApprovalEmptyState();
        }
    }

    /* =========================================================
       QUICK PAY
    ========================================================= */

    if (quickPayButton) {
        quickPayButton.addEventListener("click", async function () {
            quickPayButton.disabled = true;
            quickPayButton.textContent = "Processing...";

            setText(quickPayMessage, "");

            try {
                const result = await NovaPayAPI.quickPay();

                if (result && result.quick_pay) {
                    const quickPay = result.quick_pay;

                    user = {
                        ...user,
                        balance: Number(quickPay.new_balance),
                        currency: quickPay.currency || user.currency || "USD"
                    };

                    NovaPayApp.setUser(user);
                    renderAccountInformation();
                }

                // Re-read the actual account balance from the backend.
                await refreshAccountData();

                setText(
                    quickPayMessage,
                    result.message || "Quick Pay completed successfully."
                );

                // Refresh recent transactions after the operation.
                await loadTransactions();

            } catch (error) {
                setText(
                    quickPayMessage,
                    error.message || "Quick Pay failed."
                );
            } finally {
                quickPayButton.disabled = false;
                quickPayButton.textContent = "Add $100,000";
            }
        });
    }

    /* =========================================================
       ADMIN APPROVAL PLACEHOLDERS
       No fake approval records are created.
    ========================================================= */

    function showDepositApprovalEmptyState() {
        if (pendingDepositsList) {
            pendingDepositsList.innerHTML = `
                <div class="approval-empty-state">
                    <div class="approval-empty-icon">✓</div>
                    <strong>No pending deposit approvals</strong>
                    <span>
                        Pending deposits will appear here when the deposit
                        approval API is connected.
                    </span>
                </div>
            `;
        }

        setText(pendingDepositCount, "0");
    }

    function showTransferApprovalEmptyState() {
        if (pendingTransfersList) {
            pendingTransfersList.innerHTML = `
                <div class="approval-empty-state">
                    <div class="approval-empty-icon">✓</div>
                    <strong>No pending transfer approvals</strong>
                    <span>
                        Pending transfers will appear here when the
                        approval data is connected.
                    </span>
                </div>
            `;
        }

        setText(pendingTransferCount, "0");
    }

    // Kept for future connection to the real approval APIs.
    function renderPendingDeposit(deposit) {
        const name = deposit.user_name || deposit.full_name || "User";
        const account = deposit.account_number || "—";
        const amount = formatMoney(deposit.amount, deposit.currency || "USD");
        const reference = deposit.deposit_reference || deposit.reference || "—";
        const createdAt = formatDateTime(deposit.created_at);

        return `
            <div class="approval-item">
                <div class="approval-user">
                    <strong>${escapeHTML(name)}</strong>
                    <span>${escapeHTML(account)}</span>
                </div>
                <div class="approval-field">
                    <span class="approval-field-label">Amount</span>
                    <span class="approval-field-value">${escapeHTML(amount)}</span>
                </div>
                <div class="approval-field">
                    <span class="approval-field-label">Reference</span>
                    <span class="approval-field-value">${escapeHTML(reference)}</span>
                </div>
                <div class="approval-field">
                    <span class="approval-field-label">Date</span>
                    <span class="approval-field-value">${escapeHTML(createdAt)}</span>
                </div>
                <div class="approval-actions">
                    <button type="button" class="approval-action-button approval-approve" disabled>Approve</button>
                    <button type="button" class="approval-action-button approval-reject" disabled>Reject</button>
                </div>
            </div>
        `;
    }

    function renderPendingTransfer(transfer) {
        const name =
            transfer.user_name ||
            transfer.sender_name_snapshot ||
            "User";

        const account =
            transfer.account_number ||
            transfer.sender_account_snapshot ||
            "—";

        const amount = formatMoney(
            transfer.amount,
            transfer.currency || "USD"
        );

        const reference =
            transfer.transaction_reference ||
            transfer.transfer_reference ||
            "—";

        const createdAt = formatDateTime(transfer.created_at);

        return `
            <div class="approval-item">
                <div class="approval-user">
                    <strong>${escapeHTML(name)}</strong>
                    <span>${escapeHTML(account)}</span>
                </div>
                <div class="approval-field">
                    <span class="approval-field-label">Amount</span>
                    <span class="approval-field-value">${escapeHTML(amount)}</span>
                </div>
                <div class="approval-field">
                    <span class="approval-field-label">Reference</span>
                    <span class="approval-field-value">${escapeHTML(reference)}</span>
                </div>
                <div class="approval-field">
                    <span class="approval-field-label">Date</span>
                    <span class="approval-field-value">${escapeHTML(createdAt)}</span>
                </div>
                <div class="approval-actions">
                    <button type="button" class="approval-action-button approval-approve" disabled>Approve</button>
                    <button type="button" class="approval-action-button approval-reject" disabled>Reject</button>
                </div>
            </div>
        `;
    }

    /* =========================================================
       TRANSACTION HISTORY
    ========================================================= */

    let transactionsRefreshInProgress = false;

    async function loadTransactions() {
        if (!transactionsList || transactionsRefreshInProgress) {
            return;
        }

        transactionsRefreshInProgress = true;

        try {
            const result = await NovaPayAPI.getTransactions();

            const transactions = Array.isArray(result.transactions)
                ? result.transactions
                : [];

            if (!transactions.length) {
                transactionsList.innerHTML = `
                    <div class="empty-state">No transactions yet.</div>
                `;
                return;
            }

            const recent = transactions.slice(0, 5);

            transactionsList.innerHTML = recent.map(function (transaction) {
                const direction =
                    String(transaction.direction || "").toLowerCase() === "incoming" ||
                    (
                        transaction.receiver_id &&
                        String(transaction.receiver_id) === String(user.id)
                    )
                        ? "incoming"
                        : "outgoing";

                const sign = direction === "incoming" ? "+" : "-";

                const name = transaction.display_name || (
                    direction === "incoming"
                        ? transaction.sender_name_snapshot || "Money received"
                        : transaction.receiver_name_snapshot || "Transfer"
                );

                const message = transaction.display_message || (
                    direction === "incoming"
                        ? "Money received"
                        : "Transfer sent"
                );

                const amount = formatMoney(
                    transaction.amount,
                    transaction.currency || user.currency || "USD"
                );

                const transactionStatus = String(
                    transaction.status || "completed"
                ).toLowerCase();

                return `
                    <div class="transaction-item">
                        <div class="transaction-icon">
                            ${direction === "incoming" ? "↓" : "↑"}
                        </div>

                        <div class="transaction-details">
                            <strong>${escapeHTML(name)}</strong>
                            <span>
                                ${escapeHTML(message)}
                                ${
                                    transaction.created_at
                                        ? " • " + escapeHTML(formatDate(transaction.created_at))
                                        : ""
                                }
                            </span>
                        </div>

                        <div class="transaction-amount ${direction}">
                            <strong>${sign}${escapeHTML(amount)}</strong>
                            <span>${escapeHTML(transactionStatus)}</span>
                        </div>
                    </div>
                `;
            }).join("");

        } catch (error) {
            console.error("NOVAPAY TRANSACTIONS ERROR:", error);

            // Avoid replacing existing transaction data with an error
            // message during a temporary background refresh failure.
            if (!transactionsList.children.length) {
                transactionsList.innerHTML = `
                    <div class="empty-state">
                        Unable to load transactions. Please try again.
                    </div>
                `;
            }
        } finally {
            transactionsRefreshInProgress = false;
        }
    }

    /* =========================================================
       MOBILE SIDEBAR
    ========================================================= */

    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add("open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("open");
        }

        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("open");
        }

        document.body.style.overflow = "";
    }

    if (menuButton) {
        menuButton.addEventListener("click", openSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    document.querySelectorAll(".sidebar .nav-link").forEach(function (link) {
        link.addEventListener("click", closeSidebar);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    /* =========================================================
       INITIAL LOAD AND AUTOMATIC REFRESH
    ========================================================= */

    renderUserInformation();
    renderAccountInformation();
    renderAdminVisibility();

    // Fetch fresh data immediately instead of trusting cached balance.
    await refreshAccountData();
    await loadTransactions();

    // Refresh balance and transaction history periodically.
    const dashboardRefreshTimer = window.setInterval(function () {
        if (document.visibilityState === "visible") {
            refreshAccountData();
            loadTransactions();
        }
    }, 15000);

    // Refresh when the user returns to the dashboard tab/window.
    window.addEventListener("focus", function () {
        refreshAccountData();
        loadTransactions();
    });

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
            refreshAccountData();
            loadTransactions();
        }
    });

    // Stop background refresh timers when navigating away.
    window.addEventListener("pagehide", function () {
        window.clearInterval(dashboardRefreshTimer);
    });
});


/* =========================================================
   AIRWALLEX SANDBOX TEST
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("testAirwallexBtn");
    const status = document.getElementById("airwallexStatus");

    if (!button || !status) {
        return;
    }

    button.addEventListener("click", async function () {
        button.disabled = true;
        button.textContent = "Testing...";
        status.textContent = "Connecting to Airwallex Sandbox...";

        try {
            const result = await NovaPayAPI.testAirwallex();

            status.textContent =
                result.message || "Airwallex connection successful.";

            status.classList.remove("error");
            status.classList.add("success");
            button.textContent = "Connected";

        } catch (error) {
            console.error("AIRWALLEX FRONTEND TEST ERROR:", error);

            status.textContent =
                error.message || "Airwallex connection failed.";

            status.classList.remove("success");
            status.classList.add("error");
            button.disabled = false;
            button.textContent = "Try Again";
        }
    });
});
