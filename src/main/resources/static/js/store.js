/**
 * Maison D'or - Luxury Jewelry Shop Management System
 * Core State Engine & Business Calculations
 */

(function () {
  const STORAGE_KEY = "MAISONDOR_JEWELRY_STORE_V1";

  // Helper to load or initialize state
  function loadInitialState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all keys exist
        return {
          settings: { ...window.JEWELRY_INITIAL_DATA.settings, ...(parsed.settings || {}) },
          metalRates: { ...window.JEWELRY_INITIAL_DATA.metalRates, ...(parsed.metalRates || {}) },
          currencies: window.JEWELRY_INITIAL_DATA.currencies,
          inventory: parsed.inventory || window.JEWELRY_INITIAL_DATA.inventory,
          clients: parsed.clients || window.JEWELRY_INITIAL_DATA.clients,
          customOrders: parsed.customOrders || window.JEWELRY_INITIAL_DATA.customOrders,
          recentSales: parsed.recentSales || window.JEWELRY_INITIAL_DATA.recentSales,
          cart: parsed.cart || [],
          activeCustomer: parsed.activeCustomer || {
            name: "Walk-in Guest",
            phone: "+1 (555) 000-0000",
            email: "client@private.guest",
            tier: "Guest",
            taxId: ""
          },
          tradeIn: parsed.tradeIn || {
            description: "",
            grossWeight: 0,
            stoneDeduction: 0,
            karat: "gold_18k",
            refiningMarginPct: 2.0, // 2% standard melt deduction
            applied: false
          }
        };
      }
    } catch (e) {
      console.warn("Could not load from localStorage, falling back to initial data.", e);
    }
    return JSON.parse(JSON.stringify(window.JEWELRY_INITIAL_DATA));
  }

  const state = loadInitialState();
  if (!state.cart) state.cart = [];
  if (!state.activeCustomer) {
    state.activeCustomer = {
      name: "Walk-in Guest",
      phone: "+1 (555) 000-0000",
      email: "client@private.guest",
      tier: "Guest",
      taxId: ""
    };
  }
  if (!state.tradeIn) {
    state.tradeIn = {
      description: "",
      grossWeight: 0,
      stoneDeduction: 0,
      karat: "gold_18k",
      refiningMarginPct: 2.0,
      applied: false
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
    // Save the complete application state to the Java + MySQL backend.
    // Local storage is kept as a browser cache for a responsive interface.
    fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    }).then((response) => {
      if (!response.ok) throw new Error("Backend save failed");
      const status = document.getElementById("backend-status");
      if (status) status.textContent = "Connected · MySQL database";
    }).catch((error) => {
      console.warn("Could not save to MySQL. Browser cache is retained.", error);
      const status = document.getElementById("backend-status");
      if (status) status.textContent = "Backend disconnected · changes cached in browser";
    });

    // Trigger listeners
    window.dispatchEvent(new CustomEvent("jewelry-state-updated"));
  }

  // Currency Formatter
  function formatCurrency(amountInUSD, overrideCurrency) {
    const currKey = overrideCurrency || state.settings.currency || "USD";
    const curr = state.currencies[currKey] || state.currencies.USD;
    const converted = (amountInUSD || 0) * curr.rate;
    
    // Format nicely
    if (currKey === "INR") {
      return curr.symbol + converted.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }
    return curr.symbol + converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Weight Formatter
  function formatWeight(grams, decimals = 3) {
    return Number(grams || 0).toFixed(decimals) + " g";
  }

  // Pricing Calculation Engine for Ornaments
  function calculateItemPrice(item) {
    if (!item) return { baseMetalCost: 0, makingCharge: 0, stoneCost: 0, subtotal: 0, tax: 0, grandTotal: 0 };
    
    const rateObj = state.metalRates[item.purityKey] || { pricePerGram: 0 };
    const netWt = Number(item.netWeight || (item.grossWeight - (item.stoneWeight || 0)));
    const baseMetalCost = netWt * rateObj.pricePerGram;
    
    let makingCharge = 0;
    if (item.makingChargeType === "per_gram") {
      makingCharge = (Number(item.makingChargeValue) || 0) * netWt;
    } else {
      makingCharge = Number(item.makingChargeValue) || 0;
    }

    const stoneCost = Number(item.stonePrice) || 0;
    const subtotal = baseMetalCost + makingCharge + stoneCost;
    const tax = subtotal * ((state.settings.taxRate || 3.0) / 100);
    const grandTotal = subtotal + tax;

    return {
      ratePerGram: rateObj.pricePerGram,
      purityName: rateObj.name,
      netWeight: netWt,
      baseMetalCost,
      makingCharge,
      stoneCost,
      subtotal,
      tax,
      grandTotal
    };
  }

  // Old Gold / Scrap Trade-in Valuation
  function calculateOldGoldValuation(grossWeight, stoneDeduction, purityKey, refiningMarginPct = 2.0) {
    const gross = Math.max(0, Number(grossWeight) || 0);
    const stone = Math.max(0, Number(stoneDeduction) || 0);
    const netPureEst = Math.max(0, gross - stone);
    const rateObj = state.metalRates[purityKey] || { pricePerGram: 0 };
    
    const meltGrossValue = netPureEst * rateObj.pricePerGram;
    const marginFee = meltGrossValue * (Number(refiningMarginPct) / 100);
    const netCreditValue = Math.max(0, meltGrossValue - marginFee);

    return {
      grossWeight: gross,
      stoneDeduction: stone,
      netWeight: netPureEst,
      ratePerGram: rateObj.pricePerGram,
      purityName: rateObj.name,
      meltGrossValue,
      marginFee,
      netCreditValue
    };
  }

  // Public Store API
  window.JewelryStore = {
    getState: () => state,

    formatCurrency,
    formatWeight,
    calculateItemPrice,
    calculateOldGoldValuation,

    // Settings
    updateSettings: (newSettings) => {
      state.settings = { ...state.settings, ...newSettings };
      saveState();
    },

    setCurrency: (currCode) => {
      if (state.currencies[currCode]) {
        state.settings.currency = currCode;
        saveState();
      }
    },

    // Metal Rates
    updateMetalRates: (updatedRates) => {
      for (const [key, val] of Object.entries(updatedRates)) {
        if (state.metalRates[key]) {
          state.metalRates[key].pricePerGram = Number(val);
        }
      }
      const now = new Date();
      state.settings.lastRatesUpdated = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      saveState();
    },

    // Inventory
    addItem: (item) => {
      const id = "JWL-" + Math.floor(1000 + Math.random() * 9000);
      const gross = Number(item.grossWeight) || 0;
      const stone = Number(item.stoneWeight) || 0;
      const net = gross - stone > 0 ? Number((gross - stone).toFixed(3)) : gross;

      const newItem = {
        id,
        sku: item.sku || `AUR-${item.category.substring(0,2).toUpperCase()}-${Math.floor(100+Math.random()*900)}`,
        title: item.title,
        category: item.category || "Rings",
        metal: item.metal || "18K Yellow Gold",
        purityKey: item.purityKey || "gold_18k",
        grossWeight: gross,
        stoneWeight: stone,
        netWeight: net,
        stoneType: item.stoneType || "Natural Precious Gemstones",
        stonePrice: Number(item.stonePrice) || 0,
        makingChargeType: item.makingChargeType || "flat",
        makingChargeValue: Number(item.makingChargeValue) || 0,
        hallmarkId: item.hallmarkId || `BIS-HM-${Math.floor(100000+Math.random()*900000)}`,
        location: item.location || "Vault Safe Alpha",
        status: item.status || "available",
        image: item.image || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80",
        description: item.description || "Fine handcrafted jewelry piece certified under Maison D'or quality standards."
      };
      state.inventory.unshift(newItem);
      saveState();
      return newItem;
    },

    updateItem: (id, updatedFields) => {
      const idx = state.inventory.findIndex(i => i.id === id);
      if (idx !== -1) {
        state.inventory[idx] = { ...state.inventory[idx], ...updatedFields };
        if (updatedFields.grossWeight !== undefined || updatedFields.stoneWeight !== undefined) {
          const gross = Number(state.inventory[idx].grossWeight) || 0;
          const stone = Number(state.inventory[idx].stoneWeight) || 0;
          state.inventory[idx].netWeight = Number((gross - stone).toFixed(3));
        }
        saveState();
      }
    },

    deleteItem: (id) => {
      state.inventory = state.inventory.filter(i => i.id !== id);
      saveState();
    },

    // Cart / Billing Terminal
    addToCart: (itemId) => {
      const item = state.inventory.find(i => i.id === itemId);
      if (!item) return false;

      const exists = state.cart.find(c => c.id === itemId);
      if (exists) {
        return false; // Unique jewelry pieces typically have quantity 1
      }

      state.cart.push({
        ...item,
        pricing: calculateItemPrice(item)
      });
      saveState();
      return true;
    },

    removeFromCart: (itemId) => {
      state.cart = state.cart.filter(c => c.id !== itemId);
      saveState();
    },

    clearCart: () => {
      state.cart = [];
      state.tradeIn.applied = false;
      saveState();
    },

    setCustomer: (customer) => {
      state.activeCustomer = customer;
      saveState();
    },

    setTradeIn: (tradeInData) => {
      state.tradeIn = { ...state.tradeIn, ...tradeInData };
      saveState();
    },

    calculateCartTotals: () => {
      let itemsSubtotal = 0;
      let totalNetWeight = 0;
      let totalGrossWeight = 0;
      let totalMakingCharges = 0;
      let totalStoneValue = 0;

      state.cart.forEach(c => {
        const p = calculateItemPrice(c);
        itemsSubtotal += p.subtotal;
        totalNetWeight += p.netWeight;
        totalGrossWeight += Number(c.grossWeight || 0);
        totalMakingCharges += p.makingCharge;
        totalStoneValue += p.stoneCost;
      });

      // Trade in deduction
      let tradeInCredit = 0;
      if (state.tradeIn && state.tradeIn.applied && state.tradeIn.grossWeight > 0) {
        const val = calculateOldGoldValuation(
          state.tradeIn.grossWeight,
          state.tradeIn.stoneDeduction,
          state.tradeIn.karat,
          state.tradeIn.refiningMarginPct
        );
        tradeInCredit = val.netCreditValue;
      }

      const taxableBase = Math.max(0, itemsSubtotal);
      const taxRate = state.settings.taxRate || 3.0;
      const tax = taxableBase * (taxRate / 100);
      const grandTotalBeforeTradeIn = taxableBase + tax;
      const finalPayable = Math.max(0, grandTotalBeforeTradeIn - tradeInCredit);

      return {
        itemsCount: state.cart.length,
        itemsSubtotal,
        totalNetWeight,
        totalGrossWeight,
        totalMakingCharges,
        totalStoneValue,
        taxRate,
        tax,
        grandTotalBeforeTradeIn,
        tradeInCredit,
        finalPayable
      };
    },

    completeCheckout: (paymentDetails) => {
      if (state.cart.length === 0) return null;

      const totals = window.JewelryStore.calculateCartTotals();
      const invoiceId = "INV-2026-" + Math.floor(1000 + Math.random() * 9000);
      const saleDate = new Date().toISOString().split("T")[0];

      // Mark inventory items as sold
      const soldItemIds = state.cart.map(c => c.id);
      state.inventory.forEach(item => {
        if (soldItemIds.includes(item.id)) {
          item.status = "sold";
          item.soldDate = saleDate;
          item.soldInvoice = invoiceId;
        }
      });

      const invoiceRecord = {
        invoiceId,
        date: saleDate,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        client: state.activeCustomer.name,
        clientPhone: state.activeCustomer.phone,
        clientEmail: state.activeCustomer.email,
        clientAddress: state.activeCustomer.address || "Counter Sale",
        taxId: state.activeCustomer.taxId || "N/A",
        items: state.cart.map(item => ({
          id: item.id,
          sku: item.sku,
          title: item.title,
          metal: item.metal,
          purity: state.metalRates[item.purityKey]?.name || item.metal,
          grossWeight: item.grossWeight,
          netWeight: item.netWeight,
          stoneType: item.stoneType,
          hallmarkId: item.hallmarkId,
          pricing: calculateItemPrice(item)
        })),
        itemSummary: state.cart.map(c => c.title).join(", "),
        subtotal: totals.itemsSubtotal,
        tax: totals.tax,
        grossTotal: totals.grandTotalBeforeTradeIn,
        tradeInCredit: totals.tradeInCredit,
        tradeInDetails: totals.tradeInCredit > 0 ? { ...state.tradeIn } : null,
        netPaid: totals.finalPayable,
        paymentMethod: paymentDetails?.method || "Centurion Card",
        status: "Completed",
        cashier: "M. D'or Concierge Desk"
      };

      state.recentSales.unshift(invoiceRecord);

      // Update client's lifetime spend if matched
      const clientIdx = state.clients.findIndex(c => c.name.toLowerCase() === state.activeCustomer.name.toLowerCase());
      if (clientIdx !== -1) {
        state.clients[clientIdx].lifetimeSpend = (state.clients[clientIdx].lifetimeSpend || 0) + totals.finalPayable;
        state.clients[clientIdx].lastVisit = "Today";
      }

      // Reset cart and trade in
      state.cart = [];
      state.tradeIn = {
        description: "",
        grossWeight: 0,
        stoneDeduction: 0,
        karat: "gold_18k",
        refiningMarginPct: 2.0,
        applied: false
      };

      saveState();
      return invoiceRecord;
    },

    // Custom Orders / Workshop
    addCustomOrder: (order) => {
      const id = "ORD-2026-" + Math.floor(100 + Math.random() * 900);
      const newOrder = {
        id,
        clientName: order.clientName,
        clientId: order.clientId || "CLT-WALK",
        title: order.title,
        metalType: order.metalType || "18K Yellow Gold",
        estimatedNetWeight: Number(order.estimatedNetWeight) || 10.0,
        assignedArtisan: order.assignedArtisan || "Master Goldsmith Henri Laurent",
        stage: "Design CAD",
        progress: 20,
        stagesList: ["Design CAD", "Metal Cast", "Stone Setting", "Hallmarking", "Ready"],
        dueDate: order.dueDate || "2026-12-15",
        depositPaid: Number(order.depositPaid) || 0,
        estimatedTotal: Number(order.estimatedTotal) || 0,
        notes: order.notes || ""
      };
      state.customOrders.unshift(newOrder);
      saveState();
      return newOrder;
    },

    advanceCustomOrder: (orderId) => {
      const ord = state.customOrders.find(o => o.id === orderId);
      if (!ord) return;
      const currentIdx = ord.stagesList.indexOf(ord.stage);
      if (currentIdx !== -1 && currentIdx < ord.stagesList.length - 1) {
        ord.stage = ord.stagesList[currentIdx + 1];
        ord.progress = Math.min(100, Math.round(((currentIdx + 2) / ord.stagesList.length) * 100));
        saveState();
      }
    },

    // Clients
    addClient: (client) => {
      const id = "CLT-" + Math.floor(10 + Math.random() * 90);
      const newClient = {
        id,
        name: client.name,
        tier: client.tier || "Connoisseur",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        ringSize: client.ringSize || "6.0",
        anniversary: client.anniversary || "Not specified",
        preferences: client.preferences || "High jewelry, 18K gold",
        lifetimeSpend: 0,
        lastVisit: "First Visit"
      };
      state.clients.unshift(newClient);
      saveState();
      return newClient;
    },

    // Reset to demo defaults
    resetToDefaults: () => {
      localStorage.removeItem(STORAGE_KEY);
      const fresh = JSON.parse(JSON.stringify(window.JEWELRY_INITIAL_DATA));
      Object.assign(state, fresh);
      state.cart = [];
      saveState();
    }
  };
})();
