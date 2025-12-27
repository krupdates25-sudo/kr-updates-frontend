// Vite plugin to serve Open Graph HTML for bots
import http from 'http';
import https from 'https';
import { URL } from 'url';

export default function ogPlugin() {
  return {
    name: 'og-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Check if it's a bot request
        const userAgent = req.headers['user-agent'] || '';
        // WhatsApp uses specific user agents - be more specific
        // WhatsApp crawler user agents: WhatsApp, WhatsAppBot, WhatsApp/2.x
        const isBot = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|whatsapp|WhatsAppBot|Googlebot|bingbot|Slackbot|Applebot|Discordbot|TelegramBot|SkypeUriPreview|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|ia_archiver/i.test(userAgent);
        
        // Parse query parameters from URL (Vite middleware doesn't have req.query)
        let isQueryParamBot = false;
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          isQueryParamBot = urlObj.searchParams.has('_escaped_fragment_') || urlObj.searchParams.has('fbclid');
        } catch (e) {
          // If URL parsing fails, check manually
          isQueryParamBot = req.url.includes('_escaped_fragment_') || req.url.includes('fbclid');
        }
        
        // Log for debugging
        if (userAgent.includes('WhatsApp') || userAgent.includes('whatsapp')) {
          console.log('[OG Plugin] WhatsApp crawler detected:', userAgent);
          console.log('[OG Plugin] Request URL:', req.url);
        }
        
        // Check if it's a post URL
        const postMatch = req.url.match(/^\/post\/([^\/]+)/);
        
        if ((isBot || isQueryParamBot) && postMatch) {
          const slug = postMatch[1];
          try {
            // Fetch post data from backend
            const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';
            const apiUrl = new URL(`${API_BASE_URL}/posts/${slug}`);
            const client = apiUrl.protocol === 'https:' ? https : http;
            
            const postData = await new Promise((resolve, reject) => {
              const request = client.get(apiUrl, {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'KR-Updates-OG-Plugin/1.0'
                }
              }, (response) => {
                // Handle non-200 status codes
                if (response.statusCode !== 200) {
                  reject(new Error(`API returned status ${response.statusCode}`));
                  return;
                }
                
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                  try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                  } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                  }
                });
              });
              request.on('error', (err) => {
                reject(new Error(`Request error: ${err.message}`));
              });
              request.setTimeout(10000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
              });
            });
            
            if (postData && postData.data) {
              const post = postData.data;
              
              if (post) {
                // Get image URL and ensure it's absolute
                let imageUrl = post.featuredImage?.url || post.featuredVideo?.thumbnail || post.featuredVideo?.url || '';
                
                // Ensure image URL is absolute (Cloudinary URLs should already be absolute, but double-check)
                if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                  // If relative, make it absolute (shouldn't happen with Cloudinary, but just in case)
                  imageUrl = `https://${imageUrl}`;
                }
                
                // For Cloudinary URLs, ensure proper format for WhatsApp
                if (imageUrl && imageUrl.includes('cloudinary.com')) {
                  try {
                    const urlObj = new URL(imageUrl);
                    // Remove fragments
                    urlObj.hash = '';
                    
                    // WhatsApp requires:
                    // 1. HTTPS (already should be)
                    // 2. Minimum 200x200, recommended 1200x630
                    // 3. Supported formats: JPEG, PNG, GIF, WebP
                    // 4. Simple, clean URLs work best
                    
                    // Parse Cloudinary URL structure:
                    // https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}
                    // or
                    // https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
                    
                    const pathParts = urlObj.pathname.split('/').filter(p => p); // Remove empty strings
                    
                    // Find cloud_name (it's after 'res.cloudinary.com' in the hostname, but in path it's the first part)
                    // Actually, cloud_name is in the hostname: res.cloudinary.com/{cloud_name}/...
                    // But in URL parsing, it's in the pathname as the first segment
                    const cloudNameIndex = pathParts.findIndex(p => p === 'image');
                    
                    if (cloudNameIndex > 0) {
                      const cloudName = pathParts[cloudNameIndex - 1]; // Cloud name is before 'image'
                      const uploadIndex = pathParts.indexOf('upload');
                      
                      if (uploadIndex !== -1 && uploadIndex < pathParts.length - 1) {
                        // Get everything after 'upload'
                        const afterUpload = pathParts.slice(uploadIndex + 1);
                        
                        // Find public_id (skip version if present, get the actual file)
                        let publicId = '';
                        let foundPublicId = false;
                        
                        for (let i = 0; i < afterUpload.length; i++) {
                          const part = afterUpload[i];
                          // Version is like 'v1234567890', skip it
                          if (part.match(/^v\d+$/)) {
                            continue;
                          }
                          // This should be the public_id (might have extension)
                          publicId = afterUpload.slice(i).join('/');
                          foundPublicId = true;
                          break;
                        }
                        
                        if (foundPublicId && publicId) {
                          // Build clean URL with transformations
                          // Format: https://res.cloudinary.com/{cloud_name}/image/upload/w_1200,h_630,c_fill,f_auto,q_auto/{public_id}
                          imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,f_auto,q_auto/${publicId}`;
                          
                          console.log('[OG Plugin] ✅ Rebuilt Cloudinary URL for WhatsApp:', imageUrl);
                        } else {
                          // Fallback: use original URL with query params
                          const params = new URLSearchParams();
                          params.set('w', '1200');
                          params.set('h', '630');
                          params.set('c', 'fill');
                          params.set('f', 'auto');
                          params.set('q', 'auto');
                          urlObj.search = params.toString();
                          imageUrl = urlObj.toString();
                          console.log('[OG Plugin] ⚠️ Using query params fallback:', imageUrl.substring(0, 100) + '...');
                        }
                      } else {
                        // Can't find upload, use original with query params
                        const params = new URLSearchParams();
                        params.set('w', '1200');
                        params.set('h', '630');
                        params.set('c', 'fill');
                        params.set('f', 'auto');
                        params.set('q', 'auto');
                        urlObj.search = params.toString();
                        imageUrl = urlObj.toString();
                        console.log('[OG Plugin] ⚠️ Using query params (no upload found):', imageUrl.substring(0, 100) + '...');
                      }
                    } else {
                      // Can't find cloud name, use original URL with query params
                      const params = new URLSearchParams();
                      params.set('w', '1200');
                      params.set('h', '630');
                      params.set('c', 'fill');
                      params.set('f', 'auto');
                      params.set('q', 'auto');
                      urlObj.search = params.toString();
                      imageUrl = urlObj.toString();
                      console.log('[OG Plugin] ⚠️ Using query params (no cloud name found):', imageUrl.substring(0, 100) + '...');
                    }
                    
                    // Ensure HTTPS
                    if (imageUrl.startsWith('http://')) {
                      imageUrl = imageUrl.replace('http://', 'https://');
                    }
                    
                  } catch (e) {
                    // If URL parsing fails, use original but ensure HTTPS
                    console.warn('[OG Plugin] ⚠️ Could not parse Cloudinary URL, using original:', e.message);
                    if (imageUrl.startsWith('http://')) {
                      imageUrl = imageUrl.replace('http://', 'https://');
                    }
                    console.log('[OG Plugin] Using original URL:', imageUrl.substring(0, 100) + '...');
                  }
                } else if (imageUrl) {
                  // For non-Cloudinary URLs, ensure HTTPS
                  if (imageUrl.startsWith('http://')) {
                    imageUrl = imageUrl.replace('http://', 'https://');
                  }
                }
                
                // Log for debugging
                console.log('[OG Plugin] Post found:', {
                  title: post.title,
                  imageUrl: imageUrl,
                  hasImage: !!imageUrl,
                  imageUrlLength: imageUrl?.length || 0,
                  originalImageUrl: post.featuredImage?.url || post.featuredVideo?.thumbnail || post.featuredVideo?.url
                });
                
                const title = `${post.title} - KR Updates`;
                const description = post.excerpt || post.description || post.title;
                
                // Build URL dynamically from request headers
                const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http') || 'https';
                const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
                const baseUrl = `${protocol}://${host}`;
                const url = `${baseUrl}${req.url}`;
                
                // Log the final HTML being served (for debugging)
                console.log('[OG Plugin] Serving OG HTML with image:', imageUrl);
                
                const html = `<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="KR Updates">
  <meta property="og:locale" content="en_US">
  ${imageUrl ? `  <!-- Image MUST be HTTPS and publicly accessible for WhatsApp -->
  <!-- Primary OG Image Tag - MUST be first for WhatsApp -->
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(post.title || 'Post image')}">
  <!-- Additional image meta for compatibility -->
  <meta name="image" content="${escapeHtml(imageUrl)}">
  <link rel="image_src" href="${escapeHtml(imageUrl)}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(url)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ''}
  
  <!-- Additional Meta Tags -->
  <meta name="author" content="KR Updates">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h1>${escapeHtml(post.title)}</h1>
  ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(post.title || 'Post image')}" style="max-width: 100%; height: auto; display: block; margin: 20px 0; border: 1px solid #ddd; border-radius: 8px;" loading="eager" fetchpriority="high">` : ''}
  <p>${escapeHtml(description)}</p>
  <p><strong>Source:</strong> KR Updates</p>
  <p><a href="${escapeHtml(url)}">Read full article →</a></p>
</body>
</html>`;
                
                // Set proper headers - WhatsApp needs public access
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'public, max-age=3600'); // Allow caching but refresh after 1 hour
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-Frame-Options', 'SAMEORIGIN');
                // Important: Don't block WhatsApp crawler
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.statusCode = 200;
                
                // Log what we're sending for debugging
                if (imageUrl) {
                  console.log('[OG Plugin] ✅ Sending HTML with image:', imageUrl.substring(0, 100) + '...');
                } else {
                  console.log('[OG Plugin] ⚠️ Sending HTML WITHOUT image');
                }
                
                // Ensure response is properly sent
                res.writeHead(200);
                res.end(html);
                return; // Explicitly return to prevent further middleware execution
              }
            }
          } catch (error) {
            console.error('[OG Plugin] Error generating OG HTML:', error);
            // If there's an error, continue to next middleware instead of breaking
            // This ensures the app still works even if OG generation fails
            next();
            return;
          }
        } else {
          // Not a bot request or not a post URL, continue normally
          next();
        }
      });
    }
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

