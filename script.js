// ==========================================
// 1. SISTER'S SETTINGS (EDIT THESE!)
// ==========================================
const SISTER_WHATSAPP = "2348126380418"; // Sister's WhatsApp
const OWNER_PIN = "1234";                // Secret PIN for Owner Kitchen

// ==========================================
// 2. LOAD MENU, ORDERS & PERMISSIONS
// ==========================================
const defaultMenu = [
  { id: 1, name: "Chicken Shawarma Wrap", price: 3500, category: "Shawarma", desc: "Grilled spiced chicken, sausage, fresh veggies & garlic sauce.", available: true, image: "" },
  { id: 2, name: "Creamy Fruit Parfait", price: 2500, category: "Parfait", desc: "Layered Greek yogurt, crunchy granola & seasonal fresh fruits.", available: true, image: "" },
  { id: 3, name: "Chilled Sugarcane Juice", price: 1200, category: "Juices & Blends", desc: "100% freshly pressed sugarcane with a hint of ginger & lime.", available: true, image: "" }
];

let menu = JSON.parse(localStorage.getItem("dooba_menu")) || defaultMenu;
let orders = JSON.parse(localStorage.getItem("dooba_orders")) || [];
const starterCategories = ["Food", "Parfait", "Juice", "Meat", "Pastries", "Shawarma", "Pizza", "Cake", "Drinks", "Snacks", "Desserts", "Smoothies"];
let categories = JSON.parse(localStorage.getItem("dooba_categories")) || starterCategories;
// Keep categories for products created in older versions of the website.
menu.forEach(item => {
  const category = String(item.category || "Other").trim();
  if (category && !categories.some(cat => cat.toLowerCase() === category.toLowerCase())) categories.push(category);
});

let shopOpen = JSON.parse(localStorage.getItem("dooba_shop_open"));
if (shopOpen === null) shopOpen = true;

let deliveryAllowed = JSON.parse(localStorage.getItem("dooba_delivery"));
if (deliveryAllowed === null) deliveryAllowed = true;

let deliveryFee = Number(localStorage.getItem("dooba_delivery_fee"));
if (!deliveryFee && deliveryFee !== 0) deliveryFee = 1000;

let activeCategory = "All";
let searchQuery = "";
let cart = [];

function saveData() {
  localStorage.setItem("dooba_menu", JSON.stringify(menu));
  localStorage.setItem("dooba_orders", JSON.stringify(orders));
  localStorage.setItem("dooba_categories", JSON.stringify(categories));
  localStorage.setItem("dooba_shop_open", JSON.stringify(shopOpen));
  localStorage.setItem("dooba_delivery", JSON.stringify(deliveryAllowed));
  localStorage.setItem("dooba_delivery_fee", String(deliveryFee));
}

