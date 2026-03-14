"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import hospitalConfig from "@/config/hospital";

const DOSAGE_PRESETS = ["1-0-1", "1-1-1", "0-0-1", "1-0-0", "0-1-0", "SOS", "Once daily", "Twice daily", "Thrice daily"];
const DURATION_PRESETS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month", "Ongoing"];
const ROUTE_OPTIONS = ["Oral", "Topical", "Inhalation", "Injection", "IV Injection", "IM Injection", "Sublingual", "Nasal Drops", "Nasal Spray", "Eye Drops", "Eye Ointment", "Ear Drops", "Vaginal", "Rectal", "Transdermal Patch"];

// ════════════════════════════════════════════════
//  ★ LAB TEST ENGINE
//  Curated catalogue of common tests with categories
// ════════════════════════════════════════════════
const LAB_CATEGORIES = [
  "Haematology", "Biochemistry", "Microbiology", "Serology/Immunology",
  "Urine & Stool", "Endocrinology", "Cardiology", "Liver Function",
  "Renal Function", "Lipid Profile", "Coagulation", "Tumour Markers", "Others"
] as const;

const LAB_TEST_DB: Array<{ name: string; category: typeof LAB_CATEGORIES[number]; code: string }> = [
  // Haematology
  { name: "Complete Blood Count (CBC)", category: "Haematology", code: "CBC" },
  { name: "Haemoglobin (Hb)", category: "Haematology", code: "HB" },
  { name: "WBC Differential Count", category: "Haematology", code: "WBCDIFF" },
  { name: "Platelet Count", category: "Haematology", code: "PLT" },
  { name: "ESR (Erythrocyte Sedimentation Rate)", category: "Haematology", code: "ESR" },
  { name: "Peripheral Blood Smear", category: "Haematology", code: "PBS" },
  { name: "Reticulocyte Count", category: "Haematology", code: "RETIC" },
  // Biochemistry
  { name: "Random Blood Sugar (RBS)", category: "Biochemistry", code: "RBS" },
  { name: "Fasting Blood Sugar (FBS)", category: "Biochemistry", code: "FBS" },
  { name: "Post Prandial Blood Sugar (PPBS)", category: "Biochemistry", code: "PPBS" },
  { name: "HbA1c (Glycated Haemoglobin)", category: "Biochemistry", code: "HBA1C" },
  { name: "Serum Electrolytes (Na/K/Cl)", category: "Biochemistry", code: "ELEC" },
  { name: "Serum Calcium", category: "Biochemistry", code: "CA" },
  { name: "Serum Phosphorus", category: "Biochemistry", code: "PHOS" },
  { name: "Serum Magnesium", category: "Biochemistry", code: "MG" },
  { name: "Uric Acid", category: "Biochemistry", code: "UA" },
  { name: "Serum Iron Studies", category: "Biochemistry", code: "IRON" },
  { name: "TIBC (Total Iron Binding Capacity)", category: "Biochemistry", code: "TIBC" },
  { name: "Serum Ferritin", category: "Biochemistry", code: "FERR" },
  { name: "Serum Vitamin B12", category: "Biochemistry", code: "B12" },
  { name: "Serum Vitamin D (25-OH)", category: "Biochemistry", code: "VITD" },
  { name: "Serum Folate", category: "Biochemistry", code: "FOLATE" },
  // Liver Function
  { name: "Liver Function Test (LFT)", category: "Liver Function", code: "LFT" },
  { name: "SGOT / AST", category: "Liver Function", code: "SGOT" },
  { name: "SGPT / ALT", category: "Liver Function", code: "SGPT" },
  { name: "Total Bilirubin", category: "Liver Function", code: "TBIL" },
  { name: "Direct Bilirubin", category: "Liver Function", code: "DBIL" },
  { name: "Serum Albumin", category: "Liver Function", code: "ALB" },
  { name: "Alkaline Phosphatase (ALP)", category: "Liver Function", code: "ALP" },
  { name: "GGT (Gamma GT)", category: "Liver Function", code: "GGT" },
  // Renal Function
  { name: "Renal Function Test (RFT)", category: "Renal Function", code: "RFT" },
  { name: "Serum Creatinine", category: "Renal Function", code: "CREAT" },
  { name: "Blood Urea Nitrogen (BUN)", category: "Renal Function", code: "BUN" },
  { name: "eGFR", category: "Renal Function", code: "EGFR" },
  // Lipid Profile
  { name: "Lipid Profile", category: "Lipid Profile", code: "LIPID" },
  { name: "Total Cholesterol", category: "Lipid Profile", code: "TC" },
  { name: "HDL Cholesterol", category: "Lipid Profile", code: "HDL" },
  { name: "LDL Cholesterol", category: "Lipid Profile", code: "LDL" },
  { name: "Triglycerides", category: "Lipid Profile", code: "TG" },
  // Coagulation
  { name: "Prothrombin Time (PT / INR)", category: "Coagulation", code: "PT" },
  { name: "APTT", category: "Coagulation", code: "APTT" },
  { name: "D-Dimer", category: "Coagulation", code: "DDIMER" },
  { name: "Bleeding Time / Clotting Time", category: "Coagulation", code: "BTCT" },
  // Endocrinology
  { name: "TSH (Thyroid Stimulating Hormone)", category: "Endocrinology", code: "TSH" },
  { name: "T3 (Triiodothyronine)", category: "Endocrinology", code: "T3" },
  { name: "T4 (Thyroxine)", category: "Endocrinology", code: "T4" },
  { name: "Free T3", category: "Endocrinology", code: "FT3" },
  { name: "Free T4", category: "Endocrinology", code: "FT4" },
  { name: "Serum Cortisol (Morning)", category: "Endocrinology", code: "CORT" },
  { name: "Insulin (Fasting)", category: "Endocrinology", code: "INSF" },
  { name: "HOMA-IR", category: "Endocrinology", code: "HOMA" },
  { name: "FSH", category: "Endocrinology", code: "FSH" },
  { name: "LH", category: "Endocrinology", code: "LH" },
  { name: "Prolactin", category: "Endocrinology", code: "PRL" },
  { name: "Testosterone (Total)", category: "Endocrinology", code: "TESTO" },
  // Cardiology
  { name: "Troponin I (High Sensitivity)", category: "Cardiology", code: "TROP" },
  { name: "CK-MB", category: "Cardiology", code: "CKMB" },
  { name: "BNP / NT-proBNP", category: "Cardiology", code: "BNP" },
  { name: "LDH", category: "Cardiology", code: "LDH" },
  { name: "CPK (Total)", category: "Cardiology", code: "CPK" },
  // Serology / Immunology
  { name: "CRP (C-Reactive Protein)", category: "Serology/Immunology", code: "CRP" },
  { name: "RA Factor (Rheumatoid Factor)", category: "Serology/Immunology", code: "RAF" },
  { name: "ANA (Antinuclear Antibody)", category: "Serology/Immunology", code: "ANA" },
  { name: "Anti-CCP Antibody", category: "Serology/Immunology", code: "ACCP" },
  { name: "Widal Test", category: "Serology/Immunology", code: "WIDAL" },
  { name: "Dengue NS1 Antigen", category: "Serology/Immunology", code: "DENGNS1" },
  { name: "Dengue IgG / IgM", category: "Serology/Immunology", code: "DENGAB" },
  { name: "Malaria Antigen Test (RDT)", category: "Serology/Immunology", code: "MAL" },
  { name: "HBsAg (Hepatitis B Surface Antigen)", category: "Serology/Immunology", code: "HBSAG" },
  { name: "Anti-HCV", category: "Serology/Immunology", code: "HCV" },
  { name: "HIV 1 & 2 (ELISA)", category: "Serology/Immunology", code: "HIV" },
  { name: "VDRL / RPR (Syphilis)", category: "Serology/Immunology", code: "VDRL" },
  { name: "COVID-19 Antigen", category: "Serology/Immunology", code: "COVID" },
  { name: "COVID-19 RT-PCR", category: "Serology/Immunology", code: "COVIDPCR" },
  { name: "H. pylori IgG Antibody", category: "Serology/Immunology", code: "HPYL" },
  // Urine & Stool
  { name: "Urine Routine & Microscopy (R/M)", category: "Urine & Stool", code: "URINE" },
  { name: "Urine Culture & Sensitivity", category: "Urine & Stool", code: "URINECS" },
  { name: "24hr Urine Protein", category: "Urine & Stool", code: "U24P" },
  { name: "Urine Microalbumin", category: "Urine & Stool", code: "UMICRO" },
  { name: "Urine Pregnancy Test (UPT)", category: "Urine & Stool", code: "UPT" },
  { name: "Stool Routine & Microscopy", category: "Urine & Stool", code: "STOOL" },
  { name: "Stool Occult Blood (FOB)", category: "Urine & Stool", code: "FOB" },
  { name: "Stool Culture", category: "Urine & Stool", code: "STOOLCS" },
  // Microbiology
  { name: "Blood Culture & Sensitivity", category: "Microbiology", code: "BLOODCS" },
  { name: "Sputum Culture & Sensitivity", category: "Microbiology", code: "SPUTCS" },
  { name: "Throat Swab Culture", category: "Microbiology", code: "THROATCS" },
  { name: "Wound Swab Culture", category: "Microbiology", code: "WOUNDCS" },
  { name: "KOH Preparation (Fungal)", category: "Microbiology", code: "KOH" },
  { name: "TB NAAT / GeneXpert", category: "Microbiology", code: "GENEX" },
  { name: "Mantoux Test (TST)", category: "Microbiology", code: "MANTOUX" },
  // Tumour Markers
  { name: "PSA (Prostate Specific Antigen)", category: "Tumour Markers", code: "PSA" },
  { name: "CA 125 (Ovarian)", category: "Tumour Markers", code: "CA125" },
  { name: "CA 19-9 (Pancreatic)", category: "Tumour Markers", code: "CA199" },
  { name: "CEA (Carcinoembryonic Antigen)", category: "Tumour Markers", code: "CEA" },
  { name: "AFP (Alpha-Fetoprotein)", category: "Tumour Markers", code: "AFP" },
  { name: "Beta HCG (Quantitative)", category: "Tumour Markers", code: "BHCG" },
  // Others
  { name: "Chest X-Ray (PA View)", category: "Others", code: "CXR" },
  { name: "ECG (12-lead)", category: "Others", code: "ECG" },
  { name: "2D Echo", category: "Others", code: "ECHO" },
  { name: "USG Abdomen", category: "Others", code: "USGABD" },
  { name: "USG Pelvis", category: "Others", code: "USGPELV" },
  { name: "USG KUB", category: "Others", code: "USGKUB" },
  { name: "CT Scan Head", category: "Others", code: "CTHEAD" },
  { name: "MRI Brain", category: "Others", code: "MRIBRAIN" },
  { name: "Bone Density (DEXA Scan)", category: "Others", code: "DEXA" },
  { name: "Spirometry / PFT", category: "Others", code: "PFT" },
];

type LabStatus = "Pending" | "Sample Collected" | "Processing" | "Completed" | "Cancelled";

interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  urgency: "Routine" | "Urgent" | "STAT";
  notes: string;
}

interface LabOrder {
  id: string;
  prescription_id: string;
  patient_id: string;
  patient_name: string;
  tests: LabTest[];
  status: LabStatus;
  result_notes: string;
  ordered_at: string;
  completed_at?: string;
  diagnosis: string;
}

// ════════════════════════════════════════════════
//  ★ DRUG INTERACTION ENGINE (ADDED)
//  Maps keywords in medicine names → generic group
//  Checks all prescribed pairs for known interactions
// ════════════════════════════════════════════════
interface InteractionWarning { drug1: string; drug2: string; severity: "high" | "moderate"; message: string; }

const GENERIC_MAP: Array<{
  keywords: string[];
  generic: string;
  interactions: string[];
  warnings: string[];
  isHigh?: boolean;
}> = [
  { keywords: ["warfarin"], generic: "warfarin", isHigh: true,
    interactions: ["aspirin","ibuprofen","diclofenac","naproxen","etoricoxib","celecoxib","meloxicam","indomethacin","aceclofenac","mefenamic","piroxicam","ketorolac","metronidazole","fluconazole","clarithromycin","azithromycin","ciprofloxacin","levofloxacin","amiodarone","omeprazole","clopidogrel","sertraline","fluoxetine"],
    warnings: ["Narrow therapeutic window — monitor INR regularly","Many drug interactions — always check before adding new medicine"] },

  { keywords: ["digoxin"], generic: "digoxin", isHigh: true,
    interactions: ["amiodarone","clarithromycin","azithromycin","verapamil","diltiazem","furosemide","spironolactone","itraconazole","fluconazole"],
    warnings: ["Narrow therapeutic index — monitor serum levels","Toxicity risk with electrolyte imbalance"] },

  { keywords: ["lithium"], generic: "lithium", isHigh: true,
    interactions: ["ibuprofen","diclofenac","naproxen","etoricoxib","celecoxib","meloxicam","indomethacin","metronidazole","furosemide","spironolactone","enalapril","ramipril","lisinopril","losartan","telmisartan"],
    warnings: ["Narrow therapeutic index — monitor serum lithium levels","NSAIDs can raise lithium levels dangerously"] },

  { keywords: ["methotrexate"], generic: "methotrexate", isHigh: true,
    interactions: ["ibuprofen","diclofenac","naproxen","aspirin","etoricoxib","celecoxib","cotrimoxazole","co-trimoxazole","omeprazole","pantoprazole","amoxicillin-clavulanate"],
    warnings: ["Serious toxicity risk with NSAIDs — avoid combination","Monitor CBC and LFT regularly"] },

  { keywords: ["phenytoin"], generic: "phenytoin", isHigh: true,
    interactions: ["fluconazole","itraconazole","metronidazole","omeprazole","pantoprazole","isoniazid","carbamazepine","valproate","valproic"],
    warnings: ["Narrow therapeutic index — monitor drug levels","Many interactions — review before adding any medicine"] },

  { keywords: ["carbamazepine"], generic: "carbamazepine",
    interactions: ["clarithromycin","erythromycin","fluconazole","itraconazole","verapamil","diltiazem","isoniazid","valproate","valproic","lamotrigine","sertraline","fluoxetine","paroxetine"],
    warnings: ["Induces liver enzymes — reduces efficacy of many drugs","Do not stop abruptly — risk of seizures"] },

  { keywords: ["valproate","valproic","sodium valproate"], generic: "valproate",
    interactions: ["carbamazepine","lamotrigine","phenytoin","aspirin","sertraline","fluoxetine"],
    warnings: ["Teratogenic — avoid in pregnancy","Hepatotoxicity risk — monitor LFTs"] },

  { keywords: ["amiodarone"], generic: "amiodarone", isHigh: true,
    interactions: ["digoxin","warfarin","simvastatin","atorvastatin","rosuvastatin","metoprolol","atenolol","bisoprolol","carvedilol"],
    warnings: ["Many serious interactions","Thyroid, pulmonary, and hepatic toxicity — monitor regularly"] },

  { keywords: ["clopidogrel"], generic: "clopidogrel",
    interactions: ["omeprazole","esomeprazole","aspirin","ibuprofen","diclofenac","naproxen","warfarin"],
    warnings: ["Avoid omeprazole/esomeprazole — reduces antiplatelet effect","Increased bleeding risk with NSAIDs or warfarin"] },

  { keywords: ["aspirin"], generic: "aspirin",
    interactions: ["ibuprofen","diclofenac","naproxen","etoricoxib","clopidogrel","warfarin","methotrexate","enalapril","ramipril","lisinopril","losartan","telmisartan"],
    warnings: ["Take after food","GI bleeding risk — use with PPI if on long-term therapy"] },

  { keywords: ["ibuprofen"], generic: "ibuprofen",
    interactions: ["aspirin","warfarin","lithium","methotrexate","enalapril","ramipril","lisinopril","furosemide","spironolactone","clopidogrel"],
    warnings: ["Take after food","Avoid in peptic ulcer, renal disease, heart failure","Avoid with other NSAIDs"] },

  { keywords: ["diclofenac"], generic: "diclofenac",
    interactions: ["aspirin","warfarin","lithium","methotrexate","enalapril","ramipril","lisinopril","furosemide","clopidogrel"],
    warnings: ["Take after food","Avoid in peptic ulcer, renal disease","Avoid with other NSAIDs"] },

  { keywords: ["metronidazole","ornidazole"], generic: "metronidazole",
    interactions: ["warfarin","lithium","phenytoin"],
    warnings: ["Avoid alcohol completely during course","Take after food"] },

  { keywords: ["fluconazole"], generic: "fluconazole",
    interactions: ["warfarin","phenytoin","carbamazepine","cyclosporine","tacrolimus","simvastatin","atorvastatin","rosuvastatin","glimepiride","glipizide","gliclazide"],
    warnings: ["Inhibits CYP enzymes — many interactions possible"] },

  { keywords: ["itraconazole"], generic: "itraconazole",
    interactions: ["warfarin","digoxin","simvastatin","atorvastatin","rosuvastatin","carbamazepine","amlodipine","nifedipine","felodipine","midazolam","alprazolam","diazepam"],
    warnings: ["Take after fatty meal","Strong CYP3A4 inhibitor — many interactions"] },

  { keywords: ["clarithromycin"], generic: "clarithromycin",
    interactions: ["warfarin","digoxin","carbamazepine","simvastatin","atorvastatin","rosuvastatin","midazolam","alprazolam","diazepam","colchicine"],
    warnings: ["Strong CYP3A4 inhibitor — check all concurrent medicines"] },

  { keywords: ["azithromycin"], generic: "azithromycin",
    interactions: ["warfarin","digoxin"],
    warnings: ["Take on empty stomach","Avoid antacids within 2 hrs"] },

  { keywords: ["ciprofloxacin","levofloxacin","ofloxacin","moxifloxacin","norfloxacin"], generic: "fluoroquinolone",
    interactions: ["theophylline","aminophylline","warfarin","tizanidine"],
    warnings: ["Avoid antacids, iron, calcium within 2 hrs of dose","Stay well hydrated","Can prolong QT interval"] },

  { keywords: ["theophylline","aminophylline"], generic: "theophylline", isHigh: true,
    interactions: ["ciprofloxacin","levofloxacin","clarithromycin","erythromycin","azithromycin","carbamazepine"],
    warnings: ["Narrow therapeutic index — monitor serum levels","Avoid caffeine","Many drug interactions"] },

  { keywords: ["cyclosporine","tacrolimus"], generic: "cyclosporine", isHigh: true,
    interactions: ["fluconazole","itraconazole","clarithromycin","erythromycin","amlodipine","nifedipine","felodipine","diltiazem","verapamil","simvastatin","atorvastatin","colchicine","methotrexate"],
    warnings: ["Narrow therapeutic index","Monitor levels, renal function, and BP regularly"] },

  { keywords: ["simvastatin","atorvastatin","rosuvastatin","pravastatin"], generic: "statin",
    interactions: ["clarithromycin","erythromycin","itraconazole","fluconazole","amiodarone","amlodipine","cyclosporine","tacrolimus","gemfibrozil","fenofibrate"],
    warnings: ["Report unexplained muscle pain or weakness immediately","Avoid grapefruit juice"] },

  { keywords: ["sertraline","fluoxetine","paroxetine","escitalopram","citalopram","fluvoxamine"], generic: "ssri",
    interactions: ["tramadol","metoclopramide","dextromethorphan","codeine","warfarin","lithium","carbamazepine","valproate","amitriptyline","clomipramine","sumatriptan","zolmitriptan"],
    warnings: ["Serotonin syndrome risk with other serotonergic drugs","Do not stop abruptly — taper gradually"] },

  { keywords: ["tramadol"], generic: "tramadol",
    interactions: ["sertraline","fluoxetine","paroxetine","escitalopram","citalopram","fluvoxamine","amitriptyline","sumatriptan","zolmitriptan","carbamazepine"],
    warnings: ["Serotonin syndrome risk with SSRIs/SNRIs","May cause drowsiness — avoid alcohol","Seizure risk at high doses"] },

  { keywords: ["omeprazole","pantoprazole","rabeprazole","esomeprazole","lansoprazole"], generic: "ppi",
    interactions: ["clopidogrel","methotrexate","warfarin","tacrolimus","rifampicin"],
    warnings: ["Take 30 min before meal for best effect"] },

  { keywords: ["furosemide","torsemide"], generic: "loop_diuretic",
    interactions: ["digoxin","lithium","amikacin","gentamicin","ibuprofen","diclofenac","naproxen"],
    warnings: ["Monitor electrolytes — risk of hypokalemia","Morning dose preferred","Ototoxicity risk with aminoglycosides"] },

  { keywords: ["spironolactone","eplerenone"], generic: "k_sparing_diuretic",
    interactions: ["enalapril","ramipril","lisinopril","captopril","perindopril","losartan","telmisartan","valsartan","candesartan","irbesartan","olmesartan","ibuprofen","diclofenac"],
    warnings: ["Risk of dangerous hyperkalemia with ACE inhibitors or ARBs","Monitor potassium levels regularly"] },

  { keywords: ["enalapril","ramipril","lisinopril","captopril","perindopril"], generic: "ace_inhibitor",
    interactions: ["spironolactone","eplerenone","losartan","telmisartan","valsartan","ibuprofen","diclofenac","aspirin","allopurinol"],
    warnings: ["Dry cough is a common side effect","Monitor potassium and creatinine","Risk of first-dose hypotension"] },

  { keywords: ["losartan","telmisartan","valsartan","candesartan","irbesartan","olmesartan"], generic: "arb",
    interactions: ["spironolactone","eplerenone","enalapril","ramipril","lisinopril","ibuprofen","diclofenac"],
    warnings: ["Monitor potassium and creatinine","Avoid combining with ACE inhibitors (dual blockade)"] },

  { keywords: ["metformin"], generic: "metformin",
    interactions: [],
    warnings: ["Take with food to reduce GI side effects","Hold before contrast-based procedures","Lactic acidosis risk in renal impairment"] },

  { keywords: ["glimepiride","glipizide","gliclazide","glibenclamide"], generic: "sulfonylurea",
    interactions: ["fluconazole","itraconazole","clarithromycin","aspirin","warfarin","atenolol","metoprolol","bisoprolol","propranolol"],
    warnings: ["Risk of hypoglycemia","Beta-blockers may mask hypoglycemia symptoms","Take with or just before meals"] },

  { keywords: ["insulin"], generic: "insulin",
    interactions: ["atenolol","metoprolol","bisoprolol","propranolol","carvedilol","prednisolone","dexamethasone","betamethasone","methylprednisolone"],
    warnings: ["Monitor blood glucose closely","Beta-blockers mask hypoglycemia symptoms","Corticosteroids raise blood glucose"] },

  { keywords: ["levothyroxine"], generic: "levothyroxine",
    interactions: ["calcium","iron","omeprazole","pantoprazole","rabeprazole"],
    warnings: ["Take on empty stomach 30 min before breakfast","Separate from calcium, iron, antacids by at least 4 hours"] },

  { keywords: ["prednisolone","dexamethasone","betamethasone","methylprednisolone","hydrocortisone","deflazacort"], generic: "corticosteroid",
    interactions: ["ibuprofen","diclofenac","aspirin","warfarin","insulin","metformin","glimepiride","glipizide","rifampicin"],
    warnings: ["Take with food","Do not stop abruptly if on long-term therapy","Raises blood glucose — monitor diabetic patients","Increased infection risk"] },

  { keywords: ["allopurinol","febuxostat"], generic: "uricostatic", isHigh: true,
    interactions: ["warfarin","azathioprine","ampicillin","amoxicillin","enalapril","ramipril","lisinopril"],
    warnings: ["Take after food","Stay well hydrated — 2-3L water/day","Allopurinol + azathioprine is a dangerous combination — avoid"] },

  { keywords: ["colchicine"], generic: "colchicine", isHigh: true,
    interactions: ["clarithromycin","erythromycin","azithromycin","itraconazole","fluconazole","cyclosporine","tacrolimus","simvastatin","atorvastatin"],
    warnings: ["Do not exceed prescribed dose — serious toxicity risk","Diarrhoea is early sign of toxicity"] },

  { keywords: ["amitriptyline","nortriptyline","imipramine","clomipramine"], generic: "tca",
    interactions: ["sertraline","fluoxetine","paroxetine","escitalopram","citalopram","tramadol","carbamazepine","valproate","verapamil","diltiazem"],
    warnings: ["Anticholinergic side effects (dry mouth, constipation, urinary retention)","Cardiac arrhythmia risk","Sedating — avoid driving"] },

  { keywords: ["midazolam","diazepam","lorazepam","clonazepam","alprazolam","nitrazepam","zolpidem"], generic: "benzodiazepine",
    interactions: ["tramadol","morphine","fentanyl","clarithromycin","erythromycin","itraconazole","fluconazole"],
    warnings: ["Risk of dependence with long-term use","Sedation potentiated by alcohol and opioids","Do not stop abruptly after prolonged use"] },

  { keywords: ["sildenafil","tadalafil","vardenafil"], generic: "pde5_inhibitor", isHigh: true,
    interactions: ["nitroglycerin","isosorbide"],
    warnings: ["ABSOLUTE CONTRAINDICATION with nitrates — risk of fatal hypotension","Do not use within 24 hrs of any nitrate medicine"] },

  { keywords: ["rifampicin"], generic: "rifampicin",
    interactions: ["warfarin","levothyroxine","digoxin","verapamil","diltiazem","amlodipine","metoprolol","atenolol","bisoprolol","carbamazepine","phenytoin","fluconazole","itraconazole","tacrolimus","cyclosporine","metformin"],
    warnings: ["Strong enzyme inducer — reduces efficacy of MANY drugs","Turns body fluids orange/red — warn patient"] },

  { keywords: ["isoniazid"], generic: "isoniazid",
    interactions: ["phenytoin","carbamazepine","valproate"],
    warnings: ["Take on empty stomach","Give Pyridoxine (Vit B6) to prevent neuropathy","Hepatotoxicity risk — monitor LFTs"] },
];

