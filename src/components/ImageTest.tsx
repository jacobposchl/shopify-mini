import { useState } from 'react'
import { ProductImage } from './ProductImage'
import { useShopifyProducts } from '../hooks/useShopifyProducts'

export function ImageTest() {
  const [selectedBrand, setSelectedBrand] = useState('nike')
  const [selectedStyle, setSelectedStyle] = useState('shirts')
  const [selectedSubStyle, setSelectedSubStyle] = useState('crew-neck')
  
  const { products, loading, error } = useShopifyProducts(
    selectedBrand,
    selectedStyle,
    selectedSubStyle
  )

  const testImages = [
    // Valid Shopify image
    'https://cdn.shopify.com/s/files/1/0757/9955/files/test-product.jpg',
    // Invalid image
    'https://invalid-url.com/image.jpg',
    // No image
    '',
    // External image
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=96&h=96&fit=crop'
  ]

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Image System Test</h2>
      
      {/* Test Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Brand:</label>
          <select 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="nike">Nike</option>
            <option value="adidas">Adidas</option>
            <option value="under-armour">Under Armour</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Style:</label>
          <select 
            value={selectedStyle} 
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="shirts">Shirts</option>
            <option value="pants">Pants</option>
            <option value="shorts">Shorts</option>
            <option value="jackets">Jackets</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Sub Style:</label>
          <select 
            value={selectedSubStyle} 
            onChange={(e) => setSelectedSubStyle(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="crew-neck">Crew Neck</option>
            <option value="v-neck">V-Neck</option>
            <option value="jeans">Jeans</option>
            <option value="joggers">Joggers</option>
          </select>
        </div>
      </div>

      {/* Shopify Products */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Shopify Products</h3>
        {loading && <p className="text-gray-500">Loading products...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 4).map((product, index) => (
              <div key={index} className="border rounded p-3">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-24 rounded mb-2"
                  styleId={selectedStyle}
                  subStyleId={selectedSubStyle}
                  width={96}
                  height={96}
                />
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-gray-500">${product.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No products found</p>
        )}
      </div>

      {/* Test Images */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Test Images</h3>
        <div className="grid grid-cols-2 gap-4">
          {testImages.map((src, index) => (
            <div key={index} className="border rounded p-3">
              <ProductImage
                src={src}
                alt={`Test image ${index + 1}`}
                className="w-full h-24 rounded mb-2"
                styleId={selectedStyle}
                subStyleId={selectedSubStyle}
                width={96}
                height={96}
              />
              <p className="text-xs text-gray-500">
                {src || 'No source'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
        <div className="text-sm space-y-1">
          <p><strong>Selected:</strong> {selectedBrand} / {selectedStyle} / {selectedSubStyle}</p>
          <p><strong>Products found:</strong> {products?.length || 0}</p>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          {error && <p><strong>Error:</strong> {error}</p>}
        </div>
      </div>
    </div>
  )
}
