// All 58 Algerian Wilayas (Provinces) - Both Arabic and French names
export const ALGERIAN_WILAYAS = [
  "أدرار", "Adrar",
  "الشلف", "Chlef",
  "الأغواط", "Laghouat",
  "أم البواقي", "Oum El Bouaghi",
  "باتنة", "Batna",
  "بجاية", "Béjaïa",
  "بسكرة", "Biskra",
  "بشار", "Béchar",
  "البليدة", "Blida",
  "البويرة", "Bouira",
  "تمنراست", "Tamanrasset",
  "تبسة", "Tébessa",
  "تلمسان", "Tlemcen",
  "تيارت", "Tiaret",
  "تيزي وزو", "Tizi Ouzou",
  "الجزائر", "Algiers",
  "الجلفة", "Djelfa",
  "جيجل", "Jijel",
  "سطيف", "Sétif",
  "سعيدة", "Saïda",
  "سكيكدة", "Skikda",
  "سيدي بلعباس", "Sidi Bel Abbès",
  "عنابة", "Annaba",
  "قالمة", "Guelma",
  "قسنطينة", "Constantine",
  "المدية", "Médéa",
  "مستغانم", "Mostaganem",
  "المسيلة", "M'Sila",
  "معسكر", "Mascara",
  "ورقلة", "Ouargla",
  "وهران", "Oran",
  "البيض", "El Bayadh",
  "إليزي", "Illizi",
  "برج بوعريريج", "Bordj Bou Arréridj",
  "بومرداس", "Boumerdès",
  "الطارف", "El Tarf",
  "تندوف", "Tindouf",
  "تيسمسيلت", "Tissemsilt",
  "الوادي", "El Oued",
  "خنشلة", "Khenchela",
  "سوق أهراس", "Souk Ahras",
  "تيبازة", "Tipaza",
  "ميلة", "Mila",
  "عين الدفلى", "Aïn Defla",
  "النعامة", "Naâma",
  "عين تيموشنت", "Aïn Témouchent",
  "غرداية", "Ghardaïa",
  "غليزان", "Relizane",
  "تيميمون", "Timimoun",
  "برج باجي مختار", "Bordj Badji Mokhtar",
  "أولاد جلال", "Ouled Djellal",
  "بني عباس", "Béni Abbès",
  "عين صالح", "In Salah",
  "عين قزام", "In Guezzam",
  "تقرت", "Touggourt",
  "جانت", "Djanet",
  "المغير", "El M'Ghair",
  "المنيعة", "El Meniaa",
];

// Get all unique wilayas (combining Arabic and French names)
export function getAllWilayas(): string[] {
  return Array.from(new Set(ALGERIAN_WILAYAS));
}

// Get wilayas in Arabic only
export function getArabicWilayas(): string[] {
  return ALGERIAN_WILAYAS.filter((_, index) => index % 2 === 0);
}

// Get wilayas in French/English only
export function getFrenchWilayas(): string[] {
  return ALGERIAN_WILAYAS.filter((_, index) => index % 2 === 1);
}

