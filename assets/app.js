(function () {
  const savedKey = "stevens-amsterdam-saved-v1";
  const state = {
    saved: readSaved(),
    placeCategory: "all",
    placeArea: "all",
    eventPriority: "all",
    eventDate: "all",
    eventPeriod: "all",
    eventArea: "all",
    eventType: "all",
    eventAudience: "all",
    eventConfidence: "all",
    eventScoreMin: null,
    eventSearch: "",
    eventShowAll: false,
    events: []
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    setupIcons();
    setupMenu();
    updateSavedCount();
    setupSavedToggle();

    if (document.body.dataset.page === "city") {
      setupCityDirectory();
    }

    if (document.body.dataset.page === "event") {
      setupEventEdition();
    }
  }

  function setupIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setupMenu() {
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("mobile-menu");
    if (!menuToggle || !menu) return;

    menuToggle.addEventListener("click", () => {
      const open = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
      setupIcons();
    });

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    function closeMenu() {
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.innerHTML = '<i data-lucide="menu"></i>';
      setupIcons();
    }
  }

  function setupSavedToggle() {
    const toggle = document.getElementById("saved-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      if (document.body.dataset.page === "city") {
        state.placeCategory = "saved";
        document.getElementById("neighborhood-filter").value = "all";
        state.placeArea = "all";
        document.querySelectorAll("[data-filter]").forEach((button) => {
          setButtonActive(button, button.dataset.filter === "saved");
        });
        renderPlaces();
        document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
      }

      if (document.body.dataset.page === "event") {
        state.eventPriority = "saved";
        document.querySelectorAll("[data-event-priority]").forEach((button) => {
          setButtonActive(button, button.dataset.eventPriority === "saved");
        });
        resetEventLimit();
        renderEvents();
        document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  function setupCityDirectory() {
    const places = window.CITY_PLACES || [];
    const areaSelect = document.getElementById("neighborhood-filter");
    const categoryButtons = document.querySelectorAll("[data-filter]");
    const clearButton = document.getElementById("clear-place-filters");

    populateSelect(areaSelect, uniqueValues(places.map((place) => place.area)), "All Amsterdam");

    areaSelect.addEventListener("change", () => {
      state.placeArea = areaSelect.value;
      renderPlaces();
    });

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.placeCategory = button.dataset.filter;
        categoryButtons.forEach((item) => setButtonActive(item, item === button));
        renderPlaces();
      });
    });

    clearButton.addEventListener("click", () => {
      state.placeArea = "all";
      state.placeCategory = "all";
      areaSelect.value = "all";
      categoryButtons.forEach((button) => setButtonActive(button, button.dataset.filter === "all"));
      renderPlaces();
    });

    renderPlaces();
  }

  function renderPlaces() {
    const grid = document.getElementById("place-grid");
    const empty = document.getElementById("place-empty");
    const results = document.getElementById("place-results");
    if (!grid) return;

    const places = (window.CITY_PLACES || []).filter((place) => {
      const areaMatch = state.placeArea === "all" || place.area === state.placeArea;
      const categoryMatch = state.placeCategory === "all" || (
        state.placeCategory === "saved" ? isSaved(place.id) : place.categories.includes(state.placeCategory)
      );
      return areaMatch && categoryMatch;
    });

    grid.innerHTML = places.map(placeCard).join("");
    empty.hidden = places.length > 0;
    results.textContent = `${places.length} ${places.length === 1 ? "place" : "places"}`;
    bindSaveButtons(grid);
    setupIcons();
  }

  function placeCard(place) {
    const saved = isSaved(place.id);
    const categories = place.categories.map((category) => `<span class="pill">${labelFor(category)}</span>`).join("");
    const mapUrl = place.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query || `${place.name} Amsterdam`)}`;
    const extraLink = place.infoUrl ? `<a class="mini-link" href="${escapeHtml(place.infoUrl)}" target="_blank" rel="noreferrer">${escapeHtml(place.infoLabel || "Info")}</a>` : "";
    return `
      <article class="place-card">
        <div class="place-meta">
          <span class="pill blue">${escapeHtml(place.area)}</span>
          <span class="pill yellow">${escapeHtml(place.type)}</span>
        </div>
        <h3>${escapeHtml(place.name)}</h3>
        <p>${escapeHtml(place.note)}</p>
        <div class="tag-row">${categories}</div>
        <div class="card-actions">
          <a class="mini-link" href="${mapUrl}" target="_blank" rel="noreferrer">Map</a>
          ${extraLink}
          <button class="icon-button save-button ${saved ? "is-saved" : ""}" type="button" title="${saved ? "Remove saved place" : "Save place"}" aria-label="${saved ? "Remove saved place" : "Save place"}" aria-pressed="${saved}" data-save-id="${escapeHtml(place.id)}">
            <i data-lucide="bookmark"></i>
          </button>
        </div>
      </article>
    `;
  }

  function setupEventEdition() {
    setEventAction();
    loadEvents();
    document.getElementById("event-date-filter")?.addEventListener("change", (event) => {
      state.eventDate = event.target.value;
      resetEventLimit();
      renderEvents();
    });
    document.getElementById("event-period-filter")?.addEventListener("change", (event) => {
      state.eventPeriod = event.target.value;
      resetEventLimit();
      renderEvents();
    });
    document.getElementById("event-area-filter")?.addEventListener("change", (event) => {
      state.eventArea = event.target.value;
      resetEventLimit();
      renderEvents();
    });
    document.getElementById("event-type-filter")?.addEventListener("change", (event) => {
      state.eventType = event.target.value;
      resetEventLimit();
      renderEvents();
    });
    document.getElementById("event-audience-filter")?.addEventListener("change", (event) => {
      state.eventAudience = event.target.value;
      resetEventLimit();
      renderEvents();
    });
    document.getElementById("event-confidence-filter")?.addEventListener("change", (event) => {
      state.eventConfidence = event.target.value;
      resetEventLimit();
      renderEvents();
    });
    document.getElementById("event-search")?.addEventListener("input", (event) => {
      state.eventSearch = event.target.value.trim().toLowerCase();
      resetEventLimit();
      renderEvents();
    });
    document.querySelectorAll("[data-event-priority]").forEach((button) => {
      button.addEventListener("click", () => {
        state.eventPriority = button.dataset.eventPriority;
        document.querySelectorAll("[data-event-priority]").forEach((item) => {
          setButtonActive(item, item === button);
        });
        resetEventLimit();
        renderEvents();
      });
    });
    document.querySelectorAll("[data-score-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextScore = Number(button.dataset.scoreFilter);
        state.eventScoreMin = state.eventScoreMin === nextScore ? null : nextScore;
        setButtonActive(button, state.eventScoreMin === nextScore);
        resetEventLimit();
        renderEvents();
      });
    });
    document.getElementById("show-all-events")?.addEventListener("click", () => {
      state.eventShowAll = !state.eventShowAll;
      renderEvents();
    });
    document.getElementById("clear-event-filters")?.addEventListener("click", () => {
      state.eventDate = "all";
      state.eventPeriod = "all";
      state.eventArea = "all";
      state.eventType = "all";
      state.eventAudience = "all";
      state.eventConfidence = "all";
      state.eventPriority = "all";
      state.eventScoreMin = null;
      state.eventSearch = "";
      resetEventLimit();
      ["event-date-filter", "event-period-filter", "event-area-filter", "event-type-filter", "event-audience-filter", "event-confidence-filter"].forEach((id) => {
        const select = document.getElementById(id);
        if (select) select.value = "all";
      });
      const search = document.getElementById("event-search");
      if (search) search.value = "";
      document.querySelectorAll("[data-event-priority]").forEach((button) => {
        setButtonActive(button, button.dataset.eventPriority === "all");
      });
      document.querySelectorAll("[data-score-filter]").forEach((button) => {
        setButtonActive(button, false);
      });
      renderEvents();
    });
  }

  async function loadEvents() {
    const url = document.body.dataset.eventsUrl;
    const results = document.getElementById("event-results");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${url}`);
      const csv = await response.text();
      state.events = parseCsv(csv).map(normalizeEvent);
      populateEventFilters();
      renderTopPicks();
      renderEvents();
    } catch (error) {
      if (results) results.textContent = "The event calendar could not load in this browser.";
      console.error(error);
    }
  }

  function populateEventFilters() {
    populateDateSelect(document.getElementById("event-date-filter"), state.events);
    populateSelect(document.getElementById("event-period-filter"), uniqueValues(state.events.map((event) => event.period)), "All periods");
    populateSelect(document.getElementById("event-area-filter"), uniqueValues(state.events.map((event) => event.area)), "All areas");
    populateSelect(document.getElementById("event-type-filter"), uniqueValues(state.events.map((event) => event.eventType)), "All event types");
    populateSelect(document.getElementById("event-audience-filter"), uniqueValues(state.events.map((event) => event.audience)), "All audiences");
    populateSelect(document.getElementById("event-confidence-filter"), uniqueValues(state.events.map((event) => event.confidenceLabel)), "All verification");
  }

  function renderTopPicks() {
    const grid = document.getElementById("event-picks");
    if (!grid) return;
    const pool = [...state.events].sort((a, b) => b.rating - a.rating);
    const groups = [
      { title: "Serious club nights", test: (event) => event.eventType === "Club night", limit: 4 },
      { title: "Joyful, social, and diasporic", test: (event) => ["Pop party", "Queer diaspora party", "Party", "Circuit party"].includes(event.eventType), limit: 2 },
      { title: "Culture and public Pride", test: (event) => ["Community / culture", "Public programme", "Performance", "Concert / festival"].includes(event.eventType), limit: 2 }
    ];
    grid.innerHTML = groups.map((group) => {
      const events = pool.filter(group.test).slice(0, group.limit);
      if (!events.length) return "";
      return `<section class="pick-group"><h3>${escapeHtml(group.title)}</h3><div class="card-grid event-grid">${events.map((event) => eventCard(event, true)).join("")}</div></section>`;
    }).join("");
    bindSaveButtons(grid);
    setupIcons();
  }

  function renderEvents() {
    const grid = document.getElementById("event-grid");
    const empty = document.getElementById("event-empty");
    const results = document.getElementById("event-results");
    const showAllButton = document.getElementById("show-all-events");
    if (!grid) return;

    const events = state.events.filter((event) => {
      const dateMatch = state.eventDate === "all" || (event.dateStart <= state.eventDate && event.dateEnd >= state.eventDate);
      const periodMatch = state.eventPeriod === "all" || event.period === state.eventPeriod;
      const areaMatch = state.eventArea === "all" || event.area === state.eventArea;
      const typeMatch = state.eventType === "all" || event.eventType === state.eventType;
      const audienceMatch = state.eventAudience === "all" || event.audience === state.eventAudience;
      const confidenceMatch = state.eventConfidence === "all" || event.confidenceLabel === state.eventConfidence;
      const scoreMatch = !state.eventScoreMin || event.rating >= state.eventScoreMin;
      const priorityMatch = state.eventPriority === "all" || (
        state.eventPriority === "saved" ? isSaved(event.id) : event.isSteven
      );
      const searchText = `${event.name} ${event.venue} ${event.area} ${event.eventType} ${event.audience}`.toLowerCase();
      const searchMatch = !state.eventSearch || searchText.includes(state.eventSearch);
      return dateMatch && periodMatch && areaMatch && typeMatch && audienceMatch && confidenceMatch && scoreMatch && priorityMatch && searchMatch;
    });

    const visibleEvents = state.eventShowAll ? events : events.slice(0, 12);
    grid.innerHTML = visibleEvents.map((event) => eventCard(event, false)).join("");
    empty.hidden = events.length > 0;
    if (results) results.textContent = `Showing ${visibleEvents.length} of ${events.length} matching events (${state.events.length} total)`;
    if (showAllButton) {
      showAllButton.hidden = events.length <= 12;
      showAllButton.textContent = state.eventShowAll ? "Show fewer events" : `Show all ${events.length} matching events`;
      showAllButton.setAttribute("aria-expanded", String(state.eventShowAll));
    }
    bindSaveButtons(grid);
    setupIcons();
  }

  function eventCard(event, compact) {
    const saved = isSaved(event.id);
    const confidenceClass = event.confidence === "High" ? "green" : "coral";
    const tba = [
      event.timeTba ? '<span class="pill coral">Time TBA</span>' : "",
      event.lineupTba ? '<span class="pill coral">Lineup TBA</span>' : "",
      event.venueTba ? '<span class="pill coral">Venue TBA</span>' : ""
    ].join("");
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} Amsterdam`)}`;
    const detailsLink = event.detailsUrl ? `<a class="mini-link" href="${escapeHtml(event.detailsUrl)}" target="_blank" rel="noreferrer">Details</a>` : "";
    const ticketLink = event.ticketUrl ? `<a class="mini-link" href="${escapeHtml(event.ticketUrl)}" target="_blank" rel="noreferrer">${escapeHtml(event.linkLabel)}</a>` : "";
    return `
      <article class="event-card">
        <div class="event-meta">
          <span class="pill blue">${escapeHtml(event.period)}</span>
          <span class="pill ${confidenceClass}">${escapeHtml(event.confidenceLabel)}</span>
          ${tba}
          ${event.rating ? `<span class="rating" title="Steven score">${event.rating.toFixed(1)}</span>` : ""}
        </div>
        <h3>${escapeHtml(event.name)}</h3>
        <p class="event-date">${escapeHtml(event.dateDisplay)}</p>
        <p>${escapeHtml(event.venue)} - ${escapeHtml(event.area)}</p>
        <p class="event-note">${escapeHtml(compact ? event.rationale : event.note)}</p>
        <div class="tag-row">
          <span class="pill yellow">${escapeHtml(event.eventType)}</span>
          <span class="pill">${escapeHtml(event.audience)}</span>
          ${event.isSteven ? '<span class="pill coral">Steven\'s pick</span>' : ""}
        </div>
        <div class="card-actions">
          ${ticketLink}
          ${detailsLink}
          <a class="mini-link" href="${mapUrl}" target="_blank" rel="noreferrer">Map</a>
          <button class="icon-button save-button ${saved ? "is-saved" : ""}" type="button" title="${saved ? "Remove saved event" : "Save event"}" aria-label="${saved ? "Remove saved event" : "Save event"}" aria-pressed="${saved}" data-save-id="${escapeHtml(event.id)}">
            <i data-lucide="bookmark"></i>
          </button>
        </div>
      </article>
    `;
  }

  function normalizeEvent(row, index) {
    const name = row.event_name || "Untitled event";
    const venue = row.venue || "Venue TBA";
    const confidence = row.source_confidence || "Unresolved";
    const dateDisplay = row.date_time_display || formatDateRange(row);
    const rating = Number.parseFloat(row.steven_rating_10 || "0") || 0;
    const id = `event-${slugify(name)}-${index}`;
    return {
      id,
      name,
      venue,
      dateStart: row.date_start || "9999-12-31",
      dateEnd: row.date_end || row.date_start || "9999-12-31",
      area: normalizeArea(row.neighborhood_area || venue),
      period: row.pride_segment || "Unsorted",
      eventType: row.event_type || row.category || "Uncategorized",
      audience: row.audience || "Mixed LGBTQ+ crowd",
      confidence,
      confidenceLabel: confidence === "High" ? "Verified" : "Check details",
      dateDisplay,
      rating,
      rationale: row.rating_rationale || row.notes || "A Pride-week event to consider if the timing, crowd, and venue fit the night.",
      note: row.notes || row.rating_rationale || "Open the event page before booking.",
      detailsUrl: row.details_url || "",
      ticketUrl: row.ticket_url || "",
      linkLabel: row.link_label || "Event / tickets",
      isSteven: String(row.steven_pick || "").toLowerCase() === "yes",
      timeTba: [row.time_start, row.time_end].some(isTba),
      lineupTba: isTba(row.lineup_djs_performers),
      venueTba: isTba(row.venue)
    };
  }

  function normalizeArea(value) {
    const area = value.toLowerCase();
    if (area.includes("noord")) return "Noord";
    if (area.includes("sloterdijk") || area.includes("west") || area.includes("westerpark") || area.includes("raum") || area.includes("lofi") || area.includes("tilla")) return "West / Westerpark";
    if (area.includes("radion") || area.includes("de baarsjes")) return "Oud-West / De Baarsjes";
    if (area.includes("oost")) return "Oost";
    if (area.includes("pijp")) return "De Pijp";
    if (area.includes("zuidoost") || area.includes("zuid-oost")) return "Zuidoost";
    if (area.includes("museum")) return "Museumplein";
    if (area.includes("centrum") || area.includes("leidseplein") || area.includes("central")) return "Centrum";
    if (area.includes("citywide") || area.includes("various")) return "Citywide";
    return value || "Amsterdam";
  }

  function formatDateRange(row) {
    const start = row.date_start || "Date TBA";
    const time = row.time_start ? ` ${row.time_start}` : "";
    return `${start}${time}`;
  }

  function setEventAction() {
    const title = document.getElementById("event-action-title");
    const copy = document.getElementById("event-action-copy");
    if (!title || !copy) return;
    const now = new Date();
    const year = now.getFullYear();
    const steps = [
      { date: new Date("2026-07-17T00:00:00"), title: "Book the scarce nights first", copy: "Start with RAUM, Tilla Tec, Lofi, and RADION tickets, then double-check times and lineups before you make plans." },
      { date: new Date("2026-07-25T00:00:00"), title: "Lock the opening weekend", copy: "Choose your 25 July opener and keep the official programme beside the party list for daytime plans." },
      { date: new Date("2026-07-31T00:00:00"), title: "Canal weekend logistics", copy: "Confirm street-party routes, late-night tickets, bike or tram plans, and where your group regroups after crowds split." },
      { date: new Date("2026-08-07T00:00:00"), title: "Choose the closing arc", copy: "The close is dense: compare Bashkka, Tilla Tec, IsBurning, GEGEN, and official closing plans before overcommitting." },
      { date: new Date("2026-08-09T00:00:00"), title: "After WorldPride", copy: "Keep using the city guide for neighborhoods, food, drinks, museums, parks, and calmer Amsterdam plans." }
    ];

    if (year !== 2026) return;

    const active = steps.reduce((current, step) => (now >= step.date ? step : current), steps[0]);
    title.textContent = active.title;
    copy.textContent = active.copy;
  }

  function bindSaveButtons(scope) {
    scope.querySelectorAll("[data-save-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.saveId;
        toggleSaved(id);
        button.classList.toggle("is-saved", isSaved(id));
        button.setAttribute("aria-pressed", String(isSaved(id)));
        button.setAttribute("title", isSaved(id) ? "Remove saved" : "Save");
        button.setAttribute("aria-label", isSaved(id) ? "Remove saved" : "Save");
        updateSavedCount();
        if (document.body.dataset.page === "city") renderPlaces();
        if (document.body.dataset.page === "event") {
          renderTopPicks();
          renderEvents();
        }
      });
    });
  }

  function readSaved() {
    try {
      return new Set(JSON.parse(localStorage.getItem(savedKey) || "[]"));
    } catch {
      return new Set();
    }
  }

  function persistSaved() {
    localStorage.setItem(savedKey, JSON.stringify([...state.saved]));
  }

  function isSaved(id) {
    return state.saved.has(id);
  }

  function toggleSaved(id) {
    if (state.saved.has(id)) {
      state.saved.delete(id);
      showToast("Removed from saved.");
    } else {
      state.saved.add(id);
      showToast("Saved.");
    }
    persistSaved();
  }

  function updateSavedCount() {
    const count = document.getElementById("saved-count");
    if (!count) return;
    const page = document.body.dataset.page;
    const pageCount = [...state.saved].filter((id) => page === "event" ? id.startsWith("event-") : !id.startsWith("event-")).length;
    count.textContent = String(pageCount);
  }

  function showToast(message) {
    document.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1500);
  }

  function populateSelect(select, values, firstLabel) {
    if (!select) return;
    const current = select.value || "all";
    select.innerHTML = `<option value="all">${escapeHtml(firstLabel)}</option>` + values
      .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
      .join("");
    select.value = values.includes(current) ? current : "all";
  }

  function populateDateSelect(select, events) {
    if (!select) return;
    const dates = new Set();
    events.forEach((event) => {
      if (!/^2026-\d{2}-\d{2}$/.test(event.dateStart) || !/^2026-\d{2}-\d{2}$/.test(event.dateEnd)) return;
      const cursor = new Date(`${event.dateStart}T12:00:00Z`);
      const end = new Date(`${event.dateEnd}T12:00:00Z`);
      while (cursor <= end) {
        dates.add(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    });
    const formatter = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
    select.innerHTML = '<option value="all">Any date</option>' + [...dates].sort().map((date) => {
      const label = formatter.format(new Date(`${date}T12:00:00Z`));
      return `<option value="${date}">${escapeHtml(label)}</option>`;
    }).join("");
  }

  function resetEventLimit() {
    state.eventShowAll = false;
  }

  function setButtonActive(button, active) {
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }

  function isTba(value) {
    return /\bTBA\b|not fully listed|not captured/i.test(String(value || ""));
  }

  function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }

    const headers = rows.shift() || [];
    return rows
      .filter((items) => items.some(Boolean))
      .map((items, rowIndex) => {
        if (items.length !== headers.length) {
          throw new Error(`CSV row ${rowIndex + 2} has ${items.length} fields; expected ${headers.length}.`);
        }
        return headers.reduce((record, header, index) => {
        record[header] = items[index] || "";
        return record;
        }, {});
      });
  }

  function labelFor(value) {
    const labels = {
      coffee: "Coffee",
      eat: "Food",
      wine: "Wine",
      drink: "Drinks",
      culture: "Culture",
      outside: "Outside",
      wellness: "Wellness",
      queer: "Queer",
      night: "Dance"
    };
    return labels[value] || value;
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
