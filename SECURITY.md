# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active |

## Reporting a Vulnerability

If you discover a security vulnerability in VisualPC, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email the maintainers directly with:
- A description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to provide a fix within 7 days for critical issues.

## Security Best Practices

When deploying VisualPC:

1. **Never commit `.env` files** — use `.env.example` as a template
2. **Rotate all secrets** before any production deployment
3. **Use strong passwords** for `ADMIN_BOOTSTRAP_PASSWORD`, `VISUALPC_SECRET_KEY`, and `NEXTAUTH_SECRET`
4. **Generate fresh TLS certificates** using `certs/generate_cert.py` — never reuse certificates
5. **Restrict CORS origins** in production — only allow your actual frontend domain
6. **Use HTTPS** in production with proper TLS certificates
7. **Keep dependencies updated** — run `pip install --upgrade` and `npm audit fix` regularly
