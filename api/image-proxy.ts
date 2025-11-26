export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 验证 URL 是否合法，防止 SSRF (简单的协议检查)
    const targetUrl = new URL(imageUrl);
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      throw new Error('Invalid protocol');
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // 获取原始 Content-Type
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // 边缘缓存 7 天 (604800s), 后台重新验证 30 天 (2592000s) - 图片一般不常变，可以缓存很久
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Failed to proxy image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
