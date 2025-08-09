import {usePopularProducts, ProductCard} from '@shopify/shop-minis-react'

export function App() {
  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-600">
        🎉 Hello Shop Minis!
      </h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800 text-center font-medium">
          ✅ App is working! This is a test message.
        </p>
      </div>
      
      <div className="space-y-3 text-center">
        <p className="text-lg text-gray-700">
          Welcome to your Shopify Mini App
        </p>
        <p className="text-sm text-gray-500">
          If you can see this text, everything is working correctly!
        </p>
        <p className="text-xs text-gray-400">
          Current time: {new Date().toLocaleTimeString()}
        </p>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-700 text-center text-sm">
          🚀 Ready to build something amazing for the Shopify Mini Hackathon!
        </p>
      </div>
    </div>
  )
}
