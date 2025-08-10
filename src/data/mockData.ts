// src/data/mockData.ts
import type { Company, Style, SubStyle, ClothingItem } from '../types'

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

// Keeping this untyped on purpose since your Style interface
// doesn't include iconUrl. Components already guard for iconUrl/icon.
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
  },

  // ======= 20 NEW MOCK ITEMS =======

  // Nike
  {
    id: 'nike-vneck-1',
    name: 'Nike Flex V-Neck Tee',
    brand: 'Nike',
    style: 'Shirts',
    subStyle: 'V-Neck',
    price: '$27.99',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
    colors: ['Black', 'White', 'Heather'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'nike',
    styleId: 'shirts',
    subStyleId: 'v-neck'
  },
  {
    id: 'nike-hoodie-1',
    name: 'Nike Club Hoodie',
    brand: 'Nike',
    style: 'Jackets',
    subStyle: 'Hoodie',
    price: '$64.99',
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=500&fit=crop',
    colors: ['Black', 'Gray', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'nike',
    styleId: 'jackets',
    subStyleId: 'hoodie'
  },
  {
    id: 'nike-athletic-shorts-1',
    name: 'Nike Tempo Running Shorts',
    brand: 'Nike',
    style: 'Shorts',
    subStyle: 'Athletic Shorts',
    price: '$24.99',
    image: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=400&h=500&fit=crop',
    colors: ['Black', 'Blue', 'Lime'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'nike',
    styleId: 'shorts',
    subStyleId: 'athletic-shorts'
  },
  {
    id: 'nike-dress-pants-1',
    name: 'Nike Travel Dress Pants',
    brand: 'Nike',
    style: 'Pants',
    subStyle: 'Dress Pants',
    price: '$89.99',
    image: 'https://images.unsplash.com/photo-1542060748-10c28b62716a?w=400&h=500&fit=crop',
    colors: ['Charcoal', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'nike',
    styleId: 'pants',
    subStyleId: 'dress-pants'
  },

  // Adidas
  {
    id: 'adidas-crew-1',
    name: 'Adidas Essentials Crew Tee',
    brand: 'Adidas',
    style: 'Shirts',
    subStyle: 'Crew Neck',
    price: '$22.99',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=500&fit=crop',
    colors: ['White', 'Black', 'Green'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'adidas',
    styleId: 'shirts',
    subStyleId: 'crew-neck'
  },
  {
    id: 'adidas-windbreaker-1',
    name: 'Adidas Aeroready Windbreaker',
    brand: 'Adidas',
    style: 'Jackets',
    subStyle: 'Windbreaker',
    price: '$74.99',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6cf7?w=400&h=500&fit=crop',
    colors: ['Black', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'adidas',
    styleId: 'jackets',
    subStyleId: 'windbreaker'
  },
  {
    id: 'adidas-dress-pants-1',
    name: 'Adidas Tailored Pants',
    brand: 'Adidas',
    style: 'Pants',
    subStyle: 'Dress Pants',
    price: '$69.99',
    image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=400&h=500&fit=crop',
    colors: ['Navy', 'Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'adidas',
    styleId: 'pants',
    subStyleId: 'dress-pants'
  },
  {
    id: 'adidas-leggings-1',
    name: 'Adidas Studio Leggings',
    brand: 'Adidas',
    style: 'Pants',
    subStyle: 'Leggings',
    price: '$39.99',
    image: 'https://images.unsplash.com/photo-1520975922324-8d08f6f1aa49?w=400&h=500&fit=crop',
    colors: ['Black', 'Burgundy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    companyId: 'adidas',
    styleId: 'pants',
    subStyleId: 'leggings'
  },

  // Under Armour
  {
    id: 'ua-loose-1',
    name: 'UA Sportstyle Loose Fit Tee',
    brand: 'Under Armour',
    style: 'Activewear',
    subStyle: 'Loose Fit',
    price: '$24.99',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&h=500&fit=crop',
    colors: ['Gray', 'Black', 'Blue'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'under-armour',
    styleId: 'activewear',
    subStyleId: 'loose-fit'
  },
  {
    id: 'ua-athletic-shorts-1',
    name: 'UA Launch Athletic Shorts',
    brand: 'Under Armour',
    style: 'Shorts',
    subStyle: 'Athletic Shorts',
    price: '$26.99',
    image: 'https://images.unsplash.com/photo-1520975693416-35a7f6d5d9c8?w=400&h=500&fit=crop',
    colors: ['Black', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'under-armour',
    styleId: 'shorts',
    subStyleId: 'athletic-shorts'
  },
  {
    id: 'ua-windbreaker-1',
    name: 'UA Storm Windbreaker',
    brand: 'Under Armour',
    style: 'Jackets',
    subStyle: 'Windbreaker',
    price: '$79.99',
    image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=500&fit=crop',
    colors: ['Black', 'Steel'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'under-armour',
    styleId: 'jackets',
    subStyleId: 'windbreaker'
  },

  // Lululemon
  {
    id: 'lulu-crew-1',
    name: 'Lululemon Soft Crew Tee',
    brand: 'Lululemon',
    style: 'Shirts',
    subStyle: 'Crew Neck',
    price: '$58.00',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop',
    colors: ['White', 'Seafoam', 'Black'],
    sizes: ['XS', 'S', 'M', 'L'],
    companyId: 'lululemon',
    styleId: 'shirts',
    subStyleId: 'crew-neck'
  },
  {
    id: 'lulu-joggers-1',
    name: 'Lululemon City Sweat Joggers',
    brand: 'Lululemon',
    style: 'Pants',
    subStyle: 'Joggers',
    price: '$118.00',
    image: 'https://images.unsplash.com/photo-1541085388148-47d58b4b9b51?w=400&h=500&fit=crop',
    colors: ['Navy', 'Black', 'Charcoal'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'lululemon',
    styleId: 'pants',
    subStyleId: 'joggers'
  },
  {
    id: 'lulu-hoodie-1',
    name: 'Lululemon Cozy Hoodie',
    brand: 'Lululemon',
    style: 'Jackets',
    subStyle: 'Hoodie',
    price: '$128.00',
    image: 'https://images.unsplash.com/photo-1603575449299-2d3a9c620f8d?w=400&h=500&fit=crop',
    colors: ['Heather Gray', 'Black'],
    sizes: ['XS', 'S', 'M', 'L'],
    companyId: 'lululemon',
    styleId: 'jackets',
    subStyleId: 'hoodie'
  },

  // Uniqlo
  {
    id: 'uniqlo-vneck-1',
    name: 'Uniqlo Supima V-Neck',
    brand: 'Uniqlo',
    style: 'Shirts',
    subStyle: 'V-Neck',
    price: '$14.90',
    image: 'https://images.unsplash.com/photo-1520975693416-35a7f6d5d9c8?w=400&h=500&fit=crop',
    colors: ['White', 'Navy', 'Gray'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    companyId: 'uniqlo',
    styleId: 'shirts',
    subStyleId: 'v-neck'
  },
  {
    id: 'uniqlo-jeans-1',
    name: 'Uniqlo Slim Fit Jeans',
    brand: 'Uniqlo',
    style: 'Pants',
    subStyle: 'Jeans',
    price: '$39.90',
    image: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=400&h=500&fit=crop',
    colors: ['Indigo', 'Black'],
    sizes: ['28', '30', '32', '34', '36'],
    companyId: 'uniqlo',
    styleId: 'pants',
    subStyleId: 'jeans'
  },
  {
    id: 'uniqlo-blazer-1',
    name: 'Uniqlo Stretch Blazer',
    brand: 'Uniqlo',
    style: 'Jackets',
    subStyle: 'Blazer',
    price: '$69.90',
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=500&fit=crop',
    colors: ['Navy', 'Black'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    companyId: 'uniqlo',
    styleId: 'jackets',
    subStyleId: 'blazer'
  },

  // H&M
  {
    id: 'hm-formal-dress-1',
    name: 'H&M Formal Dress',
    brand: 'H&M',
    style: 'Dresses',
    subStyle: 'Formal Dress',
    price: '$49.99',
    image: 'https://images.unsplash.com/photo-1520975693416-35a7f6d5d9c8?w=400&h=500&fit=crop',
    colors: ['Black', 'Burgundy', 'Emerald'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    companyId: 'h-m',
    styleId: 'dresses',
    subStyleId: 'formal-dress'
  },
  {
    id: 'hm-casual-shorts-1',
    name: 'H&M Casual Shorts',
    brand: 'H&M',
    style: 'Shorts',
    subStyle: 'Casual Shorts',
    price: '$17.99',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=500&fit=crop',
    colors: ['Khaki', 'Black', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    companyId: 'h-m',
    styleId: 'shorts',
    subStyleId: 'casual-shorts'
  },
  {
    id: 'hm-button-down-1',
    name: 'H&M Poplin Button-Down',
    brand: 'H&M',
    style: 'Shirts',
    subStyle: 'Button Down',
    price: '$24.99',
    image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400&h=500&fit=crop',
    colors: ['White', 'Light Blue'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    companyId: 'h-m',
    styleId: 'shirts',
    subStyleId: 'button-down'
  }
]
