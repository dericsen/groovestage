export interface UserProfile {
  uid: string;
  username: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  lookingFor?: string[];
  userRole?: 'musician' | 'producer' | 'technician';
  role: 'buyer' | 'seller' | 'admin';
  isVerified?: boolean;
  createdAt: any;
}

export interface FeedPost {
  id: string;
  userId: string;
  username: string;
  userPhoto?: string;
  videoUrl: string;
  caption?: string;
  gearId?: string; // Optional link to gear for "Buy Now"
  likesCount: number;
  createdAt: any;
}

export interface BandGroup {
  id: string;
  name: string;
  description?: string;
  members: string[]; // User UIDs
  location?: string;
  genres?: string[];
  createdAt: any;
}

export interface GearListing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'New' | 'Like New' | 'Used' | 'Heavily Used';
  mainCategory: string;
  subCategory: string;
  subSubCategory?: string;
  images: string[];
  videoUrl?: string;
  sellerId: string;
  sellerName: string;
  sellerPhoto?: string;
  status: 'active' | 'sold' | 'reserved';
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  productId?: string;
  isGroup?: boolean;
  groupName?: string;
}
