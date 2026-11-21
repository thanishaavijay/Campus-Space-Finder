function goToLogin() {
    window.location.href = "login.html";
}
function login(event) {

    event.preventDefault();

    let email = document.getElementById("email").value;

    let password = document.getElementById("password").value;

    if (email && password) {
        alert("Login successful! Welcome to Campus Space Finder.");
        window.location.href = "dashboard.html";
    }

}
function register(event) {

    event.preventDefault();

    let name = document.getElementById("name").value;

    let email = document.getElementById("regEmail").value;

    let password = document.getElementById("regPassword").value;

    let confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {

        alert("Passwords do not match!");

    } else {

        alert("Registration successful! Welcome " + name);

        window.location.href = "dashboard.html";

    }

}
function openRooms(category) {

    window.location.href = "rooms.html?category=" + encodeURIComponent(category);

}
// Search and filter rooms

function filterRooms() {

    let input = document.getElementById("roomSearch").value.toLowerCase();

    let rooms = document.getElementsByClassName("room-card");

    for (let i = 0; i < rooms.length; i++) {

        let roomDetails = rooms[i].innerText.toLowerCase();

        if (roomDetails.includes(input)) {
            rooms[i].style.display = "block";
        } 
        else {
            rooms[i].style.display = "none";
        }
    }
}


// Book a room

function bookRoom(roomName, roomId) {

    localStorage.setItem("selectedRoom", roomName);

    localStorage.setItem("selectedRoomId", roomId);

    window.location.href = "booking.html";

}


// Filter rooms according to selected category

window.addEventListener("DOMContentLoaded", function () {

    let params = new URLSearchParams(window.location.search);

    let category = params.get("category");

    if (category) {

        let rooms = document.getElementsByClassName("room-card");

        for (let i = 0; i < rooms.length; i++) {

            if (rooms[i].dataset.category === category) {

                rooms[i].style.display = "";

            } else {

                rooms[i].style.display = "none";

            }

        }

    }

});

// Display the selected room

window.addEventListener("DOMContentLoaded", function () {

    let selectedRoom = localStorage.getItem("selectedRoom");

    let roomInput = document.getElementById("roomName");

    if (roomInput) {
        roomInput.value = selectedRoom || "";
    }

    displayBookings();

});


// Confirm a booking

async function confirmBooking(event) {

    event.preventDefault();

    let room = document.getElementById("roomName").value;
    let roomId = localStorage.getItem("selectedRoomId");

    let date = document.getElementById("bookingDate").value;
    let start = document.getElementById("startTime").value;
    let end = document.getElementById("endTime").value;
    let purpose = document.getElementById("purpose").value;

    if (!room || !roomId) {
        alert("Please select a room first!");
        return;
    }

    if (end <= start) {
        alert("Please select a valid ending time.");
        return;
    }

    try {

        let response = await fetch("/api/bookings", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                room_id: roomId,
                booking_date: date,
                start_time: start,
                end_time: end,
                purpose: purpose
            })

        });

        let result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert("Booking submitted successfully!");

        document.querySelector("form").reset();

        displayBookings();

    } catch (error) {

        console.log(error);

        alert("Unable to connect to the server.");

    }

}

// Display reservations

async function displayBookings() {

    let bookingList = document.getElementById("bookingList");

    if (!bookingList) return;

    try {

        let response = await fetch("/api/bookings");

        let bookings = await response.json();

        bookingList.innerHTML = "";

        bookings.forEach(function(booking) {

            bookingList.innerHTML += `
                <div class="room-card">

                    <h3>${booking.room_name}</h3>

                    <p>Date: ${booking.booking_date}</p>

                    <p>Time: ${booking.start_time} - ${booking.end_time}</p>

                    <p>Purpose: ${booking.purpose}</p>

                    <p>Status: ${booking.status}</p>

                </div>
            `;

        });

    } catch (error) {

        console.log("Error loading bookings:", error);

        bookingList.innerHTML = "<p>Unable to load reservations.</p>";

    }

}
// Add a new room

