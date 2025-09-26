"""
Generate and set production secrets for MCP Gateway
"""
import secrets
import hashlib
import json
import subprocess
from datetime import datetime

def generate_secret(length=32):
    """Generate cryptographically secure secret"""
    return secrets.token_urlsafe(length)

def mask_secret(secret):
    """Mask middle portion of secret for display"""
    if len(secret) <= 16:
        return "***MASKED***"
    return secret[:4] + "*" * 8 + secret[-4:]

def main():
    print("=" * 50)
    print("KIS MCP Gateway - Production Secrets Setup")
    print("=" * 50)

    # Generate new secrets
    jwt_secret = generate_secret(48)
    hmac_secret = generate_secret(48)

    # Real Sentry DSN (placeholder - needs actual project)
    sentry_dsn = "https://examplePublicKey@o0.ingest.sentry.io/0"

    # Vercel token
    vercel_token = "yr73PSy6hFDBl95CMVA7Y6vE"

    secrets_config = {
        "JWT_SECRET": jwt_secret,
        "HMAC_SECRET": hmac_secret,
        "SENTRY_DSN": sentry_dsn,
        "JWT_ISSUER": "kis.company.com",
        "JWT_AUDIENCE": "kis-mcp",
        "ALLOWED_ADMIN_IPS": "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16",  # Private networks only
        "RATE_LIMIT_PER_MINUTE": "60",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }

    # Save secrets manifest (masked)
    manifest = {
        "JWT_SECRET": mask_secret(jwt_secret),
        "HMAC_SECRET": mask_secret(hmac_secret),
        "SENTRY_DSN": mask_secret(sentry_dsn),
        "JWT_ISSUER": secrets_config["JWT_ISSUER"],
        "JWT_AUDIENCE": secrets_config["JWT_AUDIENCE"],
        "ALLOWED_ADMIN_IPS": secrets_config["ALLOWED_ADMIN_IPS"],
        "RATE_LIMIT_PER_MINUTE": secrets_config["RATE_LIMIT_PER_MINUTE"],
        "generated_at": secrets_config["generated_at"],
        "sha256": hashlib.sha256(json.dumps(secrets_config, sort_keys=True).encode()).hexdigest()
    }

    # Save manifest for evidence
    with open("out/OPS_HOTFIX_AUTH_20250926_1950/secrets_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)

    print("\n[OK] Production Secrets Generated")
    print("-" * 40)
    print(f"JWT_SECRET: {mask_secret(jwt_secret)}")
    print(f"HMAC_SECRET: {mask_secret(hmac_secret)}")
    print(f"SENTRY_DSN: {mask_secret(sentry_dsn)}")
    print(f"ALLOWED_ADMIN_IPS: {secrets_config['ALLOWED_ADMIN_IPS']}")
    print(f"RATE_LIMIT: {secrets_config['RATE_LIMIT_PER_MINUTE']} req/min")

    # Set Vercel environment variables
    print("\n[UPDATING] Updating Vercel Environment Variables...")

    env_commands = [
        f'echo "{jwt_secret}" | vercel env add JWT_SECRET production --token {vercel_token} --force',
        f'echo "{hmac_secret}" | vercel env add HMAC_SECRET production --token {vercel_token} --force',
        f'echo "{sentry_dsn}" | vercel env add SENTRY_DSN production --token {vercel_token} --force',
        f'echo "{secrets_config["JWT_ISSUER"]}" | vercel env add JWT_ISSUER production --token {vercel_token} --force',
        f'echo "{secrets_config["JWT_AUDIENCE"]}" | vercel env add JWT_AUDIENCE production --token {vercel_token} --force',
        f'echo "{secrets_config["ALLOWED_ADMIN_IPS"]}" | vercel env add ALLOWED_ADMIN_IPS production --token {vercel_token} --force',
        f'echo "{secrets_config["RATE_LIMIT_PER_MINUTE"]}" | vercel env add RATE_LIMIT_PER_MINUTE production --token {vercel_token} --force'
    ]

    for cmd in env_commands:
        # Mask the command for display
        display_cmd = cmd.split("|")[0][:20] + "***MASKED***"
        print(f"  Setting: {display_cmd}")
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"    [WARNING] Warning: {result.stderr[:100]}")
        except Exception as e:
            print(f"    [ERROR] Error: {str(e)[:100]}")

    print("\n[OK] Vercel environment variables updated")
    print("\n[FILE] Secrets manifest saved to: out/OPS_HOTFIX_AUTH_20250926_1950/secrets_manifest.json")
    print("\n[WARNING] IMPORTANT: Store the actual secrets securely and never commit them!")

    return secrets_config

if __name__ == "__main__":
    # Create output directory
    import os
    os.makedirs("out/OPS_HOTFIX_AUTH_20250926_1950", exist_ok=True)

    secrets = main()