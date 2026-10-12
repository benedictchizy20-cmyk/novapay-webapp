"use strict";

/* =========================================================
   NOVAPAY FRONTEND CONFIG
========================================================= */

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const NovaPayConfig = {

  API_BASE_URL: isLocal 
    ? "http://localhost:7000/api" 
    : "https://novapay-backend-1-0ipg.onrender.com/api",

  ACCESS_TOKEN_KEY: "novapay_access_token",

  REFRESH_TOKEN_KEY: "novapay_refresh_token",

  USER_KEY: "novapay_user",

  APP_NAME: "NovaPay"

};