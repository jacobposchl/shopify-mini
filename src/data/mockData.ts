// src/data/mockData.ts
import type { Company, SubStyle, ClothingItem } from '../types'

// TODO: Replace this mock data with real Shopify product data using @shopify/shop-minis-react
// The Shopify SDK provides access to real product images, prices, and inventory
// Use hooks like useProducts() or useProduct() to fetch real data instead of these mock items

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
  },
  {
  id: 'puma',
  name: 'Puma',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/bc/14/53/bc14533c-6c03-9a99-abb9-54359823facf/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/1200x600wa.png',
  description: ''
},
{
  id: 'new-balance',
  name: 'New Balance',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c5/72/6e/c5726e35-dbcb-dafe-b06b-c54382336487/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/1200x600wa.png',
  description: ''
},
{
  id: 'the-north-face',
  name: 'The North Face',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/3a/7c/7e/3a7c7eaa-8053-50f8-64c7-1ed637082d08/AppIcon-0-0-1x_U007epad-0-9-0-sRGB-85-220.png/1200x600wa.png',
  description: ''
},
{
  id: 'levis',
  name: "Levi's",
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/7b/20/75/7b2075d9-7ece-fc25-0ce6-c626ecabd330/AppIcon-0-0-1x_U007emarketing-0-0-0-8-0-0-85-220.png/1200x630wa.png',
  description: ''
},
{
  id: 'sketchers',
  name: 'Sketchers',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cc/04/49/cc044961-208f-cc09-5fde-18a1b6eef59b/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x600wa.png',
  description: ''
},
{
  id: 'converse',
  name: 'Converse',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/97/af/0c/97af0cbc-725a-67e4-9c01-d6b542492b80/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x630wa.png',
  description: ''
},
{
    id: 'chanel',
    name: 'chanel',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5a/7e/f6/5a7ef697-c9ae-d796-9559-a745793c7a0d/prod-AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x630wa.png',
    description: ''
  },
  {
    id: 'gucci',
    name: 'gucci',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3f/05/bc/3f05bc3a-645f-791d-e081-770ccaf9b791/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/1200x600wa.png',
    description: ''
  },
  {
    id: 'gap',
    name: 'gap',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/60/f3/df/60f3df11-b5e8-2617-b8ca-8f82c207ec2b/AppIcon-Release-0-1x_U007emarketing-0-8-0-85-220-0.png/1200x630wa.png',
    description: ''
  },
  {
    id: 'fila',
    name: 'fila',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/4e/4b/e8/4e4be84f-0901-540a-7b5e-b45a8dac191f/AppIcon-0-0-1x_U007emarketing-0-6-0-0-85-220.png/1200x630wa.png',
    description: ''
  },
  {
    id: 'michael kors',
    name: 'michael kors',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/5c/fa/84/5cfa8485-4acd-7517-1234-413a6ce2a44f/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x600wa.png',
    description: ''
  },
  {
    id: 'reebok',
    name: 'reebok',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/35/0a/51/350a51a0-0b63-9bee-c03e-81d56a37766a/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/1200x630wa.png',
    description: ''
  },
  {
  id: 'zara',
  name: 'zara',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/d6/06/df/d606df26-1d8d-846c-197b-586a2fa8ffba/AppIcon-0-0-1x_U007emarketing-0-8-0-sRGB-0-85-220.png/1200x630wa.png',
  description: ''
},
{
  id: 'kappa',
  name: 'kappa',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/df/66/f7/df66f769-a953-ddb6-9144-3e64f39f2edf/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/1200x630wa.png',
  description: ''
},
{
  id: 'arcteryx ',
  name: 'arcteryx ',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/1b/6c/e5/1b6ce508-fee1-23ff-f723-ffdbe1b0ed00/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x630wa.png',
  description: ''
},
{
  id: 'moncler',
  name: "moncler",
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/4f/b4/4f/4fb44fe3-f449-b2a3-4737-c4312a6c9a88/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/1200x630wa.png',
  description: ''
},
{
  id: 'vans',
  name: 'vans',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/bf/d5/51/bfd5519a-3ad9-fb7e-0efc-906a646dc86e/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/1200x600wa.png',
  description: ''
},
{
  id: 'ralph lauren',
  name: 'ralph lauren',
  logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/18/d8/dc/18d8dc29-081b-ae01-eaec-f39b4b9d2399/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x600wa.png',
  description: ''
}
]

// Kept untyped on purpose, since your Style interface doesn’t include iconUrl.
// Components read iconUrl with a narrow type/any cast.
export const styles = [
  { id: 'shirts',  name: 'Shirts',  iconUrl: 'https://i.postimg.cc/nh45frM2/32839036-cd91-483f-961c-39cf78f778c3.png'  },
  { id: 'pants',   name: 'Pants',   iconUrl: 'https://i.postimg.cc/HWfdpJs1/Chat-GPT-Image-Aug-10-2025-12-58-07-PM.png' },
  { id: 'shorts',  name: 'Shorts',  iconUrl: 'https://i.postimg.cc/TYgGhRpL/Chat-GPT-Image-Aug-10-2025-12-58-10-PM.png'   },
  { id: 'jackets', name: 'Jackets', iconUrl: 'https://i.postimg.cc/2SYYZPZH/Chat-GPT-Image-Aug-10-2025-12-58-12-PM.png'   },
]

