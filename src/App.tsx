// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Package, Leaf, Settings, Calculator, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

// --- DATABASE CONSTANTS ---
// OTR units: cc / 100in² × day × atm @ 22°C (for films and membranes)
// Pinhole OTR: cc / pinhole × day (effective per pinhole)

const MEMBRANES = {
  'Alpha': { OTR0: 80000, OTR1: 150000, OTR_target: 115000, CO2_ratio: 4.5, typical: '3%O2, 5%CO2' },
  'Suzie': { OTR0: 300000, OTR1: 400000, OTR_target: 350000, CO2_ratio: 3.8, typical: '3%O2, 5%CO2' },
  'Jasmine': { OTR0: null, OTR1: null, OTR_target: 275000, CO2_ratio: 3.0, typical: null },
  'Jenny': { OTR0: 96000, OTR1: 144000, OTR_target: 120000, CO2_ratio: 4.3, typical: '3%O2, 10%CO2' },
  'Gala': { OTR0: 57600, OTR1: 86400, OTR_target: 72000, CO2_ratio: 8.1, typical: '3%O2, 3%CO2' }
};

const FILMS = {
  'Ziplock 1mil LDPE': { OTR: 475, MVTR: null, CO2_ratio: 4.0, notes: 'Case liners, cloudy', cost: '$' },
  'Coast 2mil PE Blend': { OTR: 300, MVTR: null, CO2_ratio: 4.0, notes: 'Very clear film', cost: '$$' },
  'PE/PP laminate': { OTR: 90, MVTR: null, CO2_ratio: 3.5, notes: 'Excellent clarity', cost: '$$$' },
  'High MVTR Mylar 1mil': { OTR: 23, MVTR: 65, CO2_ratio: 4.5, notes: 'Tray sealant, not for packages', cost: '$$$' },
  'Mylar 1mil': { OTR: 12, MVTR: null, CO2_ratio: 4.5, notes: 'Case liners, difficult to seal', cost: '$$$' },
  'M&Q 21 Nylon 1mil': { OTR: 12, MVTR: 112, CO2_ratio: 4.0, notes: '', cost: '$$' }
};

const PINHOLES = {
  '33g needle': { OTR: 15000, CO2_ratio: 0.81 },
  'Needle': { OTR: 30000, CO2_ratio: 0.81 },
  'Rubber band': { OTR: 50000, CO2_ratio: 0.81 }
};

const HOLE_SIZES = [0.188, 0.25, 0.3125, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0, 1.25, 1.5, 1.62, 1.75, 2.0];

