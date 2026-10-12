"use strict";

/* =========================================================
   NOVAPAY APP
========================================================= */

const NovaPayApp = {

  /* =======================================================
     USER
  ======================================================= */

  getUser() {

    try {

      const raw = sessionStorage.getItem(
        NovaPayConfig.USER_KEY
      );

      return raw ? JSON.parse(raw) : null;

    } catch {

      return null;

    }

  },


  setUser(user) {

    sessionStorage.setItem(
      NovaPayConfig.USER_KEY,
      JSON.stringify(user)
    );

  },


  /* =======================================================
     TOKEN
  ======================================================= */

  getAccessToken() {

    return sessionStorage.getItem(
      NovaPayConfig.ACCESS_TOKEN_KEY
    );

  },


  setAuth(data) {

    if (data.access_token) {

      sessionStorage.setItem(
        NovaPayConfig.ACCESS_TOKEN_KEY,
        data.access_token
      );

    }

    if (data.refresh_token) {

      sessionStorage.setItem(
        NovaPayConfig.REFRESH_TOKEN_KEY,
        data.refresh_token
      );

    }

    if (data.user) {

      this.setUser(data.user);

    }

  },


  /* =======================================================
     AUTH CHECK
  ======================================================= */

  requireAuth() {

    const token = this.getAccessToken();
    const user = this.getUser();

    if (!token || !user) {

      window.location.href = "./login.html";

      return false;

    }

    return true;

  },


  /* =======================================================
     LOGOUT
  ======================================================= */

  logout(redirect = true) {

    sessionStorage.removeItem(
      NovaPayConfig.ACCESS_TOKEN_KEY
    );

    sessionStorage.removeItem(
      NovaPayConfig.REFRESH_TOKEN_KEY
    );

    sessionStorage.removeItem(
      NovaPayConfig.USER_KEY
    );

    if (redirect) {

      window.location.href = "./login.html";

    }

  },


  /* =======================================================
     MONEY
  ======================================================= */

  formatMoney(amount, currency = "$") {

    const value = Number(amount || 0);

    return `${currency}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  },


  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;

  }

};


/* =========================================================
   GLOBAL LOGOUT
========================================================= */

function logout() {

  NovaPayApp.logout(true);

}