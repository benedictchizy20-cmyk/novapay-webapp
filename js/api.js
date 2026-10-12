
"use strict";

const NovaPayAPI = {
    /**
     * Make an API request.
     */
    async request(endpoint, options = {}) {
        const token = NovaPayApp.getAccessToken();

        const headers = {
            ...(options.headers || {})
        };

        const isFormData =
            options.body instanceof FormData;

        if (!isFormData && options.body !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const requestOptions = {
            ...options,
            headers,
            credentials: "include"
        };

        try {
            const response = await fetch(
                `${NovaPayConfig.API_BASE_URL}${endpoint}`,
                requestOptions
            );

            const contentType =
                response.headers.get("content-type") || "";

            let result = {};

            if (contentType.includes("application/json")) {
                result = await response.json();
            } else {
                const text = await response.text();

                result = {
                    success: response.ok,
                    message: text || "Unexpected server response."
                };
            }

            if (response.status === 401) {
                NovaPayApp.logout(false);
            }

            if (!response.ok) {
                throw new Error(
                    result.message || "The request failed."
                );
            }

            return result;
        } catch (error) {
            console.error(
                `NOVAPAY API ERROR [${endpoint}]:`,
                error
            );

            throw error;
        }
    },

    /**
     * Register a new user.
     */
    async register(userData) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData)
        });
    },

    /**
     * Log in a user.
     */
    async login(credentials) {
        return this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials)
        });
    },

    /**
     * Get the logged-in user's profile.
     */
    async getProfile() {
        return this.request("/profile", {
            method: "GET"
        });
    },

    /**
     * Update the user's name, email, and phone.
     */
    async updateProfile(profileData) {
        return this.request("/profile", {
            method: "PUT",
            body: JSON.stringify({
                full_name: profileData.full_name,
                email: profileData.email,
                phone: profileData.phone
            })
        });
    },

    /**
     * Upload a profile picture.
     * The backend route expects the multipart field name "photo".
     */
    async uploadProfilePhoto(file) {
        if (!(file instanceof File)) {
            throw new Error("Please select an image file.");
        }

        const formData = new FormData();

        formData.append("photo", file);

        return this.request("/profile/photo", {
            method: "POST",
            body: formData
        });
    },

    /**
     * Send money using the existing transfers endpoint.
     */
    async createTransfer(transferData) {
        return this.request("/transfers", {
            method: "POST",
            body: JSON.stringify(transferData)
        });
    },

    /**
     * Get the logged-in user's transaction history.
     * Backend: GET /api/transfers/history
     */
    async getTransactions() {
        return this.request("/transfers/history", {
            method: "GET"
        });
    },

    /**
     * Admin-only QuickPay.
     * Backend: POST /api/transfers/admin/quick-pay
     */
    async quickPay(paymentData) {
        return this.request("/transfers/admin/quick-pay", {
            method: "POST",
            body: JSON.stringify(paymentData)
        });
    },

    /**
     * Test Airwallex integration.
     */
    async testAirwallex() {
        return this.request("/airwallex/test", {
            method: "GET"
        });
    },

    /**
     * Get Airwallex balances.
     */
    async getAirwallexBalances() {
        return this.request("/airwallex/balances", {
            method: "GET"
        });
    }
};
