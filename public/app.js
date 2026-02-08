// ====================== CONFIG ======================
const CONFIG = {
  startDate: "2025-02-01",
  unlockTime: "07:00",
};


// ====================== Optimisation ======================
let visibleCount = 20;
const loadMoreCount = 20;

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

  const progressCompletedDaysEl = document.getElementById(
    "progressCompletedDays",
  );
  const progressTotalDaysEl = document.getElementById("progressTotalDays");
  const progressFillEl = document.getElementById("progressFill");

  if (progressCompletedDaysEl) progressCompletedDaysEl.textContent = completed;
  if (progressTotalDaysEl) progressTotalDaysEl.textContent = unlocked;

  if (progressFillEl) {
    const progressPercent = unlocked > 0 ? (completed / unlocked) * 100 : 0;
    progressFillEl.style.width = progressPercent + "%";
  }
}

// ====================== TOGGLE COMPLETE (SAVE TO DB) ======================
// async function toggleComplete(day) {
//   try {
//     const res = await fetch("/progress/toggle", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ day }),
//     });

//     const data = await res.json();

//     if (data.success) {
//       completedDays = data.challengeProgress.map((d) => d.day);

//       updateStats();
//       renderDays();
//     } else {
//       alert("Error saving progress!");
//     }
//   } catch (err) {
//     console.log("Toggle error:", err);
//     alert("Backend not running!");
//   }
// }

// async function toggleComplete(day) {

//   // ====================== CONFIRM POPUP ======================
//   const confirmText = `Day ${day}`;

//   const userInput = prompt(
//     `To mark this day as complete, type:\n\n${confirmText}`
//   );

//   // If user pressed cancel
//   if (userInput === null) return;

//   // If wrong input
//   if (userInput.trim().toLowerCase() !== confirmText.toLowerCase()) {
//     alert("❌ Incorrect text! Please type exactly as shown.");
//     return;
//   }

//   // ====================== BACKEND REQUEST ======================
//   try {
//     const res = await fetch("/progress/toggle", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ day }),
//     });

//     const data = await res.json();

//     if (data.success) {
//       completedDays = data.challengeProgress.map((d) => d.day);

//       updateStats();
//       renderDays();
//     } else {
//       alert("❌ Error saving progress!");
//     }
//   } catch (err) {
//     console.log("Toggle error:", err);
//     alert("❌ Backend not running!");
//   }
// }

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

// ===================== CLOSE MODAL =====================
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

  // ✅ store day before closing modal
  const dayToSend = selectedDay;

  closeCompleteModal();

  try {
    const res = await fetch("/progress/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  // Enter key confirms
  if (e.key === "Enter" && modalEl.style.display === "flex") {
    confirmCompleteDay();
  }

  // ESC closes modal
  if (e.key === "Escape" && modalEl.style.display === "flex") {
    closeCompleteModal();
  }
});

// ====================== FILTER ======================
function setFilter(filter) {
  currentFilter = filter;

  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));

  const activeBtn = document.querySelector(
    `[onclick="setFilter('${filter}')"]`,
  );
  if (activeBtn) activeBtn.classList.add("active");

  renderDays();
}

// ====================== SEARCH ======================
function searchDays() {
  renderDays();
}

// ====================== SHOW DESCRIPTION MODAL ======================
// function showDescription(day, questionNum) {
//   const dayData = challengeData.find((d) => d.day === day);
//   if (!dayData) return;

//   const modal = document.getElementById("problemModal");
//   const title = document.getElementById("modalTitle");
//   const description = document.getElementById("modalDescription");

//   if (!modal || !title || !description) return;

//   title.textContent = `Day ${day} - Question ${questionNum}: ${dayData.question1.title}`;
//   description.innerHTML = `<pre>${dayData.question1.description}</pre>`;

//   modal.style.display = "block";
// }