// Substyles only for the 4 visible style categories (no dresses/activewear to avoid unreachable options)
export const subStyles: SubStyle[] = [
  // Shirts
  { id: 'crew-neck',   name: 'Crew Neck',   styleId: 'shirts',
    iconUrl: 'https://i.postimg.cc/85vDWDt0/Chat-GPT-Image-Aug-10-2025-01-02-11-PM.png' },
  { id: 'v-neck',      name: 'V-Neck',      styleId: 'shirts',
    iconUrl: 'https://i.postimg.cc/jdtKWpNM/Chat-GPT-Image-Aug-10-2025-01-03-12-PM.png' },
  { id: 'button-down', name: 'Button Down', styleId: 'shirts',
    iconUrl: 'https://i.postimg.cc/nh45frM2/32839036-cd91-483f-961c-39cf78f778c3.png' },
  { id: 'polo',        name: 'Polo',        styleId: 'shirts',
    iconUrl: 'https://i.postimg.cc/65cKCMft/Chat-GPT-Image-Aug-10-2025-01-05-05-PM.png' },

  // Pants
  { id: 'jeans',       name: 'Jeans',       styleId: 'pants',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/5258/5258152.png' },
  { id: 'joggers',     name: 'Joggers',     styleId: 'pants',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/6649/6649502.png' },
  { id: 'dress-pants', name: 'Dress Pants', styleId: 'pants',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/88/88795.png' },
  { id: 'leggings',    name: 'Leggings',    styleId: 'pants',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2589/2589977.png' },

  // Shorts
  { id: 'athletic-shorts', name: 'Athletic Shorts', styleId: 'shorts',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/27/27146.png' },
  { id: 'casual-shorts',   name: 'Casual Shorts',   styleId: 'shorts',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/941/941430.png' },
  { id: 'dress-shorts',    name: 'Dress Shorts',    styleId: 'shorts',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/120/120041.png' },

  // Jackets
  { id: 'hoodie',      name: 'Hoodie',      styleId: 'jackets',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/343/343247.png' },
  { id: 'blazer',      name: 'Blazer',      styleId: 'jackets',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2589/2589938.png' },
  { id: 'windbreaker', name: 'Windbreaker', styleId: 'jackets',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/614/614281.png' },

]


// Helper for unique, diverse clothing images
const getClothingImage = (brand: string, style: string, subStyle: string, index: number) => {
  // Use diverse, appropriate images for each clothing type
  const imageMap: { [key: string]: string[] } = {
    'crew-neck': [
      'photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'v-neck': [
      'photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'button-down': [
      'photo-1539533113208-f6df8cc8b543?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1557800636-894a64c1696f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'polo': [
      'photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'jeans': [
      'photo-1516251193007-45ef944ab0c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1542060748-10c28b62716a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1520975922324-8d08f6f1aa49?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'joggers': [
      'photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1542060748-10c28b62716a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1520975922324-8d08f6f1aa49?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'dress-pants': [
      'photo-1542060748-10c28b62716a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1520975922324-8d08f6f1aa49?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'leggings': [
      'photo-1520975922324-8d08f6f1aa49?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'athletic-shorts': [
      'photo-1516478177764-9fe5bd7e9717?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'casual-shorts': [
      'photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551024709-8f23befc6cf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'dress-shorts': [
      'photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551024709-8f23befc6cf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'hoodie': [
      'photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551024709-8f23befc6cf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'blazer': [
      'photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1551024709-8f23befc6cf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1539533113208-f6df8cc8b543?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ],
    'windbreaker': [
      'photo-1551024709-8f23befc6cf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1539533113208-f6df8cc8b543?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80',
      'photo-1586790170083-2f9ceadc732d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80'
    ]
  }
  
  const images = imageMap[subStyle] || imageMap['crew-neck']
  const imageIndex = index % images.length
  return `https://images.unsplash.com/${images[imageIndex]}`
}

// 84 items (6 brands × 14 substyles). Each combo has at least one item.
export const clothingItems: ClothingItem[] = [
  // ---------- NIKE ----------
  { id: 'nike-crew-neck-1', name: 'Nike Crew Neck Tee', brand: 'Nike', style: 'Shirts', subStyle: 'Crew Neck', price: '$27.99',
    image: getClothingImage('Nike', 'Shirts', 'crew-neck', 0), colors: ['Black', 'White', 'Heather'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'shirts', subStyleId: 'crew-neck' },
  { id: 'nike-v-neck-1', name: 'Nike V-Neck Tee', brand: 'Nike', style: 'Shirts', subStyle: 'V-Neck', price: '$29.99',
    image: getClothingImage('Nike', 'Shirts', 'v-neck', 0), colors: ['Black','White','Gray'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'shirts', subStyleId: 'v-neck' },
  { id: 'nike-button-down-1', name: 'Nike Button-Down Shirt', brand: 'Nike', style: 'Shirts', subStyle: 'Button Down', price: '$49.99',
    image: getClothingImage('Nike', 'Shirts', 'button-down', 0), colors: ['White','Light Blue'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'shirts', subStyleId: 'button-down' },
  { id: 'nike-polo-1', name: 'Nike Polo Shirt', brand: 'Nike', style: 'Shirts', subStyle: 'Polo', price: '$39.99',
    image: getClothingImage('Nike', 'Shirts', 'polo', 0), colors: ['Navy','Red','White'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'shirts', subStyleId: 'polo' },

  { id: 'nike-jeans-1', name: 'Nike Denim Jeans', brand: 'Nike', style: 'Pants', subStyle: 'Jeans', price: '$69.99',
    image: getClothingImage('Nike', 'Pants', 'jeans', 0), colors: ['Indigo','Black'], sizes: ['28','30','32','34','36'],
    companyId: 'nike', styleId: 'pants', subStyleId: 'jeans' },
  { id: 'nike-joggers-1', name: 'Nike Tech Joggers', brand: 'Nike', style: 'Pants', subStyle: 'Joggers', price: '$79.99',
    image: getClothingImage('Nike', 'Pants', 'joggers', 0), colors: ['Black','Gray','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'pants', subStyleId: 'joggers' },
  { id: 'nike-dress-pants-1', name: 'Nike Dress Pants', brand: 'Nike', style: 'Pants', subStyle: 'Dress Pants', price: '$89.99',
    image: getClothingImage('Nike', 'Pants', 'dress-pants', 0), colors: ['Charcoal','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'pants', subStyleId: 'dress-pants' },
  { id: 'nike-leggings-1', name: 'Nike Training Leggings', brand: 'Nike', style: 'Pants', subStyle: 'Leggings', price: '$54.99',
    image: getClothingImage('Nike', 'Pants', 'leggings', 0), colors: ['Black','Burgundy'], sizes: ['XS','S','M','L','XL'],
    companyId: 'nike', styleId: 'pants', subStyleId: 'leggings' },

  { id: 'nike-athletic-shorts-1', name: 'Nike Tempo Athletic Shorts', brand: 'Nike', style: 'Shorts', subStyle: 'Athletic Shorts', price: '$24.99',
    image: getClothingImage('Nike', 'Shorts', 'athletic-shorts', 0), colors: ['Black','Blue','Lime'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'shorts', subStyleId: 'athletic-shorts' },
  { id: 'nike-casual-shorts-1', name: 'Nike Casual Chino Shorts', brand: 'Nike', style: 'Shorts', subStyle: 'Casual Shorts', price: '$29.99',
    image: getClothingImage('Nike', 'Shorts', 'casual-shorts', 0), colors: ['Khaki','Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'shorts', subStyleId: 'casual-shorts' },
  { id: 'nike-dress-shorts-1', name: 'Nike Tailored Dress Shorts', brand: 'Nike', style: 'Shorts', subStyle: 'Dress Shorts', price: '$39.99',
    image: getClothingImage('Nike', 'Shorts', 'dress-shorts', 0), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'shorts', subStyleId: 'dress-shorts' },

  { id: 'nike-hoodie-1', name: 'Nike Club Hoodie', brand: 'Nike', style: 'Jackets', subStyle: 'Hoodie', price: '$64.99',
    image: getClothingImage('Nike', 'Jackets', 'hoodie', 0), colors: ['Black','Gray','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'jackets', subStyleId: 'hoodie' },
  { id: 'nike-blazer-1', name: 'Nike Stretch Blazer', brand: 'Nike', style: 'Jackets', subStyle: 'Blazer', price: '$119.99',
    image: getClothingImage('Nike', 'Jackets', 'blazer', 0), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'jackets', subStyleId: 'blazer' },
  { id: 'nike-windbreaker-1', name: 'Nike Lightweight Windbreaker', brand: 'Nike', style: 'Jackets', subStyle: 'Windbreaker', price: '$79.99',
    image: getClothingImage('Nike', 'Jackets', 'windbreaker', 0), colors: ['Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'nike', styleId: 'jackets', subStyleId: 'windbreaker' },

  // ---------- ADIDAS ----------
  { id: 'adidas-crew-neck-1', name: 'Adidas Crew Neck Tee', brand: 'Adidas', style: 'Shirts', subStyle: 'Crew Neck', price: '$22.99',
    image: getClothingImage('Adidas', 'Shirts', 'crew-neck', 1), colors: ['White','Black','Green'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'shirts', subStyleId: 'crew-neck' },
  { id: 'adidas-v-neck-1', name: 'Adidas V-Neck Tee', brand: 'Adidas', style: 'Shirts', subStyle: 'V-Neck', price: '$24.99',
    image: getClothingImage('Adidas', 'Shirts', 'v-neck', 1), colors: ['Black','White','Gray'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'shirts', subStyleId: 'v-neck' },
  { id: 'adidas-button-down-1', name: 'Adidas Button-Down Shirt', brand: 'Adidas', style: 'Shirts', subStyle: 'Button Down', price: '$44.99',
    image: getClothingImage('Adidas', 'Shirts', 'button-down', 1), colors: ['White','Light Blue'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'shirts', subStyleId: 'button-down' },
  { id: 'adidas-polo-1', name: 'Adidas Performance Polo', brand: 'Adidas', style: 'Shirts', subStyle: 'Polo', price: '$34.99',
    image: getClothingImage('Adidas', 'Shirts', 'polo', 1), colors: ['Navy','Red','White'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'shirts', subStyleId: 'polo' },

  { id: 'adidas-jeans-1', name: 'Adidas Denim Jeans', brand: 'Adidas', style: 'Pants', subStyle: 'Jeans', price: '$59.99',
    image: getClothingImage('Adidas', 'Pants', 'jeans', 1), colors: ['Indigo','Black'], sizes: ['28','30','32','34','36'],
    companyId: 'adidas', styleId: 'pants', subStyleId: 'jeans' },
  { id: 'adidas-joggers-1', name: 'Adidas Essentials Joggers', brand: 'Adidas', style: 'Pants', subStyle: 'Joggers', price: '$64.99',
    image: getClothingImage('Adidas', 'Pants', 'joggers', 1), colors: ['Black','Gray','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'pants', subStyleId: 'joggers' },
  { id: 'adidas-dress-pants-1', name: 'Adidas Tailored Dress Pants', brand: 'Adidas', style: 'Pants', subStyle: 'Dress Pants', price: '$69.99',
    image: getClothingImage('Adidas', 'Pants', 'dress-pants', 1), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'pants', subStyleId: 'dress-pants' },
  { id: 'adidas-leggings-1', name: 'Adidas Studio Leggings', brand: 'Adidas', style: 'Pants', subStyle: 'Leggings', price: '$39.99',
    image: getClothingImage('Adidas', 'Pants', 'leggings', 1), colors: ['Black','Burgundy'], sizes: ['XS','S','M','L','XL'],
    companyId: 'adidas', styleId: 'pants', subStyleId: 'leggings' },

  { id: 'adidas-athletic-shorts-1', name: 'Adidas Training Shorts', brand: 'Adidas', style: 'Shorts', subStyle: 'Athletic Shorts', price: '$24.99',
    image: getClothingImage('Adidas', 'Shorts', 'athletic-shorts', 1), colors: ['Black','Gray','Blue'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'shorts', subStyleId: 'athletic-shorts' },
  { id: 'adidas-casual-shorts-1', name: 'Adidas Casual Shorts', brand: 'Adidas', style: 'Shorts', subStyle: 'Casual Shorts', price: '$21.99',
    image: getClothingImage('Adidas', 'Shorts', 'casual-shorts', 1), colors: ['Khaki','Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'shorts', subStyleId: 'casual-shorts' },
  { id: 'adidas-dress-shorts-1', name: 'Adidas Dress Shorts', brand: 'Adidas', style: 'Shorts', subStyle: 'Dress Shorts', price: '$34.99',
    image: getClothingImage('Adidas', 'Shorts', 'dress-shorts', 1), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'shorts', subStyleId: 'dress-shorts' },

  { id: 'adidas-hoodie-1', name: 'Adidas Aeroready Hoodie', brand: 'Adidas', style: 'Jackets', subStyle: 'Hoodie', price: '$59.99',
    image: getClothingImage('Adidas', 'Jackets', 'hoodie', 1), colors: ['Black','Gray','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'jackets', subStyleId: 'hoodie' },
  { id: 'adidas-blazer-1', name: 'Adidas Stretch Blazer', brand: 'Adidas', style: 'Jackets', subStyle: 'Blazer', price: '$109.99',
    image: getClothingImage('Adidas', 'Jackets', 'blazer', 1), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'jackets', subStyleId: 'blazer' },
  { id: 'adidas-windbreaker-1', name: 'Adidas Aeroready Windbreaker', brand: 'Adidas', style: 'Jackets', subStyle: 'Windbreaker', price: '$74.99',
    image: getClothingImage('Adidas', 'Jackets', 'windbreaker', 1), colors: ['Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'adidas', styleId: 'jackets', subStyleId: 'windbreaker' },

  // ---------- UNDER ARMOUR ----------
  { id: 'ua-crew-neck-1', name: 'UA Crew Neck Tee', brand: 'Under Armour', style: 'Shirts', subStyle: 'Crew Neck', price: '$24.99',
    image: getClothingImage('Under Armour', 'Shirts', 'crew-neck', 2), colors: ['Black','White','Gray'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'shirts', subStyleId: 'crew-neck' },
  { id: 'ua-v-neck-1', name: 'UA V-Neck Tee', brand: 'Under Armour', style: 'Shirts', subStyle: 'V-Neck', price: '$26.99',
    image: getClothingImage('Under Armour', 'Shirts', 'v-neck', 2), colors: ['Black','White','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'shirts', subStyleId: 'v-neck' },
  { id: 'ua-button-down-1', name: 'UA Button-Down Shirt', brand: 'Under Armour', style: 'Shirts', subStyle: 'Button Down', price: '$46.99',
    image: getClothingImage('Under Armour', 'Shirts', 'button-down', 2), colors: ['White','Light Blue'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'shirts', subStyleId: 'button-down' },
  { id: 'ua-polo-1', name: 'UA Performance Polo', brand: 'Under Armour', style: 'Shirts', subStyle: 'Polo', price: '$39.99',
    image: getClothingImage('Under Armour', 'Shirts', 'polo', 2), colors: ['Navy','Black','White'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'shirts', subStyleId: 'polo' },

  { id: 'ua-jeans-1', name: 'UA Denim Jeans', brand: 'Under Armour', style: 'Pants', subStyle: 'Jeans', price: '$62.99',
    image: getClothingImage('Under Armour', 'Pants', 'jeans', 2), colors: ['Indigo','Black'], sizes: ['28','30','32','34','36'],
    companyId: 'under-armour', styleId: 'pants', subStyleId: 'jeans' },
  { id: 'ua-joggers-1', name: 'UA Sportstyle Joggers', brand: 'Under Armour', style: 'Pants', subStyle: 'Joggers', price: '$59.99',
    image: getClothingImage('Under Armour', 'Pants', 'joggers', 2), colors: ['Black','Gray','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'pants', subStyleId: 'joggers' },
  { id: 'ua-dress-pants-1', name: 'UA Tailored Dress Pants', brand: 'Under Armour', style: 'Pants', subStyle: 'Dress Pants', price: '$72.99',
    image: getClothingImage('Under Armour', 'Pants', 'dress-pants', 2), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'pants', subStyleId: 'dress-pants' },
  { id: 'ua-leggings-1', name: 'UA HeatGear Leggings', brand: 'Under Armour', style: 'Pants', subStyle: 'Leggings', price: '$39.99',
    image: getClothingImage('Under Armour', 'Pants', 'leggings', 2), colors: ['Black','Red'], sizes: ['XS','S','M','L','XL'],
    companyId: 'under-armour', styleId: 'pants', subStyleId: 'leggings' },

  { id: 'ua-athletic-shorts-1', name: 'UA Launch Athletic Shorts', brand: 'Under Armour', style: 'Shorts', subStyle: 'Athletic Shorts', price: '$26.99',
    image: getClothingImage('Under Armour', 'Shorts', 'athletic-shorts', 2), colors: ['Black','Gray'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'shorts', subStyleId: 'athletic-shorts' },
  { id: 'ua-casual-shorts-1', name: 'UA Casual Stretch Shorts', brand: 'Under Armour', style: 'Shorts', subStyle: 'Casual Shorts', price: '$23.99',
    image: getClothingImage('Under Armour', 'Shorts', 'casual-shorts', 2), colors: ['Khaki','Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'shorts', subStyleId: 'casual-shorts' },
  { id: 'ua-dress-shorts-1', name: 'UA Dress Shorts', brand: 'Under Armour', style: 'Shorts', subStyle: 'Dress Shorts', price: '$34.99',
    image: getClothingImage('Under Armour', 'Shorts', 'dress-shorts', 2), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'shorts', subStyleId: 'dress-shorts' },

  { id: 'ua-hoodie-1', name: 'UA Rival Fleece Hoodie', brand: 'Under Armour', style: 'Jackets', subStyle: 'Hoodie', price: '$54.99',
    image: getClothingImage('Under Armour', 'Jackets', 'hoodie', 2), colors: ['Black','Gray','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'jackets', subStyleId: 'hoodie' },
  { id: 'ua-blazer-1', name: 'UA Stretch Blazer', brand: 'Under Armour', style: 'Jackets', subStyle: 'Blazer', price: '$114.99',
    image: getClothingImage('Under Armour', 'Jackets', 'blazer', 2), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'jackets', subStyleId: 'blazer' },
  { id: 'ua-windbreaker-1', name: 'UA Storm Windbreaker', brand: 'Under Armour', style: 'Jackets', subStyle: 'Windbreaker', price: '$79.99',
    image: getClothingImage('Under Armour', 'Jackets', 'windbreaker', 2), colors: ['Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'under-armour', styleId: 'jackets', subStyleId: 'windbreaker' },

  // ---------- LULULEMON ----------
  { id: 'lulu-crew-neck-1', name: 'Lululemon Crew Neck Tee', brand: 'Lululemon', style: 'Shirts', subStyle: 'Crew Neck', price: '$58.00',
    image: getClothingImage('Lululemon', 'Shirts', 'crew-neck', 3), colors: ['White','Seafoam','Black'], sizes: ['XS','S','M','L'],
    companyId: 'lululemon', styleId: 'shirts', subStyleId: 'crew-neck' },
  { id: 'lulu-v-neck-1', name: 'Lululemon V-Neck Tee', brand: 'Lululemon', style: 'Shirts', subStyle: 'V-Neck', price: '$58.00',
    image: getClothingImage('Lululemon', 'Shirts', 'v-neck', 3), colors: ['Black','White','Gray'], sizes: ['XS','S','M','L'],
    companyId: 'lululemon', styleId: 'shirts', subStyleId: 'v-neck' },
  { id: 'lulu-button-down-1', name: 'Lululemon Button-Down Shirt', brand: 'Lululemon', style: 'Shirts', subStyle: 'Button Down', price: '$78.00',
    image: getClothingImage('Lululemon', 'Shirts', 'button-down', 3), colors: ['White','Sky'], sizes: ['XS','S','M','L'],
    companyId: 'lululemon', styleId: 'shirts', subStyleId: 'button-down' },
  { id: 'lulu-polo-1', name: 'Lululemon Metal Vent Polo', brand: 'Lululemon', style: 'Shirts', subStyle: 'Polo', price: '$88.00',
    image: getClothingImage('Lululemon', 'Shirts', 'polo', 3), colors: ['Navy','Black','White'], sizes: ['XS','S','M','L'],
    companyId: 'lululemon', styleId: 'shirts', subStyleId: 'polo' },

  { id: 'lulu-jeans-1', name: 'Lululemon Denim Jeans', brand: 'Lululemon', style: 'Pants', subStyle: 'Jeans', price: '$98.00',
    image: getClothingImage('Lululemon', 'Pants', 'jeans', 3), colors: ['Indigo','Black'], sizes: ['28','30','32','34','36'],
    companyId: 'lululemon', styleId: 'pants', subStyleId: 'jeans' },
  { id: 'lulu-joggers-1', name: 'Lululemon City Sweat Joggers', brand: 'Lululemon', style: 'Pants', subStyle: 'Joggers', price: '$118.00',
    image: getClothingImage('Lululemon', 'Pants', 'joggers', 3), colors: ['Navy','Black','Charcoal'], sizes: ['S','M','L','XL'],
    companyId: 'lululemon', styleId: 'pants', subStyleId: 'joggers' },
  { id: 'lulu-dress-pants-1', name: 'Lululemon Commission Dress Pants', brand: 'Lululemon', style: 'Pants', subStyle: 'Dress Pants', price: '$128.00',
    image: getClothingImage('Lululemon', 'Pants', 'dress-pants', 3), colors: ['Charcoal','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'lululemon', styleId: 'pants', subStyleId: 'dress-pants' },
  { id: 'lulu-leggings-1', name: 'Lululemon Align Leggings', brand: 'Lululemon', style: 'Pants', subStyle: 'Leggings', price: '$98.00',
    image: getClothingImage('Lululemon', 'Pants', 'leggings', 3), colors: ['Black','Navy','Gray'], sizes: ['XS','S','M','L','XL'],
    companyId: 'lululemon', styleId: 'pants', subStyleId: 'leggings' },

  { id: 'lulu-athletic-shorts-1', name: 'Lululemon Pace Athletic Shorts', brand: 'Lululemon', style: 'Shorts', subStyle: 'Athletic Shorts', price: '$68.00',
    image: getClothingImage('Lululemon', 'Shorts', 'athletic-shorts', 3), colors: ['Black','Blue','Lime'], sizes: ['S','M','L','XL'],
    companyId: 'lululemon', styleId: 'shorts', subStyleId: 'athletic-shorts' },
  { id: 'lulu-casual-shorts-1', name: 'Lululemon Casual Shorts', brand: 'Lululemon', style: 'Shorts', subStyle: 'Casual Shorts', price: '$64.00',
    image: getClothingImage('Lululemon', 'Shorts', 'casual-shorts', 3), colors: ['Khaki','Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'lululemon', styleId: 'shorts', subStyleId: 'casual-shorts' },
  { id: 'lulu-dress-shorts-1', name: 'Lululemon Dress Shorts', brand: 'Lululemon', style: 'Shorts', subStyle: 'Dress Shorts', price: '$78.00',
    image: getClothingImage('Lululemon', 'Shorts', 'dress-shorts', 3), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'lululemon', styleId: 'shorts', subStyleId: 'dress-shorts' },

  { id: 'lulu-hoodie-1', name: 'Lululemon Cozy Hoodie', brand: 'Lululemon', style: 'Jackets', subStyle: 'Hoodie', price: '$128.00',
    image: getClothingImage('Lululemon', 'Jackets', 'hoodie', 3), colors: ['Heather Gray','Black'], sizes: ['XS','S','M','L'],
    companyId: 'lululemon', styleId: 'jackets', subStyleId: 'hoodie' },
  { id: 'lulu-blazer-1', name: 'Lululemon Stretch Blazer', brand: 'Lululemon', style: 'Jackets', subStyle: 'Blazer', price: '$169.00',
    image: getClothingImage('Lululemon', 'Jackets', 'blazer', 3), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'lululemon', styleId: 'jackets', subStyleId: 'blazer' },
  { id: 'lulu-windbreaker-1', name: 'Lululemon Fast and Free Windbreaker', brand: 'Lululemon', style: 'Jackets', subStyle: 'Windbreaker', price: '$128.00',
    image: getClothingImage('Lululemon', 'Jackets', 'windbreaker', 3), colors: ['Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'lululemon', styleId: 'jackets', subStyleId: 'windbreaker' },

  // ---------- UNIQLO ----------
  { id: 'uniqlo-crew-neck-1', name: 'Uniqlo Crew Neck Tee', brand: 'Uniqlo', style: 'Shirts', subStyle: 'Crew Neck', price: '$14.90',
    image: getClothingImage('Uniqlo', 'Shirts', 'crew-neck', 4), colors: ['White','Light Gray','Black'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'shirts', subStyleId: 'crew-neck' },
  { id: 'uniqlo-v-neck-1', name: 'Uniqlo Supima V-Neck', brand: 'Uniqlo', style: 'Shirts', subStyle: 'V-Neck', price: '$14.90',
    image: getClothingImage('Uniqlo', 'Shirts', 'v-neck', 4), colors: ['White','Navy','Gray'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'shirts', subStyleId: 'v-neck' },
  { id: 'uniqlo-button-down-1', name: 'Uniqlo Oxford Button-Down', brand: 'Uniqlo', style: 'Shirts', subStyle: 'Button Down', price: '$29.90',
    image: getClothingImage('Uniqlo', 'Shirts', 'button-down', 4), colors: ['White','Light Blue','Pink'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'shirts', subStyleId: 'button-down' },
  { id: 'uniqlo-polo-1', name: 'Uniqlo Dry Piqué Polo', brand: 'Uniqlo', style: 'Shirts', subStyle: 'Polo', price: '$24.90',
    image: getClothingImage('Uniqlo', 'Shirts', 'polo', 4), colors: ['Navy','Black','White'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'shirts', subStyleId: 'polo' },

  { id: 'uniqlo-jeans-1', name: 'Uniqlo Slim Fit Jeans', brand: 'Uniqlo', style: 'Pants', subStyle: 'Jeans', price: '$39.90',
    image: getClothingImage('Uniqlo', 'Pants', 'jeans', 4), colors: ['Indigo','Black'], sizes: ['28','30','32','34','36'],
    companyId: 'uniqlo', styleId: 'pants', subStyleId: 'jeans' },
  { id: 'uniqlo-joggers-1', name: 'Uniqlo Stretch Joggers', brand: 'Uniqlo', style: 'Pants', subStyle: 'Joggers', price: '$49.90',
    image: getClothingImage('Uniqlo', 'Pants', 'joggers', 4), colors: ['Black','Gray','Navy'], sizes: ['S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'pants', subStyleId: 'joggers' },
  { id: 'uniqlo-dress-pants-1', name: 'Uniqlo Smart Dress Pants', brand: 'Uniqlo', style: 'Pants', subStyle: 'Dress Pants', price: '$49.90',
    image: getClothingImage('Uniqlo', 'Pants', 'dress-pants', 4), colors: ['Navy','Black','Gray'], sizes: ['S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'pants', subStyleId: 'dress-pants' },
  { id: 'uniqlo-leggings-1', name: 'Uniqlo AIRism Leggings', brand: 'Uniqlo', style: 'Pants', subStyle: 'Leggings', price: '$24.90',
    image: getClothingImage('Uniqlo', 'Pants', 'leggings', 4), colors: ['Black','Navy'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'pants', subStyleId: 'leggings' },

  { id: 'uniqlo-athletic-shorts-1', name: 'Uniqlo Active Athletic Shorts', brand: 'Uniqlo', style: 'Shorts', subStyle: 'Athletic Shorts', price: '$19.90',
    image: getClothingImage('Uniqlo', 'Shorts', 'athletic-shorts', 4), colors: ['Black','Blue','Gray'], sizes: ['S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'shorts', subStyleId: 'athletic-shorts' },
  { id: 'uniqlo-casual-shorts-1', name: 'Uniqlo Casual Chino Shorts', brand: 'Uniqlo', style: 'Shorts', subStyle: 'Casual Shorts', price: '$24.90',
    image: getClothingImage('Uniqlo', 'Shorts', 'casual-shorts', 4), colors: ['Khaki','Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'shorts', subStyleId: 'casual-shorts' },
  { id: 'uniqlo-dress-shorts-1', name: 'Uniqlo Dress Shorts', brand: 'Uniqlo', style: 'Shorts', subStyle: 'Dress Shorts', price: '$34.90',
    image: getClothingImage('Uniqlo', 'Shorts', 'dress-shorts', 4), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'shorts', subStyleId: 'dress-shorts' },

  { id: 'uniqlo-hoodie-1', name: 'Uniqlo Dry Hoodie', brand: 'Uniqlo', style: 'Jackets', subStyle: 'Hoodie', price: '$39.90',
    image: getClothingImage('Uniqlo', 'Jackets', 'hoodie', 4), colors: ['Black','Gray','Navy'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'jackets', subStyleId: 'hoodie' },
  { id: 'uniqlo-blazer-1', name: 'Uniqlo Stretch Blazer', brand: 'Uniqlo', style: 'Jackets', subStyle: 'Blazer', price: '$69.90',
    image: getClothingImage('Uniqlo', 'Jackets', 'blazer', 4), colors: ['Navy','Black'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'jackets', subStyleId: 'blazer' },
  { id: 'uniqlo-windbreaker-1', name: 'Uniqlo Blocktech Windbreaker', brand: 'Uniqlo', style: 'Jackets', subStyle: 'Windbreaker', price: '$59.90',
    image: getClothingImage('Uniqlo', 'Jackets', 'windbreaker', 4), colors: ['Black','Olive'], sizes: ['XS','S','M','L','XL'],
    companyId: 'uniqlo', styleId: 'jackets', subStyleId: 'windbreaker' },

  // ---------- H&M ----------
  { id: 'hm-crew-neck-1', name: 'H&M Crew Neck Tee', brand: 'H&M', style: 'Shirts', subStyle: 'Crew Neck', price: '$12.99',
    image: getClothingImage('H&M', 'Shirts', 'crew-neck', 5), colors: ['White','Black','Gray'], sizes: ['XS','S','M','L','XL'],
    companyId: 'h-m', styleId: 'shirts', subStyleId: 'crew-neck' },
  { id: 'hm-v-neck-1', name: 'H&M V-Neck Tee', brand: 'H&M', style: 'Shirts', subStyle: 'V-Neck', price: '$12.99',
    image: getClothingImage('H&M', 'Shirts', 'v-neck', 5), colors: ['Black','White','Navy'], sizes: ['XS','S','M','L','XL'],
    companyId: 'h-m', styleId: 'shirts', subStyleId: 'v-neck' },
  { id: 'hm-button-down-1', name: 'H&M Poplin Button-Down', brand: 'H&M', style: 'Shirts', subStyle: 'Button Down', price: '$24.99',
    image: getClothingImage('H&M', 'Shirts', 'button-down', 5), colors: ['White','Sky'], sizes: ['XS','S','M','L','XL'],
    companyId: 'h-m', styleId: 'shirts', subStyleId: 'button-down' },
  { id: 'hm-polo-1', name: 'H&M Cotton Polo', brand: 'H&M', style: 'Shirts', subStyle: 'Polo', price: '$17.99',
    image: getClothingImage('H&M', 'Shirts', 'polo', 5), colors: ['Navy','Black','White'], sizes: ['XS','S','M','L','XL'],
    companyId: 'h-m', styleId: 'shirts', subStyleId: 'polo' },

  { id: 'hm-jeans-1', name: 'H&M Slim Jeans', brand: 'H&M', style: 'Pants', subStyle: 'Jeans', price: '$29.99',
    image: getClothingImage('H&M', 'Pants', 'jeans', 5), colors: ['Indigo','Black'], sizes: ['28','30','32','34','36'],
    companyId: 'h-m', styleId: 'pants', subStyleId: 'jeans' },
  { id: 'hm-joggers-1', name: 'H&M Tapered Joggers', brand: 'H&M', style: 'Pants', subStyle: 'Joggers', price: '$24.99',
    image: getClothingImage('H&M', 'Pants', 'joggers', 5), colors: ['Black','Gray','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'h-m', styleId: 'pants', subStyleId: 'joggers' },
  { id: 'hm-dress-pants-1', name: 'H&M Dress Pants', brand: 'H&M', style: 'Pants', subStyle: 'Dress Pants', price: '$34.99',
    image: getClothingImage('H&M', 'Pants', 'dress-pants', 5), colors: ['Navy','Black','Gray'], sizes: ['S','M','L','XL'],
    companyId: 'h-m', styleId: 'pants', subStyleId: 'dress-pants' },
  { id: 'hm-leggings-1', name: 'H&M Stretch Leggings', brand: 'H&M', style: 'Pants', subStyle: 'Leggings', price: '$14.99',
    image: getClothingImage('H&M', 'Pants', 'leggings', 5), colors: ['Black','Navy'], sizes: ['XS','S','M','L','XL'],
    companyId: 'h-m', styleId: 'pants', subStyleId: 'leggings' },

  { id: 'hm-athletic-shorts-1', name: 'H&M Athletic Shorts', brand: 'H&M', style: 'Shorts', subStyle: 'Athletic Shorts', price: '$17.99',
    image: getClothingImage('H&M', 'Shorts', 'athletic-shorts', 5), colors: ['Black','Gray','Blue'], sizes: ['S','M','L','XL'],
    companyId: 'h-m', styleId: 'shorts', subStyleId: 'athletic-shorts' },
  { id: 'hm-casual-shorts-1', name: 'H&M Casual Shorts', brand: 'H&M', style: 'Shorts', subStyle: 'Casual Shorts', price: '$17.99',
    image: getClothingImage('H&M', 'Shorts', 'casual-shorts', 5), colors: ['Khaki','Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'h-m', styleId: 'shorts', subStyleId: 'casual-shorts' },
  { id: 'hm-dress-shorts-1', name: 'H&M Dress Shorts', brand: 'H&M', style: 'Shorts', subStyle: 'Dress Shorts', price: '$24.99',
    image: getClothingImage('H&M', 'Shorts', 'dress-shorts', 5), colors: ['Navy','Black'], sizes: ['S','M','L','XL'],
    companyId: 'h-m', styleId: 'shorts', subStyleId: 'dress-shorts' },

  { id: 'hm-hoodie-1', name: 'H&M Fleece Hoodie', brand: 'H&M', style: 'Jackets', subStyle: 'Hoodie', price: '$24.99',
    image: getClothingImage('H&M', 'Jackets', 'hoodie', 5), colors: ['Black','Gray','Navy'], sizes: ['XS','S','M','L','XL'],
    companyId: 'h-m', styleId: 'jackets', subStyleId: 'hoodie' },
  { id: 'hm-blazer-1', name: 'H&M Stretch Blazer', brand: 'H&M', style: 'Jackets', subStyle: 'Blazer', price: '$69.99',
    image: getClothingImage('H&M', 'Jackets', 'blazer', 5), colors: ['Navy','Black'], sizes: ['XS','S','M','L','XL'],
    companyId: 'h-m', styleId: 'jackets', subStyleId: 'blazer' },
  { id: 'hm-windbreaker-1', name: 'H&M Lightweight Windbreaker', brand: 'H&M', style: 'Jackets', subStyle: 'Windbreaker', price: '$39.99',
    image: getClothingImage('H&M', 'Jackets', 'windbreaker', 5), colors: ['Black','Olive'], sizes: ['S','M','L','XL'],
    companyId: 'h-m', styleId: 'jackets', subStyleId: 'windbreaker' },
]
