
document.addEventListener("DOMContentLoaded", () => {
  // CAMPUS Marketplace JavaScript

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  let activeCategory = "all";

  // Safely load saved data from this browser
  function loadData(key, fallback = []) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data : fallback;
    } catch {
      return fallback;
    }
  }

  let userProducts = loadData("campusProducts");
  let favorites = loadData("campusFavorites");

  // Show notification messages
  function showToast(message) {
    let toast = $("#campus-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "campus-toast";

      Object.assign(toast.style, {
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#123D32",
        color: "#ffffff",
        padding: "13px 20px",
        borderRadius: "10px",
        zIndex: "9999",
        boxShadow: "0 4px 15px #0002",
        maxWidth: "90%",
        textAlign: "center",
        fontSize: "14px"
      });

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(toast.hideTimer);

    toast.hideTimer = setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // Format prices in Malawi Kwacha
  function formatPrice(price) {
    return "MK " + Number(price).toLocaleString("en-US");
  }

  // Save products and favorites
  function saveProducts() {
    localStorage.setItem(
      "campusProducts",
      JSON.stringify(userProducts)
    );
  }

  function saveFavorites() {
    localStorage.setItem(
      "campusFavorites",
      JSON.stringify(favorites)
    );
  }

  // Read text safely from HTML elements
  function getText(element, selector) {
    return $(selector, element)?.textContent.trim() || "";
  }

  // Create a product card
  function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.category = product.category.toLowerCase();
    card.dataset.title = product.title.toLowerCase();
    card.dataset.location = product.location.toLowerCase();

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";

    if (product.image) {
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.title;
      image.loading = "lazy";
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.objectFit = "cover";
      imageContainer.appendChild(image);
    } else {
      const emoji = document.createElement("span");
      emoji.className = "product-emoji";
      emoji.textContent = product.emoji || "🛍️";
      imageContainer.appendChild(emoji);
    }

    const details = document.createElement("div");
    details.className = "product-details";

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category;

    const title = document.createElement("h3");
    title.textContent = product.title;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description || "";

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = formatPrice(product.price);

    const meta = document.createElement("div");
    meta.className = "product-meta";
    meta.textContent = "📍 " + product.location;

    const actions = document.createElement("div");
    actions.className = "product-actions";
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.marginTop = "12px";

    const contactButton = document.createElement("button");
    contactButton.type = "button";
    contactButton.className = "button button-outline";
    contactButton.textContent = "Contact Seller";

    contactButton.addEventListener("click", () => {
      showToast(
        "Seller messaging will be added in a future version."
      );
    });

    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "button button-outline";

    function updateFavoriteButton() {
      const saved = favorites.includes(String(product.id));
      favoriteButton.textContent = saved ? "♥ Saved" : "♡ Save";
      favoriteButton.setAttribute("aria-pressed", String(saved));
    }

    updateFavoriteButton();

    favoriteButton.addEventListener("click", () => {
      const id = String(product.id);

      if (favorites.includes(id)) {
        favorites = favorites.filter(item => item !== id);
        showToast("Removed from your favorites.");
      } else {
        favorites.push(id);
        showToast("Added to your favorites!");
      }

      saveFavorites();
      updateFavoriteButton();
    });

    actions.append(contactButton, favoriteButton);
    details.append(category, title, description, price, meta, actions);
    card.append(imageContainer, details);

    return card;
  }

  // Display user-created products
  function renderUserProducts() {
    const grid = $(".product-grid");
    if (!grid) return;

    // Remove previously rendered user listings
    $$(".user-created-product", grid).forEach(card => card.remove());

    userProducts.forEach(product => {
      const card = createProductCard(product);
      card.classList.add("user-created-product");
      grid.appendChild(card);
    });

    filterListings();
  }

  // Search and filter products
  function filterListings() {
    const searchInput = $("#search");
    const locationInput = $("#location");

    const searchTerm = searchInput?.value.trim().toLowerCase() || "";
    const locationTerm = locationInput?.value.trim().toLowerCase() || "";

    $$(".product-card").forEach(card => {
      const title = card.dataset.title ||
        getText(card, "h3").toLowerCase();

      const description = getText(card, ".product-description")
        .toLowerCase();

      const category = card.dataset.category ||
        getText(card, ".product-category").toLowerCase();

      const location = card.dataset.location ||
        getText(card, ".product-meta").toLowerCase();

      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        category.includes(searchTerm);

      const matchesLocation =
        !locationTerm || location.includes(locationTerm);

      const matchesCategory =
        activeCategory === "all" ||
        category.includes(activeCategory);

      card.style.display =
        matchesSearch && matchesLocation && matchesCategory
          ? ""
          : "none";
    });
  }

  // Connect the search form
  const searchForm = $(".search-form");

  if (searchForm) {
    searchForm.addEventListener("submit", event => {
      event.preventDefault();
      filterListings();

      const marketplace = $("#marketplace");
      marketplace?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  $("#search")?.addEventListener("input", filterListings);
  $("#location")?.addEventListener("input", filterListings);

  // Category selection
  $$(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const heading = $("h3", card);
      if (!heading) return;

      activeCategory = heading.textContent.trim().toLowerCase();

      filterListings();

      const marketplace = $("#marketplace");
      marketplace?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  // Allow a reset using a button with data-category="all"
  $$("[data-category='all']").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = "all";
      filterListings();
    });
  });

  // Product listing form
  const listingForm = $(".listing-form");

  if (listingForm) {
    listingForm.addEventListener("submit", event => {
      event.preventDefault();

      const title = $("#product-title")?.value.trim() || "";
      const category = $("#product-category")?.value || "";
      const price = Number($("#product-price")?.value);
      const location = $("#product-location")?.value.trim() || "";
      const description =
        $("#product-description")?.value.trim() || "";

      const imageInput = $("#product-image");
      const imageFile = imageInput?.files?.[0];

      if (!title || !category || !location || !description ||
          !Number.isFinite(price) || price <= 0) {
        showToast("Please complete all required fields correctly.");
        return;
      }

      if (imageFile && !imageFile.type.startsWith("image/")) {
        showToast("Please choose a valid image.");
        return;
      }

      if (imageFile && imageFile.size > 2 * 1024 * 1024) {
        showToast("Please choose an image smaller than 2 MB.");
        return;
      }

      function publishProduct(image = "") {
        const product = {
          id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
          title,
          category,
          price,
          location,
          description,
          image,
          emoji: "🛍️",
          createdAt: new Date().toISOString()
        };

        userProducts.unshift(product);
        saveProducts();
        renderUserProducts();

        listingForm.reset();

        const preview = $("#image-preview");
        if (preview) preview.remove();

        showToast("Your product has been listed on this browser!");

        $("#marketplace")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      if (imageFile) {
        const reader = new FileReader();

        reader.onload = () => {
          publishProduct(reader.result);
        };

        reader.onerror = () => {
          showToast("Could not read that image. Please try again.");
        };

        reader.readAsDataURL(imageFile);
      } else {
        publishProduct();
      }
    });
  }

  // Image preview before publishing
  const imageInput = $("#product-image");

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      let preview = $("#image-preview");

      if (!file) {
        preview?.remove();
        return;
      }

      if (!file.type.startsWith("image/")) {
        showToast("Please choose an image file.");
        imageInput.value = "";
        preview?.remove();
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showToast("Image must be smaller than 2 MB.");
        imageInput.value = "";
        preview?.remove();
        return;
      }

      if (!preview) {
        preview = document.createElement("img");
        preview.id = "image-preview";
        preview.alt = "Product image preview";

        Object.assign(preview.style, {
          display: "block",
          width: "150px",
          height: "120px",
          objectFit: "cover",
          marginTop: "10px",
          borderRadius: "10px"
        });

        imageInput.insertAdjacentElement("afterend", preview);
      }

      preview.src = URL.createObjectURL(file);
    });
  }

  // Accommodation search
  function filterAccommodation() {
    const term = $("#search")?.value.trim().toLowerCase() || "";
    const location = $("#location")?.value.trim().toLowerCase() || "";

    $$(".accommodation-card").forEach(card => {
      const text = card.textContent.toLowerCase();
      const matchesTerm = !term || text.includes(term);
      const matchesLocation = !location || text.includes(location);

      card.style.display =
        matchesTerm && matchesLocation ? "" : "none";
    });
  }

  // Initial setup
  renderUserProducts();

  // Handle contact buttons on existing demo product cards
  $$(".product-card:not(.user-created-product) .button").forEach(button => {
    if (button.textContent.toLowerCase().includes("contact")) {
      button.addEventListener("click", () => {
        showToast(
          "Messaging is not connected yet. A backend is needed for real chats."
        );
      });
    }
  });

  // Handle accommodation contact buttons
  $$(".accommodation-card .button").forEach(button => {
    button.addEventListener("click", () => {
      showToast(
        "Accommodation messaging will be available when accounts are connected."
      );
    });
  });

  // Basic navigation feedback for unfinished pages
  $$('a[href="#messages"], a[href="#profile"]').forEach(link => {
    link.addEventListener("click", () => {
      showToast(
        "This feature needs user accounts and a database to work."
      );
    });
  });

  console.log("CAMPUS Marketplace JavaScript loaded successfully.");
});
