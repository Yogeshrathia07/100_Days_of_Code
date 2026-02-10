// ==========================================================
//                LEETCODE DASHBOARD SCRIPT
// ==========================================================
// This file is responsible for:
// 1) Fetching LeetCode user data from backend (/leetcode/:username)
// 2) Rendering progress chart (Easy/Medium/Hard)
// 3) Rendering badges
// 4) Rendering heatmap calendar
// 5) Using LocalStorage cache to reduce API calls
// ==========================================================


// ==========================================================
//                CACHE CONFIGURATION
// ==========================================================

// Cache expiry time (example: 6 hours)
const CACHE_EXPIRY_TIME = 6 * 60 * 60 * 1000; // 6 hours



// ==========================================================
//                FETCH LEETCODE DATA
// ==========================================================

async function fetchLeetcodeData(username) {
  const status = document.getElementById("status");

  // -------------------- Step 1: Load Cached Data --------------------
  const cachedData = loadLeetcodeCache(username);

  if (cachedData) {
    console.log("✅ Loaded LeetCode data from cache");
    updateLeetcodeUI(cachedData);

    if (status) status.innerText = "Loaded from cache ✅";
  }

  // -------------------- Step 2: Fetch Latest Data from Backend --------------------
  try {
    if (status) status.innerText = "Fetching latest data...";

    const res = await fetch(`/leetcode/${username}`);
    const data = await res.json();

    if (data.error) {
      if (status) status.innerText = "User not found!";
      return;
    }

    // -------------------- Step 3: Update UI with Fresh Data --------------------
    updateLeetcodeUI(data);

    // -------------------- Step 4: Save Fresh Data to Cache --------------------
    saveLeetcodeCache(username, data);

    if (status) status.innerText = "";
    console.log("🔥 Fetched fresh LeetCode data & updated cache");

  } catch (err) {
    console.log("❌ Error fetching LeetCode data:", err);

    if (status) status.innerText = "Backend not running!";
  }
}



// ==========================================================
//                PROGRESS CHART (DOUGHNUT)
// ==========================================================

let currentChart = null;

function showLeetStats(stats) {
  const easy = stats.acSubmissionNum.find((s) => s.difficulty === "Easy");
  const med = stats.acSubmissionNum.find((s) => s.difficulty === "Medium");
  const hard = stats.acSubmissionNum.find((s) => s.difficulty === "Hard");

  // If chart elements are not present, stop
  if (
    !document.getElementById("easy") ||
    !document.getElementById("medium") ||
    !document.getElementById("hard") ||
    !document.getElementById("totalSolved") ||
    !document.getElementById("progressChart")
  ) {
    return;
  }

  // Update numbers
  document.getElementById("easy").innerText = easy.count;
  document.getElementById("medium").innerText = med.count;
  document.getElementById("hard").innerText = hard.count;

  const total = easy.count + med.count + hard.count;
  document.getElementById("totalSolved").innerText = total;

  // Destroy old chart if already exists
  if (currentChart) currentChart.destroy();

  const ctx = document.getElementById("progressChart");

  // Create new chart
  currentChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [
        {
          data: [easy.count, med.count, hard.count],
          backgroundColor: ["#00B8A3", "#FFC01E", "#EF4743"],
          borderWidth: 0,
          spacing: 3,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "95%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
    },
  });
}



// ==========================================================
//                BADGES SECTION
// ==========================================================

function showBadges(badges) {
  const div = document.getElementById("badgeSection");
  const badgeCount = document.getElementById("badgeCount");
  const recentBadge = document.getElementById("recentBadge");

  // If badge UI not present, stop
  if (!div || !badgeCount || !recentBadge) return;

  div.innerHTML = "";
  badgeCount.innerText = badges.length;

  // If no badges
  if (badges.length === 0) {
    div.innerHTML = `
      <div class="badge-icon">
          <div class="badge-empty"></div>
      </div>
    `;
    recentBadge.innerText = "No badges yet";
    return;
  }

  // Show only first 3 badges
  badges.slice(0, 3).forEach((badge) => {
    const badgeIcon = document.createElement("div");
    badgeIcon.className = "badge-icon";

    if (badge.icon) {
      badgeIcon.innerHTML = `
        <img src="${badge.icon}" alt="${badge.displayName}" title="${badge.displayName}">
      `;
    } else {
      badgeIcon.innerHTML = `<div class="badge-empty"></div>`;
    }

    div.appendChild(badgeIcon);
  });

  // Most recent badge
  recentBadge.innerText = badges[0].displayName;
}



