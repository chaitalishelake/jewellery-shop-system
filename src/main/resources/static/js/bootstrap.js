/**
 * Loads the saved state from MySQL before the UI starts.
 * The existing frontend is then loaded in its original order.
 */
(async function () {
  const status = document.getElementById("backend-status");
  try {
    const response = await fetch("/api/state");
    if (!response.ok) throw new Error("API returned " + response.status);
    const savedState = await response.json();
    if (savedState) {
      localStorage.setItem("MAISONDOR_JEWELRY_STORE_V1", JSON.stringify(savedState));
    }
    if (status) status.textContent = "Connected · MySQL database";
  } catch (error) {
    console.error("Could not load saved data from MySQL:", error);
    if (status) status.textContent = "Backend unavailable · start the Java server";
  }

  for (const source of ["js/data.js", "js/store.js", "js/app.js"]) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = source;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load " + source));
      document.body.appendChild(script);
    });
  }
})();
