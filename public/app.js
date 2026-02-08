// ====================== CONFIG ======================
const CONFIG = {
  startDate: "2025-02-01",
  unlockTime: "07:00",
};

// ====================== OPTIMIZATION ======================
let visibleCount = 20;
const loadMoreCount = 20;
let isLoadingMore = false;

// ====================== GLOBALS ======================
let challengeData = [];
let currentFilter = "all";
let completedDays = [];
let unlockedDays = 0;

// ====================== LOAD PROGRESS FROM DATABASE ======================
async function loadProgressFromDB() {
  try {
    const res = await fetch("/progress/get");
    const data = await res.json();

    if (data.success) {
      completedDays = data.challengeProgress.map((d) => d.day);
    } else {
      completedDays = [];
    }
  } catch (err) {
    console.log("Error loading progress from DB:", err);
    completedDays = [];
  }
}

// ====================== UNLOCK DAY LOGIC ======================
function getUnlockedDay() {
  const now = new Date();
  const start = new Date(CONFIG.startDate + "T" + CONFIG.unlockTime + ":00");

  if (now < start) return 0;

  const diffTime = now - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const todayUnlock = new Date();
  const [hours, minutes] = CONFIG.unlockTime.split(":");
  todayUnlock.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  if (now >= todayUnlock) return Math.min(diffDays + 1, 100);

  return Math.min(Math.max(0, diffDays), 100);
}

// ====================== STREAK LOGIC ======================
function calculateStreak() {
  if (completedDays.length === 0) return 0;

  const sortedCompleted = [...completedDays].sort((a, b) => b - a);
  let highestCompleted = sortedCompleted[0];
  let streak = 0;

  for (let day = highestCompleted; day >= 1; day--) {
    if (completedDays.includes(day)) streak++;
    else break;
  }

  return streak;
}

