"use strict";


/* =========================================================
   NOVAPAY TRANSACTIONS PAGE
========================================================= */


const TransactionsPage = {

    transactions: [],

    filteredTransactions: [],

    selectedTransaction: null,


    /* =====================================================
       INITIALIZE
    ====================================================== */

    async init() {

        if (
            typeof NovaPayApp === "undefined" ||
            !NovaPayApp.requireAuth()
        ) {
            return;
        }


        this.bindEvents();

        await this.loadTransactions();

    },


    /* =====================================================
       EVENTS
    ====================================================== */

    bindEvents() {

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        const directionFilter =
            document.getElementById(
                "directionFilter"
            );


        const typeFilter =
            document.getElementById(
                "typeFilter"
            );


        const refreshBtn =
            document.getElementById(
                "refreshBtn"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                () => this.applyFilters()
            );

        }


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                () => this.applyFilters()
            );

        }


        if (directionFilter) {

            directionFilter.addEventListener(
                "change",
                () => this.applyFilters()
            );

        }


        if (typeFilter) {

            typeFilter.addEventListener(
                "change",
                () => this.applyFilters()
            );

        }


        if (refreshBtn) {

            refreshBtn.addEventListener(
                "click",
                () => this.loadTransactions()
            );

        }


        const closeReceipt =
            document.getElementById(
                "closeReceipt"
            );


        const closeReceiptBottom =
            document.getElementById(
                "closeReceiptBottom"
            );


        const modalOverlay =
            document.querySelector(
                ".modal-overlay"
            );


        const printReceipt =
            document.getElementById(
                "printReceipt"
            );


        if (closeReceipt) {

            closeReceipt.addEventListener(
                "click",
                () => this.closeReceipt()
            );

        }


        if (closeReceiptBottom) {

            closeReceiptBottom.addEventListener(
                "click",
                () => this.closeReceipt()
            );

        }


        if (modalOverlay) {

            modalOverlay.addEventListener(
                "click",
                () => this.closeReceipt()
            );

        }


        if (printReceipt) {

            printReceipt.addEventListener(
                "click",
                () => window.print()
            );

        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    this.closeReceipt();

                }

            }
        );

    },


    /* =====================================================
       LOAD TRANSACTIONS
    ====================================================== */

    async loadTransactions() {

        this.showLoading();


        try {

            const response =
                await NovaPayAPI.getTransactions();


            this.transactions =
                Array.isArray(
                    response.transactions
                )
                    ? response.transactions
                    : [];


            this.updateSummary();

            this.applyFilters();

        } catch (error) {

            console.error(
                "TRANSACTIONS LOAD ERROR:",
                error
            );


            this.transactions = [];

            this.filteredTransactions = [];


            this.showError(
                error.message ||
                "Unable to load transactions."
            );

        }

    },


    /* =====================================================
       FILTERS
    ====================================================== */

    applyFilters() {

        const search =
            (
                document.getElementById(
                    "searchInput"
                )?.value || ""
            )
                .trim()
                .toLowerCase();


        const status =
            document.getElementById(
                "statusFilter"
            )?.value || "all";


        const direction =
            document.getElementById(
                "directionFilter"
            )?.value || "all";


        const type =
            document.getElementById(
                "typeFilter"
            )?.value || "all";


        this.filteredTransactions =
            this.transactions.filter(
                transaction => {

                    const transactionStatus =
                        this.normalizeStatus(
                            transaction.status
                        );


                    const transactionDirection =
                        transaction.direction ||
                        this.getDirection(
                            transaction
                        );


                    const transactionType =
                        this.getTransferType(
                            transaction
                        );


                    const person =
                        transaction.recipient_name ||
                        transaction.receiver_name_snapshot ||
                        transaction.sender_name_snapshot ||
                        "";


                    const searchableText =
                        [
                            transaction.transaction_reference,
                            transaction.description,
                            person,
                            transaction.recipient_bank,
                            transaction.recipient_account_number,
                            transaction.receiver_account_snapshot,
                            transaction.transfer_method,
                            transactionType
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        searchableText.includes(
                            search
                        );


                    const matchesStatus =
                        status === "all" ||
                        transactionStatus === status;


                    const matchesDirection =
                        direction === "all" ||
                        transactionDirection === direction;


                    const matchesType =
                        type === "all" ||
                        transactionType === type;


                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesDirection &&
                        matchesType
                    );

                }
            );


        this.render();

    },


    /* =====================================================
       SUMMARY
    ====================================================== */

    updateSummary() {

        const transactions =
            this.transactions;


        const completed =
            transactions.filter(
                transaction =>
                    this.normalizeStatus(
                        transaction.status
                    ) === "completed"
            );


        let sent = 0;

        let received = 0;

        let pending = 0;


        transactions.forEach(
            transaction => {

                const status =
                    this.normalizeStatus(
                        transaction.status
                    );


                const direction =
                    transaction.direction ||
                    this.getDirection(
                        transaction
                    );


                const amount =
                    Number(
                        transaction.amount || 0
                    );


                if (
                    direction === "outgoing" &&
                    status === "completed"
                ) {

                    sent += amount;

                }


                if (
                    direction === "incoming" &&
                    status === "completed"
                ) {

                    received += amount;

                }


                if (
                    status === "pending"
                ) {

                    pending++;

                }

            }
        );


        this.setText(
            "totalTransactions",
            transactions.length
        );


        this.setText(
            "totalSent",
            this.formatMoney(sent)
        );


        this.setText(
            "totalReceived",
            this.formatMoney(received)
        );


        this.setText(
            "totalPending",
            pending
        );

    },


    /* =====================================================
       RENDER
    ====================================================== */

    render() {

        const body =
            document.getElementById(
                "transactionsBody"
            );


        const emptyState =
            document.getElementById(
                "emptyState"
            );


        if (!body) return;


        body.innerHTML = "";


        if (
            !this.filteredTransactions.length
        ) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="loading-cell"
                        style="color:#888;"
                    >
                        No transactions match your filters.
                    </td>

                </tr>

            `;


            if (emptyState) {

                emptyState.classList.add(
                    "hidden"
                );

            }


            this.renderMobile();

            return;

        }


        if (emptyState) {

            emptyState.classList.add(
                "hidden"
            );

        }


        this.filteredTransactions.forEach(
            transaction => {

                body.appendChild(
                    this.createTableRow(
                        transaction
                    )
                );

            }
        );


        this.renderMobile();

    },


    /* =====================================================
       TABLE ROW
    ====================================================== */

    createTableRow(transaction) {

        const row =
            document.createElement(
                "tr"
            );


        const direction =
            transaction.direction ||
            this.getDirection(
                transaction
            );


        const status =
            this.normalizeStatus(
                transaction.status
            );


        const type =
            this.getTransferType(
                transaction
            );


        const person =
            direction === "outgoing"

                ? (
                    transaction.recipient_name ||
                    transaction.receiver_name_snapshot ||
                    "Recipient"
                )

                : (
                    transaction.sender_name_snapshot ||
                    "Sender"
                );


        const account =
            direction === "outgoing"

                ? (
                    transaction.recipient_account_number ||
                    transaction.receiver_account_snapshot ||
                    "—"
                )

                : (
                    transaction.sender_account_snapshot ||
                    "—"
                );


        const bank =
            transaction.recipient_bank ||
            (
                type === "novapay"
                    ? "NovaPay"
                    : "—"
            );


        const amount =
            Number(
                transaction.amount || 0
            );


        const amountClass =
            direction === "incoming"
                ? "incoming"
                : "outgoing";


        const amountPrefix =
            direction === "incoming"
                ? "+"
                : "−";


        row.innerHTML = `

            <td>

                <div class="transaction-main">

                    <div class="transaction-icon">

                        ${direction === "incoming"
                            ? "↓"
                            : "↑"}

                    </div>

                    <div>

                        <span class="transaction-reference">

                            ${this.escape(
                                transaction.transaction_reference ||
                                "Transaction"
                            )}

                        </span>

                        <span class="transaction-description">

                            ${this.escape(
                                transaction.description ||
                                this.getTypeLabel(type)
                            )}

                        </span>

                    </div>

                </div>

            </td>


            <td>

                <span class="person-name">

                    ${this.escape(person)}

                </span>

                <span class="account-number">

                    ${this.escape(
                        bank
                    )}

                    ·

                    ${this.escape(
                        this.maskAccount(account)
                    )}

                </span>

            </td>


            <td>

                <span class="type-badge">

                    ${this.escape(
                        this.getTypeLabel(type)
                    )}

                </span>

            </td>


            <td>

                <span class="amount ${amountClass}">

                    ${amountPrefix}
                    ${this.formatMoney(
                        amount,
                        transaction.currency || "$"
                    )}

                </span>

            </td>


            <td>

                <span class="status-badge ${status}">

                    ${this.escape(
                        this.getStatusLabel(status)
                    )}

                </span>

            </td>


            <td>

                <span class="date-main">

                    ${this.formatDate(
                        transaction.created_at
                    )}

                </span>

                <span class="date-time">

                    ${this.formatTime(
                        transaction.created_at
                    )}

                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="view-btn"
                    data-transaction-id="${this.escapeAttribute(
                        transaction.id
                    )}"
                >
                    View Receipt
                </button>

            </td>

        `;


        const viewButton =
            row.querySelector(
                ".view-btn"
            );


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                () => this.openReceipt(
                    transaction
                )
            );

        }


        return row;

    },


    /* =====================================================
       MOBILE RENDER
    ====================================================== */

    renderMobile() {

        const container =
            document.getElementById(
                "mobileTransactions"
            );


        if (!container) return;


        container.innerHTML = "";


        if (
            !this.filteredTransactions.length
        ) {

            return;

        }


        this.filteredTransactions.forEach(
            transaction => {

                const direction =
                    transaction.direction ||
                    this.getDirection(
                        transaction
                    );


                const status =
                    this.normalizeStatus(
                        transaction.status
                    );


                const type =
                    this.getTransferType(
                        transaction
                    );


                const person =
                    direction === "outgoing"

                        ? (
                            transaction.recipient_name ||
                            transaction.receiver_name_snapshot ||
                            "Recipient"
                        )

                        : (
                            transaction.sender_name_snapshot ||
                            "Sender"
                        );


                const amount =
                    Number(
                        transaction.amount || 0
                    );


                const prefix =
                    direction === "incoming"
                        ? "+"
                        : "−";


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "mobile-transaction-card";


                card.innerHTML = `

                    <div class="mobile-card-top">

                        <div class="mobile-card-person">

                            <div class="mobile-card-icon">

                                ${direction === "incoming"
                                    ? "↓"
                                    : "↑"}

                            </div>

                            <div>

                                <div class="mobile-card-name">

                                    ${this.escape(
                                        person
                                    )}

                                </div>

                                <div class="mobile-card-reference">

                                    ${this.escape(
                                        transaction.transaction_reference ||
                                        "Transaction"
                                    )}

                                </div>

                            </div>

                        </div>


                        <span class="status-badge ${status}">

                            ${this.escape(
                                this.getStatusLabel(
                                    status
                                )
                            )}

                        </span>

                    </div>


                    <div class="mobile-card-amount">

                        ${prefix}
                        ${this.formatMoney(
                            amount,
                            transaction.currency || "$"
                        )}

                    </div>


                    <div class="mobile-card-info">

                        <div class="mobile-info-item">

                            <span>
                                Type
                            </span>

                            <strong>

                                ${this.escape(
                                    this.getTypeLabel(
                                        type
                                    )
                                )}

                            </strong>

                        </div>


                        <div class="mobile-info-item">

                            <span>
                                Date
                            </span>

                            <strong>

                                ${this.formatDate(
                                    transaction.created_at
                                )}

                            </strong>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="mobile-card-action"
                    >
                        View Receipt
                    </button>

                `;


                const button =
                    card.querySelector(
                        ".mobile-card-action"
                    );


                if (button) {

                    button.addEventListener(
                        "click",
                        () => this.openReceipt(
                            transaction
                        )
                    );

                }


                container.appendChild(
                    card
                );

            }
        );

    },


    /* =====================================================
       RECEIPT
    ====================================================== */

    openReceipt(transaction) {

        this.selectedTransaction =
            transaction;


        const direction =
            transaction.direction ||
            this.getDirection(
                transaction
            );


        const status =
            this.normalizeStatus(
                transaction.status
            );


        const type =
            this.getTransferType(
                transaction
            );


        const person =
            direction === "outgoing"

                ? (
                    transaction.recipient_name ||
                    transaction.receiver_name_snapshot ||
                    "Recipient"
                )

                : (
                    transaction.sender_name_snapshot ||
                    "Sender"
                );


        const bank =
            transaction.recipient_bank ||
            (
                type === "novapay"
                    ? "NovaPay"
                    : "—"
            );


        const account =
            direction === "outgoing"

                ? (
                    transaction.recipient_account_number ||
                    transaction.receiver_account_snapshot
                )

                : transaction.sender_account_snapshot;


        this.setText(
            "receiptAmount",
            `${direction === "incoming" ? "+" : "−"}${this.formatMoney(
                transaction.amount,
                transaction.currency || "$"
            )}`
        );


        this.setText(
            "receiptReference",
            transaction.transaction_reference ||
            "—"
        );


        this.setText(
            "receiptType",
            this.getTypeLabel(type)
        );


        this.setText(
            "receiptPerson",
            person
        );


        this.setText(
            "receiptBank",
            bank
        );


        this.setText(
            "receiptMethod",
            this.getMethodLabel(
                transaction.transfer_method,
                type
            )
        );


        this.setText(
            "receiptAccount",
            this.maskAccount(
                account
            )
        );


        this.setText(
            "receiptCurrency",
            transaction.currency ||
            transaction.recipient_currency ||
            "USD"
        );


        this.setText(
            "receiptDate",
            this.formatDateTime(
                transaction.created_at
            )
        );


        this.setText(
            "receiptStatusText",
            this.getStatusLabel(
                status
            )
        );


        const statusBadge =
            document.getElementById(
                "receiptStatus"
            );


        if (statusBadge) {

            statusBadge.textContent =
                this.getStatusLabel(
                    status
                ).toUpperCase();


            statusBadge.className =
                `receipt-status ${status}`;

        }


        const modal =
            document.getElementById(
                "receiptModal"
            );


        if (modal) {

            modal.classList.remove(
                "hidden"
            );

            document.body.style.overflow =
                "hidden";

        }

    },


    closeReceipt() {

        const modal =
            document.getElementById(
                "receiptModal"
            );


        if (modal) {

            modal.classList.add(
                "hidden"
            );

        }


        document.body.style.overflow =
            "";

    },


    /* =====================================================
       HELPERS
    ====================================================== */

    getDirection(transaction) {

        const user =
            NovaPayApp.getUser();


        if (
            user &&
            transaction.sender_id ===
            user.id
        ) {

            return "outgoing";

        }


        return "incoming";

    },


    getTransferType(transaction) {

        const type =
            String(
                transaction.transfer_type ||
                ""
            )
                .trim()
                .toLowerCase();


        if (
            type === "us_domestic"
        ) {

            return "us_domestic";

        }


        if (
            type === "international"
        ) {

            return "international";

        }


        if (
            type === "novapay"
        ) {

            return "novapay";

        }


        /*
         * Existing transactions created
         * before transfer_type existed.
         */

        return "novapay";

    },


    getTypeLabel(type) {

        const labels = {

            novapay:
                "NovaPay",

            us_domestic:
                "U.S. Domestic",

            international:
                "International"

        };


        return (
            labels[type] ||
            "Transfer"
        );

    },


    getMethodLabel(method, type) {

        if (!method) {

            if (
                type === "novapay"
            ) {

                return "NovaPay Transfer";

            }

            return "—";

        }


        const value =
            String(method)
                .toLowerCase();


        const labels = {

            ach:
                "ACH",

            domestic_wire:
                "Domestic Wire",

            international_wire:
                "International Wire",

            novapay:
                "NovaPay Transfer"

        };


        return (
            labels[value] ||
            method
        );

    },


    normalizeStatus(status) {

        const value =
            String(
                status || ""
            )
                .trim()
                .toLowerCase();


        if (
            value === "rejected" ||
            value === "declined"
        ) {

            return "rejected";

        }


        if (
            value === "completed" ||
            value === "complete" ||
            value === "success" ||
            value === "successful"
        ) {

            return "completed";

        }


        return "pending";

    },


    getStatusLabel(status) {

        const labels = {

            completed:
                "Completed",

            pending:
                "Pending",

            rejected:
                "Declined"

        };


        return (
            labels[status] ||
            "Pending"
        );

    },


    formatMoney(
        amount,
        currency = "$"
    ) {

        const value =
            Number(
                amount || 0
            );


        const symbol =
            currency === "$"
                ? "$"
                : currency;


        return `${symbol}${value.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;

    },


    formatDate(date) {

        if (!date) {

            return "—";

        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "—";

        }


        return parsed.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    },


    formatTime(date) {

        if (!date) {

            return "—";

        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "—";

        }


        return parsed.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    },


    formatDateTime(date) {

        if (!date) {

            return "—";

        }


        return `${this.formatDate(
            date
        )} at ${this.formatTime(
            date
        )}`;

    },


    maskAccount(account) {

        if (!account) {

            return "—";

        }


        const value =
            String(account);


        if (
            value.length <= 4
        ) {

            return value;

        }


        return `•••• ${value.slice(-4)}`;

    },


    setText(id, value) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.textContent =
                value ?? "—";

        }

    },


    escape(value) {

        if (
            typeof NovaPayApp !==
            "undefined" &&
            NovaPayApp.escapeHTML
        ) {

            return NovaPayApp.escapeHTML(
                value
            );

        }


        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            value ?? "";


        return div.innerHTML;

    },


    escapeAttribute(value) {

        return this.escape(
            value
        )
            .replace(
                /"/g,
                "&quot;"
            );

    },


    /* =====================================================
       LOADING / ERROR
    ====================================================== */

    showLoading() {

        const body =
            document.getElementById(
                "transactionsBody"
            );


        const mobile =
            document.getElementById(
                "mobileTransactions"
            );


        if (body) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="loading-cell"
                    >

                        <div class="loader"></div>

                        Loading transactions...

                    </td>

                </tr>

            `;

        }


        if (mobile) {

            mobile.innerHTML = "";

        }

    },


    showError(message) {

        const body =
            document.getElementById(
                "transactionsBody"
            );


        if (!body) return;


        body.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading-cell"
                    style="color:#c53232;"
                >

                    ${this.escape(
                        message
                    )}

                </td>

            </tr>

        `;

    }

};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        TransactionsPage.init();

    }
);