// ==========================================
// 3. AUTO-GENERATE CATEGORY BUTTONS
// ==========================================
function renderCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  if (!container) return;
  const allCategories = ["All", ...categories];
  if (!allCategories.includes(activeCategory)) activeCategory = "All";
  container.innerHTML = allCategories.map(cat => {
    const isActive = activeCategory === cat;
    const safeCat = cat.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<button type="button" class="btn btn-sm ${isActive ? "btn-success" : "btn-outline-success"} rounded-pill px-3 filter-btn"
      data-cat="${safeCat}" onclick="selectCategory(this.dataset.cat)">
      ${cat === "All" ? '<i class="bi bi-grid me-1"></i>' : ''}${safeCat}
    </button>`;
  }).join("");
}

function selectCategory(cat) {
  activeCategory = cat;
  renderCustomerView();
}
// ==========================================
// 4. DRAW CUSTOMER MENU & SEARCH
// ==========================================
function renderCustomerView() {
  const menuList = document.getElementById("menuList");
  const shopBadge = document.getElementById("shopStatusBadge");
  const deliveryBanner = document.getElementById("deliveryBanner");
  const deliveryOption = document.getElementById("deliveryOption");
  const deliveryStatusText = document.getElementById("deliveryStatusText");
  const orderType = document.getElementById("orderType");
  const whatsappBtn = document.getElementById("whatsappOrderBtn");

  if (shopOpen) {
    shopBadge.innerHTML = `<i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i> Kitchen Open`;
    shopBadge.className = "badge bg-success px-3 py-2";
    whatsappBtn.disabled = false;
    whatsappBtn.innerHTML = `<i class="bi bi-whatsapp me-2"></i>Send Order to WhatsApp`;
  } else {
    shopBadge.innerHTML = `<i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i> Kitchen Closed`;
    shopBadge.className = "badge bg-danger px-3 py-2";
    whatsappBtn.disabled = true;
    whatsappBtn.textContent = "Kitchen Closed Right Now";
  }

  if (deliveryAllowed) {
    deliveryBanner.innerHTML = `<i class="bi bi-truck me-1"></i> Delivery Available (₦${deliveryFee.toLocaleString()})`;
    deliveryBanner.className = "badge bg-success-subtle text-success border px-3 py-2";
    deliveryOption.disabled = false;
    deliveryOption.textContent = `Home Delivery (+₦${deliveryFee.toLocaleString()})`;
    deliveryStatusText.textContent = "Home delivery is active right now.";
    deliveryStatusText.className = "text-success fw-semibold";
  } else {
    deliveryBanner.innerHTML = `<i class="bi bi-shop me-1"></i> Pickup Only Right Now`;
    deliveryBanner.className = "badge bg-warning-subtle text-dark border px-3 py-2";
    deliveryOption.disabled = true;
    deliveryOption.textContent = "Home Delivery (Unavailable)";
    orderType.value = "Pickup";
    document.getElementById("addressBox").classList.add("d-none");
    deliveryStatusText.textContent = "Delivery is currently off — Pickup at shop only.";
    deliveryStatusText.className = "text-danger fw-semibold";
  }

  renderCategoryFilters();

  const filtered = menu.filter(item => {
    const matchesCat = activeCategory === "All" || String(item.category || "Other").trim() === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) ||
      (item.desc && item.desc.toLowerCase().includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  menuList.innerHTML = "";
  if (filtered.length === 0) {
    menuList.innerHTML = `<div class="col-12 text-center text-muted py-4">No items match your filter.</div>`;
  }

  filtered.forEach(item => {
    const imageTop = item.image
      ? `<img src="${item.image}" class="food-img" alt="${item.name}">`
      : `<div class="food-icon-placeholder"><i class="bi bi-cup-straw"></i></div>`;

    menuList.innerHTML += `
      <div class="col-md-6">
        <div class="card food-card shadow-sm h-100">
          ${imageTop}
          <div class="card-body d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted fw-semibold">${item.category}</small>
                <span class="badge ${item.available ? "bg-success" : "bg-secondary"}">
                  ${item.available ? "Available" : "Sold Out"}
                </span>
              </div>
              <h6 class="fw-bold mb-1">${item.name}</h6>
              ${item.desc ? `<p class="text-muted small mb-2">${item.desc}</p>` : ""}
              <p class="text-success fw-bold fs-6 mb-3">₦${item.price.toLocaleString()}</p>
            </div>
            <button type="button" class="btn ${item.available && shopOpen ? "btn-success" : "btn-secondary"} btn-sm w-100 fw-semibold"
              ${!item.available || !shopOpen ? "disabled" : ""} onclick="addToCart(${item.id})">
              <i class="bi bi-plus-lg me-1"></i>${!shopOpen ? "Kitchen Closed" : item.available ? "Add to Order" : "Sold Out"}
            </button>
          </div>
        </div>
      </div>
    `;
  });

  renderCart();
}

const searchInput = document.getElementById("menuSearch");
if (searchInput) {
  searchInput.addEventListener("input", function () {
    searchQuery = this.value.trim().toLowerCase();
    renderCustomerView();
  });
}
// ==========================================
// 5. CART LOGIC & FLOATING MOBILE BAR
// ==========================================
function addToCart(id) {
  const food = menu.find(item => item.id === id);
  if (!food || !food.available || !shopOpen) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...food, qty: 1 });
  }
  renderCart();
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartDeliveryFee = document.getElementById("cartDeliveryFee");
  const cartTotal = document.getElementById("cartTotal");
  const orderType = document.getElementById("orderType").value;
  const mobileBar = document.getElementById("mobileCartBar");
  const mobileCount = document.getElementById("mobileCartCount");
  const mobileTotal = document.getElementById("mobileCartTotal");

  if (cart.length === 0) {
    cartItems.innerHTML = "Your basket is empty.";
    cartSubtotal.textContent = "0";
    cartDeliveryFee.textContent = "0";
    cartTotal.textContent = "0";
    if (mobileBar) mobileBar.classList.add("d-none");
    return;
  }

  let subtotal = 0;
  cartItems.innerHTML = "";
  cart.forEach((item, index) => {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;
    cartItems.innerHTML += `
      <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
        <div>
          <div class="fw-semibold text-dark">${item.name}</div>
          <small class="text-muted">₦${lineTotal.toLocaleString()}</small>
        </div>
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-secondary px-2" onclick="changeQty(${index}, -1)">−</button>
          <span class="btn btn-light disabled fw-bold text-dark px-2">${item.qty}</span>
          <button type="button" class="btn btn-outline-secondary px-2" onclick="changeQty(${index}, 1)">+</button>
        </div>
      </div>
    `;
  });

  const fee = (orderType === "Delivery" && deliveryAllowed) ? deliveryFee : 0;
  cartSubtotal.textContent = subtotal.toLocaleString();
  cartDeliveryFee.textContent = fee.toLocaleString();
  cartTotal.textContent = (subtotal + fee).toLocaleString();

  if (mobileBar && mobileCount && mobileTotal) {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    mobileBar.classList.toggle("d-none", totalItems === 0);
    mobileCount.textContent = totalItems;
    mobileTotal.textContent = (subtotal + fee).toLocaleString();
  }
}

document.getElementById("orderType").addEventListener("change", function () {
  const addressBox = document.getElementById("addressBox");
  if (this.value === "Delivery") {
    addressBox.classList.remove("d-none");
  } else {
    addressBox.classList.add("d-none");
  }
  renderCart();
});
// ==========================================
// 6. SEND BUYER DETAILS & ORDER TO WHATSAPP
// ==========================================
document.getElementById("whatsappOrderBtn").addEventListener("click", function () {
  if (!shopOpen) return alert("Sorry, Dooba Tasty Blends is currently closed.");
  if (cart.length === 0) return alert("Please add at least one item to your order!");

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const type = document.getElementById("orderType").value;
  const address = document.getElementById("customerAddress").value.trim();
  const note = document.getElementById("orderNote").value.trim();

  if (!name) return alert("Please enter your Full Name.");
  if (!phone) return alert("Please enter your Phone Number.");
  if (type === "Delivery" && !address) return alert("Please enter your Delivery Address.");

  let subtotal = 0;
  let itemsText = "";
  cart.forEach(item => {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;
    itemsText += `• ${item.qty}x ${item.name} — ₦${lineTotal.toLocaleString()}\n`;
  });

  const fee = (type === "Delivery" && deliveryAllowed) ? deliveryFee : 0;
  const grandTotal = subtotal + fee;

  orders.unshift({
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    customer: name,
    phone: phone,
    method: type,
    address: type === "Delivery" ? address : "",
    note,
    items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
    total: grandTotal,
    status: "New"
  });
  saveData();

  let message = `*NEW ORDER — DOOBA TASTY BLENDS*\n\n`;
  message += `*Customer:* ${name}\n`;
  message += `*Phone:* ${phone}\n`;
  message += `*Order Type:* ${type}\n`;
  if (type === "Delivery") message += `*Address:* ${address}\n`;
  if (note) message += `*Note:* ${note}\n`;
  message += `\n*Order Items:*\n${itemsText}`;
  message += `\n*Subtotal:* ₦${subtotal.toLocaleString()}`;
  if (fee > 0) message += `\n*Delivery Fee:* ₦${fee.toLocaleString()}`;
  message += `\n*TOTAL TO PAY:* ₦${grandTotal.toLocaleString()}`;

  // Open WhatsApp with the order already written in the message box.
  const whatsappURL = `https://wa.me/${SISTER_WHATSAPP}?text=${encodeURIComponent(message)}`;
  const whatsappWindow = window.open(whatsappURL, "_blank");
  // Some browsers block new tabs; navigate directly as a fallback.
  if (!whatsappWindow) window.location.href = whatsappURL;
});

