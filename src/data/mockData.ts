import { Company, Style, SubStyle, ClothingItem } from '../types'

export const companies: Company[] = [
  {
    id: 'nike',
    name: 'Nike',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    description: 'Just Do It - Athletic performance wear'
  },
  {
    id: 'adidas',
    name: 'Adidas',
    logo: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=200&h=200&fit=crop',
    description: 'Impossible is Nothing - Sportswear and lifestyle'
  },
  {
    id: 'under-armour',
    name: 'Under Armour',
    logo: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    description: 'The Only Way Is Through - Performance gear'
  },
  {
    id: 'lululemon',
    name: 'Lululemon',
    logo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop',
    description: 'Technical athletic apparel for yoga and fitness'
  },
  {
    id: 'uniqlo',
    name: 'Uniqlo',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
    description: 'LifeWear - Simple, quality clothing'
  },
  {
    id: 'h-m',
    name: 'H&M',
    logo: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop',
    description: 'Fashion and quality at the best price'
  }
]

export const styles: Style[] = [
  {
    id: 'shirts',
    name: 'Shirts',
    icon: '👕',
    description: 'Tops and upper body clothing'
  },
  {
    id: 'pants',
    name: 'Pants',
    icon: '👖',
    description: 'Bottoms and lower body clothing'
  },
  {
    id: 'shorts',
    name: 'Shorts',
    icon: '🩳',
    description: 'Short bottoms for casual and athletic wear'
  },
  {
    id: 'jackets',
    name: 'Jackets',
    icon: '🧥',
    description: 'Outerwear and layering pieces'
  },
  {
    id: 'dresses',
    name: 'Dresses',
    icon: '👗',
    description: 'One-piece garments'
  },
  {
    id: 'activewear',
    name: 'Activewear',
    icon: '🏃‍♀️',
    description: 'Performance and athletic clothing'
  }
]

export const subStyles: SubStyle[] = [
  // Shirts
  { id: 'crew-neck', name: 'Crew Neck', description: 'Classic round neckline', styleId: 'shirts' },
  { id: 'v-neck', name: 'V-Neck', description: 'V-shaped neckline', styleId: 'shirts' },
  { id: 'button-down', name: 'Button Down', description: 'Collared with buttons', styleId: 'shirts' },
  { id: 'polo', name: 'Polo', description: 'Collared with short sleeves', styleId: 'shirts' },
  { id: 'tank-top', name: 'Tank Top', description: 'Sleeveless top', styleId: 'shirts' },
  
  // Pants
  { id: 'jeans', name: 'Jeans', description: 'Denim pants', styleId: 'pants' },
  { id: 'chinos', name: 'Chinos', description: 'Casual cotton pants', styleId: 'pants' },
  { id: 'joggers', name: 'Joggers', description: 'Athletic-style pants', styleId: 'pants' },
  { id: 'dress-pants', name: 'Dress Pants', description: 'Formal trousers', styleId: 'pants' },
  { id: 'leggings', name: 'Leggings', description: 'Fitted athletic pants', styleId: 'pants' },
  
  // Shorts
  { id: 'athletic-shorts', name: 'Athletic Shorts', description: 'Performance shorts', styleId: 'shorts' },
  { id: 'casual-shorts', name: 'Casual Shorts', description: 'Everyday shorts', styleId: 'shorts' },
  { id: 'dress-shorts', name: 'Dress Shorts', description: 'Formal shorts', styleId: 'shorts' },
  
  // Jackets
  { id: 'hoodie', name: 'Hoodie', description: 'Hooded sweatshirt', styleId: 'jackets' },
  { id: 'blazer', name: 'Blazer', description: 'Formal jacket', styleId: 'jackets' },
  { id: 'windbreaker', name: 'Windbreaker', description: 'Lightweight jacket', styleId: 'jackets' },
  
  // Dresses
  { id: 'casual-dress', name: 'Casual Dress', description: 'Everyday dress', styleId: 'dresses' },
  { id: 'formal-dress', name: 'Formal Dress', description: 'Special occasion dress', styleId: 'dresses' },
  
  // Activewear
  { id: 'compression', name: 'Compression', description: 'Tight-fitting performance wear', styleId: 'activewear' },
  { id: 'loose-fit', name: 'Loose Fit', description: 'Comfortable athletic wear', styleId: 'activewear' }
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
