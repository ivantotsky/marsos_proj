// All cities in Saudi Arabia
export const defaultLocationOptions = [
  "Riyadh",
  "Jeddah",
  "Mecca",
  "Medina",
  "Dammam",
  "Khobar",
  "Tabuk",
  "Abha",
  "Khamis Mushait",
  "Buraidah",
  "Najran",
  "Hail",
  "Al Hufuf",
  "Yanbu",
  "Al Jubail",
  "Al Khafji",
  "Arar",
  "Sakaka",
  "Hafar Al-Batin",
  "Qatif",
  "Al Bahah",
  "Jizan",
  "Al Majma'ah",
  "Al Zulfi",
  "Unaizah",
  "Rabigh",
  "Ras Tanura",
  "Safwa",
  "Turubah",
  "Turaif",
  "Wadi ad-Dawasir",
  "Dhurma",
  "Al Qunfudhah",
  "Dhahran",
  "Al Lith",
  "Diriyah",
  "Al Muzahmiyya",
  "Al Aflaj",
  "Thadiq",
  "Shaqra",
  "Al Dawadmi",
  "Samtah",
  "Al Namas",
  "Tanumah",
].map((city) => ({ value: city, label: city }));

export const defaultQuantityOptions = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "Unlimited", label: "Unlimited" },
];

// Sizes
export const defaultSizeOptions = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
];

// Colors
export const defaultColorOptions = [
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "Black", label: "Black" },
  { value: "White", label: "White" },
  { value: "Pink", label: "Pink" },
  { value: "Purple", label: "Purple" },
  { value: "Orange", label: "Orange" },
  { value: "Gray", label: "Gray" },
];

// Quantity options (1–100 + Unlimited)
export const defaultQtyOptions = Array.from({ length: 100 }, (_, i) => ({
  value: (i + 1).toString(),
  label: (i + 1).toString(),
})).concat({ value: "Unlimited", label: "Unlimited" });

// GCC Countries with Arabic labels
export const defaultCountryOptions = [
  { value: "Saudi Arabia", label: "Saudi Arabia (السعودية)" },
  { value: "United Arab Emirates", label: "United Arab Emirates (الإمارات)" },
  { value: "Kuwait", label: "Kuwait (الكويت)" },
  { value: "Qatar", label: "Qatar (قطر)" },
  { value: "Bahrain", label: "Bahrain (البحرين)" },
  { value: "Oman", label: "Oman (عُمان)" },
];

// GCC Country Codes with Arabic labels
export const defaultCountryCodeOptions = [
  { value: "+966", label: "+966" },
  { value: "+971", label: "+971" },
  { value: "+965", label: "+965" },
  { value: "+974", label: "+974" },
  { value: "+973", label: "+973" },
  { value: "+968", label: "+968" },
];
