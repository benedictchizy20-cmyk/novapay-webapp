"use strict";

/* =========================================================
   NOVAPAY AUTH
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const registerForm =
    document.getElementById("registerForm");

  const loginForm =
    document.getElementById("loginForm");


  /* =======================================================
     REGISTER
  ======================================================= */

  if (registerForm) {

    registerForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const button =
          registerForm.querySelector(
            'button[type="submit"]'
          );

        const message =
          document.getElementById(
            "registerMessage"
          );

        const fullName =
          document.getElementById(
            "fullName"
          ).value.trim();

        const email =
          document.getElementById(
            "email"
          ).value.trim();

        const phone =
          document.getElementById(
            "phone"
          ).value.trim();

        const password =
          document.getElementById(
            "password"
          ).value;

        const confirmPassword =
          document.getElementById(
            "confirmPassword"
          ).value;


        if (
          !fullName ||
          !email ||
          !phone ||
          !password ||
          !confirmPassword
        ) {

          showMessage(
            message,
            "Please complete all fields.",
            false
          );

          return;

        }


        if (password.length < 8) {

          showMessage(
            message,
            "Password must be at least 8 characters.",
            false
          );

          return;

        }


        if (password !== confirmPassword) {

          showMessage(
            message,
            "Passwords do not match.",
            false
          );

          return;

        }


        button.disabled = true;

        button.textContent =
          "Creating account...";


        try {

          const result =
            await NovaPayAPI.register({

              full_name: fullName,

              email: email,

              password: password,

              phone: phone

            });


          NovaPayApp.setAuth(result);


          showMessage(
            message,
            "Account created successfully. Redirecting...",
            true
          );


          setTimeout(() => {

            window.location.href =
              "./dashboard.html";

          }, 700);


        } catch (error) {

          console.error(
            "REGISTER ERROR:",
            error
          );

          showMessage(
            message,
            error.message ||
            "Registration failed.",
            false
          );

          button.disabled = false;

          button.textContent =
            "Create Account";

        }

      }
    );

  }


  /* =======================================================
     LOGIN
  ======================================================= */

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const button =
          loginForm.querySelector(
            'button[type="submit"]'
          );

        const message =
          document.getElementById(
            "loginMessage"
          );

        const email =
          document.getElementById(
            "email"
          ).value.trim();

        const password =
          document.getElementById(
            "password"
          ).value;


        if (!email || !password) {

          showMessage(
            message,
            "Please enter your email and password.",
            false
          );

          return;

        }


        button.disabled = true;

        button.textContent =
          "Signing in...";


        try {

          const result =
            await NovaPayAPI.login({

              email,

              password

            });


          NovaPayApp.setAuth(result);


          showMessage(
            message,
            "Login successful. Redirecting...",
            true
          );


          setTimeout(() => {

            window.location.href =
              "./dashboard.html";

          }, 500);


        } catch (error) {

          console.error(
            "LOGIN ERROR:",
            error
          );

          showMessage(
            message,
            error.message ||
            "Login failed.",
            false
          );

          button.disabled = false;

          button.textContent =
            "Login";

        }

      }
    );

  }

});


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
  element,
  message,
  success
) {

  if (!element) return;

  element.textContent = message;

  element.className =
    success
      ? "form-message success"
      : "form-message error";

}