// Full produce database mapped from notebook
const PRODUCE_DATA = {
  // FRUITS
  'Apple Fuji': { rr: {5: 10}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Apple Gala': { rr: {5: 14.5}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Apple Golden Delicious': { rr: {0: 9, 5: 12, 10: 19, 20: 45}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Apple Granny Smith': { rr: {5: 6}, optimal_o2: 1.5, optimal_co2: 2, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Apple Red Delicious': { rr: {0: 7, 5: 10, 10: 15, 20: 37}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Apricot': { rr: {0: 6, 10: 16, 20: 40}, optimal_o2: 2, optimal_co2: 3, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Asian Pear': { rr: {0: 5, 20: 25}, optimal_o2: 2, optimal_co2: 1, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Avocado': { rr: {5: 35, 10: 105, 20: 190}, optimal_o2: 3, optimal_co2: 7, rec_temp: 7, category: 'fruit', rq: 1.0, mm: {a1: 24.14504, a2: 0.089752, b1: 0.16188, b2: 0.10812, afactor: 1.88} },
  'Banana': { rr: {0: 40, 5: 52, 10: 75, 20: 90}, optimal_o2: 3, optimal_co2: 5, rec_temp: 13, category: 'fruit', rq: 1.0, mm: {a1: 68.163, a2: 0.079227, b1: 2.004, b2: -0.0539, afactor: 0.2} },
  'Specialty Banana': { rr: {10: 29, 20: 249}, optimal_o2: 3, optimal_co2: 5, rec_temp: 13, category: 'fruit', rq: 1.0, mm: null },
  'Blackberry': { rr: {5: 22, 10: 62, 20: 156}, optimal_o2: 5, optimal_co2: 15, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Blueberry': { rr: {0: 6, 5: 18, 20: 68}, optimal_o2: 3, optimal_co2: 15, rec_temp: 0, category: 'fruit', rq: 1.0, mm: {a1: 3.232, a2: 0.117, b1: 0.7994, b2: 0.099, afactor: 1.85} },
  'Cranberry': { rr: {0: 4, 10: 8, 20: 18}, optimal_o2: 2, optimal_co2: 2, rec_temp: 3, category: 'fruit', rq: 1.0, mm: null },
  'Raspberry': { rr: {0: 24, 10: 50, 20: 200}, optimal_o2: 5, optimal_co2: 15, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Canteloupe': { rr: {0: 5, 5: 9, 10: 15, 20: 56}, optimal_o2: 3, optimal_co2: 10, rec_temp: 2, category: 'fruit', rq: 1.0, mm: null },
  'Cherry': { rr: {0: 8, 5: 14, 10: 32, 20: 50}, optimal_o2: 4, optimal_co2: 12, rec_temp: 0, category: 'fruit', rq: 1.0, mm: {a1: 8.0553, a2: 0.086969, b1: 0.05388, b2: 0.0141, afactor: 1.0} },
  'Dragonfruit': { rr: {20: 120}, optimal_o2: 3, optimal_co2: 5, rec_temp: 7, category: 'fruit', rq: 1.0, mm: null },
  'Durian': { rr: {10: 66, 20: 350}, optimal_o2: 3, optimal_co2: 5, rec_temp: 12, category: 'fruit', rq: 1.0, mm: null },
  'Fig': { rr: {0: 6, 5: 13, 10: 21, 20: 40}, optimal_o2: 5, optimal_co2: 15, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Grape': { rr: {0: 3, 5: 7, 10: 13, 20: 27}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'fruit', rq: 1.0, mm: {a1: 12.58821, a2: 0.118907, b1: 0.06745, b2: 0.04505, afactor: 0.25} },
  'Grapefruit': { rr: {10: 8, 20: 19}, optimal_o2: 5, optimal_co2: 5, rec_temp: 10, category: 'fruit', rq: 1.0, mm: null },
  'Guava': { rr: {10: 34, 20: 80}, optimal_o2: 3, optimal_co2: 5, rec_temp: 8, category: 'fruit', rq: 1.0, mm: null },
  'Honeydew Melon': { rr: {5: 8, 10: 16, 20: 47}, optimal_o2: 3, optimal_co2: 10, rec_temp: 7, category: 'fruit', rq: 1.0, mm: null },
  'Jackfruit': { rr: {20: 75}, optimal_o2: 3, optimal_co2: 5, rec_temp: 13, category: 'fruit', rq: 1.0, mm: null },
  'Kiwi': { rr: {0: 3.5, 5: 7, 10: 12, 20: 35}, optimal_o2: 2, optimal_co2: 5, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Lemon': { rr: {10: 11, 20: 24}, optimal_o2: 5, optimal_co2: 5, rec_temp: 10, category: 'fruit', rq: 1.0, mm: null },
  'Lime': { rr: {20: 16}, optimal_o2: 5, optimal_co2: 5, rec_temp: 10, category: 'fruit', rq: 1.0, mm: null },
  'Longon': { rr: {10: 20, 20: 40}, optimal_o2: 3, optimal_co2: 5, rec_temp: 2, category: 'fruit', rq: 1.0, mm: null },
  'Loquat': { rr: {0: 8, 5: 15}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Lychee': { rr: {5: 13, 10: 25, 20: 65}, optimal_o2: 3, optimal_co2: 5, rec_temp: 2, category: 'fruit', rq: 1.0, mm: {a1: 6.768004, a2: 0.132843, b1: 1.878357, b2: 0.146665, afactor: 1.12} },
  'Mandarin': { rr: {5: 6, 10: 8, 20: 25}, optimal_o2: 5, optimal_co2: 5, rec_temp: 5, category: 'fruit', rq: 1.0, mm: null },
  'Mango': { rr: {10: 30, 20: 115}, optimal_o2: 4, optimal_co2: 8, rec_temp: 12, category: 'fruit', rq: 1.0, mm: {a1: 68.163, a2: 0.079227, b1: 2.004, b2: -0.0539, afactor: 0.2} },
  'Mangosteen': { rr: {20: 16}, optimal_o2: 3, optimal_co2: 5, rec_temp: 13, category: 'fruit', rq: 1.0, mm: null },
  'Nectarine': { rr: {5: 10, 10: 20, 20: 60}, optimal_o2: 2, optimal_co2: 5, rec_temp: 0, category: 'fruit', rq: 1.0, mm: {a1: 6.2, a2: 0.225, b1: 0.1349, b2: 2.1171, afactor: 0.85} },
  'Olive': { rr: {5: 15, 10: 30, 20: 60}, optimal_o2: 3, optimal_co2: 5, rec_temp: 5, category: 'fruit', rq: 1.0, mm: null },
  'Orange': { rr: {5: 6, 10: 8, 20: 28}, optimal_o2: 5, optimal_co2: 5, rec_temp: 5, category: 'fruit', rq: 1.0, mm: null },
  'Papaya': { rr: {5: 8, 10: 10, 20: 50}, optimal_o2: 3, optimal_co2: 8, rec_temp: 10, category: 'fruit', rq: 1.0, mm: {a1: 12.58821, a2: 0.118907, b1: 0.06745, b2: 0.04505, afactor: 0.25} },
  'Passion Fruit': { rr: {5: 45, 10: 60, 20: 105}, optimal_o2: 3, optimal_co2: 5, rec_temp: 7, category: 'fruit', rq: 1.0, mm: null },
  'Peach': { rr: {0: 5, 10: 20, 20: 87}, optimal_o2: 2, optimal_co2: 5, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Pear Anjou': { rr: {0: 4, 5: 9, 10: 15, 20: 45}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Pear Bartlett': { rr: {0: 5, 5: 14, 20: 50}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Persimmon': { rr: {0: 6, 20: 32}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Pineapple': { rr: {5: 6, 10: 8, 20: 35}, optimal_o2: 3, optimal_co2: 8, rec_temp: 7, category: 'fruit', rq: 1.0, mm: null },
  'Plum': { rr: {0: 2.5, 10: 8.4, 20: 16.4}, optimal_o2: 1, optimal_co2: 3, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Pomegranate': { rr: {5: 6, 10: 12, 20: 26}, optimal_o2: 3, optimal_co2: 6, rec_temp: 5, category: 'fruit', rq: 1.0, mm: null },
  'Quince': { rr: {0: 7.5, 10: 24.3, 20: 60.2}, optimal_o2: 3, optimal_co2: 3, rec_temp: 0, category: 'fruit', rq: 1.0, mm: null },
  'Rambutan': { rr: {20: 80}, optimal_o2: 3, optimal_co2: 5, rec_temp: 10, category: 'fruit', rq: 1.0, mm: null },
  'Starfruit': { rr: {5: 15, 10: 23, 20: 60}, optimal_o2: 3, optimal_co2: 5, rec_temp: 5, category: 'fruit', rq: 1.0, mm: null },
  'Strawberry': { rr: {0: 16, 10: 75, 20: 150}, optimal_o2: 7, optimal_co2: 10, rec_temp: 0, category: 'fruit', rq: 1.0, mm: {a1: 17.915, a2: 0.10406, b1: 1.5277, b2: 0.0483, afactor: 0.97} },
  'Watermelon': { rr: {5: 7, 10: 15, 20: 42}, optimal_o2: 3, optimal_co2: 5, rec_temp: 10, category: 'fruit', rq: 1.0, mm: null },

  // VEGETABLES
  'Artichoke': { rr: {0: 30, 5: 43, 10: 71, 20: 193}, optimal_o2: 3, optimal_co2: 3, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Asparagus': { rr: {0: 54, 5: 96, 10: 197, 20: 388}, optimal_o2: 5, optimal_co2: 10, rec_temp: 2, category: 'vegetable', rq: 1.0, mm: {a1: 25.765, a2: 0.10615, b1: 0.5388, b2: 0.141, afactor: 2.15} },
  'Baby Lettuce': { rr: {0: 15, 5: 20, 10: 35, 20: 70}, optimal_o2: 1, optimal_co2: 8, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 49.49902, a2: 0.0858, b1: 0.144857, b2: 0.043714, afactor: 0.29} },
  'Bean Sprouts': { rr: {5: 40, 10: 87, 20: 200}, optimal_o2: 2, optimal_co2: 15, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 2.129268, a2: 0.2263, b1: 0.203333, b2: 0.056667, afactor: 5.3} },
  'Snap Beans': { rr: {0: 20, 5: 34, 10: 68, 20: 130}, optimal_o2: 3, optimal_co2: 5, rec_temp: 5, category: 'vegetable', rq: 1.0, mm: null },
  'Green Beans': { rr: {0: 20, 5: 34, 10: 68, 20: 130}, optimal_o2: 3, optimal_co2: 5, rec_temp: 5, category: 'vegetable', rq: 1.0, mm: {a1: 33.452, a2: 0.0772, b1: -0.6251, b2: 0.1658, afactor: 0.7} },
  'Long Beans': { rr: {0: 40, 5: 46, 10: 92, 20: 220}, optimal_o2: 3, optimal_co2: 5, rec_temp: 5, category: 'vegetable', rq: 1.0, mm: {a1: 18.803, a2: 0.1485, b1: 0.1349, b2: 0.0901, afactor: 1.2} },
  'Belgian Endive': { rr: {0: 9, 10: 31, 20: 79}, optimal_o2: 3, optimal_co2: 4, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Bell Pepper': { rr: {5: 7, 10: 13, 20: 38}, optimal_o2: 3, optimal_co2: 2, rec_temp: 7, category: 'vegetable', rq: 1.0, mm: null },
  'Broccoli': { rr: {0: 21, 5: 34, 10: 81, 20: 300}, optimal_o2: 2, optimal_co2: 8, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 59.312, a2: 0.0975, b1: 0.1349, b2: 0.0901, afactor: 0.36} },
  'Brussels Sprouts': { rr: {0: 20, 5: 35, 10: 60, 20: 120}, optimal_o2: 2, optimal_co2: 6, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Cabbage': { rr: {0: 5, 5: 10, 10: 18, 20: 39}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 9.0449, a2: 0.078674, b1: 1.8217, b2: 0.0244, afactor: 0.61} },
  'Carrots Topped': { rr: {0: 15, 5: 21, 10: 31, 20: 71}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 13.11, a2: 0.04106, b1: 0.1, b2: 0.001, afactor: 1.15} },
  'Carrots Bunched': { rr: {0: 28, 5: 38, 10: 47, 20: 104}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 13.11, a2: 0.04106, b1: 0.1, b2: 0.001, afactor: 2.07} },
  'Cauliflower': { rr: {0: 17, 5: 21, 10: 34, 20: 81}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 66.23, a2: 0.0843, b1: 1.688, b2: 0.098, afactor: 0.27} },
  'Celery': { rr: {0: 6, 5: 10, 10: 24, 20: 64}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 6.8875, a2: 0.0775, b1: 1.1902, b2: 0.0342, afactor: 0.93} },
  'Chile Pepper': { rr: {10: 15, 20: 50}, optimal_o2: 3, optimal_co2: 7, rec_temp: 7, category: 'vegetable', rq: 1.0, mm: {a1: 8.0152, a2: 0.0796, b1: 0, b2: 0.2325, afactor: 0.96} },
  'Sweet Corn': { rr: {0: 81, 5: 126, 10: 224, 20: 579}, optimal_o2: 5, optimal_co2: 8, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 62.12989, a2: 0.082604, b1: 1.8783334, b2: 0.146667, afactor: 1.42} },
  'Cucumber': { rr: {10: 27, 20: 31}, optimal_o2: 3, optimal_co2: 0, rec_temp: 10, category: 'vegetable', rq: 1.0, mm: null },
  'Eggplant American': { rr: {10: 69}, optimal_o2: 3, optimal_co2: 0, rec_temp: 10, category: 'vegetable', rq: 1.0, mm: null },
  'Garlic': { rr: {0: 8, 5: 16, 10: 24, 20: 21}, optimal_o2: 1, optimal_co2: 10, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Herbs': { rr: {0: 26, 10: 105, 20: 352}, optimal_o2: 3, optimal_co2: 8, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Jicama': { rr: {0: 6, 5: 11, 10: 15, 20: 7}, optimal_o2: 3, optimal_co2: 5, rec_temp: 13, category: 'vegetable', rq: 1.0, mm: null },
  'Lettuce Crisphead': { rr: {0: 11, 5: 16, 10: 31, 20: 45}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Lettuce Romaine': { rr: {5: 21, 10: 35, 20: 68}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Mushroom': { rr: {0: 36, 5: 70, 10: 100, 20: 290}, optimal_o2: 5, optimal_co2: 10, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 44.343, a2: 0.094522, b1: 0.76, b2: 0, afactor: 0.845} },
  'Okra': { rr: {5: 57, 10: 91, 20: 261}, optimal_o2: 3, optimal_co2: 5, rec_temp: 7, category: 'vegetable', rq: 1.0, mm: null },
  'Onion': { rr: {0: 7, 20: 56}, optimal_o2: 2, optimal_co2: 2, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Green Onion': { rr: {0: 21, 5: 28, 10: 49, 20: 130}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Peas': { rr: {0: 39, 5: 65, 10: 93, 20: 303}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Snap Peas': { rr: {0: 39, 5: 65, 10: 93, 20: 303}, optimal_o2: 3, optimal_co2: 5, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 68.163, a2: 0.079227, b1: 2.004, b2: -0.0539, afactor: 0.63} },
  'Potato': { rr: {5: 14, 10: 18, 20: 32}, optimal_o2: 2, optimal_co2: 3, rec_temp: 7, category: 'vegetable', rq: 1.0, mm: null },
  'Radish Bunched': { rr: {0: 13, 5: 17, 10: 26, 20: 120}, optimal_o2: 2, optimal_co2: 3, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Radish Topped': { rr: {0: 6, 5: 8, 10: 13, 20: 45}, optimal_o2: 2, optimal_co2: 3, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Spinach': { rr: {0: 18, 5: 46, 10: 110, 20: 229}, optimal_o2: 7, optimal_co2: 8, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: null },
  'Squash': { rr: {0: 13, 5: 17, 10: 35, 20: 90}, optimal_o2: 3, optimal_co2: 0, rec_temp: 7, category: 'vegetable', rq: 1.0, mm: null },
  'Sweet Potato': { rr: {5: 14, 20: 22}, optimal_o2: 3, optimal_co2: 3, rec_temp: 13, category: 'vegetable', rq: 1.0, mm: null },
  'Tomatillo': { rr: {5: 13, 10: 17, 20: 35}, optimal_o2: 3, optimal_co2: 5, rec_temp: 7, category: 'vegetable', rq: 1.0, mm: null },
  'Tomato': { rr: {5: 7, 10: 17, 20: 33}, optimal_o2: 3, optimal_co2: 3, rec_temp: 10, category: 'vegetable', rq: 1.0, mm: null },
  'Bitter Melon': { rr: {0: 10, 5: 18, 10: 30, 20: 60}, optimal_o2: 2, optimal_co2: 6, rec_temp: 10, category: 'vegetable', rq: 1.0, mm: {a1: 13.649, a2: 0.112, b1: 0.0596, b2: 0.0137, afactor: 1.0} },
  'Coleslaw Mix': { rr: {0: 15, 5: 22, 10: 35, 20: 72}, optimal_o2: 1, optimal_co2: 8, rec_temp: 0, category: 'vegetable', rq: 1.0, mm: {a1: 23.07, a2: 0.0453, b1: 0.0435, b2: -0.0011538, afactor: 1.0} },
  'Pumpkin': { rr: {20: 90}, optimal_o2: 3, optimal_co2: 5, rec_temp: 10, category: 'vegetable', rq: 1.0, mm: null },
  'Nopalitos': { rr: {5: 18, 10: 42, 20: 82}, optimal_o2: 3, optimal_co2: 5, rec_temp: 5, category: 'vegetable', rq: 1.0, mm: null }
};

// --- ENGINE LOGIC ---

function getRespirationRate(produceData, temperature) {
  const rr = produceData.rr;
  const temps = Object.keys(rr).map(Number).sort((a, b) => a - b);
  const rates = temps.map(t => rr[t]);

  if (temps.length === 1) return rates[0] * Math.pow(2.5, (temperature - temps[0]) / 10.0);
  
  const logRates = rates.map(r => Math.log(r));
  if (temps.length === 2) {
    const b = (logRates[1] - logRates[0]) / (temps[1] - temps[0]);
    const ln_a = logRates[0] - b * temps[0];
    return Math.exp(ln_a + b * temperature);
  } else {
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = temps.length;
    for (let i = 0; i < n; i++) { sumX += temps[i]; sumY += logRates[i]; sumXY += temps[i] * logRates[i]; sumXX += temps[i] * temps[i]; }
    const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const ln_a = (sumY - b * sumX) / n;
    return Math.exp(ln_a + b * temperature);
  }
}

function solveSteadyState(total_otr_o2, total_otr_co2, produce_data, temperature, weight_kg) {
  const rq = produce_data.rq || 1.0;
  const rr_ambient = getRespirationRate(produce_data, temperature);
  
  let Vm, Km;
  if (produce_data.mm) {
    const mm = produce_data.mm;
    Vm = mm.afactor * mm.a1 * Math.exp(mm.a2 * temperature);
    Km = mm.b1 + mm.b2 * temperature;
    if (Km <= 0) Km = 0.5;
  } else {
    Km = 2.0;
    Vm = rr_ambient * (Km + 20.9) / 20.9;
  }

  const Vm_cc = Vm * 0.5091 * 24 / rq;
  const Vm_total = Vm_cc * weight_kg;
  const Km_frac = Km / 100.0;

  const a_coeff = total_otr_o2;
  const b_coeff = Vm_total + total_otr_o2 * Km_frac - 0.209 * total_otr_o2;
  const c_coeff = -0.209 * total_otr_o2 * Km_frac;

  const discriminant = b_coeff * b_coeff - 4 * a_coeff * c_coeff;
  if (discriminant < 0) return [null, null];

  let y_o2 = (-b_coeff + Math.sqrt(discriminant)) / (2 * a_coeff);
  y_o2 = Math.max(0.001, Math.min(0.209, y_o2));

  const r_o2_at_ss = Vm_total * y_o2 / (Km_frac + y_o2);
  const r_co2_at_ss = r_o2_at_ss * rq;
  const y_co2 = 0.0004 + r_co2_at_ss / total_otr_co2;

  return [y_o2 * 100, y_co2 * 100];
}

function scoreDesign(ss_o2, ss_co2, target_o2, target_co2, total_membranes, n_pinholes, n_membrane_types) {
  const o2_err = Math.abs(ss_o2 - target_o2) / Math.max(target_o2, 0.5);
  const co2_err = Math.abs(ss_co2 - target_co2) / Math.max(target_co2, 0.5);
  let score = o2_err + co2_err;
  score += total_membranes * 0.005;
  score += n_pinholes * 0.002;
  score += (n_membrane_types - 1) * 0.01;
  return score;
}

// --- UI COMPONENTS ---

const AccuracyBar = ({ ss_val, target_val, label, unit = "%" }) => {
  const err = Math.abs(ss_val - target_val);
  const pct_err = (err / Math.max(target_val, 0.5)) * 100;
  
  let color = "#ef4444", grade = "Off-target";
  if (pct_err <= 5) { color = "#22c55e"; grade = "Excellent"; }
  else if (pct_err <= 15) { color = "#84cc16"; grade = "Good"; }
  else if (pct_err <= 30) { color = "#eab308"; grade = "Fair"; }
  else if (pct_err <= 60) { color = "#f97316"; grade = "Poor"; }
  
  const bar_w = Math.max(2, Math.min(100, 100 - pct_err));

  return (
    <div className="my-1.5 flex items-center gap-3">
      <span className="w-12 font-semibold text-sm">{label}</span>
      <span className="text-sm w-24 text-slate-500">Target: {target_val}{unit}</span>
      <div className="flex-1 bg-slate-200 rounded h-4 relative overflow-hidden">
        <div style={{ width: `${bar_w}%`, backgroundColor: color }} className="h-full rounded transition-all duration-500" />
      </div>
      <span className="text-sm font-bold w-16" style={{ color }}>{ss_val.toFixed(1)}{unit}</span>
      <span className="text-xs text-slate-400 w-16 text-right">{grade}</span>
    </div>
  );
};

export default function App() {
  const [produce, setProduce] = useState('Broccoli');
  const [width, setWidth] = useState(10);
  const [length, setLength] = useState(8);
  const [depth, setDepth] = useState(4);
  const [weight, setWeight] = useState(1.0);
  const [temperature, setTemperature] = useState(5);
  const [filmQ10, setFilmQ10] = useState(1.5);
  const [shelfLife, setShelfLife] = useState(14);
  const [allowMixed, setAllowMixed] = useState(true);
  
  const [report, setReport] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateDesign = (e) => {
    e.preventDefault();
    setIsCalculating(true);

    setTimeout(() => {
      const pData = PRODUCE_DATA[produce];
      const target_o2 = pData.optimal_o2;
      const target_co2 = pData.optimal_co2;
      const rq = pData.rq || 1.0;
      
      const pkg_area = 2.0 * (width * length + width * depth + length * depth);
      const weight_kg = weight * 0.45359;

      const rr = getRespirationRate(pData, temperature);
      const cc_o2_day = (rr * 0.5091 * 24) / rq;
      const cc_co2_day = rr * 0.5091 * 24;
      const total_o2_demand = cc_o2_day * weight_kg;
      const total_co2_production = cc_co2_day * weight_kg;

      const designs = [];
      const membrane_names = Object.keys(MEMBRANES);

      const calcOTR = (film_name, mc_list, pin_type, n_pin) => {
        const film = FILMS[film_name];
        const film_otr = film.OTR * Math.pow(filmQ10, (temperature - 22.0) / 10.0);
        
        let o2 = film_otr * (pkg_area / 100.0);
        let co2 = film_otr * film.CO2_ratio * (pkg_area / 100.0);

        mc_list.forEach(mc => {
          const mem = MEMBRANES[mc.name];
          const h_area = Math.PI * Math.pow(mc.hole_diameter / 2.0, 2);
          o2 += mc.count * mem.OTR_target * (h_area / 100.0);
          co2 += mc.count * mem.OTR_target * mem.CO2_ratio * (h_area / 100.0);
        });

        const pin = PINHOLES[pin_type];
        o2 += n_pin * pin.OTR;
        co2 += n_pin * pin.OTR * pin.CO2_ratio;

        return [o2, co2];
      };

      const tryConfigAndScore = (film_name, mc_list, pin_type, n_pin) => {
        const [tO2, tCO2] = calcOTR(film_name, mc_list, pin_type, n_pin);
        if (tO2 <= 0 || tCO2 <= 0) return null;

        const [ss_o2, ss_co2] = solveSteadyState(tO2, tCO2, pData, temperature, weight_kg);
        if (ss_o2 === null || ss_o2 < 0.5 || ss_o2 > 20 || ss_co2 < 0 || ss_co2 > 25) return null;

        const total_mem = mc_list.reduce((sum, mc) => sum + mc.count, 0);
        const n_types = new Set(mc_list.filter(m => m.count > 0).map(m => m.name)).size;
        
        const score = scoreDesign(ss_o2, ss_co2, target_o2, target_co2, total_mem, n_pin, n_types);
        
        const mem_desc = mc_list.filter(m => m.count > 0).map(m => `${m.count}x ${m.name} (${m.hole_diameter}")`).join(' + ') || 'None';
        const pin_desc = n_pin > 0 ? `${n_pin}x ${pin_type}` : 'None';

        return {
          film: film_name, film_cost: FILMS[film_name].cost,
          membrane_desc: mem_desc, is_mixed: n_types > 1, total_membranes: total_mem,
          pinhole_desc: pin_desc, n_pinholes: n_pin,
          ss_o2_pct: ss_o2, ss_co2_pct: ss_co2,
          target_o2_pct: target_o2, target_co2_pct: target_co2,
          score: score
        };
      };

      // PHASE 1: Single Membrane + Safety Pinholes
      Object.keys(FILMS).forEach(film_name => {
        membrane_names.forEach(mem_name => {
          HOLE_SIZES.forEach(hole_diam => {
            Object.keys(PINHOLES).forEach(pinhole_type => {
              const film = FILMS[film_name];
              const membrane = MEMBRANES[mem_name];
              const pinhole = PINHOLES[pinhole_type];

              const film_otr = film.OTR * Math.pow(filmQ10, (temperature - 22.0) / 10.0);
              const h_area = Math.PI * Math.pow(hole_diam / 2.0, 2);
              const delta_o2 = 0.209 - (target_o2 / 100.0);
              const delta_co2 = (target_co2 / 100.0) - 0.0004;

              if (delta_o2 <= 0 || delta_co2 <= 0) return;

              const f_film_o2 = film_otr * (pkg_area / 100.0) * delta_o2;
              const f_mem_o2 = membrane.OTR_target * (h_area / 100.0) * delta_o2;
              const f_pin_o2 = pinhole.OTR * delta_o2;
              const f_film_co2 = film_otr * film.CO2_ratio * (pkg_area / 100.0) * delta_co2;
              const f_mem_co2 = membrane.OTR_target * membrane.CO2_ratio * (h_area / 100.0) * delta_co2;
              const f_pin_co2 = pinhole.OTR * pinhole.CO2_ratio * delta_co2;

              const rem_o2 = total_o2_demand - f_film_o2;
              const rem_co2 = total_co2_production - f_film_co2;

              const det = f_mem_o2 * f_pin_co2 - f_pin_o2 * f_mem_co2;
              if (Math.abs(det) > 1e-10) {
                const n_mem_exact = (rem_o2 * f_pin_co2 - f_pin_o2 * rem_co2) / det;
                const n_pin_exact = (f_mem_o2 * rem_co2 - rem_o2 * f_mem_co2) / det;

                [Math.max(0, Math.floor(n_mem_exact)), Math.max(0, Math.ceil(n_mem_exact))].forEach(n_m => {
                  [Math.max(1, Math.floor(n_pin_exact)), Math.max(1, Math.ceil(n_pin_exact))].forEach(n_p => {
                    if (n_m <= 10 && n_p <= 30) {
                      const d = tryConfigAndScore(film_name, [{name: mem_name, hole_diameter: hole_diam, count: n_m}], pinhole_type, n_p);
                      if (d) designs.push(d);
                    }
                  });
                });
              }
            });
          });
        });
      });

      // PHASE 2: Mixed Membranes
      if (allowMixed) {
        Object.keys(FILMS).forEach(film_name => {
          for(let i=0; i<membrane_names.length; i++) {
            for(let j=i+1; j<membrane_names.length; j++) {
              [0.5, 1.0].forEach(hole_a => { 
                [0.5, 1.0].forEach(hole_b => {
                  const ma = membrane_names[i], mb = membrane_names[j];
                  for(let na=1; na<=3; na++) {
                    for(let nb=1; nb<=3; nb++) {
                      const d = tryConfigAndScore(film_name, [
                        {name: ma, hole_diameter: hole_a, count: na},
                        {name: mb, hole_diameter: hole_b, count: nb}
                      ], 'Needle', 1); 
                      if (d) designs.push(d);
                    }
                  }
                });
              });
            }
          }
        });
      }

      // Sort and Deduplicate
      const unique = [];
      const seen = new Set();
      designs.sort((a,b) => a.score - b.score).forEach(d => {
        const key = `${d.film}|${d.membrane_desc}|${d.pinhole_desc}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(d);
        }
      });

      setReport({
        info: { produce, pkg_area, weight_kg, weight_lbs: weight, rr, total_o2_demand, target_o2, target_co2, temperature, shelfLife, width, length, depth },
        designs: unique.slice(0, 30)
      });
      setIsCalculating(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-600 p-6 flex flex-col md:flex-row items-center justify-between rounded-xl shadow-lg text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg"><Package size={32} /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">Breatheway MAP Engine</h1>
              <p className="text-green-100 text-sm mt-1">Quadratic Steady-State Solver • Mogri et al. Kinetics</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={calculateDesign} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
              
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                  <Leaf size={16} className="mr-2 text-green-600" /> Produce Select
                </label>
                <select value={produce} onChange={(e) => setProduce(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg">
                  <optgroup label="Fruits">
                    {Object.entries(PRODUCE_DATA).filter(([_, v]) => v.category === 'fruit').map(([k, _]) => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                  <optgroup label="Vegetables">
                    {Object.entries(PRODUCE_DATA).filter(([_, v]) => v.category === 'vegetable').map(([k, _]) => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                  <Settings size={16} className="mr-2 text-slate-500" /> Package Profile
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div><label className="text-xs text-slate-500 block">W (in)</label><input type="number" step="0.1" value={width} onChange={e=>setWidth(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded" /></div>
                  <div><label className="text-xs text-slate-500 block">L (in)</label><input type="number" step="0.1" value={length} onChange={e=>setLength(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded" /></div>
                  <div><label className="text-xs text-slate-500 block">D (in)</label><input type="number" step="0.1" value={depth} onChange={e=>setDepth(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-slate-500 block">Weight (lbs)</label><input type="number" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded" /></div>
                  <div><label className="text-xs text-slate-500 block">Temp (°C)</label><input type="number" step="0.1" value={temperature} onChange={e=>setTemperature(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded" /></div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input type="checkbox" checked={allowMixed} onChange={e=>setAllowMixed(e.target.checked)} className="w-4 h-4 text-green-600 rounded" id="mixed" />
                <label htmlFor="mixed" className="text-sm font-medium text-slate-700 cursor-pointer">Explore Mixed-Membrane Arrays</label>
              </div>

              <button type="submit" disabled={isCalculating} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold flex justify-center items-center shadow-md">
                {isCalculating ? "Running Determinants..." : <><Calculator size={18} className="mr-2" /> Solve Steady-State</>}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="lg:col-span-8">
            {report === null ? (
              <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm h-full flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Modified Atmosphere Packaging Design Tool</h2>
                <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                  Based on the model outlined in <strong className="text-slate-800">Mogri et al. (2001)</strong> using Breatheway MAP technology with side-chain crystallizable polyacrylate/polymethacrylate membranes.
                </p>

                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Model Overview</h3>
                <p className="text-slate-600 text-sm mb-4">
                  The design uses <strong className="text-slate-800">Michaelis-Menten enzyme kinetics</strong> for produce respiration:
                </p>

                <div className="bg-slate-50 p-4 rounded-lg mb-4 text-center font-serif text-lg tracking-wide text-slate-700">
                  R<sub>O₂</sub> = (V<sub>m</sub> · [O₂]) / (K<sub>m</sub> + [O₂])
                </div>

                <p className="text-slate-600 text-sm mb-2">Where:</p>
                <ul className="list-disc list-inside text-slate-600 text-sm mb-8 space-y-1.5 ml-2">
                  <li><span className="font-serif">V<sub>m</sub> = a<sub>fac</sub> · a<sub>1</sub> · e<sup>a<sub>2</sub> · T</sup></span> — maximum respiration rate</li>
                  <li><span className="font-serif">K<sub>m</sub> = b<sub>fac</sub> · (b<sub>1</sub> + b<sub>2</sub> · T)</span> — Michaelis-Menten constant</li>
                </ul>

                <p className="text-slate-600 text-sm mb-3">
                  <strong className="text-slate-800">Steady-state mass balance</strong> determines package atmosphere:
                </p>
                <div className="bg-slate-50 p-5 rounded-lg space-y-3 font-serif text-slate-700 text-sm md:text-base">
                  <div><span className="font-sans font-bold text-slate-500 mr-2">O₂:</span> Total OTR × (0.209 − y<sub>O₂</sub>) = R<sub>O₂</sub> × W</div>
                  <div><span className="font-sans font-bold text-slate-500 mr-2">CO₂:</span> Total CO₂TR × (y<sub>CO₂</sub> − 0.0004) = R<sub>CO₂</sub> × W</div>
                </div>
              </div>
            ) : report.designs.length === 0 ? (
              <div className="bg-red-50 p-8 rounded-xl border border-red-200 flex flex-col items-center justify-center text-red-600 h-full">
                <AlertTriangle size={48} className="mb-4" />
                <h3 className="text-xl font-bold">No Feasible Designs Found</h3>
                <p className="text-sm mt-2 text-center">Try increasing package area, as all packages require at least 1 baseline pinhole.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Info Header */}
                <div className="bg-green-50/50 p-5 rounded-xl border border-green-200 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Produce</div>
                    <div className="text-xl font-black text-slate-800">{report.info.produce}</div>
                    <div className="text-xs text-slate-600 mt-1">Target: <b className="text-blue-600">{report.info.target_o2}% O₂</b> / <b className="text-orange-600">{report.info.target_co2}% CO₂</b></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Package Payload</div>
                    <div className="text-sm font-bold text-slate-800">{report.info.width}" x {report.info.length}" x {report.info.depth}"</div>
                    <div className="text-xs text-slate-600 mt-1">Total area: <b>{report.info.pkg_area.toFixed(0)} sq.in.</b></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Kinetics</div>
                    <div className="text-sm font-bold text-slate-800">O₂ Demand: {report.info.total_o2_demand.toFixed(0)} cc/day</div>
                    <div className="text-xs text-slate-600 mt-1">Respiration: {report.info.rr.toFixed(1)} mg/kg/h</div>
                  </div>
                </div>

                {/* Best Match */}
                <div className="bg-white border-2 border-green-600 p-6 rounded-xl shadow-sm relative">
                  <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED DESIGN</div>
                  
                  <div className="flex items-center gap-3 mb-5">
                    <CheckCircle2 className="text-green-600" />
                    <h2 className="text-lg font-black text-slate-800">Optimal Configuration</h2>
                    {report.designs[0].is_mixed && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MIXED ARRAY</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Base Film</div>
                      <div className="font-bold text-sm text-slate-800">{report.designs[0].film}</div>
                      <div className="text-xs text-slate-400 mt-1">{report.designs[0].film_cost}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Membrane Array</div>
                      <div className="font-bold text-sm text-slate-800">{report.designs[0].membrane_desc}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Safety Pinholes</div>
                      <div className="font-bold text-sm text-slate-800">{report.designs[0].pinhole_desc}</div>
                    </div>
                  </div>

                  <AccuracyBar ss_val={report.designs[0].ss_o2_pct} target_val={report.designs[0].target_o2_pct} label="O₂" />
                  <AccuracyBar ss_val={report.designs[0].ss_co2_pct} target_val={report.designs[0].target_co2_pct} label="CO₂" />
                </div>

                {/* All Designs */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <Info size={16} className="text-slate-400" />
                    <h3 className="font-bold text-slate-700">All Feasible Designs ({report.designs.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 text-left font-bold text-slate-500">Film</th>
                          <th className="p-3 text-left font-bold text-slate-500">Membranes</th>
                          <th className="p-3 text-left font-bold text-slate-500">Pinholes</th>
                          <th className="p-3 text-center font-bold text-blue-600">O₂ %</th>
                          <th className="p-3 text-center font-bold text-orange-600">CO₂ %</th>
                          <th className="p-3 text-center font-bold text-slate-500">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.designs.map((d, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="p-3 font-medium text-slate-700">{d.film} <span className="text-slate-400">{d.film_cost}</span></td>
                            <td className="p-3 text-slate-600">{d.membrane_desc} {d.is_mixed && <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-1 rounded">MIX</span>}</td>
                            <td className="p-3 text-slate-600">{d.pinhole_desc}</td>
                            <td className="p-3 text-center font-bold text-blue-700">{d.ss_o2_pct.toFixed(1)}</td>
                            <td className="p-3 text-center font-bold text-orange-700">{d.ss_co2_pct.toFixed(1)}</td>
                            <td className="p-3 text-center text-slate-500">{d.score.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
