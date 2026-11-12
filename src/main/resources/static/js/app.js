/**
 * Maison D'or - Luxury Jewelry Shop Management System
 * Main UI Application Controller & Views
 */

(function () {
  const store = window.JewelryStore;

  // App UI State
  const uiState = {
    currentTab: "dashboard",
    inventoryView: "cards", // "cards" or "table"
    inventoryCategory: "All",
    inventoryMetal: "All",
    inventoryStatus: "All",
    inventorySearch: "",
    posCategory: "All",
    posSearch: "",
    selectedItemDetail: null,
    activeInvoiceToView: null
  };

  // Toast Notification
  function showToast(message, type = "gold") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style="background: var(--gold-glow); color: var(--gold-primary)">✦</div>
      <div class="flex-1">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Init App
  function init() {
    setupHeader();
    setupNavigation();
    renderAll();

    // Listen to store updates
    window.addEventListener("jewelry-state-updated", () => {
      renderAll();
    });

    // Dark mode check
    if (localStorage.getItem("MAISONDOR_DARK_MODE") === "true") {
      document.body.classList.add("dark-mode");
      const toggle = document.getElementById("theme-toggle-btn");
      if (toggle) toggle.innerHTML = "☀️";
    }
  }

  // Header & Live Metal Ticker Bar
  function setupHeader() {
    const s = store.getState();
    const tickerEl = document.getElementById("live-ticker-bar");
    if (!tickerEl) return;

    let itemsHtml = "";
    for (const [key, item] of Object.entries(s.metalRates)) {
      const formattedPrice = store.formatCurrency(item.pricePerGram);
      const isPositive = item.change && item.change.startsWith("+");
      const changeClass = isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400";
      
      itemsHtml += `
        <div class="flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-full border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 shadow-sm backdrop-blur-sm whitespace-nowrap">
          <span class="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px] font-semibold">${item.name.split(" ")[0]} ${item.purity}</span>
          <span class="font-bold text-stone-900 dark:text-stone-100">${formattedPrice}/g</span>
          <span class="${changeClass} text-[10px] font-semibold">${item.change || ""}</span>
        </div>
      `;
    }

    tickerEl.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs overflow-x-auto gap-4">
        <div class="flex items-center space-x-2 text-stone-500 dark:text-stone-400 shrink-0 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-700 animate-pulse"></span>
          <span class="uppercase tracking-widest text-[10px] font-bold text-amber-800/80 dark:text-amber-400/80">Bullion Live Ticker</span>
        </div>
        <div class="flex items-center space-x-3 overflow-x-auto py-1 no-scrollbar">
          ${itemsHtml}
        </div>
        <button id="open-rates-modal-btn" class="shrink-0 px-3 py-1 rounded-md text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition">
          ⚙ Edit Rates
        </button>
      </div>
    `;

    document.getElementById("open-rates-modal-btn")?.addEventListener("click", openRatesModal);

    // Currency selector
    const currSelect = document.getElementById("currency-select");
    if (currSelect) {
      currSelect.value = s.settings.currency || "USD";
      currSelect.onchange = (e) => {
        store.setCurrency(e.target.value);
        showToast(`Currency converted to ${e.target.value}`);
      };
    }

    // Theme toggle
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.onclick = () => {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("MAISONDOR_DARK_MODE", isDark ? "true" : "false");
        themeBtn.innerHTML = isDark ? "☀️" : "🌙";
        showToast(isDark ? "Switched to Nocturne Dark Mode" : "Switched to Alabaster Light Mode");
      };
    }
  }

  // Navigation
  function setupNavigation() {
    const navLinks = document.querySelectorAll("[data-tab-target]");
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = link.getAttribute("data-tab-target");
        switchTab(tab);
      });
    });

    document.getElementById("quick-new-bill-btn")?.addEventListener("click", () => {
      switchTab("billing");
    });
  }

  function switchTab(tabId) {
    uiState.currentTab = tabId;
    
    // Update active class on nav
    document.querySelectorAll("[data-tab-target]").forEach(link => {
      const target = link.getAttribute("data-tab-target");
      if (target === tabId) {
        link.className = "flex items-center space-x-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg bg-amber-950/5 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border-b-2 border-amber-600 dark:border-amber-400 transition";
      } else {
        link.className = "flex items-center space-x-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/60 dark:hover:bg-stone-800/60 transition";
      }
    });

    // Hide all views, show current
    document.querySelectorAll(".tab-view").forEach(view => view.classList.add("hidden"));
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.classList.remove("hidden");

    renderCurrentTab();
  }

  function renderAll() {
    setupHeader();
    renderCurrentTab();
    renderCartBadge();
  }

  function renderCurrentTab() {
    switch (uiState.currentTab) {
      case "dashboard":
        renderDashboard();
        break;
      case "inventory":
        renderInventory();
        break;
      case "billing":
        renderBilling();
        break;
      case "melt-calculator":
        renderMeltCalculator();
        break;
      case "workshop":
        renderWorkshop();
        break;
      case "clients":
        renderClients();
        break;
      case "reports":
        renderReports();
        break;
      case "settings":
        renderSettings();
        break;
    }
  }

  function renderCartBadge() {
    const s = store.getState();
    const count = s.cart.length;
    const badge = document.getElementById("nav-cart-badge");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    }
  }

  // =========================================================================
  // VIEW: DASHBOARD
  // =========================================================================
  function renderDashboard() {
    const s = store.getState();
    const container = document.getElementById("view-dashboard");
    if (!container) return;

    // Calculate key metrics
    let totalVaultValue = 0;
    let totalGrossGoldWeight = 0;
    let totalNetGoldWeight = 0;
    let totalDiamondsCarats = 0;
    let inVaultCount = 0;
    let displayCount = 0;

    s.inventory.forEach(item => {
      const p = store.calculateItemPrice(item);
      totalVaultValue += p.subtotal;
      if (item.status === "in_vault") inVaultCount++;
      if (item.status === "available") displayCount++;

      if (item.purityKey.startsWith("gold")) {
        totalGrossGoldWeight += Number(item.grossWeight || 0);
        totalNetGoldWeight += Number(item.netWeight || 0);
      }
      if (item.stoneWeight && item.stoneType.toLowerCase().includes("diamond")) {
        // approx 1g = 5 carats
        totalDiamondsCarats += (Number(item.stoneWeight) * 5);
      }
    });

    const todaySalesTotal = s.recentSales.reduce((acc, sale) => acc + (sale.netPaid || 0), 0);
    const activeOrdersCount = s.customOrders.filter(o => o.stage !== "Ready").length;

    container.innerHTML = `
      <div class="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Top Executive Welcome Banner -->
        <div class="card-luxury p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-amber-600 dark:border-amber-400">
          <div>
            <div class="text-[11px] font-bold uppercase tracking-widest text-amber-800/80 dark:text-amber-400/90 flex items-center gap-2">
              <span>Haute Horlogerie & Vault Suite</span>
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Vault Safe Secured</span>
            </div>
            <h1 class="font-serif-luxury text-3xl sm:text-4xl font-semibold text-stone-900 dark:text-stone-50 mt-1">
              Atelier & Salon Overview
            </h1>
            <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">
              ${s.settings.shopName} • ${s.settings.address}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button id="dash-quick-bill" class="px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase gold-gradient-bg shadow-md hover:shadow-lg transition flex items-center gap-2">
              <span>+ New Sale / Invoice</span>
            </button>
            <button id="dash-add-ornament" class="px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition">
              <span>+ Register Piece</span>
            </button>
            <button id="dash-open-calc" class="px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-100 transition">
              <span>⚖ Old Gold Melt</span>
            </button>
          </div>
        </div>

        <!-- 4 Primary KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Card 1: Today's Revenue -->
          <div class="card-luxury p-5 relative overflow-hidden">
            <div class="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-medium">
              <span class="uppercase tracking-wider">Today's Transactions</span>
              <span class="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">✓</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-bold font-serif-luxury text-stone-900 dark:text-stone-50">
                ${store.formatCurrency(todaySalesTotal)}
              </div>
              <div class="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1.5">
                <span class="text-emerald-600 font-semibold">100% reconciled</span> • ${s.recentSales.length} closed sales
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between text-[11px] text-stone-500">
              <span>Target: $25,000</span>
              <span class="font-medium text-stone-700 dark:text-stone-300">${Math.round((todaySalesTotal / 25000) * 100)}% achieved</span>
            </div>
          </div>

          <!-- Card 2: Vault Inventory Valuation -->
          <div class="card-luxury p-5 relative overflow-hidden">
            <div class="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-medium">
              <span class="uppercase tracking-wider">Live Vault Valuation</span>
              <span class="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">⚜</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-bold font-serif-luxury text-stone-900 dark:text-stone-50">
                ${store.formatCurrency(totalVaultValue)}
              </div>
              <div class="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1.5">
                <span class="text-amber-600 font-semibold">Dynamic</span> • linked to live bullion ticker
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between text-[11px] text-stone-500">
              <span>Total Catalog</span>
              <span class="font-medium text-stone-700 dark:text-stone-300">${s.inventory.length} pieces registered</span>
            </div>
          </div>

          <!-- Card 3: Stock Status -->
          <div class="card-luxury p-5 relative overflow-hidden">
            <div class="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-medium">
              <span class="uppercase tracking-wider">Showcase vs Safe</span>
              <span class="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">☖</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-bold font-serif-luxury text-stone-900 dark:text-stone-50">
                ${displayCount} <span class="text-base font-sans font-normal text-stone-400">/ ${inVaultCount}</span>
              </div>
              <div class="text-xs text-stone-500 dark:text-stone-400 mt-1">
                ${displayCount} in Display Trays • ${inVaultCount} in High-Security Vault
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between text-[11px] text-stone-500">
              <span>Audit Status</span>
              <span class="text-emerald-700 dark:text-emerald-400 font-semibold">100% Barcoded</span>
            </div>
          </div>

          <!-- Card 4: Artisan Orders -->
          <div class="card-luxury p-5 relative overflow-hidden">
            <div class="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-medium">
              <span class="uppercase tracking-wider">Custom Atelier</span>
              <span class="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">⚒</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl sm:text-3xl font-bold font-serif-luxury text-stone-900 dark:text-stone-50">
                ${activeOrdersCount} <span class="text-base font-sans font-normal text-stone-400">in craft</span>
              </div>
              <div class="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Bespoke bridal & heirloom commissions
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between text-[11px] text-stone-500">
              <span>Next Handover</span>
              <span class="font-medium text-amber-800 dark:text-amber-400">18-Nov (Signet Ring)</span>
            </div>
          </div>
        </div>

        <!-- Middle Section: Precious Metal Reserve Balance + Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Bullion Weight Reserves (2 columns) -->
          <div class="lg:col-span-2 card-luxury p-6">
            <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <h2 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">
                  Precious Metal Stock & Bullion Reserves
                </h2>
                <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Physical gross and net pure metal weight monitored in safes</p>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">Digital Scale Synced</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div class="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div class="text-xs font-semibold text-amber-900 dark:text-amber-400 uppercase tracking-wider">Gold Reserves (Net)</div>
                <div class="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1 font-serif-luxury">${store.formatWeight(totalNetGoldWeight)}</div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Gross Wt: ${store.formatWeight(totalGrossGoldWeight)}</div>
                <div class="w-full bg-amber-200/50 dark:bg-amber-900/40 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div class="bg-amber-500 h-full rounded-full" style="width: 82%"></div>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Platinum 950</div>
                <div class="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1 font-serif-luxury">30.400 g</div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Certified PT-950 Pure</div>
                <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div class="bg-slate-500 h-full rounded-full" style="width: 45%"></div>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <div class="text-xs font-semibold text-blue-900 dark:text-blue-400 uppercase tracking-wider">Certified Diamonds</div>
                <div class="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1 font-serif-luxury">${totalDiamondsCarats.toFixed(2)} cts</div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400 mt-1">GIA & IGI Graded</div>
                <div class="w-full bg-blue-200/50 dark:bg-blue-900/40 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div class="bg-blue-500 h-full rounded-full" style="width: 68%"></div>
                </div>
              </div>
            </div>

            <!-- Karatage Distribution visual breakdown bar -->
            <div class="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
              <div class="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2 flex justify-between">
                <span>Gold Purity Distribution in Vault</span>
                <span class="text-stone-400">22K Hallmark (52%) • 18K Luxury (36%) • 24K Mint (12%)</span>
              </div>
              <div class="w-full h-3 rounded-full overflow-hidden flex bg-stone-100 dark:bg-stone-800">
                <div class="bg-amber-500 h-full" style="width: 52%" title="22K Sovereign"></div>
                <div class="bg-amber-300 h-full" style="width: 36%" title="18K Royal"></div>
                <div class="bg-yellow-400 h-full" style="width: 12%" title="24K Mint Ingot"></div>
              </div>
            </div>
          </div>

          <!-- VIP Activity & Concierge Notice (1 column) -->
          <div class="card-luxury p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <h3 class="font-serif-luxury text-lg font-semibold text-stone-900 dark:text-stone-50">Private Appointments</h3>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">Today</span>
              </div>
              
              <div class="space-y-3.5 mt-4">
                <div class="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs">
                  <div class="flex items-center justify-between font-semibold text-stone-900 dark:text-stone-100">
                    <span>Lady Vivienne Chen</span>
                    <span class="text-amber-700 dark:text-amber-400">14:00 EST</span>
                  </div>
                  <p class="text-stone-500 dark:text-stone-400 mt-1 text-[11px]">Private viewing: Rivière Diamond Necklace & Colombian Emeralds</p>
                </div>

                <div class="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs">
                  <div class="flex items-center justify-between font-semibold text-stone-900 dark:text-stone-100">
                    <span>Eleanor Vance-Sterling</span>
                    <span class="text-amber-700 dark:text-amber-400">16:30 EST</span>
                  </div>
                  <p class="text-stone-500 dark:text-stone-400 mt-1 text-[11px]">CAD Wax inspection for Bespoke Choker order</p>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button id="dash-view-all-clients" class="w-full py-2 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline">
                View Full VIP Clientele Directory →
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Recent Invoices & Transactions -->
        <div class="card-luxury p-6">
          <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h2 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">
                Recent Ledger & Invoices
              </h2>
              <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Authenticated sales with hallmark certification declarations</p>
            </div>
            <button id="dash-go-to-billing" class="text-xs font-semibold text-amber-800 dark:text-amber-400 hover:underline">
              Terminal POS Register →
            </button>
          </div>

          <div class="overflow-x-auto mt-4">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-stone-400 dark:text-stone-500 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800 text-[10px]">
                  <th class="py-3 px-3">Invoice ID</th>
                  <th class="py-3 px-3">Date</th>
                  <th class="py-3 px-3">Client</th>
                  <th class="py-3 px-3">Purchased Piece(s)</th>
                  <th class="py-3 px-3">Payment Mode</th>
                  <th class="py-3 px-3 text-right">Trade-in Credit</th>
                  <th class="py-3 px-3 text-right">Net Paid</th>
                  <th class="py-3 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 dark:divide-stone-800/60 font-normal">
                ${s.recentSales.map(sale => `
                  <tr class="hover:bg-stone-50/60 dark:hover:bg-stone-900/40 transition">
                    <td class="py-3 px-3 font-mono font-medium text-amber-800 dark:text-amber-400">${sale.invoiceId}</td>
                    <td class="py-3 px-3 text-stone-500 dark:text-stone-400">${sale.date}</td>
                    <td class="py-3 px-3 font-semibold text-stone-900 dark:text-stone-100">${sale.client}</td>
                    <td class="py-3 px-3 text-stone-600 dark:text-stone-300 max-w-xs truncate">${sale.itemSummary}</td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                        ${sale.paymentMethod}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      ${sale.tradeInCredit > 0 ? "-" + store.formatCurrency(sale.tradeInCredit) : "—"}
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                      ${store.formatCurrency(sale.netPaid)}
                    </td>
                    <td class="py-3 px-3 text-center">
                      <button data-view-invoice="${sale.invoiceId}" class="px-2.5 py-1 rounded text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition">
                        View Bill
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById("dash-quick-bill")?.addEventListener("click", () => switchTab("billing"));
    document.getElementById("dash-add-ornament")?.addEventListener("click", openAddPieceModal);
    document.getElementById("dash-open-calc")?.addEventListener("click", () => switchTab("melt-calculator"));
    document.getElementById("dash-view-all-clients")?.addEventListener("click", () => switchTab("clients"));
    document.getElementById("dash-go-to-billing")?.addEventListener("click", () => switchTab("billing"));

    // Invoice view triggers
    container.querySelectorAll("[data-view-invoice]").forEach(btn => {
      btn.addEventListener("click", () => {
        const invId = btn.getAttribute("data-view-invoice");
        const found = s.recentSales.find(r => r.invoiceId === invId);
        if (found) openInvoiceModal(found);
      });
    });
  }

  // =========================================================================
  // VIEW: INVENTORY & VAULT CATALOG
  // =========================================================================
  function renderInventory() {
    const s = store.getState();
    const container = document.getElementById("view-inventory");
    if (!container) return;

    const categories = ["All", "Rings", "Necklaces", "Bangles & Bracelets", "Earrings", "Pendants", "Bullion & Coins", "High Horology"];
    const metals = ["All", "24K", "22K", "18K", "14K", "Platinum 950", "Silver 925"];
    const statuses = ["All", "available", "in_vault", "reserved", "sold"];

    // Filter items
    let filtered = s.inventory.filter(item => {
      if (uiState.inventoryCategory !== "All" && item.category !== uiState.inventoryCategory) return false;
      if (uiState.inventoryMetal !== "All") {
        if (!item.metal.toLowerCase().includes(uiState.inventoryMetal.toLowerCase())) return false;
      }
      if (uiState.inventoryStatus !== "All" && item.status !== uiState.inventoryStatus) return false;
      if (uiState.inventorySearch.trim()) {
        const q = uiState.inventorySearch.toLowerCase();
        const match = item.title.toLowerCase().includes(q) ||
                      item.sku.toLowerCase().includes(q) ||
                      item.hallmarkId.toLowerCase().includes(q) ||
                      item.stoneType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Header with Add Piece Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-serif-luxury text-3xl font-semibold text-stone-900 dark:text-stone-50">
              Vault & Showcase Inventory
            </h1>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Live repricing active • ${filtered.length} of ${s.inventory.length} pieces displayed
            </p>
          </div>
          <div class="flex items-center gap-3">
            <!-- View switch -->
            <div class="inline-flex rounded-lg border border-stone-200 dark:border-stone-800 p-0.5 bg-stone-100/60 dark:bg-stone-900 text-xs font-semibold">
              <button id="view-cards-btn" class="px-3 py-1.5 rounded-md ${uiState.inventoryView === 'cards' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500'}">
                Gallery
              </button>
              <button id="view-table-btn" class="px-3 py-1.5 rounded-md ${uiState.inventoryView === 'table' ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500'}">
                Table
              </button>
            </div>

            <button id="inv-add-piece-btn" class="px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase gold-gradient-bg shadow-sm hover:shadow transition flex items-center gap-1.5">
              <span>+ Add Ornament</span>
            </button>
          </div>
        </div>

        <!-- Filter & Search Controls Bar -->
        <div class="card-luxury p-4 space-y-4">
          <!-- Search input + dropdowns -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-6 relative">
              <input id="inv-search-input" type="text" placeholder="Search by SKU, title, GIA certificate, stone description..."
                value="${uiState.inventorySearch}"
                class="w-full px-4 py-2 pl-9 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600 dark:focus:border-amber-400">
              <span class="absolute left-3 top-2.5 text-stone-400 text-xs">🔍</span>
            </div>

            <div class="sm:col-span-3">
              <select id="inv-metal-filter" class="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
                <option value="All">All Metals & Purities</option>
                ${metals.filter(m => m !== "All").map(m => `<option value="${m}" ${uiState.inventoryMetal === m ? "selected" : ""}>${m}</option>`).join("")}
              </select>
            </div>

            <div class="sm:col-span-3">
              <select id="inv-status-filter" class="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
                <option value="All">All Stock Locations</option>
                <option value="available" ${uiState.inventoryStatus === "available" ? "selected" : ""}>Display Trays</option>
                <option value="in_vault" ${uiState.inventoryStatus === "in_vault" ? "selected" : ""}>In Safe Vault</option>
                <option value="reserved" ${uiState.inventoryStatus === "reserved" ? "selected" : ""}>Reserved VIP</option>
                <option value="sold" ${uiState.inventoryStatus === "sold" ? "selected" : ""}>Sold</option>
              </select>
            </div>
          </div>

          <!-- Category Pills -->
          <div class="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar border-t border-stone-100 dark:border-stone-800 pt-3">
            ${categories.map(cat => `
              <button data-cat-filter="${cat}" class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${uiState.inventoryCategory === cat ? 'bg-amber-900 dark:bg-amber-400 text-white dark:text-stone-950 font-semibold shadow-sm' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'}">
                ${cat}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Inventory List Container -->
        ${filtered.length === 0 ? `
          <div class="card-luxury p-12 text-center text-stone-400 dark:text-stone-500">
            <div class="text-3xl mb-2">💎</div>
            <p class="font-serif-luxury text-lg text-stone-700 dark:text-stone-300">No jewelry items found matching this filter.</p>
            <p class="text-xs mt-1">Try resetting the category filter or search keywords.</p>
          </div>
        ` : uiState.inventoryView === "cards" ? renderInventoryCards(filtered) : renderInventoryTable(filtered)}
      </div>
    `;

    // Event listeners
    document.getElementById("view-cards-btn")?.addEventListener("click", () => {
      uiState.inventoryView = "cards";
      renderInventory();
    });
    document.getElementById("view-table-btn")?.addEventListener("click", () => {
      uiState.inventoryView = "table";
      renderInventory();
    });
    document.getElementById("inv-add-piece-btn")?.addEventListener("click", openAddPieceModal);

    const searchInput = document.getElementById("inv-search-input");
    if (searchInput) {
      searchInput.oninput = (e) => {
        uiState.inventorySearch = e.target.value;
        renderInventory();
        // Restore focus
        const fresh = document.getElementById("inv-search-input");
        if (fresh) {
          fresh.focus();
          fresh.setSelectionRange(fresh.value.length, fresh.value.length);
        }
      };
    }

    document.getElementById("inv-metal-filter")?.addEventListener("change", (e) => {
      uiState.inventoryMetal = e.target.value;
      renderInventory();
    });
    document.getElementById("inv-status-filter")?.addEventListener("change", (e) => {
      uiState.inventoryStatus = e.target.value;
      renderInventory();
    });

    container.querySelectorAll("[data-cat-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        uiState.inventoryCategory = btn.getAttribute("data-cat-filter");
        renderInventory();
      });
    });

    // Add to cart buttons
    container.querySelectorAll("[data-add-to-cart]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-add-to-cart");
        const success = store.addToCart(id);
        if (success) {
          showToast(`Added to active POS bill register`);
          renderCartBadge();
        } else {
          showToast(`Item is already in active bill or sold`, "warning");
        }
      });
    });

    // Item detail triggers
    container.querySelectorAll("[data-view-specs]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-view-specs");
        const itm = s.inventory.find(i => i.id === id);
        if (itm) openItemSpecsModal(itm);
      });
    });
  }

  function getPurityBadgeClass(purityKey) {
    if (purityKey === "gold_24k") return "badge-24k";
    if (purityKey === "gold_22k") return "badge-22k";
    if (purityKey === "gold_18k" || purityKey === "gold_14k") return "badge-18k";
    if (purityKey === "plat_950") return "badge-plat";
    return "badge-silver";
  }

  function renderInventoryCards(items) {
    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${items.map(item => {
          const pricing = store.calculateItemPrice(item);
          const badgeClass = getPurityBadgeClass(item.purityKey);
          const isSold = item.status === "sold";
          const isReserved = item.status === "reserved";

          return `
            <div class="card-luxury overflow-hidden flex flex-col group relative ${isSold ? 'opacity-60' : ''}">
              <!-- Thumbnail Image Container -->
              <div class="relative h-48 w-full bg-stone-100 dark:bg-stone-900 overflow-hidden cursor-pointer" data-view-specs="${item.id}">
                <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                
                <!-- Status & Purity Overlay Badges -->
                <div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClass} shadow-sm">
                    ${item.metal}
                  </span>
                  ${item.status === 'in_vault' ? `
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-stone-900/80 text-stone-100 backdrop-blur-sm">
                      🔒 Vault Safe
                    </span>
                  ` : ''}
                  ${isReserved ? `
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-stone-950">
                      VIP Hold
                    </span>
                  ` : ''}
                  ${isSold ? `
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-700 text-white">
                      Sold
                    </span>
                  ` : ''}
                </div>

                <!-- SKU tag -->
                <div class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white font-mono text-[9px] tracking-wider">
                  ${item.sku}
                </div>
              </div>

              <!-- Content Body -->
              <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div class="text-[10px] font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-400/80 mb-0.5">
                    ${item.category} • ${item.location.split("(")[0]}
                  </div>
                  <h3 class="font-serif-luxury text-base font-semibold text-stone-900 dark:text-stone-100 line-clamp-1 cursor-pointer hover:text-amber-800 dark:hover:text-amber-300" data-view-specs="${item.id}">
                    ${item.title}
                  </h3>
                  <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    ${item.stoneType}
                  </p>
                </div>

                <!-- Weight and Specs Grid -->
                <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span class="text-stone-400 text-[10px] uppercase block">Gross Wt</span>
                    <span class="font-medium text-stone-700 dark:text-stone-300">${store.formatWeight(item.grossWeight)}</span>
                  </div>
                  <div>
                    <span class="text-stone-400 text-[10px] uppercase block">Net Pure Wt</span>
                    <span class="font-semibold text-stone-900 dark:text-stone-100">${store.formatWeight(item.netWeight)}</span>
                  </div>
                </div>

                <!-- Price and Action CTA -->
                <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-stone-400 uppercase tracking-wider block">Estimated Value</span>
                    <span class="font-serif-luxury text-lg font-bold text-stone-900 dark:text-stone-50">
                      ${store.formatCurrency(pricing.subtotal)}
                    </span>
                  </div>

                  ${isSold ? `
                    <span class="text-xs font-semibold text-stone-400">Sold</span>
                  ` : `
                    <button data-add-to-cart="${item.id}" class="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider gold-gradient-bg shadow-sm hover:shadow transition flex items-center gap-1">
                      <span>+ Bill</span>
                    </button>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderInventoryTable(items) {
    return `
      <div class="card-luxury overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-stone-400 dark:text-stone-500 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800 text-[10px] bg-stone-50/50 dark:bg-stone-900/50">
                <th class="py-3 px-3">SKU</th>
                <th class="py-3 px-3">Title & Category</th>
                <th class="py-3 px-3">Metal / Purity</th>
                <th class="py-3 px-3 text-right">Gross Wt</th>
                <th class="py-3 px-3 text-right">Net Wt</th>
                <th class="py-3 px-3">Stone & Gem Specs</th>
                <th class="py-3 px-3">Making Charge</th>
                <th class="py-3 px-3">Location</th>
                <th class="py-3 px-3 text-right">Dynamic Total</th>
                <th class="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
              ${items.map(item => {
                const pricing = store.calculateItemPrice(item);
                const badgeClass = getPurityBadgeClass(item.purityKey);
                return `
                  <tr class="hover:bg-stone-50/60 dark:hover:bg-stone-900/40 transition">
                    <td class="py-3 px-3 font-mono font-medium text-amber-800 dark:text-amber-400">${item.sku}</td>
                    <td class="py-3 px-3">
                      <div class="font-semibold text-stone-900 dark:text-stone-100 cursor-pointer hover:underline" data-view-specs="${item.id}">
                        ${item.title}
                      </div>
                      <div class="text-[10px] text-stone-500">${item.category} • ${item.hallmarkId}</div>
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">
                        ${item.metal}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right font-mono">${store.formatWeight(item.grossWeight)}</td>
                    <td class="py-3 px-3 text-right font-mono font-semibold text-stone-900 dark:text-stone-100">${store.formatWeight(item.netWeight)}</td>
                    <td class="py-3 px-3 max-w-xs truncate text-stone-600 dark:text-stone-300">${item.stoneType}</td>
                    <td class="py-3 px-3 text-stone-600 dark:text-stone-400">
                      ${item.makingChargeType === 'per_gram' ? store.formatCurrency(item.makingChargeValue) + '/g' : store.formatCurrency(item.makingChargeValue) + ' (flat)'}
                    </td>
                    <td class="py-3 px-3 text-stone-500 dark:text-stone-400 text-[11px]">${item.location}</td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-50">
                      ${store.formatCurrency(pricing.subtotal)}
                    </td>
                    <td class="py-3 px-3 text-center">
                      ${item.status === 'sold' ? `
                        <span class="text-stone-400 text-xs">Sold</span>
                      ` : `
                        <button data-add-to-cart="${item.id}" class="px-2.5 py-1 rounded text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition">
                          + Add to Bill
                        </button>
                      `}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: POINT OF SALE (POS) & BILLING TERMINAL
  // =========================================================================
  function renderBilling() {
    const s = store.getState();
    const container = document.getElementById("view-billing");
    if (!container) return;

    const totals = store.calculateCartTotals();

    // Quick catalog items for fast billing
    let catalogItems = s.inventory.filter(i => i.status === "available" || i.status === "in_vault");
    if (uiState.posCategory !== "All") {
      catalogItems = catalogItems.filter(i => i.category === uiState.posCategory);
    }
    if (uiState.posSearch.trim()) {
      const q = uiState.posSearch.toLowerCase();
      catalogItems = catalogItems.filter(i => i.title.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Top Title Bar -->
        <div class="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-6">
          <div>
            <h1 class="font-serif-luxury text-3xl font-semibold text-stone-900 dark:text-stone-50">
              Boutique Billing & POS Counter
            </h1>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Cashier: Concierge Terminal #1 • Real-time Gold & Diamond Valuation Active
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              Tax ID: ${s.settings.taxNumber}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- LEFT COLUMN: Quick Product Selection (7 cols) -->
          <div class="lg:col-span-7 space-y-4">
            <div class="card-luxury p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">Quick Catalog Picker</span>
                <span class="text-[11px] text-stone-400">Click to add to register</span>
              </div>

              <!-- Search and quick categories -->
              <div class="relative">
                <input id="pos-search-input" type="text" placeholder="Scan SKU / Search piece title..."
                  value="${uiState.posSearch}"
                  class="w-full px-4 py-2 pl-9 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600">
                <span class="absolute left-3 top-2.5 text-stone-400 text-xs">🔍</span>
              </div>

              <div class="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar text-xs">
                ${["All", "Rings", "Necklaces", "Bangles & Bracelets", "Earrings", "High Horology"].map(cat => `
                  <button data-pos-cat="${cat}" class="px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition ${uiState.posCategory === cat ? 'bg-amber-900 text-white font-semibold' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'}">
                    ${cat}
                  </button>
                `).join("")}
              </div>
            </div>

            <!-- Items mini grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
              ${catalogItems.length === 0 ? `
                <div class="sm:col-span-2 p-8 text-center text-xs text-stone-400 card-luxury">
                  No active stock matching search.
                </div>
              ` : catalogItems.map(item => {
                const pricing = store.calculateItemPrice(item);
                const badgeClass = getPurityBadgeClass(item.purityKey);
                return `
                  <div class="card-luxury p-3 flex gap-3 hover:border-amber-500 cursor-pointer transition" data-add-to-cart="${item.id}">
                    <img src="${item.image}" alt="${item.title}" class="w-16 h-16 rounded object-cover shrink-0 bg-stone-100">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="font-mono text-[9px] text-amber-800 dark:text-amber-400 font-bold">${item.sku}</span>
                        <span class="px-1.5 py-0.2 rounded text-[8px] font-bold ${badgeClass}">${item.metal.split(" ")[0]}</span>
                      </div>
                      <h4 class="font-serif-luxury text-xs font-semibold text-stone-900 dark:text-stone-100 truncate mt-0.5">${item.title}</h4>
                      <div class="text-[10px] text-stone-500 mt-0.5">Net Wt: ${store.formatWeight(item.netWeight, 2)}</div>
                      <div class="font-serif-luxury text-sm font-bold text-stone-900 dark:text-stone-50 mt-1">
                        ${store.formatCurrency(pricing.subtotal)}
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- RIGHT COLUMN: Active Digital Register / Invoice Builder (5 cols) -->
          <div class="lg:col-span-5 space-y-4">
            <div class="card-luxury p-5">
              <!-- Customer Selector -->
              <div class="border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
                <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                  <span>Client Profile</span>
                  <button id="pos-switch-customer-btn" class="text-amber-800 dark:text-amber-400 hover:underline text-[11px]">
                    Change Client
                  </button>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-stone-900 dark:text-stone-100 text-sm">${s.activeCustomer.name}</div>
                    <div class="text-xs text-stone-500">${s.activeCustomer.phone} • ${s.activeCustomer.tier}</div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Verified
                  </span>
                </div>
              </div>

              <!-- Cart Line Items -->
              <div class="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                ${s.cart.length === 0 ? `
                  <div class="text-center py-8 text-stone-400 text-xs border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
                    Register is empty.<br>Select items from left catalog to start billing.
                  </div>
                ` : s.cart.map(item => {
                  const pricing = store.calculateItemPrice(item);
                  return `
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-stone-50/60 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 text-xs">
                      <div class="flex-1 min-w-0 pr-2">
                        <div class="font-semibold text-stone-900 dark:text-stone-100 truncate">${item.title}</div>
                        <div class="text-[10px] text-stone-500">
                          ${item.metal} • Net: ${store.formatWeight(item.netWeight, 2)} • MC: ${store.formatCurrency(pricing.makingCharge)}
                        </div>
                      </div>
                      <div class="text-right shrink-0">
                        <div class="font-mono font-bold text-stone-900 dark:text-stone-100">${store.formatCurrency(pricing.subtotal)}</div>
                        <button data-remove-cart="${item.id}" class="text-[10px] text-rose-600 hover:underline">Remove</button>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>

              <!-- Old Gold Exchange Trade-in Accordion Section -->
              <div class="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">Old Gold / Scrap Exchange</span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="pos-tradein-toggle" ${s.tradeIn.applied ? 'checked' : ''} class="sr-only peer">
                    <div class="w-8 h-4 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                ${s.tradeIn.applied ? `
                  <div class="space-y-2.5 pt-2 border-t border-amber-200/40 text-xs">
                    <input id="tradein-desc" type="text" placeholder="Description (e.g. Broken 18K Chain & Ring)"
                      value="${s.tradeIn.description || ''}"
                      class="w-full px-2.5 py-1.5 text-xs rounded border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-stone-900 focus:outline-none">
                    
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-stone-500 uppercase block">Old Gross Wt (g)</label>
                        <input id="tradein-gross" type="number" step="0.01" value="${s.tradeIn.grossWeight || ''}" placeholder="0.00"
                          class="w-full px-2.5 py-1.5 text-xs rounded border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-stone-900 focus:outline-none">
                      </div>
                      <div>
                        <label class="text-[10px] text-stone-500 uppercase block">Stone/Dirt Deduction (g)</label>
                        <input id="tradein-deduct" type="number" step="0.01" value="${s.tradeIn.stoneDeduction || ''}" placeholder="0.00"
                          class="w-full px-2.5 py-1.5 text-xs rounded border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-stone-900 focus:outline-none">
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-stone-500 uppercase block">Purity Karat</label>
                        <select id="tradein-karat" class="w-full px-2 py-1.5 text-xs rounded border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-stone-900 focus:outline-none">
                          <option value="gold_22k" ${s.tradeIn.karat === 'gold_22k' ? 'selected' : ''}>22K Sovereign</option>
                          <option value="gold_18k" ${s.tradeIn.karat === 'gold_18k' ? 'selected' : ''}>18K Royal (75%)</option>
                          <option value="gold_14k" ${s.tradeIn.karat === 'gold_14k' ? 'selected' : ''}>14K (58.5%)</option>
                          <option value="gold_24k" ${s.tradeIn.karat === 'gold_24k' ? 'selected' : ''}>24K Pure (99.9%)</option>
                        </select>
                      </div>
                      <div>
                        <label class="text-[10px] text-stone-500 uppercase block">Calculated Credit</label>
                        <div class="px-2 py-1.5 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-900">
                          -${store.formatCurrency(totals.tradeInCredit)}
                        </div>
                      </div>
                    </div>
                  </div>
                ` : `
                  <p class="text-[11px] text-stone-500 dark:text-stone-400">
                    Enable to deduct customer's old gold scrap valuation directly from this invoice.
                  </p>
                `}
              </div>

              <!-- Bill Financial Breakdown -->
              <div class="space-y-2 border-t border-stone-200 dark:border-stone-800 pt-3 text-xs">
                <div class="flex justify-between text-stone-500 dark:text-stone-400">
                  <span>Gross Ornament Subtotal</span>
                  <span class="font-mono">${store.formatCurrency(totals.itemsSubtotal)}</span>
                </div>
                <div class="flex justify-between text-stone-500 dark:text-stone-400">
                  <span>Precious Metal Sales Tax (${totals.taxRate}%)</span>
                  <span class="font-mono">${store.formatCurrency(totals.tax)}</span>
                </div>
                ${totals.tradeInCredit > 0 ? `
                  <div class="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Less: Old Gold Scrap Credit</span>
                    <span class="font-mono">-${store.formatCurrency(totals.tradeInCredit)}</span>
                  </div>
                ` : ''}

                <div class="flex justify-between items-baseline pt-2 border-t border-stone-200 dark:border-stone-800 text-sm font-bold text-stone-900 dark:text-stone-50">
                  <span class="font-serif-luxury text-base">Net Payable Amount</span>
                  <span class="font-serif-luxury text-2xl gold-gradient-text">${store.formatCurrency(totals.finalPayable)}</span>
                </div>
              </div>

              <!-- Payment Method & Checkout Button -->
              <div class="mt-5 space-y-3">
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <button data-pay-method="Centurion / Card" class="pay-method-btn active px-2 py-2 rounded-lg border border-amber-600 bg-amber-50 dark:bg-amber-950 text-stone-900 dark:text-stone-100 font-medium text-center">
                    💳 Card / Wire
                  </button>
                  <button data-pay-method="Cash Vault" class="pay-method-btn px-2 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-medium text-center">
                    💵 Cash
                  </button>
                  <button data-pay-method="Trade-In Split" class="pay-method-btn px-2 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-medium text-center">
                    ⚖ Split
                  </button>
                </div>

                <button id="pos-complete-btn" ${s.cart.length === 0 ? 'disabled' : ''} class="w-full py-3 rounded-lg text-xs font-semibold tracking-wider uppercase gold-gradient-bg shadow-md hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed">
                  Complete Sale & Generate Certificate Invoice
                </button>

                <button id="pos-clear-btn" class="w-full py-1 text-center text-xs text-stone-400 hover:text-rose-600 transition">
                  Clear Active Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners for POS
    const posSearchInput = document.getElementById("pos-search-input");
    if (posSearchInput) {
      posSearchInput.oninput = (e) => {
        uiState.posSearch = e.target.value;
        renderBilling();
        const fresh = document.getElementById("pos-search-input");
        if (fresh) {
          fresh.focus();
          fresh.setSelectionRange(fresh.value.length, fresh.value.length);
        }
      };
    }

    container.querySelectorAll("[data-pos-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        uiState.posCategory = btn.getAttribute("data-pos-cat");
        renderBilling();
      });
    });

    container.querySelectorAll("[data-add-to-cart]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-add-to-cart");
        store.addToCart(id);
        renderBilling();
      });
    });

    container.querySelectorAll("[data-remove-cart]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-remove-cart");
        store.removeFromCart(id);
        renderBilling();
      });
    });

    document.getElementById("pos-clear-btn")?.addEventListener("click", () => {
      store.clearCart();
      renderBilling();
      showToast("Register cleared");
    });

    document.getElementById("pos-switch-customer-btn")?.addEventListener("click", openSelectCustomerModal);

    // Trade-in toggle & inputs
    const tradeinToggle = document.getElementById("pos-tradein-toggle");
    if (tradeinToggle) {
      tradeinToggle.onchange = (e) => {
        store.setTradeIn({ applied: e.target.checked });
        renderBilling();
      };
    }

    const tradeinGross = document.getElementById("tradein-gross");
    if (tradeinGross) {
      tradeinGross.onchange = (e) => {
        store.setTradeIn({ grossWeight: Number(e.target.value) || 0 });
        renderBilling();
      };
    }

    const tradeinDeduct = document.getElementById("tradein-deduct");
    if (tradeinDeduct) {
      tradeinDeduct.onchange = (e) => {
        store.setTradeIn({ stoneDeduction: Number(e.target.value) || 0 });
        renderBilling();
      };
    }

    const tradeinKarat = document.getElementById("tradein-karat");
    if (tradeinKarat) {
      tradeinKarat.onchange = (e) => {
        store.setTradeIn({ karat: e.target.value });
        renderBilling();
      };
    }

    // Checkout
    document.getElementById("pos-complete-btn")?.addEventListener("click", () => {
      const activePayBtn = container.querySelector(".pay-method-btn.active");
      const method = activePayBtn ? activePayBtn.getAttribute("data-pay-method") : "Centurion / Card";
      const invoice = store.completeCheckout({ method });
      if (invoice) {
        showToast(`Invoice ${invoice.invoiceId} finalized!`);
        openInvoiceModal(invoice);
      }
    });

    // Payment method buttons toggle
    container.querySelectorAll(".pay-method-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".pay-method-btn").forEach(b => {
          b.className = "pay-method-btn px-2 py-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-medium text-center";
        });
        btn.className = "pay-method-btn active px-2 py-2 rounded-lg border border-amber-600 bg-amber-50 dark:bg-amber-950 text-stone-900 dark:text-stone-100 font-medium text-center";
      });
    });
  }

  // =========================================================================
  // VIEW: OLD GOLD MELT & APPRAISAL CALCULATOR
  // =========================================================================
  function renderMeltCalculator() {
    const s = store.getState();
    const container = document.getElementById("view-melt-calculator");
    if (!container) return;

    // Local calculation state
    if (!window.meltCalcState) {
      window.meltCalcState = {
        grossWeight: 24.50,
        stoneDeduction: 1.80,
        karat: "gold_22k",
        refiningMargin: 2.0
      };
    }

    const res = store.calculateOldGoldValuation(
      window.meltCalcState.grossWeight,
      window.meltCalcState.stoneDeduction,
      window.meltCalcState.karat,
      window.meltCalcState.refiningMargin
    );

    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 class="font-serif-luxury text-3xl font-semibold text-stone-900 dark:text-stone-50">
            Old Gold Melt & Exchange Calculator
          </h1>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Certified appraisal engine for buyback, melt valuation, and scrap exchange
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          <!-- Input Form (6 cols) -->
          <div class="md:col-span-6 card-luxury p-6 space-y-4">
            <h2 class="font-serif-luxury text-lg font-semibold text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
              Digital Scale & Karatage Input
            </h2>

            <div>
              <label class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-1">
                Gross Scale Weight (Grams)
              </label>
              <input id="melt-gross" type="number" step="0.01" value="${window.meltCalcState.grossWeight}"
                class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600">
            </div>

            <div>
              <label class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-1">
                Estimated Stone / Enamel Deduction (g)
              </label>
              <input id="melt-deduct" type="number" step="0.01" value="${window.meltCalcState.stoneDeduction}"
                class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600">
            </div>

            <div>
              <label class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-1">
                Assayed Purity Karat
              </label>
              <select id="melt-karat" class="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
                <option value="gold_24k" ${window.meltCalcState.karat === 'gold_24k' ? 'selected' : ''}>24K Pure Gold (99.9%) — $${s.metalRates.gold_24k.pricePerGram}/g</option>
                <option value="gold_22k" ${window.meltCalcState.karat === 'gold_22k' ? 'selected' : ''}>22K Sovereign Hallmark (91.6%) — $${s.metalRates.gold_22k.pricePerGram}/g</option>
                <option value="gold_18k" ${window.meltCalcState.karat === 'gold_18k' ? 'selected' : ''}>18K Royal Gold (75.0%) — $${s.metalRates.gold_18k.pricePerGram}/g</option>
                <option value="gold_14k" ${window.meltCalcState.karat === 'gold_14k' ? 'selected' : ''}>14K Fine Gold (58.5%) — $${s.metalRates.gold_14k.pricePerGram}/g</option>
                <option value="plat_950" ${window.meltCalcState.karat === 'plat_950' ? 'selected' : ''}>Platinum 950 — $${s.metalRates.plat_950.pricePerGram}/g</option>
              </select>
            </div>

            <div>
              <label class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-1">
                Refining & Assay Loss Fee (% margin)
              </label>
              <input id="melt-margin" type="number" step="0.5" value="${window.meltCalcState.refiningMargin}"
                class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600">
            </div>

            <div class="pt-2">
              <button id="melt-apply-to-pos" class="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-amber-600 text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 transition">
                Apply Directly to POS Bill Cart →
              </button>
            </div>
          </div>

          <!-- Valuation Certificate Output (6 cols) -->
          <div class="md:col-span-6 card-luxury p-6 flex flex-col justify-between border-t-4 border-amber-600">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-widest text-amber-800/80 dark:text-amber-400">
                Official Appraisal Certificate
              </div>
              <h2 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50 mt-1">
                Net Melt Valuation
              </h2>

              <div class="mt-6 space-y-3 text-xs">
                <div class="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span class="text-stone-500">Gross Scale Weight:</span>
                  <span class="font-mono font-medium">${store.formatWeight(res.grossWeight)}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span class="text-stone-500">Non-gold Deduction:</span>
                  <span class="font-mono font-medium text-rose-600">-${store.formatWeight(res.stoneDeduction)}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span class="text-stone-700 dark:text-stone-300 font-semibold">Net Pure Gold Weight:</span>
                  <span class="font-mono font-bold text-stone-900 dark:text-stone-100">${store.formatWeight(res.netWeight)}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span class="text-stone-500">Market Rate Applied:</span>
                  <span class="font-mono">${store.formatCurrency(res.ratePerGram)}/g</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span class="text-stone-500">Gross Bullion Value:</span>
                  <span class="font-mono">${store.formatCurrency(res.meltGrossValue)}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span class="text-stone-500">Assay/Melt Margin Fee (${window.meltCalcState.refiningMargin}%):</span>
                  <span class="font-mono text-rose-600">-${store.formatCurrency(res.marginFee)}</span>
                </div>
              </div>

              <!-- Final Payout Box -->
              <div class="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                  Net Buyback Payout / Trade Credit
                </span>
                <div class="font-serif-luxury text-3xl font-bold gold-gradient-text mt-1">
                  ${store.formatCurrency(res.netCreditValue)}
                </div>
                <span class="text-[10px] text-stone-500 mt-1 block">Valid for today's market fixing</span>
              </div>
            </div>

            <div class="mt-6 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center text-[11px] text-stone-400">
              <span>Appraiser: M. D'or Certified Assayer</span>
              <span>BIS Touch #8892</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Listeners for melt calculator inputs
    const grossInput = document.getElementById("melt-gross");
    if (grossInput) {
      grossInput.oninput = (e) => {
        window.meltCalcState.grossWeight = Number(e.target.value) || 0;
        renderMeltCalculator();
      };
    }
    const deductInput = document.getElementById("melt-deduct");
    if (deductInput) {
      deductInput.oninput = (e) => {
        window.meltCalcState.stoneDeduction = Number(e.target.value) || 0;
        renderMeltCalculator();
      };
    }
    const karatInput = document.getElementById("melt-karat");
    if (karatInput) {
      karatInput.onchange = (e) => {
        window.meltCalcState.karat = e.target.value;
        renderMeltCalculator();
      };
    }
    const marginInput = document.getElementById("melt-margin");
    if (marginInput) {
      marginInput.oninput = (e) => {
        window.meltCalcState.refiningMargin = Number(e.target.value) || 0;
        renderMeltCalculator();
      };
    }

    document.getElementById("melt-apply-to-pos")?.addEventListener("click", () => {
      store.setTradeIn({
        description: `Customer Scrap Gold (${store.formatWeight(res.netWeight)} net)`,
        grossWeight: res.grossWeight,
        stoneDeduction: res.stoneDeduction,
        karat: window.meltCalcState.karat,
        refiningMarginPct: window.meltCalcState.refiningMargin,
        applied: true
      });
      showToast("Scrap gold valuation pushed to active POS bill!");
      switchTab("billing");
    });
  }

  // =========================================================================
  // VIEW: BESPOKE WORKSHOP / KARIGAR (ARTISAN PIPELINE)
  // =========================================================================
  function renderWorkshop() {
    const s = store.getState();
    const container = document.getElementById("view-workshop");
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-serif-luxury text-3xl font-semibold text-stone-900 dark:text-stone-50">
              Artisan Workshop & Bespoke Orders
            </h1>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Tracking custom orders, metal issuance, CAD designs, and master karigar workflows
            </p>
          </div>
          <button id="workshop-new-order-btn" class="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider gold-gradient-bg shadow-sm">
            + New Custom Commission
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${s.customOrders.map(order => {
            const isReady = order.stage === "Ready";
            return `
              <div class="card-luxury p-5 flex flex-col justify-between border-t-2 ${isReady ? 'border-emerald-500' : 'border-amber-600'}">
                <div>
                  <div class="flex items-center justify-between text-[11px] mb-2">
                    <span class="font-mono text-amber-800 dark:text-amber-400 font-bold">${order.id}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${isReady ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800' : 'bg-amber-100 dark:bg-amber-950 text-amber-800'}">
                      ${order.stage}
                    </span>
                  </div>

                  <h3 class="font-serif-luxury text-lg font-semibold text-stone-900 dark:text-stone-100">
                    ${order.title}
                  </h3>
                  <div class="text-xs font-medium text-stone-600 dark:text-stone-300 mt-1">
                    Client: ${order.clientName}
                  </div>

                  <p class="text-xs text-stone-500 dark:text-stone-400 mt-2 bg-stone-50 dark:bg-stone-900 p-2.5 rounded border border-stone-200/60 dark:border-stone-800">
                    "${order.notes}"
                  </p>

                  <div class="mt-4 space-y-2 text-xs">
                    <div class="flex justify-between text-stone-500">
                      <span>Metal Issued:</span>
                      <span class="font-medium text-stone-900 dark:text-stone-100">${order.metalType} (~${order.estimatedNetWeight}g)</span>
                    </div>
                    <div class="flex justify-between text-stone-500">
                      <span>Master Artisan:</span>
                      <span class="font-medium text-stone-900 dark:text-stone-100">${order.assignedArtisan}</span>
                    </div>
                    <div class="flex justify-between text-stone-500">
                      <span>Promised Handover:</span>
                      <span class="font-semibold text-amber-800 dark:text-amber-400">${order.dueDate}</span>
                    </div>
                  </div>

                  <!-- Progress Meter -->
                  <div class="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div class="flex justify-between text-[10px] font-semibold text-stone-500 mb-1">
                      <span>Craft Progress</span>
                      <span>${order.progress}%</span>
                    </div>
                    <div class="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div class="bg-amber-500 h-full rounded-full transition-all duration-300" style="width: ${order.progress}%"></div>
                    </div>
                  </div>
                </div>

                <!-- Financial Balance & Action -->
                <div class="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-stone-400 uppercase block">Deposit / Total</span>
                    <span class="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                      ${store.formatCurrency(order.depositPaid)} / ${store.formatCurrency(order.estimatedTotal)}
                    </span>
                  </div>

                  ${isReady ? `
                    <span class="text-xs font-bold text-emerald-600">Ready in Safe</span>
                  ` : `
                    <button data-advance-order="${order.id}" class="px-3 py-1.5 rounded text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition">
                      Next Stage →
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    document.getElementById("workshop-new-order-btn")?.addEventListener("click", openNewOrderModal);

    container.querySelectorAll("[data-advance-order]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-advance-order");
        store.advanceCustomOrder(id);
        showToast("Workshop commission stage advanced!");
        renderWorkshop();
      });
    });
  }

  // =========================================================================
  // VIEW: VIP CLIENTELE
  // =========================================================================
  function renderClients() {
    const s = store.getState();
    const container = document.getElementById("view-clients");
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-serif-luxury text-3xl font-semibold text-stone-900 dark:text-stone-50">
              VIP Patrons & Clientele Registry
            </h1>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Private registry, size preferences, anniversaries, and bespoke purchase histories
            </p>
          </div>
          <button id="add-client-btn" class="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider gold-gradient-bg shadow-sm">
            + Register VIP Client
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${s.clients.map(client => `
            <div class="card-luxury p-5 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    ${client.tier}
                  </span>
                  <span class="text-xs text-stone-400">Last visited: ${client.lastVisit}</span>
                </div>

                <div class="mt-3">
                  <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">
                    ${client.name}
                  </h3>
                  <div class="text-xs text-stone-500 mt-0.5">
                    ${client.phone} • ${client.email}
                  </div>
                  <div class="text-xs text-stone-400 mt-0.5">
                    ${client.address}
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900 text-xs">
                  <div>
                    <span class="text-stone-400 text-[10px] uppercase block">Ring / Wrist Size</span>
                    <span class="font-semibold text-stone-800 dark:text-stone-200">${client.ringSize}</span>
                  </div>
                  <div>
                    <span class="text-stone-400 text-[10px] uppercase block">Anniversary / Milestone</span>
                    <span class="font-semibold text-amber-800 dark:text-amber-400">${client.anniversary}</span>
                  </div>
                </div>

                <div class="mt-3 text-xs">
                  <span class="text-stone-400 text-[10px] uppercase block">Curated Taste / Preferences</span>
                  <p class="text-stone-600 dark:text-stone-300 mt-0.5 italic">"${client.preferences}"</p>
                </div>
              </div>

              <div class="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <div>
                  <span class="text-stone-400 text-[10px] uppercase block">Lifetime Value</span>
                  <span class="font-serif-luxury text-lg font-bold gold-gradient-text">${store.formatCurrency(client.lifetimeSpend)}</span>
                </div>
                <button data-select-client="${client.id}" class="px-3 py-1.5 rounded text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition">
                  Load to Billing POS
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("add-client-btn")?.addEventListener("click", openAddClientModal);

    container.querySelectorAll("[data-select-client]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-select-client");
        const found = s.clients.find(c => c.id === id);
        if (found) {
          store.setCustomer(found);
          showToast(`Client ${found.name} loaded to POS`);
          switchTab("billing");
        }
      });
    });
  }

  // =========================================================================
  // VIEW: REPORTS & RECONCILIATION
  // =========================================================================
  function renderReports() {
    const s = store.getState();
    const container = document.getElementById("view-reports");
    if (!container) return;

    let totalSoldVal = 0;
    let totalTradeInCreditGiven = 0;
    s.recentSales.forEach(sale => {
      totalSoldVal += Number(sale.netPaid || 0);
      totalTradeInCreditGiven += Number(sale.tradeInCredit || 0);
    });

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 class="font-serif-luxury text-3xl font-semibold text-stone-900 dark:text-stone-50">
            Daily Financial & Metal Ledger Audit
          </h1>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Certified accounting reconciliation for tax authorities and BIS hallmarking compliance
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="card-luxury p-5">
            <span class="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Sales Settled</span>
            <div class="font-serif-luxury text-3xl font-bold text-stone-900 dark:text-stone-50 mt-1">
              ${store.formatCurrency(totalSoldVal)}
            </div>
            <span class="text-xs text-stone-400 mt-1 block">In current session</span>
          </div>

          <div class="card-luxury p-5">
            <span class="text-xs font-semibold text-stone-500 uppercase tracking-wider">Old Gold Trade Credits</span>
            <div class="font-serif-luxury text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              ${store.formatCurrency(totalTradeInCreditGiven)}
            </div>
            <span class="text-xs text-stone-400 mt-1 block">Scrap received in vault</span>
          </div>

          <div class="card-luxury p-5">
            <span class="text-xs font-semibold text-stone-500 uppercase tracking-wider">Sales Tax Collected</span>
            <div class="font-serif-luxury text-3xl font-bold text-stone-900 dark:text-stone-50 mt-1">
              ${store.formatCurrency(totalSoldVal * 0.03)}
            </div>
            <span class="text-xs text-stone-400 mt-1 block">Accrued 3% VAT / GST</span>
          </div>
        </div>

        <div class="card-luxury p-6">
          <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50 border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            Physical Vault Metal Reconciliation
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800">
              <span class="font-semibold text-stone-900 dark:text-stone-100 block mb-2">Gold Balancing Checklist</span>
              <ul class="space-y-1.5 text-stone-600 dark:text-stone-400">
                <li class="flex justify-between"><span>Morning Opening Pure Gold:</span> <span class="font-mono">4,850.200 g</span></li>
                <li class="flex justify-between"><span>Metal Sold Today:</span> <span class="font-mono text-rose-600">-64.140 g</span></li>
                <li class="flex justify-between"><span>Scrap Gold Received in Exchange:</span> <span class="font-mono text-emerald-600">+34.500 g</span></li>
                <li class="flex justify-between font-bold pt-1 border-t border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100">
                  <span>Current Physical Vault Balance:</span> <span class="font-mono">4,820.560 g</span>
                </li>
              </ul>
            </div>

            <div class="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800">
              <span class="font-semibold text-stone-900 dark:text-stone-100 block mb-2">Hallmark & Security Audit</span>
              <ul class="space-y-1.5 text-stone-600 dark:text-stone-400">
                <li class="flex justify-between"><span>BIS Hallmark License:</span> <span class="font-mono text-amber-800 dark:text-amber-400">${s.settings.hallmarkLicense}</span></li>
                <li class="flex justify-between"><span>Laser XRF Purity Tester:</span> <span class="text-emerald-600 font-semibold">Calibrated OK</span></li>
                <li class="flex justify-between"><span>Safe Alpha Combination Lock:</span> <span>Active & Armed</span></li>
                <li class="flex justify-between"><span>Next External Audit Date:</span> <span>30-Nov-2026</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: SETTINGS
  // =========================================================================
  function renderSettings() {
    const s = store.getState();
    const container = document.getElementById("view-settings");
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 class="font-serif-luxury text-3xl font-semibold text-stone-900 dark:text-stone-50">
            Maison Configuration & Preferences
          </h1>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Store identity, tax registration, hallmark credentials, and data backup
          </p>
        </div>

        <div class="card-luxury p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Maison / House Name</label>
              <input id="set-shop-name" type="text" value="${s.settings.shopName}" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
            </div>
            <div>
              <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Tagline</label>
              <input id="set-tagline" type="text" value="${s.settings.tagline}" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
            </div>
            <div class="sm:col-span-2">
              <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Salon Address</label>
              <input id="set-address" type="text" value="${s.settings.address}" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
            </div>
            <div>
              <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Tax Registration Number</label>
              <input id="set-tax-number" type="text" value="${s.settings.taxNumber}" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
            </div>
            <div>
              <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Hallmark Certification License</label>
              <input id="set-hallmark" type="text" value="${s.settings.hallmarkLicense}" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
            </div>
            <div>
              <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Jewelry Sales Tax / GST Rate (%)</label>
              <input id="set-tax-rate" type="number" step="0.5" value="${s.settings.taxRate}" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
            </div>
          </div>

          <div class="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
            <button id="set-save-btn" class="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider gold-gradient-bg shadow-sm">
              Save Maison Settings
            </button>
            <button id="set-reset-defaults-btn" class="text-xs text-rose-600 hover:underline">
              Reset Demo Catalog & Rates
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("set-save-btn")?.addEventListener("click", () => {
      store.updateSettings({
        shopName: document.getElementById("set-shop-name").value,
        tagline: document.getElementById("set-tagline").value,
        address: document.getElementById("set-address").value,
        taxNumber: document.getElementById("set-tax-number").value,
        hallmarkLicense: document.getElementById("set-hallmark").value,
        taxRate: Number(document.getElementById("set-tax-rate").value) || 3.0
      });
      showToast("Maison settings saved successfully");
    });

    document.getElementById("set-reset-defaults-btn")?.addEventListener("click", () => {
      if (confirm("Reset all inventory, sales, and rates to original boutique sample data?")) {
        store.resetToDefaults();
        showToast("Restored initial demo dataset");
        renderAll();
      }
    });
  }

  // =========================================================================
  // MODALS: RATES, ADD PIECE, INVOICE, SPECS, CUSTOMER
  // =========================================================================

  // Rates Modal
  function openRatesModal() {
    const s = store.getState();
    const modal = document.getElementById("modal-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="modal-content-anim card-luxury w-full max-w-lg p-6 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-2xl relative">
          <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">Fixing Adjustment</span>
              <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">Today's Bullion Market Rates</h3>
            </div>
            <button id="close-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">✕</button>
          </div>

          <p class="text-xs text-stone-500 mb-4">
            Updating base bullion rates immediately re-evaluates all catalog valuation figures and billing calculations.
          </p>

          <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
            ${Object.entries(s.metalRates).map(([k, item]) => `
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 text-xs">
                <div>
                  <div class="font-semibold text-stone-900 dark:text-stone-100">${item.name}</div>
                  <div class="text-[10px] text-stone-400">Purity: ${item.purity}</div>
                </div>
                <div class="flex items-center gap-1.5 font-mono">
                  <span class="text-stone-400">$</span>
                  <input data-rate-key="${k}" type="number" step="0.10" value="${item.pricePerGram}"
                    class="w-24 px-2 py-1 text-xs font-mono font-bold text-right rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none">
                  <span class="text-stone-400 text-[10px]">/g</span>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="mt-6 pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
            <button id="cancel-rates-btn" class="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">Cancel</button>
            <button id="save-rates-btn" class="px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider gold-gradient-bg shadow-sm">Save & Reprice Vault</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);
    document.getElementById("cancel-rates-btn")?.addEventListener("click", closeModal);

    document.getElementById("save-rates-btn")?.addEventListener("click", () => {
      const updated = {};
      modal.querySelectorAll("[data-rate-key]").forEach(input => {
        const k = input.getAttribute("data-rate-key");
        updated[k] = Number(input.value);
      });
      store.updateMetalRates(updated);
      closeModal();
      showToast("Market fixing rates updated! Catalog repriced.");
    });
  }

  // Add Piece Modal
  function openAddPieceModal() {
    const s = store.getState();
    const modal = document.getElementById("modal-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="modal-content-anim card-luxury w-full max-w-2xl p-6 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">Vault Ingestion</span>
              <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">Register New Ornament / Piece</h3>
            </div>
            <button id="close-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900">✕</button>
          </div>

          <form id="add-piece-form" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Piece Title / Nomenclature *</label>
                <input required id="p-title" type="text" placeholder="e.g. Celestial Marquise Diamond Drop Earrings" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none">
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Category *</label>
                <select id="p-cat" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                  <option value="Rings">Rings</option>
                  <option value="Necklaces">Necklaces</option>
                  <option value="Bangles & Bracelets">Bangles & Bracelets</option>
                  <option value="Earrings">Earrings</option>
                  <option value="Pendants">Pendants</option>
                  <option value="Bullion & Coins">Bullion & Coins</option>
                  <option value="High Horology">High Horology</option>
                </select>
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Metal & Purity *</label>
                <select id="p-purity" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                  <option value="gold_18k">18K Yellow Gold (75.0%)</option>
                  <option value="gold_22k">22K Sovereign Hallmark (91.6%)</option>
                  <option value="gold_24k">24K Fine Gold (99.9%)</option>
                  <option value="gold_14k">14K Rose/White Gold (58.5%)</option>
                  <option value="plat_950">Platinum 950</option>
                  <option value="silver_925">Sterling Silver 925</option>
                </select>
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Gross Scale Weight (g) *</label>
                <input required id="p-gross" type="number" step="0.001" placeholder="0.000" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Stone / Enamel Weight (g)</label>
                <input id="p-stone-wt" type="number" step="0.001" placeholder="0.000" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
              </div>

              <div class="sm:col-span-2">
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Gemstones Description & Clarity</label>
                <input id="p-stone-desc" type="text" placeholder="e.g. 1.50ct F-VVS2 Center Diamond + 0.35ct Baguettes" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Stone / Diamond Value ($)</label>
                <input id="p-stone-val" type="number" step="1.0" placeholder="0.00" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Making Charge ($)</label>
                <div class="flex gap-2">
                  <input id="p-mc-val" type="number" step="1.0" placeholder="Amount" class="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                  <select id="p-mc-type" class="px-2 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
                    <option value="flat">Flat</option>
                    <option value="per_gram">/ Gram</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Hallmark / GIA ID</label>
                <input id="p-hallmark" type="text" placeholder="e.g. BIS-HM-916049 or GIA-99201" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
              </div>

              <div>
                <label class="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Vault / Showcase Location</label>
                <input id="p-location" type="text" placeholder="e.g. Tray A-02 or Safe Safe Beta" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
              </div>
            </div>

            <div class="mt-6 pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
              <button type="button" id="cancel-add-btn" class="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider gold-gradient-bg shadow-sm">Ingest into Inventory</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);
    document.getElementById("cancel-add-btn")?.addEventListener("click", closeModal);

    document.getElementById("add-piece-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("p-title").value;
      const category = document.getElementById("p-cat").value;
      const purityKey = document.getElementById("p-purity").value;
      const grossWeight = Number(document.getElementById("p-gross").value) || 0;
      const stoneWeight = Number(document.getElementById("p-stone-wt").value) || 0;
      const stoneType = document.getElementById("p-stone-desc").value || "Fine Gems";
      const stonePrice = Number(document.getElementById("p-stone-val").value) || 0;
      const makingChargeValue = Number(document.getElementById("p-mc-val").value) || 0;
      const makingChargeType = document.getElementById("p-mc-type").value;
      const hallmarkId = document.getElementById("p-hallmark").value;
      const location = document.getElementById("p-location").value || "Vault Safe Alpha";

      const metalName = s.metalRates[purityKey]?.name || "18K Gold";

      store.addItem({
        title,
        category,
        metal: metalName,
        purityKey,
        grossWeight,
        stoneWeight,
        stoneType,
        stonePrice,
        makingChargeType,
        makingChargeValue,
        hallmarkId,
        location,
        status: "available"
      });

      closeModal();
      showToast(`Piece "${title}" added to inventory`);
    });
  }

  // Invoice & Certificate Modal
  function openInvoiceModal(invoice) {
    const s = store.getState();
    const modal = document.getElementById("modal-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="modal-content-anim card-luxury w-full max-w-3xl p-8 bg-white text-stone-900 border border-stone-200 shadow-2xl rounded-2xl relative max-h-[92vh] overflow-y-auto">
          <!-- Action buttons (hidden on print) -->
          <div class="no-print flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
            <span class="text-xs font-semibold text-stone-500 uppercase tracking-wider">Official Certificate & Tax Invoice</span>
            <div class="flex items-center gap-2">
              <button id="print-invoice-btn" class="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-stone-900 text-white hover:bg-stone-800 transition">
                🖨 Print Invoice (A4)
              </button>
              <button id="close-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900">✕</button>
            </div>
          </div>

          <!-- Printable Area -->
          <div id="invoice-print-area" class="space-y-6">
            <!-- Boutique Emblem Header -->
            <div class="text-center border-b border-stone-200 pb-5">
              <div class="text-xl tracking-[0.3em] font-serif-luxury uppercase font-bold text-stone-950">${s.settings.shopName}</div>
              <div class="text-[10px] tracking-widest uppercase text-amber-800 font-semibold mt-1">${s.settings.tagline}</div>
              <div class="text-[11px] text-stone-500 mt-1">${s.settings.address} • Tel: ${s.settings.phone}</div>
              <div class="text-[10px] text-stone-400 mt-0.5">Govt Tax ID: ${s.settings.taxNumber} • Hallmark Lic: ${s.settings.hallmarkLicense}</div>
            </div>

            <!-- Invoice & Client Meta -->
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-[10px] text-stone-400 uppercase tracking-wider block">Billed To (Client):</span>
                <div class="font-bold text-stone-900 text-sm mt-0.5">${invoice.client}</div>
                <div class="text-stone-500">${invoice.clientPhone || ''}</div>
                <div class="text-stone-500">${invoice.clientAddress || 'Private VIP Patron'}</div>
              </div>

              <div class="text-right">
                <span class="text-[10px] text-stone-400 uppercase tracking-wider block">Invoice Reference:</span>
                <div class="font-mono font-bold text-stone-900 text-sm mt-0.5">${invoice.invoiceId}</div>
                <div class="text-stone-500">Date: ${invoice.date} ${invoice.timestamp || ''}</div>
                <div class="text-stone-500">Payment: <span class="font-medium text-stone-800">${invoice.paymentMethod}</span></div>
              </div>
            </div>

            <!-- Items Table -->
            <table class="w-full text-left text-xs invoice-table">
              <thead>
                <tr class="border-b-2 border-stone-800 text-[10px] uppercase tracking-wider text-stone-600 bg-stone-50">
                  <th class="py-2 px-2">Ornament Description</th>
                  <th class="py-2 px-2">Hallmark ID</th>
                  <th class="py-2 px-2 text-right">Gross Wt</th>
                  <th class="py-2 px-2 text-right">Net Wt</th>
                  <th class="py-2 px-2 text-right">Base Metal</th>
                  <th class="py-2 px-2 text-right">Making</th>
                  <th class="py-2 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200">
                ${(invoice.items || []).map(itm => `
                  <tr>
                    <td class="py-2.5 px-2">
                      <div class="font-bold text-stone-900">${itm.title}</div>
                      <div class="text-[10px] text-stone-500">${itm.purity} • ${itm.stoneType}</div>
                    </td>
                    <td class="py-2.5 px-2 font-mono text-[10px]">${itm.hallmarkId}</td>
                    <td class="py-2.5 px-2 text-right font-mono">${store.formatWeight(itm.grossWeight)}</td>
                    <td class="py-2.5 px-2 text-right font-mono font-semibold">${store.formatWeight(itm.netWeight)}</td>
                    <td class="py-2.5 px-2 text-right font-mono">${store.formatCurrency(itm.pricing?.baseMetalCost)}</td>
                    <td class="py-2.5 px-2 text-right font-mono">${store.formatCurrency(itm.pricing?.makingCharge)}</td>
                    <td class="py-2.5 px-2 text-right font-mono font-bold">${store.formatCurrency(itm.pricing?.subtotal)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <!-- Financials Summary -->
            <div class="flex justify-end pt-3">
              <div class="w-72 space-y-2 text-xs">
                <div class="flex justify-between text-stone-600">
                  <span>Gross Ornament Total:</span>
                  <span class="font-mono">${store.formatCurrency(invoice.subtotal || invoice.grossTotal)}</span>
                </div>
                <div class="flex justify-between text-stone-600">
                  <span>Precious Metal Tax (3%):</span>
                  <span class="font-mono">${store.formatCurrency(invoice.tax || 0)}</span>
                </div>
                ${invoice.tradeInCredit > 0 ? `
                  <div class="flex justify-between font-semibold text-emerald-800">
                    <span>Old Gold Exchange Credit:</span>
                    <span class="font-mono">-${store.formatCurrency(invoice.tradeInCredit)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between items-baseline pt-2 border-t-2 border-stone-900 text-sm font-bold text-stone-900">
                  <span class="font-serif-luxury text-base">Net Paid Total:</span>
                  <span class="font-serif-luxury text-xl">${store.formatCurrency(invoice.netPaid)}</span>
                </div>
              </div>
            </div>

            <!-- Authentic Hallmark & Certification Guarantee Declaration -->
            <div class="pt-5 border-t border-stone-200 text-[10px] text-stone-500 space-y-1 leading-relaxed">
              <div class="font-semibold text-stone-700 uppercase tracking-wider">BIS & GIA Purity Guarantee Declaration:</div>
              <p>
                We hereby certify that the precious metals and gemstones described herein comply strictly with international hallmarking standards (BIS 916 / PT-950). All natural diamonds are guaranteed conflict-free and verified under the Kimberley Process.
              </p>
              <div class="pt-6 flex justify-between items-end text-stone-600">
                <div>
                  <div class="w-32 border-b border-stone-400 mb-1"></div>
                  <span>Authorized Signature & Seal</span>
                </div>
                <div class="text-right">
                  <div class="w-32 border-b border-stone-400 mb-1 ml-auto"></div>
                  <span>Client Acknowledgment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);
    document.getElementById("print-invoice-btn")?.addEventListener("click", () => {
      window.print();
    });
  }

  // Item Specs Modal
  function openItemSpecsModal(item) {
    const pricing = store.calculateItemPrice(item);
    const modal = document.getElementById("modal-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="modal-content-anim card-luxury w-full max-w-xl p-6 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-2xl relative">
          <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 font-mono">${item.sku}</span>
              <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">${item.title}</h3>
            </div>
            <button id="close-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900">✕</button>
          </div>

          <div class="space-y-4 text-xs">
            <img src="${item.image}" alt="${item.title}" class="w-full h-52 object-cover rounded-xl bg-stone-100">

            <p class="text-stone-600 dark:text-stone-300 leading-relaxed italic">
              "${item.description}"
            </p>

            <div class="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
              <div>
                <span class="text-stone-400 text-[10px] uppercase block">Metal & Karatage</span>
                <span class="font-bold text-stone-900 dark:text-stone-100">${item.metal}</span>
              </div>
              <div>
                <span class="text-stone-400 text-[10px] uppercase block">Hallmark Certificate</span>
                <span class="font-mono font-semibold text-amber-800 dark:text-amber-400">${item.hallmarkId}</span>
              </div>
              <div>
                <span class="text-stone-400 text-[10px] uppercase block">Gross Weight</span>
                <span class="font-mono text-stone-900 dark:text-stone-100">${store.formatWeight(item.grossWeight)}</span>
              </div>
              <div>
                <span class="text-stone-400 text-[10px] uppercase block">Net Pure Metal</span>
                <span class="font-mono font-bold text-stone-900 dark:text-stone-100">${store.formatWeight(item.netWeight)}</span>
              </div>
              <div class="col-span-2">
                <span class="text-stone-400 text-[10px] uppercase block">Precious Stones & Diamonds</span>
                <span class="font-semibold text-stone-900 dark:text-stone-100">${item.stoneType}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
              <div>
                <span class="text-[10px] text-stone-400 uppercase block">Live Dynamic Price</span>
                <span class="font-serif-luxury text-2xl font-bold gold-gradient-text">${store.formatCurrency(pricing.subtotal)}</span>
              </div>

              ${item.status === 'sold' ? `
                <span class="text-stone-400 text-xs">Sold</span>
              ` : `
                <button id="modal-add-to-cart-btn" class="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider gold-gradient-bg shadow-sm">
                  + Add to Active Bill
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);
    document.getElementById("modal-add-to-cart-btn")?.addEventListener("click", () => {
      store.addToCart(item.id);
      closeModal();
      showToast("Added to active POS bill!");
    });
  }

  // Select Customer Modal
  function openSelectCustomerModal() {
    const s = store.getState();
    const modal = document.getElementById("modal-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="modal-content-anim card-luxury w-full max-w-md p-6 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-2xl relative">
          <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">Select Client Profile</h3>
            <button id="close-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900">✕</button>
          </div>

          <div class="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            <div data-select-cust="walkin" class="p-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-amber-600 cursor-pointer">
              <div class="font-bold text-stone-900 dark:text-stone-100">Walk-in Guest Patron</div>
              <div class="text-stone-400 text-[11px]">Standard counter walk-in sale</div>
            </div>

            ${s.clients.map(c => `
              <div data-select-cust="${c.id}" class="p-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-amber-600 cursor-pointer">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-stone-900 dark:text-stone-100">${c.name}</span>
                  <span class="px-2 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800">${c.tier}</span>
                </div>
                <div class="text-stone-400 text-[11px] mt-0.5">${c.phone} • Spend: ${store.formatCurrency(c.lifetimeSpend)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);

    modal.querySelectorAll("[data-select-cust]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-select-cust");
        if (id === "walkin") {
          store.setCustomer({
            name: "Walk-in Guest",
            phone: "+1 (555) 000-0000",
            email: "client@private.guest",
            tier: "Guest",
            taxId: ""
          });
        } else {
          const found = s.clients.find(c => c.id === id);
          if (found) store.setCustomer(found);
        }
        closeModal();
        renderBilling();
        showToast("Customer profile updated");
      });
    });
  }

  // Add VIP Client Modal
  function openAddClientModal() {
    const modal = document.getElementById("modal-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="modal-content-anim card-luxury w-full max-w-md p-6 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-2xl relative">
          <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">Register New VIP Client</h3>
            <button id="close-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900">✕</button>
          </div>

          <form id="add-client-form" class="space-y-3 text-xs">
            <div>
              <label class="font-semibold block mb-1">Full Name *</label>
              <input required id="c-name" type="text" placeholder="e.g. Lady Genevieve Hawthorne" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none">
            </div>
            <div>
              <label class="font-semibold block mb-1">VIP Tier</label>
              <select id="c-tier" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
                <option value="VIP Elite">VIP Elite</option>
                <option value="Connoisseur">Connoisseur</option>
                <option value="Patron">Patron</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-semibold block mb-1">Phone</label>
                <input id="c-phone" type="text" placeholder="+1 (212) 555-0122" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
              </div>
              <div>
                <label class="font-semibold block mb-1">Email</label>
                <input id="c-email" type="email" placeholder="client@domain.com" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-semibold block mb-1">Ring Size</label>
                <input id="c-ring" type="text" placeholder="6.5" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
              </div>
              <div>
                <label class="font-semibold block mb-1">Anniversary</label>
                <input id="c-anniv" type="text" placeholder="Nov 18" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
              </div>
            </div>
            <div>
              <label class="font-semibold block mb-1">Tastes & Gemstone Preferences</label>
              <input id="c-pref" type="text" placeholder="e.g. Unheated Burma rubies, yellow gold, vintage Art Deco" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
            </div>

            <div class="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
              <button type="button" id="cancel-client-btn" class="px-4 py-2 text-stone-500">Cancel</button>
              <button type="submit" class="px-4 py-2 rounded-lg gold-gradient-bg uppercase font-semibold">Save Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);
    document.getElementById("cancel-client-btn")?.addEventListener("click", closeModal);

    document.getElementById("add-client-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      store.addClient({
        name: document.getElementById("c-name").value,
        tier: document.getElementById("c-tier").value,
        phone: document.getElementById("c-phone").value,
        email: document.getElementById("c-email").value,
        ringSize: document.getElementById("c-ring").value,
        anniversary: document.getElementById("c-anniv").value,
        preferences: document.getElementById("c-pref").value
      });
      closeModal();
      showToast("VIP Client registered!");
      renderClients();
    });
  }

  // New Custom Order Modal
  function openNewOrderModal() {
    const modal = document.getElementById("modal-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="modal-content-anim card-luxury w-full max-w-md p-6 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-2xl relative">
          <div class="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
            <h3 class="font-serif-luxury text-xl font-semibold text-stone-900 dark:text-stone-50">New Bespoke Commission</h3>
            <button id="close-modal-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900">✕</button>
          </div>

          <form id="new-order-form" class="space-y-3 text-xs">
            <div>
              <label class="font-semibold block mb-1">Client Name *</label>
              <input required id="ord-client" type="text" placeholder="e.g. Eleanor Vance" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
            </div>
            <div>
              <label class="font-semibold block mb-1">Piece Title / Design Description *</label>
              <input required id="ord-title" type="text" placeholder="e.g. Heirloom Diamond Reset in Platinum" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-semibold block mb-1">Metal to Issue</label>
                <select id="ord-metal" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
                  <option value="18K Yellow Gold">18K Yellow Gold</option>
                  <option value="22K Sovereign Gold (916)">22K Sovereign (916)</option>
                  <option value="Platinum 950">Platinum 950</option>
                  <option value="18K White Gold">18K White Gold</option>
                </select>
              </div>
              <div>
                <label class="font-semibold block mb-1">Estimated Wt (g)</label>
                <input id="ord-wt" type="number" step="0.1" value="15.0" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-semibold block mb-1">Deposit Paid ($)</label>
                <input id="ord-deposit" type="number" step="50" placeholder="2000" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
              </div>
              <div>
                <label class="font-semibold block mb-1">Promised Date</label>
                <input id="ord-date" type="date" value="2026-12-15" class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
              </div>
            </div>
            <div>
              <label class="font-semibold block mb-1">Special Artisan Directives</label>
              <textarea id="ord-notes" rows="2" placeholder="Heirloom stone provided by client, high-polish finish..." class="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"></textarea>
            </div>

            <div class="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
              <button type="button" id="cancel-ord-btn" class="px-4 py-2 text-stone-500">Cancel</button>
              <button type="submit" class="px-4 py-2 rounded-lg gold-gradient-bg uppercase font-semibold">Issue Commission</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);
    document.getElementById("cancel-ord-btn")?.addEventListener("click", closeModal);

    document.getElementById("new-order-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      store.addCustomOrder({
        clientName: document.getElementById("ord-client").value,
        title: document.getElementById("ord-title").value,
        metalType: document.getElementById("ord-metal").value,
        estimatedNetWeight: Number(document.getElementById("ord-wt").value) || 12.0,
        depositPaid: Number(document.getElementById("ord-deposit").value) || 0,
        estimatedTotal: (Number(document.getElementById("ord-deposit").value) || 0) * 2,
        dueDate: document.getElementById("ord-date").value,
        notes: document.getElementById("ord-notes").value
      });
      closeModal();
      showToast("New bespoke commission issued to workshop!");
      renderWorkshop();
    });
  }

  function closeModal() {
    const modal = document.getElementById("modal-container");
    if (modal) modal.innerHTML = "";
  }

  // Expose App Controller
  window.JewelryApp = {
    init,
    switchTab,
    showToast
  };

  // Launch on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