// ====================== SHOW DESCRIPTION MODAL ======================
function showDescription(day, questionNum) {
  const dayData = challengeData.find((d) => d.day === day);
  if (!dayData) return;

  const modal = document.getElementById("problemModal");
  const title = document.getElementById("modalTitle");
  const description = document.getElementById("modalDescription");

  if (!modal || !title || !description) return;

  // Get the correct question data based on questionNum
  const questionData =
    questionNum === 1 ? dayData.question1 : dayData.question2;

  title.textContent = `Day ${day} - Question ${questionNum}: ${questionData.title || questionData.name}`;

  // Format the description with proper line breaks
  const formattedDescription =
    questionData.description || "No description available";
  description.innerHTML = `<pre>${formattedDescription}</pre>`;

  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("problemModal");
  if (modal) modal.style.display = "none";
}

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

  const filtered = challengeData.filter((day) => {
    const matchesFilter = currentFilter === "all" || day.unit === currentFilter;

    const matchesSearch =
      searchTerm === "" ||
      day.day.toString().includes(searchTerm) ||
      day.question1.title.toLowerCase().includes(searchTerm) ||
      day.question2.name.toLowerCase().includes(searchTerm) ||
      day.topics.some((t) => t.toLowerCase().includes(searchTerm));

    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = filtered
    .map((day) => {
      const isCompleted = completedDays.includes(day.day);
      const isLocked = day.day > maxUnlocked;
      const isToday = day.day === maxUnlocked && maxUnlocked > 0;

      if (isLocked) return "";

      let statusBadge = "";
      if (isToday)
        statusBadge = `<span class="unlock-badge">🔥 Today's Challenge</span>`;
      else if (day.day < maxUnlocked)
        statusBadge = `<span class="unlock-badge">✓ Unlocked</span>`;

      return `
        <div class="day-card ${isCompleted ? "completed" : ""} ${
          isToday ? "today" : ""
        }">
          ${statusBadge}

          <div class="day-header">
            <div class="day-number">Day ${day.day}</div>
            <div class="unit-badge">${day.unit.replace("Unit ", "")}</div>
          </div>

          <div class="topics">
            ${day.topics.map((t) => `<span class="topic-tag">${t}</span>`).join("")}
          </div>

          <div class="question">
          <div class="question-header">
            <span class="question-num">Question 1 - C Programming</span>
            <span class="difficulty easy">Practice</span>
          </div>
          <div class="question-name">${day.question1.title}</div>
          <div class="question-buttons">
            <button class="solve-btn" onclick="showDescription(${day.day}, 1)">View Problem →</button>
            <button class="solution-btn" onclick="showSolution(${day.day}, 1)">View Solution 💡</button>
          </div>
        </div>

        <div class="question">
          <div class="question-header">
            <span class="question-num">Question 2</span>
            <span class="difficulty ${day.question2.difficulty.toLowerCase()}">${day.question2.difficulty}</span>
          </div>
          <div class="question-name">${day.question2.name}</div>
          <div class="question-buttons">
            <a href="${day.question2.link}" target="_blank" class="solve-btn">Solve Problem →</a>
            <button class="solution-btn" onclick="showSolution(${day.day}, 2)">View Solution 💡</button>
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

// ====================== PAGE DETECTION ======================
window.addEventListener("DOMContentLoaded", () => {
  updateTimer();

  setInterval(updateTimer, 1000);
  setInterval(updateStats, 30000);

  // Challenge Page
  if (document.getElementById("daysGrid")) {
    initChallengePage();
  }
  // Dashboard Page (stats only)
  else {
    loadProgressFromDB().then(() => updateStats());
  }
});

// ====================== SHOW SOLUTION MODAL ======================
// ====================== SHOW SOLUTION MODAL ======================
function showSolution(day, questionNum) {
  const dayData = challengeData.find((d) => d.day === day);
  if (!dayData) return;

  // Check if solutions exist
  if (!dayData.solutions) {
    alert("⚠️ Solutions not available yet!");
    return;
  }

  const solutions =
    questionNum === 1
      ? dayData.solutions.question1
      : dayData.solutions.question2;

  // Check if this specific question has solutions
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

  title.textContent = `Day ${day} - Question ${questionNum}: ${questionTitle} - Solutions`;

  let solutionsHTML = "";

  solutions.forEach((solution, index) => {
    // Skip editorial type
    if (solution.type === "editorial") return;

    if (solution.type === "tutorial") {
      solutionsHTML += `<div class="solution-section tutorial">`;
      solutionsHTML += `<div class="solution-type-badge">📚 Tutorial</div>`;

      // Tutorial with code
      if (solution.explanation) {
        solutionsHTML += `<div class="solution-explanation">${solution.explanation}</div>`;
      }

      if (solution.code) {
        // Decode HTML entities
        const decodedCode = solution.code
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"');

        solutionsHTML += `
          <div class="solution-code">
            <pre>${decodedCode}</pre>
          </div>
        `;
      }

      if (solution.timeComplexity || solution.spaceComplexity) {
        solutionsHTML += `<div class="complexity-info">`;
        if (solution.timeComplexity) {
          solutionsHTML += `<div class="complexity-item">⏱️ Time: ${solution.timeComplexity}</div>`;
        }
        if (solution.spaceComplexity) {
          solutionsHTML += `<div class="complexity-item">💾 Space: ${solution.spaceComplexity}</div>`;
        }
        solutionsHTML += `</div>`;
      }

      solutionsHTML += `</div>`;
    } else if (solution.type === "video") {
      // Video links with better design
      solutionsHTML += `<div class="solution-section">`;
      solutionsHTML += `<div class="solution-type-badge">🎥 Video</div>`;
      solutionsHTML += `
        <a href="${solution.link}" target="_blank" class="solution-link">
          <span class="solution-link-text">${solution.label || "Watch Video Solution"}</span>
          <span class="solution-link-arrow">→</span>
        </a>
      `;
      solutionsHTML += `</div>`;
    }
  });

  content.innerHTML = solutionsHTML;
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("problemModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Close modal when clicking outside
document.addEventListener("DOMContentLoaded", () => {
  const problemModal = document.getElementById("problemModal");
  const solutionModal = document.getElementById("solutionModal");

  if (problemModal) {
    problemModal.addEventListener("click", (e) => {
      if (e.target === problemModal) {
        closeModal();
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