// ====================== TIMER ======================
function updateTimer() {
  const timerEl = document.getElementById("timerDisplay");
  if (!timerEl) return;

  const now = new Date();
  const [hours, minutes] = CONFIG.unlockTime.split(":");

  const nextUnlock = new Date();
  nextUnlock.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  if (now >= nextUnlock) nextUnlock.setDate(nextUnlock.getDate() + 1);

  const diff = nextUnlock - now;

  if (diff > 0) {
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}:${String(s).padStart(2, "0")}`;
  } else {
    timerEl.textContent = "00:00:00";
  }
}

// ====================== UPDATE STATS ======================
function updateStats() {
  const unlocked = getUnlockedDay();
  const completed = completedDays.length;
  const streak = calculateStreak();

  const totalDaysEl = document.getElementById("totalDays");
  const completedDaysEl = document.getElementById("completedDays");
  const streakDaysEl = document.getElementById("streakDays");

  if (totalDaysEl) totalDaysEl.textContent = unlocked;
  if (completedDaysEl) completedDaysEl.textContent = completed;
  if (streakDaysEl) streakDaysEl.textContent = streak;

  const progressCompletedDaysEl = document.getElementById("progressCompletedDays");
  const progressTotalDaysEl = document.getElementById("progressTotalDays");
  const progressFillEl = document.getElementById("progressFill");

  if (progressCompletedDaysEl) progressCompletedDaysEl.textContent = completed;
  if (progressTotalDaysEl) progressTotalDaysEl.textContent = unlocked;

  if (progressFillEl) {
    const progressPercent = unlocked > 0 ? (completed / unlocked) * 100 : 0;
    progressFillEl.style.width = progressPercent + "%";
  }
}

// ===================== MODAL VARIABLES =====================
let selectedDay = null;
let confirmText = "";

// ===================== OPEN MODAL =====================
function openCompleteModal(day) {
  selectedDay = day;
  confirmText = `Day ${day}`;

  const expectedTextEl = document.getElementById("expectedText");
  const inputEl = document.getElementById("modalInput");
  const modalEl = document.getElementById("completeModal");

  if (!expectedTextEl || !inputEl || !modalEl) return;

  expectedTextEl.innerText = confirmText;
  inputEl.value = "";
  modalEl.style.display = "flex";

  setTimeout(() => {
    inputEl.focus();
  }, 100);
}

// ===================== CLOSE COMPLETE MODAL =====================
function closeCompleteModal() {
  const modalEl = document.getElementById("completeModal");
  if (!modalEl) return;

  modalEl.style.display = "none";
  selectedDay = null;
  confirmText = "";
}

// ===================== CONFIRM COMPLETE =====================
async function confirmCompleteDay() {
  const inputEl = document.getElementById("modalInput");
  if (!inputEl) return;

  const input = inputEl.value.trim();

  if (input.toLowerCase() !== confirmText.toLowerCase()) {
    alert("❌ Incorrect text! Please type exactly.");
    return;
  }

  const dayToSend = selectedDay;
  closeCompleteModal();

  try {
    const res = await fetch("/progress/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: dayToSend }),
    });

    const data = await res.json();

    if (data.success) {
      completedDays = data.challengeProgress.map((d) => d.day);
      updateStats();
      renderDays();
    } else {
      alert("❌ Error saving progress!");
    }
  } catch (err) {
    console.log("Toggle error:", err);
    alert("❌ Backend not running!");
  }
}

// ===================== KEYBOARD EVENTS =====================
document.addEventListener("keydown", (e) => {
  const modalEl = document.getElementById("completeModal");
  if (!modalEl) return;

  if (e.key === "Enter" && modalEl.style.display === "flex") {
    confirmCompleteDay();
  }

  if (e.key === "Escape" && modalEl.style.display === "flex") {
    closeCompleteModal();
  }
});

// ====================== FILTER ======================
function setFilter(filter) {
  currentFilter = filter;
  visibleCount = 20;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`[onclick="setFilter('${filter}')"]`);
  if (activeBtn) activeBtn.classList.add("active");

  renderDays();
}

// ====================== SEARCH ======================
let searchTimeout;
function searchDays() {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    visibleCount = 20;
    renderDays();
  }, 300);
}

// ====================== SHOW DESCRIPTION MODAL ======================
function showDescription(day, questionNum) {
  const dayData = challengeData.find((d) => d.day === day);
  if (!dayData) return;

  const modal = document.getElementById("problemModal");
  const title = document.getElementById("modalTitle");
  const description = document.getElementById("modalDescription");

  if (!modal || !title || !description) return;

  const questionData = questionNum === 1 ? dayData.question1 : dayData.question2;

  title.textContent = `Day ${day} - Question ${questionNum}: ${
    questionData.title || questionData.name
  }`;

  const formattedDescription = questionData.description || "No description available";
  description.innerHTML = `<pre>${formattedDescription}</pre>`;

  modal.style.display = "block";
}

// ====================== CLOSE PROBLEM MODAL ======================
function closeProblemModal() {
  const modal = document.getElementById("problemModal");
  if (modal) modal.style.display = "none";
}

// ====================== CLOSE SOLUTION MODAL ======================
function closeSolutionModal() {
  const modal = document.getElementById("solutionModal");
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "auto";
}

// ====================== RENDER DAYS ======================
function renderDays() {
  const grid = document.getElementById("daysGrid");
  const searchBox = document.getElementById("searchBox");
  if (!grid || !searchBox) return;

  const searchTerm = searchBox.value.toLowerCase();
  const maxUnlocked = getUnlockedDay();
  const completedSet = new Set(completedDays);

  const filtered = challengeData.filter((day) => {
    const matchesFilter = currentFilter === "all" || day.unit === currentFilter;

    const matchesSearch =
      searchTerm === "" ||
      day.day.toString().includes(searchTerm) ||
      day.question1.title.toLowerCase().includes(searchTerm) ||
      day.question2.name.toLowerCase().includes(searchTerm) ||
      day.topics.some((t) => t.toLowerCase().includes(searchTerm));

    return matchesFilter && matchesSearch && day.day <= maxUnlocked;
  });

  const sliced = filtered.slice(0, visibleCount);

  grid.innerHTML = sliced
    .map((day) => {
      const isCompleted = completedSet.has(day.day);

      return `
        <div class="day-card ${isCompleted ? "completed" : ""}">
          
          <div class="day-header">
            <div class="day-number">Day ${day.day}</div>
            <div class="unit-badge">${day.unit.replace("Unit ", "")}</div>
          </div>

          <div class="topics">
            ${day.topics.map((t) => `<span class="topic-tag">${t}</span>`).join("")}
          </div>

          <div class="question">
          <div class="question-name">${day.question1.title}</div>

          <div class="btn-row">
            <button class="solve-btn" onclick="showDescription(${day.day}, 1)">
              View Problem →
            </button>

            <button class="solution-btn" onclick="showSolution(${day.day}, 1)">
              View Solution 💡
            </button>
          </div>
        </div>


          <div class="question">
            <div class="question-name">${day.question2.name}</div>

            <div class="btn-row">
              <a href="${day.question2.link}" target="_blank" class="solve-btn">
                Solve Problem →
              </a>

              <button class="solution-btn" onclick="showSolution(${day.day}, 2)">
                View Solution 🛠️
              </button>
            </div>
          </div>


          <div class="complete-btn ${isCompleted ? "completed" : ""}" 
            onclick="openCompleteModal(${day.day})">
            <span>${isCompleted ? "Completed" : "Mark as Complete"}</span>
          </div>
        </div>
      `;
    })
    .join("");

  if (visibleCount < filtered.length) {
    grid.innerHTML += `
      <div id="loadMoreMsg" style="text-align:center;color:#9ca3af;padding:25px;font-weight:700;">
        ⏳ Scroll down to load more...
      </div>
    `;
  }
}

// ====================== INIT CHALLENGE PAGE ======================
async function initChallengePage() {
  try {
    const response = await fetch("/challenge-api/data");
    challengeData = await response.json();

    await loadProgressFromDB();

    unlockedDays = getUnlockedDay();
    updateStats();
    renderDays();
  } catch (err) {
    console.error("Error loading challenge data:", err);

    const grid = document.getElementById("daysGrid");
    if (grid) {
      grid.innerHTML =
        '<div style="text-align: center; padding: 40px; color: #ef4444;">Error loading challenge data. Please refresh the page.</div>';
    }
  }
}

// ====================== SCROLL LOAD MORE (FIXED) ======================
window.addEventListener("scroll", () => {
  if (isLoadingMore) return;

  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const fullHeight = document.body.scrollHeight;

  if (scrollTop + windowHeight >= fullHeight - 200) {
    isLoadingMore = true;

    setTimeout(() => {
      visibleCount += loadMoreCount;
      renderDays();
      isLoadingMore = false;
    }, 300);
  }
});

// ====================== PAGE DETECTION ======================
window.addEventListener("DOMContentLoaded", () => {
  updateTimer();

  setInterval(updateTimer, 1000);
  setInterval(updateStats, 30000);

  if (document.getElementById("daysGrid")) {
    initChallengePage();
  } else {
    loadProgressFromDB().then(() => updateStats());
  }
});

// ====================== SHOW SOLUTION MODAL ======================
function showSolution(day, questionNum) {
  const dayData = challengeData.find((d) => d.day === day);
  if (!dayData) return;

  if (!dayData.solutions) {
    alert("⚠️ Solutions not available yet!");
    return;
  }

  const solutions =
    questionNum === 1 ? dayData.solutions.question1 : dayData.solutions.question2;

  if (!solutions || solutions.length === 0) {
    alert("⚠️ Solution for this question is not available yet!");
    return;
  }

  const modal = document.getElementById("solutionModal");
  const title = document.getElementById("solutionModalTitle");
  const content = document.getElementById("solutionModalContent");

  if (!modal || !title || !content) return;

  const questionTitle =
    questionNum === 1 ? dayData.question1.title : dayData.question2.name;

  title.textContent = `Day ${day} - Question ${questionNum}: ${questionTitle}`;

  let solutionsHTML = "";

  solutions.forEach((solution) => {
    if (solution.type === "editorial") return;

    if (solution.type === "tutorial") {
      solutionsHTML += `
        <div class="solution-section tutorial">
          <div class="solution-type-badge">📚 Tutorial</div>
          <div class="solution-explanation">${solution.explanation || ""}</div>

          ${
            solution.code
              ? `<div class="solution-code"><pre>${solution.code}</pre></div>`
              : ""
          }

          <div class="complexity-info">
            ${
              solution.timeComplexity
                ? `<div class="complexity-item">⏱️ Time: ${solution.timeComplexity}</div>`
                : ""
            }
            ${
              solution.spaceComplexity
                ? `<div class="complexity-item">💾 Space: ${solution.spaceComplexity}</div>`
                : ""
            }
          </div>
        </div>
      `;
    }

    if (solution.type === "video") {
      solutionsHTML += `
        <div class="solution-section">
          <div class="solution-type-badge">🎥 Video</div>
          <a href="${solution.link}" target="_blank" class="solution-link">
            ${solution.label || "Watch Video Solution"} →
          </a>
        </div>
      `;
    }
  });

  content.innerHTML = solutionsHTML;
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

// ====================== CLOSE MODALS ON OUTSIDE CLICK ======================
document.addEventListener("DOMContentLoaded", () => {
  const problemModal = document.getElementById("problemModal");
  const solutionModal = document.getElementById("solutionModal");

  if (problemModal) {
    problemModal.addEventListener("click", (e) => {
      if (e.target === problemModal) {
        closeProblemModal();
      }
    });
  }

  if (solutionModal) {
    solutionModal.addEventListener("click", (e) => {
      if (e.target === solutionModal) {
        closeSolutionModal();
      }
    });
  }
});
