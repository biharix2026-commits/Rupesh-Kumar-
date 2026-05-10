import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Palette, 
  Youtube, 
  Instagram, 
  MessageSquare, 
  Gamepad2, 
  Sparkles, 
  ChevronRight,
  Send,
  X,
  Upload,
  Lock,
  LogOut,
  Mail,
  Trash2,
  Download
} from "lucide-react";
import { auth, db, loginWithGoogle, OperationType, handleFirestoreError } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const services = [
  {
    title: "YouTube Thumbnail Design",
    description: "High-click-through-rate thumbnails that grab attention instantly.",
    icon: <Youtube className="w-8 h-8 text-neon-pink" />,
    stats: "CTR Boost +40%"
  },
  {
    title: "3D Neon Logo Design",
    description: "Modern, glowing logos that define your brand's future identity.",
    icon: <Palette className="w-8 h-8 text-neon-cyan" />,
    stats: "Unique Concepts"
  },
  {
    title: "Social Media Branding",
    description: "Complete visual sets for Instagram, Twitter, and Facebook.",
    icon: <Instagram className="w-8 h-8 text-neon-purple" />,
    stats: "Full Kit"
  },
  {
    title: "Gaming Graphics",
    description: "Esports ready logos, banners, and streaming overlays.",
    icon: <Gamepad2 className="w-8 h-8 text-neon-cyan" />,
    stats: "Level Up"
  },
  {
    title: "Cinematic Posters",
    description: "Epic poster designs for movies, events, or personal projects.",
    icon: <Sparkles className="w-8 h-8 text-neon-pink" />,
    stats: "4K Clarity"
  },
  {
    title: "Digital Art & Editing",
    description: "Advanced photo manipulation and neon digital art pieces.",
    icon: <Zap className="w-8 h-8 text-neon-purple" />,
    stats: "Creative Meta"
  },
];

const portfolioItems = [
  { id: 1, title: "Neon Cyberpunk Logo", category: "Logo Design", img: "https://picsum.photos/seed/neon1/800/600" },
  { id: 2, title: "Pro Gamer Thumbnail", category: "YouTube", img: "https://picsum.photos/seed/neon2/800/600" },
  { id: 3, title: "Streetwear Brand Identity", category: "Branding", img: "https://picsum.photos/seed/neon3/800/600" },
  { id: 4, title: "Esports Tournament Poster", category: "Poster", img: "https://picsum.photos/seed/neon4/800/600" },
  { id: 5, title: "Futuristic App UI Assets", category: "Digital Art", img: "https://picsum.photos/seed/neon5/800/600" },
  { id: 6, title: "Social Media Campaign", category: "Marketing", img: "https://picsum.photos/seed/neon6/800/600" },
  { id: 7, title: "Streaming Overlay Pack", category: "Streaming", img: "https://picsum.photos/seed/neon7/800/600" },
  { id: 8, title: "Synthwave Album Cover", category: "Cover Art", img: "https://picsum.photos/seed/neon8/800/600" },
  { id: 9, title: "Cyber-Dojo Visuals", category: "3D Animation", img: "https://picsum.photos/seed/neon9/800/600" },
];

