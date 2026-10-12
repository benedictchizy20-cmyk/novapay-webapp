
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    if (!NovaPayApp.requireAuth()) return;

    const elements = {
        sidebarAvatar: document.getElementById("sidebarAvatar"),
        sidebarUserName: document.getElementById("sidebarUserName"),
        sidebarUserRole: document.getElementById("sidebarUserRole"),
        topUserName: document.getElementById("topUserName"),
        topUserEmail: document.getElementById("topUserEmail"),
        topProfileImage: document.getElementById("topProfileImage"),
        topProfileFallback: document.getElementById("topProfileFallback"),
        welcomeName: document.getElementById("welcomeName"),
        summaryName: document.getElementById("summaryName")
    };

    function getInitials(name) {
        return String(name || "NovaPay User")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("") || "N";
    }

    function renderProfile(user) {
        if (!user) return;

        const name = user.full_name || "NovaPay User";
        const email = user.email || "";
        const photo = user.profile_photo || "";
        const initials = getInitials(name);

        if (elements.sidebarUserName) {
            elements.sidebarUserName.textContent = name;
        }

        if (elements.sidebarUserRole) {
            elements.sidebarUserRole.textContent =
                user.role || "Customer";
        }

        if (elements.topUserName) {
            elements.topUserName.textContent = name;
        }

        if (elements.topUserEmail) {
            elements.topUserEmail.textContent = email;
        }

        if (elements.welcomeName) {
            elements.welcomeName.textContent = name;
        }

        if (elements.summaryName) {
            elements.summaryName.textContent = name;
        }

        // Sidebar avatar: show the saved photo or the user's initials.
        if (elements.sidebarAvatar) {
            const avatar = elements.sidebarAvatar;

            avatar.replaceChildren();
            avatar.textContent = initials;

            if (photo) {
                const image = document.createElement("img");

                image.src = photo;
                image.alt = `${name}'s profile photo`;

                Object.assign(image.style, {
                    position: "absolute",
                    inset: "0",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit"
                });

                avatar.style.position = "relative";
                avatar.style.overflow = "hidden";
                avatar.appendChild(image);

                image.onerror = () => {
                    image.remove();
                    avatar.textContent = initials;
                };
            }
        }

        // Header avatar.
        const image = elements.topProfileImage;
        const fallback = elements.topProfileFallback;

        if (image && fallback) {
            image.onerror = null;
            image.onload = null;

            fallback.textContent = initials;
            fallback.style.display = "flex";
            image.style.display = "none";
            image.removeAttribute("src");

            if (photo) {
                image.onload = () => {
                    image.style.display = "block";
                    fallback.style.display = "none";
                };

                image.onerror = () => {
                    image.style.display = "none";
                    fallback.style.display = "flex";
                };

                image.src = photo;
            }
        }
    }

    // Display cached profile information immediately.
    const cachedUser = NovaPayApp.getUser();

    if (cachedUser) {
        renderProfile(cachedUser);
    }

    // Then fetch the latest profile from the backend.
    try {
        const response = await NovaPayAPI.getProfile();
        const profile = response.user || response.profile || response.data;

        if (!profile) {
            throw new Error("The server did not return profile information.");
        }

        const updatedUser = {
            ...(NovaPayApp.getUser() || {}),
            ...profile
        };

        NovaPayApp.setUser(updatedUser);
        renderProfile(updatedUser);

    } catch (error) {
        console.error("NOVAPAY DASHBOARD PROFILE ERROR:", error);
    }
});