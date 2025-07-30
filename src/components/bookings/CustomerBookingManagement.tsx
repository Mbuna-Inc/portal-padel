import React from 'react';

export const CustomerBookingManagement: React.FC = () => {
    // Dummy data
    const bookings = [
        { id: 1, customer: 'John Doe', date: '2024-06-10', status: 'Confirmed' },
        { id: 2, customer: 'Jane Smith', date: '2024-06-12', status: 'Pending' },
    ];

    return (
        <div>
            <h2>Customer Booking Management</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking.id}>
                            <td>{booking.id}</td>
                            <td>{booking.customer}</td>
                            <td>{booking.date}</td>
                            <td>{booking.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};