import { expect, test } from './support/fixtures';
import { ROUTES } from './support/site';

/** Structured data blocks of a page, parsed. */
const jsonLd = (html: string): Array<Record<string, unknown>> =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, json]) => {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [data];
  });

const meta = (html: string, attribute: 'name' | 'property', key: string) =>
  new RegExp(`<meta ${attribute}="${key}" content="([^"]*)"`).exec(html)?.[1];

test.describe('search engines and link previews', () => {
  // Pure HTTP checks: running them once is enough.
  test.skip(({ isMobile }) => isMobile, 'no layout involved');

  test('every indexable page has its own canonical URL, description and share image', async ({ request }) => {
    for (const route of ROUTES.filter((candidate) => candidate.path !== '/checkout')) {
      const html = await (await request.get(route.path)).text();
      const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
      expect(canonical, `${route.path} canonical`).toBeDefined();
      expect(new URL(canonical!).pathname, `${route.path} canonical`).toBe(route.path);
      expect(meta(html, 'name', 'description'), `${route.path} description`).toBeTruthy();
      // The share title is the page title without the " · Bugout" suffix (the home page keeps it).
      expect(route.title.startsWith(meta(html, 'property', 'og:title') ?? '-'), `${route.path} og:title`).toBe(true);
      expect(meta(html, 'property', 'og:url'), `${route.path} og:url`).toBe(canonical);
      expect(meta(html, 'property', 'og:image'), `${route.path} og:image`).toBeTruthy();
      expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image');
    }
  });

  test('share images load as PNG', async ({ request }) => {
    for (const path of ['/', '/products/kit-72h', '/faq']) {
      const html = await (await request.get(path)).text();
      const image = new URL(meta(html, 'property', 'og:image')!);
      const response = await request.get(image.pathname + image.search);
      expect(response.status(), `${path} share image`).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
    }
  });

  test('the Kit 72h page describes its variants, offers and breadcrumbs', async ({ request }) => {
    const data = jsonLd(await (await request.get('/products/kit-72h')).text());
    const group = data.find((item) => item['@type'] === 'ProductGroup') as {
      hasVariant: Array<{ size: string; offers: { price: string; shippingDetails: unknown[]; hasMerchantReturnPolicy: unknown } }>;
    };
    expect(group.hasVariant.map((variant) => [variant.size, variant.offers.price])).toEqual([
      ['1 persona', '119.00'],
      ['2 personas', '199.00'],
      ['4 personas', '359.00'],
    ]);
    expect(group.hasVariant[0].offers.shippingDetails).toHaveLength(3);
    expect(group.hasVariant[0].offers.hasMerchantReturnPolicy).toBeTruthy();
    expect(data.some((item) => item['@type'] === 'BreadcrumbList')).toBe(true);
  });

  test('the home page describes the shop and the FAQ page its questions', async ({ request }) => {
    const home = jsonLd(await (await request.get('/')).text()).map((item) => item['@type']);
    expect(home).toEqual(['OnlineStore', 'WebSite']);
    const [faq] = jsonLd(await (await request.get('/faq')).text());
    expect(faq['@type']).toBe('FAQPage');
    expect((faq.mainEntity as unknown[]).length).toBeGreaterThan(3);
  });
});
