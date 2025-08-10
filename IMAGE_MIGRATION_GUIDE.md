# Image Migration Guide: From Mock to Shopify Products

## Overview
This guide explains how to replace the mock image system with actual Shopify product images in your Mini app.

## Current Image System

### Mock Data Structure
The app currently uses mock data in `src/data/mockData.ts` with:
- **Company logos**: External URLs from various sources
- **Style icons**: Flaticon URLs for style categories
- **Clothing images**: Unsplash URLs via `getClothingImage()` helper

### Image Sources
```typescript
// Current mock image sources
companies: [
  { id: 'nike', name: 'Nike', logoUrl: 'https://example.com/nike-logo.png' }
]

styles: [
  { id: 'shirts', name: 'Shirts', iconUrl: 'https://cdn-icons.flaticon.com/shirt-icon.png' }
]

// Clothing items use Unsplash images
getClothingImage: (brand: string, style: string, subStyle: string) => 
  `https://images.unsplash.com/photo-...`
```

## New Shopify Image System

### 1. Product Image Extraction
The `useShopifyProducts` hook now extracts images from Shopify products:

```typescript
// From useShopifyProducts.ts
const extractProductImage = (product: Product): string => {
  if (product.featuredImage?.url) {
    return product.featuredImage.url
  }
  
  if (product.images?.edges?.[0]?.node?.url) {
    return product.images.edges[0].node.url
  }
  
  return '' // Will trigger placeholder
}
```

### 2. Image Optimization
Shopify CDN images are automatically optimized:

```typescript
// Automatic optimization for Shopify images
const optimizedUrl = optimizeImageUrl(shopifyImageUrl, {
  width: 96,
  height: 96,
  quality: 80,
  format: 'webp'
})
```

### 3. Fallback System
When Shopify images fail, the system shows intelligent placeholders:

```typescript
// Smart placeholders based on clothing category
const placeholder = getPlaceholderImage(styleId, subStyleId)
```

## Migration Steps

### Step 1: Update Shopify Product Search
Ensure your Shopify products have proper tags and collections:

```typescript
// In Shopify admin, tag products with:
// - Brand: nike, adidas, under-armour, lululemon, uniqlo
// - Style: shirts, pants, shorts, jackets
// - SubStyle: crew-neck, v-neck, jeans, joggers, etc.
```

### Step 2: Test Product Image Extraction
Verify that your Shopify products return images:

```typescript
// In useShopifyProducts hook
console.log('Shopify products:', products)
console.log('Extracted images:', products.map(p => extractProductImage(p)))
```

### Step 3: Update Mock Data (Optional)
You can gradually replace mock data while keeping fallbacks:

```typescript
// In mockData.ts, update getClothingImage to use Shopify first
export const getClothingImage = async (
  brand: string, 
  style: string, 
  subStyle: string
): Promise<string> => {
  // Try Shopify first
  const shopifyImage = await getShopifyProductImage(brand, style, subStyle)
  if (shopifyImage) return shopifyImage
  
  // Fallback to Unsplash
  return getUnsplashFallback(brand, style, subStyle)
}
```

### Step 4: Remove Mock Dependencies
Once Shopify images are working, remove mock image URLs:

```typescript
// Remove from mockData.ts
// - Unsplash image URLs
// - External company logos
// - Style/substyle icon URLs
```

## Image Quality & Performance

### Shopify CDN Benefits
- **Automatic optimization**: WebP format, responsive images
- **Global CDN**: Fast loading worldwide
- **Image transformations**: On-the-fly resizing and cropping

### Performance Optimizations
```typescript
// Lazy loading for product images
<ProductImage loading="lazy" />

// Preload critical images
useEffect(() => {
  preloadImages(criticalImageUrls)
}, [])
```

### Image Sizes
Recommended image dimensions for different use cases:

```typescript
// Thumbnail (product grid)
width: 96, height: 96, quality: 80

// Medium (product detail)
width: 300, height: 300, quality: 85

// Large (hero/banner)
width: 600, height: 600, quality: 90
```

## Troubleshooting

### Common Issues

1. **No images returned from Shopify**
   - Check product tags and collections
   - Verify Shopify API permissions
   - Ensure products have featured images

2. **Image loading errors**
   - Check network connectivity
   - Verify image URLs are valid
   - Check Shopify CDN status

3. **Performance issues**
   - Use appropriate image sizes
   - Enable lazy loading
   - Implement image preloading for critical images

### Debug Tools
```typescript
// Enable debug logging
const DEBUG_IMAGES = true

if (DEBUG_IMAGES) {
  console.log('Image source:', src)
  console.log('Optimized URL:', optimizedSrc)
  console.log('Placeholder used:', placeholderSrc)
}
```

## Best Practices

### 1. Image Naming
Use descriptive names for Shopify products:
```
Nike Crew Neck T-Shirt - Black
Adidas Joggers - Gray
Under Armour Polo - Blue
```

### 2. Product Organization
Organize Shopify products with consistent tags:
```
Brand: nike, adidas, under-armour
Style: shirts, pants, shorts, jackets
SubStyle: crew-neck, v-neck, jeans, joggers
Color: black, white, gray, blue
Size: xs, s, m, l, xl, xxl
```

### 3. Image Quality
- Use high-quality source images (minimum 600x600px)
- Maintain aspect ratios
- Optimize for mobile viewing
- Test on various devices and screen sizes

### 4. Fallback Strategy
Always provide fallbacks:
```typescript
// Primary: Shopify product image
// Secondary: Generated SVG placeholder
// Tertiary: Generic image icon
```

## Testing Checklist

- [ ] Shopify products return images
- [ ] Image optimization works correctly
- [ ] Placeholders display properly
- [ ] Performance is acceptable
- [ ] Images work on mobile devices
- [ ] Fallbacks work when images fail
- [ ] Lazy loading functions correctly

## Next Steps

1. **Test the current implementation** with your Shopify store
2. **Update product tags** in Shopify admin
3. **Verify image extraction** works correctly
4. **Remove mock image dependencies** gradually
5. **Monitor performance** and optimize as needed
6. **Test on various devices** and screen sizes

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Shopify API responses
3. Test with different products
4. Check network tab for image requests
5. Review Shopify product setup