async function addRoom(event) {

    event.preventDefault();

    const roomName = document.getElementById("adminRoomName").value;
    const category = document.getElementById("adminCategory").value;
    const capacity = document.getElementById("adminCapacity").value;
    const facilities = document.getElementById("adminFacilities").value;

    try {

        const response = await fetch("/api/rooms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                room_name: roomName,
                category: category,
                capacity: capacity,
                facilities: facilities
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert("Room added successfully!");

        document.querySelector("form").reset();

        displayAdminRooms();

    } catch (error) {

        console.log("ADD ROOM ERROR:", error);
        alert("Unable to add room.");

    }
}


// Display rooms

async function displayAdminRooms() {

    const container = document.getElementById("adminRoomList");

    try {

        const response = await fetch("/api/rooms");
        const rooms = await response.json();

        container.innerHTML = "";

        if (rooms.length === 0) {
            container.innerHTML = "<p>No rooms added yet.</p>";
            return;
        }

        rooms.forEach(function(room) {

            container.innerHTML += `
                <div class="admin-card">

                    <h3>${room.room_name}</h3>

                    <p>Category: ${room.category}</p>

                    <p>Capacity: ${room.capacity}</p>

                    <p>Facilities: ${room.facilities}</p>

                    <p>Availability: ${room.availability}</p>

                    <button onclick="editRoom(${room.room_id})">
                        Edit
                    </button>

                    <button onclick="deleteRoom(${room.room_id})">
                        Delete
                    </button>

                </div>
            `;

        });

    } catch (error) {

        console.log("DISPLAY ROOMS ERROR:", error);
        container.innerHTML = "<p>Unable to load rooms.</p>";

    }
}

// Delete a room

async function deleteRoom(roomId) {

    const confirmDelete = confirm("Are you sure you want to delete this room?");

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(`/api/rooms/${roomId}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert("Room deleted successfully!");

        displayAdminRooms();

    } catch (error) {

        console.log("DELETE ROOM ERROR:", error);
        alert("Unable to delete room.");

    }
}


// Display student bookings to administrator

async function displayAdminBookings() {

    let container = document.getElementById("adminBookingList");

    if (!container) return;

    try {

        let response = await fetch("/api/bookings");

        let bookings = await response.json();

        container.innerHTML = "";

        if (bookings.length === 0) {
            container.innerHTML = "<p>No reservations found.</p>";
            return;
        }

        bookings.forEach(function(booking) {

            container.innerHTML += `
                <div class="admin-card">

                    <h3>${booking.room_name}</h3>

                    <p>Date: ${booking.booking_date}</p>

                    <p>Time: ${booking.start_time} - ${booking.end_time}</p>

                    <p>Purpose: ${booking.purpose}</p>

                    <p>Status: ${booking.status}</p>

                    ${booking.status === "Pending" ? `
                        <button onclick="approveBooking(${booking.booking_id})">
                            Approve
                        </button>

                        <button onclick="rejectBooking(${booking.booking_id})">
                            Reject
                        </button>
                    ` : ""}

                </div>
            `;

        });

    } catch (error) {

        console.log("Error loading bookings:", error);

        container.innerHTML = "<p>Unable to load reservations.</p>";

    }
}


// Load admin information

window.addEventListener("DOMContentLoaded", function() {
    displayAdminRooms();
    displayAdminBookings();
    addAdminRoomsToListings();
});
function addAdminRoomsToListings() {

    let rooms = JSON.parse(localStorage.getItem("adminRooms")) || [];

    let roomList = document.getElementById("roomList");

    if (!roomList) return;

    rooms.forEach(function(room) {

        roomList.innerHTML += `
            <div class="room-card" data-category="${room.category}">

                <h3>${room.name}</h3>

                <p>Category: ${room.category}</p>

                <p>Capacity: ${room.capacity}</p>

                <p>Facilities: ${room.facilities}</p>

                <p class="available">Available</p>

                <button onclick="bookRoom('${room.name}')">
                    Book Now
                </button>

            </div>
        `;

    });
}

async function editRoom(roomId) {

    const roomName = prompt("Enter new room name:");
    if (roomName === null) return;

    const category = prompt("Enter new category:");
    if (category === null) return;

    const capacity = prompt("Enter new capacity:");
    if (capacity === null) return;

    const facilities = prompt("Enter new facilities:");
    if (facilities === null) return;

    try {

        const response = await fetch(`/api/rooms/${roomId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                room_name: roomName,
                category: category,
                capacity: Number(capacity),
                facilities: facilities
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert("Room updated successfully!");

        displayAdminRooms();

    } catch (error) {

        console.log("EDIT ROOM ERROR:", error);
        alert("Unable to edit room.");

    }
}

async function approveBooking(id) {

    try {

        let response = await fetch(`/api/bookings/${id}/status`, {

            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                status: "Approved"
            })

        });

        let result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert("Booking approved successfully!");

        displayAdminBookings();

    } catch (error) {

        console.log(error);

        alert("Unable to update booking.");

    }
}
async function rejectBooking(id) {

    try {

        let response = await fetch(`/api/bookings/${id}/status`, {

            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                status: "Rejected"
            })

        });

        let result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert("Booking rejected successfully!");

        displayAdminBookings();

    } catch (error) {

        console.log(error);

        alert("Unable to update booking.");

    }
}


// Fetch rooms from MySQL database
async function loadRooms() {

    let roomList = document.getElementById("roomList");

    if (!roomList) return;

    try {

        let response = await fetch("/api/rooms");

        let rooms = await response.json();

        roomList.innerHTML = "";

        rooms.forEach(function(room) {

            let statusClass = room.availability === "Available"
                ? "available"
                : "unavailable";

            let button = room.availability === "Available"
                ? `<button onclick="bookRoom('${room.room_name}', ${room.room_id})">Book Now</button>`
                : `<button disabled>Unavailable</button>`;

            roomList.innerHTML += `
                <div class="room-card" data-category="${room.category}">

                    <h2>${room.room_name}</h2>

                    <p>Category: ${room.category}</p>

                    <p>Capacity: ${room.capacity} students</p>

                    <p>Facilities: ${room.facilities}</p>

                    <p class="${statusClass}">${room.availability}</p>

                    ${button}

                </div>
            `;

        });

    } catch (error) {

        console.log("Error loading rooms:", error);

        roomList.innerHTML = "<p>Unable to load campus spaces.</p>";

    }
}


// Search rooms
function filterRooms() {

    let input = document.getElementById("roomSearch").value.toLowerCase();

    let rooms = document.getElementsByClassName("room-card");

    for (let i = 0; i < rooms.length; i++) {

        let details = rooms[i].innerText.toLowerCase();

        rooms[i].style.display = details.includes(input) ? "block" : "none";

    }
}


// Load rooms when page opens
document.addEventListener("DOMContentLoaded", loadRooms);

async function register(event) {

    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {

        const response = await fetch("/api/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                full_name: name,
                email: email,
                password: password
            })

        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        alert("Registration successful!");

        window.location.href = "login.html";

    } catch (error) {

        console.log("REGISTRATION ERROR:", error);
        alert("Unable to register. Please try again.");

    }
}
async function login(event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        // Store the logged-in user's details
        localStorage.setItem("loggedInUser", JSON.stringify(result.user));

        alert("Login successful! Welcome, " + result.user.full_name);

        if (result.user.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "dashboard.html";
        }

    } catch (error) {

        console.log("LOGIN ERROR:", error);
        alert("Unable to login. Please try again.");

    }
}