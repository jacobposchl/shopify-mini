// src/data/mockData.ts
import type { Company, SubStyle, ClothingItem } from '../types'

// This file now only contains essential data structures
// All shop/brand data comes directly from the Shopify Shop SDK via useShopDiscovery

export const companies: Company[] = [] // Empty - shops come from Shopify SDK

// TODO: These styles could also be made dynamic by fetching from Shopify's product categories
// For now, keeping minimal essential styles for the clothing selection flow
export const styles: SubStyle[] = [
  {
    id: 'shirts',
    name: 'Shirts',
    styleId: 'tops',
    description: 'Tops and shirts'
  },
  {
    id: 'pants',
    name: 'Pants',
    styleId: 'bottoms',
    description: 'Pants and trousers'
  },
  {
    id: 'shoes',
    name: 'Shoes',
    styleId: 'footwear',
    description: 'Footwear and sneakers'
  },
  {
    id: 'jackets',
    name: 'Jackets',
    styleId: 'outerwear',
    description: 'Outerwear and jackets'
  },
  {
    id: 'dresses',
    name: 'Dresses',
    styleId: 'dresses',
    description: 'Dresses and gowns'
  },
  {
    id: 'skirts',
    name: 'Skirts',
    styleId: 'bottoms',
    description: 'Skirts and shorts'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    styleId: 'accessories',
    description: 'Jewelry, bags, and accessories'
  }
]

export const subStyles: SubStyle[] = [
  {
    id: 'crew-neck',
    name: 'Crew Neck',
    styleId: 'shirts',
    description: 'Classic crew neck shirts'
  },
  {
    id: 'v-neck',
    name: 'V-Neck',
    styleId: 'shirts',
    description: 'V-neck shirts'
  },
  {
    id: 'polo',
    name: 'Polo',
    styleId: 'shirts',
    description: 'Polo shirts'
  },
  {
    id: 'jeans',
    name: 'Jeans',
    styleId: 'pants',
    description: 'Denim jeans'
  },
  {
    id: 'chinos',
    name: 'Chinos',
    styleId: 'pants',
    description: 'Chino pants'
  },
  {
    id: 'sneakers',
    name: 'Sneakers',
    styleId: 'shoes',
    description: 'Casual sneakers'
  },
  {
    id: 'boots',
    name: 'Boots',
    styleId: 'shoes',
    description: 'Boots and formal shoes'
  }
]

// Empty clothing items array - products come from Shopify SDK
export const clothingItems: ClothingItem[] = []

// Note: All shop/brand discovery is now handled by the useShopDiscovery hook
// which fetches real data from the Shopify Shop SDK
//
// Future enhancement: Styles and subStyles could also be made dynamic by:
// 1. Using Shopify's product category API
// 2. Extracting categories from product search results
// 3. Building a dynamic category tree based on available products
