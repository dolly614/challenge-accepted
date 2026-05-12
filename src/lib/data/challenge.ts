export const TOTAL_DAYS = 30;

export const dailyTopicsByClassGroup: Record<string, string[]> = {
  primary: [
    "Counting 1 to 100", "Hindi Varnamala", "Colours & Shapes", "My Family",
    "Days of the Week", "Fruits & Vegetables", "Animals & Birds", "Body Parts",
    "Good Habits", "Seasons of India", "Festivals of India", "National Symbols",
    "Simple Addition", "Simple Subtraction", "English Alphabet", "Rhyming Words",
    "Story: The Thirsty Crow", "Solar System Basics", "Plants Around Us", "Water Cycle",
    "Means of Transport", "Healthy Food", "Safety Rules", "My School",
    "Helpers in Society", "Indian States", "Famous Monuments", "Traffic Rules",
    "Revision Day", "Final Practice"
  ],
  middle: [
    "Fractions Basics", "Decimals", "LCM & HCF", "Ratio & Proportion",
    "Percentage", "Simple Interest", "Algebra Intro", "Linear Equations",
    "Geometry Angles", "Triangles", "Areas & Perimeters", "Data Handling",
    "Photosynthesis", "Human Digestive System", "Force & Motion", "Light & Shadows",
    "Indian Independence", "Mughal Empire", "Indian Constitution", "Civics: Democracy",
    "Tenses in English", "Active & Passive", "Comprehension Practice", "Letter Writing",
    "Hindi Vyakaran", "Computer Basics", "Internet Safety", "Environmental Science",
    "Revision", "Mock Test"
  ],
  high: [
    "Quadratic Equations", "Trigonometry", "Coordinate Geometry", "Statistics",
    "Probability", "Polynomials", "Surface Area & Volume", "Arithmetic Progression",
    "Newton's Laws", "Electricity Basics", "Chemical Reactions", "Periodic Table",
    "Cell Biology", "Genetics", "Indian Economy", "Globalization",
    "Reading Comprehension", "Essay Writing", "Indian Polity", "Fundamental Rights",
    "Modern Indian History", "World Wars", "Geography: Climate", "Natural Resources",
    "English Grammar Advanced", "Hindi Sahitya", "Logical Reasoning", "Current Affairs",
    "Full Revision", "Final Mock Test"
  ],
};

export function getTopicsForClass(cls: number): string[] {
  if (cls <= 5) return dailyTopicsByClassGroup.primary;
  if (cls <= 8) return dailyTopicsByClassGroup.middle;
  return dailyTopicsByClassGroup.high;
}

export const leaderboardSample = [
  { rank: 1, name: "Aarav Sharma", cls: 8, city: "Mumbai", score: 30, badge: "🥇" },
  { rank: 2, name: "Diya Patel", cls: 7, city: "Ahmedabad", score: 29, badge: "🥈" },
  { rank: 3, name: "Vihaan Singh", cls: 9, city: "Delhi", score: 29, badge: "🥉" },
  { rank: 4, name: "Ananya Iyer", cls: 6, city: "Chennai", score: 28, badge: "⭐" },
  { rank: 5, name: "Arjun Reddy", cls: 10, city: "Hyderabad", score: 28, badge: "⭐" },
  { rank: 6, name: "Saanvi Kapoor", cls: 5, city: "Pune", score: 27, badge: "⭐" },
  { rank: 7, name: "Krishna Mehta", cls: 8, city: "Jaipur", score: 27, badge: "⭐" },
  { rank: 8, name: "Ishaan Verma", cls: 11, city: "Lucknow", score: 26, badge: "⭐" },
  { rank: 9, name: "Myra Joshi", cls: 4, city: "Kolkata", score: 26, badge: "⭐" },
  { rank: 10, name: "Kabir Nair", cls: 12, city: "Bengaluru", score: 25, badge: "⭐" },
];

export const testimonials = [
  { name: "Riya Agarwal", cls: "Class 7, Jaipur", text: "Bahut maza aaya! Roz kuch naya seekha aur ₹1000 bhi jeeta. 💜", emoji: "🌟" },
  { name: "Mohammed Faizan", cls: "Class 10, Hyderabad", text: "30 din ka challenge ne meri study habit hi badal di. Highly recommended!", emoji: "🚀" },
  { name: "Sneha Kulkarni", cls: "Class 5, Pune", text: "Mujhe certificate aur gift dono mile. Mummy bhi bahut khush hain!", emoji: "🎉" },
];

export const faqs = [
  { q: "Yeh challenge kya hai?", a: "30 din ka daily learning program jisme aap roz ek topic seekhte ho, exam dete ho aur prizes jeet sakte ho." },
  { q: "Registration fee kitni hai?", a: "Sirf ₹99 — ek baar ka payment. Ismein 30 din ka content, final exam aur certificate sab include hai." },
  { q: "Prizes kab milenge?", a: "Final exam ke 7 working days ke andar top 3 winners ko cash transfer kar diya jayega. Baaki sabko gift + certificate milega." },
  { q: "Kaun participate kar sakta hai?", a: "Class 1 se Class 12 tak ka koi bhi Indian student. Parent ke saath register karna hota hai." },
  { q: "Agar koi din miss ho gaya toh?", a: "Koi baat nahi! 'Catch up' option se aap missed day complete kar sakte ho. Streak break nahi hoga." },
];
