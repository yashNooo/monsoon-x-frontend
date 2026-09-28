export interface CropData {
  id: string;
  name: string;
  localName: string; // Hindi local name
  scientificName: string;
  minimumRainfallMm: number; // minimum cumulative rain before sowing is advisable
  drySpellToleranceDays: number; // max consecutive dry days without seedling damage
  optimalTemperatureMin: number;
  optimalTemperatureMax: number;
  sowingNotes: string;
  sowingNotesHi: string;
}

export const CROPS_CATALOG: CropData[] = [
  {
    id: 'bajra',
    name: 'Bajra (Pearl Millet)',
    localName: 'बाजरा',
    scientificName: 'Pennisetum glaucum',
    minimumRainfallMm: 25.0,
    drySpellToleranceDays: 14,
    optimalTemperatureMin: 25,
    optimalTemperatureMax: 35,
    sowingNotes: 'Extremely hardy and drought-tolerant. Best sown after 25-30 mm of steady rainfall with soil moist up to 10-15 cm. Can withstand dry spells of up to 14 days.',
    sowingNotesHi: 'सूखा-सहनशील फसल। 25-30 मिमी वर्षा और 10-15 सेमी तक मिट्टी नम होने पर बुवाई करें। 14 दिनों तक का सूखा अंतराल सहन कर सकती है।'
  },
  {
    id: 'jowar',
    name: 'Jowar (Sorghum)',
    localName: 'ज्वार',
    scientificName: 'Sorghum bicolor',
    minimumRainfallMm: 35.0,
    drySpellToleranceDays: 10,
    optimalTemperatureMin: 24,
    optimalTemperatureMax: 32,
    sowingNotes: 'Moderately drought-hardy. Avoid waterlogged or hard crusting soils. Optimal sowing requires 35 mm cumulative rainfall.',
    sowingNotesHi: 'मध्यम सूखा-प्रतिरोधी। 35 मिमी संचयी वर्षा के बाद बुवाई अनुकूल। जलभराव वाले खेतों से बचें।'
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    localName: 'मक्का',
    scientificName: 'Zea mays',
    minimumRainfallMm: 45.0,
    drySpellToleranceDays: 7,
    optimalTemperatureMin: 21,
    optimalTemperatureMax: 30,
    sowingNotes: 'Sensitive to early germination moisture stress and seedling flooding. Requires 45+ mm uniform moisture; vulnerable if a dry break exceeds 7 days.',
    sowingNotesHi: 'अंकुरण के समय नमी की कमी और जलभराव दोनों के प्रति संवेदनशील। 45+ मिमी समान बारिश जरूरी। 7 दिन से ज्यादा का सूखा खतरनाक है।'
  },
  {
    id: 'cotton',
    name: 'Cotton',
    localName: 'कपास',
    scientificName: 'Gossypium hirsutum',
    minimumRainfallMm: 50.0,
    drySpellToleranceDays: 12,
    optimalTemperatureMin: 22,
    optimalTemperatureMax: 36,
    sowingNotes: 'Deep-rooted crop. Needs deep subsoil moisture (50 mm steady rain). Young seedlings are prone to damping-off if exposed to torrential downpours.',
    sowingNotesHi: 'गहरी जड़ों वाली फसल। 50 मिमी स्थिर वर्षा के बाद बुवाई करें। अतिवृष्टि में अंकुर सड़ने का खतरा रहता है।'
  },
  {
    id: 'soybean',
    name: 'Soybean',
    localName: 'सोयाबीन',
    scientificName: 'Glycine max',
    minimumRainfallMm: 60.0,
    drySpellToleranceDays: 6,
    optimalTemperatureMin: 20,
    optimalTemperatureMax: 30,
    sowingNotes: 'High moisture requirement for seed hydration. Sowing in dry soil leads to poor plant stand. Dry spell of >6 days post-sowing causes high seedling mortality.',
    sowingNotesHi: 'अंकुरण के लिए 60+ मिमी भरपूर नमी चाहिए। शुष्क मिट्टी में बीज बोने पर अंकुरण विफल हो जाता है।'
  },
  {
    id: 'paddy',
    name: 'Paddy (Rice)',
    localName: 'धान / चावल',
    scientificName: 'Oryza sativa',
    minimumRainfallMm: 100.0,
    drySpellToleranceDays: 4,
    optimalTemperatureMin: 22,
    optimalTemperatureMax: 35,
    sowingNotes: 'Semi-aquatic regime. Nursery raising and transplanting require sustained monsoon surge (100+ mm). Highly vulnerable to monsoon breaks.',
    sowingNotesHi: 'अधिक जल चाहने वाली फसल। नर्सरी व रोपाई के लिए निरंतर मानसून (100+ मिमी) अनिवार्य है। मानसून ब्रेक से भारी नुकसान होता है।'
  }
];

export interface BlockPanchayatInfo {
  id: string;
  block: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  panchayats: string[];
  initialRisk: 'Safe Sowing' | 'Monitor' | 'Break Risk' | 'False Onset Risk' | 'Heavy Rain Risk';
  onsetProbability: number;
  falseOnsetRisk: number;
  breakRisk: number;
  heavyRainRisk: number;
  advisoryHi: string;
}

