
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    if (!NovaPayApp.requireAuth()) return;

    const $ = (id) => document.getElementById(id);

    const elements = {
        form: $("profileForm"),
        fullName: $("fullName"),
        email: $("email"),
        phone: $("phone"),
        accountNumber: $("accountNumber"),
        saveButton: $("saveProfileButton"),
        profileMessage: $("profileMessage"),

        photoInput: $("profilePhotoInput"),
        choosePhotoButton: $("choosePhotoButton"),
        uploadPhotoButton: $("uploadPhotoButton"),
        photoMessage: $("photoMessage"),
        photoPreview: $("profilePhotoPreview"),
        photoFallback: $("profilePhotoFallback"),
        photoDisplayName: $("photoDisplayName"),

        sidebarAvatar: $("sidebarAvatar"),
        sidebarUserName: $("sidebarUserName"),
        sidebarUserRole: $("sidebarUserRole"),

        topUserName: $("topUserName"),
        topUserEmail: $("topUserEmail"),
        topProfileImage: $("topProfileImage"),
        topProfileFallback: $("topProfileFallback")
    };

    let selectedPhoto = null;
    let currentPhotoUrl = "";
    let temporaryPhotoUrl = "";

    function showMessage(element, message, type = "") {
        if (!element) return;

        element.textContent = message;
        element.classList.remove("success", "error");

        if (type) {
            element.classList.add(type);
        }
    }

    function getInitials(name) {
        const words = String(name || "NovaPay")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!words.length) return "N";

        return words
            .slice(0, 2)
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase();
    }

    function setImage(img, fallback, url, name) {
        const initials = getInitials(name);

        if (fallback) {
            fallback.textContent = initials;
            fallback.hidden = false;
        }

        if (!img) return;

        if (!url) {
            img.removeAttribute("src");
            img.hidden = true;
            return;
        }

        img.onerror = () => {
            img.hidden = true;

            if (fallback) {
                fallback.hidden = false;
            }
        };

        img.onload = () => {
            img.hidden = false;

            if (fallback) {
                fallback.hidden = true;
            }
        };

        img.src = url;
    }

    function renderUser(user) {
        if (!user) return;

        const name = user.full_name || "NovaPay User";
        const email = user.email || "";
        const photo = user.profile_photo || "";

        if (elements.sidebarUserName) {
            elements.sidebarUserName.textContent = name;
        }

        if (elements.sidebarUserRole) {
            elements.sidebarUserRole.textContent =
                user.role || "NovaPay User";
        }

        if (elements.topUserName) {
            elements.topUserName.textContent = name;
        }

        if (elements.topUserEmail) {
            elements.topUserEmail.textContent = email;
        }

        if (elements.photoDisplayName) {
            elements.photoDisplayName.textContent = name;
        }

        if (elements.sidebarAvatar) {
            setImage(
                elements.sidebarAvatar.querySelector("img"),
                elements.sidebarAvatar,
                photo,
                name
            );
        }

        setImage(
            elements.topProfileImage,
            elements.topProfileFallback,
            photo,
            name
        );

        setImage(
            elements.photoPreview,
            elements.photoFallback,
            selectedPhoto && temporaryPhotoUrl
                ? temporaryPhotoUrl
                : photo,
            name
        );
    }

    function updateSessionUser(user) {
        const existingUser = NovaPayApp.getUser() || {};
        const updatedUser = {
            ...existingUser,
            ...user
        };

        NovaPayApp.setUser(updatedUser);
        renderUser(updatedUser);

        return updatedUser;
    }

    async function loadProfile() {
        showMessage(elements.profileMessage, "Loading profile...");

        try {
            const response = await NovaPayAPI.getProfile();
            const user = response.user;

            if (!user) {
                throw new Error("The server did not return your profile.");
            }

            updateSessionUser(user);

            elements.fullName.value = user.full_name || "";
            elements.email.value = user.email || "";
            elements.phone.value = user.phone || "";
            elements.accountNumber.value = user.account_number || "";

            currentPhotoUrl = user.profile_photo || "";

            showMessage(elements.profileMessage, "");
            showMessage(elements.photoMessage, "");
        } catch (error) {
            showMessage(
                elements.profileMessage,
                error.message || "Unable to load your profile.",
                "error"
            );
        }
    }

    elements.form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const full_name = elements.fullName.value.trim();
        const email = elements.email.value.trim();
        const phone = elements.phone.value.trim();

        if (!full_name || !email || !phone) {
            showMessage(
                elements.profileMessage,
                "Please fill in your name, email, and phone number.",
                "error"
            );
            return;
        }

        elements.saveButton.disabled = true;
        elements.saveButton.textContent = "Saving...";

        showMessage(elements.profileMessage, "");

        try {
            const response = await NovaPayAPI.updateProfile({
                full_name,
                email,
                phone
            });

            if (!response.user) {
                throw new Error("The server did not return your updated profile.");
            }

            updateSessionUser(response.user);

            elements.fullName.value = response.user.full_name || "";
            elements.email.value = response.user.email || "";
            elements.phone.value = response.user.phone || "";

            showMessage(
                elements.profileMessage,
                response.message || "Profile updated successfully.",
                "success"
            );
        } catch (error) {
            showMessage(
                elements.profileMessage,
                error.message || "Unable to save profile changes.",
                "error"
            );
        } finally {
            elements.saveButton.disabled = false;
            elements.saveButton.textContent = "Save changes";
        }
    });

    elements.choosePhotoButton.addEventListener("click", () => {
        elements.photoInput.click();
    });

    elements.photoInput.addEventListener("change", () => {
        const file = elements.photoInput.files[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            showMessage(
                elements.photoMessage,
                "Choose a JPG, PNG, or WebP image.",
                "error"
            );

            elements.photoInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showMessage(
                elements.photoMessage,
                "Your image must be 5 MB or smaller.",
                "error"
            );

            elements.photoInput.value = "";
            return;
        }

        if (temporaryPhotoUrl) {
            URL.revokeObjectURL(temporaryPhotoUrl);
        }

        selectedPhoto = file;
        temporaryPhotoUrl = URL.createObjectURL(file);

        setImage(
            elements.photoPreview,
            elements.photoFallback,
            temporaryPhotoUrl,
            elements.fullName.value
        );

        elements.uploadPhotoButton.disabled = false;

        showMessage(
            elements.photoMessage,
            "Photo selected. Click Upload picture to save it.",
            "success"
        );
    });

    elements.uploadPhotoButton.addEventListener("click", async () => {
        if (!selectedPhoto) {
            showMessage(
                elements.photoMessage,
                "Please choose a photo first.",
                "error"
            );
            return;
        }

        elements.uploadPhotoButton.disabled = true;
        elements.choosePhotoButton.disabled = true;
        elements.uploadPhotoButton.textContent = "Uploading...";

        showMessage(elements.photoMessage, "");

        try {
            const response =
                await NovaPayAPI.uploadProfilePhoto(selectedPhoto);

            if (!response.user) {
                throw new Error("The server did not return your updated profile.");
            }

            const user = updateSessionUser(response.user);

            currentPhotoUrl = user.profile_photo || "";
            selectedPhoto = null;
            elements.photoInput.value = "";

            if (temporaryPhotoUrl) {
                URL.revokeObjectURL(temporaryPhotoUrl);
                temporaryPhotoUrl = "";
            }

            elements.uploadPhotoButton.disabled = true;

            renderUser(user);

            showMessage(
                elements.photoMessage,
                response.message || "Profile picture updated successfully.",
                "success"
            );
        } catch (error) {
            showMessage(
                elements.photoMessage,
                error.message || "Unable to upload your photo.",
                "error"
            );
        } finally {
            elements.uploadPhotoButton.disabled = !selectedPhoto;
            elements.choosePhotoButton.disabled = false;
            elements.uploadPhotoButton.textContent = "Upload picture";
        }
    });

    const logoutButton = $("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            NovaPayApp.logout(true);
        });
    }

    const sidebar = $("sidebar");
    const overlay = $("sidebarOverlay");
    const menuButton = $("menuButton");
    const closeButton = $("sidebarClose");

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("active");
        if (overlay) overlay.classList.remove("active");
    }

    if (menuButton) {
        menuButton.addEventListener("click", () => {
            if (sidebar) sidebar.classList.add("active");
            if (overlay) overlay.classList.add("active");
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener("click", closeSidebar);
    }

    const cachedUser = NovaPayApp.getUser();

    if (cachedUser) {
        renderUser(cachedUser);
    }

    loadProfile();
});