# CharterHub API Documentation

## Authentication
All API endpoints require JWT authentication.

### Get JWT Token
```
POST /wp-json/jwt-auth/v1/token
```
Request body:
```json
{
  "username": "user@example.com",
  "password": "password"
}
```

## Endpoints

### Yachts

#### List Yachts
```
GET /wp-json/charterhub/v1/yachts
```
Query parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10)
- `search`: Search term
- `destination`: Destination ID
- `available_from`: Date (YYYY-MM-DD)
- `available_to`: Date (YYYY-MM-DD)

#### Get Yacht
```
GET /wp-json/charterhub/v1/yachts/{id}
```

#### Create Yacht
```
POST /wp-json/charterhub/v1/yachts
```
Request body:
```json
{
  "name": "Yacht Name",
  "description": "Description",
  "specifications": {
    "length": "24m",
    "capacity": 12,
    "crew": 4
  },
  "pricing": {
    "base_price": 5000,
    "currency": "USD"
  }
}
```

### Bookings

#### List Bookings
```
GET /wp-json/charterhub/v1/bookings
```
Query parameters:
- `customer_id`: Filter by customer
- `yacht_id`: Filter by yacht
- `status`: Booking status

#### Create Booking
```
POST /wp-json/charterhub/v1/bookings
```
Request body:
```json
{
  "yacht_id": 123,
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "guests": 8,
  "special_requests": "Special dietary requirements"
}
```

### Destinations

#### List Destinations
```
GET /wp-json/charterhub/v1/destinations
```

#### Get Destination
```
GET /wp-json/charterhub/v1/destinations/{id}
```

### Documents

#### Upload Document
```
POST /wp-json/charterhub/v1/documents
```
Multipart form data:
- `file`: Document file
- `type`: Document type
- `related_id`: Related entity ID

#### Get Document
```
GET /wp-json/charterhub/v1/documents/{id}
```

## Error Responses
```json
{
  "code": "error_code",
  "message": "Error description",
  "status": 400
}
```

Common error codes:
- `invalid_credentials`: Authentication failed
- `insufficient_permissions`: Not authorized
- `resource_not_found`: Requested resource doesn't exist
- `validation_error`: Invalid input data

## Rate Limiting
- 1000 requests per hour per API token
- Rate limit headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset` 