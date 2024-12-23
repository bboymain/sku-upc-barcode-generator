export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { url } = req.body;

        // Your existing logic to fetch SKU and UPC
        try {
            const fetch = await import('node-fetch');
            const puppeteer = await import('puppeteer');

            const browser = await puppeteer.default.launch();
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const renderedHTML = await page.content();

            await browser.close();

            const skuMatch = renderedHTML.match(/"sku":"(\d+)"/);
            const upcMatch = renderedHTML.match(/"gtin13":"(\d+)"/);

            const sku = skuMatch ? skuMatch[1] : null;
            const upc = upcMatch ? upcMatch[1] : null;

            if (sku && upc) {
                res.status(200).json({ sku, upc });
            } else {
                res.status(404).json({ error: 'SKU or UPC not found.' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch product details.' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
