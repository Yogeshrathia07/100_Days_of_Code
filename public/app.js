// Configuration - Modify start date here!
const CONFIG = {
    startDate: '2025-02-01',
    unlockTime: '07:00',
    timezone: 'Asia/Kolkata'
};

let challengeData = [];
let currentFilter = 'all';
let completedDays = [];
let unlockedDays = 0;

// Calculate unlocked day
function getUnlockedDay() {
    const now = new Date();
    const start = new Date(CONFIG.startDate + 'T' + CONFIG.unlockTime + ':00+05:30');

    if (now < start) {
        return 0;
    }

    const diffTime = now - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const todayUnlock = new Date();
    const [hours, minutes] = CONFIG.unlockTime.split(':');
    todayUnlock.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (now >= todayUnlock) {
        return Math.min(diffDays + 1, 100);
    }

    return Math.min(Math.max(0, diffDays), 100);
}

// Timer
function updateTimer() {
    const now = new Date();
    const [hours, minutes] = CONFIG.unlockTime.split(':');

    const nextUnlock = new Date();
    nextUnlock.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (now >= nextUnlock) {
        nextUnlock.setDate(nextUnlock.getDate() + 1);
    }

    const diff = nextUnlock - now;

    if (diff > 0) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = timeString;

        const countdownEl = document.getElementById('nextUnlockCountdown');
        if (countdownEl) countdownEl.textContent = timeString;
    } else {
        document.getElementById('timerDisplay').textContent = '00:00:00';
        const countdownEl = document.getElementById('nextUnlockCountdown');
        if (countdownEl) countdownEl.textContent = '00:00:00';
    }
}

// Streak
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

// Load progress
function loadProgress() {
    const saved = localStorage.getItem('dsa-100-days-progress');
    if (saved) {
        try {
            completedDays = JSON.parse(saved);
        } catch (e) {
            completedDays = [];
        }
    }
}

// Save progress
function saveProgress() {
    localStorage.setItem('dsa-100-days-progress', JSON.stringify(completedDays));
}

// Toggle complete
function toggleComplete(day) {
    if (completedDays.includes(day)) {
        completedDays = completedDays.filter(d => d !== day);
    } else {
        completedDays.push(day);
    }
    saveProgress();
    updateStats();
    renderDays();
}

// Update stats
function updateStats() {
    const maxUnlocked = getUnlockedDay();
    const completed = completedDays.length;
    const streak = calculateStreak();

    document.getElementById('totalDays').textContent = maxUnlocked;
    document.getElementById('completedDays').textContent = completed;
    document.getElementById('streakDays').textContent = streak;

    document.getElementById('progressCompletedDays').textContent = completed;
    document.getElementById('progressTotalDays').textContent = maxUnlocked;

    const progressPercent = maxUnlocked > 0 ? (completed / maxUnlocked) * 100 : 0;
    document.getElementById('progressFill').style.width = progressPercent + '%';
}