function getGenericInfo(medName: string) {
  const lower = medName.toLowerCase();
  return GENERIC_MAP.find(g => g.keywords.some(k => lower.includes(k)));
}

function checkInteractions(medNames: string[]): InteractionWarning[] {
  const warnings: InteractionWarning[] = [];
  const valid = medNames.filter(Boolean);
  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const infoA = getGenericInfo(valid[i]);
      const infoB = getGenericInfo(valid[j]);
      if (!infoA || !infoB) continue;
      // Check if A lists B's keywords OR B lists A's keywords
      const aHitsB = infoA.interactions.some(k => infoB.keywords.some(bk => bk.includes(k) || k.includes(bk)));
      const bHitsA = infoB.interactions.some(k => infoA.keywords.some(ak => ak.includes(k) || k.includes(ak)));
      if (aHitsB || bHitsA) {
        warnings.push({
          drug1: valid[i], drug2: valid[j],
          severity: (infoA.isHigh || infoB.isHigh) ? "high" : "moderate",
          message: `${valid[i].split(" ")[0]} + ${valid[j].split(" ")[0]}`,
        });
      }
    }
  }
  return warnings;
}

// ════════════════════════════════════════════════════════
//  ★ CLINICAL DECISION SUPPORT (CDS) ENGINE
//  1. Dose Calculator — weight/age-based dosing
//  2. Red Flag Alerts — dangerous diagnosis+medicine combos
//  3. Allergy Checker — patient allergy vs medicine cross-check
//  4. Renal/Hepatic Caution — flag medicines needing dose adjustment
//  5. Paediatric Safety — flag adult-only medicines
// ════════════════════════════════════════════════════════

// ── Dose Database ──────────────────────────────────────
// Each entry: usual adult dose, paediatric dose formula, max dose
const DOSE_DB: Array<{
  keywords: string[];
  name: string;
  adultDose: string;
  paedDose?: string;       // mg/kg/day or fixed
  paedFormula?: (wt: number, age: number) => string;
  maxDose?: string;
  renalCaution?: boolean;
  hepaticCaution?: boolean;
  adultOnly?: boolean;
  minAge?: number;         // minimum age in years
}> = [
  { keywords: ["paracetamol","acetaminophen","crocin","dolo","calpol","p-500"],
    name: "Paracetamol", adultDose: "500–1000 mg every 4–6 hrs",
    paedFormula: (wt) => `${Math.round(wt * 15)}–${Math.round(wt * 20)} mg every 4–6 hrs (15–20 mg/kg/dose)`,
    maxDose: "4000 mg/day adults · 75 mg/kg/day paeds", hepaticCaution: true },

  { keywords: ["ibuprofen","brufen","combiflam"],
    name: "Ibuprofen", adultDose: "200–400 mg every 6–8 hrs",
    paedFormula: (wt, age) => age < 6 ? "Not recommended under 6 months" : `${Math.round(wt * 5)}–${Math.round(wt * 10)} mg every 6–8 hrs (5–10 mg/kg/dose)`,
    maxDose: "2400 mg/day adults · 40 mg/kg/day paeds", renalCaution: true, hepaticCaution: true, minAge: 0.5 },

  { keywords: ["amoxicillin","amoxil","mox","novamox"],
    name: "Amoxicillin", adultDose: "250–500 mg every 8 hrs",
    paedFormula: (wt) => `${Math.round(wt * 25)}–${Math.round(wt * 45)} mg/day in 3 divided doses (25–45 mg/kg/day)`,
    maxDose: "3000 mg/day", renalCaution: true },

  { keywords: ["azithromycin","azee","zithromax","z-pack"],
    name: "Azithromycin", adultDose: "500 mg once daily × 3 days",
    paedFormula: (wt) => `${Math.round(wt * 10)} mg once daily × 3 days (10 mg/kg/day)`,
    maxDose: "500 mg/day adults · 500 mg/day paeds", hepaticCaution: true },

  { keywords: ["cetirizine","zyrtec","cetrizine"],
    name: "Cetirizine", adultDose: "10 mg once daily",
    paedFormula: (wt, age) => age < 2 ? "Not recommended under 2 years" : age < 6 ? "2.5 mg twice daily" : "5 mg twice daily or 10 mg once daily",
    maxDose: "10 mg/day", renalCaution: true },

  { keywords: ["metformin","glycomet","glucophage"],
    name: "Metformin", adultDose: "500–1000 mg twice daily with meals",
    maxDose: "2000–2550 mg/day", renalCaution: true, adultOnly: true, minAge: 10 },

  { keywords: ["amlodipine","amlip","amlong","norvasc"],
    name: "Amlodipine", adultDose: "5–10 mg once daily",
    maxDose: "10 mg/day", hepaticCaution: true, adultOnly: true },

  { keywords: ["atorvastatin","atorva","lipitor","atorlip"],
    name: "Atorvastatin", adultDose: "10–80 mg once daily at night",
    maxDose: "80 mg/day", hepaticCaution: true, adultOnly: true },

  { keywords: ["omeprazole","omez","prilosec"],
    name: "Omeprazole", adultDose: "20–40 mg once daily before food",
    paedFormula: (wt) => wt < 10 ? "5 mg once daily" : wt < 20 ? "10 mg once daily" : "20 mg once daily",
    maxDose: "40 mg/day", hepaticCaution: true },

  { keywords: ["pantoprazole","pan","pantop","protonix"],
    name: "Pantoprazole", adultDose: "40 mg once daily before food",
    maxDose: "80 mg/day", hepaticCaution: true },

  { keywords: ["ciprofloxacin","ciplox","cifran"],
    name: "Ciprofloxacin", adultDose: "250–500 mg twice daily",
    paedFormula: (wt) => `${Math.round(wt * 10)}–${Math.round(wt * 20)} mg/day in 2 divided doses`,
    maxDose: "1500 mg/day", renalCaution: true },

  { keywords: ["doxycycline","doxy","doxt"],
    name: "Doxycycline", adultDose: "100 mg twice daily day 1, then 100 mg once daily",
    maxDose: "200 mg/day", adultOnly: true, minAge: 8 },

  { keywords: ["prednisolone","wysolone","deltacortril"],
    name: "Prednisolone", adultDose: "5–60 mg/day (varies by indication)",
    paedFormula: (wt) => `${Math.round(wt * 1)}–${Math.round(wt * 2)} mg/kg/day (1–2 mg/kg/day, max 40 mg)`,
    maxDose: "Varies — taper as per protocol" },

  { keywords: ["salbutamol","ventolin","asthalin","albuterol"],
    name: "Salbutamol inhaler", adultDose: "100–200 mcg (1–2 puffs) every 4–6 hrs PRN",
    paedFormula: () => "100 mcg (1 puff) every 4–6 hrs PRN (same for children >4 yrs with spacer)",
    maxDose: "800 mcg/day" },

  { keywords: ["amoxiclav","augmentin","clavam","co-amoxiclav"],
    name: "Amoxicillin-Clavulanate", adultDose: "625 mg every 8 hrs or 1 g every 12 hrs",
    paedFormula: (wt) => `${Math.round(wt * 25)}–${Math.round(wt * 45)} mg/kg/day amoxicillin component in 2–3 divided doses`,
    maxDose: "3000 mg amoxicillin/day", renalCaution: true },

  { keywords: ["metronidazole","flagyl","metrogyl"],
    name: "Metronidazole", adultDose: "400 mg every 8 hrs",
    paedFormula: (wt) => `${Math.round(wt * 7.5)} mg every 8 hrs (7.5 mg/kg/dose)`,
    maxDose: "2400 mg/day", hepaticCaution: true },

  { keywords: ["ranitidine","rantac","zantac"],
    name: "Ranitidine", adultDose: "150 mg twice daily or 300 mg at bedtime",
    paedFormula: (wt) => `${Math.round(wt * 2)}–${Math.round(wt * 4)} mg/day in 2 divided doses`,
    maxDose: "300 mg/day", renalCaution: true },

  { keywords: ["folic acid","folate","folvite"],
    name: "Folic Acid", adultDose: "5 mg once daily (therapeutic) · 400 mcg/day (prophylactic)",
    paedFormula: () => "5 mg once daily", maxDose: "5 mg/day therapeutic" },

  { keywords: ["iron","ferrous","ferium","livogen","fersolate"],
    name: "Ferrous Sulphate / Iron", adultDose: "200 mg (65 mg elemental iron) twice daily",
    paedFormula: (wt) => `${Math.round(wt * 3)}–${Math.round(wt * 6)} mg/kg/day elemental iron in 2–3 divided doses` },

  { keywords: ["calcium","calcirol","shelcal","calcitas"],
    name: "Calcium + Vitamin D", adultDose: "500–1000 mg elemental calcium twice daily",
    paedFormula: (wt, age) => age < 1 ? "200–260 mg/day" : age < 4 ? "700 mg/day" : age < 9 ? "1000 mg/day" : "1300 mg/day" },
];

// ── Red Flag Rules ─────────────────────────────────────
const RED_FLAG_RULES: Array<{
  id: string;
  diagnosisKeywords: string[];
  medicineKeywords: string[];
  flag: string;
  severity: "danger" | "warning";
  advice: string;
}> = [
  { id: "rf1", diagnosisKeywords: ["renal","kidney","ckd","n18","creatinine high","renal failure"],
    medicineKeywords: ["metformin","glycomet"],
    flag: "Metformin contraindicated in renal impairment",
    severity: "danger", advice: "Risk of lactic acidosis. Contraindicated if eGFR <30. Consider alternative: Glipizide, DPP-4 inhibitors." },

  { id: "rf2", diagnosisKeywords: ["liver","hepatic","cirrhosis","hepatitis","jaundice","k70","k72"],
    medicineKeywords: ["paracetamol","acetaminophen","crocin","dolo"],
    flag: "Paracetamol — caution in hepatic disease",
    severity: "warning", advice: "Reduce dose to max 2g/day. Avoid in severe hepatic impairment." },

  { id: "rf3", diagnosisKeywords: ["peptic ulcer","gastric ulcer","gerd","gi bleed","k25","k26"],
    medicineKeywords: ["ibuprofen","diclofenac","naproxen","aspirin","etoricoxib","aceclofenac","mefenamic","piroxicam"],
    flag: "NSAID contraindicated in peptic ulcer / GI bleed",
    severity: "danger", advice: "NSAIDs worsen ulcers and can cause fatal GI bleeding. Use Paracetamol instead. If NSAID must be used, add PPI cover." },

  { id: "rf4", diagnosisKeywords: ["asthma","j45","wheeze","bronchospasm"],
    medicineKeywords: ["ibuprofen","aspirin","naproxen","diclofenac","aceclofenac"],
    flag: "Aspirin/NSAIDs may trigger bronchospasm in asthma",
    severity: "warning", advice: "Aspirin-exacerbated respiratory disease affects ~10% asthmatics. Use Paracetamol for pain/fever." },

  { id: "rf5", diagnosisKeywords: ["pregnancy","pregnant","antenatal","z34"],
    medicineKeywords: ["ibuprofen","diclofenac","naproxen","etoricoxib","aspirin","doxycycline","methotrexate","warfarin","atorvastatin","simvastatin","rosuvastatin"],
    flag: "Potentially teratogenic medicine in pregnancy",
    severity: "danger", advice: "This medicine is contraindicated or restricted in pregnancy. Verify safety before prescribing. Consult obstetric guidelines." },

  { id: "rf6", diagnosisKeywords: ["heart failure","cardiac failure","i50","chf"],
    medicineKeywords: ["ibuprofen","diclofenac","naproxen","etoricoxib","celecoxib","aceclofenac"],
    flag: "NSAIDs worsen heart failure",
    severity: "danger", advice: "NSAIDs cause sodium retention, fluid overload, and can precipitate acute decompensation. Avoid in heart failure." },

  { id: "rf7", diagnosisKeywords: ["hypertension","bp","i10"],
    medicineKeywords: ["pseudoephedrine","phenylephrine","decongestant","oxymetazoline"],
    flag: "Decongestants raise blood pressure",
    severity: "warning", advice: "Sympathomimetic decongestants can significantly elevate BP. Avoid in uncontrolled hypertension. Use saline nasal spray instead." },

  { id: "rf8", diagnosisKeywords: ["epilepsy","seizure","g40","g41"],
    medicineKeywords: ["ciprofloxacin","levofloxacin","moxifloxacin","metronidazole","tramadol"],
    flag: "This medicine may lower seizure threshold",
    severity: "warning", advice: "Fluoroquinolones and metronidazole can lower the seizure threshold. Use with caution and inform patient." },

  { id: "rf9", diagnosisKeywords: ["diabetes","diabetic","e11"],
    medicineKeywords: ["prednisolone","dexamethasone","betamethasone","methylprednisolone","hydrocortisone"],
    flag: "Corticosteroids cause hyperglycaemia in diabetics",
    severity: "warning", advice: "Steroids raise blood glucose significantly. Monitor glucose closely and adjust antidiabetic therapy if needed." },

  { id: "rf10", diagnosisKeywords: ["g6pd","g6pd deficiency","favism"],
    medicineKeywords: ["ciprofloxacin","nitrofurantoin","dapsone","primaquine","cotrimoxazole","rasburicase"],
    flag: "G6PD deficiency — haemolysis risk",
    severity: "danger", advice: "This medicine can trigger acute haemolytic anaemia in G6PD-deficient patients. Choose a safe alternative." },

  { id: "rf11", diagnosisKeywords: ["child","paediatric","infant","toddler","neonatal"],
    medicineKeywords: ["doxycycline","tetracycline","aspirin","codeine","tramadol"],
    flag: "This medicine is unsafe / restricted in children",
    severity: "danger", advice: "Doxycycline contraindicated <8 years (tooth staining). Aspirin avoided <16 years (Reye syndrome risk). Codeine/tramadol restricted <12 years." },

  { id: "rf12", diagnosisKeywords: ["elderly","geriatric","old age","age >65","frail"],
    medicineKeywords: ["diazepam","alprazolam","clonazepam","lorazepam","nitrazepam"],
    flag: "Benzodiazepines — fall risk in elderly",
    severity: "warning", advice: "Beers Criteria: benzodiazepines significantly increase fall and fracture risk in elderly. Consider non-pharmacological sleep hygiene or shorter-acting alternatives." },

  { id: "rf13", diagnosisKeywords: ["uti","urinary","cystitis","n30"],
    medicineKeywords: ["nitrofurantoin"],
    flag: "Nitrofurantoin — check renal function",
    severity: "warning", advice: "Nitrofurantoin ineffective and potentially toxic if eGFR <30 ml/min. Verify renal function before prescribing." },
];

