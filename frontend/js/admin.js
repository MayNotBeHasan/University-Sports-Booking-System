
const API_URL = 'http://localhost:5000/api';

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

const message = document.getElementById('message');

let allBookings = [];

// Authentication and admin authorization
if (!token || !user) {
    window.location.href = 'index.html';
} else if (user.role !== 'ADMIN') {
    window.location.href = 'student.html';
}

// Display messages
function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = type === 'success'
        ? 'success-message'
        : 'error-message';
}

// Escape HTML before displaying API data
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

// Format date
function formatDate(value) {
    return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Format time
function formatTime(value) {
    return new Date(value).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load facilities
async function loadFacilities() {
    const response = await fetch(`${API_URL}/facilities`);

    if (!response.ok) {
        throw new Error('Failed to load facilities');
    }

    const facilities = await response.json();

    const slotFacility = document.getElementById('slotFacility');
    const facilitiesContainer =
        document.getElementById('facilitiesContainer');

    slotFacility.innerHTML = '<option value="">Select facility</option>';

    facilities.forEach(facility => {
        const option = document.createElement('option');

        option.value = facility.id;
        option.textContent = `${facility.name} - ${facility.sport}`;

        slotFacility.appendChild(option);
    });

    if (facilities.length === 0) {
        facilitiesContainer.innerHTML = '<p>No facilities registered.</p>';
        document.getElementById('facilityCount').textContent = 0;
        return facilities;
    }

    facilitiesContainer.innerHTML = facilities.map(facility => `
        <div class="booking-card">
            <div>
                <h3>${escapeHTML(facility.name)}</h3>
                <p>Sport: ${escapeHTML(facility.sport)}</p>
                <p>Location: ${escapeHTML(facility.location)}</p>
                <p>Capacity: ${escapeHTML(facility.capacity)}</p>
            </div>
        </div>
    `).join('');

    document.getElementById('facilityCount').textContent =
        facilities.length;

    return facilities;
}

// Load all slots
async function loadSlots() {
    const response = await fetch(`${API_URL}/slots`);

    if (!response.ok) {
        throw new Error('Failed to load time slots');
    }

    const slots = await response.json();

    document.getElementById('slotCount').textContent = slots.length;
}

// Render bookings based on selected filter
function renderBookings() {
    const bookingsContainer =
        document.getElementById('bookingsContainer');

    const resultsCount =
        document.getElementById('bookingResultsCount');

    const selectedStatus =
        document.getElementById('bookingStatusFilter').value;

    const filteredBookings = selectedStatus === 'ALL'
        ? allBookings
        : allBookings.filter(
            booking => booking.status === selectedStatus
        );

    resultsCount.textContent =
        `Showing ${filteredBookings.length} of ${allBookings.length} bookings`;

    if (filteredBookings.length === 0) {
        bookingsContainer.innerHTML =
            '<p>No bookings found for this status.</p>';
        return;
    }

    bookingsContainer.innerHTML = filteredBookings.map(booking => `
        <div class="booking-card">
            <div>
                <h3>${escapeHTML(booking.facility_name)}</h3>
                <p>Student: ${escapeHTML(booking.user_name)}</p>
                <p>Sport: ${escapeHTML(booking.sport)}</p>
                <p>Date: ${formatDate(booking.start_time)}</p>
                <p>Time: ${formatTime(booking.start_time)} -
                    ${formatTime(booking.end_time)}</p>
                <p>Booking ID: ${escapeHTML(booking.id)}</p>
                <p class="booking-status ${escapeHTML(
                    booking.status.toLowerCase()
                )}">
                    ${escapeHTML(booking.status)}
                </p>
            </div>
        </div>
    `).join('');
}

// Load all bookings
async function loadBookings() {
    const response = await fetch(`${API_URL}/bookings`, {
        headers
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error('You are not authorized to view all bookings.');
    }

    if (!response.ok) {
        throw new Error('Failed to load bookings');
    }

    allBookings = await response.json();

    document.getElementById('bookingCount').textContent =
        allBookings.length;

    renderBookings();
}

// Booking filter event
document.getElementById('bookingStatusFilter').addEventListener(
    'change',
    renderBookings
);

// Add a new facility
document.getElementById('facilityForm').addEventListener(
    'submit',
    async event => {
        event.preventDefault();

        const button = document.getElementById('addFacilityButton');

        const facility = {
            name: document.getElementById('facilityName').value.trim(),
            sport: document.getElementById('facilitySport').value,
            location: document.getElementById('facilityLocation').value.trim(),
            capacity: Number(
                document.getElementById('facilityCapacity').value
            )
        };

        button.disabled = true;
        button.textContent = 'Adding...';

        try {
            const response = await fetch(`${API_URL}/facilities`, {
                method: 'POST',
                headers,
                body: JSON.stringify(facility)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add facility');
            }

            showMessage('Facility added successfully!', 'success');

            event.target.reset();

            await loadFacilities();
        } catch (error) {
            showMessage(error.message);
        } finally {
            button.disabled = false;
            button.textContent = 'Add Facility';
        }
    }
);

// Create a new time slot
document.getElementById('slotForm').addEventListener(
    'submit',
    async event => {
        event.preventDefault();

        const button = document.getElementById('createSlotButton');

        const facilityId = Number(
            document.getElementById('slotFacility').value
        );

        const date = document.getElementById('slotDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        if (!facilityId || !date || !startTime || !endTime) {
            showMessage('Please complete all slot fields.');
            return;
        }

        const start = new Date(`${date}T${startTime}:00`);
        const end = new Date(`${date}T${endTime}:00`);

        if (end <= start) {
            showMessage('End time must be later than start time.');
            return;
        }

        const slot = {
            facility_id: facilityId,
            start_time: start.toISOString(),
            end_time: end.toISOString()
        };

        button.disabled = true;
        button.textContent = 'Creating...';

        try {
            const response = await fetch(`${API_URL}/slots`, {
                method: 'POST',
                headers,
                body: JSON.stringify(slot)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create slot');
            }

            showMessage('Time slot created successfully!', 'success');

            event.target.reset();

            await loadSlots();
        } catch (error) {
            showMessage(error.message);
        } finally {
            button.disabled = false;
            button.textContent = 'Create Time Slot';
        }
    }
);

// Logout
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

// Initialize dashboard
async function initializeDashboard() {
    document.getElementById('welcomeMessage').textContent =
        `Welcome, ${user.name}!`;

    try {
        await Promise.all([
            loadFacilities(),
            loadSlots(),
            loadBookings()
        ]);
    } catch (error) {
        showMessage(error.message);
    }
}

if (token && user && user.role === 'ADMIN') {
    initializeDashboard();
}