// Filter
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="setFilter('${filter}')"]`).classList.add('active');
    renderDays();
}

// Search
function searchDays() {
    renderDays();
}

// Show description modal
function showDescription(day, questionNum) {
    const dayData = challengeData.find(d => d.day === day);
    if (!dayData) return;

    const modal = document.getElementById('problemModal');
    const title = document.getElementById('modalTitle');
    const description = document.getElementById('modalDescription');

    title.textContent = `Day ${day} - Question ${questionNum}: ${dayData.question1.title}`;
    description.innerHTML = `<pre>${dayData.question1.description}</pre>`;

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('problemModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('problemModal');
    const solutionModal = document.getElementById('solutionModal');
    if (event.target === modal) closeModal();
    if (event.target === solutionModal) closeSolutionModal();
};

// Fullscreen solution modal
function showSolutionFullscreen(dayNum, questionNum, solutionType) {
    const day = challengeData.find(d => d.day === dayNum);
    if (!day || !day.solutions) return;

    const solutions = questionNum === 1 ? day.solutions.question1 : day.solutions.question2;
    if (!solutions) return;

    const solution = solutions.find(sol => sol.type === solutionType);
    if (!solution) return;

    const modal = document.getElementById('solutionModal');
    const title = document.getElementById('solutionModalTitle');
    const content = document.getElementById('solutionModalContent');

    title.textContent = `Day ${dayNum} - Question ${questionNum} - Tutorial`;

    content.innerHTML = `
        <div class="fullscreen-solution-content">
            ${solution.explanation ? `
                <div class="tutorial-block">
                    <h3>💡 Logic Explanation</h3>
                    <div class="tutorial-text">${solution.explanation.replace(/\n/g, '<br>')}</div>
                </div>
            ` : ''}

            ${solution.code ? `
                <div class="tutorial-block">
                    <h3>💻 Code Solution</h3>
                    <pre class="code-block fullscreen-code"><code>${solution.code}</code></pre>
                </div>
            ` : ''}

            ${solution.timeComplexity ? `
                <div class="tutorial-block">
                    <h3>⏱️ Complexity Analysis</h3>
                    <div class="complexity-info">
                        <div class="complexity-item">
                            <strong>Time Complexity:</strong> <code>${solution.timeComplexity}</code>
                        </div>
                        ${solution.spaceComplexity ? `
                            <div class="complexity-item">
                                <strong>Space Complexity:</strong> <code>${solution.spaceComplexity}</code>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSolutionModal() {
    document.getElementById('solutionModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Solutions dropdown toggle
function toggleSolutions(dayNum) {
    const content = document.getElementById(`solutions-content-${dayNum}`);
    const chevron = document.getElementById(`chevron-${dayNum}`);

    if (content.classList.contains('open')) {
        content.classList.remove('open');
        chevron.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('open');
        chevron.style.transform = 'rotate(180deg)';
    }
}

// Tutorial toggle
function toggleTutorial(dayNum, questionNum) {
    const content = document.getElementById(`tutorial-${dayNum}-q${questionNum}`);
    const chevron = document.getElementById(`tutorial-chevron-${dayNum}-q${questionNum}`);

    if (content.classList.contains('open')) {
        content.classList.remove('open');
        chevron.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('open');
        chevron.style.transform = 'rotate(180deg)';
    }
}

// Render tutorial
function renderTutorial(dayNum, questionNum, tutorial) {
    if (!tutorial) return '';

    return `
        <div class="tutorial-section">
            <button class="tutorial-toggle" onclick="toggleTutorial(${dayNum}, ${questionNum})">
                <div class="tutorial-toggle-content">
                    <span>📚 View Complete Tutorial</span>
                </div>
                <svg id="tutorial-chevron-${dayNum}-q${questionNum}" class="chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div id="tutorial-${dayNum}-q${questionNum}" class="tutorial-content">
                <div class="tutorial-inner">
                    <button class="fullscreen-btn" onclick="showSolutionFullscreen(${dayNum}, ${questionNum}, 'tutorial')">
                        View Fullscreen
                    </button>

                    ${tutorial.explanation ? `
                        <div class="tutorial-block">
                            <h4>💡 Logic Explanation</h4>
                            <div class="tutorial-text">${tutorial.explanation.replace(/\n/g, '<br>')}</div>
                        </div>
                    ` : ''}

                    ${tutorial.code ? `
                        <div class="tutorial-block">
                            <h4>💻 Code Solution</h4>
                            <pre class="code-block"><code>${tutorial.code}</code></pre>
                        </div>
                    ` : ''}

                    ${tutorial.timeComplexity ? `
                        <div class="tutorial-block">
                            <h4>⏱️ Complexity Analysis</h4>
                            <div class="complexity-info">
                                <div class="complexity-item">
                                    <strong>Time Complexity:</strong> <code>${tutorial.timeComplexity}</code>
                                </div>
                                ${tutorial.spaceComplexity ? `
                                    <div class="complexity-item">
                                        <strong>Space Complexity:</strong> <code>${tutorial.spaceComplexity}</code>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Render solutions section
function renderSolutions(dayNum, maxUnlocked) {
    const day = challengeData.find(d => d.day === dayNum);
    if (!day || !day.solutions) return '';

    const solutionsUnlocked = dayNum < maxUnlocked;

    if (solutionsUnlocked) {
        const q1Solutions = day.solutions.question1 || [];
        const q1Tutorial = q1Solutions.find(sol => sol.type === 'tutorial');
        const q1VideoSolutions = q1Solutions.filter(sol => sol.type === 'video');

        const q2Solutions = day.solutions.question2 || [];
        const q2Tutorial = q2Solutions.find(sol => sol.type === 'tutorial');
        const q2VideoSolutions = q2Solutions.filter(sol => sol.type === 'video');

        const hasAnySolutions = q1Solutions.length > 0 || q2Solutions.length > 0;

        return `
            <div class="solutions-dropdown">
                <button class="solutions-toggle" onclick="toggleSolutions(${dayNum})">
                    <div class="solutions-toggle-content">
                        <span>✓ Solutions Available</span>
                    </div>
                    <svg id="chevron-${dayNum}" class="chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                <div id="solutions-content-${dayNum}" class="solutions-content">
                    <div class="solutions-inner">
                        ${q1Solutions.length > 0 ? `
                            <div class="solution-group">
                                <div class="solution-label">📘 Question 1 Solutions</div>
                                ${q1Tutorial ? renderTutorial(dayNum, 1, q1Tutorial) : ''}
                                ${q1VideoSolutions.length > 0 ? `
                                    <div class="solution-links">
                                        ${q1VideoSolutions.map(sol => `
                                            <a href="${sol.link}" target="_blank" class="solution-link">
                                                ${sol.label}
                                            </a>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}

                        ${q2Solutions.length > 0 ? `
                            <div class="solution-group">
                                <div class="solution-label">🎯 Question 2 Solutions</div>
                                ${q2VideoSolutions.length > 0 ? `
                                    <div class="solution-links">
                                        ${q2VideoSolutions.map(sol => `
                                            <a href="${sol.link}" target="_blank" class="solution-link">
                                                ${sol.label}
                                            </a>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                ${q2Tutorial ? renderTutorial(dayNum, 2, q2Tutorial) : ''}
                            </div>
                        ` : ''}

                        ${!hasAnySolutions ? `<div class="empty-message">Solutions will be added soon...</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="solutions-dropdown">
                <button class="solutions-toggle locked" disabled>
                    <div class="solutions-toggle-content">
                        <span>🔒 Solutions unlock when Day ${dayNum + 1} opens</span>
                    </div>
                </button>
            </div>
        `;
    }
}

// Render all days
function renderDays() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const grid = document.getElementById('daysGrid');
    const maxUnlocked = getUnlockedDay();

    const filtered = challengeData.filter(day => {
        const matchesFilter = currentFilter === 'all' || day.unit === currentFilter;
        const matchesSearch = searchTerm === '' ||
            day.day.toString().includes(searchTerm) ||
            day.question1.title.toLowerCase().includes(searchTerm) ||
            day.question2.name.toLowerCase().includes(searchTerm) ||
            day.topics.some(t => t.toLowerCase().includes(searchTerm));
        return matchesFilter && matchesSearch;
    });

    let cardsHTML = filtered.map(day => {
        const isCompleted = completedDays.includes(day.day);
        const isLocked = day.day > maxUnlocked;
        const isToday = day.day === maxUnlocked && maxUnlocked > 0;

        if (isLocked) return '';

        let statusBadge = '';
        if (isToday) statusBadge = `<span class="unlock-badge">🔥 Today's Challenge</span>`;
        else if (day.day < maxUnlocked) statusBadge = `<span class="unlock-badge">✓ Unlocked</span>`;

        return `
            <div class="day-card ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}">
                ${statusBadge}

                <div class="day-header">
                    <div class="day-number">Day ${day.day}</div>
                    <div class="unit-badge">${day.unit.replace('Unit ', '')}</div>
                </div>

                <div class="topics">
                    ${day.topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
                </div>

                <div class="question">
                    <div class="question-header">
                        <span class="question-num">Question 1 - C Programming</span>
                        <span class="difficulty easy">Practice</span>
                    </div>
                    <div class="question-name">${day.question1.title}</div>
                    <button class="solve-btn" onclick="showDescription(${day.day}, 1)">View Problem →</button>
                </div>

                <div class="question">
                    <div class="question-header">
                        <span class="question-num">Question 2 - ${day.question2.link.includes('leetcode') ? 'LeetCode' : 'GeeksforGeeks'}</span>
                        <span class="difficulty ${day.question2.difficulty.toLowerCase()}">${day.question2.difficulty}</span>
                    </div>
                    <div class="question-name">${day.question2.name}</div>
                    <a href="${day.question2.link}" target="_blank" class="solve-btn">Solve Problem →</a>
                </div>

                <div class="complete-btn ${isCompleted ? 'completed' : ''}" onclick="toggleComplete(${day.day})">
                    <span>${isCompleted ? 'Completed' : 'Mark as Complete'}</span>
                </div>

                ${renderSolutions(day.day, maxUnlocked)}
            </div>
        `;
    }).join('');

    grid.innerHTML = cardsHTML;
}

// Initialize
async function init() {
    try {
        const response = await fetch('challenge_syllabus_aligned.json');
        challengeData = await response.json();

        loadProgress();

        unlockedDays = getUnlockedDay();
        updateStats();
        renderDays();

        updateTimer();
        setInterval(updateTimer, 1000);

        setInterval(() => {
            const newUnlocked = getUnlockedDay();
            if (newUnlocked !== unlockedDays) {
                unlockedDays = newUnlocked;
                updateStats();
                renderDays();
            }
        }, 60000);

    } catch (error) {
        console.error('Error loading challenge data:', error);
        document.getElementById('daysGrid').innerHTML =
            '<div style="text-align: center; padding: 40px; color: #ef4444;">Error loading challenge data. Please refresh the page.</div>';
    }
}

window.addEventListener('DOMContentLoaded', init);