// ── Allergy cross-check ────────────────────────────────
const ALLERGY_MAP: Array<{ allergen: string; cross: string[] }> = [
  { allergen: "penicillin", cross: ["amoxicillin","amoxiclav","ampicillin","piperacillin","cloxacillin","dicloxacillin","flucloxacillin","co-amoxiclav","augmentin","clavam","mox","novamox"] },
  { allergen: "sulfa", cross: ["cotrimoxazole","co-trimoxazole","trimethoprim","sulfamethoxazole","bactrim","septra"] },
  { allergen: "nsaid", cross: ["ibuprofen","diclofenac","naproxen","etoricoxib","celecoxib","aceclofenac","mefenamic","piroxicam","ketorolac","indomethacin","meloxicam","nimesulide"] },
  { allergen: "aspirin", cross: ["ibuprofen","diclofenac","naproxen","nsaid","etoricoxib","celecoxib","aceclofenac"] },
  { allergen: "quinolone", cross: ["ciprofloxacin","levofloxacin","moxifloxacin","ofloxacin","norfloxacin","gatifloxacin","ciplox","cifran"] },
  { allergen: "cephalosporin", cross: ["cefalexin","cefixime","cefuroxime","ceftriaxone","cefpodoxime","cefdinir","cefa"] },
  { allergen: "macrolide", cross: ["azithromycin","clarithromycin","erythromycin","roxithromycin","azee","zithromax"] },
  { allergen: "metronidazole", cross: ["metrogyl","flagyl","tinidazole","ornidazole","secnidazole"] },
  { allergen: "codeine", cross: ["tramadol","morphine","oxycodone","fentanyl","hydrocodone","buprenorphine"] },
];

function checkAllergyConflict(allergyText: string, medNames: string[]): Array<{ med: string; allergen: string }> {
  if (!allergyText || allergyText.toLowerCase() === "none" || allergyText.toLowerCase() === "nil") return [];
  const allergyLower = allergyText.toLowerCase();
  const conflicts: Array<{ med: string; allergen: string }> = [];
  medNames.filter(Boolean).forEach(med => {
    const medLower = med.toLowerCase();
    ALLERGY_MAP.forEach(({ allergen, cross }) => {
      if (allergyLower.includes(allergen)) {
        if (cross.some(c => medLower.includes(c)) || medLower.includes(allergen)) {
          conflicts.push({ med, allergen });
        }
      }
    });
    // Direct match
    if (allergyLower.includes(medLower.split(" ")[0])) {
      if (!conflicts.find(c => c.med === med)) conflicts.push({ med, allergen: medLower.split(" ")[0] });
    }
  });
  return conflicts;
}

function checkRedFlags(diagnosis: string, medNames: string[]): typeof RED_FLAG_RULES {
  if (!diagnosis || !medNames.filter(Boolean).length) return [];
  const diagLower = diagnosis.toLowerCase();
  const triggered: typeof RED_FLAG_RULES = [];
  RED_FLAG_RULES.forEach(rule => {
    const diagMatch = rule.diagnosisKeywords.some(kw => diagLower.includes(kw));
    const medMatch = medNames.filter(Boolean).some(med =>
      rule.medicineKeywords.some(kw => med.toLowerCase().includes(kw))
    );
    if (diagMatch && medMatch) triggered.push(rule);
  });
  return triggered;
}

function getDoseInfo(medName: string) {
  if (!medName) return null;
  const lower = medName.toLowerCase();
  return DOSE_DB.find(d => d.keywords.some(kw => lower.includes(kw))) || null;
}

