// Vercel Serverless Function to handle Open Graph tags for WhatsApp and other bots
// This function intercepts bot requests and returns HTML with proper OG meta tags

export default async function handler(req, res) {
  // Set CORS headers to allow bot access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if it's a bot request
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|whatsapp|WhatsAppBot|Googlebot|bingbot|Slackbot|Applebot|Discordbot|TelegramBot|SkypeUriPreview|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|ia_archiver/i.test(userAgent);

    // Extract post slug from URL path
    // Vercel rewrite sends the original path in req.url
    const urlPath = req.url.split('?')[0];
    const postMatch = urlPath.match(/\/post\/([^\/]+)/);
    const slug = postMatch?.[1] || req.query?.slug;
    
    // If not a bot, return a response that loads the SPA
    // We use a query parameter to bypass the rewrite on the redirect
    if (!isBot && slug) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      // Use ?spa=true to bypass the rewrite
      const postUrl = `${baseUrl}/post/${slug}?spa=true`;
      
      // Return HTML that redirects with the spa parameter
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Loading...</title>
          <meta http-equiv="refresh" content="0; url=${postUrl}">
          <script>
            window.location.replace('${postUrl}');
          </script>
        </head>
        <body>
          <p>Loading...</p>
        </body>
        </html>
      `);
    }
    
    if (!slug) {
      // Not a post URL, return default OG tags
      return res.status(200).send(generateDefaultOG(req));
    }
    
    // Get API URL from environment or use default
    const API_BASE_URL = process.env.VITE_API_URL || 
      (process.env.VERCEL_ENV === 'production' 
        ? 'https://kr-updates-backend.vercel.app/api/v1'
        : 'http://localhost:5000/api/v1');

    // Determine if slug is ObjectId or actual slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const apiPath = isObjectId ? `posts/details/${slug}` : `posts/${slug}`;
    const apiUrl = `${API_BASE_URL}/${apiPath}`;

    // Fetch post data from backend
    let postData;
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KR-Updates-OG-Function/1.0'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      postData = await response.json();
    } catch (error) {
      console.error('[OG Function] Error fetching post:', error);
      // Return default OG tags if post fetch fails
      return res.status(200).send(generateDefaultOG(req));
    }

    // Extract post from response
    const post = postData?.data || postData;
    
    if (!post) {
      return res.status(200).send(generateDefaultOG(req));
    }

    // Get base URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const shareUrl = `${baseUrl}${urlPath}`;

    // Get image URL
    let imageUrl = post.featuredImage?.url || 
                   post.featuredVideo?.thumbnail || 
                   post.featuredVideo?.url || 
                   '';

    // Handle data URLs (WhatsApp can't fetch these)
    if (imageUrl && imageUrl.startsWith('data:')) {
      imageUrl = '';
    }

    // If no image, use default logo
    if (!imageUrl) {
      imageUrl = `${baseUrl}/favicon.png`;
    }

    // Ensure absolute URL
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      imageUrl = imageUrl.startsWith('/') 
        ? `${baseUrl}${imageUrl}` 
        : `${baseUrl}/${imageUrl}`;
    }

    // Optimize Cloudinary images for WhatsApp
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      try {
        const urlObj = new URL(imageUrl);
        const params = new URLSearchParams(urlObj.search);
        
        // Set optimal dimensions for WhatsApp (1200x630 recommended)
        params.set('w', '1200');
        params.set('h', '630');
        params.set('c', 'fill');
        params.set('f', 'auto');
        params.set('q', 'auto');
        
        urlObj.search = params.toString();
        imageUrl = urlObj.toString();
      } catch (e) {
        console.warn('[OG Function] Could not parse Cloudinary URL:', e);
      }
    }

    // Ensure HTTPS for WhatsApp compatibility
    if (imageUrl && imageUrl.startsWith('http://')) {
      imageUrl = imageUrl.replace('http://', 'https://');
    }

    // Generate title and description
    const title = post.title || 'Post - KR Updates';
    let description = post.excerpt || post.description || post.subheading || '';
    
    if (!description && post.content) {
      // Strip HTML tags and get first 200 characters
      const textContent = post.content.replace(/<[^>]*>/g, '').trim();
      description = textContent.substring(0, 200);
      if (textContent.length > 200) {
        description += '...';
      }
    }
    
    if (!description) {
      description = `Read more: ${title}`;
    }
    
    // Ensure description doesn't exceed WhatsApp's limit (200 chars)
    description = description.substring(0, 200).trim();

    // Determine image type
    const imageType = imageUrl?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Generate HTML with OG tags
    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="KR Updates">
  <meta property="og:locale" content="en_US">
  ${imageUrl ? `  <!-- Image MUST be HTTPS and publicly accessible for WhatsApp -->
  <!-- Primary OG Image Tag - MUST be first for WhatsApp -->
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:type" content="${escapeHtml(imageType)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <!-- Additional image meta for compatibility -->
  <meta name="image" content="${escapeHtml(imageUrl)}">
  <link rel="image_src" href="${escapeHtml(imageUrl)}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(shareUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ''}
  
  <!-- Additional Meta Tags -->
  <meta name="author" content="KR Updates">
  <meta name="robots" content="index, follow">
  
  <!-- Redirect to actual page for non-bots -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(shareUrl)}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="max-width: 100%; height: auto; display: block; margin: 20px 0;">` : ''}
  <p>${escapeHtml(description)}</p>
  <p><strong>Source:</strong> KR Updates</p>
  <p><a href="${escapeHtml(shareUrl)}">Read full article →</a></p>
  <script>window.location.href = '${escapeHtml(shareUrl)}';</script>
</body>
</html>`;

    // Set proper headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);

  } catch (error) {
    console.error('[OG Function] Error:', error);
    // Return default OG tags on error
    return res.status(200).send(generateDefaultOG(req));
  }
}

// Generate default OG tags for non-post pages
function generateDefaultOG(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const shareUrl = `${baseUrl}${req.url}`;
  const imageUrl = `${baseUrl}/favicon.png`;

  return `<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KR Updates - Professional News Platform</title>
  <meta name="description" content="Stay updated with the latest news and updates from KR Updates">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta property="og:title" content="KR Updates - Professional News Platform">
  <meta property="og:description" content="Stay updated with the latest news and updates from KR Updates">
  <meta property="og:site_name" content="KR Updates">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="KR Updates - Professional News Platform">
  <meta name="twitter:description" content="Stay updated with the latest news and updates from KR Updates">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  
  <meta http-equiv="refresh" content="0; url=${escapeHtml(shareUrl)}">
</head>
<body>
  <p>Redirecting...</p>
  <script>window.location.href = '${escapeHtml(shareUrl)}';</script>
</body>
</html>`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

