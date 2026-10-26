/**
 * ==============================================================================
 * MEDICORE ENTERPRISE HOSPITAL MANAGEMENT SYSTEM - APP ENGINE (app.js)
 * Live Cross-Portal Data Sync, Hybrid Queue Intelligence, Smart Predictors & RBAC
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. DEFAULT SEED DATA
// ------------------------------------------------------------------------------
const DEFAULT_DOCTORS = [
    { id: "DOC-01", name: "Dr. Sarah Smith", department: "Cardiology", status: "Available", fee: 800, rating: 4.9, exp: 14, cabin: "Cabin 104" },
    { id: "DOC-02", name: "Dr. Michael Chen", department: "Neurology", status: "In Surgery", fee: 1200, rating: 4.8, exp: 18, cabin: "Cabin 201" },
    { id: "DOC-03", name: "Dr. Emily Davis", department: "Pediatrics", status: "Available", fee: 600, rating: 4.7, exp: 10, cabin: "Cabin 108" },
    { id: "DOC-04", name: "Dr. James Wilson", department: "Orthopedics", status: "Busy", fee: 900, rating: 4.9, exp: 16, cabin: "Cabin 112" },
    { id: "DOC-05", name: "Dr. Aisha Patel", department: "General Medicine", status: "Available", fee: 500, rating: 4.9, exp: 12, cabin: "Cabin 102" },
    { id: "DOC-06", name: "Dr. Robert Taylor", department: "Dermatology", status: "Off Duty", fee: 700, rating: 4.6, exp: 9, cabin: "Cabin 305" }
];

const DEFAULT_PATIENTS = [
    { id: "PT-1001", name: "John Doe", age: 42, gender: "Male", phoneLast4: "4432", ailment: "Acute chest pressure and shortness of breath", priority: "Emergency", status: "Doctor Assigned", assignedDoctor: "Dr. Sarah Smith", bookingTime: "10:15 AM", department: "Cardiology", timestamp: Date.now() - 3600000 },
    { id: "PT-1002", name: "Eleanor Vance", age: 29, gender: "Female", phoneLast4: "8891", ailment: "Persistent migraine & optical distortion", priority: "VIP", status: "Waiting", assignedDoctor: "Dr. Michael Chen", bookingTime: "10:30 AM", department: "Neurology", timestamp: Date.now() - 2700000 },
    { id: "PT-1003", name: "David Miller", age: 55, gender: "Male", phoneLast4: "1234", ailment: "Severe knee joint pain after jogging", priority: "Regular", status: "Waiting", assignedDoctor: "Dr. James Wilson", bookingTime: "10:45 AM", department: "Orthopedics", timestamp: Date.now() - 1800000 },
    { id: "PT-1004", name: "Sophia Grace", age: 8, gender: "Female", phoneLast4: "9901", ailment: "High viral fever & wheezing cough", priority: "Emergency", status: "Waiting", assignedDoctor: "Dr. Emily Davis", bookingTime: "11:00 AM", department: "Pediatrics", timestamp: Date.now() - 900000 },
    { id: "PT-1005", name: "Marcus Brown", age: 34, gender: "Male", phoneLast4: "5543", ailment: "Annual physical review & preventative lab tests", priority: "Regular", status: "Waiting", assignedDoctor: "Dr. Aisha Patel", bookingTime: "11:15 AM", department: "General Medicine", timestamp: Date.now() - 300000 }
];

const DEFAULT_ACTIVITY = [
    { text: "Emergency patient John Doe (PT-1001) admitted", time: "10:15 AM", type: "alert" },
    { text: "Dr. Sarah Smith assigned to Cardiology Queue", time: "10:17 AM", type: "doctor" },
    { text: "Eleanor Vance booked VIP consultation for Neurology", time: "10:30 AM", type: "patient" },
    { text: "Dr. Michael Chen entered Operation Theatre (In Surgery)", time: "10:40 AM", type: "status" }
];

// ------------------------------------------------------------------------------
// 2. STATE STORE & PERSISTENCE
// ------------------------------------------------------------------------------
class Store {
    static get(key, fallback) {
        try {
            const item = localStorage.getItem(`medicore_${key}`);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    static set(key, val) {
        try {
            localStorage.setItem(`medicore_${key}`, JSON.stringify(val));
            window.dispatchEvent(new Event('medicore-local-sync'));
        } catch (e) {
            console.error('Storage write error:', e);
        }
    }

    static init() {
        if (!localStorage.getItem('medicore_doctors')) Store.set('doctors', DEFAULT_DOCTORS);
        if (!localStorage.getItem('medicore_patients')) Store.set('patients', DEFAULT_PATIENTS);
        if (!localStorage.getItem('medicore_completed')) Store.set('completed', []);
        if (!localStorage.getItem('medicore_activity')) Store.set('activity', DEFAULT_ACTIVITY);
        if (localStorage.getItem('medicore_autosort') === null) Store.set('autosort', true);
        if (!localStorage.getItem('medicore_theme')) Store.set('theme', 'light');
    }
}

// Global App Runtime State
const AppState = {
    auth: {
        isLoggedIn: false,
        role: null, // 'staff' | 'patient'
        currentUserId: null,
        currentPhone: null,
        userName: null
    },
    filterPriority: 'All',
    filterDoctorStatus: 'All',
    isAutoSort: true,
    activeAssignPatientId: null,
    activeRemovePatientId: null,
    intakeChartInstance: null,
    deptChartInstance: null
};

// ------------------------------------------------------------------------------
// 3. INITIALIZATION & STORAGE SYNC
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    Store.init();
    loadAuthState();
    loadTheme();
    setupEventListeners();
    refreshAllUI();

    if (window.lucide) lucide.createIcons();

    // Start Realtime Queue Clock simulation (updates every 5s)
    setInterval(() => {
        if (AppState.auth.isLoggedIn && AppState.auth.role === 'patient') {
            updatePatientStatusView();
        }
    }, 5000);
});

// Storage event listener for cross-tab synchronization
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('medicore_')) {
        refreshAllUI();
        showToast('Real-time sync: Hospital records updated', 'info');
    }
});

// Same-tab sync event
window.addEventListener('medicore-local-sync', () => {
    refreshAllUI();
});

function refreshAllUI() {
    AppState.isAutoSort = Store.get('autosort', true);
    updateAutoSortToggleUI();
    renderQueueTable();
    renderDoctorGrid();
    renderDashboardStats();
    renderActivityFeed();
    renderCompletedVisits();
    populateDoctorSelects();
    populateBillingPatientSelect();

    if (AppState.auth.isLoggedIn && AppState.auth.role === 'patient') {
        updatePatientHomeView();
        updatePatientStatusView();
        renderDoctorCarousel();
        renderPatientHistoryView();
    }

    if (window.lucide) lucide.createIcons();
}

// ------------------------------------------------------------------------------
// 4. AUTHENTICATION & ROLE-BASED ROUTING
// ------------------------------------------------------------------------------
function loadAuthState() {
    const savedAuth = Store.get('auth', null);
    if (savedAuth && savedAuth.isLoggedIn) {
        AppState.auth = savedAuth;
        applyRoleLayout(savedAuth.role);
    } else {
        showLoginScreen();
    }
}

function switchLoginTab(type) {
    const tabStaff = document.getElementById('tabStaff');
    const tabPatient = document.getElementById('tabPatient');
    const staffForm = document.getElementById('staffLoginForm');
    const patientForm = document.getElementById('patientLoginForm');

    if (type === 'staff') {
        tabStaff.classList.add('active');
        tabPatient.classList.remove('active');
        staffForm.style.display = 'block';
        patientForm.style.display = 'none';
    } else {
        tabPatient.classList.add('active');
        tabStaff.classList.remove('active');
        patientForm.style.display = 'block';
        staffForm.style.display = 'none';
    }
    if (window.lucide) lucide.createIcons();
}

function handleStaffLogin(e) {
    e.preventDefault();
    const user = document.getElementById('staffUser').value.trim();
    const pass = document.getElementById('staffPass').value.trim();

    if (user === 'admin' && pass === 'admin123') {
        AppState.auth = {
            isLoggedIn: true,
            role: 'staff',
            userName: 'Dr. Administrator'
        };
        Store.set('auth', AppState.auth);
        applyRoleLayout('staff');
        showToast('Authenticated as Staff Administrator', 'success');
        addActivity('Staff Administrator signed in');
    } else {
        showToast('Invalid staff credentials. Use admin / admin123', 'danger');
    }
}

function handlePatientLogin(e) {
    e.preventDefault();
    const patientId = document.getElementById('patientIdInput').value.trim().toUpperCase();
    const phone4 = document.getElementById('patientPhoneInput').value.trim();

    const patients = Store.get('patients', []);
    const match = patients.find(p => p.id === patientId && p.phoneLast4 === phone4);

    if (match) {
        AppState.auth = {
            isLoggedIn: true,
            role: 'patient',
            currentUserId: match.id,
            currentPhone: match.phoneLast4,
            userName: match.name
        };
        Store.set('auth', AppState.auth);
        applyRoleLayout('patient');
        showToast(`Welcome back, ${match.name}!`, 'success');
        addActivity(`Patient ${match.name} (${match.id}) accessed portal`);
    } else {
        showToast('Patient ID or Mobile last 4 digits not matched.', 'danger');
    }
}

function handleGuestBooking() {
    const patients = Store.get('patients', []);
    const nextNum = 1000 + patients.length + 1;
    const guestId = `PT-${nextNum}`;
    const guestPhone = "0000";

    AppState.auth = {
        isLoggedIn: true,
        role: 'patient',
        currentUserId: guestId,
        currentPhone: guestPhone,
        userName: "Guest Patient"
    };
    Store.set('auth', AppState.auth);
    applyRoleLayout('patient');
    navigatePatient('book');
    showToast(`Guest session started with ID: ${guestId}`, 'info');
}

function handleLogout() {
    AppState.auth = { isLoggedIn: false, role: null, currentUserId: null };
    localStorage.removeItem('medicore_auth');
    showLoginScreen();
    showToast('Signed out successfully.', 'info');
}

function applyRoleLayout(role) {
    const loginPage = document.getElementById('loginPage');
    const adminLayout = document.getElementById('adminLayout');
    const patientLayout = document.getElementById('patientLayout');

    loginPage.style.display = 'none';

    if (role === 'staff') {
        adminLayout.style.display = 'flex';
        patientLayout.style.display = 'none';
        navigateTo('dashboard');
        initCharts();
    } else if (role === 'patient') {
        adminLayout.style.display = 'none';
        patientLayout.style.display = 'flex';
        navigatePatient('home');
    }
    refreshAllUI();
}

function showLoginScreen() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminLayout').style.display = 'none';
    document.getElementById('patientLayout').style.display = 'none';
}

// ------------------------------------------------------------------------------
// 5. NAVIGATION CONTROLLERS
// ------------------------------------------------------------------------------
function navigateTo(pageKey) {
    const pages = document.querySelectorAll('.page-view');
    pages.forEach(p => p.classList.remove('active'));

    const target = document.getElementById(`page-${pageKey}`);
    if (target) target.classList.add('active');

    const navItems = document.querySelectorAll('.sidebar-menu .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(pageKey)) {
            item.classList.add('active');
        }
    });

    if (pageKey === 'dashboard') {
        setTimeout(initCharts, 100);
    }
    if (window.lucide) lucide.createIcons();
}

function navigatePatient(viewKey) {
    const views = document.querySelectorAll('.patient-view');
    views.forEach(v => v.classList.remove('active'));

    const target = document.getElementById(`view-patient-${viewKey}`);
    if (target) target.classList.add('active');

    const bottomTabs = document.querySelectorAll('.bottom-tab');
    bottomTabs.forEach(t => {
        t.classList.remove('active');
        if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(viewKey)) {
            t.classList.add('active');
        }
    });

    if (viewKey === 'book') {
        renderDoctorCarousel();
    } else if (viewKey === 'status') {
        updatePatientStatusView();
    } else if (viewKey === 'history') {
        renderPatientHistoryView();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) lucide.createIcons();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    Store.set('theme', next);

    const icons = ['adminThemeIcon', 'patientThemeIcon'];
    icons.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
    });
    if (window.lucide) lucide.createIcons();
}

function loadTheme() {
    const theme = Store.get('theme', 'light');
    document.documentElement.setAttribute('data-theme', theme);
    const icons = ['adminThemeIcon', 'patientThemeIcon'];
    icons.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    });
}

// ------------------------------------------------------------------------------
// 6. ADMIN QUEUE MANAGEMENT & AUTO-SORT ENGINE
// ------------------------------------------------------------------------------
function toggleAutoSort() {
    AppState.isAutoSort = !AppState.isAutoSort;
    Store.set('autosort', AppState.isAutoSort);
    updateAutoSortToggleUI();
    renderQueueTable();
    showToast(`Queue Auto-Sort set to ${AppState.isAutoSort ? 'ON (Emergency > VIP > Time)' : 'OFF (Manual Flow)'}`, 'info');
}

function updateAutoSortToggleUI() {
    const btn = document.getElementById('btnAutoSortToggle');
    const label = document.getElementById('autoSortLabel');
    if (!btn || !label) return;

    if (AppState.isAutoSort) {
        btn.classList.add('active');
        label.textContent = "Emergency > VIP > Time (ON)";
    } else {
        btn.classList.remove('active');
        label.textContent = "Arrival Time Only (OFF)";
    }
}

function sortQueuePatients(list) {
    if (!AppState.isAutoSort) {
        return [...list].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    const priorityWeight = { 'Emergency': 3, 'VIP': 2, 'Regular': 1 };
    return [...list].sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
        if (pDiff !== 0) return pDiff;
        return (a.timestamp || 0) - (b.timestamp || 0);
    });
}

function filterQueuePriority(priority) {
    AppState.filterPriority = priority;
    const tabs = document.querySelectorAll('#queuePriorityFilters .filter-tab');
    tabs.forEach(t => {
        t.classList.remove('active');
        if (t.textContent.includes(priority)) t.classList.add('active');
    });
    renderQueueTable();
}

function filterQueueTable() {
    renderQueueTable();
}

function renderQueueTable() {
    const tbody = document.getElementById('queueTableBody');
    const emptyState = document.getElementById('queueEmptyState');
    const searchVal = (document.getElementById('queueSearchInput')?.value || '').toLowerCase();

    let patients = Store.get('patients', []);

    // Filter counts
    const countAll = patients.length;
    const countEmerg = patients.filter(p => p.priority === 'Emergency').length;
    const countVIP = patients.filter(p => p.priority === 'VIP').length;
    const countReg = patients.filter(p => p.priority === 'Regular').length;

    if (document.getElementById('qCountAll')) document.getElementById('qCountAll').textContent = countAll;
    if (document.getElementById('qCountEmerg')) document.getElementById('qCountEmerg').textContent = countEmerg;
    if (document.getElementById('qCountVIP')) document.getElementById('qCountVIP').textContent = countVIP;
    if (document.getElementById('qCountReg')) document.getElementById('qCountReg').textContent = countReg;
    if (document.getElementById('sidebarQueueCount')) document.getElementById('sidebarQueueCount').textContent = countAll;

    // Apply priority filter
    if (AppState.filterPriority !== 'All') {
        patients = patients.filter(p => p.priority === AppState.filterPriority);
    }

    // Apply text search
    if (searchVal) {
        patients = patients.filter(p => p.name.toLowerCase().includes(searchVal) || p.id.toLowerCase().includes(searchVal));
    }

    // Apply auto or manual sort
    patients = sortQueuePatients(patients);

    if (patients.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = patients.map((p, index) => {
        const waitMins = calculatePatientWaitMinutes(p, patients);
        return `
            <tr class="queue-row" data-id="${p.id}">
                <td>
                    <strong>#${index + 1}</strong>
                    <div style="font-weight:700; color:var(--primary-color);">${p.id}</div>
                    <small class="text-secondary">${p.bookingTime || 'Just now'}</small>
                </td>
                <td>
                    <strong>${p.name}</strong>
                    <div class="text-secondary" style="font-size:0.78rem;">${p.age} yrs • ${p.gender}</div>
                </td>
                <td style="max-width:220px;">
                    <div style="font-size:0.85rem; line-height:1.3;">${p.ailment}</div>
                </td>
                <td>
                    <span class="priority-pill priority-${p.priority}">
                        <i data-lucide="${p.priority === 'Emergency' ? 'flame' : p.priority === 'VIP' ? 'star' : 'check'}"></i>
                        ${p.priority}
                    </span>
                </td>
                <td>
                    ${p.assignedDoctor ? `
                        <div style="font-weight:700; color:var(--text-primary);">${p.assignedDoctor}</div>
                        <small class="text-teal">${p.department || 'General'}</small>
                    ` : `
                        <button class="btn-outline btn-sm" onclick="openAssignDoctorModal('${p.id}')">
                            <i data-lucide="user-plus"></i> Allot Doctor
                        </button>
                    `}
                </td>
                <td>
                    <span class="badge ${p.status === 'Doctor Assigned' ? 'badge-primary' : p.status === 'Completed' ? 'badge-success' : 'badge-warning'}">
                        ${p.status || 'Waiting'}
                    </span>
                </td>
                <td>
                    <strong>~${waitMins}m</strong>
                </td>
                <td class="text-right">
                    <div class="table-actions">
                        <button class="icon-btn-action" title="Assign / Change Doctor" onclick="openAssignDoctorModal('${p.id}')">
                            <i data-lucide="stethoscope"></i>
                        </button>
                        <button class="icon-btn-action action-complete" title="Mark Visit Completed" onclick="completePatientVisit('${p.id}')">
                            <i data-lucide="check-circle-2"></i>
                        </button>
                        <button class="icon-btn-action action-delete" title="Remove Patient" onclick="openRemovePatientModal('${p.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderDoctorWorkloadChips();
    if (window.lucide) lucide.createIcons();
}

function calculatePatientWaitMinutes(patient, allPatients) {
    if (!allPatients) allPatients = Store.get('patients', []);
    const sorted = sortQueuePatients(allPatients);
    const myIndex = sorted.findIndex(p => p.id === patient.id);
    if (myIndex <= 0) return 5;

    // Filter patients ahead assigned to the same doctor
    const ahead = sorted.slice(0, myIndex);
    const sameDoctorAhead = ahead.filter(p => p.assignedDoctor && p.assignedDoctor === patient.assignedDoctor).length;
    const emergencyAhead = ahead.filter(p => p.priority === 'Emergency').length;

    let basePerPatient = 12; // 12 mins avg consultation
    const totalEstimate = 5 + (sameDoctorAhead * basePerPatient) + (emergencyAhead * 8);
    return Math.max(5, totalEstimate);
}

function renderDoctorWorkloadChips() {
    const container = document.getElementById('doctorWorkloadChips');
    if (!container) return;

    const doctors = Store.get('doctors', []);
    const patients = Store.get('patients', []);

    container.innerHTML = doctors.map(doc => {
        const count = patients.filter(p => p.assignedDoctor === doc.name).length;
        const isHigh = count >= 3;
        return `
            <div class="workload-chip ${isHigh ? 'high-load' : ''}">
                <i data-lucide="user-check"></i>
                <span>${doc.name}: <strong>${count} in queue</strong></span>
                ${isHigh ? '<span class="badge badge-danger">High Load</span>' : ''}
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// ------------------------------------------------------------------------------
// 7. ASSIGN DOCTOR WORKFLOW (ADMIN & STAFF)
// ------------------------------------------------------------------------------
function openAssignDoctorModal(patientId) {
    const patients = Store.get('patients', []);
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    AppState.activeAssignPatientId = patientId;
    document.getElementById('assignModalPatientName').textContent = patient.name;
    document.getElementById('assignModalPatientId').textContent = patient.id;

    const select = document.getElementById('assignModalDoctorSelect');
    const doctors = Store.get('doctors', []);

    select.innerHTML = doctors.map(d => `
        <option value="${d.name}" ${patient.assignedDoctor === d.name ? 'selected' : ''}>
            ${d.name} (${d.department}) - Fee: ₹${d.fee} [${d.status}]
        </option>
    `).join('');

    updateAssignModalDocSummary();
    select.onchange = updateAssignModalDocSummary;
    openModal('assignDoctorModal');
}

function updateAssignModalDocSummary() {
    const select = document.getElementById('assignModalDoctorSelect');
    const docName = select.value;
    const doctors = Store.get('doctors', []);
    const doc = doctors.find(d => d.name === docName);
    const box = document.getElementById('assignModalDocSummary');

    if (doc) {
        box.innerHTML = `
            <div class="invoice-meta-box mt-2">
                <div class="space-between mb-1">
                    <span>Department: <strong>${doc.department}</strong></span>
                    <span>Fee: <strong class="text-teal">₹ ${doc.fee}</strong></span>
                </div>
                <div class="space-between">
                    <span>Current Status: <span class="badge ${doc.status === 'Available' ? 'badge-success' : 'badge-warning'}">${doc.status}</span></span>
                    <span>Location: <strong>${doc.cabin || 'Cabin 104'}</strong></span>
                </div>
            </div>
        `;
    }
}

function confirmDoctorAssignment() {
    const patientId = AppState.activeAssignPatientId;
    const docName = document.getElementById('assignModalDoctorSelect').value;
    const doctors = Store.get('doctors', []);
    const doc = doctors.find(d => d.name === docName);

    let patients = Store.get('patients', []);
    const index = patients.findIndex(p => p.id === patientId);

    if (index !== -1) {
        patients[index].assignedDoctor = docName;
        patients[index].department = doc ? doc.department : patients[index].department;
        patients[index].status = 'Doctor Assigned';
        Store.set('patients', patients);

        addActivity(`Doctor ${docName} allotted to patient ${patients[index].name} (${patientId})`);
        showToast(`${docName} assigned successfully!`, 'success');
        closeModal('assignDoctorModal');
        refreshAllUI();
    }
}

function completePatientVisit(patientId) {
    let patients = Store.get('patients', []);
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    // Move to completed
    patients = patients.filter(p => p.id !== patientId);
    Store.set('patients', patients);

    let completed = Store.get('completed', []);
    const completedRecord = {
        ...patient,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        invoiceTotal: 1250,
        status: 'Completed'
    };
    completed.unshift(completedRecord);
    Store.set('completed', completed);

    addActivity(`Visit completed for ${patient.name} (${patientId})`);
    showToast(`Visit marked completed for ${patient.name}. Moved to history.`, 'success');
    refreshAllUI();
}

function openRemovePatientModal(patientId) {
    const patients = Store.get('patients', []);
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    AppState.activeRemovePatientId = patientId;
    document.getElementById('removePatientName').textContent = `${patient.name} (${patient.id})`;
    document.getElementById('btnConfirmRemoveAction').onclick = confirmRemovePatient;
    openModal('confirmRemoveModal');
}

function confirmRemovePatient() {
    const patientId = AppState.activeRemovePatientId;
    let patients = Store.get('patients', []);
    const patient = patients.find(p => p.id === patientId);

    patients = patients.filter(p => p.id !== patientId);
    Store.set('patients', patients);

    closeModal('confirmRemoveModal');
    addActivity(`Patient ${patient ? patient.name : patientId} removed from queue`);
    showToast('Patient removed from active queue.', 'info');
    refreshAllUI();
}

// ------------------------------------------------------------------------------
// 8. DOCTOR MANAGEMENT MODULE
// ------------------------------------------------------------------------------
function filterDoctorsByStatus(status) {
    AppState.filterDoctorStatus = status;
    const tabs = document.querySelectorAll('#doctorStatusFilters .filter-tab');
    tabs.forEach(t => {
        t.classList.remove('active');
        if (t.textContent === status || (status === 'All' && t.textContent.includes('All'))) {
            t.classList.add('active');
        }
    });
    renderDoctorGrid();
}

function renderDoctorGrid() {
    const container = document.getElementById('doctorGridContainer');
    if (!container) return;

    let doctors = Store.get('doctors', []);
    if (AppState.filterDoctorStatus !== 'All') {
        doctors = doctors.filter(d => d.status === AppState.filterDoctorStatus);
    }

    container.innerHTML = doctors.map(d => {
        const statusColors = {
            'Available': 'badge-success',
            'Busy': 'badge-warning',
            'In Surgery': 'badge-danger',
            'Off Duty': 'badge-outline'
        };

        return `
            <div class="doctor-card">
                <div class="doctor-card-header">
                    <div class="doctor-avatar" style="background-image: url('https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=2563eb&color=fff');"></div>
                    <div>
                        <h3>${d.name}</h3>
                        <p class="doctor-dept">${d.department} • ${d.cabin || 'Cabin 104'}</p>
                    </div>
                </div>

                <div class="doctor-metrics-line">
                    <span>Consultation: <strong>₹ ${d.fee}</strong></span>
                    <span>Rating: <strong>★ ${d.rating}</strong></span>
                    <span>Exp: <strong>${d.exp}y</strong></span>
                </div>

                <div class="doctor-status-controls">
                    <div class="status-select-wrap">
                        <select onchange="changeDoctorStatus('${d.id}', this.value)">
                            <option value="Available" ${d.status === 'Available' ? 'selected' : ''}>Available</option>
                            <option value="Busy" ${d.status === 'Busy' ? 'selected' : ''}>Busy</option>
                            <option value="In Surgery" ${d.status === 'In Surgery' ? 'selected' : ''}>In Surgery</option>
                            <option value="Off Duty" ${d.status === 'Off Duty' ? 'selected' : ''}>Off Duty</option>
                        </select>
                    </div>

                    <label class="quick-toggle-switch" onclick="toggleDoctorBusy('${d.id}')" title="Quick Toggle Available <-> Busy">
                        <i data-lucide="refresh-cw"></i> Quick Toggle
                    </label>
                </div>

                <div class="space-between items-center">
                    <span class="badge ${statusColors[d.status] || 'badge-primary'}">${d.status}</span>
                    <span class="last-updated-stamp">Updated: Just now</span>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function changeDoctorStatus(doctorId, newStatus) {
    let doctors = Store.get('doctors', []);
    const doc = doctors.find(d => d.id === doctorId);
    if (doc) {
        doc.status = newStatus;
        Store.set('doctors', doctors);
        showToast(`${doc.name} status updated to ${newStatus}`, 'success');
        addActivity(`Doctor status: ${doc.name} is now ${newStatus}`);
        refreshAllUI();
    }
}

function toggleDoctorBusy(doctorId) {
    let doctors = Store.get('doctors', []);
    const doc = doctors.find(d => d.id === doctorId);
    if (doc) {
        doc.status = doc.status === 'Available' ? 'Busy' : 'Available';
        Store.set('doctors', doctors);
        showToast(`${doc.name} toggled to ${doc.status}`, 'info');
        refreshAllUI();
    }
}

function handleAddNewDoctor(e) {
    e.preventDefault();
    const name = document.getElementById('docName').value.trim();
    const department = document.getElementById('docDept').value.trim();
    const fee = parseInt(document.getElementById('docFee').value) || 800;
    const status = document.getElementById('docStatus').value;
    const exp = parseInt(document.getElementById('docExp').value) || 8;

    let doctors = Store.get('doctors', []);
    const newDoc = {
        id: `DOC-0${doctors.length + 1}`,
        name,
        department,
        fee,
        status,
        rating: 4.8,
        exp,
        cabin: `Cabin ${100 + doctors.length + 1}`
    };

    doctors.push(newDoc);
    Store.set('doctors', doctors);

    closeModal('addDoctorModal');
    document.getElementById('newDoctorForm').reset();
    showToast(`Dr. ${name} added to hospital roster!`, 'success');
    addActivity(`New physician Dr. ${name} registered in ${department}`);
    refreshAllUI();
}

// ------------------------------------------------------------------------------
// 9. PATIENT PORTAL: LIVE STATUS & ADVANCED QUEUE PREDICTOR
// ------------------------------------------------------------------------------
function updatePatientHomeView() {
    const currentId = AppState.auth.currentUserId;
    const patients = Store.get('patients', []);
    const patient = patients.find(p => p.id === currentId);

    const greeting = document.getElementById('patientGreeting');
    if (greeting) greeting.textContent = AppState.auth.userName || 'Patient';

    const tokenBadge = document.getElementById('patientTokenBadge');
    const heroDoc = document.getElementById('patientHeroDoctor');
    const heroDept = document.getElementById('patientHeroDept');
    const heroStatus = document.getElementById('patientHeroStatus');
    const heroFee = document.getElementById('patientHeroFee');

    if (patient) {
        if (tokenBadge) tokenBadge.textContent = `Token: ${patient.id}`;
        if (heroDoc) heroDoc.textContent = patient.assignedDoctor || 'Doctor Pending Allocation';
        if (heroDept) heroDept.textContent = `${patient.department || 'General OPD'} • ${patient.priority} Priority`;
        if (heroStatus) {
            heroStatus.textContent = patient.status || 'In Queue';
            heroStatus.className = `badge ${patient.status === 'Doctor Assigned' ? 'badge-primary' : 'badge-warning'}`;
        }

        const doctors = Store.get('doctors', []);
        const doc = doctors.find(d => d.name === patient.assignedDoctor);
        const fee = doc ? doc.fee : 800;
        if (heroFee) heroFee.textContent = `₹ ${fee}`;

        updateExpectedInvoiceCard(fee, patient.priority);
    } else {
        if (tokenBadge) tokenBadge.textContent = 'No Active Visit';
        if (heroDoc) heroDoc.textContent = 'No Appointment Scheduled';
        if (heroDept) heroDept.textContent = 'Book consultation below';
        if (heroStatus) heroStatus.textContent = 'Not in Queue';
        updateExpectedInvoiceCard(800, 'Regular');
    }
}

function updateExpectedInvoiceCard(docFee, priority) {
    const regFee = 150;
    const prioritySurcharge = priority === 'Emergency' ? 1000 : (priority === 'VIP' ? 500 : 0);
    const baseSubtotal = docFee + regFee + prioritySurcharge;
    const tax = Math.round(baseSubtotal * 0.18);
    const lowEst = baseSubtotal + 250 + tax;
    const highEst = baseSubtotal + 450 + tax;

    const elDocFee = document.getElementById('estDocFee');
    const elTax = document.getElementById('estTax');
    const elRange = document.getElementById('estTotalRange');

    if (elDocFee) elDocFee.textContent = `₹ ${docFee}`;
    if (elTax) elTax.textContent = `₹ ${tax}`;
    if (elRange) elRange.textContent = `₹ ${lowEst.toLocaleString()} - ₹ ${highEst.toLocaleString()}`;
}

function updatePatientStatusView() {
    const currentId = AppState.auth.currentUserId;
    const allPatients = Store.get('patients', []);
    const patient = allPatients.find(p => p.id === currentId);

    if (!patient) {
        document.getElementById('pqRecommendedArrival').textContent = 'No active token';
        document.getElementById('pqArrivalExplanation').textContent = 'Book an appointment to begin live tracking.';
        document.getElementById('pqTokenNum').textContent = '--';
        document.getElementById('pqAheadCount').textContent = '0';
        document.getElementById('pqWaitMins').textContent = '--';
        return;
    }

    const sorted = sortQueuePatients(allPatients);
    const myIndex = sorted.findIndex(p => p.id === patient.id);
    const aheadList = sorted.slice(0, myIndex);

    const sameDoctorAhead = aheadList.filter(p => p.assignedDoctor && p.assignedDoctor === patient.assignedDoctor).length;
    const emergencyAhead = aheadList.filter(p => p.priority === 'Emergency').length;

    const waitMins = Math.max(5, (sameDoctorAhead * 12) + (emergencyAhead * 8) + 6);

    const arrivalDate = new Date(Date.now() + waitMins * 60000);
    const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    document.getElementById('pqTokenNum').textContent = patient.id;
    document.getElementById('pqAheadCount').textContent = aheadList.length;
    document.getElementById('pqWaitMins').textContent = `~${waitMins} mins`;
    document.getElementById('pqRecommendedArrival').textContent = `Arrive by ${arrivalTimeStr}`;
    document.getElementById('pqArrivalExplanation').textContent =
        `Calculated from ${sameDoctorAhead} patients ahead consulting ${patient.assignedDoctor || 'assigned doctor'}.`;

    const progressPct = Math.min(95, Math.max(15, 100 - (myIndex * 15)));
    const bar = document.getElementById('pqProgressBar');
    const pctLabel = document.getElementById('pqProgressPercent');
    if (bar) bar.style.width = `${progressPct}%`;
    if (pctLabel) pctLabel.textContent = `${progressPct}%`;

    const s1 = document.getElementById('stage1');
    const s2 = document.getElementById('stage2');
    const s3 = document.getElementById('stage3');
    const s4 = document.getElementById('stage4');

    if (patient.status === 'Waiting') {
        s1.className = 'stage-item completed';
        s2.className = 'stage-item active';
        s3.className = 'stage-item';
        s4.className = 'stage-item';
    } else if (patient.status === 'Doctor Assigned') {
        s1.className = 'stage-item completed';
        s2.className = 'stage-item completed';
        s3.className = 'stage-item active';
        s4.className = 'stage-item';
        document.getElementById('stageDocName').textContent = `${patient.assignedDoctor} (Allotted)`;
    } else if (patient.status === 'Completed') {
        s1.className = 'stage-item completed';
        s2.className = 'stage-item completed';
        s3.className = 'stage-item completed';
        s4.className = 'stage-item completed';
    }
}

// ------------------------------------------------------------------------------
// 10. PATIENT BOOKING FORM & DOCTOR CAROUSEL
// ------------------------------------------------------------------------------
function renderDoctorCarousel() {
    const container = document.getElementById('pbDoctorCarousel');
    if (!container) return;

    const dept = document.getElementById('pbDept')?.value || 'All';
    let doctors = Store.get('doctors', []);

    if (dept !== 'All') {
        doctors = doctors.filter(d => d.department === dept);
    }

    container.innerHTML = doctors.map(d => `
        <div class="patient-doc-card" id="docCard_${d.id}" onclick="selectDoctorForBooking('${d.id}', '${d.name}', ${d.fee})">
            <div class="doc-circle-avatar" style="background-image: url('https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=0d9488&color=fff');"></div>
            <h5>${d.name}</h5>
            <small>${d.department} • ★ ${d.rating}</small>
            <div class="doc-fee-badge">₹ ${d.fee}</div>
            <div class="mt-2">
                <span class="badge ${d.status === 'Available' ? 'badge-success' : 'badge-warning'}">${d.status}</span>
            </div>
        </div>
    `).join('');

    if (doctors.length > 0) {
        selectDoctorForBooking(doctors[0].id, doctors[0].name, doctors[0].fee);
    }
}

function selectDoctorForBooking(id, name, fee) {
    document.querySelectorAll('.patient-doc-card').forEach(c => c.classList.remove('selected'));
    const target = document.getElementById(`docCard_${id}`);
    if (target) target.classList.add('selected');

    document.getElementById('pbSelectedDoctor').value = name;
    updateBookingCostEstimate(fee);
}

function updateBookingCostEstimate(docFeeOverride) {
    const docName = document.getElementById('pbSelectedDoctor')?.value;
    const doctors = Store.get('doctors', []);
    const doc = doctors.find(d => d.name === docName);
    const fee = docFeeOverride !== undefined ? docFeeOverride : (doc ? doc.fee : 800);

    const urgency = document.getElementById('pbUrgency')?.value || 'Regular';
    const urgencySurcharge = urgency === 'Emergency' ? 1000 : (urgency === 'VIP' ? 500 : 0);
    const base = fee + 150 + urgencySurcharge;
    const tax = Math.round(base * 0.18);

    const low = base + 250 + tax;
    const high = base + 450 + tax;

    const priceLabel = document.getElementById('pbEstimatedPrice');
    if (priceLabel) priceLabel.textContent = `₹ ${low.toLocaleString()} - ₹ ${high.toLocaleString()}`;
}

function submitPatientBooking(e) {
    e.preventDefault();
    const name = document.getElementById('pbName').value.trim();
    const age = parseInt(document.getElementById('pbAge').value) || 28;
    const urgency = document.getElementById('pbUrgency').value;
    const dept = document.getElementById('pbDept').value;
    const doctor = document.getElementById('pbSelectedDoctor').value;
    const ailment = document.getElementById('pbAilment').value.trim();

    let patients = Store.get('patients', []);
    const nextId = `PT-${1000 + patients.length + 1}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPatient = {
        id: nextId,
        name,
        age,
        gender: "Self-Booked",
        phoneLast4: AppState.auth.currentPhone || "4432",
        ailment,
        priority: urgency,
        status: doctor ? 'Doctor Assigned' : 'Waiting',
        assignedDoctor: doctor || null,
        department: dept === 'All' ? 'General' : dept,
        bookingTime: nowTime,
        timestamp: Date.now()
    };

    patients.push(newPatient);
    Store.set('patients', patients);

    AppState.auth.currentUserId = nextId;
    AppState.auth.userName = name;
    Store.set('auth', AppState.auth);

    addActivity(`Patient ${name} booked online appointment (${nextId}) with ${doctor || 'General OPD'}`);
    showToast(`Appointment Confirmed! Assigned Token: ${nextId}`, 'success');

    navigatePatient('status');
    refreshAllUI();
}

function renderPatientHistoryView() {
    const container = document.getElementById('patientHistoryList');
    if (!container) return;

    const completed = Store.get('completed', []);
    const currentId = AppState.auth.currentUserId;
    const myHistory = completed.filter(c => c.id === currentId || AppState.auth.role === 'staff');

    if (myHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="receipt" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:12px;"></i>
                <h3>No Completed Consultations Yet</h3>
                <p class="text-secondary">Your finalized hospital discharge bills will appear here.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = myHistory.map(h => `
        <div class="patient-card mb-3">
            <div class="space-between items-center mb-2">
                <div>
                    <h4 style="font-weight:700;">Consultation with ${h.assignedDoctor || 'Physician'}</h4>
                    <small class="text-secondary">Discharged: ${h.completedAt || 'Today'}</small>
                </div>
                <span class="badge badge-success">Paid & Cleared</span>
            </div>
            <div class="estimate-divider"></div>
            <div class="space-between items-center mt-2">
                <span>Invoice Total: <strong>₹ ${h.invoiceTotal || 1250}</strong></span>
                <button class="btn-outline btn-sm" onclick="showToast('Downloading simulated PDF receipt for ${h.id}...', 'info')">
                    <i data-lucide="download"></i> Download Receipt
                </button>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

// ------------------------------------------------------------------------------
// 11. ADMIN PATIENT ADMISSION & BILLING FORM
// ------------------------------------------------------------------------------
function handleAdminRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const age = parseInt(document.getElementById('regAge').value) || 30;
    const gender = document.getElementById('regGender').value;
    const urgency = document.getElementById('regUrgency').value;
    const doctor = document.getElementById('regDoctor').value;
    const ailment = document.getElementById('regAilment').value.trim();

    let patients = Store.get('patients', []);
    const nextId = `PT-${1000 + patients.length + 1}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPatient = {
        id: nextId,
        name,
        age,
        gender,
        phoneLast4: "5555",
        ailment,
        priority: urgency,
        status: doctor ? 'Doctor Assigned' : 'Waiting',
        assignedDoctor: doctor || null,
        bookingTime: nowTime,
        timestamp: Date.now()
    };

    patients.push(newPatient);
    Store.set('patients', patients);

    document.getElementById('adminRegForm').reset();
    showToast(`Patient admitted! Token: ${nextId}`, 'success');
    addActivity(`Staff admitted patient ${name} (${nextId}) with Priority: ${urgency}`);

    navigateTo('queue');
    refreshAllUI();
}

function populateDoctorSelects() {
    const doctors = Store.get('doctors', []);
    const regDocSelect = document.getElementById('regDoctor');
    if (regDocSelect) {
        regDocSelect.innerHTML = `<option value="">-- Auto Assign Later --</option>` +
            doctors.map(d => `<option value="${d.name}">${d.name} (${d.department})</option>`).join('');
    }
}

function populateBillingPatientSelect() {
    const select = document.getElementById('billPatientSelect');
    if (!select) return;

    const patients = Store.get('patients', []);
    const completed = Store.get('completed', []);
    const all = [...patients, ...completed];

    select.innerHTML = `<option value="">-- Choose Patient --</option>` +
        all.map(p => `<option value="${p.id}">${p.name} (${p.id}) - ${p.priority}</option>`).join('');
}

function autoFillBillPatient() {
    const patientId = document.getElementById('billPatientSelect').value;
    if (!patientId) return;

    const patients = Store.get('patients', []);
    const completed = Store.get('completed', []);
    const p = [...patients, ...completed].find(item => item.id === patientId);

    if (p) {
        document.getElementById('billPatientName').value = p.name;
        document.getElementById('billEmergency').value = p.priority === 'Emergency' ? '1000' : '0';

        const doctors = Store.get('doctors', []);
        const doc = doctors.find(d => d.name === p.assignedDoctor);
        document.getElementById('billConsult').value = doc ? doc.fee : 800;
        recalcBillTotal();
    }
}

function recalcBillTotal() {
    const consult = parseFloat(document.getElementById('billConsult').value) || 0;
    const room = parseFloat(document.getElementById('billRoom').value) || 0;
    const meds = parseFloat(document.getElementById('billMeds').value) || 0;
    const emerg = parseFloat(document.getElementById('billEmergency').value) || 0;

    const subtotal = consult + room + meds + emerg;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;

    document.getElementById('billSubtotal').textContent = `₹ ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('billTax').textContent = `₹ ${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('billTotal').textContent = `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function generateInvoiceReceipt() {
    const name = document.getElementById('billPatientName').value.trim();
    if (!name) {
        showToast('Please select or enter patient name for invoice.', 'warning');
        return;
    }
    const total = document.getElementById('billTotal').textContent;
    showToast(`Invoice finalized for ${name}. Amount: ${total}`, 'success');
    addActivity(`Official tax invoice generated for ${name} (${total})`);
}

// ------------------------------------------------------------------------------
// 12. DASHBOARD KPI & CHART.JS ENGINE
// ------------------------------------------------------------------------------
function renderDashboardStats() {
    const patients = Store.get('patients', []);
    const doctors = Store.get('doctors', []);
    const completed = Store.get('completed', []);

    const emergCount = patients.filter(p => p.priority === 'Emergency').length;
    const availDocs = doctors.filter(d => d.status === 'Available').length;

    if (document.getElementById('statTotalPatients')) document.getElementById('statTotalPatients').textContent = patients.length + completed.length + 12;
    if (document.getElementById('statActiveQueue')) document.getElementById('statActiveQueue').textContent = patients.length;
    if (document.getElementById('statEmergencyCount')) document.getElementById('statEmergencyCount').textContent = emergCount;
    if (document.getElementById('statDoctorsAvail')) document.getElementById('statDoctorsAvail').textContent = `${availDocs} / ${doctors.length}`;
}

function renderActivityFeed() {
    const container = document.getElementById('activityFeed');
    if (!container) return;

    const feed = Store.get('activity', []);
    container.innerHTML = feed.slice(0, 8).map(item => `
        <div class="activity-item">
            <i data-lucide="bell"></i>
            <span>${item.text}</span>
            <time>${item.time}</time>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function renderCompletedVisits() {
    const container = document.getElementById('completedVisitsList');
    const badge = document.getElementById('completedCountBadge');
    if (!container) return;

    const completed = Store.get('completed', []);
    if (badge) badge.textContent = `${completed.length} Completed`;

    if (completed.length === 0) {
        container.innerHTML = `<p class="text-secondary p-3 text-center" style="font-size:0.85rem;">No completed patient visits today.</p>`;
        return;
    }

    container.innerHTML = completed.slice(0, 6).map(c => `
        <div class="activity-item">
            <i data-lucide="check" class="text-success"></i>
            <div>
                <strong>${c.name} (${c.id})</strong>
                <div class="text-secondary" style="font-size:0.75rem;">Seen by ${c.assignedDoctor || 'Attending Physician'}</div>
            </div>
            <time>${c.completedAt || 'Cleared'}</time>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function addActivity(text) {
    let feed = Store.get('activity', []);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    feed.unshift({ text, time, type: 'info' });
    Store.set('activity', feed);
}

function initCharts() {
    if (typeof Chart === 'undefined') return;

    const intakeCanvas = document.getElementById('intakeChart');
    if (intakeCanvas) {
        if (AppState.intakeChartInstance) AppState.intakeChartInstance.destroy();
        AppState.intakeChartInstance = new Chart(intakeCanvas, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Regular & VIP',
                        data: [18, 24, 20, 29, 32, 22, 19],
                        backgroundColor: '#2563eb',
                        borderRadius: 6
                    },
                    {
                        label: 'Emergency Cases',
                        data: [4, 6, 3, 7, 5, 8, 4],
                        backgroundColor: '#ef4444',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(0,0,0,0.05)' } }
                }
            }
        });
    }

    const deptCanvas = document.getElementById('departmentChart');
    if (deptCanvas) {
        if (AppState.deptChartInstance) AppState.deptChartInstance.destroy();
        AppState.deptChartInstance = new Chart(deptCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Gen. Medicine'],
                datasets: [{
                    data: [30, 20, 18, 22, 10],
                    backgroundColor: ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

// ------------------------------------------------------------------------------
// 13. SEARCH & RECORD FINDER
// ------------------------------------------------------------------------------
function handleGlobalSearch(e) {
    const val = e.target.value.toLowerCase();
    if (!val) return;
    navigateTo('queue');
    const qInput = document.getElementById('queueSearchInput');
    if (qInput) {
        qInput.value = val;
        filterQueueTable();
    }
}

function runDeepSearch() {
    const query = document.getElementById('deepSearchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('deepSearchResults');
    if (!resultsContainer) return;

    if (!query) {
        resultsContainer.innerHTML = '';
        return;
    }

    const patients = Store.get('patients', []);
    const completed = Store.get('completed', []);
    const all = [...patients, ...completed];

    const matches = all.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.ailment.toLowerCase().includes(query) ||
        (p.assignedDoctor && p.assignedDoctor.toLowerCase().includes(query))
    );

    if (matches.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card p-4 text-center">
                <p class="text-secondary">No records matched your search query "${query}".</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = matches.map(m => `
        <div class="card mb-3">
            <div class="space-between items-center">
                <div>
                    <h3 style="font-size:1.05rem; font-weight:700;">${m.name} (<span style="color:var(--primary-color);">${m.id}</span>)</h3>
                    <p class="text-secondary" style="font-size:0.85rem;">${m.age} yrs • ${m.gender} • Doctor: <strong>${m.assignedDoctor || 'Unassigned'}</strong></p>
                </div>
                <span class="priority-pill priority-${m.priority}">${m.priority}</span>
            </div>
            <p class="mt-2" style="font-size:0.88rem;"><strong>Diagnosis Notes:</strong> ${m.ailment}</p>
        </div>
    `).join('');
}

// ------------------------------------------------------------------------------
// 14. MODAL & TOAST UTILITIES
// ------------------------------------------------------------------------------
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
    if (window.lucide) lucide.createIcons();
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconName = type === 'success' ? 'check-circle' : (type === 'danger' ? 'alert-triangle' : 'info');
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${msg}</span>`;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3800);
}

function setupEventListeners() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}
