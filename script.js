// Bautagebuch Application
class BautagebuchApp {
    constructor() {
        this.data = this.loadData();
        this.currentEntryId = 0;
        this.currentDate = new Date();
        this.currentMilestoneId = 0;
        this.editingMilestoneId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadDailyEntries();
        this.setupCalendar();
        this.loadMilestones();
        this.setupAutoSave();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab.dataset.tab);
            });
        });

        // Add daily entry button
        document.getElementById('add-daily-entry').addEventListener('click', () => {
            this.addDailyEntry();
        });

        // Save data button
        document.getElementById('save-data').addEventListener('click', () => {
            this.saveData();
            this.showNotification('Daten gespeichert!', 'success');
        });

        // Export data button
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        // Import data button
        document.getElementById('import-data').addEventListener('click', () => {
            this.importData();
        });

        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Milestone management
        document.getElementById('add-milestone').addEventListener('click', () => {
            this.openMilestoneModal();
        });

        document.getElementById('save-milestone').addEventListener('click', () => {
            this.saveMilestone();
        });

        document.getElementById('cancel-milestone').addEventListener('click', () => {
            this.closeMilestoneModal();
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeMilestoneModal();
        });

        // Close modal when clicking outside
        document.getElementById('milestone-modal').addEventListener('click', (e) => {
            if (e.target.id === 'milestone-modal') {
                this.closeMilestoneModal();
            }
        });

        // Auto-save on input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.autoSave();
            }
        });
    }

    // Navigation
    setupNavigation() {
        // Set default active tab
        this.switchTab('pre-construction');
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    // Data Management
    loadData() {
        const saved = localStorage.getItem('bautagebuch-data');
        return saved ? JSON.parse(saved) : {
            preConstruction: {},
            dailyEntries: [],
            postConstruction: {},
            milestones: []
        };
    }

    saveData() {
        // Collect all form data
        this.collectFormData();
        localStorage.setItem('bautagebuch-data', JSON.stringify(this.data));
    }

    autoSave() {
        // Debounce auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveData();
        }, 2000);
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveData();
        }, 30000);
    }

    collectFormData() {
        // Collect pre-construction data
        const preConstructionForm = document.getElementById('pre-construction');
        const preConstructionInputs = preConstructionForm.querySelectorAll('input, textarea, select');
        this.data.preConstruction = {};
        
        preConstructionInputs.forEach(input => {
            if (input.type === 'file') {
                // Handle file inputs separately
                if (input.files.length > 0) {
                    this.data.preConstruction[input.id] = Array.from(input.files).map(file => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified
                    }));
                }
            } else {
                this.data.preConstruction[input.id] = input.value;
            }
        });

        // Collect post-construction data
        const postConstructionForm = document.getElementById('post-construction');
        const postConstructionInputs = postConstructionForm.querySelectorAll('input, textarea, select');
        this.data.postConstruction = {};
        
        postConstructionInputs.forEach(input => {
            if (input.type === 'file') {
                if (input.files.length > 0) {
                    this.data.postConstruction[input.id] = Array.from(input.files).map(file => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified
                    }));
                }
            } else {
                this.data.postConstruction[input.id] = input.value;
            }
        });
    }

    // Daily Entries Management
    addDailyEntry() {
        const template = document.getElementById('daily-entry-template');
        const clone = template.content.cloneNode(true);
        const entryElement = clone.querySelector('.daily-entry');
        
        // Set unique ID
        const entryId = ++this.currentEntryId;
        entryElement.dataset.entryId = entryId;
        
        // Set today's date as default
        const dateInput = entryElement.querySelector('.date-input');
        dateInput.value = new Date().toISOString().split('T')[0];
        
        // Add delete functionality
        const deleteBtn = entryElement.querySelector('.delete-entry');
        deleteBtn.addEventListener('click', () => {
            this.deleteDailyEntry(entryId);
        });

        // Add to container
        const container = document.getElementById('daily-entries');
        container.appendChild(entryElement);

        // Scroll to new entry
        entryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Focus on first input
        setTimeout(() => {
            entryElement.querySelector('textarea').focus();
        }, 100);
    }

    deleteDailyEntry(entryId) {
        if (confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
            const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
            if (entryElement) {
                entryElement.remove();
                this.data.dailyEntries = this.data.dailyEntries.filter(entry => entry.id !== entryId);
                this.saveData();
                this.showNotification('Eintrag gelöscht!', 'success');
            }
        }
    }

    loadDailyEntries() {
        const container = document.getElementById('daily-entries');
        container.innerHTML = '';

        if (this.data.dailyEntries && this.data.dailyEntries.length > 0) {
            this.data.dailyEntries.forEach(entry => {
                this.renderDailyEntry(entry);
            });
        }
    }

    renderDailyEntry(entry) {
        const template = document.getElementById('daily-entry-template');
        const clone = template.content.cloneNode(true);
        const entryElement = clone.querySelector('.daily-entry');
        
        entryElement.dataset.entryId = entry.id;
        
        // Populate fields
        const dateInput = entryElement.querySelector('.date-input');
        const weatherSelect = entryElement.querySelector('.weather-select');
        const temperatureInput = entryElement.querySelector('.temperature-input');
        const personalInput = entryElement.querySelector('.personal-input');
        const equipmentInput = entryElement.querySelector('.equipment-input');
        const materialsInput = entryElement.querySelector('.materials-input');
        const progressInput = entryElement.querySelector('.progress-input');
        const issuesInput = entryElement.querySelector('.issues-input');
        const inspectionsInput = entryElement.querySelector('.inspections-input');
        const safetyInput = entryElement.querySelector('.safety-input');
        const photoDescription = entryElement.querySelector('.photo-description');

        dateInput.value = entry.date || '';
        weatherSelect.value = entry.weather || '';
        temperatureInput.value = entry.temperature || '';
        personalInput.value = entry.personal || '';
        equipmentInput.value = entry.equipment || '';
        materialsInput.value = entry.materials || '';
        progressInput.value = entry.progress || '';
        issuesInput.value = entry.issues || '';
        inspectionsInput.value = entry.inspections || '';
        safetyInput.value = entry.safety || '';
        photoDescription.value = entry.photoDescription || '';

        // Add delete functionality
        const deleteBtn = entryElement.querySelector('.delete-entry');
        deleteBtn.addEventListener('click', () => {
            this.deleteDailyEntry(entry.id);
        });

        // Add to container
        const container = document.getElementById('daily-entries');
        container.appendChild(entryElement);
    }

    // Export/Import
    exportData() {
        this.collectFormData();
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `bautagebuch-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Daten exportiert!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        this.data = importedData;
                        this.loadDailyEntries();
                        this.populateForms();
                        this.saveData();
                        this.showNotification('Daten importiert!', 'success');
                    } catch (error) {
                        this.showNotification('Fehler beim Importieren der Daten!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    populateForms() {
        // Populate pre-construction form
        Object.keys(this.data.preConstruction || {}).forEach(key => {
            const element = document.getElementById(key);
            if (element && element.type !== 'file') {
                element.value = this.data.preConstruction[key];
            }
        });

        // Populate post-construction form
        Object.keys(this.data.postConstruction || {}).forEach(key => {
            const element = document.getElementById(key);
            if (element && element.type !== 'file') {
                element.value = this.data.postConstruction[key];
            }
        });
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            border-radius: 8px;
            padding: 1rem 1.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Utility functions
    formatDate(date) {
        return new Date(date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Calendar Functions
    setupCalendar() {
        this.renderCalendar();
        this.updateCurrentMonthYear();
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // First day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            
            const milestonesContainer = document.createElement('div');
            milestonesContainer.className = 'calendar-day-milestones';
            
            dayElement.appendChild(dayNumber);
            dayElement.appendChild(milestonesContainer);
            
            // Check if it's today
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Add milestones for this day
            this.addMilestonesToDay(dayElement, `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
            
            // Add click event to create milestone
            dayElement.addEventListener('click', () => {
                this.openMilestoneModal(dayElement.dataset.date);
            });
            
            calendarGrid.appendChild(dayElement);
        }
        
        this.updateCurrentMonthYear();
    }

    addMilestonesToDay(dayElement, date) {
        const milestones = this.data.milestones || [];
        const dayMilestones = milestones.filter(milestone => {
            const milestoneDate = new Date(milestone.date);
            const dayDate = new Date(date);
            return milestoneDate.toDateString() === dayDate.toDateString();
        });

        if (dayMilestones.length > 0) {
            dayElement.classList.add('has-milestone');
            const milestonesContainer = dayElement.querySelector('.calendar-day-milestones');
            
            dayMilestones.forEach(milestone => {
                const milestoneElement = document.createElement('div');
                milestoneElement.className = 'milestone-text';
                milestoneElement.innerHTML = `
                    <span class="milestone-dot ${milestone.category}"></span>
                    ${milestone.title}
                `;
                milestonesContainer.appendChild(milestoneElement);
            });
        }
    }

    updateCurrentMonthYear() {
        const monthNames = [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ];
        
        const monthYearElement = document.getElementById('current-month-year');
        monthYearElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    // Milestone Management
    loadMilestones() {
        const container = document.getElementById('milestones-container');
        container.innerHTML = '';

        if (this.data.milestones && this.data.milestones.length > 0) {
            this.data.milestones.forEach(milestone => {
                this.renderMilestone(milestone);
            });
        }
    }

    renderMilestone(milestone) {
        const template = document.getElementById('milestone-template');
        const clone = template.content.cloneNode(true);
        const milestoneElement = clone.querySelector('.milestone-item');
        
        milestoneElement.dataset.milestoneId = milestone.id;
        milestoneElement.dataset.status = milestone.status;
        milestoneElement.dataset.priority = milestone.priority;
        
        // Populate fields
        milestoneElement.querySelector('.milestone-title').textContent = milestone.title;
        milestoneElement.querySelector('.milestone-date').textContent = this.formatDate(milestone.date);
        milestoneElement.querySelector('.milestone-description').textContent = milestone.description;
        
        const progressFill = milestoneElement.querySelector('.progress-fill');
        const progressText = milestoneElement.querySelector('.progress-text');
        progressFill.style.width = `${milestone.progress || 0}%`;
        progressText.textContent = `${milestone.progress || 0}%`;
        
        const statusSelect = milestoneElement.querySelector('.status-select');
        statusSelect.value = milestone.status;
        
        // Add event listeners
        milestoneElement.querySelector('.edit-milestone').addEventListener('click', () => {
            this.editMilestone(milestone.id);
        });
        
        milestoneElement.querySelector('.delete-milestone').addEventListener('click', () => {
            this.deleteMilestone(milestone.id);
        });
        
        statusSelect.addEventListener('change', (e) => {
            this.updateMilestoneStatus(milestone.id, e.target.value);
        });
        
        const container = document.getElementById('milestones-container');
        container.appendChild(milestoneElement);
    }

    openMilestoneModal(selectedDate = null) {
        this.editingMilestoneId = null;
        const modal = document.getElementById('milestone-modal');
        const form = document.getElementById('milestone-form');
        
        // Reset form
        form.reset();
        
        // Set default date if provided
        if (selectedDate) {
            document.getElementById('milestone-date').value = selectedDate;
        } else {
            document.getElementById('milestone-date').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('modal-title').textContent = 'Meilenstein hinzufügen';
        modal.classList.add('show');
    }

    editMilestone(milestoneId) {
        const milestone = this.data.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;
        
        this.editingMilestoneId = milestoneId;
        const modal = document.getElementById('milestone-modal');
        const form = document.getElementById('milestone-form');
        
        // Populate form
        document.getElementById('milestone-name').value = milestone.title;
        document.getElementById('milestone-date').value = milestone.date;
        document.getElementById('milestone-description').value = milestone.description;
        document.getElementById('milestone-category').value = milestone.category;
        document.getElementById('milestone-priority').value = milestone.priority;
        document.getElementById('milestone-duration').value = milestone.duration || 1;
        
        document.getElementById('modal-title').textContent = 'Meilenstein bearbeiten';
        modal.classList.add('show');
    }

    closeMilestoneModal() {
        const modal = document.getElementById('milestone-modal');
        modal.classList.remove('show');
        this.editingMilestoneId = null;
    }

    saveMilestone() {
        const form = document.getElementById('milestone-form');
        const formData = new FormData(form);
        
        const milestoneData = {
            id: this.editingMilestoneId || this.generateId(),
            title: document.getElementById('milestone-name').value,
            date: document.getElementById('milestone-date').value,
            description: document.getElementById('milestone-description').value,
            category: document.getElementById('milestone-category').value,
            priority: document.getElementById('milestone-priority').value,
            duration: parseInt(document.getElementById('milestone-duration').value) || 1,
            status: 'planned',
            progress: 0
        };
        
        if (!this.data.milestones) {
            this.data.milestones = [];
        }
        
        if (this.editingMilestoneId) {
            // Update existing milestone
            const index = this.data.milestones.findIndex(m => m.id === this.editingMilestoneId);
            if (index !== -1) {
                this.data.milestones[index] = { ...this.data.milestones[index], ...milestoneData };
            }
        } else {
            // Add new milestone
            this.data.milestones.push(milestoneData);
        }
        
        this.saveData();
        this.loadMilestones();
        this.renderCalendar();
        this.closeMilestoneModal();
        this.showNotification('Meilenstein gespeichert!', 'success');
    }

    deleteMilestone(milestoneId) {
        if (confirm('Möchten Sie diesen Meilenstein wirklich löschen?')) {
            this.data.milestones = this.data.milestones.filter(m => m.id !== milestoneId);
            this.saveData();
            this.loadMilestones();
            this.renderCalendar();
            this.showNotification('Meilenstein gelöscht!', 'success');
        }
    }

    updateMilestoneStatus(milestoneId, status) {
        const milestone = this.data.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            milestone.status = status;
            if (status === 'completed') {
                milestone.progress = 100;
            }
            this.saveData();
            this.loadMilestones();
            this.showNotification('Status aktualisiert!', 'success');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bautagebuchApp = new BautagebuchApp();
});

// Add CSS animations for notifications and modal
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(30px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(style);
