# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Enhancements

This project has been enhanced with the following security measures:

### 1. HTTP Security Headers
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS protection
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: Enforces HTTPS connections

### 2. Input Validation
- Query parameter validation with maximum limits
- Keyword length validation (max 100 characters)
- MongoDB ObjectId format validation
- Pagination limits to prevent resource exhaustion

### 3. Environment Variables Protection
- `.env` files are properly excluded in `.gitignore`
- Sensitive credentials should never be committed to the repository

### 4. Dependencies
- Regular dependency updates recommended
- Use `npm audit` to check for vulnerabilities
- Keep Node.js/Bun runtime updated

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** open a public issue
2. Email the maintainer directly (check package.json for contact)
3. Include detailed information about the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Best Practices for Deployment

### Environment Variables
Ensure the following environment variables are properly set:
- `MONGODB_URI`: MongoDB connection string
- `OPENAI_API_KEY`: OpenAI API key
- `SLACK_BOT_TOKEN`: Slack bot token (if using Slack integration)
- `NODE_ENV`: Set to `production` in production environments

### MongoDB Security
- Use strong authentication credentials
- Enable MongoDB access control
- Use encrypted connections (TLS/SSL)
- Implement IP whitelisting
- Regular backups

### API Rate Limiting
Consider implementing rate limiting for production deployments:
- Use reverse proxy (nginx, Cloudflare)
- Implement application-level rate limiting
- Monitor API usage patterns

### HTTPS/TLS
- Always use HTTPS in production
- Obtain valid SSL certificates
- Configure proper TLS settings
- Enable HSTS headers (already included)

### Monitoring and Logging
- Monitor application logs for suspicious activity
- Set up alerts for security events
- Regular security audits
- Keep audit logs for compliance

## Security Checklist for Deployment

- [ ] All environment variables are set and secured
- [ ] `.env` file is not committed to repository
- [ ] MongoDB authentication is enabled
- [ ] HTTPS/TLS is configured
- [ ] Security headers are enabled (already done)
- [ ] Input validation is in place (already done)
- [ ] Rate limiting is configured
- [ ] Monitoring and alerting are set up
- [ ] Regular dependency updates are scheduled
- [ ] Backup strategy is implemented

## Updates

This security policy was last updated on: 2025-01-09

For questions about security, please contact the repository maintainer.
