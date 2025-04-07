# User Roles & Permissions for CharterHub

## Admin Roles

### Super Admin
- Complete access to all features and functionality
- Can manage all bookings, customers, and documents
- Can configure system settings
- Can manage other admin users
- Can view all analytics and reports
- Can manage yacht and destination data
- Can set global pricing rules

### Booking Manager
- Create, edit, and delete bookings
- Add customers to bookings
- Upload and manage booking documents
- Set booking status
- View customer information
- Manage guest lists
- Handle special requests
- Generate booking confirmations
- Send customer notifications
- View booking reports
- Cannot modify system settings

### Document Manager
- Upload and manage documents
- Set document visibility
- View booking information
- Track document versions
- Set document expiry
- Generate document previews
- Cannot create or modify bookings
- Cannot modify customer information
- Cannot access system settings

## Customer Roles

### Main Charterer
- View booking details for bookings where they are the main charterer
- Upload required documents
- View all documents shared with main charterers
- Update personal information
- Invite guests (optional feature)
- Submit special requests
- View payment information
- Access booking history
- Receive booking notifications

### Guest
- View booking details for bookings where they are listed as a guest
- Upload personal documents (passports, etc.)
- View documents specifically shared with guests
- Update personal information
- View shared booking information
- Receive relevant notifications

## Permission Matrix

| Permission                | Super Admin | Booking Manager | Document Manager | Main Charterer | Guest |
|---------------------------|-------------|-----------------|------------------|----------------|-------|
| Create Booking            | ✓           | ✓               |                  |                |       |
| Edit Booking              | ✓           | ✓               |                  |                |       |
| Delete Booking            | ✓           | ✓               |                  |                |       |
| View All Bookings         | ✓           | ✓               | ✓                |                |       |
| View Own Bookings         | ✓           | ✓               | ✓                | ✓              | ✓     |
| Add Customers to Booking  | ✓           | ✓               |                  |                |       |
| Manage Guest List         | ✓           | ✓               |                  |                |       |
| Set Booking Status        | ✓           | ✓               |                  |                |       |
| Handle Special Requests   | ✓           | ✓               |                  | ✓              |       |
| Upload Documents          | ✓           | ✓               | ✓                | ✓              | ✓     |
| Delete Documents          | ✓           | ✓               | ✓                |                |       |
| Set Document Visibility   | ✓           | ✓               | ✓                |                |       |
| Manage Document Versions  | ✓           | ✓               | ✓                |                |       |
| View Payment Info         | ✓           | ✓               |                  | ✓              |       |
| Manage System Settings    | ✓           |                 |                  |                |       |
| Manage Admin Users        | ✓           |                 |                  |                |       |
| View Reports              | ✓           | ✓               |                  |                |       |
| Send Notifications        | ✓           | ✓               |                  |                |       |
| Manage Yacht Data         | ✓           | ✓               |                  |                |       |
| Set Pricing Rules         | ✓           |                 |                  |                |       |
``` 