// ==========================================
// 7. OWNER KITCHEN SWITCHES & DELIVERY FEE
// ==========================================
document.getElementById("openAdminBtn").addEventListener("click", function () {
  const pin = prompt("Enter Owner Kitchen PIN (default is 1234):");
  if (pin !== OWNER_PIN) return alert("Wrong PIN!");

  document.getElementById("customerView").classList.add("d-none");
  document.getElementById("adminView").classList.remove("d-none");
  renderAdminView();
});

document.getElementById("backToShopBtn").addEventListener("click", function () {
  document.getElementById("adminView").classList.add("d-none");
  document.getElementById("customerView").classList.remove("d-none");
  renderCustomerView();
});

const shopOpenToggle = document.getElementById("shopOpenToggle");
const shopOpenLabel = document.getElementById("shopOpenLabel");

shopOpenToggle.addEventListener("change", function () {
  shopOpen = this.checked;
  shopOpenLabel.textContent = shopOpen ? "Kitchen is OPEN" : "Kitchen is CLOSED";
  shopOpenLabel.className = shopOpen ? "form-check-label fw-bold text-success" : "form-check-label fw-bold text-danger";
  saveData();
  renderCustomerView();
});

const deliveryToggle = document.getElementById("deliveryToggle");
const deliveryToggleLabel = document.getElementById("deliveryToggleLabel");

