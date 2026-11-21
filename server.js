const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());

app.post("/api/register", async (req, res) => {

    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({
            message: "Please fill in all fields."
        });
    }

    try {

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (full_name, email, password)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [full_name, email, hashedPassword],
            (err, result) => {

                if (err) {

                    console.log("REGISTRATION ERROR:", err);

                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "Email already registered."
                        });
                    }

                    return res.status(500).json({
                        message: "Registration failed."
                    });
                }

                res.status(201).json({
                    message: "Registration successful!"
                });

            }
        );

    } catch (error) {

        console.log("PASSWORD HASHING ERROR:", error);

        res.status(500).json({
            message: "Registration failed."
        });

    }

});

app.use(express.urlencoded({ extended: true }));

// Connect frontend files
app.use(express.static(__dirname));

// Home route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Get all rooms from database
app.get("/api/rooms", (req, res) => {

    const sql = "SELECT * FROM rooms";

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error fetching rooms"
            });
        }

        res.json(results);

    });

});

// Start server
// Create a new booking
app.post("/api/bookings", (req, res) => {

    const { room_id, booking_date, start_time, end_time, purpose } = req.body;

    if (!room_id || !booking_date || !start_time || !end_time || !purpose) {
        return res.status(400).json({
            message: "Please fill in all booking details."
        });
    }

    if (end_time <= start_time) {
        return res.status(400).json({
            message: "Please select a valid ending time."
        });
    }

    // Check whether the room exists
    db.query(
        "SELECT * FROM rooms WHERE room_id = ? AND availability = 'Available'",
        [room_id],
        (err, rooms) => {

            if (err) {
                return res.status(500).json({ message: "Database error." });
            }

            if (rooms.length === 0) {
                return res.status(400).json({
                    message: "This room is unavailable."
                });
            }

            // Check for overlapping approved bookings
            const checkSql = `
                SELECT booking_id FROM bookings
                WHERE room_id = ?
                AND booking_date = ?
                AND status = 'Approved'
                AND start_time < ?
                AND end_time > ?
            `;

            db.query(
                checkSql,
                [room_id, booking_date, end_time, start_time],
                (err, conflicts) => {

                    if (err) {
                        return res.status(500).json({ message: "Database error." });
                    }

                    if (conflicts.length > 0) {
                        return res.status(409).json({
                            message: "This room is already booked during that time."
                        });
                    }

                    // Insert booking into MySQL
                    const insertSql = `
                        INSERT INTO bookings
                        (room_id, booking_date, start_time, end_time, purpose)
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    db.query(
                        insertSql,
                        [room_id, booking_date, start_time, end_time, purpose],
                        (err, result) => {

                            if (err) {
                                return res.status(500).json({
                                    message: "Unable to save booking."
                                });
                            }

                            res.status(201).json({
                                message: "Booking submitted successfully!",
                                booking_id: result.insertId
                            });

                        }
                    );

                }
            );

        }
    );

});

app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter email and password."
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {

        if (err) {
            console.log("LOGIN ERROR:", err);

            return res.status(500).json({
                message: "Login failed."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = results[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    });

});


// Start server
// Get all bookings
app.get("/api/bookings", (req, res) => {

    const sql = `
        SELECT bookings.*, rooms.room_name
        FROM bookings
        JOIN rooms ON bookings.room_id = rooms.room_id
        ORDER BY bookings.booking_id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Error fetching bookings."
            });
        }

        res.json(results);

    });

});
app.post("/api/rooms", (req, res) => {

    const { room_name, category, capacity, facilities } = req.body;

    if (!room_name || !category || !capacity || !facilities) {
        return res.status(400).json({
            message: "Please fill in all room details."
        });
    }

    const sql = `
        INSERT INTO rooms (room_name, category, capacity, facilities)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [room_name, category, capacity, facilities],
        (err, result) => {

            if (err) {
                console.log("ROOM INSERT ERROR:", err);

                return res.status(500).json({
                    message: "Unable to add room."
                });
            }

            res.status(201).json({
                message: "Room added successfully!",
                room_id: result.insertId
            });

        }
    );

});
app.put("/api/rooms/:id", (req, res) => {

    const roomId = req.params.id;

    const { room_name, category, capacity, facilities } = req.body;

    const sql = `
        UPDATE rooms
        SET room_name = ?, category = ?, capacity = ?, facilities = ?
        WHERE room_id = ?
    `;

    db.query(
        sql,
        [room_name, category, capacity, facilities, roomId],
        (err, result) => {

            if (err) {
                console.log("ROOM UPDATE ERROR:", err);

                return res.status(500).json({
                    message: "Unable to update room."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Room not found."
                });
            }

            res.json({
                message: "Room updated successfully!"
            });

        }
    );

});

app.delete("/api/rooms/:id", (req, res) => {

    const roomId = req.params.id;

    const sql = "DELETE FROM rooms WHERE room_id = ?";

    db.query(sql, [roomId], (err, result) => {

        if (err) {
            console.log("ROOM DELETE ERROR:", err);

            return res.status(500).json({
                message: "Unable to delete room."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Room not found."
            });
        }

        res.json({
            message: "Room deleted successfully!"
        });

    });

});


// Approve or reject a booking
app.patch("/api/bookings/:id/status", (req, res) => {
console.log("PATCH ROUTE REACHED!");
    const bookingId = req.params.id;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
            message: "Invalid booking status."
        });
    }

    // Check whether the booking exists
    db.query(
        "SELECT * FROM bookings WHERE booking_id = ?",
        [bookingId],
        (err, bookings) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (bookings.length === 0) {
                return res.status(404).json({
                    message: "Booking not found."
                });
            }

            const booking = bookings[0];

            // Check for overlapping bookings before approval
            if (status === "Approved") {

                const checkSql = `
                    SELECT booking_id FROM bookings
                    WHERE room_id = ?
                    AND booking_date = ?
                    AND status = 'Approved'
                    AND booking_id != ?
                    AND start_time < ?
                    AND end_time > ?
                `;

                db.query(
                    checkSql,
                    [
                        booking.room_id,
                        booking.booking_date,
                        bookingId,
                        booking.end_time,
                        booking.start_time
                    ],
                    (err, conflicts) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Database error."
                            });
                        }

                        if (conflicts.length > 0) {
                            return res.status(409).json({
                                message: "Another approved booking exists during this time."
                            });
                        }

                        updateBookingStatus();
                    }
                );

            } else {
                updateBookingStatus();
            }

            function updateBookingStatus() {

                db.query(
                    "UPDATE bookings SET status = ? WHERE booking_id = ?",
                    [status, bookingId],
                    (err) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Unable to update booking."
                            });
                        }

                        res.json({
                            message: "Booking status updated successfully!"
                        });

                    }
                );

            }

        }
    );

});
app.listen(PORT, () => {
    console.log(`Campus Space Finder running at http://localhost:3000`);
});