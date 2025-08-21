import { useEffect, useMemo, useState } from 'react'
import { useProductSearch } from '@shopify/shop-minis-react'
import type { ProductFilters, ProductSearchSortBy } from '@shopify/shop-minis-react'
import type { ClothingItem } from '../types'

// Import mock data as fallback
import { clothingItems } from '../data/mockData'

// Helper function to map style names to Shopify categories
const mapStyleToCategory = (style: string): string[] => {
  const styleMap: { [key: string]: string[] } = {
    'shirts': ['shirts', 'tops', 't-shirts'],
    'pants': ['pants', 'trousers', 'jeans', 'shorts'],
    'shoes': ['shoes', 'footwear', 'sneakers'],
    'jackets': ['jackets', 'outerwear', 'coats'],
    'dresses': ['dresses', 'gowns'],
    'skirts': ['skirts'],
    'accessories': ['accessories', 'jewelry', 'bags', 'hats']
  }
  
  return styleMap[style.toLowerCase()] || [style.toLowerCase()]
}

// Helper function to build search query from selections
const buildSearchQuery = (brand?: string, style?: string, subStyle?: string): string => {
  const terms = []
  
  if (brand) terms.push(brand)
  if (style) terms.push(style)
  if (subStyle) terms.push(subStyle)
  
  // If no specific terms, use a broader search
  if (terms.length === 0) {
    return 'clothing apparel'
  }
  
  return terms.join(' ')
}

// Helper function to build ProductFilters from selections
const buildProductFilters = (style?: string): ProductFilters => {
  const filters: ProductFilters = {}
  
  // Map style to category
  if (style) {
    const categories = mapStyleToCategory(style)
    filters.category = categories
  }
  
  // Add gender if we can infer it from style
  if (style) {
    const styleText = style.toLowerCase()
    
    if (styleText.includes('dress') || styleText.includes('skirt')) {
      filters.gender = 'FEMALE'
    } else if (styleText.includes('suit')) {
      filters.gender = 'MALE'
    } else {
      filters.gender = 'NEUTRAL'
    }
  }
  
  return filters
}

// Helper function to filter mock data based on selections
const filterMockData = (brand?: string, style?: string, subStyle?: string): ClothingItem[] => {
  console.log('🔍 Filtering mock data with:', { brand, style, subStyle })
  
  return clothingItems.filter(item => {
    let matches = true
    
    // Filter by brand (company name) - exact match
    if (brand && brand.trim()) {
      const itemBrand = item.brand.toLowerCase().trim()
      const searchBrand = brand.toLowerCase().trim()
      matches = matches && itemBrand === searchBrand
      console.log(`Brand check: "${itemBrand}" === "${searchBrand}" = ${itemBrand === searchBrand}`)
    }
    
    // Filter by style - exact match
    if (style && style.trim()) {
      const itemStyle = item.style.toLowerCase().trim()
      const searchStyle = style.toLowerCase().trim()
      matches = matches && itemStyle === searchStyle
      console.log(`Style check: "${itemStyle}" === "${searchStyle}" = ${itemStyle === searchStyle}`)
    }
    
    // Filter by subStyle - exact match
    if (subStyle && subStyle.trim()) {
      const itemSubStyle = item.subStyle.toLowerCase().trim()
      const searchSubStyle = subStyle.toLowerCase().trim()
      matches = matches && itemSubStyle === searchSubStyle
      console.log(`SubStyle check: "${itemSubStyle}" === "${searchSubStyle}" = ${itemSubStyle === searchSubStyle}`)
    }
    
    console.log(`Item "${item.name}" matches: ${matches}`)
    return matches
  })
}

