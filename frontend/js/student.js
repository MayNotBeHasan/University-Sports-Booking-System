
const API_URL = 'http://localhost:5000/api';

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

const facilitySelect = document.getElementById('facilitySelect');
const dateFilter = document.getElementById('dateFilter');
const slotsContainer = document.getElementById('slotsContainer');
const bookingsContainer = document.getElementById('bookingsContainer');
const message = document.getElementById('message');

// Check authentication and role
if (!token || !user) {
    window.location.href = 'index.html';
}

if (user && user.role === 'ADMIN') {
    window.location.href = 'admin.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// Format dates and times
function formatDate(value) {
    return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Escape text before inserting it into HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

// Display messages
function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = type === 'success'
        ? 'success-message'
        : 'error-message';
}

// Load facilities
async function loadFacilities() {
    const response = await fetch(`${API_URL}/facilities`);

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    if (!response.ok) {
        throw new Error('Failed to load facilities');
    }

    const facilities = await response.json();

    facilitySelect.innerHTML = '';

    facilities.forEach(facility => {
        const option = document.createElement('option');

        option.value = facility.id;
        option.textContent = `${facility.name} - ${facility.sport}`;

        facilitySelect.appendChild(option);
    });
}

// Load and display available slots
async function loadSlots() {
    slotsContainer.innerHTML = '<p>Loading available slots...</p>';

    try {
        const response = await fetch(
            `${API_URL}/slots?available=true`
        );

        if (!response.ok) {
            throw new Error('Failed to load available slots');
        }

        const slots = await response.json();

        const selectedFacility = facilitySelect.value;
        const selectedDate = dateFilter.value;
        const now = new Date();

        const filteredSlots = slots.filter(slot => {
            const startTime = new Date(slot.start_time);

            const correctFacility =
                String(slot.facility_id) === String(selectedFacility);

            const upcoming = startTime > now;

            const correctDate = !selectedDate ||
                slot.start_time.slice(0, 10) === selectedDate;

            return correctFacility && upcoming && correctDate;
        });

        if (filteredSlots.length === 0) {
            slotsContainer.innerHTML =
                '<p>No available upcoming slots found for this facility and date.</p>';
            return;
        }

        slotsContainer.innerHTML = filteredSlots.map(slot => `
            <div class="slot-card">
                <div>
                    <h3>${escapeHTML(slot.facility_name)}</h3>
                    <p>${escapeHTML(slot.sport)}</p>
                    <p>${formatDate(slot.start_time)}</p>
                    <p>${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}</p>
                </div>

                <button
                    class="book-button"
                    data-slot-id="${slot.id}"
                >
                    Book Slot
                </button>
            </div>
        `).join('');

    } catch (error) {
        slotsContainer.textContent = error.message;
    }
}

// Load current student's bookings
async function loadBookings() {
    bookingsContainer.innerHTML = '<p>Loading your bookings...</p>';

    try {
        const response = await fetch(`${API_URL}/bookings/my`, {
            headers
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }

        const bookings = await response.json();

        if (bookings.length === 0) {
            bookingsContainer.innerHTML =
                '<p>You have not made any bookings yet.</p>';
            return;
        }

        bookingsContainer.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <div>
                    <h3>${escapeHTML(booking.facility_name)}</h3>
                    <p>${escapeHTML(booking.sport)}</p>
                    <p>${formatDate(booking.start_time)}</p>
                    <p>${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                    <p class="booking-status ${booking.status.toLowerCase()}">
                        ${escapeHTML(booking.status)}
                    </p>
                </div>

                ${booking.status === 'CONFIRMED' ? `
                    <button
                        class="cancel-button"
                        data-booking-id="${booking.id}"
                    >
                        Cancel Booking
                    </button>
                ` : ''}
            </div>
        `).join('');

    } catch (error) {
        bookingsContainer.textContent = error.message;
    }
}

// Book a slot
async function bookSlot(slotId) {
    if (!confirm('Are you sure you want to book this slot?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                slot_id: Number(slotId)
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        if (response.status === 409) {
            showMessage('This slot has already been booked by another user.');
            await loadSlots();
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || 'Booking failed');
        }

        showMessage('Booking successful!', 'success');

        await loadSlots();
        await loadBookings();

    } catch (error) {
        showMessage(error.message);
    }
}

// Cancel a booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/bookings/${bookingId}/cancel`,
            {
                method: 'PATCH',
                headers
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Cancellation failed');
        }

        showMessage('Booking cancelled successfully.', 'success');

        await loadBookings();
        await loadSlots();

    } catch (error) {
        showMessage(error.message);
    }
}

// Handle Book Slot buttons
slotsContainer.addEventListener('click', event => {
    const button = event.target.closest('.book-button');

    if (button) {
        bookSlot(button.dataset.slotId);
    }
});

// Handle Cancel Booking buttons
bookingsContainer.addEventListener('click', event => {
    const button = event.target.closest('.cancel-button');

    if (button) {
        cancelBooking(button.dataset.bookingId);
    }
});

// Reload slots when filters change
facilitySelect.addEventListener('change', loadSlots);
dateFilter.addEventListener('change', loadSlots);

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

    document.getElementById('userEmail').textContent =
        `Email: ${user.email}`;

    const today = new Date();

    const localDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    dateFilter.value = localDate;

    try {
        await loadFacilities();
        await loadSlots();
        await loadBookings();
    } catch (error) {
        showMessage(error.message);
    }
}

if (token && user && user.role !== 'ADMIN') {
    initializeDashboard();
}
