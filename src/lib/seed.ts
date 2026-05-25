import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const MOCK_MUSICIANS = [
  {
    username: "bass_master_jkt",
    displayName: "Andi Wijaya (Bass)",
    location: "Jakarta, Indonesia",
    skills: ["Bass Guitar", "Groove Design", "Fretless Bass"],
    lookingFor: ["Electric Guitar", "Drums", "Progressive Rock Band"],
    userRole: "musician",
    bio: "Groove is my oxygen. Currently playing bass in South Jakarta. Over 12 years playing funk, jazz fusion, and math rock. Available for professional sessions, studio recordings, or active gig-ready bands.",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
  },
  {
    username: "jakarta_shredder",
    displayName: "Donny Suhendra Jr.",
    location: "Jakarta, Indonesia",
    skills: ["Electric Guitar", "Bebop Improvisation", "Slide Guitar"],
    lookingFor: ["Bass Guitar", "Keys Player"],
    userRole: "musician",
    bio: "Obsessed with vintage blues-rock and jazz improvisation. Armed with a custom built Tele and a wall of tube amps. Let's meet up and jam in Senopati!",
    photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
  },
  {
    username: "vocal_queen_jkt",
    displayName: "Siti Rahma",
    location: "Jakarta, Indonesia",
    skills: ["Lead Vocals", "Neo-Soul Harmonies", "Songwriting"],
    lookingFor: ["Acoustic Guitar", "Keyboard / Piano"],
    userRole: "musician",
    bio: "Vocalist and contemporary songwriter inspired by Erykah Badu and Yura Yunita. Looking for an acoustic accompanist for intimate acoustic café sets around Jakarta.",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
  },
  {
    username: "drum_beast",
    displayName: "Raka Rhythm",
    location: "Bandung, Indonesia",
    skills: ["Drums", "Double Pedal", "Odd-meter Beats"],
    lookingFor: ["Bass Guitar", "Metal Core Collective"],
    userRole: "musician",
    bio: "Aggressive drumming with impeccable timing. High-octane metal and progressive post-hardcore. Looking to complete a rhythmic engine in Bandung or Jakarta.",
    photoURL: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=400&auto=format&fit=crop"
  },
  {
    username: "synth_wizard_bdg",
    displayName: "Galang Adhitya",
    location: "Bandung, Indonesia",
    skills: ["Analog Synthesizers", "Soundscapes", "Ableton Live"],
    lookingFor: ["Vocalist", "Post-Rock Band"],
    userRole: "musician",
    bio: "Creating futuristic, cinematic electronic sound patterns. Looking to integrate modular analog synths with heavy guitar riffs.",
    photoURL: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop"
  },
  {
    username: "acoustic_jakarta",
    displayName: "Bagas Pratama",
    location: "Jakarta, Indonesia",
    skills: ["Acoustic Guitar", "Fingerstyle", "Arrangement"],
    lookingFor: ["Lead Vocals", "Cajon Player"],
    userRole: "musician",
    bio: "Fingerstyle guitarist playing Indonesian pop and classic international hits. Available for premium weddings, hotel residencies, and corporate events.",
    photoURL: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=400&auto=format&fit=crop"
  },
  {
    username: "producer_jkt1",
    displayName: "Kevin Sanjaya",
    location: "Jakarta, Indonesia",
    skills: ["Music Production", "Mixing & Mastering", "Dolby Atmos"],
    lookingFor: ["Vocalists", "Bands", "Solo Artists"],
    userRole: "producer",
    bio: "Professional studio head in Central Jakarta. Equipped with premium SSL consoles and state-of-the-art microphones. Looking to discover and produce fresh local talents.",
    photoURL: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop"
  }
];

