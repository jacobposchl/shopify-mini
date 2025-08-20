# Shop Discovery System

## Overview
The shop discovery system transforms the hardcoded brand selection into a dynamic, intelligent shop recommendation engine that uses the Shopify Shop Minis SDK to discover and rank shops based on user behavior and product popularity.

## Architecture

### Three-Tier Shop Discovery Strategy

#### Tier 1: Most Relevant to User (Highest Priority)
- **Followed Shops**: Shops the user has explicitly followed
- **Recent Shops**: Shops the user has recently interacted with
- **Recommended Shops**: Personalized recommendations based on user preferences

#### Tier 2: Top Brands Overall
- **Popular Shops**: Extracted from trending products using `useProductSearch`
- **Ranked by**: Product popularity, engagement metrics
- **Data Source**: Shopify's product search API

#### Tier 3: Additional Discovery (Fallback)
- **Discovery Shops**: Curated list of shops for new user exploration
- **Fallback**: Ensures users always have shops to browse

## Key Components

### 1. `useShopDiscovery` Hook
**Location**: `src/hooks/useShopDiscovery.ts`

**Features**:
- Combines multiple data sources with intelligent prioritization
- Handles loading states and error scenarios
- Manages user preferences (follows, recent visits, recommendations)
- Provides shop interaction functions (follow, unfollow, visit)

**Usage**:
```typescript
const { 
  shops, 
  loading, 
  followShop, 
  unfollowShop, 
  recordShopVisit 
} = useShopDiscovery()
```

### 2. Enhanced CompanySelection Component
**Location**: `src/components/CompanySelection.tsx`

**New Features**:
- Dynamic shop loading from multiple sources
- Priority badges showing recommendation reasons
- Follow/unfollow functionality
- Loading and empty states
- Shop visit tracking

**Visual Indicators**:
- ⭐ Recommended shops
- ❤️ Followed shops  
- 🕒 Recently visited
- 🔥 Popular/trending
- ✨ Discovery shops

### 3. Type Definitions
**Location**: `src/types/index.ts`

**New Types**:
```typescript
export enum ShopPriority {
  RECOMMENDED = 'RECOMMENDED',
  FOLLOWED = 'FOLLOWED',
  RECENT = 'RECENT', 
  POPULAR = 'POPULAR',
  DISCOVERY = 'DISCOVERY'
}

export interface DiscoveredShop extends Company {
  priority: ShopPriority
  reason: string
  lastSeen?: Date
  interactionCount?: number
}
```

## Data Flow

```
1. User opens CompanySelection
   ↓
2. useShopDiscovery hook activates
   ↓
3. Multiple data sources fetch in parallel:
   - User preferences (follows, recent, recommendations)
   - Popular products from Shopify API
   - Fallback discovery shops
   ↓
4. Data merging and deduplication
   ↓
5. Priority-based sorting
   ↓
6. UI rendering with loading states
```

## User Interactions

### Following Shops
- Users can follow/unfollow shops directly from the selection grid
- Followed shops appear at the top of recommendations
- Follow state persists across sessions

### Shop Visits
- Automatically recorded when selecting a shop
- Used for recent shop recommendations
- Influences trending algorithm

### Trending Algorithm
- Combines user clicks with daily rotation
- Ensures variety while respecting user preferences
- Top 3 shops get medal indicators (🥇🥈🥉)

## Error Handling & Fallbacks

### Graceful Degradation
- If Shopify API fails, falls back to mock data
- Loading states prevent UI crashes
- Empty states provide user feedback

### Partial Failures
- Individual data source failures don't break the system
- Shops are still discoverable even if some sources fail
- User preferences are preserved locally

## Performance Optimizations

### Data Caching
- User preferences cached in AsyncStorage
- Shop data cached in component state
- Minimal re-fetching of unchanged data

### Lazy Loading
- Images load progressively with fallbacks
- Pagination for large shop lists
- Efficient grid rendering with virtual scrolling

## Future Enhancements

### Potential Improvements
1. **Machine Learning**: Personalized shop recommendations based on user behavior
2. **Real-time Updates**: Live shop popularity and trending data
3. **Social Features**: Shop sharing and collaborative discovery
4. **Analytics**: Detailed user interaction tracking and insights

### SDK Integration
- Leverage additional Shopify hooks as they become available
- Integrate with Shopify's recommendation engine
- Connect to Shopify's analytics and insights

## Testing

### Demo Component
**Location**: `src/components/ShopDiscoveryDemo.tsx`

Use this component to test and demonstrate the shop discovery functionality:
- Shows all discovered shops with priority indicators
- Interactive follow/unfollow buttons
- Shop visit tracking
- User preference display

## Migration Notes

### From Hardcoded to Dynamic
- **Before**: Static `companies` array from mock data
- **After**: Dynamic `discoveredShops` from multiple sources
- **Backward Compatibility**: Maintains existing Company interface
- **UI Consistency**: Preserves existing grid layout and styling

### Breaking Changes
- None - all existing functionality preserved
- Enhanced with new features
- Graceful fallback to mock data if needed
