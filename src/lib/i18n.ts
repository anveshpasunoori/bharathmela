// The site's main screens in Telugu, Hindi and Tamil as well as English: the top and bottom bars, the home and
// category pages, category names and the buttons on listings. The choice is a cookie (bm_lang); URLs stay
// the same, so search engines see English. Sellers' own text is shown as they wrote it. Anything without a
// translation falls back to English.
export const LANGS = [
  { id: "en", name: "English" },
  { id: "te", name: "తెలుగు" },
  { id: "hi", name: "हिन्दी" },
  { id: "ta", name: "தமிழ்" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];
export const LANG_COOKIE = "bm_lang";
export const isLang = (v: string | undefined): v is Lang => LANGS.some((l) => l.id === v);

type Entry = { en: string; te: string; hi: string; ta: string };

const STRINGS = {
  browse: { en: "Browse", te: "బ్రౌజ్", hi: "देखें", ta: "உலாவு" },
  rooms: { en: "Rooms", te: "గదులు", hi: "कमरे", ta: "அறைகள்" },
  events: { en: "Events", te: "ఈవెంట్లు", hi: "कार्यक्रम", ta: "நிகழ்வுகள்" },
  sell: { en: "Sell", te: "అమ్మండి", hi: "बेचें", ta: "விற்க" },
  postNeed: { en: "Post your need", te: "మీ అవసరం పోస్ట్ చేయండి", hi: "अपनी ज़रूरत बताएं", ta: "உங்கள் தேவையை பதிவிடுங்கள்" },
  postNeedShort: { en: "Post need", te: "అవసరం", hi: "ज़रूरत", ta: "தேவை" },
  logIn: { en: "Log in", te: "లాగిన్", hi: "लॉग इन", ta: "உள்நுழை" },
  signUp: { en: "Sign up", te: "సైన్ అప్", hi: "साइन अप", ta: "பதிவு செய்" },
  saved: { en: "Saved", te: "సేవ్ చేసినవి", hi: "सेव किए", ta: "சேமித்தவை" },
  home: { en: "Home", te: "హోమ్", hi: "होम", ta: "முகப்பு" },
  account: { en: "Account", te: "ఖాతా", hi: "खाता", ta: "கணக்கு" },
  dashboard: { en: "Dashboard", te: "డాష్‌బోర్డ్", hi: "डैशबोर्ड", ta: "டாஷ்போர்டு" },
  language: { en: "Language", te: "భాష", hi: "भाषा", ta: "மொழி" },
  localBusinessesIn: { en: "Local Businesses in {city}", te: "{city}లో స్థానిక వ్యాపారాలు", hi: "{city} में स्थानीय व्यवसाय", ta: "{city} உள்ளூர் வணிகங்கள்" },
  localBusinessesNear: { en: "Local Businesses near you", te: "మీ దగ్గర స్థానిక వ్యాపారాలు", hi: "आपके पास स्थानीय व्यवसाय", ta: "உங்கள் அருகில் உள்ளூர் வணிகங்கள்" },
  searchPlaceholder: { en: "Try “biryani”, “pooja”, “photographer”", te: "“బిర్యానీ”, “పూజ”, “ఫోటోగ్రాఫర్” వెతకండి", hi: "“बिरयानी”, “पूजा”, “फोटोग्राफर” खोजें", ta: "“பிரியாணி”, “பூஜை”, “புகைப்படக்காரர்” தேடுங்கள்" },
  search: { en: "Search", te: "వెతకండి", hi: "खोजें", ta: "தேடு" },
  within: { en: "Within", te: "దూరం", hi: "दूरी", ta: "தூரம்" },
  allOf: { en: "All of {city}", te: "{city} మొత్తం", hi: "पूरा {city}", ta: "{city} முழுவதும்" },
  lookingFor: { en: "What are you looking for?", te: "మీకు ఏమి కావాలి?", hi: "आप क्या ढूंढ रहे हैं?", ta: "நீங்கள் எதைத் தேடுகிறீர்கள்?" },
  listingsCount: { en: "{n} listings", te: "{n} జాబితాలు", hi: "{n} लिस्टिंग", ta: "{n} பட்டியல்கள்" },
  listingCount: { en: "1 listing", te: "1 జాబితా", hi: "1 लिस्टिंग", ta: "1 பட்டியல்" },
  beFirst: { en: "Be the first", te: "మొదటివారు అవ్వండి", hi: "पहले बनें", ta: "முதலாவதாக இருங்கள்" },
  trustVerified: { en: "Phone-verified sellers are marked", te: "ఫోన్ ధృవీకరించిన విక్రేతలకు గుర్తు ఉంటుంది", hi: "फ़ोन-सत्यापित विक्रेता चिह्नित हैं", ta: "தொலைபேசி சரிபார்க்கப்பட்ட விற்பனையாளர்கள் குறிக்கப்பட்டுள்ளனர்" },
  trustReviews: { en: "Reviews from real buyers", te: "నిజమైన కొనుగోలుదారుల సమీక్షలు", hi: "असली खरीदारों की समीक्षाएं", ta: "உண்மையான வாங்குபவர்களின் மதிப்புரைகள்" },
  trustFree: { en: "Free to browse · pay sellers directly", te: "ఉచితంగా చూడండి · విక్రేతకు నేరుగా చెల్లించండి", hi: "मुफ़्त देखें · विक्रेता को सीधे भुगतान करें", ta: "இலவசமாக பாருங்கள் · விற்பனையாளருக்கு நேரடியாக செலுத்துங்கள்" },
  newIn: { en: "New {where}", te: "కొత్తవి {where}", hi: "नया {where}", ta: "புதியவை {where}" },
  topRated: { en: "Top rated by buyers", te: "కొనుగోలుదారులు మెచ్చినవి", hi: "खरीदारों की पसंद", ta: "வாங்குபவர்கள் அதிகம் மதிப்பிட்டவை" },
  upcomingEvents: { en: "Upcoming events", te: "రాబోయే ఈవెంట్లు", hi: "आने वाले कार्यक्रम", ta: "வரவிருக்கும் நிகழ்வுகள்" },
  seeAll: { en: "See all →", te: "అన్నీ చూడండి →", hi: "सभी देखें →", ta: "அனைத்தையும் பார் →" },
  allCategories: { en: "All categories", te: "అన్ని విభాగాలు", hi: "सभी श्रेणियां", ta: "அனைத்து வகைகள்" },
  all: { en: "All", te: "అన్నీ", hi: "सभी", ta: "அனைத்தும்" },
  results: { en: "{n} results", te: "{n} ఫలితాలు", hi: "{n} परिणाम", ta: "{n} முடிவுகள்" },
  result: { en: "1 result", te: "1 ఫలితం", hi: "1 परिणाम", ta: "1 முடிவு" },
  list: { en: "List", te: "జాబితా", hi: "सूची", ta: "பட்டியல்" },
  map: { en: "Map", te: "మ్యాప్", hi: "नक्शा", ta: "வரைபடம்" },
  call: { en: "Call", te: "కాల్ చేయండి", hi: "कॉल करें", ta: "அழைக்க" },
  text: { en: "Text", te: "మెసేజ్", hi: "मैसेज", ta: "குறுஞ்செய்தி" },
  withinOf: { en: "within {r} mi of {place}", te: "{place} నుండి {r} మైళ్ల లోపు", hi: "{place} से {r} मील के अंदर", ta: "{place}-இலிருந்து {r} மைலுக்குள்" },
  inCity: { en: "in {city}", te: "{city}లో", hi: "{city} में", ta: "{city}-இல்" },
  nearPlace: { en: "near {place}", te: "{place} దగ్గర", hi: "{place} के पास", ta: "{place} அருகில்" },
  otherCategories: { en: "Other categories {where}", te: "ఇతర విభాగాలు {where}", hi: "अन्य श्रेणियां {where}", ta: "மற்ற வகைகள் {where}" },
  cantFind: { en: "Can't find the right person?", te: "సరైన వ్యక్తి దొరకలేదా?", hi: "सही व्यक्ति नहीं मिला?", ta: "சரியான நபர் கிடைக்கவில்லையா?" },
  cantFindHint: {
    en: "Post what you need once. Sellers near you who offer it will send you quotes.",
    te: "మీ అవసరం ఒక్కసారి పోస్ట్ చేయండి. దగ్గరలోని విక్రేతలు ధరలు పంపుతారు.",
    hi: "अपनी ज़रूरत एक बार बताएं। आस-पास के विक्रेता आपको कोटेशन भेजेंगे।",
    ta: "உங்கள் தேவையை ஒருமுறை பதிவிடுங்கள். அருகிலுள்ள விற்பனையாளர்கள் விலை அனுப்புவார்கள்.",
  },
  postWhatYouNeed: { en: "Post what you need", te: "అవసరం పోస్ట్ చేయండి", hi: "ज़रूरत बताएं", ta: "தேவையை பதிவிடு" },
  categories: { en: "Categories", te: "వర్గాలు", hi: "श्रेणियाँ", ta: "வகைகள்" },
  postRequest: { en: "Post a Request", te: "అభ్యర్థన పోస్ట్ చేయండి", hi: "अनुरोध पोस्ट करें", ta: "கோரிக்கையை இடுங்கள்" },
  listBusiness: { en: "List your business", te: "మీ వ్యాపారాన్ని జోడించండి", hi: "अपना व्यवसाय जोड़ें", ta: "உங்கள் வணிகத்தை சேர்க்கவும்" },
  sellHeading: { en: "Run a business from home? List it free in 3 steps", te: "ఇంటి నుండి వ్యాపారం చేస్తున్నారా? 3 దశల్లో ఉచితంగా జోడించండి", hi: "घर से व्यवसाय चलाते हैं? 3 कदमों में मुफ़्त जोड़ें", ta: "வீட்டிலிருந்து வணிகம் செய்கிறீர்களா? 3 படிகளில் இலவசமாக சேர்க்கவும்" },
  step1Title: { en: "Sign up free", te: "ఉచితంగా సైన్ అప్", hi: "मुफ़्त साइन अप", ta: "இலவசமாக பதிவு" },
  step1Text: { en: "Your name, phone and city. No fees to start.", te: "మీ పేరు, ఫోన్, నగరం. మొదలుపెట్టడానికి రుసుము లేదు.", hi: "नाम, फ़ोन और शहर। शुरू करने का कोई शुल्क नहीं।", ta: "பெயர், தொலைபேசி, நகரம். தொடங்க கட்டணம் இல்லை." },
  step2Title: { en: "Add a photo and your services", te: "ఫోటో, మీ సేవలు జోడించండి", hi: "फ़ोटो और सेवाएं जोड़ें", ta: "புகைப்படம், சேவைகள் சேர்க்கவும்" },
  step2Text: { en: "Snap a photo, pick what you offer, set your price.", te: "ఫోటో తీయండి, మీరు ఇచ్చేవి ఎంచుకోండి, ధర పెట్టండి.", hi: "फ़ोटो लें, सेवाएं चुनें, कीमत तय करें।", ta: "புகைப்படம் எடுங்கள், சேவைகளை தேர்ந்தெடுங்கள், விலை வையுங்கள்." },
  step3Title: { en: "Get calls from neighbors", te: "దగ్గరివారి నుండి కాల్స్ పొందండి", hi: "पड़ोसियों से कॉल पाएं", ta: "அருகிலுள்ளவர்களிடமிருந்து அழைப்புகள்" },
  step3Text: { en: "Customers call, text or WhatsApp you directly.", te: "కస్టమర్లు నేరుగా కాల్, మెసేజ్ లేదా వాట్సాప్ చేస్తారు.", hi: "ग्राहक सीधे कॉल, मैसेज या व्हाट्सऐप करते हैं।", ta: "வாடிக்கையாளர்கள் நேரடியாக அழைப்பார்கள், செய்தி அனுப்புவார்கள்." },
  startSelling: { en: "List your business free", te: "ఉచితంగా జోడించండి", hi: "मुफ़्त में जोड़ें", ta: "இலவசமாக சேர்க்கவும்" },
} satisfies Record<string, Entry>;

export type StringKey = keyof typeof STRINGS;
// For tests: every phrase, to check each language has one.
export const __strings = STRINGS;

export function t(lang: Lang, key: StringKey, vars: Record<string, string | number> = {}) {
  const text = (STRINGS[key] as Entry)[lang] || STRINGS[key].en;
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

const CATEGORY_NAMES: Record<string, Omit<Entry, "en">> = {
  FOOD: { te: "ఇంటి భోజనం & క్లౌడ్ కిచెన్లు", hi: "घर का खाना और क्लाउड किचन", ta: "வீட்டு உணவு & கிளவுட் கிச்சன்" },
  TUTORING: { te: "ట్యూషన్ & తరగతులు", hi: "ट्यूशन और कक्षाएं", ta: "டியூஷன் & வகுப்புகள்" },
  DANCE_MUSIC: { te: "నృత్యం & సంగీతం", hi: "नृत्य और संगीत", ta: "நடனம் & இசை" },
  PUJARI: { te: "పూజారి & మత సేవలు", hi: "पुजारी और धार्मिक सेवाएं", ta: "பூசாரி & மத சேவைகள்" },
  EVENT_SERVICES: { te: "వివాహాలు & ఈవెంట్ సేవలు", hi: "शादी और इवेंट सेवाएं", ta: "திருமணம் & நிகழ்வு சேவைகள்" },
  DOMESTIC_HELP: { te: "ఇంటి సహాయం & ఆయాలు", hi: "घरेलू मदद और आया", ta: "வீட்டு உதவி & ஆயாக்கள்" },
  HOME_SERVICES: { te: "ఇంటి సేవలు & మరమ్మతులు", hi: "घरेलू सेवाएं और मरम्मत", ta: "வீட்டு சேவைகள் & பழுதுபார்ப்பு" },
  AUTO: { te: "వాహన సేవలు", hi: "वाहन सेवाएं", ta: "வாகன சேவைகள்" },
  BEAUTY: { te: "అందం & ఆరోగ్యం", hi: "सौंदर्य और स्वास्थ्य", ta: "அழகு & நலம்" },
  ROOM_RENTAL: { te: "అద్దె గదులు", hi: "किराये के कमरे", ta: "வாடகை அறைகள்" },
  REALTOR: { te: "రియల్టర్లు & రియల్ ఎస్టేట్", hi: "रियल्टर और रियल एस्टेट", ta: "ரியல் எஸ்டேட் முகவர்கள்" },
  LEGAL: { te: "న్యాయవాదులు & న్యాయ సేవలు", hi: "वकील और कानूनी सेवाएं", ta: "வழக்கறிஞர்கள் & சட்ட சேவைகள்" },
  TAX_FINANCE: { te: "పన్ను & అకౌంటింగ్", hi: "टैक्स और अकाउंटिंग", ta: "வரி & கணக்கியல்" },
  TRAVEL: { te: "ప్రయాణ సహాయం", hi: "यात्रा सहायता", ta: "பயண உதவி" },
  ART: { te: "కళలు & చేతిపనులు", hi: "कला और शिल्प", ta: "கலை & கைவினை" },
  CLOTHING: { te: "బట్టలు & ఆభరణాలు", hi: "कपड़े और गहने", ta: "ஆடைகள் & நகைகள்" },
  CREATORS: { te: "క్రియేటర్లు & ఇన్‌ఫ్లుయెన్సర్లు", hi: "क्रिएटर्स और इन्फ्लुएंसर्स", ta: "கிரியேட்டர்கள் & இன்ஃப்ளுயன்சர்கள்" },
  GARAGE_SALE: { te: "గ్యారేజ్ & ఇల్లు మారే అమ్మకాలు", hi: "गैराज और मूविंग सेल", ta: "கேரேஜ் & இடமாற்ற விற்பனை" },
  GOODS: { te: "ఇతర వస్తువులు & సేవలు", hi: "अन्य सामान और सेवाएं", ta: "மற்ற பொருட்கள் & சேவைகள்" },
};

export function categoryName(lang: Lang, id: string, english: string) {
  return lang === "en" ? english : (CATEGORY_NAMES[id]?.[lang] ?? english);
}
