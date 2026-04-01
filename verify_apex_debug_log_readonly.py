import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Block external domains for stability
        await page.route("**/*", lambda route: route.continue_() if "127.0.0.1" in route.request.url or "localhost" in route.request.url else route.abort())

        await page.goto("http://127.0.0.1:8000/apex-debug-log.html")

        # Generate 25,001 lines of text
        lines = [f"Line {i} |USER_DEBUG| [1]|DEBUG| This is a test line" for i in range(25001)]
        log_text = "\\n".join(lines)

        # Use JS to bypass typing 25,000 lines, simulating pasting a large log
        await page.evaluate(f'''() => {{
            const inputEl = document.getElementById('inputData');
            inputEl.value = `{log_text}`;
            const event = new Event('input', {{ bubbles: true }});
            inputEl.dispatchEvent(event);
        }}''')

        # Wait for rendering
        await page.wait_for_timeout(2000)

        await page.screenshot(path="verification_readonly.png", full_page=True)
        await browser.close()

asyncio.run(main())