const MOCK_GEAR = [
  {
    id: "strat1965",
    title: "1965 Fender Stratocaster Candy Apple Red",
    description: "Fully original 1965 L-Series Stratocaster in highly coveted Candy Apple Red. Brazilian rosewood fingerboard, clay dots, grey-bottom pickups. Absolute playability, incredible historical patina. Appraisal sheet included.",
    price: 38500,
    condition: "Like New",
    mainCategory: "Guitars",
    subCategory: "Electric Guitar",
    images: ["https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "VintageVault",
    status: "active"
  },
  {
    id: "gibson1959",
    title: "1959 Gibson Les Paul Standard 'Burst'",
    description: "The holy grail of electric guitars. Beautiful top carve with subtle flame fading to a vintage tea burst. Includes original Lifton hardshell case and historic paperwork. Documented vintage pedigree.",
    price: 320000,
    condition: "Used",
    mainCategory: "Guitars",
    subCategory: "Electric Guitar",
    images: ["https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "GrailGuitars",
    status: "active"
  },
  {
    id: "fendertele",
    title: "Fender Custom Shop '51 Nocaster Relic",
    description: "Thick U-profile neck, blackguard finish with premium relic style aging. Incredibly resonant ash body with hand-wound loaded Nocaster single coil pickups.",
    price: 4200,
    condition: "Like New",
    mainCategory: "Guitars",
    subCategory: "Electric Guitar",
    images: ["https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "GrailGuitars",
    status: "active"
  },
  {
    id: "moogmat",
    title: "Moog Matriarch Semi-Modular Synthesizer",
    description: "4-note paraphonic analog synthesizer with built-in sequencer, arpeggiator, stereo ladder filters, and stereo analog delay. Beautiful colorful retro control panel.",
    price: 1999,
    condition: "New",
    mainCategory: "Synthesizers",
    subCategory: "Analog Synth",
    images: ["https://images.unsplash.com/photo-1593021941653-5353842cff3a?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "SynthDirect",
    status: "active"
  },
  {
    id: "sslsum",
    title: "SSL SiX Desktop Summing Mixer",
    description: "Compact desktop form factor featuring legendary SSL SuperAnalogue circuits, pristine preamps, and fully featured G-Series Bus Compressor controls.",
    price: 1250,
    condition: "Like New",
    mainCategory: "Studio",
    subCategory: "Mixer",
    images: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "ProAudioJKT",
    status: "active"
  },
  {
    id: "ludwig60",
    title: "1960s Ludwig Super Classic Drum Kit",
    description: "Golden Era Ludwig shells in original Sky Blue Pearl wrap. Warm, punchy 3-ply maple/poplar/maple shells with maple reinforcement rings. The ultimate retro studio recording drums.",
    price: 3200,
    condition: "Used",
    mainCategory: "Drums",
    subCategory: "Acoustic Kit",
    images: ["https://images.unsplash.com/photo-1543443374-b6fe10a6ab7b?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "TempoGrave",
    status: "active"
  },
  {
    id: "bossds1",
    title: "Vintage MIJ BOSS DS-1 Distortion (Analog)",
    description: "Highly sought after Japan-made orange legend with the classic vintage Roland analog IC. Delivers warm, gritty classic rock clipping that modern reissues don't match.",
    price: 240,
    condition: "Used",
    mainCategory: "Pedals",
    subCategory: "Distortion",
    images: ["https://images.unsplash.com/photo-1550291652-6ea9114a47b1?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "StompBoxer",
    status: "active"
  },
  {
    id: "voxac30",
    title: "1964 Vox AC30 Top Boost Combo Amp",
    description: "Genuine grey panel legend with authentic Celestion Alnico Blue speakers. Unmistakable British chime and crunch that response incredibly to your touch.",
    price: 8500,
    condition: "Used",
    mainCategory: "Amps",
    subCategory: "Tube Amplifier",
    images: ["https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop"],
    sellerName: "VintageVault",
    status: "active"
  }
];

const MOCK_FEED = [
  {
    caption: "Shredding on the 1965 Candy Apple Red Stratocaster. The touch sensitivity and bridge pickup growl is pure soul! Check details in Gear Vault. #fender #strat #vintagerock",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-playing-a-red-electric-guitar-4402-large.mp4",
    likesCount: 2410,
    gearId: "strat1965",
  },
  {
    caption: "Acid basslines pulsing through the Moog Matriarch. Semi-modular custom filters in real-time. Pure warm analog synthesis. #moog #matriarch #synthtok #modularsynth",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-the-notes-on-a-piano-4416-large.mp4",
    likesCount: 1850,
    gearId: "moogmat",
  },
  {
    caption: "Improvising some neo-soul chords on this vintage mahogany acoustic in South Jakarta. Deep, warm body projection. #acoustic #fingerstyle #guitarist",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-playing-acoustic-guitar-in-nature-4414-large.mp4",
    likesCount: 955,
  },
  {
    caption: "Testing out dynamic ranges on the 1960s Ludwig Super Classic. Unmatched warm recording tones. #ludwig #vintagedrums #studiolife",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-man-playing-drums-4409-large.mp4",
    likesCount: 3105,
    gearId: "ludwig60",
  },
  {
    caption: "Studio mixing with Siti Rahma. Recording vocals through high-end tube preamps and SSL SiX summing mixer. #recording #studio #musicproduction #jakarta",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-singing-into-a-vintage-microphone-4375-large.mp4",
    likesCount: 1420,
    gearId: "sslsum",
  }
];

export const seedMockData = async (userId: string) => {
  // 1. Seed Musician Profiles
  for (const musician of MOCK_MUSICIANS) {
    const userRef = doc(db, 'users', musician.username);
    await setDoc(userRef, {
      ...musician,
      uid: musician.username,
      role: 'seller',
      createdAt: serverTimestamp()
    });
  }

  // 2. Seed Gear Listings (Ensuring ID consistency for "Buy Now" lookups)
  for (const item of MOCK_GEAR) {
    const gearDocRef = doc(db, 'gears', item.id);
    await setDoc(gearDocRef, {
      ...item,
      sellerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // 3. Seed Feed Video Posts
  const feedRef = collection(db, 'feedPosts');
  for (const post of MOCK_FEED) {
    const matchedGear = MOCK_GEAR.find(g => g.id === post.gearId);
    await addDoc(feedRef, {
      ...post,
      userId: userId,
      username: "DemoUser",
      userPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
      createdAt: serverTimestamp(),
      // Use real ID if gearId exists
      gearId: post.gearId || null
    });
  }

  // 4. Seed Chat Threads and Messages for the user to view interactively
  const mockChatPartners = [
    {
      username: "bass_master_jkt",
      displayName: "Andi Wijaya (Bass)",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
      initialMessage: "Halo bro, gw liat di BandLink lu lagi nyari bass player buat project rock ya? Kebetulan gw di Jakarta Selatan nih, biasa nongkrong di Jaksel.",
      replyMessage: "Wah iya bener bro! Lagi cari bassist yg solid. Studio latihan biasa di Tebet atau Kebayoran Baru nih."
    },
    {
      username: "jakarta_shredder",
      displayName: "Donny Jr. (Guitarist)",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
      initialMessage: "Hey man, is the 1965 Fender Stratocaster still negotiable? Can I visit the studio to test play it first?",
      replyMessage: "Yes, it is available! Setup is ready on my boutique tube amps. Drop by whenever you are free in Jakarta."
    }
  ];

  for (const partner of mockChatPartners) {
    const chatId = `${userId}_${partner.username}`;
    const chatDocRef = doc(db, 'chats', chatId);

    // Create chat record
    await setDoc(chatDocRef, {
      id: chatId,
      participants: [userId, partner.username],
      lastMessage: partner.replyMessage,
      lastMessageAt: serverTimestamp(),
      groupName: partner.displayName,
      isGroup: false
    });

    // Add initial message from partner
    const msgColRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(msgColRef, {
      chatId,
      senderId: partner.username,
      text: partner.initialMessage,
      createdAt: serverTimestamp()
    });

    // Add response from DemoUser to simulate conversation
    await addDoc(msgColRef, {
      chatId,
      senderId: userId,
      text: partner.replyMessage,
      createdAt: serverTimestamp()
    });
  }

  return true;
};
