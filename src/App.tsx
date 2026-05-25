import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Film, Users, ShoppingBag, MessageSquare, User, 
  Search, Play, Heart, Share2, Plus, MapPin, 
  ChevronRight, LogOut, CheckCircle2, Star, 
  Send, Mic, Shield, Filter, Sparkles, X, Info, 
  ChevronDown, Check, AlertCircle, Trash2, Edit, Radio 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout, db } from './lib/firebase';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { AuthDialog } from './components/AuthDialog';
import { GearListing, UserProfile, Chat, Message, FeedPost, BandGroup } from './types';
import { seedMockData } from './lib/seed';
import { 
  collection, query, where, getDocs, addDoc, 
  serverTimestamp, orderBy, limit, onSnapshot, 
  doc, updateDoc, deleteDoc, setDoc, arrayUnion 
} from 'firebase/firestore';
import { cn, formatDate } from './lib/utils';

// --- Components ---

const Sidebar = ({ onViewChange, currentView, onOpenAuth }: { onViewChange: (v: string) => void, currentView: string, onOpenAuth: () => void }) => {
  const { profile, logout } = useAuth();

  const menuItems = [
    { id: 'market', icon: ShoppingBag, label: 'Gear Market' },
    { id: 'feed', icon: Film, label: 'Discover Feed' },
    { id: 'bandlink', icon: Users, label: 'BandLink Hub' },
    { id: 'chats', icon: MessageSquare, label: 'Live Signal' },
  ];

  return (
    <aside className="w-20 md:w-68 border-r border-white/5 flex flex-col bg-black h-screen sticky top-0 z-50">
      <div className="p-6 flex items-center justify-center md:justify-start gap-3 cursor-pointer" onClick={() => onViewChange('market')}>
        <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-black text-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">G</div>
        <div className="hidden md:block">
          <h1 className="text-xl font-black tracking-tighter text-white italic leading-none">GROOVE</h1>
          <p className="text-[10px] text-emerald-400 font-extrabold tracking-widest leading-none mt-1">STAGE</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map(item => (
          <button 
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center justify-center md:justify-start px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
              currentView === item.id 
                ? "bg-zinc-900 border border-white/5 text-emerald-400 shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-5.5 h-5.5 md:mr-4", currentView === item.id ? "stroke-[2.5px] text-emerald-400" : "stroke-[1.8px] group-hover:scale-105 transition-transform")} />
            <span className="hidden md:block font-bold tracking-tight text-sm">{item.label}</span>
            {currentView === item.id && (
              <span className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-md hidden md:block" />
            )}
          </button>
        ))}
        
        <div className="h-px bg-white/5 my-6 mx-2" />
        
        <button 
          onClick={() => onViewChange('profile')}
          className={cn(
            "w-full flex items-center justify-center md:justify-start px-4 py-3.5 rounded-2xl transition-all group relative",
            currentView === 'profile' 
              ? "bg-zinc-900 border border-white/5 text-emerald-400" 
              : "text-zinc-500 hover:text-white hover:bg-white/5"
          )}
        >
          <User className="w-5.5 h-5.5 md:mr-4" />
          <span className="hidden md:block font-bold tracking-tight text-sm">Artist Studio</span>
        </button>
      </nav>

      <div className="p-4 mt-auto">
        {profile ? (
          <div className="bg-zinc-950 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
            <img 
              src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.username}&background=059669&color=fff`} 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20" 
            />
            <div className="hidden md:block flex-1 overflow-hidden">
              <p className="text-white text-xs font-bold truncate leading-none mb-1">{profile.displayName || profile.username}</p>
              <p className="text-emerald-400 text-[9px] uppercase font-black tracking-widest leading-none">{profile.userRole || 'ARTIST'}</p>
            </div>
            <button onClick={logout} className="hidden md:block text-zinc-500 hover:text-white ml-1 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
         ) : (
          <button onClick={onOpenAuth} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3.5 rounded-2xl transition-all uppercase tracking-tighter text-xs shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            Join Club
          </button>
        )}
      </div>
    </aside>
  );
};

// --- View: TikTok Discover Feed ---

const FeedView = ({ onSelectGear }: { onSelectGear: (gearId: string) => void }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activePlayback, setActivePlayback] = useState<string | null>(null);
  const [buyerConfirm, setBuyerConfirm] = useState<string | null>(null);
  const [likedList, setLikedList] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'feedPosts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, s => {
      const fetched = s.docs.map(d => ({ id: d.id, ...d.data() })) as FeedPost[];
      setPosts(fetched);
    });
  }, []);

  const handleLike = async (postId: string, currentCount: number) => {
    if (likedList.includes(postId)) {
      setLikedList(prev => prev.filter(id => id !== postId));
      await updateDoc(doc(db, 'feedPosts', postId), { likesCount: currentCount - 1 });
    } else {
      setLikedList(prev => [...prev, postId]);
      await updateDoc(doc(db, 'feedPosts', postId), { likesCount: currentCount + 1 });
    }
  };

  return (
    <div className="h-full bg-black overflow-hidden relative">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex gap-6 text-white font-black uppercase tracking-tighter text-sm">
        <span className="opacity-40 cursor-pointer hover:opacity-100 transition-opacity">Following</span>
        <span className="border-b-2 border-emerald-500 pb-1 cursor-pointer">For You</span>
      </div>

      <div className="h-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
        {posts.length > 0 ? posts.map((post, i) => (
          <div key={post.id} className="h-full w-full snap-start relative flex items-center justify-center">
            {/* Real Video Component with fallback styling if asset is offline */}
            <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
              <video 
                src={post.videoUrl} 
                className="w-full h-full object-cover"
                autoPlay 
                muted 
                loop 
                playsInline
                onError={(e) => {
                  // Fallback if video URL failed to load
                  console.log("video load error, showing backdrop overlay");
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
            </div>

            {/* Content & Action Panels */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 flex flex-col justify-end z-10 w-full max-w-5xl mx-auto">
              <div className="flex items-end justify-between gap-6">
                
                {/* Artist Bio Info Block */}
                <div className="space-y-4 max-w-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.userPhoto || `https://ui-avatars.com/api/?name=${post.username}&background=10b981&color=fff`} 
                      className="w-12 h-12 rounded-full border border-white/20 shadow-[-10px_10px_20px_rgba(0,0,0,0.5)] object-cover" 
                    />
                    <div>
                      <h3 className="text-white font-black text-lg flex items-center gap-1">
                        @{post.username} 
                        <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] text-black">✓</span>
                      </h3>
                      <p className="text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest">VERIFIED CREATOR</p>
                    </div>
                  </div>
                  
                  <p className="text-white text-md font-medium tracking-tight drop-shadow-xl select-none leading-relaxed bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                    {post.caption}
                  </p>
                  
                  <div className="flex items-center gap-3 text-zinc-400 text-xs bg-black/30 w-fit px-3 py-1.5 rounded-full">
                    <Music className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span className="font-semibold">{post.username} Original Demo Session</span>
                  </div>
                </div>

                {/* TikTok Dynamic Right Rail Action Buttons */}
                <div className="flex flex-col gap-6 items-center">
                  
                  {/* Heart / Likes */}
                  <button 
                    onClick={() => handleLike(post.id, post.likesCount)}
                    className="flex flex-col items-center gap-1.5 group select-none"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300",
                      likedList.includes(post.id) 
                        ? "bg-red-500/20 border-red-500/30 text-red-500 scale-110" 
                        : "bg-white/10 border-white/10 text-white hover:bg-white/20 hover:scale-105"
                    )}>
                      <Heart className={cn("w-6 h-6", likedList.includes(post.id) ? "fill-red-500 text-red-500 animate-pulse" : "")} />
                    </div>
                    <span className="text-white font-black text-xs tracking-wider">{post.likesCount.toLocaleString()}</span>
                  </button>

                  {/* Comment Thread Trigger */}
                  <button 
                    onClick={() => alert("Comment Section is initialized! Keep listening to the session.")}
                    className="flex flex-col items-center gap-1.5 group select-none"
                  >
                    <div className="w-12 h-12 bg-white/10 border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all">
                      <MessageSquare className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-white font-black text-xs">48</span>
                  </button>

                  {/* Share Trigger */}
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(post.videoUrl);
                      alert("Session video link copied successfully to clipboard!");
                    }}
                    className="flex flex-col items-center gap-1.5 group select-none"
                  >
                    <div className="w-12 h-12 bg-white/10 border border-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-white font-black text-[10px] tracking-wide uppercase">Share</span>
                  </button>

                  {/* Dynamic Buy Setup Feature Link inside video */}
                  {post.gearId && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-2"
                    >
                      <button 
                        onClick={() => onSelectGear(post.gearId!)}
                        className="bg-[#FFFF00] hover:bg-yellow-400 text-black px-5 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 font-black uppercase tracking-tighter shadow-[0_0_30px_rgba(255,255,0,0.5)] border-2 border-black transition-all"
                      >
                        <ShoppingBag className="w-4 h-4 text-black animate-bounce" />
                        <span className="text-[10px] whitespace-nowrap leading-none tracking-widest">BUY SETUP</span>
                      </button>
                    </motion.div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-extrabold italic text-lg uppercase tracking-wider">SYNCING DEMO SESSIONS...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- View: BandLink (Creative Directories & Matchmaking) ---

const BandLinkView = ({ onCreateChat }: { onCreateChat: (partnerUid: string) => void }) => {
  const { user, profile, refreshProfile } = useAuth();
  
  // Musicians state
  const [musicians, setMusicians] = useState<UserProfile[]>([]);
  const [filterCity, setFilterCity] = useState('');
  const [filterAbility, setFilterAbility] = useState('');
  
  // Custom Ability Uploader State
  const [isRegistering, setIsRegistering] = useState(false);
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regLocation, setRegLocation] = useState('Jakarta, Indonesia');
  const [regRole, setRegRole] = useState<'musician' | 'producer' | 'technician'>('musician');
  const [regSkills, setRegSkills] = useState('');
  const [regLooking, setRegLooking] = useState('');
  const [regBio, setRegBio] = useState('');

  // Band Group State
  const [showBandModal, setShowBandModal] = useState(false);
  const [bandGroups, setBandGroups] = useState<BandGroup[]>([]);
  const [newBandName, setNewBandName] = useState('');
  const [newBandGenre, setNewBandGenre] = useState('');
  const [newBandLocation, setNewBandLocation] = useState('Jakarta');
  const [newBandDesc, setNewBandDesc] = useState('');

  useEffect(() => {
    // Load musicians
    const q = query(collection(db, 'users'), where('userRole', 'in', ['musician', 'producer', 'technician']));
    const unsubMusicians = onSnapshot(q, s => {
      setMusicians(s.docs.map(d => ({ uid: d.id, ...d.data() })) as UserProfile[]);
    });

    // Load active band groups
    const bgQ = query(collection(db, 'bandGroups'), orderBy('createdAt', 'desc'));
    const unsubBands = onSnapshot(bgQ, s => {
      setBandGroups(s.docs.map(d => ({ id: d.id, ...d.data() })) as BandGroup[]);
    });

    return () => {
      unsubMusicians();
      unsubBands();
    };
  }, []);

  // Filter strategy
  const filteredMusicians = musicians.filter(m => {
    const matchCity = !filterCity || m.location?.toLowerCase().includes(filterCity.toLowerCase());
    const matchAbility = !filterAbility || 
      m.skills?.some(s => s.toLowerCase().includes(filterAbility.toLowerCase())) ||
      m.userRole?.toLowerCase().includes(filterAbility.toLowerCase()) ||
      m.bio?.toLowerCase().includes(filterAbility.toLowerCase());
    return matchCity && matchAbility;
  });

  // Self Publish logic
  const handleRegisterAbility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please join the club using Google Authentication first!");
      return;
    }

    try {
      setIsRegistering(true);
      const skillsArr = regSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const lookingArr = regLooking.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const userProfileRef = doc(db, 'users', user.uid);
      await setDoc(userProfileRef, {
        uid: user.uid,
        username: user.displayName?.toLowerCase().replace(/\s+/g, '_') || "user_" + user.uid.substring(0, 5),
        displayName: regDisplayName || user.displayName || 'Anonymous Musician',
        email: user.email || '',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${regDisplayName || 'Musician'}&background=10b981&color=fff`,
        location: regLocation,
        userRole: regRole,
        skills: skillsArr.length > 0 ? skillsArr : ["Guitarist"],
        lookingFor: lookingArr.length > 0 ? lookingArr : ["Bassist", "Drummer"],
        bio: regBio || "Musician ready to collaborate.",
        role: "seller",
        createdAt: serverTimestamp()
      }, { merge: true });

      alert("Awesome! Your musician ability profile is now registered live on the grid!");
      await refreshProfile();
      // Clear inputs
      setRegSkills('');
      setRegLooking('');
      setRegBio('');
    } catch (err: any) {
      alert("Error publishing ability: " + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Form a new band group & auto create group chat
  const handleCreateBandGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please register your profile first in order to form groups.");
      return;
    }

    if (!newBandName.trim()) {
      alert("Please specify consecutive Band Name!");
      return;
    }

    try {
      // Create new Band Document in Firestore
      const bandRef = collection(db, 'bandGroups');
      const newGroupDoc = await addDoc(bandRef, {
        name: newBandName,
        description: newBandDesc || "No description provided yet.",
        location: newBandLocation,
        genres: [newBandGenre || "Alternative"],
        members: [user.uid],
        createdAt: serverTimestamp()
      });

      // Automatically spin up a Group Chat for this formed Band
      const chatRef = doc(db, 'chats', `group_${newGroupDoc.id}`);
      await setDoc(chatRef, {
        id: `group_${newGroupDoc.id}`,
        participants: [user.uid, "bass_master_jkt", "jakarta_shredder"], // Auto-invite seeded professionals to the chat for instant demo interactions!
        lastMessage: `Group chat formed for ${newBandName} in ${newBandLocation}! Let's coordinate rehearsals.`,
        lastMessageAt: serverTimestamp(),
        groupName: `${newBandName} [${newBandLocation}]`,
        isGroup: true
      });

      // Add seed welcoming message
      const msgColRef = collection(db, 'chats', `group_${newGroupDoc.id}`, 'messages');
      await addDoc(msgColRef, {
        chatId: `group_${newGroupDoc.id}`,
        senderId: "system",
        text: `Collective channel initialized! Welcome to ${newBandName}. Feel free to start your communication stage.`,
        createdAt: serverTimestamp()
      });

      alert(`Band formed successfully! Let's schedule sessions. A live channel 'group_${newGroupDoc.id}' is active in Messages.`);
      setShowBandModal(false);
      setNewBandName('');
      setNewBandDesc('');
    } catch (err: any) {
      alert("Error creating band: " + err.message);
    }
  };

  return (
    <div className="p-4 md:p-12 space-y-12">
      {/* Header section with high-end aesthetic typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="max-w-4xl space-y-2">
          <p className="text-emerald-500 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2">
            <Radio className="w-4 h-4 animate-ping text-emerald-400" /> BANDLINK COLLECTIVE INTERFACE
          </p>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-white">
            COORDINATORS & <span className="text-emerald-500">PLAYERS</span>
          </h1>
          <p className="text-zinc-500 text-md font-semibold max-w-xl leading-relaxed">
            Locate professional multi-instrumentalists, jam setups, and group project organizers in Jakarta & regions across Indonesia instantly.
          </p>
        </div>
        
        <button 
          onClick={() => setShowBandModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_4px_24px_rgba(16,185,129,0.3)] transition-all"
        >
          <Plus className="w-4 h-4 font-black" /> Form a Band Collective
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Columns: Directory Search and Card Deck */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Dual Input Search Control Module */}
          <div className="bg-zinc-900/60 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input 
                type="text" 
                placeholder="Ability query (e.g. Bass, Drums, Producer)..." 
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={filterAbility}
                onChange={(e) => setFilterAbility(e.target.value)}
              />
            </div>
            
            <div className="md:w-1/3 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="City (e.g. Jakarta)" 
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
            </div>
          </div>

          {/* Active Band Collectives listed globally on screen */}
          {bandGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black tracking-widest uppercase text-emerald-500">Active Band Collectives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bandGroups.map(bg => (
                  <div key={bg.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl space-y-3 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase px-2.5 py-1 rounded">
                          {bg.genres ? bg.genres[0] : 'Alternative'}
                        </span>
                        <span className="text-zinc-500 text-[10px] font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" /> {bg.location}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-white italic">{bg.name}</h4>
                      <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed mt-2">{bg.description}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-4">
                      <span className="text-[10px] text-zinc-500 font-extrabold">{bg.members?.length || 1} Collective Members</span>
                      <button 
                        onClick={() => onCreateChat(`group_${bg.id}`)}
                        className="bg-white hover:bg-emerald-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                        Enter Channel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Musicians Profiles Grid Rendering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMusicians.length > 0 ? filteredMusicians.map(musician => (
              <motion.div 
                key={musician.uid}
                whileHover={{ y: -5 }}
                className="hd-card bg-zinc-900/40 p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <img 
                      src={musician.photoURL || `https://ui-avatars.com/api/?name=${musician.username}&background=059669&color=ccc`} 
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-emerald-500/10 group-hover:ring-emerald-500/20" 
                    />
                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      {musician.userRole?.toUpperCase() || "PRO"}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black italic tracking-tight text-white group-hover:text-emerald-400 transition-all">{musician.displayName || musician.username}</h3>
                  <p className="text-zinc-500 flex items-center gap-1 font-bold text-xs mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {musician.location || 'Everywhere'}
                  </p>

                  <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed mt-3">{musician.bio}</p>

                  {/* Skills lists */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Abilities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {musician.skills && musician.skills.map(skill => (
                          <span key={skill} className="bg-white/5 border border-white/5 text-white px-2 py-1 rounded-md text-[9px] font-extrabold">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest leading-none mb-1.5">Searching For</p>
                      <div className="flex flex-wrap gap-1.5">
                        {musician.lookingFor && musician.lookingFor.map(look => (
                          <span key={look} className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md text-[9px] font-extrabold">{look}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => onCreateChat(musician.uid)}
                    className="w-full bg-zinc-800 group-hover:bg-emerald-500 text-white group-hover:text-black py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-colors"
                  >
                    Send Signal
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center hd-card bg-zinc-900/30">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h4 className="text-xl font-black text-white italic uppercase">No Musicians Matching Search Area</h4>
                <p className="text-zinc-500 text-sm mt-1">Try filtering by "Jakarta", "Bandung" or another ability.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: "Upload My Ability" visual register section */}
        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem] space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Broadcast Your Skills</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Upload your skills so other local bands/producers in Jakarta, Bandung & surrounding regions can find and invite you instantly!
            </p>
          </div>

          <form onSubmit={handleRegisterAbility} className="space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Display Name / Identity</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Andi Bassist" 
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Your Base Location</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Jakarta, Indonesia" 
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1"
                value={regLocation}
                onChange={(e) => setRegLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['musician', 'producer', 'technician'] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRegRole(role)}
                  className={cn(
                    "py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border",
                    regRole === role 
                      ? "bg-emerald-500 border-emerald-400 text-black" 
                      : "bg-black/40 border-white/5 text-zinc-500 hover:text-white"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Skills & Abilties (Comma Separated)</label>
              <input 
                type="text" 
                placeholder="e.g. Jazz Bass, Lead Vocals, Synth Setup" 
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1"
                value={regSkills}
                onChange={(e) => setRegSkills(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Looking For (Comma Separated)</label>
              <input 
                type="text" 
                placeholder="e.g. Rock Band, Live Gigs, Drummer" 
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1"
                value={regLooking}
                onChange={(e) => setRegLooking(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Creative Bio / Intros</label>
              <textarea 
                rows={3}
                placeholder="Share your gigs history, influences or gears you use..." 
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1 resize-none"
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={isRegistering}
              className="w-full bg-emerald-500 text-black font-black uppercase text-xs tracking-wider py-4 rounded-xl shadow-[0_4px_24px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-colors mt-2"
            >
              {isRegistering ? "Broadcasting signal..." : "Publish on Live Directory"}
            </button>
          </form>
        </div>
      </div>

      {/* Assemble Collective Band Group Modal Trigger Dialog */}
      {showBandModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-white/10 max-w-lg w-full rounded-[2.5rem] p-8 space-y-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-black italic uppercase tracking-wider text-white">Assemble Collective Group</h3>
              </div>
              <button onClick={() => setShowBandModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBandGroup} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Group Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Jakarta Funk Revolution" 
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm mt-1"
                  value={newBandName}
                  onChange={(e) => setNewBandName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Primary Genre</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Funk Fusion" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm mt-1"
                    value={newBandGenre}
                    onChange={(e) => setNewBandGenre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">City Base</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Jakarta" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm mt-1"
                    value={newBandLocation}
                    onChange={(e) => setNewBandLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Collective Goals & Description</label>
                <textarea 
                  rows={4}
                  placeholder="Need players to join rock gigs, practice studio plans, or track sessions in Southern Jakarta..." 
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm mt-1 resize-none"
                  value={newBandDesc}
                  onChange={(e) => setNewBandDesc(e.target.value)}
                />
              </div>

              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/15 flex gap-3 text-xs leading-relaxed text-zinc-400">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Creating a collective band group establishes an interactive <strong>Group Chat channel</strong> instantly and invites professional members like Andi Wijaya and Donny Jr. to join the coordinates.</span>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-lg transition-colors"
              >
                Assemble & Publish Collective
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- View: Real-Time Chat & Collaborative Messaging Engine ---

const ChatsView = ({ activeChatId, onSelectChatId, onOpenAuth }: { activeChatId: string | null, onSelectChatId: (id: string | null) => void, onOpenAuth: () => void }) => {
  const { user, profile } = useAuth();
  
  const [chatThreads, setChatThreads] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);

  // Scroll to bottom helper
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Load user involved chat threads
    const chatsQ = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unsubChats = onSnapshot(chatsQ, s => {
      setChatThreads(s.docs.map(d => ({ id: d.id, ...d.data() })) as Chat[]);
      setLoadingThreads(false);
    });

    return unsubChats;
  }, [user]);

  useEffect(() => {
    if (!activeChatId) return;

    // Load active chats records
    const msgsQ = query(
      collection(db, 'chats', activeChatId, 'messages'), 
      orderBy('createdAt', 'asc')
    );
    
    const unsubMsgs = onSnapshot(msgsQ, s => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]);
      
      // Push thread scroll down
      setTimeout(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return unsubMsgs;
  }, [activeChatId]);

  const handleSendSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChatId || !typedMessage.trim()) return;

    try {
      const msgText = typedMessage;
      setTypedMessage('');

      // Add to messages sub-collection
      const msgColRef = collection(db, 'chats', activeChatId, 'messages');
      await addDoc(msgColRef, {
        chatId: activeChatId,
        senderId: user.uid,
        text: msgText,
        createdAt: serverTimestamp()
      });

      // Update parent document's meta
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: msgText,
        lastMessageAt: serverTimestamp()
      });

    } catch (err: any) {
      alert("Error transmitting messaging: " + err.message);
    }
  };

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
        <MessageSquare className="w-16 h-16 text-zinc-700" />
        <h3 className="text-2xl font-black italic uppercase text-white">Channel Offline</h3>
        <p className="text-zinc-500 max-w-sm">Please register or authenticate your profile to activate Live Messaging coordinates.</p>
        <button onClick={onOpenAuth} className="bg-emerald-500 text-black px-6 py-2.5 rounded-full font-black text-xs uppercase hover:bg-emerald-400">Join Club Network</button>
      </div>
    );
  }

  const activeThreadObj = chatThreads.find(t => t.id === activeChatId);

  return (
    <div className="h-full flex flex-col md:flex-row bg-zinc-950 overflow-hidden">
      
      {/* Left Pane: Conversations Deck */}
      <div className={cn(
        "w-full md:w-80 border-r border-white/5 flex flex-col bg-black h-full",
        activeChatId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Live Signals</h2>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Collaborator channels, negotiating pipelines and collective rooms.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {loadingThreads ? (
            <p className="text-xs text-zinc-500 text-center py-4 font-bold">Scanning Signals...</p>
          ) : chatThreads.length > 0 ? chatThreads.map(thread => {
            const isSelected = thread.id === activeChatId;
            return (
              <button
                key={thread.id}
                onClick={() => onSelectChatId(thread.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 relative",
                  isSelected 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-zinc-900/30 border-white/5 text-zinc-400 hover:bg-zinc-900/60"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-850 flex items-center justify-center font-black text-white overflow-hidden uppercase shrink-0">
                  {thread.isGroup ? (
                    <Users className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${thread.groupName || 'Chat'}&background=10b981&color=fff`} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-black text-white truncate max-w-[120px]">
                      {thread.groupName || 'Direct Message'}
                    </p>
                    {thread.isGroup && (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-500/20">GROUP</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">{thread.lastMessage || 'Channel created'}</p>
                </div>
              </button>
            );
          }) : (
            <div className="text-center py-10 space-y-2">
              <MessageSquare className="w-10 h-10 text-zinc-800 mx-auto" />
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-wider">No active channels</p>
              <p className="text-[10px] text-zinc-500 px-4 leading-normal">Publish your profile in BandLink or hit 'Send Signal' on a player card to coordinate.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Conversation Content Panel */}
      <div className={cn(
        "flex-1 flex flex-col bg-zinc-950 h-full justify-between relative",
        !activeChatId ? "hidden md:flex items-center justify-center p-12 text-center" : "flex"
      )}>
        
        {activeChatId && activeThreadObj ? (
          <>
            {/* Thread Header info panel */}
            <div className="p-6 bg-black border-b border-white/5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onSelectChatId(null)}
                  className="md:hidden bg-zinc-900 border border-white/5 p-2 rounded-xl text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-md font-black italic uppercase tracking-wider text-white">
                    {activeThreadObj.groupName || 'Secure Session Coordinator'}
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE FREQUENCY CONNECTION
                  </p>
                </div>
              </div>
              
              <div className="text-[10px] bg-white/5 border border-white/5 text-zinc-500 px-3 py-1.5 rounded-full font-bold">
                AES-256 ENCRYPTED
              </div>
            </div>

            {/* Conversation Core Streams */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user.uid;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id || i} className="flex justify-center my-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/10 py-2.5 px-4 rounded-xl max-w-md text-center text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id || i} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <img 
                        src={`https://ui-avatars.com/api/?name=${msg.senderId}&background=09090b&color=fff`} 
                        className="w-7 h-7 rounded-lg object-cover" 
                      />
                    )}
                    <div className="space-y-1 max-w-[70%]">
                      <div className={cn(
                        "p-4 rounded-[1.2rem] text-sm leading-relaxed border",
                        isMe 
                          ? "bg-emerald-500 border-emerald-400 text-black rounded-br-sm" 
                          : "bg-zinc-900 border-white/5 text-zinc-100 rounded-bl-sm"
                      )}>
                        {msg.text}
                      </div>
                      <p className={cn("text-[8px] font-bold text-zinc-600", isMe ? "text-right" : "text-left")}>
                        {msg.createdAt && formatDate(msg.createdAt.toDate ? msg.createdAt.toDate() : new Date())}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            {/* Message composer input bar */}
            <form onSubmit={handleSendSignal} className="p-6 bg-black border-t border-white/5 flex gap-3">
              <input 
                type="text" 
                placeholder="Type your signal or coordination details..." 
                className="flex-1 bg-zinc-900 border border-white/5 px-5 py-4 text-sm font-semibold rounded-2xl text-white outline-none focus:ring-1 focus:ring-emerald-500/30 placeholder:text-zinc-600"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-[0_4px_16px_rgba(16,185,129,0.3)] shrink-0 transition-colors"
              >
                <Send className="w-5 h-5 text-black" />
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-4 max-w-sm">
            <Radio className="w-12 h-12 text-zinc-800 mx-auto" />
            <h3 className="text-xl font-black italic uppercase text-zinc-700">No Receiver Designated</h3>
            <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Select one of your designated band groups or click recruit on any profile cards in BandLink directory to begin transmission.</p>
          </div>
        )}

      </div>

    </div>
  );
};

// --- View: Studio (Profile/Inventory) ---

const StudioView = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'posts' | 'groups'>('listings');

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/20">
             <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=10b981&color=fff`} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{profile?.displayName || profile?.username}</h1>
            <p className="text-emerald-500 font-extrabold uppercase tracking-widest text-[10px] mt-1">{profile?.userRole || 'Creative Member'} • {profile?.location || 'Indie Zone'}</p>
            <div className="flex gap-3 mt-3">
              <div className="bg-zinc-905 px-3 py-1.5 rounded-lg border border-white/5 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <p className="text-zinc-400 text-[10px] font-bold uppercase">Escrow Live</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8 border-b border-white/5">
        {['listings', 'posts', 'groups'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "pb-4 text-xs font-black uppercase tracking-widest relative",
              activeTab === tab ? "text-emerald-500" : "text-zinc-500"
            )}
          >
            {tab}
            {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />}
          </button>
        ))}
      </div>

      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div 
             onClick={() => alert("Register/Edit listings and check payouts from the main Gear Market.")}
             className="hd-card bg-zinc-900/30 border-dashed border-zinc-805 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-500/40 cursor-pointer group"
           >
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                <Plus className="text-white group-hover:text-black" />
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Deploy New Marketplace Listing</p>
           </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div 
             onClick={() => alert("Upload demo short videos or linked setup clips straight to Discover Feed showcases from your phone integration.")}
             className="hd-card bg-zinc-900/30 border-dashed border-zinc-850 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-500/40 cursor-pointer group"
           >
              <Film className="w-10 h-10 text-zinc-750" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Publish Showcase Video Feed</p>
           </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div 
             onClick={() => alert("Please manage, form and assemble music collectives inside the designated 'BandLink Hub' view.")}
             className="hd-card bg-zinc-900/30 border-dashed border-zinc-850 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-500/40 cursor-pointer group"
           >
              <Users className="w-10 h-10 text-zinc-750" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-black">Coordinating Group Rooms</p>
           </div>
        </div>
      )}
    </div>
  );
};

// --- View: Complete Beautiful Overhaul of the Gear Market ---

const MarketView = ({ onSelectGearId }: { onSelectGearId: (id: string) => void }) => {
  const [gears, setGears] = useState<GearListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Guitars', 'Synthesizers', 'Studio', 'Drums', 'Amps', 'Pedals'];

  useEffect(() => {
    let q = query(collection(db, 'gears'), orderBy('createdAt', 'desc'));
    if (activeCategory !== 'All') {
      q = query(collection(db, 'gears'), where('mainCategory', '==', activeCategory), orderBy('createdAt', 'desc'));
    }
    
    return onSnapshot(q, (s) => {
      setGears(s.docs.map(d => ({ id: d.id, ...d.data() })) as GearListing[]);
      setLoading(false);
    });
  }, [activeCategory]);

  const filteredGears = gears.filter(g => 
    !searchQuery || 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.mainCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-12 space-y-12 shrink-0">
      
      {/* High-end Bento style premium hero header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Big Panel: Aesthetic Title & Identity */}
        <div className="lg:col-span-2 bg-gradient-to-r from-emerald-950/20 to-black p-8 md:p-12 rounded-[2.5rem] border border-emerald-500/10 flex flex-col justify-between space-y-10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="space-y-3">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-3.5 py-1.5 rounded-full tracking-widest border border-emerald-500/20">
              ⚡ INDONESIA'S PREMIUM GEAR RADAR
            </span>
            <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              GEAR<br/><span className="text-emerald-500">VAULT</span>
            </h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base font-semibold max-w-xl leading-relaxed">
            The professional digital marketplace designed specifically for musicians to safely acquire vintage electric guitars, modular synths, high-performance studio desks, and boutique pedals.
          </p>
        </div>

        {/* Right Bento Box: Escrow & Integrity Panel */}
        <div className="bg-zinc-900/60 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <Shield className="w-10 h-10 text-emerald-400 animate-pulse" />
            <h3 className="text-xl font-black italic uppercase text-white tracking-widest">Escrow Assurance</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
              Payouts are permanently protected. Sellers receive disbursements solely after buyers authenticate physical delivery and audio setups.
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-between gap-4">
            <div>
              <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Live Node Integrity</p>
              <p className="text-white text-md font-black italic">ACTIVE 100%</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Listed Assets</p>
              <p className="text-white text-md font-black italic">Rp 4.2 BILLION+</p>
            </div>
          </div>
        </div>

      </div>

      {/* Aesthetic Navigation Filters and Search Segment */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-white/5 overflow-x-auto scrollbar-hide">
        
        {/* Chips tab */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border mb-1",
                activeCategory === cat 
                  ? "bg-white border-white text-black shadow-lg" 
                  : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative min-w-[340px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          <input 
            type="text" 
            placeholder="Search manufacturers, models, pedals, or areas..." 
            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-xs font-black tracking-wide text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-600 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      </div>

      {/* Marketplace grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
        {loading ? (
          <div className="col-span-full h-96 flex items-center justify-center flex-col space-y-3">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Scanning Catalog vaults...</p>
          </div>
        ) : filteredGears.length > 0 ? filteredGears.map((gear) => (
          <motion.div 
            key={gear.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            onClick={() => onSelectGearId(gear.id)}
            className="group relative cursor-pointer"
          >
            <div className="hd-card bg-zinc-900/40 p-4 space-y-4 flex flex-col justify-between min-h-[460px]">
              
              {/* Product graphic */}
              <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-black border border-white/5 flex items-center justify-center">
                <img 
                  src={gear.images[0]} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Condition top badge */}
                <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-[#FFFF00] border border-[#FFFF00]/20 shadow-md">
                  {gear.condition}
                </div>
              </div>

              {/* Text content details */}
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{gear.mainCategory}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className="w-2.5 h-2.5 text-zinc-700 fill-zinc-700" />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white italic truncate tracking-tight group-hover:text-emerald-400 transition-colors mt-1">
                    {gear.title}
                  </h3>
                  <p className="text-zinc-500 text-xs line-clamp-2 mt-1.5 leading-relaxed font-semibold">
                    {gear.description}
                  </p>
                </div>

                {/* Pricing & buy direct segment */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between align-bottom mt-4">
                  <div>
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">GUARANTEED ESCROW</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter mt-0.5">
                      ${gear.price.toLocaleString()}
                    </p>
                  </div>
                  
                  <span className="bg-emerald-500 text-black px-4.5 py-3 rounded-xl font-black uppercase text-[10px] shadow-[0_4px_16px_rgba(16,185,129,0.15)] group-hover:bg-emerald-400 select-none">
                    INSPECT
                  </span>
                </div>

              </div>
              
            </div>

            {/* Float Badge */}
            <div className="absolute -top-1.5 -left-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
               <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center -rotate-12 border-3 border-black font-black text-black text-[9px] uppercase leading-none text-center shadow-md">
                 SAFE<br/>TRADE
               </div>
            </div>

          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center hd-card bg-zinc-900/10">
            <ShoppingBag className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-zinc-600 italic uppercase">No assets caught on the grid</h3>
            <p className="text-zinc-500 mt-2">Adjust your filters, search queries, or try different category labels.</p>
          </div>
        )}
      </div>

    </div>
  );
};

// --- View: Interactive Detail & Checkout Panel Modal Overlay ---

const GearDetailModal = ({ gearId, onClose, onDirectMessage }: { gearId: string, onClose: () => void, onDirectMessage: (sellerId: string) => void }) => {
  const [gear, setGear] = useState<GearListing | null>(null);
  const [buyingStatus, setBuyingStatus] = useState<'idle' | 'purchasing' | 'success'>('idle');

  useEffect(() => {
    return onSnapshot(doc(db, 'gears', gearId), d => {
      if (d.exists()) {
        setGear({ id: d.id, ...d.data() } as GearListing);
      }
    });
  }, [gearId]);

  const handlePurchase = () => {
    setBuyingStatus('purchasing');
    setTimeout(() => {
      setBuyingStatus('success');
    }, 1800);
  };

  if (!gear) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-zinc-950 border border-white/5 w-full max-w-4xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-[0_10px_60px_rgba(0,0,0,0.85)]"
      >
        {/* Left Side: Product Picture presentation */}
        <div className="w-full md:w-1/2 bg-black relative flex items-center justify-center aspect-square md:aspect-auto">
          <img 
            src={gear.images[0]} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-6 left-6 space-y-1">
            <span className="bg-emerald-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded">
              {gear.condition}
            </span>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Escrow Protection Active</p>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 bg-black/50 border border-white/10 text-white p-3 rounded-full hover:bg-black/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Product Details & Specifications */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between space-y-8 overflow-y-auto max-h-[600px] md:max-h-none">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[9px] font-black uppercase px-3 py-1 rounded">
                {gear.mainCategory}
              </span>
              <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">ID: {gear.id}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-tight">
                {gear.title}
              </h2>
              <p className="text-zinc-500 text-xs uppercase font-extrabold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Inspected by Studio Board
              </p>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed font-semibold">
              {gear.description}
            </p>

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-[10px] text-black">A</div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">DESIGNATED SELLER</p>
                  <p className="text-white text-xs font-black truncate">{gear.sellerName || "Escrow Board"}</p>
                </div>
              </div>
              
              <button 
                onClick={() => onDirectMessage(gear.sellerId || "bass_master_jkt")}
                className="bg-white/5 hover:bg-white/15 border border-white/5 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
              >
                Inquire & DM
              </button>
            </div>
          </div>

          {/* Action and Pricing segment */}
          <div className="pt-6 border-t border-white/5 flex flex-col space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-zinc-600 font-extrabold tracking-widest uppercase">SECURED ESCROW FEE</p>
                <p className="text-4xl font-black text-white italic tracking-tighter">
                  ${gear.price.toLocaleString()}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-[9px] text-emerald-400 font-extrabold uppercase">INSTANT DELIVERY</p>
                <p className="text-zinc-500 text-[10px] font-bold">2-Year Audio Warranty</p>
              </div>
            </div>

            {buyingStatus === 'idle' && (
              <button 
                onClick={handlePurchase}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4.5 rounded-2xl shadow-[0_4px_30px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingBag className="w-4 h-4 text-black" /> Secure Escrow Checkout
              </button>
            )}

            {buyingStatus === 'purchasing' && (
              <div className="w-full bg-zinc-90 w-fit p-4.5 rounded-2xl border border-white/5 flex items-center justify-center gap-3 text-xs uppercase font-extrabold text-white">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                TRANSMITTING COGNIZANT CODES...
              </div>
            )}

            {buyingStatus === 'success' && (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center space-y-2"
              >
                <p className="text-emerald-400 font-black uppercase tracking-widest text-xs">★ CHECKOUT SECURED SUCCESS ★</p>
                <p className="text-zinc-500 text-[10px] font-bold">Escrow record registered dynamically. Check your signals in 'Live Signal' messages to arrange handovers.</p>
              </motion.div>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
};

// --- Main App Setup ---

function AppContent() {
  const [currentView, setCurrentView] = useState('market');
  const { user, profile, loading } = useAuth();
  
  // Custom auth overlay state
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Custom dialogs/overlays target
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-600 text-[10px] tracking-widest font-black uppercase">BOOTING STUDIO LAYOUTS...</p>
    </div>
  );

  const handleSeed = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      setIsSeeding(true);
      await seedMockData(user.uid);
      alert("Success! Applet is successfully injected with top-tier guitars, Jakarta bassists, customized TikTok videos and real-time chat threads!");
      window.location.reload();
    } catch (err: any) {
      alert("Error seeding data: " + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Switch to specific gear details modal
  const handleSelectGear = (gearId: string) => {
    setSelectedGearId(gearId);
  };

  // Launch or open DM chat with a player
  const handleCreateChat = async (partnerUid: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check if group chat link
    if (partnerUid.startsWith("group_")) {
      setActiveChatId(partnerUid);
      setCurrentView('chats');
      return;
    }

    try {
      const targetChatId = `${user.uid}_${partnerUid}`;
      const chatDocRef = doc(db, 'chats', targetChatId);

      // Create a clean chat record
      await setDoc(chatDocRef, {
        id: targetChatId,
        participants: [user.uid, partnerUid],
        lastMessage: "Conversation initialized.",
        lastMessageAt: serverTimestamp(),
        groupName: partnerUid === "bass_master_jkt" ? "Andi Wijaya (Bass)" : partnerUid === "jakarta_shredder" ? "Donny Jr. (Guitarist)" : `Artist @${partnerUid}`,
        isGroup: false
      }, { merge: true });

      // Welcoming system text
      const msgColRef = collection(db, 'chats', targetChatId, 'messages');
      const s = await getDocs(msgColRef);
      if (s.empty) {
        await addDoc(msgColRef, {
          chatId: targetChatId,
          senderId: "system",
          text: `Secure encrypted frequency opened. Begin coordination.`,
          createdAt: serverTimestamp()
        });
      }

      setActiveChatId(targetChatId);
      setCurrentView('chats');
      setSelectedGearId(null);
    } catch (err: any) {
      alert("Error establishing contact signal: " + err.message);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar onViewChange={setCurrentView} currentView={currentView} onOpenAuth={() => setShowAuthModal(true)} />

      <main className="flex-1 relative h-screen overflow-y-auto overflow-x-hidden scrollbar-hide bg-zinc-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="h-full"
          >
            {currentView === 'feed' && <FeedView onSelectGear={handleSelectGear} />}
            {currentView === 'market' && <MarketView onSelectGearId={handleSelectGear} />}
            {currentView === 'bandlink' && <BandLinkView onCreateChat={handleCreateChat} />}
            {currentView === 'chats' && <ChatsView activeChatId={activeChatId} onSelectChatId={setActiveChatId} onOpenAuth={() => setShowAuthModal(true)} />}
            {currentView === 'profile' && <StudioView />}
          </motion.div>
        </AnimatePresence>

        {/* Global Details Modal Display */}
        <AnimatePresence>
          {selectedGearId && (
            <GearDetailModal 
              gearId={selectedGearId} 
              onClose={() => setSelectedGearId(null)} 
              onDirectMessage={handleCreateChat}
            />
          )}
        </AnimatePresence>

        {/* Global Built-In Auth Dialog Overlay */}
        <AnimatePresence>
          {showAuthModal && (
            <AuthDialog onClose={() => setShowAuthModal(false)} />
          )}
        </AnimatePresence>

        {/* Floating Developer Debug Seed Button */}
        <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3">
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="bg-zinc-900 hover:border-emerald-500 border border-white/5 shadow-2xl text-[9px] font-black uppercase text-zinc-400 px-5 py-3 rounded-full transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            {isSeeding ? "Infecting database..." : "Injection System"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
