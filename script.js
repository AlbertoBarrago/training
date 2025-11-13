let db;
const DB_NAME = 'WorkoutTrackerDB';
const USERS_STORE = 'users';
const EXERCISES_STORE = 'exercises';
let currentUser = null;

function initDB() {

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2);

        if (!window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Users store
            if (!db.objectStoreNames.contains(USERS_STORE)) {
                const usersStore = db.createObjectStore(USERS_STORE, {keyPath: 'username'});
                usersStore.createIndex('username', 'username', {unique: true});
            }

            // Exercises store
            if (!db.objectStoreNames.contains(EXERCISES_STORE)) {
                const exercisesStore = db.createObjectStore(EXERCISES_STORE, {keyPath: 'id'});
                exercisesStore.createIndex('userId', 'userId', {unique: false});
                exercisesStore.createIndex('date', 'date', {unique: false});
            }
        };
    });
}

async function ensureDBReady() {
    if (!db) {
        await initDB();
    }

}

async function registerUser(username, password) {
    await ensureDBReady();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([USERS_STORE], 'readwrite');
        const store = transaction.objectStore(USERS_STORE);
        const hashedPassword = btoa(password);
        const user = {username: username, password: hashedPassword, createdAt: new Date().getTime()};
        const request = store.add(user);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
            if (request.error.name === 'ConstraintError') {
                reject(new Error('Username già esistente'));
            } else {
                reject(request.error);
            }
        };
    });
}

async function loginUser(username, password) {
    await ensureDBReady();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([USERS_STORE], 'readonly');
        const store = transaction.objectStore(USERS_STORE);
        const request = store.get(username);

        request.onsuccess = () => {
            const user = request.result;
            if (!user) {
                reject(new Error('Username non trovato'));
                return;
            }
            const hashedPassword = btoa(password);
            if (user.password !== hashedPassword) {
                reject(new Error('Password errata'));
                return;
            }
            resolve(user);
        };
        request.onerror = () => reject(request.error);
    });
}

function saveCurrentUser(username) {
    localStorage.setItem('currentUser', username);
    currentUser = username;
}

function loadCurrentUser() {
    currentUser = localStorage.getItem('currentUser');
    return currentUser;
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    currentUser = null;
}

function saveExercise(exerciseId, completed) {
    return new Promise((resolve, reject) => {
        if (!currentUser) {
            reject(new Error('Nessun utente connesso'));
            return;
        }

        const transaction = db.transaction([EXERCISES_STORE], 'readwrite');
        const store = transaction.objectStore(EXERCISES_STORE);
        const today = new Date().toISOString().split('T')[0];

        const data = {
            id: `${currentUser}-${exerciseId}-${today}`,
            userId: currentUser,
            exerciseId: exerciseId,
            date: today,
            completed: completed,
            timestamp: new Date().getTime()
        };

        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function loadExercises() {
    return new Promise((resolve, reject) => {
        if (!currentUser) {
            reject(new Error('Nessun utente connesso'));
            return;
        }

        const transaction = db.transaction([EXERCISES_STORE], 'readonly');
        const store = transaction.objectStore(EXERCISES_STORE);
        const index = store.index('userId');
        const request = index.getAll(currentUser);

        request.onsuccess = () => {
            const allData = request.result;
            const today = new Date().toISOString().split('T')[0];
            const todayData = allData.filter(item => item.date === today);

            resolve({today: todayData, all: allData});
        };
        request.onerror = () => reject(request.error);
    });
}

function clearAllData() {
    return new Promise((resolve, reject) => {
        if (!currentUser) {
            reject(new Error('Nessun utente connesso'));
            return;
        }

        const transaction = db.transaction([EXERCISES_STORE], 'readwrite');
        const store = transaction.objectStore(EXERCISES_STORE);
        const index = store.index('userId');
        const request = index.openCursor(currentUser);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                resolve();
            }
        };

        request.onerror = () => reject(request.error);
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('mainApp').classList.remove('active');
}

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('currentUser').textContent = currentUser;
    updateDate();
    void loadUI();
}

function updateDate() {
    const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
    document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString('it-IT', options);
}

function updateStats(data) {
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekAgo = oneWeekAgo.toISOString().split('T')[0];

    const completedExercises = data.all.filter(item => item.completed === true);

    const todayCompleted = completedExercises.filter(item => item.date === today).length;
    const weekCompleted = completedExercises.filter(item => item.date >= weekAgo).length;
    const totalCompleted = completedExercises.length;

    document.getElementById('todayCount').textContent = todayCompleted;
    document.getElementById('weekCount').textContent = weekCompleted;
    document.getElementById('totalCount').textContent = totalCompleted;
}

async function loadUI() {
    const data = await loadExercises();

    const todayCompletedIds = data.today
        .filter(item => item.completed === true)
        .map(item => item.exerciseId);

    document.querySelectorAll('.exercise').forEach(exercise => {
        const exerciseId = exercise.dataset.exercise;
        const checkbox = exercise.querySelector('.checkbox');

        const isCompleted = todayCompletedIds.includes(exerciseId);

        checkbox.checked = isCompleted;
        if (isCompleted) {
            exercise.classList.add('completed');
        } else {
            exercise.classList.remove('completed');
        }
    });

    updateStats(data);
}

async function handleCheckbox(exercise, checkbox) {
    const exerciseId = exercise.dataset.exercise;
    const isCompleted = checkbox.checked;

    await saveExercise(exerciseId, isCompleted);

    await loadUI();
}

async function initializeApp() {
    try {
        await initDB();

        const savedUser = loadCurrentUser();

        if (savedUser) {
            showMainApp();
        } else {
            showAuthScreen();
        }

    } catch (error) {
        console.error("Errore fatale nell'inizializzazione del database:", error);
        showError("Impossibile caricare l'applicazione. Controlla la console.");
    }
}

document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        const authType = tab.dataset.auth;
        document.getElementById(`${authType}Form`).classList.add('active');
    });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) {
        showError('Compila tutti i campi');
        return;
    }
    try {
        await loginUser(username, password);
        saveCurrentUser(username);
        showMainApp();
    } catch (error) {
        showError(error.message);
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    if (!username || !password || !passwordConfirm || password.length < 6 || password !== passwordConfirm) {
        showError('Verifica i campi: password min 6 caratteri e devono corrispondere.');
        return;
    }
    try {
        await registerUser(username, password);
        saveCurrentUser(username);
        showMainApp();
    } catch (error) {
        showError(error.message);
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Sei sicuro di voler uscire?')) {
        logoutUser();
        showAuthScreen();
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
    }
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.workout-day').forEach(d => d.classList.remove('active'));
        tab.classList.add('active');
        const day = tab.dataset.day;
        document.getElementById(`day${day.toUpperCase()}`).classList.add('active');
    });
});

document.querySelectorAll('.exercise').forEach(exercise => {
    const checkbox = exercise.querySelector('.checkbox');

    exercise.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            handleCheckbox(exercise, checkbox);
        }
    });

    checkbox.addEventListener('change', () => {
        handleCheckbox(exercise, checkbox);
    });
});

document.getElementById('resetBtn').addEventListener('click', async () => {
    if (confirm('Sei sicuro di voler resettare tutto il tuo progresso?')) {
        await clearAllData();
        await loadUI();
    }
});

window.addEventListener('DOMContentLoaded', initializeApp);