import { Company, Style, SubStyle, ClothingItem } from '../types'

// src/data/mockData.ts
import type { Company, Style, SubStyle, ClothingItem } from '../types'

// Force a URL string with Vite’s ?url suffix (removes any interop ambiguity)
import shirtsPngUrl  from '../assets/icons/styles/shirts.png?url'
import pantsPngUrl   from '../assets/icons/styles/pants.png?url'
import shortsPngUrl  from '../assets/icons/styles/shorts.png?url'
import jacketsPngUrl from '../assets/icons/styles/jackets.png?url'

export const companies: Company[] = [
  {
    id: 'nike',
    name: 'Nike',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/f5/e8/6b/f5e86b54-5abc-248c-66c4-b3df20f8c691/AppIcon-0-0-1x_U007ephone-0-1-0-85-220.png/1200x600wa.png',
    description: ''
  },
  {
    id: 'adidas',
    name: 'Adidas',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/df/26/cf/df26cf2c-2980-1ebc-7354-064751cd3adc/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x630wa.png',
    description: ''
  },
  {
    id: 'under-armour',
    name: 'Under Armour',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/8e/2e/f6/8e2ef607-663f-696f-d908-a54f0d5fdd5b/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x600wa.png',
    description: ''
  },
  {
    id: 'lululemon',
    name: 'Lululemon',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/9b/21/95/9b2195e9-e161-270a-9a8f-da0e87c7a366/AppIcon-1x_U007emarketing-0-0-0-6-0-0-sRGB-85-220-0.png/1200x630wa.png',
    description: ''
  },
  {
    id: 'uniqlo',
    name: 'Uniqlo',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/5c/fa/84/5cfa8485-4acd-7517-1234-413a6ce2a44f/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x600wa.png',
    description: ''
  },
  {
    id: 'h-m',
    name: 'H&M',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/44/02/c2/4402c2d0-c62f-b817-1287-63a91581c8dd/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/1200x600wa.png',
    description: ''
  }
]

export const styles = [
  { id: 'shirts',  name: 'Shirts',  iconUrl: 'https://cdn-icons-png.flaticon.com/512/392/392043.png'  },
  { id: 'pants',   name: 'Pants',   iconUrl: 'https://cdn-icons-png.flaticon.com/512/3531/3531748.png'   },
  { id: 'shorts',  name: 'Shorts',  iconUrl: 'https://cdn-icons-png.flaticon.com/512/120/120041.png'  },
  { id: 'jackets', name: 'Jackets', iconUrl: 'https://cdn-icons-png.flaticon.com/512/755/755999.png' }
]

export const subStyles: SubStyle[] = [
  // Shirts
  { id: 'crew-neck',   name: 'Crew Neck',   styleId: 'shirts' },
  { id: 'v-neck',      name: 'V-Neck',      styleId: 'shirts' },
  { id: 'button-down', name: 'Button Down', styleId: 'shirts' },
  { id: 'polo',        name: 'Polo',        styleId: 'shirts' },

  // Pants
  { id: 'jeans',       name: 'Jeans',       styleId: 'pants' },
  { id: 'joggers',     name: 'Joggers',     styleId: 'pants' },
  { id: 'dress-pants', name: 'Dress Pants', styleId: 'pants' },
  { id: 'leggings',    name: 'Leggings',    styleId: 'pants' },

  // Shorts
  { id: 'athletic-shorts', name: 'Athletic Shorts', styleId: 'shorts' },
  { id: 'casual-shorts',   name: 'Casual Shorts',   styleId: 'shorts' },
  { id: 'dress-shorts',    name: 'Dress Shorts',    styleId: 'shorts' },

  // Jackets
  { id: 'hoodie',      name: 'Hoodie',      styleId: 'jackets' },
  { id: 'blazer',      name: 'Blazer',      styleId: 'jackets' },
  { id: 'windbreaker', name: 'Windbreaker', styleId: 'jackets' },

  // Dresses
  { id: 'casual-dress', name: 'Casual Dress', styleId: 'dresses' },
  { id: 'formal-dress', name: 'Formal Dress', styleId: 'dresses' },

  // Activewear
  { id: 'compression', name: 'Compression', styleId: 'activewear' },
  { id: 'loose-fit',   name: 'Loose Fit',   styleId: 'activewear' },
]

export const clothingItems: ClothingItem[] = [
  // Nike items
  {
    id: 'nike-crew-1',
    name: 'Nike Dri-FIT Crew',
    brand: 'Nike',
    style: 'Shirts',
    subStyle: 'Crew Neck',
    price: '$29.99',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    colors: ['White', 'Black', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'nike',
    styleId: 'shirts',
    subStyleId: 'crew-neck'
  },
  {
    id: 'nike-joggers-1',
    name: 'Nike Tech Fleece Joggers',
    brand: 'Nike',
    style: 'Pants',
    subStyle: 'Joggers',
    price: '$79.99',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop',
    colors: ['Black', 'Gray', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'nike',
    styleId: 'pants',
    subStyleId: 'joggers'
  },
  
  // Adidas items
  {
    id: 'adidas-polo-1',
    name: 'Adidas Performance Polo',
    brand: 'Adidas',
    style: 'Shirts',
    subStyle: 'Polo',
    price: '$34.99',
    image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=500&fit=crop',
    colors: ['Navy', 'Red', 'White'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'adidas',
    styleId: 'shirts',
    subStyleId: 'polo'
  },
  {
    id: 'adidas-shorts-1',
    name: 'Adidas Training Shorts',
    brand: 'Adidas',
    style: 'Shorts',
    subStyle: 'Athletic Shorts',
    price: '$24.99',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop',
    colors: ['Black', 'Gray', 'Blue'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'adidas',
    styleId: 'shorts',
    subStyleId: 'athletic-shorts'
  },
  
  // Under Armour items
  {
    id: 'ua-compression-1',
    name: 'UA HeatGear Compression',
    brand: 'Under Armour',
    style: 'Activewear',
    subStyle: 'Compression',
    price: '$39.99',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=500&fit=crop',
    colors: ['Black', 'Gray', 'Red'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'under-armour',
    styleId: 'activewear',
    subStyleId: 'compression'
  },
  
  // Lululemon items
  {
    id: 'lulu-leggings-1',
    name: 'Lululemon Align Leggings',
    brand: 'Lululemon',
    style: 'Pants',
    subStyle: 'Leggings',
    price: '$98.00',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop',
    colors: ['Black', 'Navy', 'Gray'],
    sizes: ['2', '4', '6', '8', '10'],
    companyId: 'lululemon',
    styleId: 'pants',
    subStyleId: 'leggings'
  },
  
  // Uniqlo items
  {
    id: 'uniqlo-button-1',
    name: 'Uniqlo Oxford Button-Down',
    brand: 'Uniqlo',
    style: 'Shirts',
    subStyle: 'Button Down',
    price: '$29.90',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop',
    colors: ['White', 'Light Blue', 'Pink'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    companyId: 'uniqlo',
    styleId: 'shirts',
    subStyleId: 'button-down'
  },
  
  // H&M items
  {
    id: 'hm-dress-1',
    name: 'H&M Casual Dress',
    brand: 'H&M',
    style: 'Dresses',
    subStyle: 'Casual Dress',
    price: '$19.99',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=500&fit=crop',
    colors: ['Black', 'Blue', 'Red'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    companyId: 'h-m',
    styleId: 'dresses',
    subStyleId: 'casual-dress'
  }
]
