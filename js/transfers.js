"use strict";

/* =========================================================
   NOVAPAY - TRANSFERS PAGE
   ========================================================= */

(function () {

  /* =======================================================
     AUTH
  ======================================================= */

  if (!NovaPayApp.requireAuth()) {
    return;
  }


  /* =======================================================
     STATE
  ======================================================= */

  const state = {

    transferType: "novapay",

    recipientVerified: false,

    recipient: null,

    pendingTransfer: null,

    lastReceipt: null

  };


  /* =======================================================
     DOM
  ======================================================= */

  const elements = {

    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebarOverlay"),
    mobileMenu: document.getElementById("mobileMenu"),

    topbarAvatar: document.getElementById("topbarAvatar"),
    topbarName: document.getElementById("topbarName"),
    topbarAccount: document.getElementById("topbarAccount"),

    transferTypes:
      document.querySelectorAll(".transfer-type"),

    formTitle:
      document.getElementById("formTitle"),

    transferForm:
      document.getElementById("transferForm"),

    novapayForm:
      document.getElementById("novapayForm"),

    usDomesticForm:
      document.getElementById("usDomesticForm"),

    internationalForm:
      document.getElementById("internationalForm"),

    novaPayAccount:
      document.getElementById("novaPayAccount"),

    lookupRecipient:
      document.getElementById("lookupRecipient"),

    novaRecipientResult:
      document.getElementById("novaRecipientResult"),

    recipientAvatar:
      document.getElementById("recipientAvatar"),

    recipientName:
      document.getElementById("recipientName"),

    recipientBank:
      document.getElementById("recipientBank"),

    recipientAccount:
      document.getElementById("recipientAccount"),

    recipientVerified:
      document.getElementById("recipientVerified"),

    usRecipientName:
      document.getElementById("usRecipientName"),

    usBankName:
      document.getElementById("usBankName"),

    usAccountType:
      document.getElementById("usAccountType"),

    usRoutingNumber:
      document.getElementById("usRoutingNumber"),

    usAccountNumber:
      document.getElementById("usAccountNumber"),

    internationalCountry:
      document.getElementById("internationalCountry"),

    internationalCurrency:
      document.getElementById("internationalCurrency"),

    internationalRecipientName:
      document.getElementById("internationalRecipientName"),

    internationalBankName:
      document.getElementById("internationalBankName"),

    internationalBankCountry:
      document.getElementById("internationalBankCountry"),

    internationalAccount:
      document.getElementById("internationalAccount"),

    internationalSwift:
      document.getElementById("internationalSwift"),

    transferAmount:
      document.getElementById("transferAmount"),

    transferDescription:
      document.getElementById("transferDescription"),

    formMessage:
      document.getElementById("formMessage"),

    continueButton:
      document.getElementById("continueButton"),

    summaryAmount:
      document.getElementById("summaryAmount"),

    summaryType:
      document.getElementById("summaryType"),

    summaryRecipient:
      document.getElementById("summaryRecipient"),

    summaryMethod:
      document.getElementById("summaryMethod"),

    summaryCurrency:
      document.getElementById("summaryCurrency"),

    summaryTotal:
      document.getElementById("summaryTotal"),

    confirmationModal:
      document.getElementById("confirmationModal"),

    closeConfirmation:
      document.getElementById("closeConfirmation"),

    cancelConfirmation:
      document.getElementById("cancelConfirmation"),

    confirmTransfer:
      document.getElementById("confirmTransfer"),

    confirmType:
      document.getElementById("confirmType"),

    confirmRecipient:
      document.getElementById("confirmRecipient"),

    confirmBank:
      document.getElementById("confirmBank"),

    confirmAccount:
      document.getElementById("confirmAccount"),

    confirmMethod:
      document.getElementById("confirmMethod"),

    confirmAmount:
      document.getElementById("confirmAmount"),

    receiptModal:
      document.getElementById("receiptModal"),

    closeReceipt:
      document.getElementById("closeReceipt"),

    doneReceipt:
      document.getElementById("doneReceipt"),

    printReceipt:
      document.getElementById("printReceipt"),

    receiptStatusIcon:
      document.getElementById("receiptStatusIcon"),

    receiptTitle:
      document.getElementById("receiptTitle"),

    receiptStatusText:
      document.getElementById("receiptStatusText"),

    receiptReference:
      document.getElementById("receiptReference"),

    receiptStatus:
      document.getElementById("receiptStatus"),

    receiptType:
      document.getElementById("receiptType"),

    receiptRecipient:
      document.getElementById("receiptRecipient"),

    receiptBank:
      document.getElementById("receiptBank"),

    receiptAmount:
      document.getElementById("receiptAmount"),

    receiptCurrency:
      document.getElementById("receiptCurrency"),

    receiptMethod:
      document.getElementById("receiptMethod"),

    receiptDate:
      document.getElementById("receiptDate"),

    receiptSender:
      document.getElementById("receiptSender"),

    receiptRecipientAccount:
      document.getElementById("receiptRecipientAccount")

  };


  /* =======================================================
     INITIALIZE USER
  ======================================================= */

  function initializeUser() {

    const user = NovaPayApp.getUser();

    if (!user) {
      NovaPayApp.logout(true);
      return;
    }

    const fullName =
      user.full_name ||
      user.name ||
      "NovaPay User";

    const accountNumber =
      user.account_number ||
      "Account";

    elements.topbarName.textContent = fullName;

    elements.topbarAccount.textContent =
      maskAccount(accountNumber);

    const initials =
      getInitials(fullName);

    elements.topbarAvatar.textContent = initials;

    if (user.profile_photo) {

      const image =
        document.createElement("img");

      image.src = user.profile_photo;

      image.alt = fullName;

      image.onerror = function () {
        elements.topbarAvatar.textContent = initials;
      };

      elements.topbarAvatar.innerHTML = "";

      elements.topbarAvatar.appendChild(image);

    }

  }


  /* =======================================================
     HELPERS
  ======================================================= */

  function getInitials(name) {

    return String(name || "N")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join("") || "N";

  }


  function maskAccount(account) {

    const value = String(account || "");

    if (!value) {
      return "Account";
    }

    if (value.length <= 4) {
      return value;
    }

    return "•••• " + value.slice(-4);

  }


  function maskRecipientAccount(account) {

    const value = String(account || "");

    if (!value) {
      return "—";
    }

    if (value.length <= 4) {
      return value;
    }

    return "••••••" + value.slice(-4);

  }


  function formatAmount(amount) {

    return NovaPayApp.formatMoney(
      Number(amount || 0),
      "$"
    );

  }


  function showMessage(message, type = "error") {

    elements.formMessage.hidden = false;

    elements.formMessage.textContent = message;

    elements.formMessage.className =
      `form-message ${type}`;

  }


  function hideMessage() {

    elements.formMessage.hidden = true;

    elements.formMessage.textContent = "";

    elements.formMessage.className =
      "form-message";

  }


  function setButtonLoading(button, loading, loadingText) {

    if (!button) {
      return;
    }

    if (loading) {

      button.dataset.originalText =
        button.textContent;

      button.textContent =
        loadingText || "Please wait...";

      button.disabled = true;

    } else {

      button.textContent =
        button.dataset.originalText ||
        "Continue";

      button.disabled = false;

    }

  }


  /* =======================================================
     TRANSFER TYPE
  ======================================================= */

  function switchTransferType(type) {

    state.transferType = type;

    state.recipientVerified = false;

    state.recipient = null;

    elements.transferTypes.forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.type === type
      );

    });


    elements.novapayForm.classList.toggle(
      "active",
      type === "novapay"
    );

    elements.usDomesticForm.classList.toggle(
      "active",
      type === "us_domestic"
    );

    elements.internationalForm.classList.toggle(
      "active",
      type === "international"
    );


    if (type === "novapay") {

      elements.formTitle.textContent =
        "NovaPay Transfer";

    }

    if (type === "us_domestic") {

      elements.formTitle.textContent =
        "U.S. Domestic Transfer";

    }

    if (type === "international") {

      elements.formTitle.textContent =
        "International Transfer";

    }


    hideMessage();

    updateSummary();

  }


  /* =======================================================
     NOVAPAY RECIPIENT LOOKUP
  ======================================================= */

  async function lookupNovaPayRecipient() {

    const accountNumber =
      elements.novaPayAccount.value.trim();

    if (!accountNumber) {

      showMessage(
        "Enter a NovaPay account number first."
      );

      return;
    }


    if (accountNumber.length < 4) {

      showMessage(
        "Enter a valid NovaPay account number."
      );

      return;
    }


    state.recipientVerified = false;

    state.recipient = null;

    elements.novaRecipientResult.hidden = true;

    setButtonLoading(
      elements.lookupRecipient,
      true,
      "Finding..."
    );


    try {

      /*
       * This endpoint will be added to the backend
       * in the next step:
       *
       * GET /api/transfers/recipient/:accountNumber
       *
       * We intentionally do NOT create fake recipient
       * information in the frontend.
       */

      const data =
        await NovaPayAPI.request(
          `/transfers/recipient/${encodeURIComponent(accountNumber)}`,
          {
            method: "GET"
          }
        );


      const recipient =
        data.recipient ||
        data.user ||
        data.data ||
        null;


      if (!recipient) {

        throw new Error(
          "Recipient account was not found."
        );

      }


      state.recipient = {

        name:
          recipient.full_name ||
          recipient.name ||
          "NovaPay User",

        bank:
          recipient.bank_name ||
          "NovaPay",

        accountNumber:
          recipient.account_number ||
          accountNumber

      };


      state.recipientVerified = true;


      displayRecipient();

      hideMessage();

      updateSummary();

    } catch (error) {

      state.recipientVerified = false;

      state.recipient = null;

      elements.novaRecipientResult.hidden = true;

      showMessage(
        error.message ||
        "Unable to find this NovaPay recipient."
      );

      updateSummary();

    } finally {

      setButtonLoading(
        elements.lookupRecipient,
        false
      );

    }

  }


  /* =======================================================
     DISPLAY RECIPIENT
  ======================================================= */

  function displayRecipient() {

    if (!state.recipient) {
      return;
    }


    const recipient =
      state.recipient;


    const initials =
      getInitials(recipient.name);


    elements.recipientAvatar.textContent =
      initials;


    elements.recipientName.textContent =
      recipient.name;


    elements.recipientBank.textContent =
      recipient.bank;


    elements.recipientAccount.textContent =
      maskRecipientAccount(
        recipient.accountNumber
      );


    elements.recipientVerified.textContent =
      "✓ Verified";


    elements.novaRecipientResult.hidden =
      false;

  }


  /* =======================================================
     U.S. TRANSFER METHOD
  ======================================================= */

  function getUSMethod() {

    const selected =
      document.querySelector(
        'input[name="us_transfer_method"]:checked'
      );

    return selected
      ? selected.value
      : "ACH";

  }


  /* =======================================================
     GET FORM DATA
  ======================================================= */

  function getTransferData() {

    const amount =
      Number(elements.transferAmount.value);


    const description =
      elements.transferDescription.value.trim();


    if (!amount || amount <= 0) {

      throw new Error(
        "Enter a transfer amount greater than $0.00."
      );

    }


    if (state.transferType === "novapay") {

      if (!state.recipientVerified) {

        throw new Error(
          "Find and verify the NovaPay recipient before continuing."
        );

      }


      return {

        transfer_type: "novapay",

        receiver_account_number:
          state.recipient.accountNumber,

        recipient_name:
          state.recipient.name,

        recipient_bank:
          state.recipient.bank,

        recipient_account_number:
          state.recipient.accountNumber,

        amount,

        currency: "USD",

        description

      };

    }


    if (state.transferType === "us_domestic") {

      const name =
        elements.usRecipientName.value.trim();

      const bank =
        elements.usBankName.value.trim();

      const accountType =
        elements.usAccountType.value;

      const routing =
        elements.usRoutingNumber.value.trim();

      const account =
        elements.usAccountNumber.value.trim();

      const method =
        getUSMethod();


      if (!name) {

        throw new Error(
          "Enter the U.S. account holder name."
        );

      }


      if (!bank) {

        throw new Error(
          "Enter the U.S. bank name."
        );

      }


      if (!accountType) {

        throw new Error(
          "Select the U.S. bank account type."
        );

      }


      if (!/^\d{9}$/.test(routing)) {

        throw new Error(
          "U.S. routing number must contain exactly 9 digits."
        );

      }


      if (!account) {

        throw new Error(
          "Enter the U.S. bank account number."
        );

      }


      return {

        transfer_type: "us_domestic",

        recipient_name: name,

        recipient_bank: bank,

        recipient_account_number: account,

        routing_number: routing,

        account_type: accountType,

        transfer_method: method,

        amount,

        currency: "USD",

        description

      };

    }


    if (state.transferType === "international") {

      const country =
        elements.internationalCountry.value;

      const currency =
        elements.internationalCurrency.value;

      const name =
        elements.internationalRecipientName.value.trim();

      const bank =
        elements.internationalBankName.value.trim();

      const bankCountry =
        elements.internationalBankCountry.value.trim();

      const account =
        elements.internationalAccount.value.trim();

      const swift =
        elements.internationalSwift.value.trim();


      if (!country) {

        throw new Error(
          "Select the recipient country."
        );

      }


      if (!name) {

        throw new Error(
          "Enter the international recipient name."
        );

      }


      if (!bank) {

        throw new Error(
          "Enter the international bank name."
        );

      }


      if (!bankCountry) {

        throw new Error(
          "Enter the bank country."
        );

      }


      if (!account) {

        throw new Error(
          "Enter the account number or IBAN."
        );

      }


      if (!swift) {

        throw new Error(
          "Enter the SWIFT/BIC code."
        );

      }


      return {

        transfer_type: "international",

        recipient_name: name,

        recipient_bank: bank,

        recipient_bank_country: bankCountry,

        recipient_country: country,

        recipient_account_number: account,

        swift_bic: swift,

        amount,

        currency,

        description

      };

    }


    throw new Error(
      "Invalid transfer type."
    );

  }


  /* =======================================================
     SUMMARY
  ======================================================= */

  function updateSummary() {

    const amount =
      Number(elements.transferAmount.value || 0);


    elements.summaryAmount.textContent =
      formatAmount(amount);


    elements.summaryTotal.textContent =
      formatAmount(amount);


    if (state.transferType === "novapay") {

      elements.summaryType.textContent =
        "NovaPay";

      elements.summaryMethod.textContent =
        "NovaPay";

      elements.summaryCurrency.textContent =
        "USD";


      if (state.recipient) {

        elements.summaryRecipient.textContent =
          state.recipient.name;

      } else {

        elements.summaryRecipient.textContent =
          "Not selected";

      }

      return;

    }


    if (state.transferType === "us_domestic") {

      elements.summaryType.textContent =
        "U.S. Domestic";

      elements.summaryMethod.textContent =
        getUSMethod();

      elements.summaryCurrency.textContent =
        "USD";


      const name =
        elements.usRecipientName.value.trim();

      elements.summaryRecipient.textContent =
        name || "Not selected";

      return;

    }


    if (state.transferType === "international") {

      elements.summaryType.textContent =
        "International";

      elements.summaryMethod.textContent =
        "International";

      elements.summaryCurrency.textContent =
        elements.internationalCurrency.value ||
        "USD";


      const name =
        elements.internationalRecipientName.value.trim();

      elements.summaryRecipient.textContent =
        name || "Not selected";

    }

  }


  /* =======================================================
     BUILD CONFIRMATION
  ======================================================= */

  function openConfirmation(data) {

    elements.confirmType.textContent =
      getTransferTypeLabel(
        state.transferType
      );


    elements.confirmRecipient.textContent =
      data.recipient_name ||
      "—";


    elements.confirmBank.textContent =
      data.recipient_bank ||
      "—";


    elements.confirmAccount.textContent =
      maskRecipientAccount(
        data.recipient_account_number
      );


    elements.confirmMethod.textContent =
      data.transfer_method ||
      getDefaultMethod(data);


    elements.confirmAmount.textContent =
      formatAmount(data.amount);


    elements.confirmationModal.hidden =
      false;

    document.body.style.overflow =
      "hidden";

  }


  function getTransferTypeLabel(type) {

    if (type === "novapay") {
      return "NovaPay";
    }

    if (type === "us_domestic") {
      return "U.S. Domestic";
    }

    if (type === "international") {
      return "International";
    }

    return type;

  }


  function getDefaultMethod(data) {

    if (data.transfer_type === "novapay") {
      return "NovaPay";
    }

    if (data.transfer_type === "international") {
      return "International";
    }

    return "ACH";

  }


  /* =======================================================
     CLOSE CONFIRMATION
  ======================================================= */

  function closeConfirmation() {

    elements.confirmationModal.hidden =
      true;

    document.body.style.overflow =
      "";

  }


  /* =======================================================
     CREATE TRANSFER
  ======================================================= */

  async function submitTransfer() {

    if (!state.pendingTransfer) {
      return;
    }


    const data =
      state.pendingTransfer;


    setButtonLoading(
      elements.confirmTransfer,
      true,
      "Sending..."
    );


    try {

      /*
       * Backend will be updated to accept:
       *
       * transfer_type
       * recipient details
       * U.S. routing number
       * account type
       * ACH / wire
       * international banking information
       */

      const response =
        await NovaPayAPI.createTransfer(
          data
        );


      const transfer =
        response.transfer ||
        response.data ||
        response;


      closeConfirmation();

      showReceipt(
        buildReceipt(
          transfer,
          data
        )
      );


    } catch (error) {

      closeConfirmation();

      showMessage(
        error.message ||
        "Unable to create transfer."
      );

    } finally {

      setButtonLoading(
        elements.confirmTransfer,
        false,
        "Confirm & Send"
      );

    }

  }


  /* =======================================================
     RECEIPT
  ======================================================= */

  function buildReceipt(
    transfer,
    originalData
  ) {

    const user =
      NovaPayApp.getUser() || {};


    const status =
      normalizeStatus(
        transfer.status ||
        "pending"
      );


    return {

      reference:
        transfer.reference ||
        transfer.transfer_reference ||
        transfer.id ||
        generateLocalReference(),

      status,

      type:
        getTransferTypeLabel(
          originalData.transfer_type
        ),

      recipient:
        transfer.recipient_name ||
        originalData.recipient_name ||
        "—",

      bank:
        transfer.recipient_bank ||
        originalData.recipient_bank ||
        "—",

      amount:
        Number(
          transfer.amount ||
          originalData.amount ||
          0
        ),

      currency:
        transfer.currency ||
        originalData.currency ||
        "USD",

      method:
        transfer.transfer_method ||
        originalData.transfer_method ||
        getDefaultMethod(
          originalData
        ),

      date:
        transfer.created_at ||
        new Date().toISOString(),

      sender:
        transfer.sender_account_number ||
        user.account_number ||
        "—",

      recipientAccount:
        transfer.recipient_account_number ||
        originalData.recipient_account_number ||
        "—"

    };

  }


  function normalizeStatus(status) {

    const value =
      String(status || "")
        .toLowerCase()
        .trim();


    if (
      value === "completed" ||
      value === "complete" ||
      value === "success" ||
      value === "successful"
    ) {
      return "successful";
    }


    if (
      value === "rejected" ||
      value === "declined" ||
      value === "failed"
    ) {
      return "declined";
    }


    return "pending";

  }


  function generateLocalReference() {

    const timestamp =
      Date.now()
        .toString()
        .slice(-10);

    return `NP-${timestamp}`;

  }


  function showReceipt(receipt) {

    state.lastReceipt =
      receipt;


    elements.receiptReference.textContent =
      receipt.reference;


    elements.receiptStatus.textContent =
      getReceiptStatusLabel(
        receipt.status
      );


    elements.receiptType.textContent =
      receipt.type;


    elements.receiptRecipient.textContent =
      receipt.recipient;


    elements.receiptBank.textContent =
      receipt.bank;


    elements.receiptAmount.textContent =
      formatAmount(receipt.amount);


    elements.receiptCurrency.textContent =
      receipt.currency;


    elements.receiptMethod.textContent =
      receipt.method;


    elements.receiptDate.textContent =
      formatDate(receipt.date);


    elements.receiptSender.textContent =
      maskAccount(receipt.sender);


    elements.receiptRecipientAccount.textContent =
      maskRecipientAccount(
        receipt.recipientAccount
      );


    elements.receiptStatusIcon.className =
      `receipt-status-icon ${receipt.status}`;


    if (receipt.status === "successful") {

      elements.receiptStatusIcon.textContent =
        "✓";

      elements.receiptTitle.textContent =
        "Transfer Successful";

      elements.receiptStatusText.textContent =
        "Your transfer has been successfully processed.";

    }


    if (receipt.status === "pending") {

      elements.receiptStatusIcon.textContent =
        "…";

      elements.receiptTitle.textContent =
        "Transfer Pending";

      elements.receiptStatusText.textContent =
        "Your transfer has been received and is awaiting processing.";

    }


    if (receipt.status === "declined") {

      elements.receiptStatusIcon.textContent =
        "!";

      elements.receiptTitle.textContent =
        "Transfer Declined";

      elements.receiptStatusText.textContent =
        "The transfer was declined and no successful transfer was completed.";

    }


    elements.receiptModal.hidden =
      false;

    document.body.style.overflow =
      "hidden";

  }


  function getReceiptStatusLabel(status) {

    if (status === "successful") {
      return "Successful";
    }

    if (status === "pending") {
      return "Pending";
    }

    if (status === "declined") {
      return "Declined";
    }

    return "Pending";

  }


  function formatDate(value) {

    const date =
      new Date(value);


    if (Number.isNaN(date.getTime())) {
      return String(value || "—");
    }


    return date.toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  }


  /* =======================================================
     CLOSE RECEIPT
  ======================================================= */

  function closeReceipt() {

    elements.receiptModal.hidden =
      true;

    document.body.style.overflow =
      "";

  }


  /* =======================================================
     PRINT RECEIPT
  ======================================================= */

  function printReceipt() {

    if (!state.lastReceipt) {
      return;
    }


    const receipt =
      state.lastReceipt;


    const printWindow =
      window.open(
        "",
        "_blank",
        "width=700,height=850"
      );


    if (!printWindow) {

      alert(
        "Please allow pop-ups to print your receipt."
      );

      return;

    }


    const safe =
      value =>
        NovaPayApp.escapeHTML(
          String(value ?? "")
        );


    printWindow.document.write(`

      <!DOCTYPE html>

      <html>

      <head>

        <title>
          NovaPay Transfer Receipt
        </title>

        <style>

          body {
            font-family:
              Arial,
              sans-serif;

            padding: 40px;

            color: #111;
          }

          .header {
            display: flex;

            align-items: center;

            justify-content:
              space-between;

            border-bottom:
              2px solid #f5b400;

            padding-bottom: 20px;

            margin-bottom: 25px;
          }

          .brand {
            font-size: 25px;

            font-weight: 900;
          }

          .brand span {
            color: #c88f00;
          }

          .label {
            font-size: 10px;

            letter-spacing: 2px;

            color: #777;

            font-weight: 700;
          }

          .reference {
            background: #fafafa;

            padding: 15px;

            border: 1px dashed #ccc;

            margin-bottom: 20px;
          }

          .reference strong {
            display: block;

            margin-top: 5px;
          }

          table {
            width: 100%;

            border-collapse:
              collapse;
          }

          td {
            padding: 12px 8px;

            border-bottom:
              1px solid #eee;
          }

          td:first-child {
            color: #777;

            width: 40%;
          }

          td:last-child {
            font-weight: 700;

            text-align: right;
          }

          .status {
            margin-top: 25px;

            padding: 15px;

            background: #fff9e8;

            border-left:
              4px solid #f5b400;
          }

          .footer {
            margin-top: 35px;

            font-size: 10px;

            color: #888;

            line-height: 1.6;
          }

        </style>

      </head>

      <body>

        <div class="header">

          <div class="brand">
            Nova<span>Pay</span>
          </div>

          <div class="label">
            TRANSFER RECEIPT
          </div>

        </div>


        <div class="reference">

          <div class="label">
            TRANSFER REFERENCE
          </div>

          <strong>
            ${safe(receipt.reference)}
          </strong>

        </div>


        <table>

          <tr>
            <td>Status</td>
            <td>${safe(getReceiptStatusLabel(receipt.status))}</td>
          </tr>

          <tr>
            <td>Transfer Type</td>
            <td>${safe(receipt.type)}</td>
          </tr>

          <tr>
            <td>Recipient</td>
            <td>${safe(receipt.recipient)}</td>
          </tr>

          <tr>
            <td>Bank</td>
            <td>${safe(receipt.bank)}</td>
          </tr>

          <tr>
            <td>Amount</td>
            <td>${safe(formatAmount(receipt.amount))}</td>
          </tr>

          <tr>
            <td>Currency</td>
            <td>${safe(receipt.currency)}</td>
          </tr>

          <tr>
            <td>Transfer Method</td>
            <td>${safe(receipt.method)}</td>
          </tr>

          <tr>
            <td>Date & Time</td>
            <td>${safe(formatDate(receipt.date))}</td>
          </tr>

          <tr>
            <td>Sender Account</td>
            <td>${safe(maskAccount(receipt.sender))}</td>
          </tr>

          <tr>
            <td>Recipient Account</td>
            <td>${safe(maskRecipientAccount(receipt.recipientAccount))}</td>
          </tr>

        </table>


        <div class="status">

          <strong>
            ${safe(getReceiptStatusLabel(receipt.status))}
          </strong>

          <div>
            ${safe(
              receipt.status === "successful"
                ? "The transfer was successfully processed."
                : receipt.status === "pending"
                  ? "The transfer is awaiting processing."
                  : "The transfer was declined."
            )}
          </div>

        </div>


        <div class="footer">

          This receipt is generated by NovaPay.
          Keep this reference for your records.
          Recipient and banking information should
          always be verified before sending funds.

        </div>


        <script>

          window.onload = function () {
            window.print();
          };

        <\/script>

      </body>

      </html>

    `);


    printWindow.document.close();

  }


  /* =======================================================
     FORM SUBMIT
  ======================================================= */

  function handleFormSubmit(event) {

    event.preventDefault();

    hideMessage();


    try {

      const data =
        getTransferData();


      state.pendingTransfer =
        data;


      openConfirmation(
        data
      );

    } catch (error) {

      showMessage(
        error.message ||
        "Please check your transfer information."
      );

    }

  }


  /* =======================================================
     INPUT EVENTS
  ======================================================= */

  function setupInputEvents() {

    elements.transferAmount.addEventListener(
      "input",
      updateSummary
    );


    elements.usRecipientName.addEventListener(
      "input",
      updateSummary
    );


    elements.internationalRecipientName.addEventListener(
      "input",
      updateSummary
    );


    elements.internationalCurrency.addEventListener(
      "change",
      updateSummary
    );


    document
      .querySelectorAll(
        'input[name="us_transfer_method"]'
      )
      .forEach(input => {

        input.addEventListener(
          "change",
          updateSummary
        );

      });


    elements.novaPayAccount.addEventListener(
      "input",
      function () {

        state.recipientVerified =
          false;

        state.recipient =
          null;

        elements.novaRecipientResult.hidden =
          true;

        updateSummary();

      }
    );


    elements.usRoutingNumber.addEventListener(
      "input",
      function () {

        this.value =
          this.value
            .replace(/\D/g, "")
            .slice(0, 9);

      }
    );

  }


  /* =======================================================
     SIDEBAR
  ======================================================= */

  function setupSidebar() {

    elements.mobileMenu.addEventListener(
      "click",
      function () {

        elements.sidebar.classList.add(
          "open"
        );

        elements.sidebarOverlay.classList.add(
          "active"
        );

      }
    );


    elements.sidebarOverlay.addEventListener(
      "click",
      closeSidebar
    );

  }


  function closeSidebar() {

    elements.sidebar.classList.remove(
      "open"
    );

    elements.sidebarOverlay.classList.remove(
      "active"
    );

  }


  /* =======================================================
     EVENT LISTENERS
  ======================================================= */

  function setupEvents() {

    elements.transferTypes.forEach(
      button => {

        button.addEventListener(
          "click",
          function () {

            switchTransferType(
              this.dataset.type
            );

          }
        );

      }
    );


    elements.lookupRecipient.addEventListener(
      "click",
      lookupNovaPayRecipient
    );


    elements.transferForm.addEventListener(
      "submit",
      handleFormSubmit
    );


    elements.closeConfirmation.addEventListener(
      "click",
      closeConfirmation
    );


    elements.cancelConfirmation.addEventListener(
      "click",
      closeConfirmation
    );


    elements.confirmTransfer.addEventListener(
      "click",
      submitTransfer
    );


    elements.closeReceipt.addEventListener(
      "click",
      closeReceipt
    );


    elements.doneReceipt.addEventListener(
      "click",
      closeReceipt
    );


    elements.printReceipt.addEventListener(
      "click",
      printReceipt
    );


    elements.confirmationModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          elements.confirmationModal
        ) {
          closeConfirmation();
        }

      }
    );


    elements.receiptModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          elements.receiptModal
        ) {
          closeReceipt();
        }

      }
    );


    setupInputEvents();

    setupSidebar();

  }


  /* =======================================================
     START
  ======================================================= */

  initializeUser();

  setupEvents();

  updateSummary();

})();