// ── Dose Calculator Component ──────────────────────────
function DoseCalculator({ medName }: { medName: string }) {
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [expanded, setExpanded] = useState(false);
  const info = getDoseInfo(medName);
  if (!info) return null;
  const wt = parseFloat(weight);
  const ag = parseFloat(age);
  const isChild = ag > 0 && ag < 18;
  const calcDose = isChild && info.paedFormula && wt > 0 ? info.paedFormula(wt, ag) : null;

  return (
    <div style={{ marginTop: "6px" }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#0f4c81", fontSize: "11px", fontWeight: "700", padding: "3px 0", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}>
        🧮 {expanded ? "Hide" : "Dose Calculator"}
      </button>
      {expanded && (
        <div style={{ background: "#f0f7ff", borderRadius: "8px", padding: "10px 12px", border: "1px solid #bfdbfe", marginTop: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#0f4c81", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.8px" }}>{info.name}</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#888", marginBottom: "3px", fontWeight: "600" }}>Weight (kg)</div>
              <input type="number" placeholder="e.g. 70" value={weight} onChange={e => setWeight(e.target.value)}
                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #bfdbfe", fontSize: "12px", fontFamily: "inherit", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#888", marginBottom: "3px", fontWeight: "600" }}>Age (years)</div>
              <input type="number" placeholder="e.g. 8" value={age} onChange={e => setAge(e.target.value)}
                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #bfdbfe", fontSize: "12px", fontFamily: "inherit", boxSizing: "border-box" as const }} />
            </div>
          </div>
          {/* Result */}
          <div style={{ background: "white", borderRadius: "7px", padding: "8px 10px", border: "1px solid #e8f1fb" }}>
            {calcDose ? (
              <>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", marginBottom: "2px" }}>PAEDIATRIC DOSE</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f4c81" }}>{calcDose}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", marginBottom: "2px" }}>USUAL ADULT DOSE</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f4c81" }}>{info.adultDose}</div>
              </>
            )}
            {info.maxDose && <div style={{ fontSize: "11px", color: "#b45309", marginTop: "4px", fontWeight: "600" }}>Max: {info.maxDose}</div>}
            {info.renalCaution && <div style={{ fontSize: "10px", color: "#7c3aed", marginTop: "3px" }}>⚠ Dose adjustment needed in renal impairment</div>}
            {info.hepaticCaution && <div style={{ fontSize: "10px", color: "#b45309", marginTop: "3px" }}>⚠ Caution in hepatic impairment</div>}
            {info.adultOnly && ag > 0 && ag < (info.minAge || 18) && (
              <div style={{ fontSize: "10px", color: "#b91c1c", marginTop: "3px", fontWeight: "700" }}>🚫 Not recommended under {info.minAge || 18} years</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CDS Panel — shown above Save button ───────────────
function CDSPanel({ diagnosis, medNames, patientAllergies }: {
  diagnosis: string;
  medNames: string[];
  patientAllergies: string;
}) {
  const redFlags = checkRedFlags(diagnosis, medNames);
  const allergyConflicts = checkAllergyConflict(patientAllergies, medNames);
  if (!redFlags.length && !allergyConflicts.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Allergy conflicts — always danger */}
      {allergyConflicts.map((c, i) => (
        <div key={`allergy-${i}`} style={{ background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: "10px", padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>🚨</span>
            <div>
              <div style={{ fontWeight: "800", color: "#b91c1c", fontSize: "13px", marginBottom: "3px" }}>
                ALLERGY ALERT — {c.med}
              </div>
              <div style={{ fontSize: "12px", color: "#7f1d1d" }}>
                Patient has documented <strong>{c.allergen}</strong> allergy. <strong>{c.med}</strong> may cause a serious allergic reaction.
              </div>
              <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "4px", fontWeight: "600" }}>Remove this medicine or confirm the allergy is not applicable before proceeding.</div>
            </div>
          </div>
        </div>
      ))}
      {/* Red flag alerts */}
      {redFlags.map(rf => (
        <div key={rf.id} style={{ background: rf.severity === "danger" ? "#fef2f2" : "#fffbeb", border: `1.5px solid ${rf.severity === "danger" ? "#fca5a5" : "#fde68a"}`, borderRadius: "10px", padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>{rf.severity === "danger" ? "🚫" : "⚠️"}</span>
            <div>
              <div style={{ fontWeight: "800", color: rf.severity === "danger" ? "#b91c1c" : "#92400e", fontSize: "13px", marginBottom: "3px" }}>
                {rf.flag}
              </div>
              <div style={{ fontSize: "12px", color: rf.severity === "danger" ? "#7f1d1d" : "#78350f" }}>{rf.advice}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ★ Per-medicine warning badges — shown inside each medicine card
function MedWarningBadges({ medName }: { medName: string }) {
  const info = getGenericInfo(medName);
  if (!info || !info.warnings.length) return null;
  return (
    <div style={{ marginBottom: "8px" }}>
      {info.warnings.map((w, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: "6px",
          padding: "5px 10px", background: "#fffbeb",
          border: "1px solid #fde68a", borderRadius: "6px",
          fontSize: "12px", color: "#92400e", fontWeight: "500", marginBottom: "4px",
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span><span>{w}</span>
        </div>
      ))}
    </div>
  );
}

// ★ Drug interaction panel — shown above Save button when 2+ medicines entered
function InteractionPanel({ medNames }: { medNames: string[] }) {
  const filled = medNames.filter(Boolean);
  if (filled.length < 2) return null;
  const warnings = checkInteractions(filled);
  if (!warnings.length) return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "10px 14px", background: "#f0fdf4",
      border: "1px solid #a7f3d0", borderRadius: "8px",
      fontSize: "13px", color: "#065f46", fontWeight: "600", marginBottom: "0",
    }}>
      <span>✓</span> No known drug interactions detected between the {filled.length} medicines.
    </div>
  );
  const high = warnings.filter(w => w.severity === "high");
  const moderate = warnings.filter(w => w.severity === "moderate");
  return (
    <div style={{ borderRadius: "10px", overflow: "hidden", border: high.length ? "1px solid #fecdd3" : "1px solid #fde68a" }}>
      {high.length > 0 && <>
        <div style={{ padding: "8px 14px", background: "#dc2626", color: "#fff", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as any, letterSpacing: "0.08em" }}>
          🚨 High Severity Interaction ({high.length})
        </div>
        {high.map((w, i) => (
          <div key={i} style={{ padding: "10px 14px", background: "#fff1f2", borderBottom: "1px solid #fecdd3", fontSize: "12.5px", color: "#9f1239", fontWeight: "600", display: "flex", gap: "8px" }}>
            <span style={{ flexShrink: 0 }}>🚨</span>
            <span><strong>{w.message}</strong> — serious interaction. Consider alternative or close monitoring.</span>
          </div>
        ))}
      </>}
      {moderate.length > 0 && <>
        <div style={{ padding: "8px 14px", background: "#f59e0b", color: "#fff", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as any, letterSpacing: "0.08em" }}>
          ⚡ Moderate Caution ({moderate.length})
        </div>
        {moderate.map((w, i) => (
          <div key={i} style={{ padding: "10px 14px", background: "#fffbeb", borderBottom: i < moderate.length - 1 ? "1px solid #fde68a" : "none", fontSize: "12.5px", color: "#78350f", fontWeight: "600", display: "flex", gap: "8px" }}>
            <span style={{ flexShrink: 0 }}>⚡</span>
            <span><strong>{w.message}</strong> — monitor if concurrent use is necessary.</span>
          </div>
        ))}
      </>}
    </div>
  );
}
// ════════════════════════════════════════════════
//  END OF DRUG INTERACTION ENGINE
// ════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  MEDICINE DATABASE  (1300+ entries) — UNCHANGED
// ════════════════════════════════════════════════
const MEDICINE_DB: string[] = [
  // ── Antibiotics - Penicillins ──
  "Amoxicillin 125mg","Amoxicillin 250mg","Amoxicillin 500mg",
  "Amoxicillin 125mg Syrup","Amoxicillin 250mg Syrup",
  "Amoxicillin-Clavulanate 375mg","Amoxicillin-Clavulanate 625mg","Amoxicillin-Clavulanate 1g",
  "Amoxicillin-Clavulanate 228mg Syrup","Amoxicillin-Clavulanate 457mg Syrup",
  "Ampicillin 250mg","Ampicillin 500mg","Ampicillin 1g Injection",
  "Piperacillin-Tazobactam 2.25g Injection","Piperacillin-Tazobactam 4.5g Injection",
  "Cloxacillin 250mg","Cloxacillin 500mg",
  // ── Antibiotics - Cephalosporins ──
  "Cefixime 100mg","Cefixime 200mg","Cefixime 400mg",
  "Cefixime 50mg Syrup","Cefixime 100mg Syrup",
  "Cephalexin 250mg","Cephalexin 500mg",
  "Cefpodoxime 100mg","Cefpodoxime 200mg",
  "Cefuroxime 250mg","Cefuroxime 500mg",
  "Cefdinir 300mg","Cefdinir 125mg Syrup",
  "Ceftriaxone 250mg Injection","Ceftriaxone 500mg Injection","Ceftriaxone 1g Injection","Ceftriaxone 2g Injection",
  "Cefoperazone 1g Injection","Cefoperazone-Sulbactam 1.5g Injection",
  "Cefazolin 1g Injection","Cefotaxime 1g Injection","Cefotaxime 500mg Injection",
  "Ceftazidime 1g Injection","Ceftazidime 2g Injection",
  "Cefepime 1g Injection","Cefepime 2g Injection",
  // ── Antibiotics - Macrolides ──
  "Azithromycin 250mg","Azithromycin 500mg",
  "Azithromycin 100mg Syrup","Azithromycin 200mg Syrup",
  "Clarithromycin 250mg","Clarithromycin 500mg",
  "Erythromycin 250mg","Erythromycin 500mg",
  "Erythromycin 125mg Syrup","Erythromycin 250mg Syrup",
  // ── Antibiotics - Fluoroquinolones ──
  "Ciprofloxacin 250mg","Ciprofloxacin 500mg","Ciprofloxacin 750mg",
  "Ciprofloxacin 200mg Injection","Ciprofloxacin 400mg Injection",
  "Levofloxacin 250mg","Levofloxacin 500mg","Levofloxacin 750mg",
  "Levofloxacin 500mg Injection",
  "Ofloxacin 200mg","Ofloxacin 400mg",
  "Moxifloxacin 400mg","Moxifloxacin 400mg Injection",
  "Norfloxacin 400mg",
  // ── Antibiotics - Nitroimidazoles ──
  "Metronidazole 200mg","Metronidazole 400mg","Metronidazole 500mg",
  "Metronidazole 200mg Syrup","Metronidazole 500mg Injection",
  "Tinidazole 500mg","Ornidazole 500mg","Secnidazole 1g",
  // ── Antibiotics - Tetracyclines ──
  "Doxycycline 100mg","Doxycycline 200mg",
  "Tetracycline 250mg","Tetracycline 500mg","Minocycline 100mg",
  // ── Antibiotics - Sulfonamides ──
  "Co-trimoxazole 480mg","Co-trimoxazole 960mg","Co-trimoxazole 240mg Syrup",
  // ── Antibiotics - Others ──
  "Clindamycin 150mg","Clindamycin 300mg","Clindamycin 600mg Injection",
  "Nitrofurantoin 50mg","Nitrofurantoin 100mg",
  "Linezolid 600mg","Linezolid 600mg Injection",
  "Vancomycin 500mg Injection","Vancomycin 1g Injection",
  "Meropenem 500mg Injection","Meropenem 1g Injection",
  "Imipenem-Cilastatin 500mg Injection",
  "Gentamicin 80mg Injection","Amikacin 250mg Injection","Amikacin 500mg Injection",
  "Colistin 150mg Injection",
  "Chloramphenicol 250mg","Chloramphenicol 500mg",
  "Rifampicin 150mg","Rifampicin 300mg","Rifampicin 450mg","Rifampicin 600mg",
  "Isoniazid 100mg","Isoniazid 300mg",
  "Pyrazinamide 500mg","Pyrazinamide 750mg",
  "Ethambutol 200mg","Ethambutol 400mg","Ethambutol 800mg",
  "Streptomycin 1g Injection",
  // ── Antifungals ──
  "Fluconazole 50mg","Fluconazole 100mg","Fluconazole 150mg","Fluconazole 200mg",
  "Fluconazole 50mg Syrup",
  "Itraconazole 100mg","Itraconazole 200mg",
  "Ketoconazole 200mg","Terbinafine 250mg",
  "Voriconazole 200mg","Voriconazole 200mg Injection",
  "Amphotericin B Injection","Amphotericin B Liposomal Injection",
  "Clotrimazole Cream","Clotrimazole Dusting Powder","Clotrimazole 100mg Vaginal Tablet",
  "Miconazole Cream","Miconazole Gel","Miconazole Powder",
  "Ketoconazole Cream","Ketoconazole Shampoo 2%",
  "Nystatin Oral Drops","Nystatin Dusting Powder","Nystatin 100000 IU/ml Oral Drops",
  "Griseofulvin 125mg","Griseofulvin 250mg","Griseofulvin 500mg",
  // ── Antivirals ──
  "Acyclovir 200mg","Acyclovir 400mg","Acyclovir 800mg",
  "Acyclovir Cream","Acyclovir 250mg Injection","Acyclovir 3% Eye Ointment",
  "Valacyclovir 500mg","Valacyclovir 1000mg",
  "Oseltamivir 30mg","Oseltamivir 45mg","Oseltamivir 75mg","Oseltamivir 12mg Syrup",
  "Favipiravir 200mg","Favipiravir 400mg",
  "Remdesivir 100mg Injection","Ribavirin 200mg",
  "Tenofovir 300mg","Lamivudine 150mg","Lamivudine 300mg",
  "Efavirenz 600mg","Zidovudine 300mg",
  // ── Antiparasitic / Antimalarial ──
  "Chloroquine 250mg","Chloroquine 500mg",
  "Hydroxychloroquine 200mg","Hydroxychloroquine 400mg",
  "Artemether-Lumefantrine 20/120mg",
  "Artesunate 50mg Injection","Artesunate 60mg Injection",
  "Quinine 300mg","Quinine 600mg Injection",
  "Primaquine 7.5mg","Primaquine 15mg",
  "Albendazole 200mg","Albendazole 400mg","Albendazole 200mg Suspension",
  "Mebendazole 100mg","Mebendazole 500mg","Mebendazole 100mg Syrup",
  "Ivermectin 3mg","Ivermectin 6mg","Ivermectin 12mg","Ivermectin 1% Cream",
  "Praziquantel 150mg","Praziquantel 600mg",
  "Diethylcarbamazine 50mg","Diethylcarbamazine 100mg",
  "Pyrantel Pamoate 250mg","Pyrantel 250mg Syrup",
  // ── Pain / Fever / NSAIDs ──
  "Paracetamol 125mg","Paracetamol 250mg","Paracetamol 500mg","Paracetamol 650mg","Paracetamol 1000mg",
  "Paracetamol 120mg/5ml Syrup","Paracetamol 250mg/5ml Syrup",
  "Paracetamol 150mg Suppository","Paracetamol 300mg Injection","Paracetamol 1g Injection",
  "Ibuprofen 100mg","Ibuprofen 200mg","Ibuprofen 400mg","Ibuprofen 600mg","Ibuprofen 800mg",
  "Ibuprofen 100mg/5ml Syrup","Ibuprofen 200mg/5ml Syrup",
  "Diclofenac 25mg","Diclofenac 50mg","Diclofenac 75mg","Diclofenac 100mg SR",
  "Diclofenac 25mg Injection","Diclofenac 75mg Injection",
  "Diclofenac Gel","Diclofenac Emulgel",
  "Naproxen 250mg","Naproxen 500mg",
  "Aspirin 75mg","Aspirin 150mg","Aspirin 325mg","Aspirin 650mg",
  "Mefenamic Acid 250mg","Mefenamic Acid 500mg","Mefenamic Acid 100mg Syrup",
  "Tramadol 50mg","Tramadol 100mg",
  "Tramadol 50mg Injection","Tramadol 100mg Injection",
  "Ketorolac 10mg","Ketorolac 30mg Injection",
  "Piroxicam 10mg","Piroxicam 20mg","Piroxicam Gel",
  "Aceclofenac 100mg","Aceclofenac+Paracetamol 100/325mg",
  "Etoricoxib 60mg","Etoricoxib 90mg","Etoricoxib 120mg",
  "Celecoxib 100mg","Celecoxib 200mg",
  "Meloxicam 7.5mg","Meloxicam 15mg",
  "Indomethacin 25mg","Indomethacin 50mg","Indomethacin 75mg SR",
  "Morphine 10mg Injection","Morphine 15mg Injection",
  "Morphine 10mg SR","Morphine 30mg SR","Morphine 60mg SR",
  "Pentazocine 30mg Injection","Buprenorphine 0.3mg Injection",
  "Fentanyl 50mcg Injection","Fentanyl Patch 25mcg/hr","Fentanyl Patch 50mcg/hr",
  "Oxycodone 5mg","Oxycodone 10mg SR",
  // ── Antacids / GI ──
  "Omeprazole 10mg","Omeprazole 20mg","Omeprazole 40mg",
  "Omeprazole 20mg Injection","Omeprazole 40mg Injection",
  "Pantoprazole 20mg","Pantoprazole 40mg","Pantoprazole 40mg Injection",
  "Rabeprazole 10mg","Rabeprazole 20mg",
  "Esomeprazole 20mg","Esomeprazole 40mg",
  "Lansoprazole 15mg","Lansoprazole 30mg",
  "Ranitidine 150mg","Ranitidine 300mg","Ranitidine 50mg Injection",
  "Famotidine 20mg","Famotidine 40mg",
  "Domperidone 10mg","Domperidone 30mg SR",
  "Domperidone 5mg/5ml Syrup","Domperidone 1mg/ml Drops",
  "Metoclopramide 10mg","Metoclopramide 10mg Injection",
  "Ondansetron 4mg","Ondansetron 8mg",
  "Ondansetron 2mg/5ml Syrup","Ondansetron 4mg Injection","Ondansetron 8mg Injection",
  "Granisetron 1mg","Granisetron 3mg Injection",
  "Sucralfate 500mg","Sucralfate 1g","Sucralfate Suspension",
  "Antacid Suspension","Aluminium Hydroxide+Magnesium Hydroxide Suspension",
  "Loperamide 2mg",
  "Lactulose 10g Syrup","Bisacodyl 5mg","Bisacodyl 10mg Suppository",
  "Senna 7.5mg","Ispaghula Husk Powder","Glycerin Suppository",
  "ORS Sachets","Simethicone 40mg","Simethicone 80mg",
  "Dicyclomine 10mg","Dicyclomine 20mg","Dicyclomine 10mg Injection",
  "Hyoscine Butylbromide 10mg","Hyoscine Butylbromide 20mg Injection",
  "Drotaverine 40mg","Drotaverine 80mg","Drotaverine 40mg Injection",
  "Rifaximin 200mg","Rifaximin 400mg","Rifaximin 550mg",
  "Ursodeoxycholic Acid 150mg","Ursodeoxycholic Acid 300mg",
  "Pancreatin Enzyme Tablet","Pancreatic Enzyme Capsule",
  "Mesalamine 400mg","Mesalamine 800mg","Mesalamine 1g Suppository",
  "Sulfasalazine 500mg",
  "Cholestyramine 4g Powder",
  // ── Antihistamines / Allergy ──
  "Cetirizine 5mg","Cetirizine 10mg","Cetirizine 5mg/5ml Syrup",
  "Loratadine 10mg","Loratadine 5mg/5ml Syrup",
  "Fexofenadine 120mg","Fexofenadine 180mg",
  "Levocetirizine 2.5mg","Levocetirizine 5mg","Levocetirizine 2.5mg/5ml Syrup",
  "Desloratadine 5mg","Desloratadine 2.5mg/5ml Syrup",
  "Bilastine 20mg","Rupatadine 10mg",
  "Chlorpheniramine 2mg","Chlorpheniramine 4mg","Chlorpheniramine 2mg/5ml Syrup",
  "Hydroxyzine 10mg","Hydroxyzine 25mg","Hydroxyzine 50mg",
  "Diphenhydramine 25mg","Diphenhydramine Syrup",
  "Montelukast 4mg","Montelukast 5mg","Montelukast 10mg","Montelukast 4mg Granules",
  "Montelukast+Levocetirizine Tablet",
  "Pheniramine Maleate 22.75mg Injection",
  "Adrenaline 1mg Injection",
  "Hydrocortisone 100mg Injection","Hydrocortisone 200mg Injection",
  // ── Cold / Cough / Respiratory ──
  "Ambroxol 30mg","Ambroxol 75mg SR",
  "Ambroxol 15mg/5ml Syrup","Ambroxol 30mg/5ml Syrup",
  "Bromhexine 4mg","Bromhexine 8mg","Bromhexine 4mg/5ml Syrup",
  "Guaifenesin 100mg/5ml Syrup","Guaifenesin 200mg",
  "Dextromethorphan 10mg","Dextromethorphan 15mg",
  "Dextromethorphan 5mg/5ml Syrup","Dextromethorphan 10mg/5ml Syrup",
  "Codeine 10mg/5ml Syrup","Codeine Phosphate 15mg",
  "Salbutamol 2mg","Salbutamol 4mg","Salbutamol 2mg/5ml Syrup",
  "Salbutamol Inhaler 100mcg","Salbutamol Respules 2.5mg","Salbutamol 500mcg Injection",
  "Levosalbutamol Inhaler 50mcg","Levosalbutamol Respules",
  "Levosalbutamol+Ipratropium Respules",
  "Ipratropium Inhaler 20mcg","Ipratropium Respules 0.5mg",
  "Theophylline 100mg","Theophylline 200mg","Theophylline 300mg SR",
  "Theophylline 50mg/5ml Syrup","Aminophylline 250mg Injection",
  "Budesonide Inhaler 100mcg","Budesonide Inhaler 200mcg",
  "Budesonide Respules 0.5mg","Budesonide Respules 1mg",
  "Beclomethasone Inhaler 50mcg","Beclomethasone Inhaler 100mcg",
  "Fluticasone Inhaler 50mcg","Fluticasone Inhaler 125mcg","Fluticasone Inhaler 250mcg",
  "Formoterol Inhaler 6mcg","Formoterol 12mcg Inhaler",
  "Salmeterol+Fluticasone Inhaler 25/125mcg","Salmeterol+Fluticasone Inhaler 50/250mcg",
  "Tiotropium Inhaler 18mcg","Tiotropium Capsule 18mcg",
  "Terbutaline 2.5mg","Terbutaline 5mg","Terbutaline 0.5mg Injection",
  "N-Acetylcysteine 200mg","N-Acetylcysteine 600mg","N-Acetylcysteine 200mg Sachet",
  "Carbocisteine 375mg/5ml Syrup","Erdosteine 300mg",
  "Xylometazoline 0.05% Nasal Drops","Xylometazoline 0.1% Nasal Drops",
  "Oxymetazoline 0.05% Nasal Spray","Saline Nasal Spray","Normal Saline Nasal Drops",
  "Fluticasone Nasal Spray","Mometasone Nasal Spray","Budesonide Nasal Spray",
  // ── Vitamins / Minerals / Supplements ──
  "Vitamin A 50000 IU","Vitamin A 100000 IU Injection",
  "Vitamin B1 (Thiamine) 100mg","Thiamine 100mg Injection",
  "Vitamin B6 (Pyridoxine) 10mg","Pyridoxine 40mg Injection",
  "Vitamin B12 250mcg","Vitamin B12 500mcg","Vitamin B12 1500mcg",
  "Vitamin B12 500mcg Injection","Vitamin B12 1000mcg Injection",
  "Vitamin C 250mg","Vitamin C 500mg","Vitamin C 1000mg","Vitamin C 100mg/5ml Syrup",
  "Vitamin D2 60000 IU Capsule","Vitamin D3 400 IU Drops","Vitamin D3 800 IU Drops",
  "Vitamin D3 1000 IU","Vitamin D3 2000 IU","Vitamin D3 60000 IU",
  "Vitamin D3 600000 IU Injection",
  "Vitamin E 200mg","Vitamin E 400mg","Vitamin K1 10mg Injection",
  "Folic Acid 0.5mg","Folic Acid 1mg","Folic Acid 5mg","Folic Acid Syrup",
  "Folic Acid 1.5mg Injection",
  "B-Complex Tablet","B-Complex Syrup","B-Complex Injection",
  "Multivitamin Tablet","Multivitamin Syrup","Multivitamin + Minerals Tablet",
  "Iron 100mg (Ferrous Sulphate)","Iron 150mg (Ferrous Ascorbate)",
  "Iron 30mg/5ml Syrup","Iron 50mg/5ml Syrup","Iron Drops 25mg/ml",
  "Iron + Folic Acid Tablet","Iron Sucrose 100mg Injection",
  "Iron Dextran 100mg Injection",
  "Calcium 500mg","Calcium 1000mg",
  "Calcium + D3 500mg+250 IU","Calcium + D3 1000mg+500 IU",
  "Calcium Gluconate 1g Injection","Calcium Gluconate Syrup",
  "Calcium Acetate 667mg",
  "Zinc 10mg","Zinc 20mg","Zinc 50mg",
  "Zinc 10mg/5ml Syrup","Zinc 20mg Dispersible Tablet",
  "Magnesium 250mg","Magnesium Hydroxide Syrup","Magnesium Sulfate 50% Injection",
  "Potassium Chloride 600mg","Potassium Chloride Injection",
  "Sodium Bicarbonate 500mg","Sodium Bicarbonate Injection",
  "Omega-3 Fatty Acids 1000mg","Fish Oil 1000mg",
  "Biotin 5mg","Biotin 10mg","Coenzyme Q10 100mg","Lycopene 10mg",
  "Mecobalamin 500mcg","Mecobalamin 1500mcg",
  "Alpha Lipoic Acid 100mg","Alpha Lipoic Acid 300mg",
  // ── Diabetes ──
  "Metformin 500mg","Metformin 850mg","Metformin 1000mg",
  "Metformin 500mg SR","Metformin 1000mg SR",
  "Glibenclamide 2.5mg","Glibenclamide 5mg",
  "Glipizide 2.5mg","Glipizide 5mg","Glipizide 10mg",
  "Glimepiride 1mg","Glimepiride 2mg","Glimepiride 3mg","Glimepiride 4mg",
  "Glimepiride+Metformin 1/500mg","Glimepiride+Metformin 2/500mg",
  "Gliclazide 40mg","Gliclazide 80mg","Gliclazide 60mg MR",
  "Pioglitazone 15mg","Pioglitazone 30mg","Pioglitazone 45mg",
  "Sitagliptin 25mg","Sitagliptin 50mg","Sitagliptin 100mg",
  "Sitagliptin+Metformin 50/500mg","Sitagliptin+Metformin 50/1000mg",
  "Vildagliptin 50mg","Vildagliptin+Metformin 50/500mg",
  "Saxagliptin 2.5mg","Saxagliptin 5mg",
  "Teneligliptin 20mg","Trelagliptin 100mg",
  "Dapagliflozin 5mg","Dapagliflozin 10mg",
  "Empagliflozin 10mg","Empagliflozin 25mg",
  "Canagliflozin 100mg","Canagliflozin 300mg",
  "Liraglutide 6mg Injection","Dulaglutide 0.75mg Injection","Dulaglutide 1.5mg Injection",
  "Semaglutide 0.5mg Injection","Semaglutide 1mg Injection",
  "Exenatide 5mcg Injection","Exenatide 10mcg Injection",
  "Insulin Regular 40 IU/ml Injection","Insulin Regular 100 IU/ml Injection",
  "Insulin NPH 40 IU/ml Injection","Insulin NPH 100 IU/ml Injection",
  "Insulin Glargine 100 IU/ml Injection","Insulin Glargine 300 IU/ml Injection",
  "Insulin Detemir 100 IU/ml Injection","Insulin Degludec 100 IU/ml Injection",
  "Insulin Aspart 100 IU/ml Injection","Insulin Lispro 100 IU/ml Injection",
  "Insulin Glulisine 100 IU/ml Injection",
  "Premix Insulin 30/70 Injection","Premix Insulin 50/50 Injection",
  "Acarbose 25mg","Acarbose 50mg","Acarbose 100mg",
  "Voglibose 0.2mg","Voglibose 0.3mg",
  // ── Blood Pressure / Cardiac ──
  "Amlodipine 2.5mg","Amlodipine 5mg","Amlodipine 10mg",
  "Nifedipine 5mg","Nifedipine 10mg","Nifedipine 20mg SR","Nifedipine 30mg SR",
  "Felodipine 2.5mg","Felodipine 5mg","Felodipine 10mg",
  "Diltiazem 30mg","Diltiazem 60mg","Diltiazem 90mg SR","Diltiazem 120mg SR","Diltiazem 25mg Injection",
  "Verapamil 40mg","Verapamil 80mg","Verapamil 120mg SR",
  "Atenolol 25mg","Atenolol 50mg","Atenolol 100mg",
  "Metoprolol 25mg","Metoprolol 50mg","Metoprolol 100mg",
  "Metoprolol 25mg XL","Metoprolol 50mg XL","Metoprolol 5mg Injection",
  "Bisoprolol 1.25mg","Bisoprolol 2.5mg","Bisoprolol 5mg","Bisoprolol 10mg",
  "Carvedilol 3.125mg","Carvedilol 6.25mg","Carvedilol 12.5mg","Carvedilol 25mg",
  "Propranolol 10mg","Propranolol 20mg","Propranolol 40mg","Propranolol 80mg",
  "Nebivolol 2.5mg","Nebivolol 5mg",
  "Enalapril 2.5mg","Enalapril 5mg","Enalapril 10mg","Enalapril 20mg",
  "Ramipril 1.25mg","Ramipril 2.5mg","Ramipril 5mg","Ramipril 10mg",
  "Lisinopril 2.5mg","Lisinopril 5mg","Lisinopril 10mg","Lisinopril 20mg",
  "Perindopril 2mg","Perindopril 4mg","Perindopril 8mg",
  "Captopril 12.5mg","Captopril 25mg","Captopril 50mg",
  "Losartan 25mg","Losartan 50mg","Losartan 100mg",
  "Telmisartan 20mg","Telmisartan 40mg","Telmisartan 80mg",
  "Valsartan 40mg","Valsartan 80mg","Valsartan 160mg","Valsartan 320mg",
  "Olmesartan 10mg","Olmesartan 20mg","Olmesartan 40mg",
  "Irbesartan 75mg","Irbesartan 150mg","Irbesartan 300mg",
  "Candesartan 4mg","Candesartan 8mg","Candesartan 16mg","Candesartan 32mg",
  "Hydrochlorothiazide 12.5mg","Hydrochlorothiazide 25mg",
  "Chlorthalidone 12.5mg","Chlorthalidone 25mg",
  "Furosemide 20mg","Furosemide 40mg","Furosemide 80mg",
  "Furosemide 10mg Injection","Furosemide 20mg Injection","Furosemide 40mg Injection",
  "Torsemide 5mg","Torsemide 10mg","Torsemide 20mg",
  "Spironolactone 25mg","Spironolactone 50mg","Spironolactone 100mg",
  "Eplerenone 25mg","Eplerenone 50mg",
  "Indapamide 1.5mg SR","Indapamide 2.5mg",
  "Atorvastatin 5mg","Atorvastatin 10mg","Atorvastatin 20mg","Atorvastatin 40mg","Atorvastatin 80mg",
  "Rosuvastatin 5mg","Rosuvastatin 10mg","Rosuvastatin 20mg","Rosuvastatin 40mg",
  "Simvastatin 10mg","Simvastatin 20mg","Simvastatin 40mg",
  "Pravastatin 10mg","Pravastatin 20mg","Pravastatin 40mg",
  "Fenofibrate 67mg","Fenofibrate 145mg","Fenofibrate 160mg",
  "Gemfibrozil 300mg","Gemfibrozil 600mg",
  "Ezetimibe 10mg","Ezetimibe+Atorvastatin 10/10mg","Ezetimibe+Rosuvastatin 10/10mg",
  "Digoxin 0.0625mg","Digoxin 0.125mg","Digoxin 0.25mg","Digoxin 0.25mg Injection",
  "Amiodarone 100mg","Amiodarone 200mg","Amiodarone 150mg Injection",
  "Adenosine 6mg Injection",
  "Nitroglycerin 0.5mg Sublingual","Nitroglycerin 2.6mg SR","Nitroglycerin 6.4mg SR",
  "Nitroglycerin Patch 5mg","Nitroglycerin Injection",
  "Isosorbide Mononitrate 10mg","Isosorbide Mononitrate 20mg","Isosorbide Mononitrate 60mg SR",
  "Isosorbide Dinitrate 5mg","Isosorbide Dinitrate 10mg",
  "Ivabradine 5mg","Ivabradine 7.5mg",
  "Sacubitril+Valsartan 50mg","Sacubitril+Valsartan 100mg","Sacubitril+Valsartan 200mg",
  "Ranolazine 500mg SR","Ranolazine 1000mg SR",
  "Trimetazidine 20mg","Trimetazidine 35mg MR",
  "Clopidogrel 75mg","Clopidogrel 150mg",
  "Ticagrelor 60mg","Ticagrelor 90mg",
  "Prasugrel 5mg","Prasugrel 10mg",
  "Warfarin 1mg","Warfarin 2mg","Warfarin 5mg",
  "Dabigatran 75mg","Dabigatran 110mg","Dabigatran 150mg",
  "Rivaroxaban 10mg","Rivaroxaban 15mg","Rivaroxaban 20mg",
  "Apixaban 2.5mg","Apixaban 5mg",
  "Heparin 5000 IU Injection","Heparin 25000 IU Injection",
  "Enoxaparin 20mg Injection","Enoxaparin 40mg Injection","Enoxaparin 60mg Injection","Enoxaparin 80mg Injection",
  "Streptokinase 1500000 IU Injection","Alteplase Injection",
  "Dopamine 200mg Injection","Dopamine 40mg Injection",
  "Dobutamine 250mg Injection",
  "Noradrenaline 2mg Injection","Noradrenaline 4mg Injection",
  "Vasopressin 20 IU Injection",
  "Atropine 0.6mg Injection","Atropine 1mg Injection",
  // ── Thyroid ──
  "Levothyroxine 12.5mcg","Levothyroxine 25mcg","Levothyroxine 50mcg",
  "Levothyroxine 75mcg","Levothyroxine 100mcg","Levothyroxine 125mcg","Levothyroxine 150mcg",
  "Carbimazole 5mg","Carbimazole 10mg","Carbimazole 20mg",
  "Propylthiouracil 50mg","Propylthiouracil 100mg","Lugol Iodine Solution",
  // ── Steroids / Corticosteroids ──
  "Prednisolone 1mg","Prednisolone 5mg","Prednisolone 10mg","Prednisolone 20mg","Prednisolone 40mg",
  "Prednisolone 5mg/5ml Syrup",
  "Dexamethasone 0.5mg","Dexamethasone 2mg","Dexamethasone 4mg","Dexamethasone 8mg",
  "Dexamethasone 4mg Injection","Dexamethasone 8mg Injection",
  "Betamethasone 0.5mg","Betamethasone 1mg",
  "Betamethasone 4mg Injection","Betamethasone 12mg Injection",
  "Methylprednisolone 4mg","Methylprednisolone 8mg","Methylprednisolone 16mg","Methylprednisolone 32mg",
  "Methylprednisolone 40mg Injection","Methylprednisolone 125mg Injection","Methylprednisolone 500mg Injection",
  "Hydrocortisone 10mg","Hydrocortisone 20mg","Hydrocortisone Cream 1%","Hydrocortisone Ointment 1%",
  "Triamcinolone 4mg","Triamcinolone 40mg Injection",
  "Budesonide 3mg Capsule","Fludrocortisone 0.1mg",
  "Deflazacort 6mg","Deflazacort 30mg",
  // ── Neurology / Psychiatry ──
  "Phenobarbitone 30mg","Phenobarbitone 60mg",
  "Phenytoin 50mg","Phenytoin 100mg","Phenytoin 50mg Injection",
  "Carbamazepine 100mg","Carbamazepine 200mg","Carbamazepine 400mg",
  "Valproic Acid 200mg","Valproate 500mg CR","Sodium Valproate Syrup",
  "Lamotrigine 25mg","Lamotrigine 50mg","Lamotrigine 100mg","Lamotrigine 200mg",
  "Levetiracetam 250mg","Levetiracetam 500mg","Levetiracetam 1000mg","Levetiracetam 500mg Injection",
  "Oxcarbazepine 150mg","Oxcarbazepine 300mg","Oxcarbazepine 600mg",
  "Gabapentin 100mg","Gabapentin 300mg","Gabapentin 400mg","Gabapentin 800mg",
  "Pregabalin 25mg","Pregabalin 50mg","Pregabalin 75mg","Pregabalin 150mg","Pregabalin 300mg",
  "Topiramate 25mg","Topiramate 50mg","Topiramate 100mg",
  "Clonazepam 0.25mg","Clonazepam 0.5mg","Clonazepam 1mg","Clonazepam 2mg",
  "Diazepam 2mg","Diazepam 5mg","Diazepam 10mg",
  "Diazepam 5mg Injection","Diazepam 10mg Injection",
  "Lorazepam 1mg","Lorazepam 2mg","Lorazepam 2mg Injection","Lorazepam 4mg Injection",
  "Midazolam 1mg Injection","Midazolam 5mg Injection",
  "Alprazolam 0.25mg","Alprazolam 0.5mg","Alprazolam 1mg",
  "Nitrazepam 5mg","Nitrazepam 10mg",
  "Zolpidem 5mg","Zolpidem 10mg","Melatonin 3mg","Melatonin 5mg","Melatonin 10mg",
  "Amitriptyline 10mg","Amitriptyline 25mg","Amitriptyline 50mg","Amitriptyline 75mg",
  "Nortriptyline 10mg","Nortriptyline 25mg",
  "Imipramine 10mg","Imipramine 25mg","Imipramine 75mg",
  "Fluoxetine 10mg","Fluoxetine 20mg","Fluoxetine 40mg",
  "Sertraline 25mg","Sertraline 50mg","Sertraline 100mg",
  "Escitalopram 5mg","Escitalopram 10mg","Escitalopram 20mg",
  "Paroxetine 10mg","Paroxetine 20mg","Paroxetine 25mg CR",
  "Citalopram 10mg","Citalopram 20mg","Fluvoxamine 50mg","Fluvoxamine 100mg",
  "Venlafaxine 37.5mg","Venlafaxine 75mg","Venlafaxine 150mg XR",
  "Duloxetine 20mg","Duloxetine 30mg","Duloxetine 60mg",
  "Mirtazapine 7.5mg","Mirtazapine 15mg","Mirtazapine 30mg",
  "Bupropion 150mg SR","Bupropion 300mg XL",
  "Chlorpromazine 25mg","Chlorpromazine 50mg","Chlorpromazine 100mg","Chlorpromazine 25mg Injection",
  "Haloperidol 0.5mg","Haloperidol 1mg","Haloperidol 2mg","Haloperidol 5mg","Haloperidol 5mg Injection",
  "Olanzapine 2.5mg","Olanzapine 5mg","Olanzapine 10mg","Olanzapine 15mg","Olanzapine 10mg Injection",
  "Risperidone 0.5mg","Risperidone 1mg","Risperidone 2mg","Risperidone 4mg",
  "Quetiapine 25mg","Quetiapine 50mg","Quetiapine 100mg","Quetiapine 200mg","Quetiapine 300mg XR",
  "Aripiprazole 5mg","Aripiprazole 10mg","Aripiprazole 15mg","Aripiprazole 20mg",
  "Clozapine 25mg","Clozapine 100mg",
  "Lithium 300mg","Lithium 450mg CR",
  "Trihexyphenidyl 2mg","Trihexyphenidyl 5mg",
  "Levodopa+Carbidopa 100/25mg","Levodopa+Carbidopa 250/25mg",
  "Pramipexole 0.125mg","Pramipexole 0.25mg","Pramipexole 0.5mg","Pramipexole 1mg",
  "Ropinirole 0.25mg","Ropinirole 0.5mg","Ropinirole 1mg","Ropinirole 2mg",
  "Rasagiline 0.5mg","Rasagiline 1mg","Selegiline 5mg","Selegiline 10mg",
  "Donepezil 5mg","Donepezil 10mg",
  "Rivastigmine 1.5mg","Rivastigmine 3mg","Rivastigmine 4.5mg","Rivastigmine 6mg",
  "Memantine 5mg","Memantine 10mg",
  "Baclofen 10mg","Baclofen 25mg","Tizanidine 2mg","Tizanidine 4mg",
  "Eperisone 50mg","Thiocolchicoside 4mg","Thiocolchicoside 8mg",
  "Cyclobenzaprine 5mg","Cyclobenzaprine 10mg",
  "Sumatriptan 50mg","Sumatriptan 100mg",
  "Zolmitriptan 2.5mg","Zolmitriptan 5mg","Ergotamine+Caffeine Tablet",
  // ── Urology / Prostate ──
  "Tamsulosin 0.2mg","Tamsulosin 0.4mg",
  "Silodosin 4mg","Silodosin 8mg",
  "Alfuzosin 5mg XR","Alfuzosin 10mg XR",
  "Prazosin 1mg","Prazosin 2mg","Prazosin 5mg",
  "Doxazosin 1mg","Doxazosin 2mg","Doxazosin 4mg",
  "Finasteride 1mg","Finasteride 5mg","Dutasteride 0.5mg",
  "Dutasteride+Tamsulosin 0.5/0.4mg",
  "Phenazopyridine 100mg","Phenazopyridine 200mg",
  "Oxybutynin 2.5mg","Oxybutynin 5mg",
  "Solifenacin 5mg","Solifenacin 10mg",
  "Tolterodine 1mg","Tolterodine 2mg","Tolterodine 4mg LA",
  "Mirabegron 25mg","Mirabegron 50mg",
  "Sildenafil 25mg","Sildenafil 50mg","Sildenafil 100mg",
  "Tadalafil 5mg","Tadalafil 10mg","Tadalafil 20mg",
  "Vardenafil 10mg","Vardenafil 20mg",
  // ── Orthopaedic / Bone / Gout ──
  "Alendronate 35mg","Alendronate 70mg",
  "Risedronate 5mg","Risedronate 35mg","Risedronate 150mg",
  "Zoledronic Acid 4mg Injection","Zoledronic Acid 5mg Injection",
  "Calcitonin 50 IU Injection","Calcitonin Nasal Spray",
  "Teriparatide 20mcg Injection",
  "Glucosamine 750mg","Glucosamine 1500mg","Diacerein 50mg",
  "Glucosamine+Diacerein Tablet","Chondroitin 400mg","Glucosamine+Chondroitin Tablet",
  "Colchicine 0.5mg","Colchicine 1mg",
  "Allopurinol 100mg","Allopurinol 300mg",
  "Febuxostat 40mg","Febuxostat 80mg","Febuxostat 120mg",
  "Benzbromarone 50mg","Probenecid 500mg",
  // ── Skin / Dermatology ──
  "Betamethasone 0.05% Cream","Betamethasone 0.1% Cream","Betamethasone Valerate Lotion",
  "Clobetasol 0.05% Cream","Clobetasol 0.05% Ointment",
  "Mometasone 0.1% Cream","Mometasone 0.1% Ointment","Mometasone 0.1% Lotion",
  "Triamcinolone 0.1% Cream","Desonide 0.05% Cream","Fluocinolone 0.025% Cream",
  "Mupirocin 2% Ointment","Fusidic Acid 2% Cream",
  "Silver Sulfadiazine 1% Cream","Neomycin+Bacitracin Ointment",
  "Salicylic Acid 6% Gel","Salicylic Acid 3% Lotion",
  "Tretinoin 0.025% Cream","Tretinoin 0.05% Cream","Tretinoin 0.1% Cream",
  "Adapalene 0.1% Gel","Adapalene 0.3% Gel",
  "Benzoyl Peroxide 2.5% Gel","Benzoyl Peroxide 5% Gel",
  "Clindamycin 1% Gel","Clindamycin+Benzoyl Peroxide Gel",
  "Isotretinoin 5mg","Isotretinoin 10mg","Isotretinoin 20mg",
  "Permethrin 5% Cream","Permethrin 1% Lotion","Lindane 1% Lotion",
  "Calamine Lotion","Calamine+Glycerine Lotion",
  "Coal Tar 2% Shampoo","Coal Tar Lotion",
  "Selenium Sulfide 2.5% Shampoo","Ketoconazole 2% Shampoo",
  "Urea 10% Cream","Urea 40% Cream",
  "Emollient Cream","Petroleum Jelly","Liquid Paraffin Cream",
  "Tacrolimus 0.03% Ointment","Tacrolimus 0.1% Ointment",
  "Pimecrolimus 1% Cream",
  "Minoxidil 2% Solution","Minoxidil 5% Solution","Minoxidil 10% Solution",
  "Hydroquinone 2% Cream","Hydroquinone 4% Cream",
  "Kojic Acid+Glycolic Acid Cream",
  "Sunscreen SPF 30 Lotion","Sunscreen SPF 50 Lotion",
  "Zinc Oxide Paste","Zinc Oxide+Calamine Lotion",
  // ── Eye Drops / Ointments ──
  "Ciprofloxacin 0.3% Eye Drops","Ciprofloxacin Eye Ointment",
  "Ofloxacin 0.3% Eye Drops","Ofloxacin Eye Ointment",
  "Tobramycin 0.3% Eye Drops","Tobramycin+Dexamethasone Eye Drops",
  "Moxifloxacin 0.5% Eye Drops","Gatifloxacin 0.3% Eye Drops",
  "Chloramphenicol 0.5% Eye Drops","Chloramphenicol Eye Ointment",
  "Prednisolone 0.5% Eye Drops","Prednisolone 1% Eye Drops",
  "Dexamethasone 0.1% Eye Drops","Fluorometholone 0.1% Eye Drops",
  "Atropine 1% Eye Drops","Cyclopentolate 1% Eye Drops",
  "Tropicamide 0.5% Eye Drops","Tropicamide 1% Eye Drops",
  "Pilocarpine 2% Eye Drops","Pilocarpine 4% Eye Drops",
  "Timolol 0.25% Eye Drops","Timolol 0.5% Eye Drops",
  "Latanoprost 0.005% Eye Drops","Bimatoprost 0.03% Eye Drops",
  "Travoprost 0.004% Eye Drops","Dorzolamide 2% Eye Drops","Brimonidine 0.15% Eye Drops",
  "Carboxymethylcellulose 0.5% Eye Drops","Carboxymethylcellulose 1% Eye Drops",
  "Sodium Hyaluronate Eye Drops","Hydroxypropyl Methylcellulose Eye Drops",
  "Tetracaine 0.5% Eye Drops","Proparacaine 0.5% Eye Drops",
  "Natamycin 5% Eye Drops","Voriconazole 1% Eye Drops",
  "Fluorescein 2% Eye Drops",
  // ── Ear Drops ──
  "Ciprofloxacin 0.3% Ear Drops","Ofloxacin 0.3% Ear Drops",
  "Clotrimazole 1% Ear Drops","Boric Acid Ear Drops",
  "Betamethasone+Neomycin Ear Drops","Lignocaine+Phenazone Ear Drops",
  "Waxsol Ear Drops","Sodium Bicarbonate Ear Drops","Carbamide Peroxide Ear Drops",
  // ── Gynaecology / Obstetrics ──
  "Ethinylestradiol+Levonorgestrel Tablet","Ethinylestradiol+Norethindrone Tablet",
  "Progesterone 100mg","Progesterone 200mg","Progesterone 400mg",
  "Progesterone 100mg Injection","Progesterone 250mg Injection",
  "Medroxyprogesterone 10mg","Medroxyprogesterone 150mg Injection",
  "Norethindrone 5mg","Levonorgestrel 1.5mg (Emergency Contraceptive)",
  "Clomiphene 50mg","Clomiphene 100mg",
  "Mifepristone 200mg","Misoprostol 200mcg",
  "Oxytocin 5 IU Injection","Oxytocin 10 IU Injection",
  "Methylergometrine 0.2mg","Methylergometrine 0.2mg Injection",
  "Carboprost 250mcg Injection","Tranexamic Acid 500mg","Tranexamic Acid 500mg Injection",
  "Isoxsuprine 10mg","Isoxsuprine 40mg Injection",
  "Nifedipine 10mg (Tocolytic)","Magnesium Sulfate 4g Injection",
  "Dydrogesterone 10mg","Hydroxyprogesterone 250mg Injection",
  "Estradiol 1mg","Estradiol 2mg","Estradiol Patch",
  "Conjugated Estrogen 0.625mg","Conjugated Estrogen 1.25mg",
  "Tibolone 2.5mg","Raloxifene 60mg",
  "Clotrimazole 200mg Vaginal Tablet","Clindamycin Vaginal Cream","Metronidazole Vaginal Gel",
  "Povidone Iodine Pessary",
  // ── Paediatric ──
  "Paracetamol 125mg/5ml Syrup","Paracetamol 250mg/5ml Syrup",
  "Ibuprofen 100mg/5ml Suspension","Ibuprofen 200mg/5ml Suspension",
  "Amoxicillin 125mg/5ml Syrup","Amoxicillin 250mg/5ml Syrup",
  "Azithromycin 100mg/5ml Syrup","Azithromycin 200mg/5ml Syrup",
  "Cefixime 50mg/5ml Syrup","Cefixime 100mg/5ml Syrup",
  "Cetirizine 5mg/5ml Syrup","Levocetirizine 2.5mg/5ml Syrup",
  "Domperidone 1mg/ml Drops","Ondansetron 2mg/5ml Syrup",
  "Metronidazole 200mg/5ml Syrup","Vitamin D3 400 IU Drops","Vitamin D3 800 IU Drops",
  "Iron Drops 25mg/ml","Folic Acid 500mcg Syrup","Calcium Syrup","Zinc 10mg/5ml Syrup",
  "Ambroxol 15mg/5ml Syrup","Dextromethorphan 5mg/5ml Syrup","Salbutamol 2mg/5ml Syrup",
  "Phenobarbitone 20mg/5ml Syrup","Valproate 200mg/5ml Syrup",
  "ORS Sachet Paediatric","Zinc 20mg Dispersible Paediatric",
  "Albendazole 200mg/5ml Suspension","Mebendazole 100mg/5ml Suspension",
  "Nystatin 100000 IU/ml Oral Drops",
  // ── Rheumatology / Immunology ──
  "Methotrexate 5mg","Methotrexate 7.5mg","Methotrexate 10mg","Methotrexate 15mg",
  "Methotrexate 10mg Injection",
  "Sulfasalazine 1000mg","Leflunomide 10mg","Leflunomide 20mg",
  "Azathioprine 25mg","Azathioprine 50mg",
  "Mycophenolate 250mg","Mycophenolate 500mg",
  "Cyclosporine 25mg","Cyclosporine 100mg",
  "Tacrolimus 0.5mg","Tacrolimus 1mg","Tacrolimus 5mg",
  // ── Oncology Supportive ──
  "Ondansetron 8mg (Chemo)","Granisetron 1mg","Palonosetron 0.25mg Injection",
  "Aprepitant 80mg","Aprepitant 125mg","Filgrastim 300mcg Injection",
  "Erythropoietin 2000 IU Injection","Erythropoietin 4000 IU Injection",
  "Tamoxifen 10mg","Tamoxifen 20mg",
  "Letrozole 2.5mg","Anastrozole 1mg","Exemestane 25mg",
  "Capecitabine 500mg",
  // ── Dental / Oral ──
  "Lignocaine 2% Injection","Lignocaine 2% with Adrenaline Injection",
  "Chlorhexidine 0.2% Mouthwash","Povidone Iodine Mouthwash",
  "Benzydamine Mouthwash","Cetylpyridinium Mouthwash",
  "Triamcinolone Dental Paste",
  // ── IV Fluids ──
  "Normal Saline 0.9% 100ml","Normal Saline 0.9% 500ml","Normal Saline 0.9% 1000ml",
  "Ringer Lactate 500ml","Ringer Lactate 1000ml",
  "Dextrose 5% 100ml","Dextrose 5% 500ml","Dextrose 10% 500ml","Dextrose 25% 100ml",
  "Dextrose Saline 500ml","DNS (Dextrose Normal Saline) 500ml",
  "Mannitol 20% 100ml","Mannitol 20% 500ml",
  "Human Albumin 20% 50ml","Human Albumin 25% 100ml",
  "Hydroxyethyl Starch 500ml",
  // ── Vaccines ──
  "Hepatitis B Vaccine Injection","Hepatitis A Vaccine Injection",
  "Typhoid Vi Vaccine Injection","Typhoid Oral Vaccine",
  "Tetanus Toxoid Injection","DPT Vaccine Injection",
  "MMR Vaccine Injection","Varicella Vaccine Injection",
  "BCG Vaccine Injection","OPV Drops","IPV Injection",
  "Pneumococcal Vaccine Injection","Meningococcal Vaccine Injection",
  "HPV Vaccine Injection","Influenza Vaccine Injection",
  "Rabies Vaccine Injection","Anti-Rabies Immunoglobulin Injection",
  "Tetanus Immunoglobulin Injection",
  // ── Anaesthesia / Emergency ──
  "Propofol 200mg Injection","Ketamine 500mg Injection",
  "Thiopentone 500mg Injection","Succinylcholine 100mg Injection",
  "Vecuronium 4mg Injection","Neostigmine 0.5mg Injection",
  "Naloxone 0.4mg Injection","Flumazenil 0.5mg Injection",
  "Lignocaine 100mg Injection",
];

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  route: string;
  instructions: string;
}

// ── Autocomplete Component ── (UNCHANGED)
function MedicineInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  function handleInput(val: string) {
    onChange(val);
    if (val.trim().length < 1) { setSuggestions([]); setShow(false); return; }
    const q = val.toLowerCase();
    const matches = MEDICINE_DB.filter(m => m.toLowerCase().includes(q)).slice(0, 9);
    setSuggestions(matches);
    setShow(matches.length > 0);
    setActiveIdx(-1);
  }
  function select(name: string) {
    onChange(name);
    setSuggestions([]);
    setShow(false);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (!show) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); select(suggestions[activeIdx]); }
    else if (e.key === "Escape") setShow(false);
  }
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  function getBadge(name: string) {
    const n = name.toLowerCase();
    if (n.includes("injection") || n.includes(" iv") || n.includes(" im")) return { label: "INJ", color: "#7c3aed", bg: "#ede9fe" };
    if (n.includes("syrup") || n.includes("suspension") || n.includes("drops") || n.includes("solution")) return { label: "LIQ", color: "#0369a1", bg: "#e0f2fe" };
    if (n.includes("cream") || n.includes("ointment") || n.includes("gel") || n.includes("lotion") || n.includes("paste") || n.includes("patch")) return { label: "TOP", color: "#059669", bg: "#d1fae5" };
    if (n.includes("inhaler") || n.includes("respules")) return { label: "INH", color: "#b45309", bg: "#fef3c7" };
    if (n.includes("eye") || n.includes("ear") || n.includes("nasal")) return { label: "LOC", color: "#be185d", bg: "#fce7f3" };
    return { label: "TAB", color: "#0f4c81", bg: "#dbeafe" };
  }
  return (
    <div ref={wrapRef} style={{ position: "relative", marginBottom: "10px" }}>
      <input
        value={value}
        onChange={e => handleInput(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => value.length > 0 && suggestions.length > 0 && setShow(true)}
        placeholder="Type medicine name, strength or form (e.g. Amox, Para, Inj...)"
        autoComplete="off"
        style={{
          width: "100%", padding: "10px 14px", borderRadius: "8px",
          border: "1.5px solid #e2e8f0", fontSize: "13px",
          boxSizing: "border-box", fontFamily: "inherit", fontWeight: "600",
        }}
      />
      {show && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white", border: "1.5px solid #dbeafe", borderRadius: "10px",
          boxShadow: "0 8px 28px rgba(15,76,129,0.15)", zIndex: 9999,
          overflow: "hidden", maxHeight: "300px", overflowY: "auto",
        }}>
          {suggestions.map((s, i) => {
            const q = value.toLowerCase();
            const start = s.toLowerCase().indexOf(q);
            const before = s.slice(0, start);
            const match = s.slice(start, start + value.length);
            const after = s.slice(start + value.length);
            const badge = getBadge(s);
            return (
              <div
                key={s}
                onMouseDown={() => select(s)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  padding: "9px 14px", cursor: "pointer", fontSize: "13px",
                  background: i === activeIdx ? "#ebf8ff" : "white",
                  borderBottom: i < suggestions.length - 1 ? "1px solid #f7fafc" : "none",
                  display: "flex", alignItems: "center", gap: "10px",
                  transition: "background 0.1s",
                }}
              >
                <span style={{
                  fontSize: "10px", fontWeight: "700", padding: "2px 6px",
                  borderRadius: "5px", color: badge.color, background: badge.bg,
                  minWidth: "30px", textAlign: "center", flexShrink: 0,
                }}>{badge.label}</span>
                <span style={{ color: "#444" }}>
                  {before}
                  <strong style={{ color: "#0f4c81", background: "#dbeafe", borderRadius: "3px", padding: "0 2px" }}>{match}</strong>
                  {after}
                </span>
              </div>
            );
          })}
          <div style={{ padding: "7px 14px", fontSize: "11px", color: "#bbb", borderTop: "1px solid #f0f0f0", background: "#fafbfc", display: "flex", gap: "8px" }}>
            <span style={{ color: "#7c3aed", fontWeight: "600" }}>INJ</span>=Injection&nbsp;
            <span style={{ color: "#0369a1", fontWeight: "600" }}>LIQ</span>=Syrup/Drops&nbsp;
            <span style={{ color: "#059669", fontWeight: "600" }}>TOP</span>=Topical&nbsp;
            <span style={{ color: "#0f4c81", fontWeight: "600" }}>TAB</span>=Tablet/Cap
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  ★ LAB TEST SELECTOR COMPONENT
// ════════════════════════════════════════════════
function LabTestSelector({
  selected, onChange
}: { selected: LabTest[]; onChange: (tests: LabTest[]) => void }) {
  const [searchQ, setSearchQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  const filtered = LAB_TEST_DB.filter(t => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchQ = !searchQ || t.name.toLowerCase().includes(searchQ.toLowerCase()) || t.code.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  const isSelected = (code: string) => selected.some(s => s.code === code);

  function toggleTest(t: typeof LAB_TEST_DB[0]) {
    if (isSelected(t.code)) {
      onChange(selected.filter(s => s.code !== t.code));
    } else {
      onChange([...selected, { id: crypto.randomUUID(), name: t.name, code: t.code, category: t.category, urgency: "Routine", notes: "" }]);
    }
  }

  function updateUrgency(code: string, urgency: LabTest["urgency"]) {
    onChange(selected.map(s => s.code === code ? { ...s, urgency } : s));
  }
  function updateNotes(code: string, notes: string) {
    onChange(selected.map(s => s.code === code ? { ...s, notes } : s));
  }

  const categoryCounts: Record<string, number> = {};
  LAB_TEST_DB.forEach(t => { categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1; });

  const urgencyColors: Record<LabTest["urgency"], { bg: string; color: string; border: string }> = {
    Routine: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    Urgent:  { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    STAT:    { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  };

  return (
    <div style={{ border: "1.5px solid #e0eaf6", borderRadius: "12px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f4c81, #1a6bb5)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>🔬</span>
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Lab Test Orders</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px" }}>Select tests to attach to this prescription</div>
          </div>
        </div>
        {selected.length > 0 && (
          <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Search + Category tabs */}
      <div style={{ background: "#f8fbff", borderBottom: "1px solid #e8f1fb", padding: "12px 16px" }}>
        <input
          type="text" placeholder="🔍 Search tests... (e.g. CBC, TSH, Urine)"
          value={searchQ} onChange={e => setSearchQ(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #d1e3f8", fontSize: "13px", background: "white", marginBottom: "10px", boxSizing: "border-box" as const }}
        />
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
          {["All", ...LAB_CATEGORIES].map(cat => {
            const active = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: "4px 11px", borderRadius: "20px", border: "1.5px solid", whiteSpace: "nowrap" as const,
                fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
                background: active ? "#0f4c81" : "white",
                color: active ? "white" : "#555",
                borderColor: active ? "#0f4c81" : "#dde6f0",
              }}>{cat}</button>
            );
          })}
        </div>
      </div>

      {/* Test Grid */}
      <div style={{ maxHeight: "240px", overflowY: "auto", padding: "12px 16px", background: "white" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#bbb", padding: "24px", fontSize: "13px" }}>No tests found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {filtered.map(t => {
              const sel = isSelected(t.code);
              return (
                <button key={t.code} onClick={() => toggleTest(t)} style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                  borderRadius: "8px", border: "1.5px solid", cursor: "pointer", textAlign: "left" as const,
                  fontFamily: "inherit", transition: "all 0.12s",
                  background: sel ? "#ebf4ff" : "#fafbfc",
                  borderColor: sel ? "#0f4c81" : "#e8edf3",
                }}>
                  <span style={{
                    width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                    border: `2px solid ${sel ? "#0f4c81" : "#cbd5e0"}`,
                    background: sel ? "#0f4c81" : "white",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {sel && <span style={{ color: "white", fontSize: "10px", fontWeight: "900" }}>✓</span>}
                  </span>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: sel ? "#0f4c81" : "#333", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    <div style={{ fontSize: "10px", color: "#999" }}>{t.code} · {t.category}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected tests with urgency + notes */}
      {selected.length > 0 && (
        <div style={{ borderTop: "1.5px solid #e8f1fb", padding: "12px 16px", background: "#f8fbff" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#0f4c81", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Selected Tests — Set Urgency
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {selected.map(t => {
              const uc = urgencyColors[t.urgency];
              return (
                <div key={t.code} style={{ background: "white", borderRadius: "8px", border: "1px solid #e8edf3", padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                      <button onClick={() => onChange(selected.filter(s => s.code !== t.code))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: "14px", padding: "0", flexShrink: 0 }}>✕</button>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{t.name}</span>
                      <span style={{ fontSize: "10px", color: "#999", flexShrink: 0 }}>{t.code}</span>
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      {(["Routine", "Urgent", "STAT"] as LabTest["urgency"][]).map(u => (
                        <button key={u} onClick={() => updateUrgency(t.code, u)} style={{
                          padding: "3px 8px", borderRadius: "6px", border: "1.5px solid", cursor: "pointer", fontSize: "10px", fontWeight: "700", fontFamily: "inherit",
                          background: t.urgency === u ? uc.bg : "white",
                          color: t.urgency === u ? uc.color : "#999",
                          borderColor: t.urgency === u ? uc.border : "#e2e8f0",
                        }}>{u}</button>
                      ))}
                      <button onClick={() => setEditingNotes(editingNotes === t.code ? null : t.code)}
                        style={{ padding: "3px 8px", borderRadius: "6px", border: "1.5px solid", cursor: "pointer", fontSize: "10px", fontWeight: "700", fontFamily: "inherit",
                          background: editingNotes === t.code ? "#f0f7ff" : "white",
                          color: "#555", borderColor: "#e2e8f0"
                        }}>📝</button>
                    </div>
                  </div>
                  {editingNotes === t.code && (
                    <input type="text" placeholder="Special instructions for this test..."
                      value={t.notes} onChange={e => updateNotes(t.code, e.target.value)}
                      style={{ marginTop: "6px", width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #d1e3f8", fontSize: "12px", boxSizing: "border-box" as const }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  ★ LAB ORDERS PANEL — shows all lab orders + result tracking
// ════════════════════════════════════════════════
const STATUS_CONFIG: Record<LabStatus, { color: string; bg: string; icon: string }> = {
  "Pending":          { color: "#92400e", bg: "#fef3c7", icon: "⏳" },
  "Sample Collected": { color: "#1e40af", bg: "#dbeafe", icon: "🧪" },
  "Processing":       { color: "#6d28d9", bg: "#ede9fe", icon: "⚙️" },
  "Completed":        { color: "#065f46", bg: "#d1fae5", icon: "✅" },
  "Cancelled":        { color: "#991b1b", bg: "#fee2e2", icon: "🚫" },
};

function LabOrdersPanel({ labOrders, patients, onUpdateStatus, onUpdateResult, onPrintLabReq }: {
  labOrders: LabOrder[];
  patients: any[];
  onUpdateStatus: (id: string, status: LabStatus) => void;
  onUpdateResult: (id: string, notes: string) => void;
  onPrintLabReq: (order: LabOrder) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<LabStatus | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState<string | null>(null);
  const [resultDraft, setResultDraft] = useState("");

  const filtered = labOrders.filter(o => {
    const matchStatus = filterStatus === "All" || o.status === filterStatus;
    const matchSearch = !search || o.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      o.tests.some(t => t.name.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const counts: Record<string, number> = { All: labOrders.length };
  labOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

  return (
    <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f4c81, #1a6bb5)", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ color: "white" }}>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "18px" }}>🔬 Lab Orders</div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "2px" }}>{labOrders.length} total orders</div>
          </div>
        </div>
        {/* Status filter pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {(["All", "Pending", "Sample Collected", "Processing", "Completed", "Cancelled"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s as any)} style={{
              padding: "4px 11px", borderRadius: "20px", border: "1.5px solid", cursor: "pointer",
              fontSize: "11px", fontWeight: "600", fontFamily: "inherit", whiteSpace: "nowrap" as const,
              background: filterStatus === s ? "white" : "rgba(255,255,255,0.12)",
              color: filterStatus === s ? "#0f4c81" : "rgba(255,255,255,0.85)",
              borderColor: filterStatus === s ? "white" : "rgba(255,255,255,0.2)",
            }}>{s} {counts[s] ? `(${counts[s]})` : ""}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f4f8" }}>
        <input type="text" placeholder="Search patient or test name..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" as const }} />
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🔬</div>
          <div style={{ fontWeight: "600", color: "#999" }}>No lab orders {filterStatus !== "All" ? `with status "${filterStatus}"` : "found"}</div>
        </div>
      ) : (
        <div>
          {filtered.map(order => {
            const sc = STATUS_CONFIG[order.status];
            const expanded = expandedId === order.id;
            return (
              <div key={order.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                {/* Order row */}
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                  onClick={() => setExpandedId(expanded ? null : order.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#1a1a2e" }}>{order.patient_name}</span>
                      <span style={{ background: sc.bg, color: sc.color, padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                        {sc.icon} {order.status}
                      </span>
                      {order.tests.some(t => t.urgency === "STAT") && (
                        <span style={{ background: "#fef2f2", color: "#b91c1c", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "800" }}>🚨 STAT</span>
                      )}
                      {order.tests.some(t => t.urgency === "Urgent") && !order.tests.some(t => t.urgency === "STAT") && (
                        <span style={{ background: "#fffbeb", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "700" }}>⚡ Urgent</span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {order.tests.slice(0, 3).map(t => t.code).join(" · ")}
                      {order.tests.length > 3 && <span style={{ color: "#999" }}> +{order.tests.length - 3} more</span>}
                      <span style={{ color: "#bbb", marginLeft: "8px" }}>· {order.ordered_at.split("T")[0]}</span>
                    </div>
                  </div>
                  <span style={{ color: "#bbb", fontSize: "12px" }}>{expanded ? "▲" : "▼"}</span>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div style={{ padding: "0 16px 14px", background: "#f8fbff", borderTop: "1px solid #e8f1fb" }}>
                    {/* Test list */}
                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                      {order.tests.map(t => {
                        const uc = { Routine: { bg: "#f0fdf4", color: "#15803d" }, Urgent: { bg: "#fffbeb", color: "#b45309" }, STAT: { bg: "#fef2f2", color: "#b91c1c" } }[t.urgency];
                        return (
                          <div key={t.code} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "white", borderRadius: "7px", border: "1px solid #e8edf3" }}>
                            <span style={{ background: uc.bg, color: uc.color, padding: "2px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: "700" }}>{t.urgency}</span>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a2e" }}>{t.name}</span>
                            <span style={{ fontSize: "10px", color: "#999", marginLeft: "auto" }}>{t.code}</span>
                            {t.notes && <span style={{ fontSize: "10px", color: "#666", fontStyle: "italic" }}>· {t.notes}</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Status update */}
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>Update Status</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        {(["Pending", "Sample Collected", "Processing", "Completed", "Cancelled"] as LabStatus[]).map(s => {
                          const c = STATUS_CONFIG[s];
                          return (
                            <button key={s} onClick={() => onUpdateStatus(order.id, s)} style={{
                              padding: "5px 12px", borderRadius: "7px", border: "1.5px solid", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "inherit",
                              background: order.status === s ? c.bg : "white",
                              color: order.status === s ? c.color : "#888",
                              borderColor: order.status === s ? c.color : "#e2e8f0",
                            }}>{c.icon} {s}</button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Result notes */}
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>Result Notes / Observations</div>
                      {editingResult === order.id ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <textarea value={resultDraft} onChange={e => setResultDraft(e.target.value)}
                            placeholder="Enter result values, observations, or notes..."
                            style={{ flex: 1, padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #0f4c81", fontSize: "12px", resize: "none", minHeight: "60px", fontFamily: "inherit" }} />
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button onClick={() => { onUpdateResult(order.id, resultDraft); setEditingResult(null); }}
                              style={{ padding: "6px 12px", borderRadius: "7px", border: "none", background: "#0f4c81", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "inherit" }}>Save</button>
                            <button onClick={() => setEditingResult(null)}
                              style={{ padding: "6px 12px", borderRadius: "7px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => { setEditingResult(order.id); setResultDraft(order.result_notes || ""); }}
                          style={{ padding: "8px 12px", borderRadius: "7px", border: "1.5px dashed #d1e3f8", cursor: "pointer", fontSize: "12px", color: order.result_notes ? "#333" : "#aaa", background: "white", minHeight: "36px" }}>
                          {order.result_notes || "Click to enter results..."}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => onPrintLabReq(order)} style={{ padding: "7px 14px", borderRadius: "7px", background: "#dbeafe", color: "#1e40af", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "inherit" }}>
                        🖨 Print Lab Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  ★ FOLLOW-UP SUGGESTION ENGINE
//  Same rules as followup-page.tsx — reused here
//  so doctor gets a suggestion right in the Rx form
// ════════════════════════════════════════════════
const FU_RULES: Array<{ keywords: string[]; days: number; reason: string; priority: "High"|"Medium"|"Low" }> = [
  { keywords: ["hypertension","bp","blood pressure","i10"], days: 30, reason: "BP monitoring & medication review", priority: "High" },
  { keywords: ["diabetes","diabetic","hba1c","sugar","e11","e13"], days: 30, reason: "Blood sugar monitoring & medication adjustment", priority: "High" },
  { keywords: ["thyroid","hypothyroid","hyperthyroid","tsh"], days: 45, reason: "TSH level recheck & dose titration", priority: "High" },
  { keywords: ["fever","viral","ari","urti","j06"], days: 5, reason: "Recovery assessment", priority: "Low" },
  { keywords: ["infection","antibiotic","j18","pneumonia","j22"], days: 7, reason: "Post-antibiotic review", priority: "Medium" },
  { keywords: ["asthma","copd","wheeze","j45","j44"], days: 14, reason: "Respiratory review & inhaler technique", priority: "High" },
  { keywords: ["anemia","iron","haemoglobin","hb low","d50","d64"], days: 30, reason: "Haemoglobin recheck", priority: "Medium" },
  { keywords: ["cardiac","heart","angina","i20","i25","echo"], days: 14, reason: "Cardiac assessment & ECG review", priority: "High" },
  { keywords: ["kidney","renal","ckd","n18","creatinine"], days: 14, reason: "Renal function recheck", priority: "High" },
  { keywords: ["liver","hepatitis","jaundice","k70","k72","sgpt"], days: 14, reason: "Liver function review", priority: "High" },
  { keywords: ["depression","anxiety","mental","f32","f41"], days: 14, reason: "Psychiatric follow-up & medication review", priority: "High" },
  { keywords: ["migraine","headache","g43"], days: 10, reason: "Headache diary review & medication efficacy", priority: "Medium" },
  { keywords: ["allergy","urticaria","l50","l20"], days: 10, reason: "Allergy response review", priority: "Low" },
  { keywords: ["cholesterol","lipid","dyslipidemia","e78"], days: 45, reason: "Lipid profile recheck", priority: "Medium" },
  { keywords: ["uti","n30","urinary","cystitis"], days: 7, reason: "Post-treatment culture recheck", priority: "Medium" },
  { keywords: ["pregnancy","antenatal","z34"], days: 14, reason: "Antenatal checkup", priority: "High" },
];

function getFUSuggestion(diagnosis: string, medDurations: string[]): { days: number; reason: string; priority: "High"|"Medium"|"Low"; date: string } | null {
  if (!diagnosis.trim()) return null;
  const lower = diagnosis.toLowerCase();
  for (const rule of FU_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      const date = new Date(); date.setDate(date.getDate() + rule.days);
      return { ...rule, date: date.toISOString().split("T")[0] };
    }
  }
  // Fallback: use longest medicine duration
  const ddays = medDurations.map(dur => {
    const m = dur.toLowerCase().match(/(\d+)\s*(day|week|month)/);
    if (!m) return 0;
    const n = parseInt(m[1]);
    return m[2].startsWith("week") ? n*7 : m[2].startsWith("month") ? n*30 : n;
  });
  const maxDur = Math.max(...ddays, 0);
  if (maxDur > 0) {
    const date = new Date(); date.setDate(date.getDate() + maxDur + 2);
    return { days: maxDur+2, reason: "Post-medication review", priority: "Medium", date: date.toISOString().split("T")[0] };
  }
  return null;
}

function fDateShort(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function PrescriptionsPageInner() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewPrescription, setViewPrescription] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"prescriptions" | "lab-orders">("prescriptions");

  // ★ Lab Orders State
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => {
    try { const raw = localStorage.getItem("clinic_lab_orders"); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  });
  const [formLabTests, setFormLabTests] = useState<LabTest[]>([]);

  // ★ Follow-up suggestion state
  const [fuSuggestion, setFuSuggestion] = useState<{ days: number; reason: string; priority: "High"|"Medium"|"Low"; date: string } | null>(null);
  const [fuEnabled, setFuEnabled] = useState(false);
  const [fuDate, setFuDate] = useState("");
  const [fuReason, setFuReason] = useState("");

  // ★ CDS — patient vitals for dose calculation & allergy check
  const [cdsWeight, setCdsWeight] = useState("");
  const [cdsAge, setCdsAge] = useState("");
  const [cdsAllergies, setCdsAllergies] = useState("");
  const [form, setForm] = useState({
    patient_id: "",
    medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] as Medicine[],
    notes: "",
    diagnosis: "",
  });
  const searchParams = useSearchParams();

  useEffect(() => { loadPrescriptions(); loadPatients(); }, []);

  // ── Voice pre-fill: runs after patients are loaded ──
  useEffect(() => {
    if (searchParams.get("voice") !== "1") return;
    if (patients.length === 0) return;
    const raw = sessionStorage.getItem("voice_prescription");
    if (!raw) return;
    try {
      sessionStorage.removeItem("voice_prescription");
      const data = JSON.parse(raw);
      const mappedMeds: Medicine[] = (data.medicines || []).map((m: any) => ({
        name: m.medicine || "",
        dosage: [m.dosage, m.frequency].filter(Boolean).join(" — ") || "",
        duration: m.duration || "",
        route: m.route || "Oral",
        instructions: m.instructions || "",
      }));
      let patient_id = "";
      if (data.patient_name) {
        const match = patients.find((p: any) =>
          p.name.toLowerCase().includes(data.patient_name.toLowerCase()) ||
          data.patient_name.toLowerCase().includes(p.name.toLowerCase())
        );
        if (match) patient_id = match.id;
      }
      setForm({
        patient_id,
        medicines: mappedMeds.length > 0 ? mappedMeds : [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }],
        notes: data.notes || "",
        diagnosis: data.diagnosis || "",
      });
      setShowAdd(true);
      window.history.replaceState({}, "", "/prescriptions");
    } catch (e) { console.error("Voice pre-fill error", e); }
  }, [patients, searchParams]);

  // ★ Auto-suggest follow-up when diagnosis or medicine durations change
  useEffect(() => {
    const medDurs = form.medicines.map(m => m.duration).filter(Boolean);
    const suggestion = getFUSuggestion(form.diagnosis, medDurs);
    setFuSuggestion(suggestion);
    if (suggestion && !fuEnabled) {
      // Auto-enable and pre-fill if high priority
      if (suggestion.priority === "High") {
        setFuEnabled(true);
        setFuDate(suggestion.date);
        setFuReason(suggestion.reason);
      }
    }
  }, [form.diagnosis, form.medicines]);

  async function loadPrescriptions() {
    setPageLoading(true);
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      if (Array.isArray(data)) setPrescriptions(data);
    } catch (err) { console.error(err); }
    finally { setPageLoading(false); }
  }
  async function loadPatients() {
    try {
      const res = await fetch("/api/patients");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) setPatients(result.data);
    } catch (err) { console.error(err); }
  }
  function addMedicineRow() {
    setForm(f => ({ ...f, medicines: [...f.medicines, { name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] }));
  }
  function removeMedicineRow(idx: number) {
    setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));
  }
  function updateMedicine(idx: number, field: keyof Medicine, value: string) {
    setForm(f => ({ ...f, medicines: f.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m) }));
  }
  // ★ Save lab orders to localStorage
  function persistLabOrders(orders: LabOrder[]) {
    setLabOrders(orders);
    try { localStorage.setItem("clinic_lab_orders", JSON.stringify(orders)); } catch {}
  }

  function updateLabStatus(id: string, status: LabStatus) {
    const updated = labOrders.map(o => o.id === id ? { ...o, status, completed_at: status === "Completed" ? new Date().toISOString() : o.completed_at } : o);
    persistLabOrders(updated);
  }
  function updateLabResult(id: string, notes: string) {
    persistLabOrders(labOrders.map(o => o.id === id ? { ...o, result_notes: notes } : o));
  }

  function handlePrintLabReq(order: LabOrder) {
    const w = window.open("", "_blank", "width=800,height=700");
    if (!w) return;
    const statTests = order.tests.filter(t => t.urgency === "STAT");
    const urgentTests = order.tests.filter(t => t.urgency === "Urgent");
    const routineTests = order.tests.filter(t => t.urgency === "Routine");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Lab Request - ${order.patient_name}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:24px;color:#1a1a2e;font-size:13px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f4c81;padding-bottom:14px;margin-bottom:18px}
      .hosp-name{font-size:20px;font-weight:800;color:#0f4c81}
      .hosp-sub{font-size:11px;color:#666;margin-top:3px}
      .lab-title{font-size:16px;font-weight:700;color:#b91c1c;border:2px solid #b91c1c;padding:4px 14px;border-radius:6px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fbff;padding:14px;border-radius:8px;margin-bottom:16px;border:1px solid #d1e3f8}
      .info-item label{font-size:10px;color:#888;font-weight:700;text-transform:uppercase;display:block;margin-bottom:2px}
      .info-item span{font-size:14px;font-weight:600;color:#1a1a2e}
      .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;padding:5px 10px;border-radius:5px}
      .stat-section .section-title{background:#fef2f2;color:#b91c1c}
      .urgent-section .section-title{background:#fffbeb;color:#b45309}
      .routine-section .section-title{background:#f0fdf4;color:#15803d}
      .test-row{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;margin-bottom:4px;border:1px solid #e8edf3}
      .checkbox{width:14px;height:14px;border:2px solid #aaa;border-radius:3px;display:inline-block;margin-right:4px}
      .test-name{font-weight:600;font-size:13px}
      .test-code{font-size:10px;color:#999;margin-left:auto}
      .test-notes{font-size:11px;color:#666;font-style:italic}
      .footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#999}
      .sign-box{border-top:1px solid #333;width:180px;text-align:center;padding-top:6px;font-size:11px;color:#555}
      @media print{body{padding:12px}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="hosp-name">${hospitalConfig.name}</div>
        <div class="hosp-sub">${hospitalConfig.address}, ${hospitalConfig.city} · ${hospitalConfig.phone}</div>
      </div>
      <div class="lab-title">🔬 LAB REQUEST FORM</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><label>Patient Name</label><span>${order.patient_name}</span></div>
      <div class="info-item"><label>Order Date</label><span>${order.ordered_at.split("T")[0]}</span></div>
      <div class="info-item"><label>Ordered By</label><span>${hospitalConfig.doctorName}</span></div>
      <div class="info-item"><label>Diagnosis / Indication</label><span>${order.diagnosis || "—"}</span></div>
    </div>
    ${statTests.length ? `<div class="stat-section" style="margin-bottom:14px"><div class="section-title">🚨 STAT — Process Immediately</div>${statTests.map(t=>`<div class="test-row"><span class="checkbox"></span><span class="test-name">${t.name}</span><span class="test-code">${t.code}</span>${t.notes?`<span class="test-notes">${t.notes}</span>`:""}</div>`).join("")}</div>` : ""}
    ${urgentTests.length ? `<div class="urgent-section" style="margin-bottom:14px"><div class="section-title">⚡ URGENT</div>${urgentTests.map(t=>`<div class="test-row"><span class="checkbox"></span><span class="test-name">${t.name}</span><span class="test-code">${t.code}</span>${t.notes?`<span class="test-notes">${t.notes}</span>`:""}</div>`).join("")}</div>` : ""}
    ${routineTests.length ? `<div class="routine-section" style="margin-bottom:14px"><div class="section-title">✓ ROUTINE</div>${routineTests.map(t=>`<div class="test-row"><span class="checkbox"></span><span class="test-name">${t.name}</span><span class="test-code">${t.code}</span>${t.notes?`<span class="test-notes">${t.notes}</span>`:""}</div>`).join("")}</div>` : ""}
    <div class="footer">
      <div>Lab Order ID: LAB-${order.id.slice(0,8).toUpperCase()}</div>
      <div class="sign-box">${hospitalConfig.doctorName}<br/>${hospitalConfig.doctorDegree}</div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`);
    w.document.close();
  }

  async function savePrescription() {
    if (!form.patient_id) return alert("Please select a patient.");
    if (form.medicines.some(m => !m.name)) return alert("Please fill in all medicine names.");
    setLoading(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: form.patient_id, medicines: form.medicines, notes: form.notes, diagnosis: form.diagnosis }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // ★ If lab tests selected, create a lab order
      if (formLabTests.length > 0) {
        const patientName = patients.find(p => p.id === form.patient_id)?.name || "Unknown";
        const newOrder: LabOrder = {
          id: crypto.randomUUID(),
          prescription_id: result.data?.id || result.id || "manual",
          patient_id: form.patient_id,
          patient_name: patientName,
          tests: formLabTests,
          status: "Pending",
          result_notes: "",
          ordered_at: new Date().toISOString(),
          diagnosis: form.diagnosis,
        };
        persistLabOrders([newOrder, ...labOrders]);
      }

      // ★ Auto-create follow-up if enabled
      if (fuEnabled && fuDate) {
        const patientName = patients.find(p => p.id === form.patient_id)?.name || "Unknown";
        const patientPhone = patients.find(p => p.id === form.patient_id)?.phone || "";
        const newFU = {
          id: `FU-${Date.now()}`,
          patientId: form.patient_id,
          patientName,
          patientPhone,
          doctor: hospitalConfig.doctorName,
          dueDate: fuDate,
          createdDate: new Date().toISOString().split("T")[0],
          diagnosis: form.diagnosis,
          reason: fuReason || "Follow-up after prescription",
          prescriptionId: result.data?.id || result.id || "manual",
          status: "Pending" as const,
          priority: fuSuggestion?.priority || "Medium" as const,
          notes: "",
          reminderSent: false,
          suggestedBy: "auto" as const,
        };
        try {
          const existing = JSON.parse(localStorage.getItem("clinic_followups") || "[]");
          localStorage.setItem("clinic_followups", JSON.stringify([newFU, ...existing]));
        } catch {}
      }

      setShowAdd(false);
      setForm({ patient_id: "", medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }], notes: "", diagnosis: "" });
      setFormLabTests([]);
      setFuEnabled(false); setFuDate(""); setFuReason(""); setFuSuggestion(null);
      setCdsWeight(""); setCdsAge(""); setCdsAllergies("");
      loadPrescriptions();
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setLoading(false); }
  }
  async function deletePrescription(id: string) {
    if (!confirm("Delete this prescription?")) return;
    await fetch("/api/prescriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadPrescriptions();
  }
  function handlePrint(p: any) {
    const patientName = p.patients?.name || patients.find(pat => pat.id === p.patient_id)?.name || "Patient";
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const medicines = p.medicine.split("\n");
    const dosages = (p.dosage || "").split("\n");
    const durations = (p.duration || "").split("\n");
    const routes = (p.route || "").split("\n");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Prescription - ${patientName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'DM Sans',sans-serif;padding:50px;color:#1a1a2e;font-size:13px;line-height:1.6}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #0f4c81;margin-bottom:28px}
      .clinic-name{font-family:'DM Serif Display',serif;font-size:26px;color:#0f4c81}
      .clinic-sub{font-size:11px;color:#888;margin-top:4px;line-height:1.8}
      .doctor-info{text-align:right;font-size:12px;color:#666;line-height:1.8}
      .doctor-name{font-weight:700;color:#1a1a2e;font-size:14px}
      .patient-box{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;background:#f8fbff;padding:18px 22px;border-radius:10px;margin-bottom:24px;border:1px solid #e8f1fb}
      .label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:4px;font-weight:600}
      .value{font-size:14px;font-weight:500;color:#1a1a2e}
      .rx-title{font-family:'DM Serif Display',serif;font-size:18px;color:#0f4c81;margin-bottom:16px;display:flex;align-items:center;gap:10px}
      .rx-title::after{content:'';flex:1;height:1px;background:#e2e8f0}
      .medicine-row{display:grid;grid-template-columns:30px 1fr 120px 100px 120px;gap:12px;padding:12px 0;border-bottom:1px dashed #eee;align-items:start}
      .med-num{width:26px;height:26px;background:#0f4c81;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}
      .med-name{font-weight:700;font-size:15px;color:#1a1a2e}
      .med-label{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
      .med-val{font-size:13px;color:#444;font-weight:500}
      .notes-box{margin-top:24px;padding:14px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;font-size:13px;color:#555}
      .footer{margin-top:50px;padding-top:20px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end}
      .sign-area{text-align:right}
      .sign-line{width:160px;border-top:1px solid #333;margin-bottom:6px;margin-left:auto}
      .sign-label{font-size:11px;color:#666}
      .footer-note{font-size:10px;color:#aaa;line-height:1.8}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="clinic-name">${hospitalConfig.name}</div>
        <div class="clinic-sub">${hospitalConfig.address}, ${hospitalConfig.city}, ${hospitalConfig.state}<br/>Phone: ${hospitalConfig.phone} &nbsp;|&nbsp; ${hospitalConfig.email}</div>
      </div>
      <div class="doctor-info">
        <div class="doctor-name">${hospitalConfig.doctorName}</div>
        <div>${hospitalConfig.doctorDegree}</div><div>${hospitalConfig.department}</div>
        <div>Reg. No: MCI-XXXXX</div>
      </div>
    </div>
    <div class="patient-box">
      <div><div class="label">Patient Name</div><div class="value">${patientName}</div></div>
      <div><div class="label">Date</div><div class="value">${new Date(p.created_at || Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</div></div>
      <div><div class="label">Prescription ID</div><div class="value" style="font-family:monospace;font-size:12px">RX-${(p.id||"").slice(0,8).toUpperCase()}</div></div>
      ${p.diagnosis?`<div style="grid-column:1/-1"><div class="label">Diagnosis / Chief Complaint</div><div class="value">${p.diagnosis}</div></div>`:""}
    </div>
    <div class="rx-title">℞ &nbsp; Prescribed Medications</div>
    <div>
      <div class="medicine-row" style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;padding-bottom:8px">
        <div></div><div>Medicine</div><div>Dosage</div><div>Duration</div><div>Route</div>
      </div>
      ${medicines.map((m:string,i:number)=>`
        <div class="medicine-row">
          <div class="med-num">${i+1}</div>
          <div><div class="med-name">${m}</div></div>
          <div><div class="med-label">Dosage</div><div class="med-val">${dosages[i]||"—"}</div></div>
          <div><div class="med-label">Duration</div><div class="med-val">${durations[i]||"—"}</div></div>
          <div><div class="med-label">Route</div><div class="med-val">${routes[i]||"Oral"}</div></div>
        </div>`).join("")}
    </div>
    ${p.notes?`<div class="notes-box"><strong>Instructions:</strong> ${p.notes}</div>`:""}
    <div class="footer">
      <div class="footer-note">This is a computer-generated prescription.<br/>Valid for 30 days from date of issue.<br/>${hospitalConfig.name} &bull; ${hospitalConfig.appName}</div>
      <div class="sign-area"><div class="sign-line"></div><div class="sign-label">${hospitalConfig.doctorName}</div><div class="sign-label" style="color:#aaa">${hospitalConfig.doctorDegree}</div></div>
    </div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
    w.document.close();
  }

  const filteredPrescriptions = prescriptions.filter(p => {
    const name = p.patients?.name || patients.find(pat => pat.id === p.patient_id)?.name || "";
    return !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || p.medicine?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const inputStyle: any = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" />
      <style>{`
        .rx-row{transition:background 0.15s}.rx-row:hover td{background:#f0f7ff!important}
        .action-btn{border:none;cursor:pointer;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:600;transition:all 0.15s;font-family:inherit}
        .print-btn-sm{background:#dbeafe;color:#1e40af}.print-btn-sm:hover{background:#bfdbfe}
        .view-btn-sm{background:#ede9fe;color:#6d28d9}.view-btn-sm:hover{background:#ddd6fe}
        .del-btn-sm{background:#fee2e2;color:#991b1b}.del-btn-sm:hover{background:#fecaca}
        .add-medicine-btn{background:none;border:1.5px dashed #cbd5e0;width:100%;padding:10px;border-radius:8px;cursor:pointer;color:#888;font-size:13px;font-weight:500;transition:all 0.15s;font-family:inherit}
        .add-medicine-btn:hover{border-color:#0f4c81;color:#0f4c81;background:#f0f7ff}
        .remove-row-btn{background:none;border:none;cursor:pointer;color:#cbd5e0;padding:4px 8px;border-radius:6px;font-size:16px;transition:all 0.15s;line-height:1}
        .remove-row-btn:hover{color:#e53e3e;background:#fee2e2}
        .preset-chip{padding:4px 10px;border-radius:20px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:11px;font-weight:500;transition:all 0.15s;font-family:inherit}
        .preset-chip:hover{border-color:#0f4c81;color:#0f4c81;background:#ebf8ff}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        .modal-anim{animation:slideUp 0.22s ease}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .stat-card{background:white;border-radius:14px;padding:18px 22px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"26px", color:"#0f4c81", margin:0 }}>Prescriptions & Lab Orders</h1>
          <p style={{ color:"#888", fontSize:"14px", marginTop:"4px" }}>{hospitalConfig.name} &bull; {prescriptions.length} prescriptions · {labOrders.length} lab orders</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background:"#0f4c81", color:"white", border:"none", padding:"11px 22px", borderRadius:"10px", cursor:"pointer", fontWeight:"600", fontSize:"14px", boxShadow:"0 4px 14px rgba(15,76,129,0.25)" }}>
          + New Prescription
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"20px", background:"white", padding:"4px", borderRadius:"11px", width:"fit-content", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        {([
          { key: "prescriptions", label: "💊 Prescriptions", count: prescriptions.length },
          { key: "lab-orders", label: "🔬 Lab Orders", count: labOrders.length },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding:"8px 20px", borderRadius:"8px", border:"none", cursor:"pointer", fontFamily:"inherit",
            fontSize:"13px", fontWeight:"600", transition:"all 0.15s",
            background: activeTab === tab.key ? "#0f4c81" : "transparent",
            color: activeTab === tab.key ? "white" : "#888",
            boxShadow: activeTab === tab.key ? "0 2px 8px rgba(15,76,129,0.25)" : "none",
          }}>
            {tab.label}
            <span style={{ marginLeft:"6px", background: activeTab===tab.key?"rgba(255,255,255,0.2)":"#f0f4f8", color: activeTab===tab.key?"white":"#555", padding:"1px 7px", borderRadius:"10px", fontSize:"11px", fontWeight:"700" }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"22px" }}>
        {(activeTab === "prescriptions" ? [
          { label:"Total Prescriptions", value:prescriptions.length, color:"#0f4c81", icon:"💊" },
          { label:"Unique Patients", value:new Set(prescriptions.map(p=>p.patient_id)).size, color:"#065f46", icon:"👥" },
          { label:"Today's Rx", value:prescriptions.filter(p=>(p.created_at||"").split("T")[0]===new Date().toISOString().split("T")[0]).length, color:"#6d28d9", icon:"📋" },
        ] : [
          { label:"Total Lab Orders", value:labOrders.length, color:"#0f4c81", icon:"🔬" },
          { label:"Pending / In-Progress", value:labOrders.filter(o=>o.status==="Pending"||o.status==="Sample Collected"||o.status==="Processing").length, color:"#b45309", icon:"⏳" },
          { label:"Completed Today", value:labOrders.filter(o=>o.status==="Completed"&&(o.completed_at||"").split("T")[0]===new Date().toISOString().split("T")[0]).length, color:"#065f46", icon:"✅" },
        ]).map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize:"20px", marginBottom:"6px" }}>{s.icon}</div>
            <div style={{ fontSize:"11px", color:"#999", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"4px" }}>{s.label}</div>
            <div style={{ fontSize:"26px", fontWeight:"700", color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search (prescriptions tab only) */}
      {activeTab === "prescriptions" && <div style={{ marginBottom:"16px" }}>
        <input type="text" placeholder="Search by patient name or medicine..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
          style={{ padding:"10px 16px", borderRadius:"9px", border:"1.5px solid #e2e8f0", fontSize:"14px", width:"300px", background:"white" }} />
      </div>}

      {/* Lab Orders Tab */}
      {activeTab === "lab-orders" && (
        <LabOrdersPanel
          labOrders={labOrders}
          patients={patients}
          onUpdateStatus={updateLabStatus}
          onUpdateResult={updateLabResult}
          onPrintLabReq={handlePrintLabReq}
        />
      )}

      {/* Prescriptions Table */}
      {activeTab === "prescriptions" && <div style={{ background:"white", borderRadius:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#0f4c81" }}>
              {["Rx ID","Patient","Medicine","Dosage","Duration","Notes","Date","Actions"].map(h=>(
                <th key={h} style={{ padding:"13px 16px", color:"white", fontSize:"11px", textTransform:"uppercase", letterSpacing:"1.5px", textAlign:"left", fontWeight:"600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageLoading ? (
              <tr><td colSpan={8} style={{ textAlign:"center", padding:"50px", color:"#bbb" }}>Loading...</td></tr>
            ) : filteredPrescriptions.length===0 ? (
              <tr><td colSpan={8} style={{ textAlign:"center", padding:"50px", color:"#bbb" }}>
                <div style={{ fontSize:"36px", marginBottom:"10px" }}>💊</div>
                <div style={{ fontWeight:"600", color:"#999" }}>No prescriptions found</div>
              </td></tr>
            ) : filteredPrescriptions.map((p,i) => {
              const patientName = p.patients?.name || patients.find(pat=>pat.id===p.patient_id)?.name || "N/A";
              const firstMed = p.medicine?.split("\n")[0] || "—";
              const hasMore = p.medicine?.includes("\n");
              return (
                <tr key={p.id} className="rx-row" style={{ borderBottom:"1px solid #f0f0f0", background:i%2===0?"#fff":"#fafbfc" }}>
                  <td style={{ padding:"12px 16px", fontFamily:"monospace", fontSize:"11px", color:"#aaa" }}>RX-{p.id?.slice(0,8).toUpperCase()}</td>
                  <td style={{ padding:"12px 16px", fontWeight:"600", color:"#1a1a2e", fontSize:"14px" }}>{patientName}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ background:"#ebf8ff", color:"#1e40af", padding:"3px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:"700" }}>
                      {firstMed}{hasMore?" +":""}
                    </span>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:"13px", color:"#555" }}>{p.dosage?.split("\n")[0]||"—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:"13px", color:"#555" }}>{p.duration?.split("\n")[0]||"—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:"12px", color:"#999", maxWidth:"160px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.notes||"—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:"12px", color:"#888" }}>{(p.created_at||"").split("T")[0]}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button className="action-btn view-btn-sm" onClick={()=>setViewPrescription(p)}>👁 View</button>
                      <button className="action-btn print-btn-sm" onClick={()=>handlePrint(p)}>🖨 Print</button>
                      <button className="action-btn del-btn-sm" onClick={()=>deletePrescription(p.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}

      {/* New Prescription Modal */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,20,40,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px" }}>
          <div className="modal-anim" style={{ background:"white", borderRadius:"16px", width:"700px", maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding:"28px 32px 0" }}>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"22px", color:"#0f4c81", marginBottom:"4px" }}>New Prescription</h2>
              <p style={{ color:"#999", fontSize:"13px", marginBottom:"24px" }}>Write a prescription for a patient visit</p>
            </div>
            <div style={{ padding:"0 32px 28px", display:"flex", flexDirection:"column", gap:"18px" }}>
              {/* Patient + Diagnosis */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                <div>
                  <label style={{ fontSize:"12px", fontWeight:"600", color:"#555", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"6px" }}>Patient *</label>
                  <select style={inputStyle} value={form.patient_id} onChange={e => {
                    setForm(f=>({...f,patient_id:e.target.value}));
                    const pat = patients.find((p:any) => p.id === e.target.value);
                    if (pat) {
                      if (pat.allergies && pat.allergies !== "None") setCdsAllergies(pat.allergies);
                      if (pat.age) setCdsAge(String(pat.age));
                      if (pat.weight || pat.wt) setCdsWeight(String(pat.weight || pat.wt));
                      // Calculate age from DOB if available
                      if (pat.dob) {
                        const ageFull = Math.floor((Date.now() - new Date(pat.dob).getTime()) / (365.25 * 86400000));
                        if (ageFull > 0) setCdsAge(String(ageFull));
                      }
                    }
                  }}>
                    <option value="">Select patient...</option>
                    {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:"12px", fontWeight:"600", color:"#555", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"6px" }}>Diagnosis / Chief Complaint</label>
                  <input style={inputStyle} placeholder="e.g. Fever, Cold, Infection..." value={form.diagnosis} onChange={e=>setForm(f=>({...f,diagnosis:e.target.value}))} />
                </div>
              </div>

              {/* ★ CDS — Patient Info Strip (weight, age, allergies) */}
              <div style={{ background:"#f8fbff", borderRadius:"10px", padding:"12px 14px", border:"1.5px solid #e8f1fb" }}>
                <div style={{ fontSize:"11px", fontWeight:"800", color:"#0f4c81", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px", display:"flex", alignItems:"center", gap:"6px" }}>
                  <span>🩺</span> Patient Info <span style={{ fontSize:"10px", color:"#aaa", fontWeight:"500", textTransform:"none", letterSpacing:"0" }}>— used for dose calculator & safety checks</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", gap:"10px" }}>
                  <div>
                    <div style={{ fontSize:"11px", color:"#888", fontWeight:"600", marginBottom:"4px" }}>Weight (kg)</div>
                    <input type="number" placeholder="e.g. 70" value={cdsWeight} onChange={e=>setCdsWeight(e.target.value)}
                      style={{ ...inputStyle, padding:"7px 10px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:"11px", color:"#888", fontWeight:"600", marginBottom:"4px" }}>Age (years)</div>
                    <input type="number" placeholder="e.g. 35" value={cdsAge} onChange={e=>setCdsAge(e.target.value)}
                      style={{ ...inputStyle, padding:"7px 10px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:"11px", color:"#888", fontWeight:"600", marginBottom:"4px" }}>Known Allergies</div>
                    <input placeholder="e.g. Penicillin, Sulfa drugs..." value={cdsAllergies} onChange={e=>setCdsAllergies(e.target.value)}
                      style={{ ...inputStyle, padding:"7px 10px" }} />
                  </div>
                </div>
              </div>

              {/* Medicines */}
              <div>
                <label style={{ fontSize:"12px", fontWeight:"600", color:"#555", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"10px" }}>
                  Medicines ({form.medicines.length})
                </label>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  {form.medicines.map((med,idx)=>(
                    <div key={idx} style={{ background:"#f8fbff", borderRadius:"10px", padding:"14px 16px", border:"1.5px solid #e8f1fb" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                        <span style={{ fontSize:"12px", fontWeight:"700", color:"#0f4c81", background:"#dbeafe", padding:"2px 10px", borderRadius:"12px" }}>Medicine {idx+1}</span>
                        {form.medicines.length>1 && <button className="remove-row-btn" onClick={()=>removeMedicineRow(idx)}>✕</button>}
                      </div>

                      {/* Autocomplete — UNCHANGED */}
                      <MedicineInput value={med.name} onChange={v=>updateMedicine(idx,"name",v)} />

                      {/* ★ Per-medicine warnings appear right after autocomplete */}
                      <MedWarningBadges medName={med.name} />

                      {/* ★ Dose Calculator — expands inline per medicine */}
                      <DoseCalculator medName={med.name} />

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"8px" }}>
                        <div>
                          <div style={{ fontSize:"11px", color:"#888", marginBottom:"4px", fontWeight:"600" }}>Dosage</div>
                          <input style={inputStyle} placeholder="e.g. 1-0-1" value={med.dosage} onChange={e=>updateMedicine(idx,"dosage",e.target.value)} />
                          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"6px" }}>
                            {DOSAGE_PRESETS.slice(0,4).map(d=><button key={d} className="preset-chip" onClick={()=>updateMedicine(idx,"dosage",d)}>{d}</button>)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:"11px", color:"#888", marginBottom:"4px", fontWeight:"600" }}>Duration</div>
                          <input style={inputStyle} placeholder="e.g. 5 days" value={med.duration} onChange={e=>updateMedicine(idx,"duration",e.target.value)} />
                          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"6px" }}>
                            {DURATION_PRESETS.slice(0,3).map(d=><button key={d} className="preset-chip" onClick={()=>updateMedicine(idx,"duration",d)}>{d}</button>)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:"11px", color:"#888", marginBottom:"4px", fontWeight:"600" }}>Route</div>
                          <select style={inputStyle} value={med.route} onChange={e=>updateMedicine(idx,"route",e.target.value)}>
                            {ROUTE_OPTIONS.map(r=><option key={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>
                      <input style={inputStyle} placeholder="Instructions (e.g. Take after food, avoid milk)" value={med.instructions} onChange={e=>updateMedicine(idx,"instructions",e.target.value)} />
                    </div>
                  ))}
                </div>
                <button className="add-medicine-btn" onClick={addMedicineRow} style={{ marginTop:"10px" }}>+ Add Another Medicine</button>
              </div>

              {/* General Notes */}
              <div>
                <label style={{ fontSize:"12px", fontWeight:"600", color:"#555", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"6px" }}>General Instructions</label>
                <textarea style={{ ...inputStyle, minHeight:"70px", resize:"none" }} placeholder="Rest, diet advice, follow-up instructions..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>

              {/* ★ NEW: Lab Test Orders */}
              <LabTestSelector selected={formLabTests} onChange={setFormLabTests} />

              {/* ★ CDS PANEL — Red flags + Allergy alerts */}
              <CDSPanel
                diagnosis={form.diagnosis}
                medNames={form.medicines.map(m => m.name)}
                patientAllergies={cdsAllergies}
              />

              {/* ★ Interaction panel — appears when 2+ medicines are filled */}
              <InteractionPanel medNames={form.medicines.map(m => m.name)} />

              {/* ★ FOLLOW-UP SUGGESTION BLOCK */}
              {fuSuggestion && (
                <div style={{ border: `2px solid ${fuEnabled ? "#0f4c81" : "#e2e8f0"}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s" }}>
                  {/* Header row */}
                  <div style={{ background: fuEnabled ? "linear-gradient(135deg, #0f4c81, #1a6bb5)" : "#f8fbff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>🔔</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: fuEnabled ? "white" : "#0f4c81" }}>Smart Follow-up</div>
                        <div style={{ fontSize: "11px", color: fuEnabled ? "rgba(255,255,255,0.7)" : "#888" }}>
                          {fuSuggestion.priority === "High" ? "Auto-scheduled · High priority" : `Suggested in ${fuSuggestion.days} days`}
                        </div>
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: fuEnabled ? "white" : "#888" }}>{fuEnabled ? "ON" : "OFF"}</span>
                      <div onClick={() => {
                        const next = !fuEnabled;
                        setFuEnabled(next);
                        if (next && fuSuggestion) { setFuDate(fuSuggestion.date); setFuReason(fuSuggestion.reason); }
                      }} style={{
                        width: "38px", height: "20px", borderRadius: "10px", cursor: "pointer",
                        background: fuEnabled ? "#22c55e" : "#cbd5e0", position: "relative", transition: "background 0.2s",
                      }}>
                        <div style={{ position: "absolute", top: "2px", left: fuEnabled ? "20px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </div>
                    </label>
                  </div>

                  {/* Suggestion chip — always visible */}
                  {!fuEnabled && (
                    <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#555" }}>
                        <span style={{ background: fuSuggestion.priority === "High" ? "#fef2f2" : fuSuggestion.priority === "Medium" ? "#fffbeb" : "#f0fdf4", color: fuSuggestion.priority === "High" ? "#b91c1c" : fuSuggestion.priority === "Medium" ? "#b45309" : "#15803d", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", marginRight: "8px" }}>{fuSuggestion.priority}</span>
                        {fuSuggestion.reason} · <strong>{fDateShort(fuSuggestion.date)}</strong>
                      </div>
                      <button onClick={() => { setFuEnabled(true); setFuDate(fuSuggestion.date); setFuReason(fuSuggestion.reason); }}
                        style={{ background: "#0f4c81", color: "white", border: "none", padding: "5px 14px", borderRadius: "7px", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        Enable →
                      </button>
                    </div>
                  )}

                  {/* Editable fields when enabled */}
                  {fuEnabled && (
                    <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>Follow-up Date</div>
                        <input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)}
                          style={{ padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #d1e3f8", fontSize: "13px", fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>Reason</div>
                        <input value={fuReason} onChange={e => setFuReason(e.target.value)} placeholder="Reason for follow-up..."
                          style={{ padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #d1e3f8", fontSize: "13px", fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const }} />
                      </div>
                      <div style={{ gridColumn: "1 / -1", fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>
                        ✓ Follow-up will be auto-created in the Follow-up Scheduler when prescription is saved
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display:"flex", gap:"12px" }}>
                <button onClick={()=>{ setShowAdd(false); setFormLabTests([]); setFuEnabled(false); setFuDate(""); setFuReason(""); setFuSuggestion(null); setCdsWeight(""); setCdsAge(""); setCdsAllergies(""); }} style={{ flex:1, padding:"12px", borderRadius:"8px", border:"1px solid #ddd", background:"white", cursor:"pointer", fontSize:"14px", color:"#555" }}>Discard</button>
                <button onClick={savePrescription} disabled={loading} style={{ flex:2, padding:"12px", borderRadius:"8px", background:loading?"#93c5fd":"#0f4c81", color:"white", border:"none", cursor:loading?"not-allowed":"pointer", fontSize:"14px", fontWeight:"600" }}>
                  {loading?"Saving...":"Save & Issue Prescription"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal — UNCHANGED */}
      {viewPrescription && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,20,40,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:"20px" }}>
          <div className="modal-anim" style={{ background:"white", borderRadius:"16px", width:"600px", maxHeight:"90vh", overflowY:"auto", padding:"32px", boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"24px", color:"#0f4c81" }}>Prescription Details</h2>
              <button onClick={()=>setViewPrescription(null)} style={{ background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:"#999" }}>✕</button>
            </div>
            <div style={{ background:"#f8fbff", padding:"20px", borderRadius:"12px", border:"1px solid #e8f1fb", marginBottom:"24px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                <div>
                  <div style={{ fontSize:"10px", color:"#999", textTransform:"uppercase", fontWeight:"700" }}>Patient Name</div>
                  <div style={{ fontSize:"16px", fontWeight:"600", color:"#1a1a2e" }}>
                    {viewPrescription.patients?.name || patients.find(pat=>pat.id===viewPrescription.patient_id)?.name || "N/A"}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"10px", color:"#999", textTransform:"uppercase", fontWeight:"700" }}>Date</div>
                  <div style={{ fontSize:"14px", color:"#555" }}>{(viewPrescription.created_at||"").split("T")[0]}</div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom:"24px" }}>
              <h3 style={{ fontSize:"12px", color:"#0f4c81", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px", borderBottom:"1px solid #eee", paddingBottom:"8px" }}>Prescribed Medications</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {(viewPrescription.medicine||"").split("\n").map((med:string,i:number)=>(
                  <div key={i} style={{ padding:"12px", background:"#fafbfc", borderRadius:"8px", border:"1px solid #f0f0f0" }}>
                    <div style={{ fontWeight:"700", color:"#1a1a2e", marginBottom:"4px" }}>{i+1}. {med}</div>
                    <div style={{ display:"flex", gap:"16px", fontSize:"12px", color:"#666" }}>
                      <span><strong>Dosage:</strong> {(viewPrescription.dosage||"").split("\n")[i]||"—"}</span>
                      <span><strong>Duration:</strong> {(viewPrescription.duration||"").split("\n")[i]||"—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {viewPrescription.diagnosis && (
              <div style={{ marginBottom:"20px" }}>
                <div style={{ fontSize:"11px", color:"#999", fontWeight:"700", textTransform:"uppercase", marginBottom:"4px" }}>Diagnosis</div>
                <div style={{ fontSize:"14px", color:"#444" }}>{viewPrescription.diagnosis}</div>
              </div>
            )}
            {viewPrescription.notes && (
              <div style={{ marginBottom:"24px" }}>
                <div style={{ fontSize:"11px", color:"#999", fontWeight:"700", textTransform:"uppercase", marginBottom:"4px" }}>General Instructions</div>
                <div style={{ fontSize:"14px", color:"#444", padding:"12px", background:"#fffbeb", borderRadius:"8px", borderLeft:"3px solid #f59e0b" }}>{viewPrescription.notes}</div>
              </div>
            )}

            {/* ★ Linked Lab Orders */}
            {(() => {
              const linked = labOrders.filter(o => o.prescription_id === viewPrescription.id || o.patient_id === viewPrescription.patient_id);
              if (!linked.length) return null;
              return (
                <div style={{ marginBottom:"24px" }}>
                  <div style={{ fontSize:"11px", color:"#0f4c81", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px", paddingBottom:"6px", borderBottom:"1px solid #e8f1fb" }}>🔬 Lab Orders for this Patient</div>
                  {linked.map(order => {
                    const sc = STATUS_CONFIG[order.status];
                    return (
                      <div key={order.id} style={{ background:"#f8fbff", borderRadius:"8px", padding:"10px 14px", marginBottom:"8px", border:"1px solid #e0eaf6" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px", flexWrap:"wrap" }}>
                          <span style={{ background:sc.bg, color:sc.color, padding:"2px 10px", borderRadius:"12px", fontSize:"11px", fontWeight:"700" }}>{sc.icon} {order.status}</span>
                          <span style={{ fontSize:"11px", color:"#999" }}>{order.ordered_at.split("T")[0]}</span>
                        </div>
                        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                          {order.tests.map(t => (
                            <span key={t.code} style={{ background:"white", border:"1px solid #d1e3f8", color:"#1e40af", padding:"2px 8px", borderRadius:"6px", fontSize:"11px", fontWeight:"600" }}>{t.code}</span>
                          ))}
                        </div>
                        {order.result_notes && (
                          <div style={{ marginTop:"6px", fontSize:"12px", color:"#444", padding:"6px 10px", background:"#f0fdf4", borderRadius:"6px", borderLeft:"2px solid #16a34a" }}>
                            📋 {order.result_notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div style={{ display:"flex", gap:"12px" }}>
              <button onClick={()=>setViewPrescription(null)} style={{ flex:1, padding:"12px", borderRadius:"10px", border:"1px solid #ddd", background:"white", cursor:"pointer", fontWeight:"600" }}>Close</button>
              <button onClick={()=>handlePrint(viewPrescription)} style={{ flex:1, padding:"12px", borderRadius:"10px", border:"none", background:"#0f4c81", color:"white", cursor:"pointer", fontWeight:"600" }}>Print Prescription</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#888" }}>Loading...</div>}>
      <PrescriptionsPageInner />
    </Suspense>
  );
}
