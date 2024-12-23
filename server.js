import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin()); // Enable stealth mode

const app = express();
app.use(express.static('public')); // Serve frontend files
app.use(express.json()); // Allow JSON parsing

app.post('/fetchSkuUpc', async (req, res) => {
    console.log("Received request at /fetchSkuUpc");
    const { url } = req.body;
    console.log("Fetching URL:", url);

    try {
        const browser = await puppeteer.launch({
            headless: true, // Run in headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Sandbox flags for compatibility
        });
        const page = await browser.newPage();

        // Set a User-Agent to look like a real browser
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        );

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Log the rendered HTML
        const renderedHTML = await page.content();
        console.log("Rendered HTML:", renderedHTML);

        // Extract JSON from the <script> tag
        const jsonData = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const jsonScript = scripts.find(script => script.innerText.includes('"@type":"Product"'));
            return jsonScript ? jsonScript.innerText : null;
        });

        if (jsonData) {
            console.log("JSON Data Found:", jsonData);
            const parsedData = JSON.parse(jsonData);
            const sku = parsedData.sku || null;
            const upc = parsedData.gtin13 || null;

            console.log("Extracted SKU:", sku);
            console.log("Extracted UPC:", upc);

            await browser.close();

            if (sku && upc) {
                return res.json({ sku, upc });
            } else {
                return res.status(404).json({ error: "SKU or UPC not found." });
            }
        } else {
            console.error("No JSON Data Found.");
            await browser.close();
            return res.status(404).json({ error: "SKU or UPC not found." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Failed to fetch product details." });
    }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
