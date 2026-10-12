"use strict";

/* =========================================================
   NOVAPAY - DEPOSITS PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       AUTH
    ====================================================== */

    if (!NovaPayApp.requireAuth()) {
        return;
    }


    /* =====================================================
       ELEMENTS
    ====================================================== */

    const currentBalance =
        document.getElementById("currentBalance");

    const depositForm =
        document.getElementById("depositForm");

    const depositMethod =
        document.getElementById("depositMethod");

    const formTitle =
        document.getElementById("formTitle");

    const bankFields =
        document.getElementById("bankFields");

    const cardFields =
        document.getElementById("cardFields");

    const methodCards =
        document.querySelectorAll(".method-card");

    const reviewModal =
        document.getElementById("reviewModal");

    const closeReviewModal =
        document.getElementById("closeReviewModal");

    const cancelReview =
        document.getElementById("cancelReview");

    const submitDeposit =
        document.getElementById("submitDeposit");

    const reviewMethod =
        document.getElementById("reviewMethod");

    const reviewAmount =
        document.getElementById("reviewAmount");

    const reviewDescription =
        document.getElementById("reviewDescription");

    const messageModal =
        document.getElementById("messageModal");

    const closeMessageModal =
        document.getElementById("closeMessageModal");

    const messageOkay =
        document.getElementById("messageOkay");

    const messageTitle =
        document.getElementById("messageTitle");

    const messageText =
        document.getElementById("messageText");

    const refreshHistory =
        document.getElementById("refreshHistory");

    const depositHistory =
        document.getElementById("depositHistory");


    /* =====================================================
       STATE
    ====================================================== */

    let selectedMethod = "bank";

    let depositHistoryData = [];

    let pendingDeposit = null;


    /* =====================================================
       LOAD USER BALANCE
    ====================================================== */

    function loadBalance() {

        const user =
            NovaPayApp.getUser();

        if (!user) {
            currentBalance.textContent =
                "$0.00";

            return;
        }


        const account =
            user.account || {};


        const balance =
            account.balance ??
            user.balance ??
            0;


        currentBalance.textContent =
            NovaPayApp.formatMoney(
                balance,
                account.currency || "$"
            );
    }


    /* =====================================================
       METHOD SWITCHING
    ====================================================== */

    methodCards.forEach(card => {

        card.addEventListener("click", () => {

            const method =
                card.dataset.method;

            selectMethod(method);

        });

    });


    function selectMethod(method) {

        selectedMethod =
            method;

        depositMethod.value =
            method;


        methodCards.forEach(card => {

            card.classList.toggle(
                "active",
                card.dataset.method === method
            );

        });


        if (method === "bank") {

            formTitle.textContent =
                "Bank Transfer Deposit";

            bankFields.classList.remove(
                "hidden"
            );

            cardFields.classList.add(
                "hidden"
            );

        } else {

            formTitle.textContent =
                "Debit / Credit Card Deposit";

            bankFields.classList.add(
                "hidden"
            );

            cardFields.classList.remove(
                "hidden"
            );

        }

    }


    /* =====================================================
       FORM VALIDATION
    ====================================================== */

    function validateForm() {

        const amount =
            Number(
                document.getElementById("amount").value
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showMessage(
                "Invalid Amount",
                "Please enter a valid deposit amount.",
                "!"
            );

            return false;
        }


        if (selectedMethod === "bank") {

            const bankName =
                document.getElementById("bankName")
                    .value.trim();

            const accountHolder =
                document.getElementById("accountHolder")
                    .value.trim();

            const accountNumber =
                document.getElementById("accountNumber")
                    .value.trim();

            const routingNumber =
                document.getElementById("routingNumber")
                    .value.trim();


            if (!bankName) {

                showMessage(
                    "Bank Required",
                    "Please enter the bank name.",
                    "!"
                );

                return false;
            }


            if (!accountHolder) {

                showMessage(
                    "Account Holder Required",
                    "Please enter the account holder name.",
                    "!"
                );

                return false;
            }


            if (!accountNumber) {

                showMessage(
                    "Account Number Required",
                    "Please enter the bank account number.",
                    "!"
                );

                return false;
            }


            if (
                !/^\d{9}$/.test(
                    routingNumber
                )
            ) {

                showMessage(
                    "Invalid Routing Number",
                    "A U.S. routing number must contain 9 digits.",
                    "!"
                );

                return false;
            }

        }


        if (selectedMethod === "card") {

            const cardName =
                document.getElementById("cardName")
                    .value.trim();

            const cardNumber =
                document.getElementById("cardNumber")
                    .value.replace(/\s/g, "");

            const expiry =
                document.getElementById("expiry")
                    .value.trim();

            const cvv =
                document.getElementById("cvv")
                    .value.trim();


            if (!cardName) {

                showMessage(
                    "Cardholder Required",
                    "Please enter the cardholder name.",
                    "!"
                );

                return false;
            }


            if (
                !/^\d{13,19}$/.test(
                    cardNumber
                )
            ) {

                showMessage(
                    "Invalid Card",
                    "Please enter a valid card number.",
                    "!"
                );

                return false;
            }


            if (
                !/^\d{2}\/\d{2}$/.test(
                    expiry
                )
            ) {

                showMessage(
                    "Invalid Expiry",
                    "Use the MM/YY format.",
                    "!"
                );

                return false;
            }


            if (
                !/^\d{3,4}$/.test(
                    cvv
                )
            ) {

                showMessage(
                    "Invalid CVV",
                    "Please enter a valid CVV.",
                    "!"
                );

                return false;
            }

        }


        return true;
    }


    /* =====================================================
       FORM SUBMIT
    ====================================================== */

    depositForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            if (!validateForm()) {
                return;
            }


            const amount =
                Number(
                    document.getElementById("amount").value
                );


            const description =
                document.getElementById("description")
                    .value.trim();


            pendingDeposit = {

                method:
                    selectedMethod,

                amount:
                    amount,

                description:
                    description || "—"

            };


            reviewMethod.textContent =
                selectedMethod === "bank"
                    ? "Bank Transfer"
                    : "Debit / Credit Card";


            reviewAmount.textContent =
                NovaPayApp.formatMoney(
                    amount
                );


            reviewDescription.textContent =
                description || "—";


            openModal(
                reviewModal
            );

        }
    );


    /* =====================================================
       SUBMIT DEPOSIT
    ====================================================== */

    submitDeposit.addEventListener(
        "click",
        async () => {

            if (!pendingDeposit) {
                return;
            }


            submitDeposit.disabled =
                true;

            submitDeposit.textContent =
                "Checking provider...";


            /*
             * IMPORTANT:
             *
             * There is currently NO deposit endpoint
             * in the NovaPay backend.
             *
             * We intentionally do NOT create a fake
             * successful deposit here.
             *
             * Once the real payment provider is connected,
             * this section will call the backend deposit
             * endpoint.
             */

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        500
                    )
            );


            submitDeposit.disabled =
                false;

            submitDeposit.textContent =
                "Submit Deposit Request";


            closeModal(
                reviewModal
            );


            showMessage(
                "Payment Provider Not Connected",
                "NovaPay is ready for the deposit interface, but the real payment provider has not been connected yet. No money was moved and no deposit was created.",
                "!"
            );

        }
    );


    /* =====================================================
       MODAL HELPERS
    ====================================================== */

    function openModal(modal) {

        modal.classList.remove(
            "hidden"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeModal(modal) {

        modal.classList.add(
            "hidden"
        );

        if (
            reviewModal.classList.contains("hidden") &&
            messageModal.classList.contains("hidden")
        ) {

            document.body.style.overflow =
                "";
        }

    }


    closeReviewModal.addEventListener(
        "click",
        () => {

            closeModal(
                reviewModal
            );

        }
    );


    cancelReview.addEventListener(
        "click",
        () => {

            closeModal(
                reviewModal
            );

        }
    );


    document.querySelectorAll(
        ".modal-overlay"
    ).forEach(overlay => {

        overlay.addEventListener(
            "click",
            () => {

                const modal =
                    overlay.closest(".modal");

                if (modal) {
                    closeModal(modal);
                }

            }
        );

    });


    /* =====================================================
       MESSAGE
    ====================================================== */

    function showMessage(
        title,
        message,
        icon = "!"
    ) {

        messageTitle.textContent =
            title;

        messageText.textContent =
            message;

        document.getElementById(
            "messageIcon"
        ).textContent =
            icon;

        openModal(
            messageModal
        );
    }


    closeMessageModal.addEventListener(
        "click",
        () => {

            closeModal(
                messageModal
            );

        }
    );


    messageOkay.addEventListener(
        "click",
        () => {

            closeModal(
                messageModal
            );

        }
    );


    /* =====================================================
       CARD NUMBER FORMATTING
    ====================================================== */

    const cardNumberInput =
        document.getElementById(
            "cardNumber"
        );


    cardNumberInput.addEventListener(
        "input",
        () => {

            let value =
                cardNumberInput.value
                    .replace(/\D/g, "")
                    .slice(0, 19);


            value =
                value.match(/.{1,4}/g)
                    ?.join(" ") || "";


            cardNumberInput.value =
                value;

        }
    );


    /* =====================================================
       EXPIRY FORMATTING
    ====================================================== */

    const expiryInput =
        document.getElementById(
            "expiry"
        );


    expiryInput.addEventListener(
        "input",
        () => {

            let value =
                expiryInput.value
                    .replace(/\D/g, "")
                    .slice(0, 4);


            if (value.length >= 3) {

                value =
                    value.slice(0, 2) +
                    "/" +
                    value.slice(2);

            }


            expiryInput.value =
                value;

        }
    );


    /* =====================================================
       LOAD DEPOSIT HISTORY
    ====================================================== */

    async function loadDepositHistory() {

        renderLoading();


        /*
         * The backend currently does not have:
         *
         * GET /api/deposits/history
         *
         * So we attempt the endpoint, but gracefully
         * handle the current 404 until we build it.
         */

        try {

            const response =
                await NovaPayAPI.request(
                    "/deposits/history",
                    {
                        method: "GET"
                    }
                );


            depositHistoryData =
                response.deposits ||
                response.history ||
                [];


            renderHistory();

        } catch (error) {

            /*
             * Expected until the deposit backend
             * is connected.
             */

            depositHistoryData =
                [];

            renderHistory();

        }

    }


    /* =====================================================
       LOADING STATE
    ====================================================== */

    function renderLoading() {

        depositHistory.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    $
                </div>

                <h3>
                    Loading deposits...
                </h3>

                <p>
                    Please wait while NovaPay checks
                    your deposit history.
                </p>

            </div>

        `;

    }


    /* =====================================================
       RENDER HISTORY
    ====================================================== */

    function renderHistory() {

        if (
            !depositHistoryData.length
        ) {

            depositHistory.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        $
                    </div>

                    <h3>
                        No deposits yet
                    </h3>

                    <p>
                        Your deposit activity will appear
                        here once the payment provider is
                        connected.
                    </p>

                </div>

            `;

            return;
        }


        depositHistory.innerHTML =
            depositHistoryData
                .map(
                    transaction =>
                        createHistoryRow(
                            transaction
                        )
                )
                .join("");


        document.querySelectorAll(
            ".view-deposit"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    const item =
                        depositHistoryData.find(
                            deposit =>
                                String(
                                    deposit.id
                                ) === String(id)
                        );

                    if (item) {

                        showDepositDetails(
                            item
                        );

                    }

                }
            );

        });

    }


    /* =====================================================
       HISTORY ROW
    ====================================================== */

    function createHistoryRow(
        deposit
    ) {

        const reference =
            deposit.reference ||
            deposit.deposit_reference ||
            deposit.transaction_reference ||
            "—";


        const method =
            deposit.method ||
            deposit.deposit_method ||
            "—";


        const amount =
            Number(
                deposit.amount || 0
            );


        const status =
            String(
                deposit.status || "pending"
            ).toLowerCase();


        const date =
            deposit.created_at
                ? formatDate(
                    deposit.created_at
                )
                : "—";


        const safeId =
            NovaPayApp.escapeHTML(
                deposit.id ||
                reference
            );


        return `

            <div class="history-row">

                <span class="reference">
                    ${NovaPayApp.escapeHTML(reference)}
                </span>

                <span class="method-text">
                    ${NovaPayApp.escapeHTML(method)}
                </span>

                <span class="amount">
                    ${NovaPayApp.formatMoney(amount)}
                </span>

                <span>
                    <span class="status ${NovaPayApp.escapeHTML(status)}">
                        ${NovaPayApp.escapeHTML(status)}
                    </span>
                </span>

                <span>
                    ${NovaPayApp.escapeHTML(date)}
                </span>

                <span>
                    <button
                        type="button"
                        class="view-btn view-deposit"
                        data-id="${safeId}"
                    >
                        View
                    </button>
                </span>

            </div>

        `;

    }


    /* =====================================================
       DEPOSIT DETAILS
    ====================================================== */

    function showDepositDetails(
        deposit
    ) {

        const reference =
            deposit.reference ||
            deposit.deposit_reference ||
            deposit.transaction_reference ||
            "—";


        const amount =
            Number(
                deposit.amount || 0
            );


        const status =
            deposit.status ||
            "pending";


        const method =
            deposit.method ||
            deposit.deposit_method ||
            "—";


        const date =
            deposit.created_at
                ? formatDate(
                    deposit.created_at
                )
                : "—";


        showMessage(
            "Deposit Details",
            `Reference: ${reference} | Amount: ${NovaPayApp.formatMoney(amount)} | Method: ${method} | Status: ${status} | Date: ${date}`,
            "$"
        );

    }


    /* =====================================================
       DATE
    ====================================================== */

    function formatDate(
        value
    ) {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";
        }


        return date.toLocaleString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    /* =====================================================
       REFRESH
    ====================================================== */

    refreshHistory.addEventListener(
        "click",
        () => {

            loadDepositHistory();

        }
    );


    /* =====================================================
       INITIALIZE
    ====================================================== */

    selectMethod("bank");

    loadBalance();

    loadDepositHistory();

});