// Helper function to clean and validate color names
const cleanColorName = (color: string): string => {
  if (!color) return '';
  
  // Clean the color string
  const cleaned = color.trim()
    .replace(/^color:\s*/i, '')
    .replace(/^colour:\s*/i, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Return 'None' for invalid/empty colors
  return cleaned || 'None';
};

// Add type definition for Shopify product data structure
interface ShopifyVariant {
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface ShopifyProduct {
  id: string;
  title: string;
  shop: {
    id: string;
    name: string;
  };
  price: {
    amount: string;
    currencyCode: string;
  };
  featuredImage?: {
    url: string;
  };
  variants: {
    nodes: ShopifyVariant[];
  };
  options: Array<{
    name: string;
    values: string[];
  }>;
  tags: string[];
}

// Helper function to extract colors from a product
const extractProductColors = (product: ShopifyProduct): string[] => {
  if (!product) return ['None'];

  try {
    // Get color option from product options first
    const colorOption = product.options?.find(opt => 
      opt.name.toLowerCase().includes('color') ||
      opt.name.toLowerCase().includes('colour')
    );

    if (colorOption) {
      // If we have a dedicated color option, use those values
      return colorOption.values.length > 0 ? colorOption.values : ['None'];
    }

    // Otherwise try to get colors from variants
    const variantColors = product.variants?.nodes
      ?.flatMap(variant => 
        variant.selectedOptions
          .filter(opt => 
            opt.name.toLowerCase().includes('color') ||
            opt.name.toLowerCase().includes('colour')
          )
          .map(opt => opt.value)
      )
      .filter(Boolean);

    if (variantColors && variantColors.length > 0) {
      // Remove duplicates and clean up
      return Array.from(new Set(variantColors));
    }

    // If no colors found, return None
    return ['None'];

  } catch (error) {
    console.warn('Error extracting product colors:', error, product);
    return ['None'];
  }
};

export function useShopifyProducts(
  brand?: string,
  style?: string,
  subStyle?: string
) {
  const [useMockData, setUseMockData] = useState(false)
  
  // Log the exact values being passed in
  console.log('🎯 useShopifyProducts called with:', {
    brand: brand,
    style: style,
    subStyle: subStyle,
    brandType: typeof brand,
    styleType: typeof style,
    subStyleType: typeof subStyle
  })
  
  // Build search query and filters
  const searchQuery = buildSearchQuery(brand, style, subStyle)
  const filters = buildProductFilters(style)
  
  console.log('🔍 Shopify Product Search:', {
    query: searchQuery,
    filters,
    brand,
    style,
    subStyle,
    useMockData
  })
  
  // Use the Shopify Mini SDK's useProductSearch hook
  const { products, loading, error, refetch } = useProductSearch({
    query: searchQuery,
    filters,
    sortBy: 'RELEVANCE' as ProductSearchSortBy,
    first: 50, // Limit results for better performance
    includeSensitive: false
  })
  
  // Check if Shopify search returned results
  useEffect(() => {
    if (!loading && products && products.length === 0 && !error) {
      console.log('⚠️ No Shopify products found, falling back to mock data')
      setUseMockData(true)
    } else if (products && products.length > 0) {
      console.log('✅ Shopify products found, using real data')
      setUseMockData(false)
    }
  }, [products, loading, error])
  
  // Transform Shopify products to our ClothingItem format
  const transformedShopifyProducts: ClothingItem[] = useMemo(() => {
    if (!products) return []
    
    return products.map((product: ShopifyProduct) => ({
      id: product.id,
      name: product.title,
      brand: product.shop.name,
      style: style || 'Unknown',
      subStyle: subStyle || 'Unknown',
      price: product.price.amount ? `${product.price.currencyCode} ${product.price.amount}` : 'Price not available',
      image: product.featuredImage?.url || '',
      colors: extractProductColors(product),
      sizes: [], // Will handle sizes separately
      companyId: product.shop.id,
      styleId: style || '',
      subStyleId: subStyle || '',
      shopifyProduct: product
    }))
  }, [products, style, subStyle])
  
  // Get mock data as fallback
  const mockProducts = useMemo(() => {
    return filterMockData(brand, style, subStyle)
  }, [brand, style, subStyle])
  
  // Decide which products to use
  const finalProducts = useMockData ? mockProducts : transformedShopifyProducts
  
  // Log the results for debugging
  useEffect(() => {
    console.log('📦 Products Found:', {
      source: useMockData ? 'Mock Data' : 'Shopify',
      total: finalProducts.length,
      shopifyCount: transformedShopifyProducts.length,
      mockCount: mockProducts.length,
      query: searchQuery,
      filters
    })
    
    if (finalProducts.length > 0) {
      console.log('🎯 Sample Product:', {
        name: finalProducts[0].name,
        brand: finalProducts[0].brand,
        style: finalProducts[0].style,
        subStyle: finalProducts[0].subStyle
      })
    }
  }, [finalProducts, transformedShopifyProducts, mockProducts, useMockData, searchQuery, filters])
  
  return {
    products: finalProducts,
    isLoading: loading && !useMockData,
    error: useMockData ? null : error,
    refetch,
    useMockData,
    // Helper function to get products by specific criteria
    getProductsByCriteria: (criteria: { brand?: string; style?: string; subStyle?: string }) => {
      if (useMockData) {
        return filterMockData(criteria.brand, criteria.style, criteria.subStyle)
      }
      
      // This would require a new search, but for now we can filter the current results
      return finalProducts.filter(product => {
        let matches = true
        if (criteria.brand) matches = matches && product.brand.toLowerCase().includes(criteria.brand.toLowerCase())
        if (criteria.style) matches = matches && product.style.toLowerCase().includes(criteria.style.toLowerCase())
        if (criteria.subStyle) matches = matches && product.subStyle.toLowerCase().includes(criteria.subStyle.toLowerCase())
        return matches
      })
    }
  }
}
        let matches = true
        if (criteria.brand) matches = matches && product.brand.toLowerCase().includes(criteria.brand.toLowerCase())
        if (criteria.style) matches = matches && product.style.toLowerCase().includes(criteria.style.toLowerCase())
        if (criteria.subStyle) matches = matches && product.subStyle.toLowerCase().includes(criteria.subStyle.toLowerCase())
        return matches
      })
    }
  }
}