// ==========================================================
//                HEATMAP FUNCTIONS (NEW SYSTEM)
// ==========================================================

function getLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

// ================= TOOLTIP FUNCTIONS =================
function showTooltip(event, dayData) {
  const tooltip = document.getElementById("heatmapTooltip");
  if (!tooltip) return;

  const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
  const dateStr = dayData.date.toLocaleDateString("en-US", options);

  let countText;
  if (dayData.count === 0) {
    countText = "No submissions";
  } else if (dayData.count === 1) {
    countText = "<strong>1</strong> submission";
  } else {
    countText = `<strong>${dayData.count}</strong> submissions`;
  }

  tooltip.innerHTML = `
    <div class="tooltip-date">${dateStr}</div>
    <div class="tooltip-count">${countText}</div>
  `;

  tooltip.classList.add("show");

  const x = event.clientX;
  const y = event.clientY;
  const windowWidth = window.innerWidth;

  const tooltipRect = tooltip.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width || 200;
  const tooltipHeight = tooltipRect.height || 60;

  let left, top;

  if (x < windowWidth / 3) {
    left = x + 15;
  } else if (x > (windowWidth * 2) / 3) {
    left = x - tooltipWidth - 15;
  } else {
    left = x + 15;
  }

  top = y - tooltipHeight - 10;

  if (left + tooltipWidth > windowWidth - 10) {
    left = windowWidth - tooltipWidth - 10;
  }

  if (left < 10) {
    left = 10;
  }

  if (top < 10) {
    top = y + 15;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById("heatmapTooltip");
  if (tooltip) {
    tooltip.classList.remove("show");
  }
}


// ================= MAIN HEATMAP GENERATION =================
function generateHeatmap(calendar) {

  const monthsContainer = document.getElementById("monthsContainer");
  const dayLabelsContainer = document.getElementById("dayLabels");

  // If heatmap containers missing, stop
  if (!monthsContainer || !dayLabelsContainer) return;

  // Clear old
  monthsContainer.innerHTML = "";
  dayLabelsContainer.innerHTML = "";

  // Day labels (Sun-Sat)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  days.forEach((d) => {
    const div = document.createElement("div");
    div.textContent = d;
    dayLabelsContainer.appendChild(div);
  });

  // LeetCode API returns submissionCalendar as JSON string
  const data = calendar.submissionCalendar
    ? JSON.parse(calendar.submissionCalendar)
    : {};

  // Update stats
  const activeDaysEl = document.getElementById("activeDaysText");
  const streakEl = document.getElementById("streakText");
  const submissionEl = document.getElementById("submissionText");

  if (activeDaysEl) activeDaysEl.innerText = calendar.totalActiveDays || 0;
  if (streakEl) streakEl.innerText = calendar.streak || 0;

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (submissionEl) {
    submissionEl.innerText = `${total.toLocaleString()} submissions in the past one year`;
  }

  // Date range (past 365 days)
  const now = new Date();
  const endUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startUTC = new Date(endUTC);
  startUTC.setUTCDate(endUTC.getUTCDate() - 364);

  // Align start to Sunday
  const alignedStart = new Date(startUTC);
  alignedStart.setUTCDate(startUTC.getUTCDate() - startUTC.getUTCDay());

  // Extend end to complete last week
  const endDate = new Date(endUTC);
  endDate.setUTCDate(endUTC.getUTCDate() + 6);

  // Group days month-wise
  const monthsData = {};
  let currentDate = new Date(alignedStart);

  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth()).padStart(2, "0")}`;
    const monthName = currentDate.toLocaleString("default", { month: "short" });

    if (!monthsData[monthKey]) {
      monthsData[monthKey] = {
        name: monthName,
        days: []
      };
    }

    const timestamp = Math.floor(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      ) / 1000
    );

    const count = data[timestamp] || 0;

    const isInRange = currentDate >= startUTC && currentDate <= endUTC;

    monthsData[monthKey].days.push({
      date: new Date(currentDate),
      count,
      timestamp,
      isInRange,
      dayOfWeek: currentDate.getUTCDay()
    });

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // Render month blocks
  Object.values(monthsData).forEach((monthData) => {

    const monthBlock = document.createElement("div");
    monthBlock.className = "month-block";

    // Month Header
    const monthHeader = document.createElement("div");
    monthHeader.className = "month-header";

    // Show month name only if good start
    const firstDay = monthData.days[0];
    if (firstDay && (firstDay.dayOfWeek === 0 || monthData.days.length > 20)) {
      monthHeader.textContent = monthData.name;
    } else {
      monthHeader.textContent = "";
    }

    monthBlock.appendChild(monthHeader);

    // Month Grid
    const monthGrid = document.createElement("div");
    monthGrid.className = "month-grid";

    // Add day squares
    monthData.days.forEach((dayData) => {
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";

      if (dayData.isInRange) {
        const level = getLevel(dayData.count);
        if (level > 0) {
          dayDiv.classList.add(`level-${level}`);
        }
      } else {
        dayDiv.style.opacity = "0.3";
      }

      // Tooltip events
      dayDiv.addEventListener("mouseenter", (e) => showTooltip(e, dayData));
      dayDiv.addEventListener("mouseleave", hideTooltip);

      monthGrid.appendChild(dayDiv);
    });

    monthBlock.appendChild(monthGrid);
    monthsContainer.appendChild(monthBlock);
  });
}



// ==========================================================
//                LOCAL STORAGE CACHE FUNCTIONS
// ==========================================================

function saveLeetcodeCache(username, data) {
  localStorage.setItem(
    `leetcode-cache-${username}`,
    JSON.stringify({
      savedAt: Date.now(),
      data: data,
    })
  );
}

function loadLeetcodeCache(username) {
  const cached = localStorage.getItem(`leetcode-cache-${username}`);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached);

    // Check expiry
    const cacheAge = Date.now() - parsed.savedAt;
    if (cacheAge > CACHE_EXPIRY_TIME) {
      console.log("⚠ Cache expired. Fetching fresh data...");
      return null;
    }

    return parsed.data;

  } catch (err) {
    return null;
  }
}



// ==========================================================
//                UPDATE UI FUNCTION
// ==========================================================
// This function updates ONLY those components which exist on the page.
// That means same leetcode.js can be used on multiple pages safely.

function updateLeetcodeUI(data) {

  const avatar = document.getElementById("leetcodeAvatar");
  const displayName = document.getElementById("leetcodeDisplayName");
  const uname = document.getElementById("leetcodeUsername");

  if (avatar) {
    avatar.src = data.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    avatar.onerror = function () {
      this.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    };
  }

  if (displayName) {
    displayName.innerText = data.realName || data.username || "LeetCode User";
  }

  if (uname) {
    uname.innerText = "@" + (data.username || "username");
  }

  // chart
  if (document.getElementById("progressChart")) {
    showLeetStats(data.submitStats);
  }

  // badges
  if (document.getElementById("badgeSection")) {
    showBadges(data.badges);
  }

  // heatmap (NEW IDs)
  if (document.getElementById("monthsContainer")) {
    generateHeatmap(data.calendar);
  }
}



// ==========================================================
//                PAGE DETECTION (AUTO FETCH)
// ==========================================================
// This makes leetcode.js run on ANY page automatically if LeetCode UI exists.

window.addEventListener("DOMContentLoaded", () => {

  const hasLeetUI =
    document.getElementById("leetcodeAvatar") ||
    document.getElementById("progressChart") ||
    document.getElementById("monthsContainer") ||
    document.getElementById("badgeSection");

  if (hasLeetUI) {
    if (
      typeof savedLeetcodeId !== "undefined" &&
      savedLeetcodeId &&
      savedLeetcodeId !== "null" &&
      savedLeetcodeId !== "undefined"
    ) {
      fetchLeetcodeData(savedLeetcodeId);
    } else {
      const status = document.getElementById("status");
      if (status) status.innerText = "No LeetCode ID found!";
    }
  }

});
