# Vercel Domain Setup for CharterHub

This document outlines the steps to configure CharterHub with separate domains for the admin and client interfaces.

## Overview

CharterHub will be accessible through two separate domains:
- **Client Interface**: `app.yachtstory.be`
- **Admin Interface**: `admin.yachtstory.be`

Both domains will point to the same Vercel deployment, but the application will determine which interface to display based on the domain.

## Domain Configuration Steps

### 1. Purchase and Configure Domain (yachtstory.be)

1. Purchase the `yachtstory.be` domain through a domain registrar (e.g., Namecheap, GoDaddy)
2. Access your domain's DNS management panel

### 2. Set Up Vercel Project

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your CharterHub project
3. Navigate to "Settings" > "Domains"

### 3. Add Both Domains to Vercel

1. In the "Domains" section, click "Add"
2. Enter `admin.yachtstory.be` and click "Add"
3. Repeat for `app.yachtstory.be`

Vercel will provide the necessary DNS records to set up for each domain. Typically, these will be:

- Type: `CNAME`
- Name: `admin` (for admin.yachtstory.be) or `app` (for app.yachtstory.be)
- Value: `cname.vercel-dns.com`
- TTL: Automatic or 3600

### 4. Configure DNS Records

1. Go to your domain registrar's DNS management panel
2. Add the CNAME records as provided by Vercel:
   - `admin.yachtstory.be` → `cname.vercel-dns.com`
   - `app.yachtstory.be` → `cname.vercel-dns.com`
3. Wait for DNS propagation (can take up to 48 hours, but usually faster)

### 5. Verify Domain Connection

1. In Vercel's "Domains" section, both domains should show as "Valid Configuration"
2. If there are issues, Vercel will provide guidance on how to fix them

## Application Changes

The application has been updated to support domain-based routing:

1. **Domain Detection**: The application checks the current domain to determine whether to show the admin or client interface
2. **Redirection Logic**: Users are automatically redirected to the appropriate domain based on their role
3. **Authentication Flow**: Login redirects users to the correct domain based on their permissions

## Testing Your Configuration

1. Visit `app.yachtstory.be` - you should see the client interface
2. Visit `admin.yachtstory.be` - you should see the admin interface
3. Test login on both domains:
   - Admin users logging in to `app.yachtstory.be` should be redirected to `admin.yachtstory.be`
   - Client users logging in to `admin.yachtstory.be` should be redirected to `app.yachtstory.be`

## Troubleshooting

### Domain Verification Issues

If Vercel shows issues with domain verification:

1. Ensure the DNS records are correctly set up at your domain registrar
2. Check that you've used the exact values provided by Vercel
3. Allow sufficient time for DNS propagation

### Infinite Redirects

If you experience redirect loops:

1. Clear browser cookies and cache
2. Check the domain detection logic in the application
3. Verify that the authentication state is being correctly preserved

### 404 Errors

If pages return 404 errors:

1. Verify that the Vercel deployment includes the `vercel.json` configuration
2. Check that all routes properly redirect to `index.html`
3. Ensure your build process is correctly configured

## Additional Resources

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [DNS Configuration Guide](https://vercel.com/docs/concepts/projects/domains/troubleshooting) 