deliveryToggle.addEventListener("change", function () {
  deliveryAllowed = this.checked;
  deliveryToggleLabel.textContent = deliveryAllowed ? "Delivery is ON (Yes)" : "Delivery is OFF (No)";
  deliveryToggleLabel.className = deliveryAllowed ? "form-check-label fw-bold text-success" : "form-check-label fw-bold text-danger";
  saveData();
  renderCustomerView();
});

document.getElementById("saveFeeBtn").addEventListener("click", function () {
  const newFee = Number(document.getElementById("deliveryFeeInput").value);
  if (newFee < 0 || Number.isNaN(newFee)) return alert("Enter a valid delivery fee.");
  deliveryFee = newFee;
  saveData();
  renderCustomerView();
  alert(`Delivery fee updated to ₦${deliveryFee.toLocaleString()}`);
});
// ==========================================
// 8. CATEGORY MANAGEMENT
// ==========================================
function renderAdminCategories() {
  const list = document.getElementById("adminCategoryList");
  const suggestions = document.getElementById("categorySuggestions");
  if (!list) return;
  list.innerHTML = categories.length ? categories.map((cat, index) => `
    <div class="category-admin-row">
      <span class="fw-semibold">${escapeHTML(cat)}</span>
      <div class="d-flex gap-1">
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="renameCategory(${index})" aria-label="Rename ${escapeHTML(cat)}"><i class="bi bi-pencil"></i></button>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${index})" aria-label="Delete ${escapeHTML(cat)}"><i class="bi bi-trash"></i></button>
      </div>
    </div>`).join("") : '<p class="small text-muted mb-0">No categories yet. Add one above.</p>';
  if (suggestions) suggestions.innerHTML = categories.map(cat => `<option value="${escapeHTML(cat)}"></option>`).join("");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
}

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim().replace(/\s+/g, " ");
  if (!name) return alert("Enter a category name.");
  if (categories.some(cat => cat.toLowerCase() === name.toLowerCase())) return alert("That category already exists.");
  categories.push(name);
  input.value = "";
  saveData();
  renderAdminCategories();
  renderCategoryFilters();
});

document.getElementById("newCategoryName").addEventListener("keydown", event => {
  if (event.key === "Enter") document.getElementById("addCategoryBtn").click();
});

function renameCategory(index) {
  const oldName = categories[index];
  if (!oldName) return;
  const newName = prompt("Enter the new category name:", oldName);
  if (newName === null) return;
  const cleanName = newName.trim().replace(/\s+/g, " ");
  if (!cleanName) return alert("Category name cannot be empty.");
  if (categories.some((cat, i) => i !== index && cat.toLowerCase() === cleanName.toLowerCase())) return alert("That category already exists.");
  categories[index] = cleanName;
  menu.forEach(item => { if (String(item.category).toLowerCase() === oldName.toLowerCase()) item.category = cleanName; });
  if (activeCategory === oldName) activeCategory = cleanName;
  saveData(); renderAdminView(); renderCustomerView();
}