export default function App() {
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [user, setUser] = useState<User | null>(null);
  const [creations, setCreations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<"upload" | "messages" | "posts">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<{file: File, preview: string}[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [visiblePortfolio, setVisiblePortfolio] = useState(6);
  const [viewingCreation, setViewingCreation] = useState<any | null>(null);
  const [editingCreation, setEditingCreation] = useState<any | null>(null);

  // Admin email from runtime instructions
  const ADMIN_EMAIL = "biharix2026@gmail.com";
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "messages");
    }
  };

  const handleDeleteCreation = async (creationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this creation?")) return;
    try {
      await deleteDoc(doc(db, "creations", creationId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "creations");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "posts");
    }
  };

  const scrollToPortfolio = () => {
    document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Check for first visit
    const visited = localStorage.getItem("biharix_visited");
    if (!visited) {
      setShowWelcome(true);
      localStorage.setItem("biharix_visited", "true");
    }

    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    
    // Creations listener
    const qCreations = query(collection(db, "creations"), orderBy("createdAt", "desc"));
    const unsubCreations = onSnapshot(qCreations, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCreations(data);
    }, (error) => {
      if ((error as any).code === 'unavailable') {
        console.warn("Firestore is offline or connection failed.");
      } else {
        handleFirestoreError(error, OperationType.LIST, "creations");
      }
    });

    // Posts listener
    const qPosts = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "posts");
    });

    // Messages listener (Admin only)
    let unsubMessages = () => {};
    if (isAdmin) {
      const qMessages = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      unsubMessages = onSnapshot(qMessages, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "messages");
      });
    }

    return () => {
      unsubAuth();
      unsubCreations();
      unsubPosts();
      unsubMessages();
    };
  }, [isAdmin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadError(null);
      // Process all selected files
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800; // Reduced for more aggressive size save
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress aggressively so base64 string is < 1,000,000 chars
            let compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
            
            // If still too large (> 800,000 chars), compress further
            if (compressedDataUrl.length > 800000) {
              compressedDataUrl = canvas.toDataURL("image/jpeg", 0.3);
            }
            
            if (compressedDataUrl.length > 950000) {
              setUploadError("An image is still too large after compression. Try simpler images.");
            } else {
              setUploads(prev => [...prev, { file, preview: compressedDataUrl }]);
            }
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin || uploads.length === 0) return;
    setUploadError(null);
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const tier = formData.get("tier") as string;

    setIsUploading(true);
    try {
      // Create multiple documents, one for each uploaded file
      await Promise.all(uploads.map((upload, index) => {
        // If multiple, append number to title
        const itemTitle = uploads.length > 1 ? `${title} ${index + 1}` : title;
        return addDoc(collection(db, "creations"), {
          title: itemTitle,
          category,
          tier,
          imageUrl: upload.preview,
          authorId: user?.uid,
          createdAt: serverTimestamp(),
        });
      }));

      setShowAdmin(false);
      setUploads([]);
      setAdminTab("upload");
    } catch (error) {
      console.error(error);
      setUploadError("Upload failed! The images might be too large.");
      handleFirestoreError(error, OperationType.CREATE, "creations");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const formData = new FormData(e.currentTarget);
    const text = formData.get("text") as string;

    try {
      await addDoc(collection(db, "posts"), {
        text,
        authorId: user?.uid,
        createdAt: serverTimestamp(),
      });
      e.currentTarget.reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "posts");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin || !editingCreation) return;
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const tier = formData.get("tier") as string;

    try {
      // Firestore rule: incoming().diff(existing()).affectedKeys().hasOnly(['title', 'category', 'imageUrl', 'tier'])
      // Wait we need to include imageUrl to avoid missing fields if any, actually the rule says `hasOnly`, meaning we CAN omit fields we aren't changing.
      // But we just use updateDoc with the fields we want to change.
      await updateDoc(doc(db, "creations", editingCreation.id), {
        title,
        category,
        tier
      });
      setEditingCreation(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "creations");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("sending");
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const text = formData.get("text") as string;

    try {
      await addDoc(collection(db, "messages"), {
        name,
        email,
        text,
        createdAt: serverTimestamp(),
      });
      setFormStatus("sent");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "messages");
      setFormStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-neon-cyan/30 text-white">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-neon-gradient z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-pink/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-tighter bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent flex items-center gap-2"
          >
            BIHARIX<span className="text-white">2026</span>
          </motion.h1>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-gray-400">
            {["Services", "Portfolio", "Contact"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="hover:text-neon-cyan transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={() => setShowAdmin(true)}
                className="p-2 bg-neon-cyan/20 text-neon-cyan rounded-full hover:bg-neon-cyan/30 transition-colors"
                title="Admin Panel"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
            {!user ? (
              <button 
                onClick={loginWithGoogle}
                className="p-2 text-gray-500 hover:text-white transition-colors"
                title="Login"
              >
                <Lock className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => signOut(auth)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-white text-black text-xs font-bold rounded-full uppercase tracking-tighter hover:bg-neon-cyan transition-colors"
            >
              Let's Talk
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full text-neon-cyan text-xs font-bold mb-6">
              <Sparkles className="w-3 h-3" />
              TOP RATED GRAPHIC DESIGNER
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 font-display">
              SHAPING THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-pink">NEON FUTURE.</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-lg mb-10 leading-relaxed font-light">
              We specialize in premium YouTube branding, 3D neon logo design, and high-impact visual aesthetics for the digital age.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={scrollToPortfolio}
                className="px-8 py-4 bg-neon-cyan text-black font-black rounded-2xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all"
              >
                VIEW WORK <ChevronRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 border border-white/10 hover:bg-white/5 transition-colors font-bold rounded-2xl">
                GET A QUOTE
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Abstract Visual Asset */}
            <div className="relative w-full aspect-square max-w-[500px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan to-neon-pink blur-[100px] opacity-20" />
              <div className="relative h-full w-full border border-white/10 rounded-[60px] bg-black/40 backdrop-blur-3xl overflow-hidden flex items-center justify-center group">
                <div className="text-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-48 border-2 border-dashed border-neon-cyan/30 rounded-full flex items-center justify-center mb-6"
                  >
                    <div className="w-40 h-40 border-2 border-dashed border-neon-pink/30 rounded-full" />
                  </motion.div>
                  <h2 className="text-9xl font-black font-display tracking-tighter text-neon-cyan group-hover:text-neon-pink transition-colors">B</h2>
                  <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mt-4">Biharix Design Systems</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest Creations "Live" Feed */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
              <h3 className="text-2xl font-black tracking-tighter">RECENTLY COMPLETED</h3>
            </div>
            {creations.length === 0 && (
              <span className="text-xs text-gray-500 font-mono">WAITING FOR NEW DESIGNS...</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {creations.length > 0 ? (
              creations.slice(0, 8).map((creation) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={creation.id} 
                  onClick={() => setViewingCreation(creation)}
                  className="group relative aspect-video rounded-2xl overflow-hidden border border-white/10 cursor-pointer"
                >
                  {creation.tier === "premium" && !isAdmin ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 backdrop-blur-md">
                      <Lock className="w-6 h-6 text-yellow-500 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Premium</p>
                    </div>
                  ) : (
                    <img 
                      src={creation.imageUrl} 
                      alt={creation.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {creation.tier === "premium" && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-yellow-500 border border-yellow-500/20 z-10">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase mb-1">
                      {creation.category}
                    </span>
                    <h5 className="text-xs font-black truncate">{creation.title}</h5>
                  </div>
                </motion.div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-video rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-sm font-bold tracking-[0.3em] text-neon-cyan uppercase mb-4">What we do</h2>
              <h3 className="text-4xl md:text-5xl font-black font-display">PREMIUM SERVICES</h3>
            </div>
            <p className="text-gray-500 max-w-xs font-light">
              Elevate your digital presence with our specialized design solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={scrollToPortfolio}
                className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-neon-cyan/30 transition-colors group cursor-pointer"
              >
                <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h4 className="text-2xl font-bold mb-3">{service.title}</h4>
                <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                  {service.description}
                </p>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono text-neon-cyan uppercase tracking-wider">{service.stats}</span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Showcase */}
      <section id="portfolio" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-[0.3em] text-neon-pink uppercase mb-4">Latest Projects</h2>
            <h3 className="text-4xl md:text-5xl font-black font-display">DESIGN PORTFOLIO</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {creations.slice(0, visiblePortfolio).map((creation, i) => (
              <motion.div
                key={creation.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer relative"
                onClick={() => setViewingCreation(creation)}
              >
                <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
                  {creation.tier === "premium" && !isAdmin ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 backdrop-blur-md">
                      <Lock className="w-12 h-12 text-yellow-500 mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-yellow-500">Premium Content</p>
                    </div>
                  ) : (
                    <img 
                      src={creation.imageUrl} 
                      alt={creation.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[50%] group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {creation.tier === "premium" && (
                    <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-yellow-500 flex items-center gap-1.5 border border-yellow-500/20 z-10">
                      <Lock className="w-3 h-3" /> PREMIUM
                    </div>
                  )}

                  {isAdmin && (
                    <div className="absolute top-8 right-8 flex gap-2 z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingCreation(creation); }}
                        className="p-3 bg-black/60 backdrop-blur-md text-white hover:text-neon-cyan hover:bg-black rounded-full border border-white/20 transition-colors"
                        title="Edit Creation"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteCreation(creation.id, e)}
                        className="p-3 bg-black/60 backdrop-blur-md text-white hover:text-red-500 hover:bg-black rounded-full border border-white/20 transition-colors"
                        title="Delete Creation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="absolute bottom-8 left-8">
                    <p className="text-xs font-bold text-neon-pink uppercase tracking-widest mb-1">{creation.category}</p>
                    <h4 className="text-xl font-black tracking-tight">{creation.title}</h4>
                  </div>
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                    <div className="p-3 bg-white text-black rounded-full shadow-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {creations.length > visiblePortfolio && (
            <div className="mt-16 text-center">
              <button 
                onClick={() => setVisiblePortfolio(prev => prev + 3)}
                className="px-10 py-5 bg-white text-black font-black rounded-full hover:bg-neon-cyan transition-colors text-sm tracking-widest flex items-center gap-3 mx-auto"
              >
                SEE MORE WORK <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Updates Section */}
      {posts.length > 0 && (
        <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-neon-cyan/5 blur-[150px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-[0.3em] text-neon-cyan uppercase mb-4">Latest News</h2>
              <h3 className="text-4xl md:text-5xl font-black font-display">UPDATES & ANNOUNCEMENTS</h3>
            </div>
            <div className="space-y-6">
              {posts.map((post) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={post.id} 
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm tracking-widest uppercase">Admin Update</h4>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {post.createdAt?.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-300 leading-relaxed max-w-3xl whitespace-pre-wrap">{post.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tools Section */}
      <section className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-12 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
            {["Adobe Photoshop", "Adobe Illustrator", "After Effects", "Blender 3D", "Figma", "Cinema 4D"].map((tool) => (
              <span key={tool} className="text-xl font-black tracking-tighter uppercase">{tool}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials/Stats */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 md:gap-24">
          {[
            { label: "Happy Clients", value: "500+" },
            { label: "Designs Made", value: "1.2k" },
            { label: "Cups of Coffee", value: "3k+" },
            { label: "Years Experience", value: "6+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-5xl font-black font-display text-white mb-2">{stat.value}</p>
              <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center bg-white/[0.02] border border-white/5 rounded-[60px] p-12 md:p-20 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black font-display leading-[0.9] tracking-tighter mb-8">
                LET'S BUILD <br />
                <span className="text-neon-cyan">SOMETHING EPIC.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-12">
                Expert design services by <span className="text-white font-bold">Er. Rupesh</span>. Based in Forbesganj, Bihar.
              </p>

              <div className="space-y-6">
                {[
                  { icon: <MessageSquare className="w-6 h-6" />, label: "Whatsapp", value: "+91 000 000 0000" },
                  { icon: <Mail className="w-6 h-6" />, label: "Email", value: "biharix2026@gmail.com" },
                  { icon: <Instagram className="w-6 h-6" />, label: "Instagram", value: "@biharix2026" },
                  { icon: <Sparkles className="w-6 h-6" />, label: "Location", value: "Forbesganj, Bihar (India)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-colors">
                    <div className="text-neon-pink">{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                      <p className="font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 w-full h-full min-h-[300px] flex items-center">
              <AnimatePresence mode="wait">
                {formStatus === "sent" ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full text-center p-8 rounded-3xl bg-neon-cyan/10 border border-neon-cyan/20"
                  >
                    <Sparkles className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
                    <h4 className="text-2xl font-black mb-2">MESSAGE SENT!</h4>
                    <p className="text-gray-400 mb-6">Biharix will get back to you within 24 hours.</p>
                    <button 
                      onClick={() => setFormStatus("idle")}
                      className="text-xs font-bold uppercase tracking-widest text-neon-cyan hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full space-y-4" 
                    onSubmit={handleContactSubmit}
                  >
                    <input 
                      name="name"
                      type="text" 
                      required
                      placeholder="NAME"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                    />
                    <input 
                      name="email"
                      type="email" 
                      required
                      placeholder="EMAIL"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                    />
                    <textarea 
                      name="text"
                      required
                      placeholder="YOUR MESSAGE"
                      rows={4}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest resize-none"
                    ></textarea>
                    <button 
                      disabled={formStatus === "sending"}
                      className="w-full py-5 bg-neon-pink text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-neon-pink/80 transition-colors uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,0,123,0.3)] disabled:opacity-50"
                    >
                      {formStatus === "sending" ? "SENDING..." : "SEND MESSAGE"} <Send className="w-4 h-4" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Background Glows for Contact */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-neon-cyan/5 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-neon-pink/5 blur-[100px] pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h4 className="text-xl font-black mb-2 tracking-tighter">BIHARIX<span className="text-neon-cyan">2026</span></h4>
            <p className="text-gray-600 text-xs uppercase tracking-widest">Designed by Er. Rupesh • Forbesganj, Bihar</p>
          </div>

          <div className="flex gap-8">
            {["Twitter", "Instagram", "Discord", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">{social}</a>
            ))}
          </div>

          <div className="text-gray-600 text-[10px] uppercase tracking-widest">
            © 2026 Biharix Design. All rights reserved.
          </div>
        </div>
      </footer>
      {/* Admin Panel Overlay */}
      <AnimatePresence>
        {showAdmin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-white/[0.03] border border-white/10 p-8 rounded-[40px] relative overflow-hidden"
            >
              <button 
                onClick={() => setShowAdmin(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-black mb-2 tracking-tighter uppercase">Admin Panel</h3>
              
              <div className="flex flex-wrap gap-2 mb-8">
                <button 
                  onClick={() => setAdminTab("upload")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${adminTab === "upload" ? "bg-neon-cyan text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}
                >
                  Upload Work
                </button>
                <button 
                  onClick={() => setAdminTab("posts")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${adminTab === "posts" ? "bg-neon-cyan text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}
                >
                  Text Posts
                </button>
                <button 
                  onClick={() => setAdminTab("messages")}
                  className={`relative px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${adminTab === "messages" ? "bg-neon-cyan text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}
                >
                  Messages
                  {messages.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full border-2 border-black" />}
                </button>
              </div>

              {adminTab === "upload" ? (
                <form className="space-y-4" onSubmit={handleUpload}>
                  <input 
                    name="title"
                    type="text" 
                    required
                    placeholder="PROJECT TITLE"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      name="category"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                      <option value="Poster" className="bg-black">Poster</option>
                      <option value="Thumbnail" className="bg-black">YouTube Thumbnail</option>
                      <option value="Logo" className="bg-black">Logo Design</option>
                      <option value="Branding" className="bg-black">Social Media</option>
                    </select>
                    <select 
                      name="tier"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                      <option value="free" className="bg-black">Free</option>
                      <option value="premium" className="bg-black">Premium</option>
                    </select>
                  </div>
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="creation-upload"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="creation-upload"
                      className="flex flex-col items-center justify-center w-full min-h-[150px] bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer group-hover:border-neon-cyan/50 transition-colors overflow-hidden p-4"
                    >
                      {uploads.length > 0 ? (
                        <div className="flex flex-wrap gap-2 justify-center w-full">
                          {uploads.map((u, i) => (
                            <img key={i} src={u.preview} className="w-16 h-16 object-cover rounded-lg border border-white/10" alt="Preview" />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-6">
                          <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2 group-hover:text-neon-cyan transition-colors" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select PNG/JPG (Multiple Allowed)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {uploadError && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-lg text-center font-bold">
                      {uploadError}
                    </div>
                  )}
                  <button 
                    disabled={isUploading || uploads.length === 0}
                    className="w-full py-5 bg-neon-cyan text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-neon-cyan/80 transition-colors uppercase tracking-widest text-sm disabled:opacity-50"
                  >
                    {isUploading ? "UPLOADING..." : `PUBLISH ${uploads.length > 1 ? uploads.length : ''} LIVE`} <Zap className="w-4 h-4" />
                  </button>
                </form>
              ) : adminTab === "posts" ? (
                <form className="space-y-4" onSubmit={handlePostSubmit}>
                  <textarea 
                    name="text"
                    required
                    rows={6}
                    placeholder="WRITE AN UPDATE OR ANNOUNCEMENT..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-medium resize-none"
                  />
                  <button 
                    type="submit"
                    className="w-full py-5 bg-neon-cyan text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-neon-cyan/80 transition-colors uppercase tracking-widest text-sm"
                  >
                    POST UPDATE <MessageSquare className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-neon-cyan text-sm uppercase">{msg.name}</h5>
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest">{msg.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] text-gray-500 font-mono">
                              {msg.createdAt?.toDate().toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <a 
                                href={`mailto:${msg.email}?subject=Reply from Biharix2026`}
                                className="p-2 bg-white/5 hover:bg-neon-cyan/20 text-gray-400 hover:text-neon-cyan rounded-xl transition-colors"
                                title="Reply via Email"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                                title="Delete Message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed pt-3 mt-3 border-t border-white/5">
                          {msg.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-30">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Modal */}
      <AnimatePresence>
        {editingCreation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-white/[0.03] border border-white/10 p-8 rounded-[40px] relative overflow-hidden"
            >
              <button 
                onClick={() => setEditingCreation(null)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-black mb-6 tracking-tighter uppercase">Edit Creation</h3>
              
              <form className="space-y-4" onSubmit={handleEditSubmit}>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Title</label>
                  <input 
                    name="title"
                    type="text" 
                    defaultValue={editingCreation.title}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Category</label>
                    <select 
                      name="category"
                      defaultValue={editingCreation.category}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                      <option value="Poster" className="bg-black">Poster</option>
                      <option value="Thumbnail" className="bg-black">YouTube Thumbnail</option>
                      <option value="Logo" className="bg-black">Logo Design</option>
                      <option value="Branding" className="bg-black">Social Media</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Tier</label>
                    <select 
                      name="tier"
                      defaultValue={editingCreation.tier || 'free'}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-neon-cyan transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                      <option value="free" className="bg-black">Free</option>
                      <option value="premium" className="bg-black">Premium</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-neon-cyan text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-neon-cyan/80 transition-colors uppercase tracking-widest text-sm mt-4"
                >
                  SAVE CHANGES <Zap className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewing Modal */}
      <AnimatePresence>
        {viewingCreation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingCreation(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl"
          >
            <button 
              onClick={() => setViewingCreation(null)}
              className="absolute top-6 right-6 p-4 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-[60]"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            >
              <img 
                src={viewingCreation.imageUrl} 
                alt={viewingCreation.title}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="mt-8 flex flex-col md:flex-row items-center justify-between w-full gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold text-neon-pink uppercase tracking-widest border border-neon-pink/20 px-3 py-1 rounded-full">{viewingCreation.category}</span>
                    {viewingCreation.tier === "premium" && (
                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest border border-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> PREMIUM
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight">{viewingCreation.title}</h3>
                </div>
                <a 
                  href={viewingCreation.imageUrl}
                  download={`biharix_${viewingCreation.title.replace(/\s+/g, '_').toLowerCase()}.jpg`}
                  className="px-8 py-4 bg-white hover:bg-neon-cyan text-black font-black rounded-full flex items-center gap-2 transition-colors uppercase tracking-widest text-xs"
                >
                  Download Full Size <Download className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unique Welcome Experience Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-xl"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border-4 border-dashed border-neon-cyan/20 rounded-full mx-auto mb-12 flex items-center justify-center"
              >
                <div className="w-20 h-20 border-4 border-dashed border-neon-pink/20 rounded-full" />
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black font-display tracking-tighter mb-4">
                BIHARIX<span className="text-neon-cyan">2026</span>
              </h1>
              <p className="text-gray-500 uppercase tracking-[0.5em] text-xs font-bold mb-12 animate-pulse">
                Initializing Design Systems...
              </p>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWelcome(false)}
                className="px-12 py-5 bg-white text-black font-black text-sm tracking-widest rounded-full hover:bg-neon-cyan transition-colors"
              >
                ENTER EXPERIENCE
              </motion.button>
            </motion.div>

            {/* Matrix-like Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10 opacity-20" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
