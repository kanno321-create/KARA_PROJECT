def handler(request, response):
    """Simplest possible Vercel function"""
    response.status_code = 200
    return {"status": "ok", "message": "Hello from Vercel"}