function deleteCategory(index) {
  const category = categories[index];
  if (!category) return;
  const affected = menu.filter(item => String(item.category).toLowerCase() === category.toLowerCase());
  if (affected.length) {
    const confirmed = confirm(`${affected.length} product(s) use “${category}”. Delete the category and move those products to “Other”?`);
    if (!confirmed) return;
    if (!categories.some(cat => cat.toLowerCase() === "other")) categories.push("Other");
    affected.forEach(item => { item.category = "Other"; });
  } else if (!confirm(`Delete the “${category}” category?`)) return;
  categories.splice(index, 1);
  if (activeCategory === category) activeCategory = "All";
  saveData(); renderAdminView(); renderCustomerView();
}

// ==========================================
// 8. ADD PRODUCTS (PHONE PHOTO + URL) & ADMIN LIST
// ==========================================
document.getElementById("addFoodBtn").addEventListener("click", function () {
  const name = document.getElementById("newFoodName").value.trim();
  const price = Number(document.getElementById("newFoodPrice").value);
  const category = document.getElementById("newFoodCategory").value.trim() || "Specials";
  if (!categories.some(cat => cat.toLowerCase() === category.toLowerCase())) categories.push(category);
  const desc = document.getElementById("newFoodDesc") ? document.getElementById("newFoodDesc").value.trim() : "";
  const photoInput = document.getElementById("newFoodPhoto");
  const urlInput = document.getElementById("newFoodImage");
  const file = photoInput && photoInput.files ? photoInput.files[0] : null;
  const imageUrl = urlInput ? urlInput.value.trim() : "";

  if (!name || price <= 0) return alert("Please enter a valid product name and price.");

  const finalizeAdd = (imageData) => {
    try {
      menu.push({ id: Date.now(), name, price, category, desc, available: true, image: imageData });
      saveData();
      renderAdminView();

      document.getElementById("newFoodName").value = "";
      document.getElementById("newFoodPrice").value = "";
      document.getElementById("newFoodCategory").value = "";
      if (document.getElementById("newFoodDesc")) document.getElementById("newFoodDesc").value = "";
      if (photoInput) photoInput.value = "";
      if (urlInput) urlInput.value = "";
    } catch (err) {
      menu.pop();
      alert("Storage is full! Try uploading a smaller photo or deleting old items.");
    }
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const maxWidth = 600;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        finalizeAdd(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    finalizeAdd(imageUrl);
  }
});

function toggleAvailability(id) {
  const item = menu.find(f => f.id === id);
  if (item) {
    item.available = !item.available;
    saveData();
    renderAdminView();
  }
}

function editPrice(id) {
  const item = menu.find(food => food.id === id);
  if (!item) return;
  const updatedName = prompt("Product name:", item.name);
  if (updatedName === null) return;
  const updatedPrice = prompt("Price in naira:", item.price);
  if (updatedPrice === null) return;
  const updatedCategory = prompt("Category:", item.category);
  if (updatedCategory === null) return;
  const updatedDesc = prompt("Short description (leave blank for none):", item.desc || "");
  if (updatedDesc === null) return;
  const price = Number(updatedPrice);
  if (!updatedName.trim() || !Number.isFinite(price) || price <= 0 || !updatedCategory.trim()) return alert("Please enter a valid name, category and price.");
  item.name = updatedName.trim();
  item.price = price;
  item.category = updatedCategory.trim();
  item.desc = updatedDesc.trim();
  if (!categories.some(cat => cat.toLowerCase() === item.category.toLowerCase())) categories.push(item.category);
  saveData(); renderAdminView(); renderCustomerView();
}

function deleteFood(id) {
  if (!confirm("Delete this item from the menu?")) return;
  menu = menu.filter(f => f.id !== id);
  saveData();
  renderAdminView();
}

document.getElementById("clearOrdersBtn").addEventListener("click", function () {
  if (!confirm("Clear today's order log?")) return;
  orders = [];
  saveData();
  renderAdminView();
});

document.getElementById("exportOrdersBtn").addEventListener("click", exportOrdersCSV);

function exportOrdersCSV() {
  if (!orders.length) return alert("There are no orders to export yet.");
  const rows = [["Date", "Time", "Customer", "Phone", "Order Type", "Address", "Items", "Note", "Total (NGN)", "Status"]];
  orders.forEach(order => rows.push([
    order.date || "", order.time || "", order.customer || "", order.phone || "", order.method || "",
    order.address || "", (order.items || []).map(item => `${item.qty} x ${item.name}`).join("; "), order.note || "",
    order.total || 0, order.status || "New"
  ]));
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `dooba-orders-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function toggleOrderStatus(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) return;
  order.status = order.status === "Completed" ? "New" : "Completed";
  saveData(); renderAdminView();
}

function renderAdminView() {
  renderAdminCategories();
  shopOpenToggle.checked = shopOpen;
  shopOpenLabel.textContent = shopOpen ? "Kitchen is OPEN" : "Kitchen is CLOSED";
  shopOpenLabel.className = shopOpen ? "form-check-label fw-bold text-success" : "form-check-label fw-bold text-danger";

  deliveryToggle.checked = deliveryAllowed;
  deliveryToggleLabel.textContent = deliveryAllowed ? "Delivery is ON (Yes)" : "Delivery is OFF (No)";
  deliveryToggleLabel.className = deliveryAllowed ? "form-check-label fw-bold text-success" : "form-check-label fw-bold text-danger";

  document.getElementById("deliveryFeeInput").value = deliveryFee;
  document.getElementById("adminOrderCount").textContent = orders.length;
  document.getElementById("adminTotalSales").textContent = orders.reduce((sum, o) => sum + o.total, 0).toLocaleString();
  document.getElementById("adminActiveCount").textContent = menu.filter(m => m.available).length;

  const adminMenuList = document.getElementById("adminMenuList");
  adminMenuList.innerHTML = "";
  menu.forEach(item => {
    adminMenuList.innerHTML += `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom py-2">
        <div>
          <strong>${item.name}</strong> <span class="badge bg-light text-dark border">${item.category}</span><br />
          <span class="text-success fw-bold">₦${item.price.toLocaleString()}</span>
        </div>
        <div class="d-flex gap-1">
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="editPrice(${item.id})">Edit product</button>
          <button type="button" class="btn btn-sm ${item.available ? "btn-outline-warning" : "btn-success"}" onclick="toggleAvailability(${item.id})">
            ${item.available ? "Mark Sold Out" : "Available"}
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteFood(${item.id})">Delete</button>
        </div>
      </div>
    `;
  });

  const adminOrderLog = document.getElementById("adminOrderLog");
  if (orders.length === 0) {
    adminOrderLog.innerHTML = "No orders logged yet today.";
  } else {
    adminOrderLog.innerHTML = orders.map(o => `
      <div class="border-bottom py-3">
        <div class="d-flex justify-content-between flex-wrap gap-2">
          <div><strong>${escapeHTML(o.customer)}</strong> <span class="text-muted">(${escapeHTML(o.phone)})</span><br><span class="badge bg-light text-dark border">${escapeHTML(o.method)}</span> <small class="text-muted">${escapeHTML(o.time || "")}</small></div>
          <div class="text-end"><strong class="text-success">₦${Number(o.total || 0).toLocaleString()}</strong><br><span class="badge ${o.status === "Completed" ? "bg-success" : "bg-warning text-dark"}">${escapeHTML(o.status || "New")}</span></div>
        </div>
        ${o.items?.length ? `<div class="small text-muted mt-2">${o.items.map(item => `${Number(item.qty)} × ${escapeHTML(item.name)}`).join(" · ")}</div>` : ""}
        ${o.address ? `<div class="small text-muted">Address: ${escapeHTML(o.address)}</div>` : ""}
        ${o.note ? `<div class="small text-muted">Note: ${escapeHTML(o.note)}</div>` : ""}
        <button type="button" class="btn btn-sm btn-outline-success mt-2" onclick="toggleOrderStatus(${o.id})">${o.status === "Completed" ? "Reopen order" : "Mark completed"}</button>
      </div>
    `).join("");
  }
}

// Start App
renderCustomerView();