export const REGIONAL_BLOCKS: BlockPanchayatInfo[] = [
  {
    id: 'sanganer',
    block: 'Sanganer',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.8200,
    longitude: 75.7800,
    panchayats: ['Sanganer Central', 'Vatika', 'Muhana', 'Dudu Road', 'Bilwa'],
    initialRisk: 'False Onset Risk',
    onsetProbability: 42,
    falseOnsetRisk: 68,
    breakRisk: 35,
    heavyRainRisk: 15,
    advisoryHi: 'शुरुआती बौछार के बाद 6 दिन का शुष्क अंतराल संभव। बाजरा बुवाई 7 दिन टालें।'
  },
  {
    id: 'phagi',
    block: 'Phagi',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.5800,
    longitude: 75.5600,
    panchayats: ['Phagi Kalan', 'Mandoor', 'Ladera', 'Nimera', 'Chakwara'],
    initialRisk: 'Break Risk',
    onsetProbability: 58,
    falseOnsetRisk: 32,
    breakRisk: 64,
    heavyRainRisk: 12,
    advisoryHi: 'सक्रिय मानसून के बाद 7 दिन का ड्राई स्पेल अनुमानित। नमी संरक्षण के उपाय अपनाएं।'
  },
  {
    id: 'bassi',
    block: 'Bassi',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.8300,
    longitude: 76.0400,
    panchayats: ['Bassi Gram', 'Toonga', 'Kashipura', 'Rohini', 'Kanota'],
    initialRisk: 'Safe Sowing',
    onsetProbability: 84,
    falseOnsetRisk: 18,
    breakRisk: 22,
    heavyRainRisk: 20,
    advisoryHi: 'समान वितरण वाली बारिश। बाजरा व ज्वार की बुवाई के लिए उपयुक्त समय।'
  },
  {
    id: 'chaksu',
    block: 'Chaksu',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.6000,
    longitude: 75.9500,
    panchayats: ['Chaksu City', 'Kotkhawda', 'Garudwasi', 'Kadila', 'Shivdaspura'],
    initialRisk: 'False Onset Risk',
    onsetProbability: 38,
    falseOnsetRisk: 72,
    breakRisk: 40,
    heavyRainRisk: 10,
    advisoryHi: 'नकली मानसून (False Onset) का उच्च जोखिम। केवल संरक्षित सिंचाई में ही बुवाई करें।'
  },
  {
    id: 'jamwa_ramgarh',
    block: 'Jamwa Ramgarh',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 27.0200,
    longitude: 76.0100,
    panchayats: ['Ramgarh', 'Dhaula', 'Nayabas', 'Andhi', 'Bhojpura'],
    initialRisk: 'Safe Sowing',
    onsetProbability: 78,
    falseOnsetRisk: 25,
    breakRisk: 28,
    heavyRainRisk: 35,
    advisoryHi: 'पहाड़ी प्रभाव से अच्छी वर्षा। सामान्य बुवाई जारी रखें, जल निकासी सुनिश्चित करें।'
  },
  {
    id: 'amber',
    block: 'Amber',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9800,
    longitude: 75.8500,
    panchayats: ['Amber Kalan', 'Kukas', 'Achrol', 'Chomu Road', 'Khatipura'],
    initialRisk: 'Monitor',
    onsetProbability: 65,
    falseOnsetRisk: 30,
    breakRisk: 35,
    heavyRainRisk: 45,
    advisoryHi: 'मध्यम से भारी बारिश के आसार। मिट्टी की गहराई में नमी जांचकर बुवाई करें।'
  },
  {
    id: 'govindgarh',
    block: 'Govindgarh',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 27.2300,
    longitude: 75.6800,
    panchayats: ['Govindgarh Central', 'Nangal Kalan', 'Hasampur', 'Itawa', 'Dhabdhaba'],
    initialRisk: 'Break Risk',
    onsetProbability: 35,
    falseOnsetRisk: 55,
    breakRisk: 70,
    heavyRainRisk: 10,
    advisoryHi: 'कम वर्षा व लम्बा सूखा अंतराल। मक्का बुवाई से बचें, केवल बाजरा पर विचार करें।'
  },
  {
    id: 'jhotwara',
    block: 'Jhotwara',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9400,
    longitude: 75.7500,
    panchayats: ['Jhotwara Rural', 'Kalwar', 'Hathoj', 'Bindayaka', 'Sirsi'],
    initialRisk: 'Monitor',
    onsetProbability: 62,
    falseOnsetRisk: 38,
    breakRisk: 30,
    heavyRainRisk: 18,
    advisoryHi: 'संतुलित स्थितियां। अगले 48 घंटे के मौसम अपडेट की निगरानी करें।'
  },
  {
    id: 'shahpura',
    block: 'Shahpura',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 27.3800,
    longitude: 75.9600,
    panchayats: ['Shahpura Town', 'Bhabhru', 'Manoharpur', 'Deoli', 'Chitwadi'],
    initialRisk: 'False Onset Risk',
    onsetProbability: 48,
    falseOnsetRisk: 62,
    breakRisk: 45,
    heavyRainRisk: 25,
    advisoryHi: 'क्षणिक वर्षा के बाद शुष्क दौर। जल्दबाजी में बुवाई करने पर बीज हानि की आशंका।'
  },
  {
    id: 'kotputli',
    block: 'Kotputli',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 27.7000,
    longitude: 76.2000,
    panchayats: ['Kotputli Urban', 'Paota', 'Bansur Road', 'Paniyala', 'Kalyanpura'],
    initialRisk: 'Heavy Rain Risk',
    onsetProbability: 72,
    falseOnsetRisk: 20,
    breakRisk: 25,
    heavyRainRisk: 58,
    advisoryHi: 'अतिवृष्टि का संकेत। निचले खेतों में जलभराव की रोकथाम के लिए नालियां बनाएं।'
  }
];

export const getCropById = (id: string): CropData => {
  return CROPS_CATALOG.find(c => c.id.toLowerCase() === id.toLowerCase()) || CROPS_CATALOG[0];
};

export const getBlockById = (id: string): BlockPanchayatInfo => {
  return REGIONAL_BLOCKS.find(b => b.id.toLowerCase() === id.toLowerCase() || b.block.toLowerCase() === id.toLowerCase()) || REGIONAL_BLOCKS[0];
};
