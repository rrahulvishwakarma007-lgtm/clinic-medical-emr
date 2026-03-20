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
  "Renal Function", "Lipid Profile", "Coagulation", "Tumour Markers",
  "Immunology/Autoimmune", "Genetic/Molecular", "Radiology/Imaging",
  "ECG/Cardiology Procedures", "Pulmonology", "Gastroenterology",
  "Neurology", "Gynaecology/Obstetrics", "Paediatric", "Others"
] as const;

const LAB_TEST_DB: Array<{ name: string; category: typeof LAB_CATEGORIES[number]; code: string }> = [
  // ── Haematology ──────────────────────────────────────
  { name: "Complete Blood Count (CBC)", category: "Haematology", code: "CBC" },
  { name: "Haemoglobin (Hb)", category: "Haematology", code: "HB" },
  { name: "WBC Differential Count", category: "Haematology", code: "WBCDIFF" },
  { name: "Platelet Count", category: "Haematology", code: "PLT" },
  { name: "ESR (Erythrocyte Sedimentation Rate)", category: "Haematology", code: "ESR" },
  { name: "Peripheral Blood Smear", category: "Haematology", code: "PBS" },
  { name: "Reticulocyte Count", category: "Haematology", code: "RETIC" },
  { name: "Packed Cell Volume (PCV / Haematocrit)", category: "Haematology", code: "PCV" },
  { name: "Mean Corpuscular Volume (MCV)", category: "Haematology", code: "MCV" },
  { name: "Mean Corpuscular Haemoglobin (MCH)", category: "Haematology", code: "MCH" },
  { name: "MCHC", category: "Haematology", code: "MCHC" },
  { name: "Red Cell Distribution Width (RDW)", category: "Haematology", code: "RDW" },
  { name: "Absolute Neutrophil Count (ANC)", category: "Haematology", code: "ANC" },
  { name: "Absolute Eosinophil Count (AEC)", category: "Haematology", code: "AEC" },
  { name: "Absolute Lymphocyte Count (ALC)", category: "Haematology", code: "ALC" },
  { name: "Sickling Test", category: "Haematology", code: "SICKLE" },
  { name: "Haemoglobin Electrophoresis", category: "Haematology", code: "HBEP" },
  { name: "G6PD Quantitative Assay", category: "Haematology", code: "G6PD" },
  { name: "Blood Group & Rh Type (ABO + Rh)", category: "Haematology", code: "BLOODGRP" },
  { name: "Cross Match (Pre-transfusion)", category: "Haematology", code: "XMATCH" },
  { name: "Direct Coombs Test (DAT)", category: "Haematology", code: "DCT" },
  { name: "Indirect Coombs Test (IAT)", category: "Haematology", code: "ICT" },
  { name: "Osmotic Fragility Test", category: "Haematology", code: "OFT" },
  { name: "Bone Marrow Aspiration (BMA)", category: "Haematology", code: "BMA" },
  { name: "Bone Marrow Biopsy (BMB)", category: "Haematology", code: "BMB" },

  // ── Biochemistry ──────────────────────────────────────
  { name: "Random Blood Sugar (RBS)", category: "Biochemistry", code: "RBS" },
  { name: "Fasting Blood Sugar (FBS)", category: "Biochemistry", code: "FBS" },
  { name: "Post Prandial Blood Sugar (PPBS)", category: "Biochemistry", code: "PPBS" },
  { name: "HbA1c (Glycated Haemoglobin)", category: "Biochemistry", code: "HBA1C" },
  { name: "Serum Electrolytes (Na/K/Cl)", category: "Biochemistry", code: "ELEC" },
  { name: "Serum Sodium (Na)", category: "Biochemistry", code: "NA" },
  { name: "Serum Potassium (K)", category: "Biochemistry", code: "K" },
  { name: "Serum Chloride (Cl)", category: "Biochemistry", code: "CL" },
  { name: "Serum Calcium (Total)", category: "Biochemistry", code: "CA" },
  { name: "Serum Calcium (Ionised)", category: "Biochemistry", code: "ICAL" },
  { name: "Serum Phosphorus", category: "Biochemistry", code: "PHOS" },
  { name: "Serum Magnesium", category: "Biochemistry", code: "MG" },
  { name: "Serum Bicarbonate (HCO3)", category: "Biochemistry", code: "HCO3" },
  { name: "Arterial Blood Gas (ABG)", category: "Biochemistry", code: "ABG" },
  { name: "Uric Acid (Serum)", category: "Biochemistry", code: "UA" },
  { name: "Serum Iron", category: "Biochemistry", code: "IRON" },
  { name: "TIBC (Total Iron Binding Capacity)", category: "Biochemistry", code: "TIBC" },
  { name: "Serum Ferritin", category: "Biochemistry", code: "FERR" },
  { name: "Serum Transferrin Saturation", category: "Biochemistry", code: "TFSAT" },
  { name: "Serum Vitamin B12", category: "Biochemistry", code: "B12" },
  { name: "Serum Vitamin D (25-OH)", category: "Biochemistry", code: "VITD" },
  { name: "Serum Folate (Folic Acid)", category: "Biochemistry", code: "FOLATE" },
  { name: "Serum Zinc", category: "Biochemistry", code: "ZN" },
  { name: "Serum Copper", category: "Biochemistry", code: "CU" },
  { name: "Serum Selenium", category: "Biochemistry", code: "SE" },
  { name: "Plasma Lactate", category: "Biochemistry", code: "LAC" },
  { name: "Serum Ammonia", category: "Biochemistry", code: "AMM" },
  { name: "Blood Ketones (Beta-hydroxybutyrate)", category: "Biochemistry", code: "KETONE" },
  { name: "Plasma Glucose (Bedside POCT)", category: "Biochemistry", code: "GLUC" },
  { name: "Oral Glucose Tolerance Test (OGTT 75g)", category: "Biochemistry", code: "OGTT" },
  { name: "Serum Protein (Total)", category: "Biochemistry", code: "TP" },
  { name: "Serum Globulin", category: "Biochemistry", code: "GLOB" },
  { name: "Serum Albumin", category: "Biochemistry", code: "ALB" },
  { name: "A:G Ratio (Albumin:Globulin)", category: "Biochemistry", code: "AGRATIO" },
  { name: "Serum Urea", category: "Biochemistry", code: "UREA" },
  { name: "Serum Creatinine", category: "Biochemistry", code: "CREAT" },
  { name: "Blood Urea Nitrogen (BUN)", category: "Biochemistry", code: "BUN" },
  { name: "eGFR (Estimated Glomerular Filtration Rate)", category: "Biochemistry", code: "EGFR" },
  { name: "Cystatin C", category: "Biochemistry", code: "CYSTC" },
  { name: "Serum Amylase", category: "Biochemistry", code: "AMYL" },
  { name: "Serum Lipase", category: "Biochemistry", code: "LIPASE" },
  { name: "Serum Cholinesterase", category: "Biochemistry", code: "CHOL_E" },
  { name: "Plasma Cortisol (8 AM)", category: "Biochemistry", code: "CORT8" },
  { name: "Plasma Cortisol (4 PM)", category: "Biochemistry", code: "CORT4" },

  // ── Liver Function ────────────────────────────────────
  { name: "Liver Function Test (LFT) — Complete", category: "Liver Function", code: "LFT" },
  { name: "SGOT / AST", category: "Liver Function", code: "SGOT" },
  { name: "SGPT / ALT", category: "Liver Function", code: "SGPT" },
  { name: "Total Bilirubin", category: "Liver Function", code: "TBIL" },
  { name: "Direct (Conjugated) Bilirubin", category: "Liver Function", code: "DBIL" },
  { name: "Indirect (Unconjugated) Bilirubin", category: "Liver Function", code: "IBIL" },
  { name: "Alkaline Phosphatase (ALP)", category: "Liver Function", code: "ALP" },
  { name: "GGT (Gamma-Glutamyl Transferase)", category: "Liver Function", code: "GGT" },
  { name: "5'-Nucleotidase", category: "Liver Function", code: "5NT" },
  { name: "LDH (Lactate Dehydrogenase)", category: "Liver Function", code: "LDH" },
  { name: "Prothrombin Time (PT / INR)", category: "Coagulation", code: "PT" },
  { name: "Serum Ceruloplasmin", category: "Liver Function", code: "CERULO" },
  { name: "Serum Copper (24hr Urine)", category: "Liver Function", code: "UCOP" },
  { name: "Alpha-1 Antitrypsin", category: "Liver Function", code: "A1AT" },
  { name: "Liver Biopsy", category: "Liver Function", code: "LIVERBX" },
  { name: "FibroScan (Liver Elastography)", category: "Liver Function", code: "FIBROSCAN" },

  // ── Renal Function ────────────────────────────────────
  { name: "Renal Function Test (RFT) — Complete", category: "Renal Function", code: "RFT" },
  { name: "24-Hour Urine Creatinine Clearance", category: "Renal Function", code: "CRC" },
  { name: "24-Hour Urine Protein", category: "Renal Function", code: "U24P" },
  { name: "Spot Urine Protein:Creatinine Ratio (PCR)", category: "Renal Function", code: "UPCR" },
  { name: "Urine Microalbumin:Creatinine Ratio (ACR)", category: "Renal Function", code: "ACR" },
  { name: "Urine Beta-2 Microglobulin", category: "Renal Function", code: "UB2M" },
  { name: "Renal Biopsy", category: "Renal Function", code: "RENALBX" },
  { name: "Urine Oxalate (24hr)", category: "Renal Function", code: "UOXAL" },
  { name: "Urine Uric Acid (24hr)", category: "Renal Function", code: "UURIC" },
  { name: "Urine Calcium (24hr)", category: "Renal Function", code: "UCALC" },

  // ── Lipid Profile ─────────────────────────────────────
  { name: "Lipid Profile (Complete)", category: "Lipid Profile", code: "LIPID" },
  { name: "Total Cholesterol", category: "Lipid Profile", code: "TC" },
  { name: "HDL Cholesterol (Good Cholesterol)", category: "Lipid Profile", code: "HDL" },
  { name: "LDL Cholesterol (Bad Cholesterol)", category: "Lipid Profile", code: "LDL" },
  { name: "VLDL Cholesterol", category: "Lipid Profile", code: "VLDL" },
  { name: "Triglycerides (TG)", category: "Lipid Profile", code: "TG" },
  { name: "Non-HDL Cholesterol", category: "Lipid Profile", code: "NHDL" },
  { name: "Lipoprotein(a) — Lp(a)", category: "Lipid Profile", code: "LPA" },
  { name: "ApoA1 (Apolipoprotein A1)", category: "Lipid Profile", code: "APOA1" },
  { name: "ApoB (Apolipoprotein B)", category: "Lipid Profile", code: "APOB" },
  { name: "sdLDL (Small Dense LDL)", category: "Lipid Profile", code: "SDLDL" },
  { name: "Homocysteine (Serum)", category: "Lipid Profile", code: "HCYST" },

  // ── Coagulation ───────────────────────────────────────
  { name: "Prothrombin Time (PT)", category: "Coagulation", code: "PT_INR" },
  { name: "INR (International Normalised Ratio)", category: "Coagulation", code: "INR" },
  { name: "APTT (Activated Partial Thromboplastin Time)", category: "Coagulation", code: "APTT" },
  { name: "D-Dimer", category: "Coagulation", code: "DDIMER" },
  { name: "Fibrinogen", category: "Coagulation", code: "FIB" },
  { name: "Bleeding Time (BT)", category: "Coagulation", code: "BT" },
  { name: "Clotting Time (CT)", category: "Coagulation", code: "CT" },
  { name: "Thrombin Time (TT)", category: "Coagulation", code: "TT" },
  { name: "Protein C Activity", category: "Coagulation", code: "PROTC" },
  { name: "Protein S Activity", category: "Coagulation", code: "PROTS" },
  { name: "Anti-Thrombin III (AT-III)", category: "Coagulation", code: "AT3" },
  { name: "Factor V Leiden Mutation", category: "Coagulation", code: "FVL" },
  { name: "Prothrombin Gene Mutation (G20210A)", category: "Coagulation", code: "PGM" },
  { name: "Platelet Aggregation Study", category: "Coagulation", code: "PLTAGG" },
  { name: "Thromboelastogram (TEG)", category: "Coagulation", code: "TEG" },

  // ── Endocrinology ─────────────────────────────────────
  { name: "TSH (Thyroid Stimulating Hormone)", category: "Endocrinology", code: "TSH" },
  { name: "T3 (Triiodothyronine — Total)", category: "Endocrinology", code: "T3" },
  { name: "T4 (Thyroxine — Total)", category: "Endocrinology", code: "T4" },
  { name: "Free T3 (fT3)", category: "Endocrinology", code: "FT3" },
  { name: "Free T4 (fT4)", category: "Endocrinology", code: "FT4" },
  { name: "Anti-TPO Antibody (Anti-Thyroid Peroxidase)", category: "Endocrinology", code: "ANTITPO" },
  { name: "Anti-Thyroglobulin Antibody", category: "Endocrinology", code: "ANTITG" },
  { name: "Thyroglobulin (Tg)", category: "Endocrinology", code: "TG_THYROID" },
  { name: "TSH Receptor Antibody (TRAb)", category: "Endocrinology", code: "TRAB" },
  { name: "Plasma Cortisol (Morning)", category: "Endocrinology", code: "CORT" },
  { name: "ACTH (Adrenocorticotropic Hormone)", category: "Endocrinology", code: "ACTH" },
  { name: "DHEA-S (Dehydroepiandrosterone Sulphate)", category: "Endocrinology", code: "DHEAS" },
  { name: "17-OH Progesterone", category: "Endocrinology", code: "17OHP" },
  { name: "Fasting Insulin", category: "Endocrinology", code: "INSF" },
  { name: "C-Peptide (Fasting)", category: "Endocrinology", code: "CPEP" },
  { name: "HOMA-IR (Insulin Resistance Index)", category: "Endocrinology", code: "HOMA" },
  { name: "FSH (Follicle Stimulating Hormone)", category: "Endocrinology", code: "FSH" },
  { name: "LH (Luteinising Hormone)", category: "Endocrinology", code: "LH" },
  { name: "Prolactin (PRL)", category: "Endocrinology", code: "PRL" },
  { name: "Estradiol (E2)", category: "Endocrinology", code: "E2" },
  { name: "Progesterone", category: "Endocrinology", code: "PROG" },
  { name: "Testosterone (Total)", category: "Endocrinology", code: "TESTO" },
  { name: "Testosterone (Free)", category: "Endocrinology", code: "FTESTO" },
  { name: "AMH (Anti-Müllerian Hormone)", category: "Endocrinology", code: "AMH" },
  { name: "Androstenedione", category: "Endocrinology", code: "ANDRO" },
  { name: "IGF-1 (Insulin-like Growth Factor 1)", category: "Endocrinology", code: "IGF1" },
  { name: "Growth Hormone (GH — Random)", category: "Endocrinology", code: "GH" },
  { name: "PTH (Parathyroid Hormone — intact)", category: "Endocrinology", code: "PTH" },
  { name: "Aldosterone (Serum)", category: "Endocrinology", code: "ALDO" },
  { name: "Plasma Renin Activity (PRA)", category: "Endocrinology", code: "PRA" },
  { name: "Aldosterone:Renin Ratio (ARR)", category: "Endocrinology", code: "ARR" },
  { name: "Urine VMA (Vanillylmandelic Acid) — 24hr", category: "Endocrinology", code: "VMA" },
  { name: "Plasma Metanephrines", category: "Endocrinology", code: "PMETA" },
  { name: "Chromogranin A", category: "Endocrinology", code: "CHROMA" },
  { name: "Gastrin (Serum)", category: "Endocrinology", code: "GASTR" },

  // ── Cardiology ────────────────────────────────────────
  { name: "Troponin I (High Sensitivity — hsTnI)", category: "Cardiology", code: "TROPI" },
  { name: "Troponin T (High Sensitivity — hsTnT)", category: "Cardiology", code: "TROPT" },
  { name: "CK-MB (Creatine Kinase-MB)", category: "Cardiology", code: "CKMB" },
  { name: "Total CPK (Creatine Phosphokinase)", category: "Cardiology", code: "CPK" },
  { name: "Myoglobin (Serum)", category: "Cardiology", code: "MYOG" },
  { name: "BNP (B-type Natriuretic Peptide)", category: "Cardiology", code: "BNP" },
  { name: "NT-proBNP", category: "Cardiology", code: "NTPROBNP" },
  { name: "hs-CRP (High Sensitivity C-Reactive Protein)", category: "Cardiology", code: "HSCRP" },
  { name: "LDH (Lactate Dehydrogenase)", category: "Cardiology", code: "LDH_C" },
  { name: "Lipoprotein-Associated Phospholipase A2 (Lp-PLA2)", category: "Cardiology", code: "LPPLA2" },

  // ── Serology / Immunology ────────────────────────────
  { name: "CRP (C-Reactive Protein)", category: "Serology/Immunology", code: "CRP" },
  { name: "RA Factor (Rheumatoid Factor)", category: "Serology/Immunology", code: "RAF" },
  { name: "ASO Titre (Antistreptolysin O)", category: "Serology/Immunology", code: "ASO" },
  { name: "Widal Test (Typhoid)", category: "Serology/Immunology", code: "WIDAL" },
  { name: "Dengue NS1 Antigen (RDT)", category: "Serology/Immunology", code: "DENGNS1" },
  { name: "Dengue IgG Antibody", category: "Serology/Immunology", code: "DENGIGG" },
  { name: "Dengue IgM Antibody", category: "Serology/Immunology", code: "DENGIGM" },
  { name: "Dengue NS1 + IgG + IgM (Combo)", category: "Serology/Immunology", code: "DENGCOMBO" },
  { name: "Malaria Antigen Test RDT (P.falciparum + P.vivax)", category: "Serology/Immunology", code: "MAL" },
  { name: "Malaria MP Smear (Thick + Thin)", category: "Serology/Immunology", code: "MPSMEAR" },
  { name: "HBsAg (Hepatitis B Surface Antigen)", category: "Serology/Immunology", code: "HBSAG" },
  { name: "Anti-HBs (Hepatitis B Surface Antibody)", category: "Serology/Immunology", code: "ANTIHBS" },
  { name: "Anti-HBc IgM", category: "Serology/Immunology", code: "ANTIHBCM" },
  { name: "Anti-HBc Total", category: "Serology/Immunology", code: "ANTIHBCT" },
  { name: "HBeAg (Hepatitis B e-Antigen)", category: "Serology/Immunology", code: "HBEAG" },
  { name: "Anti-HBe (Hepatitis B e-Antibody)", category: "Serology/Immunology", code: "ANTIHBE" },
  { name: "HBV DNA (Quantitative PCR)", category: "Serology/Immunology", code: "HBVDNA" },
  { name: "Anti-HCV (Hepatitis C Antibody)", category: "Serology/Immunology", code: "HCV" },
  { name: "HCV RNA (Quantitative PCR)", category: "Serology/Immunology", code: "HCVRNA" },
  { name: "HAV IgM (Hepatitis A)", category: "Serology/Immunology", code: "HAVIGG" },
  { name: "HEV IgM (Hepatitis E)", category: "Serology/Immunology", code: "HEVIGG" },
  { name: "HIV 1 & 2 (ELISA)", category: "Serology/Immunology", code: "HIV" },
  { name: "HIV p24 Antigen (4th Gen)", category: "Serology/Immunology", code: "HIVP24" },
  { name: "HIV Viral Load (Quantitative)", category: "Serology/Immunology", code: "HIVVL" },
  { name: "CD4 Count (T-Helper Cells)", category: "Serology/Immunology", code: "CD4" },
  { name: "VDRL (Syphilis Screening)", category: "Serology/Immunology", code: "VDRL" },
  { name: "TPHA (Treponema Pallidum Haemagglutination)", category: "Serology/Immunology", code: "TPHA" },
  { name: "COVID-19 Antigen Test (RAT)", category: "Serology/Immunology", code: "COVIDRAT" },
  { name: "COVID-19 RT-PCR", category: "Serology/Immunology", code: "COVIDPCR" },
  { name: "COVID-19 IgG Antibody", category: "Serology/Immunology", code: "COVIDIGG" },
  { name: "H. pylori Antigen (Stool)", category: "Serology/Immunology", code: "HPYLST" },
  { name: "H. pylori IgG Antibody (Serum)", category: "Serology/Immunology", code: "HPYLS" },
  { name: "H. pylori Urea Breath Test (UBT)", category: "Serology/Immunology", code: "HPYLUBT" },
  { name: "Leptospira IgM (MAT / ELISA)", category: "Serology/Immunology", code: "LEPTO" },
  { name: "Scrub Typhus IgM (Orientia tsutsugamushi)", category: "Serology/Immunology", code: "SCRUB" },
  { name: "Rickettsia IgG / IgM", category: "Serology/Immunology", code: "RICK" },
  { name: "Chikungunya IgM", category: "Serology/Immunology", code: "CHIK" },
  { name: "Zika Virus IgM / PCR", category: "Serology/Immunology", code: "ZIKA" },
  { name: "EBV (Epstein-Barr Virus) IgM / IgG", category: "Serology/Immunology", code: "EBV" },
  { name: "CMV (Cytomegalovirus) IgM / IgG", category: "Serology/Immunology", code: "CMV" },
  { name: "HSV 1 & 2 IgM / IgG", category: "Serology/Immunology", code: "HSV" },
  { name: "Toxoplasma IgM / IgG", category: "Serology/Immunology", code: "TOXO" },
  { name: "Brucella Antibody (Rose Bengal / Weil Felix)", category: "Serology/Immunology", code: "BRUC" },

  // ── Immunology / Autoimmune ───────────────────────────
  { name: "ANA (Antinuclear Antibody) — Screening", category: "Immunology/Autoimmune", code: "ANA" },
  { name: "ANA Profile (12 antibodies)", category: "Immunology/Autoimmune", code: "ANAPROF" },
  { name: "Anti-dsDNA Antibody", category: "Immunology/Autoimmune", code: "DSDNA" },
  { name: "Anti-Smith (Sm) Antibody", category: "Immunology/Autoimmune", code: "ANSM" },
  { name: "Anti-Ro (SSA) Antibody", category: "Immunology/Autoimmune", code: "ANRO" },
  { name: "Anti-La (SSB) Antibody", category: "Immunology/Autoimmune", code: "ANLA" },
  { name: "Anti-Scl-70 Antibody", category: "Immunology/Autoimmune", code: "ANSCL" },
  { name: "Anti-Jo-1 Antibody", category: "Immunology/Autoimmune", code: "ANJO1" },
  { name: "Anti-CCP Antibody (Anti-Cyclic Citrullinated Peptide)", category: "Immunology/Autoimmune", code: "ACCP" },
  { name: "Anti-MCV Antibody", category: "Immunology/Autoimmune", code: "ANMCV" },
  { name: "ANCA (p-ANCA + c-ANCA)", category: "Immunology/Autoimmune", code: "ANCA" },
  { name: "Anti-GBM (Anti-Glomerular Basement Membrane)", category: "Immunology/Autoimmune", code: "ANGBM" },
  { name: "Complement C3", category: "Immunology/Autoimmune", code: "C3" },
  { name: "Complement C4", category: "Immunology/Autoimmune", code: "C4" },
  { name: "CH50 (Total Haemolytic Complement)", category: "Immunology/Autoimmune", code: "CH50" },
  { name: "Anti-Phospholipid Antibody (APLA) Panel", category: "Immunology/Autoimmune", code: "APLA" },
  { name: "Lupus Anticoagulant", category: "Immunology/Autoimmune", code: "LUPAC" },
  { name: "Anti-Cardiolipin IgG / IgM", category: "Immunology/Autoimmune", code: "ACARDIO" },
  { name: "Beta-2 Glycoprotein I Antibody", category: "Immunology/Autoimmune", code: "B2GPI" },
  { name: "IgE Total (Allergy Screening)", category: "Immunology/Autoimmune", code: "IGE" },
  { name: "IgE Specific (RAST Panel — Food)", category: "Immunology/Autoimmune", code: "IGEFD" },
  { name: "IgE Specific (RAST Panel — Inhalants)", category: "Immunology/Autoimmune", code: "IGEIN" },
  { name: "IgG Subclasses (1, 2, 3, 4)", category: "Immunology/Autoimmune", code: "IGGSUB" },
  { name: "Serum IgA", category: "Immunology/Autoimmune", code: "IGA" },
  { name: "Anti-tTG IgA (Tissue Transglutaminase — Coeliac)", category: "Immunology/Autoimmune", code: "TTGA" },
  { name: "Anti-Endomysial IgA (EMA)", category: "Immunology/Autoimmune", code: "EMA" },
  { name: "Anti-Gliadin IgG / IgA", category: "Immunology/Autoimmune", code: "AGLIA" },
  { name: "Insulin Antibody (IAA)", category: "Immunology/Autoimmune", code: "IAA" },
  { name: "Anti-GAD Antibody (GADA)", category: "Immunology/Autoimmune", code: "GADA" },
  { name: "Islet Cell Antibody (ICA)", category: "Immunology/Autoimmune", code: "ICA" },
  { name: "Anti-Intrinsic Factor Antibody", category: "Immunology/Autoimmune", code: "ANIF" },
  { name: "Anti-Parietal Cell Antibody", category: "Immunology/Autoimmune", code: "ANPC" },

  // ── Urine & Stool ─────────────────────────────────────
  { name: "Urine Routine & Microscopy (R/M)", category: "Urine & Stool", code: "URINE" },
  { name: "Urine Culture & Sensitivity (C&S)", category: "Urine & Stool", code: "URINECS" },
  { name: "Urine Pregnancy Test (UPT / Beta HCG Urine)", category: "Urine & Stool", code: "UPT" },
  { name: "Urine Microalbumin", category: "Urine & Stool", code: "UMICRO" },
  { name: "24hr Urine Protein", category: "Urine & Stool", code: "U24P_U" },
  { name: "Urine Bence Jones Protein", category: "Urine & Stool", code: "UBJP" },
  { name: "Urine for Casts (Microscopy)", category: "Urine & Stool", code: "UCASTS" },
  { name: "Urine Glucose (Fasting)", category: "Urine & Stool", code: "UGLUC" },
  { name: "Urine Ketone Bodies", category: "Urine & Stool", code: "UKETONE" },
  { name: "Urine Porphyrins", category: "Urine & Stool", code: "UPORPHYR" },
  { name: "Urine Drug Screen (8-Panel)", category: "Urine & Stool", code: "UDRUG" },
  { name: "Stool Routine & Microscopy (R/E)", category: "Urine & Stool", code: "STOOL" },
  { name: "Stool Culture & Sensitivity", category: "Urine & Stool", code: "STOOLCS" },
  { name: "Stool Occult Blood (FOB / FOBT)", category: "Urine & Stool", code: "FOB" },
  { name: "Stool for Ova & Parasites", category: "Urine & Stool", code: "STOOLOP" },
  { name: "Stool Calprotectin", category: "Urine & Stool", code: "STOOLCAL" },
  { name: "Stool H. pylori Antigen", category: "Urine & Stool", code: "STOOLHP" },
  { name: "Stool Norovirus / Rotavirus Antigen", category: "Urine & Stool", code: "STOOLRV" },

  // ── Microbiology ──────────────────────────────────────
  { name: "Blood Culture & Sensitivity (Aerobic)", category: "Microbiology", code: "BLOODCS" },
  { name: "Blood Culture & Sensitivity (Anaerobic)", category: "Microbiology", code: "BLOODCSA" },
  { name: "Sputum Culture & Sensitivity", category: "Microbiology", code: "SPUTCS" },
  { name: "Sputum AFB Smear (ZN Stain) × 3", category: "Microbiology", code: "SPUTAFB" },
  { name: "Sputum for TB Culture (LJ Medium)", category: "Microbiology", code: "SPUTAFBCX" },
  { name: "Throat Swab Culture & Sensitivity", category: "Microbiology", code: "THROATCS" },
  { name: "Nasal Swab Culture", category: "Microbiology", code: "NASALCS" },
  { name: "Wound Swab Culture & Sensitivity", category: "Microbiology", code: "WOUNDCS" },
  { name: "Pus Culture & Sensitivity", category: "Microbiology", code: "PUSCS" },
  { name: "High Vaginal Swab (HVS) Culture", category: "Microbiology", code: "HVSCS" },
  { name: "Urethral Discharge Culture", category: "Microbiology", code: "UREDCS" },
  { name: "Endocervical Swab Culture", category: "Microbiology", code: "CERVCS" },
  { name: "KOH Preparation (Fungal)", category: "Microbiology", code: "KOH" },
  { name: "Fungal Culture (Skin / Nail / Hair)", category: "Microbiology", code: "FUNGALCX" },
  { name: "TB NAAT / GeneXpert MTB/RIF (Sputum)", category: "Microbiology", code: "GENEX" },
  { name: "TB GeneXpert (BAL / Tissue / CSF)", category: "Microbiology", code: "GENEX2" },
  { name: "Mantoux Test (TST — PPD 5TU)", category: "Microbiology", code: "MANTOUX" },
  { name: "IGRA (QuantiFERON-TB Gold)", category: "Microbiology", code: "QFTB" },
  { name: "CSF Culture & Sensitivity", category: "Microbiology", code: "CSFCS" },
  { name: "CSF Routine & Microscopy", category: "Microbiology", code: "CSFRM" },
  { name: "CSF Protein", category: "Microbiology", code: "CSFPROT" },
  { name: "CSF Glucose", category: "Microbiology", code: "CSFGLUC" },
  { name: "CSF AFB Smear", category: "Microbiology", code: "CSFAFB" },
  { name: "CSF Cryptococcal Antigen (CrAg)", category: "Microbiology", code: "CSFCRAG" },
  { name: "CSF India Ink Preparation", category: "Microbiology", code: "CSFINDIA" },
  { name: "Pleural Fluid Analysis (LDH, Protein, Cell Count)", category: "Microbiology", code: "PLEURAL" },
  { name: "Pleural Fluid Culture & Sensitivity", category: "Microbiology", code: "PLEURALCS" },
  { name: "Ascitic Fluid Analysis (SAAG, Protein, LDH)", category: "Microbiology", code: "ASCITES" },
  { name: "Ascitic Fluid Culture", category: "Microbiology", code: "ASCITESCS" },
  { name: "Synovial Fluid Analysis", category: "Microbiology", code: "SYNOVIAL" },
  { name: "Synovial Fluid Crystal Analysis (Gout / CPPD)", category: "Microbiology", code: "SYNOCRYST" },
  { name: "Meningococcal Antigen (CSF)", category: "Microbiology", code: "MENING" },
  { name: "MRSA Screening Swab", category: "Microbiology", code: "MRSA" },
  { name: "VRE Screening Swab", category: "Microbiology", code: "VRE" },
  { name: "Clostridium difficile Toxin (Stool)", category: "Microbiology", code: "CDIFF" },

  // ── Tumour Markers ────────────────────────────────────
  { name: "PSA (Prostate Specific Antigen — Total)", category: "Tumour Markers", code: "PSA" },
  { name: "Free PSA (f-PSA) + PSA Ratio", category: "Tumour Markers", code: "FPSA" },
  { name: "CA 125 (Ovarian Cancer Marker)", category: "Tumour Markers", code: "CA125" },
  { name: "CA 19-9 (Pancreatic / GI Cancer)", category: "Tumour Markers", code: "CA199" },
  { name: "CA 15-3 (Breast Cancer Marker)", category: "Tumour Markers", code: "CA153" },
  { name: "CA 72-4 (Gastric Cancer)", category: "Tumour Markers", code: "CA724" },
  { name: "CEA (Carcinoembryonic Antigen)", category: "Tumour Markers", code: "CEA" },
  { name: "AFP (Alpha-Fetoprotein)", category: "Tumour Markers", code: "AFP" },
  { name: "Beta HCG (Quantitative — Serum)", category: "Tumour Markers", code: "BHCG" },
  { name: "LDH (Lactate Dehydrogenase — Tumour)", category: "Tumour Markers", code: "LDH_T" },
  { name: "Uric Acid (Tumour Lysis)", category: "Tumour Markers", code: "UA_T" },
  { name: "S100 Protein (Melanoma)", category: "Tumour Markers", code: "S100" },
  { name: "NSE (Neuron Specific Enolase)", category: "Tumour Markers", code: "NSE" },
  { name: "Cyfra 21-1 (Lung SCC)", category: "Tumour Markers", code: "CYFRA" },
  { name: "SCC Antigen (Squamous Cell Carcinoma)", category: "Tumour Markers", code: "SCC" },
  { name: "Thyroglobulin (Post-thyroidectomy)", category: "Tumour Markers", code: "THYROGLOB" },
  { name: "Calcitonin (MTC Marker)", category: "Tumour Markers", code: "CALCI" },
  { name: "HE4 (Human Epididymis Protein 4 — Ovarian)", category: "Tumour Markers", code: "HE4" },
  { name: "ROMA Score (CA125 + HE4)", category: "Tumour Markers", code: "ROMA" },
  { name: "Serum Protein Electrophoresis (SPEP)", category: "Tumour Markers", code: "SPEP" },
  { name: "Urine Protein Electrophoresis (UPEP)", category: "Tumour Markers", code: "UPEP" },
  { name: "Serum Free Light Chains (Kappa + Lambda)", category: "Tumour Markers", code: "SFLC" },
  { name: "Beta-2 Microglobulin (Myeloma)", category: "Tumour Markers", code: "B2MG" },

  // ── Genetic / Molecular ───────────────────────────────
  { name: "Karyotype (Chromosomal Analysis)", category: "Genetic/Molecular", code: "KARYO" },
  { name: "FISH (Fluorescence In Situ Hybridisation)", category: "Genetic/Molecular", code: "FISH" },
  { name: "BCR-ABL PCR (CML — Philadelphia Chromosome)", category: "Genetic/Molecular", code: "BCRABL" },
  { name: "JAK2 V617F Mutation", category: "Genetic/Molecular", code: "JAK2" },
  { name: "CALR Mutation", category: "Genetic/Molecular", code: "CALR" },
  { name: "MPL Mutation", category: "Genetic/Molecular", code: "MPL" },
  { name: "FLT3 Mutation (AML)", category: "Genetic/Molecular", code: "FLT3" },
  { name: "NPM1 Mutation (AML)", category: "Genetic/Molecular", code: "NPM1" },
  { name: "BRCA1 / BRCA2 Gene Mutation", category: "Genetic/Molecular", code: "BRCA" },
  { name: "EGFR Mutation (NSCLC)", category: "Genetic/Molecular", code: "EGFR_M" },
  { name: "ALK Rearrangement (NSCLC)", category: "Genetic/Molecular", code: "ALK" },
  { name: "ROS1 Rearrangement", category: "Genetic/Molecular", code: "ROS1" },
  { name: "KRAS / NRAS Mutation", category: "Genetic/Molecular", code: "KRAS" },
  { name: "BRAF V600E Mutation", category: "Genetic/Molecular", code: "BRAF" },
  { name: "Microsatellite Instability (MSI) Testing", category: "Genetic/Molecular", code: "MSI" },
  { name: "PD-L1 Expression (IHC)", category: "Genetic/Molecular", code: "PDL1" },
  { name: "HER2 (ERBB2) Amplification (Breast / Gastric)", category: "Genetic/Molecular", code: "HER2" },
  { name: "DPYD Gene Mutation (5-FU Toxicity)", category: "Genetic/Molecular", code: "DPYD" },
  { name: "Thalassaemia Gene Mutation Panel", category: "Genetic/Molecular", code: "THAL" },
  { name: "Prenatal Chromosomal Microarray", category: "Genetic/Molecular", code: "CMA" },
  { name: "Non-Invasive Prenatal Testing (NIPT)", category: "Genetic/Molecular", code: "NIPT" },
  { name: "Fragile X Syndrome (FMR1 PCR)", category: "Genetic/Molecular", code: "FRAGX" },
  { name: "Wilson Disease (ATP7B Mutation)", category: "Genetic/Molecular", code: "WILSON" },
  { name: "MTHFR Gene Mutation", category: "Genetic/Molecular", code: "MTHFR" },
  { name: "HLA-B27 Typing", category: "Genetic/Molecular", code: "HLAB27" },
  { name: "HLA Typing (Transplant)", category: "Genetic/Molecular", code: "HLA" },
  { name: "Pharmacogenomics Panel (Drug Metabolism)", category: "Genetic/Molecular", code: "PGX" },

  // ── Radiology / Imaging ───────────────────────────────
  { name: "Chest X-Ray (PA View)", category: "Radiology/Imaging", code: "CXR" },
  { name: "Chest X-Ray (AP + Lateral)", category: "Radiology/Imaging", code: "CXRAL" },
  { name: "X-Ray Abdomen (Erect + Supine)", category: "Radiology/Imaging", code: "XRAYABD" },
  { name: "X-Ray Spine (Cervical / Lumbar / Thoracic)", category: "Radiology/Imaging", code: "XRAYSP" },
  { name: "X-Ray Knee (AP + Lateral)", category: "Radiology/Imaging", code: "XRAYKNEE" },
  { name: "X-Ray Hip (AP + Lateral)", category: "Radiology/Imaging", code: "XRAYHIP" },
  { name: "X-Ray Shoulder", category: "Radiology/Imaging", code: "XRAYSHLD" },
  { name: "X-Ray Wrist / Hand", category: "Radiology/Imaging", code: "XRAYWRIST" },
  { name: "X-Ray Pelvis (AP)", category: "Radiology/Imaging", code: "XRAYPELV" },
  { name: "X-Ray Skull (AP + Lateral)", category: "Radiology/Imaging", code: "XRAYSKULL" },
  { name: "X-Ray PNS (Paranasal Sinuses)", category: "Radiology/Imaging", code: "XRAYPNS" },
  { name: "USG Abdomen (Upper + Lower)", category: "Radiology/Imaging", code: "USGABD" },
  { name: "USG Pelvis (Pelvic)", category: "Radiology/Imaging", code: "USGPELV" },
  { name: "USG KUB (Kidney, Ureter, Bladder)", category: "Radiology/Imaging", code: "USGKUB" },
  { name: "USG Neck (Thyroid + Parathyroid)", category: "Radiology/Imaging", code: "USGNECK" },
  { name: "USG Whole Abdomen", category: "Radiology/Imaging", code: "USGFULL" },
  { name: "USG Breast (Both)", category: "Radiology/Imaging", code: "USGBREAST" },
  { name: "USG Testicular / Scrotal", category: "Radiology/Imaging", code: "USGTESTE" },
  { name: "USG Obstetric (Dating / Anomaly)", category: "Radiology/Imaging", code: "USGOBS" },
  { name: "USG Guided FNAC / Biopsy", category: "Radiology/Imaging", code: "USGFNAC" },
  { name: "CT Scan Head (Plain)", category: "Radiology/Imaging", code: "CTHP" },
  { name: "CT Scan Head (Contrast)", category: "Radiology/Imaging", code: "CTHC" },
  { name: "CT Chest (HRCT)", category: "Radiology/Imaging", code: "HRCT" },
  { name: "CT Chest (Plain + Contrast)", category: "Radiology/Imaging", code: "CTCHEST" },
  { name: "CT Abdomen + Pelvis (Plain)", category: "Radiology/Imaging", code: "CTABDP" },
  { name: "CT Abdomen + Pelvis (Contrast)", category: "Radiology/Imaging", code: "CTABDC" },
  { name: "CT Coronary Angiography (CTCA)", category: "Radiology/Imaging", code: "CTCA" },
  { name: "CT Pulmonary Angiography (CTPA)", category: "Radiology/Imaging", code: "CTPA" },
  { name: "CT Spine (Cervical / Lumbar)", category: "Radiology/Imaging", code: "CTSPINE" },
  { name: "CT KUB (Urolithiasis)", category: "Radiology/Imaging", code: "CTKUB" },
  { name: "PET-CT Scan (Whole Body)", category: "Radiology/Imaging", code: "PETCT" },
  { name: "MRI Brain (Plain + Contrast)", category: "Radiology/Imaging", code: "MRIBRAIN" },
  { name: "MRI Spine (Cervical / Lumbar)", category: "Radiology/Imaging", code: "MRISPINE" },
  { name: "MRI Knee / Hip / Shoulder", category: "Radiology/Imaging", code: "MRIJOINT" },
  { name: "MRI Abdomen (Liver / Pancreas)", category: "Radiology/Imaging", code: "MRIABD" },
  { name: "MRCP (MRI Cholangiopancreatography)", category: "Radiology/Imaging", code: "MRCP" },
  { name: "MRI Breast (Bilateral)", category: "Radiology/Imaging", code: "MRIBREAST" },
  { name: "Mammography (Bilateral)", category: "Radiology/Imaging", code: "MAMMO" },
  { name: "Bone Density (DEXA Scan — Lumbar + Hip)", category: "Radiology/Imaging", code: "DEXA" },
  { name: "Bone Scan (Technetium-99m)", category: "Radiology/Imaging", code: "BONESCAN" },
  { name: "IVP (Intravenous Pyelogram)", category: "Radiology/Imaging", code: "IVP" },
  { name: "HSG (Hysterosalpingogram)", category: "Radiology/Imaging", code: "HSG" },
  { name: "Barium Swallow / Meal / Enema", category: "Radiology/Imaging", code: "BARIUM" },

  // ── ECG / Cardiology Procedures ───────────────────────
  { name: "ECG (12-Lead)", category: "ECG/Cardiology Procedures", code: "ECG" },
  { name: "Holter Monitor (24hr ECG)", category: "ECG/Cardiology Procedures", code: "HOLTER" },
  { name: "Ambulatory BP Monitoring (ABPM — 24hr)", category: "ECG/Cardiology Procedures", code: "ABPM" },
  { name: "2D Echocardiography (2D Echo)", category: "ECG/Cardiology Procedures", code: "ECHO" },
  { name: "Doppler Echocardiography", category: "ECG/Cardiology Procedures", code: "DOPECHO" },
  { name: "Stress Echocardiography (Dobutamine)", category: "ECG/Cardiology Procedures", code: "STRESSECHO" },
  { name: "Treadmill Test (TMT / Stress ECG)", category: "ECG/Cardiology Procedures", code: "TMT" },
  { name: "Cardiac Catheterisation / Angiography", category: "ECG/Cardiology Procedures", code: "CATH" },
  { name: "Carotid Doppler (B/L)", category: "ECG/Cardiology Procedures", code: "CAROTID" },
  { name: "Lower Limb Arterial / Venous Doppler", category: "ECG/Cardiology Procedures", code: "LLDOP" },
  { name: "ABI (Ankle-Brachial Index)", category: "ECG/Cardiology Procedures", code: "ABI" },

  // ── Pulmonology ───────────────────────────────────────
  { name: "Spirometry (PFT — Basic)", category: "Pulmonology", code: "PFT" },
  { name: "Full Pulmonary Function Test (PFT — Complete)", category: "Pulmonology", code: "PFTFULL" },
  { name: "Peak Flow Rate (PEFR)", category: "Pulmonology", code: "PEFR" },
  { name: "Bronchoscopy (Fibreoptic)", category: "Pulmonology", code: "BRONCH" },
  { name: "BAL (Bronchoalveolar Lavage) — Culture + AFB", category: "Pulmonology", code: "BAL" },
  { name: "EBUS (Endobronchial Ultrasound)", category: "Pulmonology", code: "EBUS" },
  { name: "Pulse Oximetry (SpO2)", category: "Pulmonology", code: "SPO2" },
  { name: "6-Minute Walk Test (6MWT)", category: "Pulmonology", code: "6MWT" },
  { name: "Sleep Study (Polysomnography — PSG)", category: "Pulmonology", code: "PSG" },
  { name: "Home Sleep Test (HST — WatchPAT)", category: "Pulmonology", code: "HST" },
  { name: "FeNO (Fractional Exhaled Nitric Oxide)", category: "Pulmonology", code: "FENO" },
  { name: "Sputum Cytology (Malignant Cells)", category: "Pulmonology", code: "SPUTCYT" },

  // ── Gastroenterology ──────────────────────────────────
  { name: "Upper GI Endoscopy (OGD Scopy)", category: "Gastroenterology", code: "OGD" },
  { name: "Colonoscopy", category: "Gastroenterology", code: "COLON" },
  { name: "Flexible Sigmoidoscopy", category: "Gastroenterology", code: "SIGM" },
  { name: "ERCP (Endoscopic Retrograde Cholangiopancreatography)", category: "Gastroenterology", code: "ERCP" },
  { name: "EUS (Endoscopic Ultrasound)", category: "Gastroenterology", code: "EUS" },
  { name: "Capsule Endoscopy (Small Bowel)", category: "Gastroenterology", code: "CAPSULE" },
  { name: "Liver Biopsy (Percutaneous)", category: "Gastroenterology", code: "LVBX" },
  { name: "Ascitic Tap (Paracentesis)", category: "Gastroenterology", code: "PARA" },
  { name: "Hepatitis Panel (A+B+C+E)", category: "Gastroenterology", code: "HEPPANEL" },
  { name: "Coeliac Disease Panel (tTG IgA + EMA + AGA)", category: "Gastroenterology", code: "COELIAC" },
  { name: "Lactulose Hydrogen Breath Test (SIBO)", category: "Gastroenterology", code: "HBT" },
  { name: "Glucose Hydrogen Breath Test", category: "Gastroenterology", code: "GHBT" },

  // ── Neurology ─────────────────────────────────────────
  { name: "EEG (Electroencephalogram)", category: "Neurology", code: "EEG" },
  { name: "NCS (Nerve Conduction Study)", category: "Neurology", code: "NCS" },
  { name: "EMG (Electromyography)", category: "Neurology", code: "EMG" },
  { name: "VEP (Visual Evoked Potential)", category: "Neurology", code: "VEP" },
  { name: "BAEP (Brainstem Auditory Evoked Potential)", category: "Neurology", code: "BAEP" },
  { name: "Lumbar Puncture (LP / Spinal Tap)", category: "Neurology", code: "LP" },
  { name: "CSF Oligoclonal Bands", category: "Neurology", code: "CSFOCB" },
  { name: "CSF 14-3-3 Protein (CJD)", category: "Neurology", code: "CSF143" },
  { name: "Serum Neuromyelitis Optica (AQP4 Antibody)", category: "Neurology", code: "AQP4" },
  { name: "Anti-NMDAR Antibody (Autoimmune Encephalitis)", category: "Neurology", code: "ANMDAR" },
  { name: "Serum Drug Level — Phenytoin", category: "Neurology", code: "PHENYDR" },
  { name: "Serum Drug Level — Carbamazepine", category: "Neurology", code: "CARBDR" },
  { name: "Serum Drug Level — Valproate", category: "Neurology", code: "VALPRDR" },
  { name: "Serum Drug Level — Lithium", category: "Neurology", code: "LITHDR" },
  { name: "Serum Drug Level — Digoxin", category: "Neurology", code: "DIGDR" },
  { name: "Serum Drug Level — Theophylline", category: "Neurology", code: "THEODR" },
  { name: "Serum Drug Level — Vancomycin", category: "Neurology", code: "VCODR" },
  { name: "Serum Drug Level — Tacrolimus", category: "Neurology", code: "TACRDR" },

  // ── Gynaecology / Obstetrics ──────────────────────────
  { name: "Beta HCG Quantitative (Serum Pregnancy Test)", category: "Gynaecology/Obstetrics", code: "BHCG_G" },
  { name: "Double Marker Test (PAPP-A + Beta HCG)", category: "Gynaecology/Obstetrics", code: "DBLMRK" },
  { name: "Triple Marker Test", category: "Gynaecology/Obstetrics", code: "TRIPLMRK" },
  { name: "Quad Marker Test", category: "Gynaecology/Obstetrics", code: "QUADMRK" },
  { name: "Non-Invasive Prenatal Testing (NIPT — NIFTY)", category: "Gynaecology/Obstetrics", code: "NIPT_G" },
  { name: "Anomaly Scan (18-20 weeks USG)", category: "Gynaecology/Obstetrics", code: "ANOMALY" },
  { name: "NT Scan (Nuchal Translucency 11-13 weeks)", category: "Gynaecology/Obstetrics", code: "NTSCAN" },
  { name: "Fetal Growth Scan (28-32 weeks)", category: "Gynaecology/Obstetrics", code: "FGROWTH" },
  { name: "Biophysical Profile (BPP)", category: "Gynaecology/Obstetrics", code: "BPP" },
  { name: "Pap Smear (Cervical Cytology)", category: "Gynaecology/Obstetrics", code: "PAPSMEAR" },
  { name: "HPV DNA Test (High Risk HPV Typing)", category: "Gynaecology/Obstetrics", code: "HPVDNA" },
  { name: "Colposcopy", category: "Gynaecology/Obstetrics", code: "COLPO" },
  { name: "Endometrial Biopsy", category: "Gynaecology/Obstetrics", code: "ENDOBX" },
  { name: "Semen Analysis (Seminogram)", category: "Gynaecology/Obstetrics", code: "SEMEN" },
  { name: "Sperm DNA Fragmentation Index", category: "Gynaecology/Obstetrics", code: "SDFI" },
  { name: "GCT (Glucose Challenge Test — 50g, 1hr)", category: "Gynaecology/Obstetrics", code: "GCT" },
  { name: "OGTT 75g (Gestational Diabetes)", category: "Gynaecology/Obstetrics", code: "OGTTG" },
  { name: "TORCH Panel (IgG + IgM)", category: "Gynaecology/Obstetrics", code: "TORCH" },
  { name: "Group B Streptococcus Swab (35-37 weeks)", category: "Gynaecology/Obstetrics", code: "GBS" },
  { name: "Thyroid Profile in Pregnancy (TSH + T4)", category: "Gynaecology/Obstetrics", code: "THYPREG" },

  // ── Paediatric ────────────────────────────────────────
  { name: "Neonatal Screening (TSH + PKU + CAH)", category: "Paediatric", code: "NEONSCR" },
  { name: "Developmental Screening (Denver II / DASII)", category: "Paediatric", code: "DEVSCR" },
  { name: "Hearing Screening (OAE + BERA)", category: "Paediatric", code: "HEARSCR" },
  { name: "Vision Screening (Retinoscopy)", category: "Paediatric", code: "VISSCR" },
  { name: "Growth Chart Assessment (WHO)", category: "Paediatric", code: "GROWTH" },
  { name: "Bone Age (X-Ray Left Wrist)", category: "Paediatric", code: "BONEAGE" },
  { name: "Sweat Chloride Test (Cystic Fibrosis)", category: "Paediatric", code: "SWEAT" },
  { name: "Lead Level (Blood Lead Level)", category: "Paediatric", code: "LEAD" },
  { name: "Metabolic Screening Panel (IEM)", category: "Paediatric", code: "IEMSCR" },
  { name: "Paediatric Pulmonology — Spirometry", category: "Paediatric", code: "PEDPFT" },
  { name: "Echocardiogram (Congenital Heart Disease)", category: "Paediatric", code: "PEDECHO" },

  // ── Others ────────────────────────────────────────────
  { name: "Spirometry / PFT (Pulmonary Function Test)", category: "Others", code: "PFT_O" },
  { name: "Ambulatory ECG (Holter — 48hr)", category: "Others", code: "HOLTER48" },
  { name: "Skin Prick Test (SPT — Allergy)", category: "Others", code: "SPT" },
  { name: "Patch Test (Contact Dermatitis)", category: "Others", code: "PATCH" },
  { name: "Nail Clipping KOH + Fungal Culture", category: "Others", code: "NAILKOH" },
  { name: "Hair Analysis (Heavy Metals)", category: "Others", code: "HAIRMET" },
  { name: "Ophthalmology — Visual Acuity", category: "Others", code: "VA" },
  { name: "Slit Lamp Examination", category: "Others", code: "SLITLAMP" },
  { name: "Intraocular Pressure (IOP — Tonometry)", category: "Others", code: "IOP" },
  { name: "Fundoscopy (Dilated Fundus Examination)", category: "Others", code: "FUNDO" },
  { name: "OCT (Optical Coherence Tomography — Retina)", category: "Others", code: "OCT" },
  { name: "Audiometry (Pure Tone + Speech)", category: "Others", code: "AUDIO" },
  { name: "Tympanometry", category: "Others", code: "TYMPANO" },
  { name: "Pure Tone Audiometry (PTA)", category: "Others", code: "PTA" },
  { name: "FNAC (Fine Needle Aspiration Cytology)", category: "Others", code: "FNAC" },
  { name: "Tissue Biopsy (Incisional / Excisional)", category: "Others", code: "BIOPSY" },
  { name: "Trucut Biopsy", category: "Others", code: "TRUCUT" },
  { name: "Immunohistochemistry (IHC — Tumour Panel)", category: "Others", code: "IHC" },
  { name: "Flow Cytometry (Leukaemia / Lymphoma Panel)", category: "Others", code: "FLOWCYT" },
  { name: "Urodynamic Study (UDS)", category: "Others", code: "UDS" },
  { name: "Cystoscopy", category: "Others", code: "CYSTOSC" },
  { name: "Flexible Cystoscopy", category: "Others", code: "FLCYST" },
  { name: "Uroflowmetry + PVR", category: "Others", code: "UROFLOW" },
  { name: "Nerve Block / Joint Injection (Diagnostic)", category: "Others", code: "NERVBLK" },
  { name: "Therapeutic Drug Monitoring (TDM) Panel", category: "Others", code: "TDM" },
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

  // ══ CREAMS / OINTMENTS / GELS / LOTIONS ══
  // Antifungal Creams
  "Clotrimazole 1% Cream","Clotrimazole 1% Dusting Powder",
  "Miconazole 2% Cream","Miconazole 2% Powder",
  "Ketoconazole 2% Cream","Ketoconazole 2% Shampoo",
  "Terbinafine 1% Cream","Terbinafine 250mg Tablet",
  "Luliconazole 1% Cream","Sertaconazole 2% Cream",
  "Fluconazole 150mg Tablet","Itraconazole 100mg Capsule",
  "Ciclopirox 1% Cream","Ciclopirox Nail Lacquer 8%",
  "Amorolfine 5% Nail Lacquer","Whitfield's Ointment",
  "Clotrimazole + Betamethasone Cream","Miconazole + Hydrocortisone Cream",
  // Steroid / Anti-inflammatory Creams
  "Hydrocortisone 1% Cream","Hydrocortisone 2.5% Cream",
  "Betamethasone 0.05% Cream","Betamethasone 0.1% Ointment",
  "Betamethasone + Gentamicin + Clotrimazole Cream",
  "Clobetasol 0.05% Cream","Clobetasol 0.05% Ointment",
  "Mometasone 0.1% Cream","Mometasone 0.1% Ointment",
  "Fluticasone 0.005% Ointment","Fluticasone 0.05% Cream",
  "Triamcinolone 0.1% Cream","Triamcinolone Acetonide in Orabase",
  "Desonide 0.05% Cream","Halobetasol 0.05% Cream",
  "Beclomethasone 0.025% Cream",
  // Antibiotic Creams / Ointments
  "Mupirocin 2% Ointment","Mupirocin 2% Cream",
  "Fusidic Acid 2% Cream","Fusidic Acid + Betamethasone Cream",
  "Neomycin + Bacitracin Ointment","Framycetin 1% Cream",
  "Silver Sulfadiazine 1% Cream","Chloramphenicol 1% Eye Ointment",
  "Erythromycin 2% Topical Gel","Clindamycin 1% Gel","Clindamycin 1% Lotion",
  "Metronidazole 0.75% Gel","Metronidazole 1% Cream",
  "Povidone Iodine 5% Ointment","Povidone Iodine 10% Solution",
  "Bacitracin + Neomycin + Polymyxin B Ointment",
  // Acne / Skin Creams
  "Benzoyl Peroxide 2.5% Gel","Benzoyl Peroxide 5% Gel","Benzoyl Peroxide 10% Gel",
  "Adapalene 0.1% Gel","Adapalene 0.3% Gel",
  "Adapalene + Benzoyl Peroxide Gel","Adapalene + Clindamycin Gel",
  "Tretinoin 0.025% Cream","Tretinoin 0.05% Cream","Tretinoin 0.1% Cream",
  "Isotretinoin 20mg Capsule","Isotretinoin 10mg Capsule",
  "Azelaic Acid 15% Gel","Azelaic Acid 20% Cream",
  "Salicylic Acid 2% Lotion","Salicylic Acid 6% Ointment",
  "Glycolic Acid 10% Cream","Niacinamide 4% Cream",
  // Pigmentation / Brightening
  "Hydroquinone 2% Cream","Hydroquinone 4% Cream",
  "Kojic Acid + Glycolic Acid Cream",
  "Tretinoin + Hydroquinone + Fluocinolone Cream (Tri-Luma)",
  "Alpha Arbutin 2% Cream",
  // Moisturizers / Emollients
  "Urea 10% Cream","Urea 20% Cream","Urea 40% Cream",
  "Lactic Acid 12% Lotion","Lactic Acid 6% Lotion",
  "Petroleum Jelly (White Soft Paraffin)",
  "Liquid Paraffin + White Soft Paraffin Ointment",
  "Calamine Lotion","Calamine + Zinc Oxide Lotion",
  "Emulsifying Ointment BP",
  // Anti-itch / Scabies / Lice
  "Permethrin 5% Cream","Permethrin 1% Lotion",
  "Benzyl Benzoate 25% Lotion","Gamma Benzene Hexachloride (Lindane) 1% Lotion",
  "Ivermectin 1% Lotion","Malathion 0.5% Lotion",
  // Sunscreen
  "Sunscreen SPF 30 Lotion","Sunscreen SPF 50 Cream","Sunscreen SPF 50+ PA+++ Cream",
  "Zinc Oxide Sunscreen Cream",
  // Pain / Muscle Relief Gels
  "Diclofenac 1% Gel","Diclofenac 1.16% Gel",
  "Diclofenac + Methyl Salicylate + Menthol Gel",
  "Ketoprofen 2.5% Gel","Piroxicam 0.5% Gel",
  "Ibuprofen 5% Gel","Naproxen 10% Gel",
  "Methyl Salicylate + Menthol Ointment","Volini Gel","Moov Cream",
  "Capsaicin 0.025% Cream","Capsaicin 0.075% Cream",
  "Lidocaine 2% Gel","Lidocaine 5% Ointment","EMLA Cream (Lidocaine + Prilocaine)",
  // Antiviral Creams
  "Acyclovir 5% Cream","Acyclovir 3% Eye Ointment",
  "Penciclovir 1% Cream",
  // Hair Loss
  "Minoxidil 2% Solution","Minoxidil 5% Solution","Minoxidil 5% Foam",
  "Finasteride 1mg Tablet","Finasteride 5mg Tablet",
  // Wart / Corn Removers
  "Salicylic Acid 16.7% + Lactic Acid 16.7% Collodion (Duofilm)",
  "Podophyllin 25% Solution","Imiquimod 5% Cream","Trichloroacetic Acid 80% Solution",
  // Wound Care
  "Framycetin + Cetrimide Cream","Nitrofurazone 0.2% Ointment",
  "Collagen Powder (Wound Dressing)","Hydrocolloid Dressing",
  "Zinc Oxide Paste","Calamine + Zinc Paste",

  // ══ EXTENDED SYRUPS / SUSPENSIONS / DROPS / SOLUTIONS ══
  // Paediatric Antibiotics Syrups
  "Cefpodoxime 50mg/5ml Suspension","Cefpodoxime 100mg/5ml Suspension",
  "Cefdinir 125mg/5ml Suspension","Cefdinir 250mg/5ml Suspension",
  "Cefuroxime 125mg/5ml Suspension","Cefuroxime 250mg/5ml Suspension",
  "Cefixime 100mg/5ml Suspension","Cefixime 200mg/5ml Suspension",
  "Azithromycin 200mg/5ml Suspension","Azithromycin 100mg/5ml Suspension",
  "Clarithromycin 125mg/5ml Suspension","Clarithromycin 250mg/5ml Suspension",
  "Erythromycin 125mg/5ml Suspension","Erythromycin 250mg/5ml Suspension",
  "Ciprofloxacin 250mg/5ml Suspension",
  "Cotrimoxazole 240mg/5ml Suspension",
  "Metronidazole 200mg/5ml Suspension","Metronidazole 400mg/5ml Suspension",
  "Tinidazole 300mg/5ml Suspension",
  "Nitrofurantoin 25mg/5ml Suspension",
  // Paracetamol / Pain Syrups
  "Paracetamol 125mg/5ml Syrup","Paracetamol 250mg/5ml Syrup",
  "Paracetamol 500mg/5ml Syrup","Paracetamol Drops 100mg/ml",
  "Ibuprofen 100mg/5ml Suspension","Ibuprofen 200mg/5ml Suspension",
  "Naproxen 125mg/5ml Suspension","Mefenamic Acid 50mg/5ml Suspension",
  "Nimesulide 50mg/5ml Suspension","Nimesulide 100mg Granules",
  "Diclofenac 15mg/5ml Syrup",
  // Antacid / GI Syrups
  "Antacid Syrup (Magaldrate + Simethicone)","Antacid Gel (Aluminium Hydroxide + Magnesium Hydroxide)",
  "Omeprazole 20mg Sachet","Pantoprazole 40mg Sachet",
  "Ranitidine 75mg/5ml Syrup","Famotidine 40mg/5ml Syrup",
  "Domperidone 5mg/5ml Suspension","Domperidone 1mg/ml Drops",
  "Ondansetron 4mg/5ml Syrup","Ondansetron 2mg/5ml Syrup",
  "Metoclopramide 5mg/5ml Syrup","Cisapride 5mg/5ml Suspension",
  "Lactulose 10g/15ml Syrup","Sorbitol Solution 70%",
  "Simethicone (Gripe Water) Drops","Simethicone 40mg/0.6ml Drops",
  "Oral Rehydration Salts (ORS) Sachet","Zinc Sulphate 10mg/5ml Syrup",
  "Sucralfate 1g/5ml Suspension","Cholestyramine 4g Sachet",
  // Cough / Respiratory Syrups
  "Ambroxol 15mg/5ml Syrup","Ambroxol 30mg/5ml Syrup",
  "Ambroxol + Salbutamol Syrup","Ambroxol + Guaifenesin Syrup",
  "Bromhexine 4mg/5ml Syrup","Bromhexine 8mg/5ml Syrup",
  "Carbocisteine 250mg/5ml Syrup","Acetylcysteine 200mg Sachet",
  "Dextromethorphan 10mg/5ml Syrup","Dextromethorphan + Chlorpheniramine Syrup",
  "Codeine Linctus 15mg/5ml","Pholcodine 5mg/5ml Linctus",
  "Salbutamol 2mg/5ml Syrup","Salbutamol + Ipratropium Syrup",
  "Terbutaline 1.5mg/5ml Syrup","Theophylline 100mg/5ml Syrup",
  "Montelukast 4mg/5ml Granules","Montelukast + Levocetirizine Syrup",
  "Budesonide 0.5mg Respules","Ipratropium 0.5mg Respules",
  "Levosalbutamol 0.63mg Respules","Levosalbutamol + Ipratropium Respules",
  // Antiallergy Syrups
  "Cetirizine 5mg/5ml Syrup","Cetirizine 1mg/ml Drops",
  "Levocetirizine 2.5mg/5ml Syrup","Levocetirizine 0.5mg/ml Drops",
  "Loratadine 5mg/5ml Syrup","Desloratadine 2.5mg/5ml Syrup",
  "Fexofenadine 30mg/5ml Suspension","Hydroxyzine 10mg/5ml Syrup",
  "Chlorpheniramine 2mg/5ml Syrup","Chlorpheniramine + Phenylephrine Syrup",
  "Diphenhydramine 12.5mg/5ml Syrup","Promethazine 5mg/5ml Syrup",
  "Ketotifen 1mg/5ml Syrup",
  // Vitamins / Nutritional Syrups
  "Vitamin B Complex Syrup","Multivitamin + Multimineral Syrup",
  "Ferrous Ascorbate + Folic Acid Syrup","Ferrous Sulphate 150mg/5ml Syrup",
  "Iron Polymaltose 50mg/5ml Syrup","Iron + Zinc Drops",
  "Calcium + Vitamin D3 Syrup","Calcium Gluconate 10% Syrup",
  "Vitamin C 500mg/5ml Syrup","Vitamin D 400IU/ml Drops",
  "Zinc + Vitamin C Syrup","Lycopene + Multivitamin Syrup",
  "Lysine + Vitamins Syrup (Appetite Stimulant)",
  "DHA + EPA Syrup","Omega-3 Fatty Acids Syrup",
  "Protein Powder (Whey-based) 200g","Protein Powder (Soy-based) 200g",
  // Neurology Syrups
  "Phenobarbitone 20mg/5ml Syrup","Phenytoin 25mg/5ml Suspension",
  "Carbamazepine 100mg/5ml Suspension","Sodium Valproate 200mg/5ml Syrup",
  "Levetiracetam 100mg/ml Solution","Clobazam 5mg/5ml Syrup",
  "Clonazepam 0.5mg/5ml Syrup",
  // Ear / Nasal / Eye Drops (expanded)
  "Ciprofloxacin 0.3% Ear Drops","Ofloxacin 0.3% Ear Drops",
  "Gentamicin + Betamethasone Ear Drops","Clotrimazole 1% Ear Drops",
  "Acetic Acid 2% Ear Drops (Otic Solution)",
  "Xylometazoline 0.05% Nasal Drops","Xylometazoline 0.1% Nasal Spray",
  "Oxymetazoline 0.025% Nasal Drops","Oxymetazoline 0.05% Nasal Spray",
  "Budesonide 64mcg Nasal Spray","Fluticasone 50mcg Nasal Spray",
  "Mometasone 50mcg Nasal Spray","Triamcinolone 55mcg Nasal Spray",
  "Saline Nasal Drops","Saline Nasal Spray (Isotonic)",
  "Hypertonic Saline 3% Nasal Spray",
  "Tobramycin 0.3% Eye Drops","Gentamicin 0.3% Eye Drops",
  "Moxifloxacin 0.5% Eye Drops","Gatifloxacin 0.3% Eye Drops",
  "Ofloxacin 0.3% Eye Drops","Ciprofloxacin 0.3% Eye Drops",
  "Prednisolone 1% Eye Drops","Dexamethasone 0.1% Eye Drops",
  "Dexamethasone + Tobramycin Eye Drops",
  "Ketorolac 0.5% Eye Drops","Diclofenac 0.1% Eye Drops",
  "Timolol 0.25% Eye Drops","Timolol 0.5% Eye Drops",
  "Latanoprost 0.005% Eye Drops","Bimatoprost 0.03% Eye Drops",
  "Brimonidine 0.15% Eye Drops","Dorzolamide 2% Eye Drops",
  "Carboxymethylcellulose 0.5% Eye Drops (Lubricant)","Hyaluronic Acid 0.1% Eye Drops",
  "Cyclosporine 0.05% Eye Drops","Atropine 1% Eye Drops",
  "Pilocarpine 2% Eye Drops","Tropicamide 1% Eye Drops",

  // ══ EXTENDED INJECTIONS ══
  // Antibiotics Injections
  "Ceftriaxone 250mg Injection","Ceftriaxone 500mg Injection",
  "Ceftriaxone 1g Injection","Ceftriaxone 2g Injection",
  "Cefotaxime 500mg Injection","Cefotaxime 1g Injection","Cefotaxime 2g Injection",
  "Cefuroxime 750mg Injection","Cefuroxime 1.5g Injection",
  "Ceftazidime 1g Injection","Ceftazidime 2g Injection",
  "Cefoperazone + Sulbactam 1.5g Injection","Cefoperazone + Sulbactam 3g Injection",
  "Meropenem 500mg Injection","Meropenem 1g Injection",
  "Imipenem + Cilastatin 500mg Injection","Ertapenem 1g Injection",
  "Vancomycin 500mg Injection","Vancomycin 1g Injection",
  "Teicoplanin 400mg Injection","Linezolid 600mg/300ml Infusion",
  "Amikacin 250mg Injection","Amikacin 500mg Injection",
  "Gentamicin 40mg Injection","Gentamicin 80mg Injection",
  "Tobramycin 80mg Injection","Netilmicin 100mg Injection",
  "Azithromycin 500mg Injection","Clindamycin 300mg Injection","Clindamycin 600mg Injection",
  "Metronidazole 500mg/100ml Infusion","Tinidazole 400mg Injection",
  "Levofloxacin 500mg/100ml Infusion","Ciprofloxacin 200mg/100ml Infusion",
  "Colistin 1M IU Injection","Polymyxin B 500000 IU Injection",
  "Doxycycline 100mg Injection",
  // Antifungal Injections
  "Fluconazole 200mg/100ml Infusion","Amphotericin B 50mg Injection",
  "Caspofungin 50mg Injection","Voriconazole 200mg Injection",
  "Micafungin 100mg Injection",
  // Antiviral Injections
  "Acyclovir 250mg Injection","Acyclovir 500mg Injection",
  "Ganciclovir 500mg Injection","Foscarnet 6g/250ml Infusion",
  "Oseltamivir 75mg Capsule","Zanamivir Inhaler",
  // Pain / Analgesic Injections
  "Diclofenac 75mg Injection","Ketorolac 30mg Injection","Ketorolac 15mg Injection",
  "Tramadol 50mg Injection","Tramadol 100mg Injection",
  "Morphine 10mg Injection","Morphine 15mg Injection",
  "Pentazocine 30mg Injection","Pethidine 50mg Injection","Pethidine 100mg Injection",
  "Fentanyl 100mcg Injection","Buprenorphine 0.3mg Injection",
  "Paracetamol 1g/100ml Infusion",
  "Dexketoprofen 25mg Injection",
  // Anti-emetic Injections
  "Ondansetron 4mg Injection","Ondansetron 8mg Injection",
  "Metoclopramide 10mg Injection","Domperidone 10mg Injection",
  "Promethazine 25mg Injection","Granisetron 1mg Injection",
  // Steroid Injections
  "Hydrocortisone 100mg Injection","Hydrocortisone 200mg Injection",
  "Dexamethasone 4mg Injection","Dexamethasone 8mg Injection",
  "Methylprednisolone 40mg Injection","Methylprednisolone 500mg Injection",
  "Triamcinolone 10mg/ml Injection","Triamcinolone 40mg/ml Injection",
  "Betamethasone 4mg/ml Injection","Betamethasone 12mg Injection (Antenatal)",
  "Prednisolone 25mg Injection",
  // Cardiac Injections
  "Dopamine 200mg Injection","Noradrenaline 4mg Injection",
  "Adrenaline 1mg Injection","Atropine 0.6mg Injection",
  "Adenosine 6mg Injection","Amiodarone 150mg Injection",
  "Digoxin 0.5mg Injection","Verapamil 5mg Injection",
  "Diltiazem 25mg Injection","Metoprolol 5mg Injection",
  "Nitroglycerin 25mg Injection","Isosorbide Dinitrate 10mg Injection",
  "Heparin 5000 IU Injection","Heparin 25000 IU Injection",
  "Enoxaparin 40mg Injection","Enoxaparin 60mg Injection","Enoxaparin 80mg Injection",
  "Alteplase 50mg Injection (tPA)","Streptokinase 1.5M IU Injection",
  "Eptifibatide 20mg Injection","Bivalirudin 250mg Injection",
  "Furosemide 20mg Injection","Furosemide 40mg Injection",
  "Mannitol 20% 100ml Infusion","Mannitol 20% 500ml Infusion",
  "Sodium Bicarbonate 7.5% Injection",
  // Vitamins / Minerals Injections
  "Vitamin B12 1000mcg Injection","Thiamine 100mg Injection",
  "Vitamin C 500mg Injection","Pyridoxine 100mg Injection",
  "Magnesium Sulphate 50% Injection","Calcium Gluconate 10% Injection",
  "Potassium Chloride 15% Injection (Concentrated)",
  "Iron Sucrose 100mg Injection","Iron Sucrose 200mg Injection",
  "Ferric Carboxymaltose 500mg Injection","Ferric Carboxymaltose 1000mg Injection",
  "Zinc Sulphate 10mg Injection",
  // Hormones / Endocrine Injections
  "Insulin Regular 40IU/ml Injection","Insulin Regular 100IU/ml Injection",
  "Insulin Glargine 100IU/ml Pen","Insulin Detemir Pen",
  "Insulin Aspart Pen","Insulin Lispro Pen","Insulin Glulisine Pen",
  "Glucagon 1mg Injection","Octreotide 100mcg Injection",
  "Oxytocin 5IU Injection","Methylergometrine 0.2mg Injection",
  "hCG 5000IU Injection","FSH 75IU Injection",
  "Testosterone 250mg Injection (Depot)","Leuprolide 3.75mg Injection",
  "Teriparatide 20mcg Injection","Zoledronic Acid 4mg Injection",
  "Denosumab 60mg Injection",
  // Immunology / Biologics Injections
  "Methylprednisolone 1g Injection (Pulse)","Cyclophosphamide 500mg Injection",
  "Rituximab 500mg Injection","Infliximab 100mg Injection",
  "Adalimumab 40mg Injection","Etanercept 25mg Injection",
  "Tocilizumab 400mg Injection","Baricitinib 4mg Tablet",
  "Omalizumab 150mg Injection","Dupilumab 300mg Injection",
  "Mepolizumab 100mg Injection","Benralizumab 30mg Injection",
  "Secukinumab 150mg Injection","Ixekizumab 80mg Injection",
  "Ustekinumab 45mg Injection",
  // Oncology Injections
  "Ondansetron 8mg Injection (pre-chemo)","Palonosetron 0.25mg Injection",
  "Dexamethasone 8mg Injection (pre-chemo)",
  "Filgrastim 300mcg Injection","Pegfilgrastim 6mg Injection",
  "Epoetin Alfa 4000IU Injection","Darbepoetin 40mcg Injection",
  "Zoledronic Acid 4mg Infusion","Pamidronate 90mg Infusion",
  "Mesna 400mg Injection","Leucovorin 50mg Injection",
  // Renal / Dialysis
  "Erythropoietin 2000IU Injection","Erythropoietin 4000IU Injection",
  "Paricalcitol 5mcg Injection","Cinacalcet 30mg Tablet",
  "Sodium Ferric Gluconate 125mg Injection","Iron Dextran 100mg Injection",
  // Neurological Injections
  "Thiamine + B6 + B12 (Neurobion) Injection",
  "Methylcobalamin 1000mcg Injection",
  "Diazepam 10mg Injection","Midazolam 5mg Injection","Lorazepam 4mg Injection",
  "Phenytoin 250mg Injection","Levetiracetam 500mg Injection",
  "Valproate Sodium 400mg Injection","Lacosamide 200mg Injection",
  "Magnesium Sulphate 20% Infusion (Eclampsia Protocol)",
  "Sumatriptan 6mg Injection",
  // Respiratory Injections
  "Aminophylline 250mg Injection","Terbutaline 0.5mg Injection",
  "Hydrocortisone 200mg Injection (Acute Asthma)",
  "Adrenaline 0.5mg Injection (Anaphylaxis)",
  "Ipratropium 250mcg/1ml Nebule","Salbutamol 2.5mg/2.5ml Nebule",
  "Budesonide 500mcg/2ml Respule","Beclomethasone 250mcg Inhaler",
  // GI / Hepatic Injections
  "Pantoprazole 40mg Injection","Omeprazole 40mg Injection","Esomeprazole 40mg Injection",
  "Ranitidine 50mg Injection","Famotidine 20mg Injection",
  "Ondansetron 4mg Injection (GI)","Hyoscine 20mg Injection",
  "Vasopressin 20IU Injection","Octreotide 50mcg Injection",
  "N-Acetylcysteine 200mg/ml Injection","Silymarin 420mg Injection",
  // Obstetric Injections
  "Oxytocin 10IU Injection","Carboprost 250mcg Injection",
  "Magnesium Sulphate 50% 10ml Injection","Atosiban 7.5mg/ml Injection",
  "Progesterone 100mg Injection","Progesterone 200mg Injection",
  "Anti-D Immunoglobulin 300mcg Injection",
  // Contrast / Diagnostic Injections
  "Iohexol (Omnipaque) 300mg/ml Injection","Gadolinium 0.5mmol/ml Injection",

  // ══ ADDITIONAL TABLETS / CAPSULES (COMMONLY MISSED) ══
  // Urology
  "Solifenacin 5mg Tablet","Solifenacin 10mg Tablet",
  "Oxybutynin 5mg Tablet","Tolterodine 2mg Tablet","Tolterodine 4mg ER Tablet",
  "Mirabegron 25mg Tablet","Mirabegron 50mg Tablet",
  "Sildenafil 25mg Tablet","Sildenafil 50mg Tablet","Sildenafil 100mg Tablet",
  "Tadalafil 5mg Tablet","Tadalafil 10mg Tablet","Tadalafil 20mg Tablet",
  "Vardenafil 10mg Tablet","Vardenafil 20mg Tablet",
  "Dutasteride 0.5mg Capsule","Dutasteride + Tamsulosin Capsule",
  "Alfuzosin 10mg ER Tablet","Doxazosin 2mg Tablet","Doxazosin 4mg Tablet",
  "Phenazopiridine 100mg Tablet","Phenazopiridine 200mg Tablet",
  // Psychiatric
  "Sertraline 25mg Tablet","Sertraline 50mg Tablet","Sertraline 100mg Tablet",
  "Escitalopram 5mg Tablet","Escitalopram 10mg Tablet","Escitalopram 20mg Tablet",
  "Fluoxetine 10mg Capsule","Fluoxetine 20mg Capsule","Fluoxetine 60mg Capsule",
  "Paroxetine 10mg Tablet","Paroxetine 20mg Tablet",
  "Venlafaxine 37.5mg Tablet","Venlafaxine 75mg ER Tablet","Venlafaxine 150mg ER Tablet",
  "Duloxetine 30mg Capsule","Duloxetine 60mg Capsule",
  "Mirtazapine 15mg Tablet","Mirtazapine 30mg Tablet",
  "Bupropion 150mg SR Tablet","Bupropion 300mg XL Tablet",
  "Quetiapine 25mg Tablet","Quetiapine 50mg Tablet","Quetiapine 100mg Tablet","Quetiapine 200mg Tablet",
  "Olanzapine 2.5mg Tablet","Olanzapine 5mg Tablet","Olanzapine 10mg Tablet",
  "Risperidone 0.5mg Tablet","Risperidone 1mg Tablet","Risperidone 2mg Tablet",
  "Aripiprazole 5mg Tablet","Aripiprazole 10mg Tablet","Aripiprazole 15mg Tablet",
  "Haloperidol 0.5mg Tablet","Haloperidol 1.5mg Tablet","Haloperidol 5mg Tablet",
  "Lithium Carbonate 150mg Tablet","Lithium Carbonate 300mg Tablet",
  "Clonazepam 0.25mg Tablet","Clonazepam 0.5mg Tablet","Clonazepam 1mg Tablet",
  "Diazepam 2mg Tablet","Diazepam 5mg Tablet","Diazepam 10mg Tablet",
  "Alprazolam 0.25mg Tablet","Alprazolam 0.5mg Tablet","Alprazolam 1mg Tablet",
  "Lorazepam 1mg Tablet","Lorazepam 2mg Tablet",
  "Zolpidem 5mg Tablet","Zolpidem 10mg Tablet",
  "Zopiclone 3.75mg Tablet","Zopiclone 7.5mg Tablet",
  "Melatonin 1mg Tablet","Melatonin 3mg Tablet","Melatonin 5mg Tablet",
  "Buspirone 5mg Tablet","Buspirone 10mg Tablet",
  // Liver
  "Ursodeoxycholic Acid 150mg Tablet","Ursodeoxycholic Acid 300mg Tablet",
  "Silymarin 140mg Tablet","Silymarin + Vitamin E Tablet",
  "Lactulose 10g/15ml Syrup (liver)","Rifaximin 200mg Tablet","Rifaximin 400mg Tablet",
  "L-Ornithine L-Aspartate Sachet","Zinc Acetate 25mg Capsule",
  // Bone / Rheumatology
  "Alendronate 70mg Tablet (weekly)","Risedronate 35mg Tablet (weekly)",
  "Ibandronate 150mg Tablet (monthly)","Zoledronic Acid 5mg Infusion (yearly)",
  "Strontium Ranelate 2g Sachet","Calcitonin Nasal Spray 200IU",
  "Teriparatide 20mcg Injection (daily)","Denosumab 60mg Injection (6-monthly)",
  "Methotrexate 2.5mg Tablet","Methotrexate 7.5mg Tablet","Methotrexate 10mg Tablet",
  "Hydroxychloroquine 200mg Tablet","Hydroxychloroquine 400mg Tablet",
  "Sulfasalazine 500mg Tablet","Sulfasalazine 1g Tablet",
  "Leflunomide 10mg Tablet","Leflunomide 20mg Tablet",
  "Colchicine 0.5mg Tablet","Colchicine 1mg Tablet",
  "Allopurinol 100mg Tablet","Allopurinol 300mg Tablet",
  "Febuxostat 40mg Tablet","Febuxostat 80mg Tablet",
  "Benzbromarone 50mg Tablet",
  // Cardiology Additional
  "Sacubitril + Valsartan (Entresto) 24/26mg Tablet",
  "Sacubitril + Valsartan 49/51mg Tablet","Sacubitril + Valsartan 97/103mg Tablet",
  "Ivabradine 5mg Tablet","Ivabradine 7.5mg Tablet",
  "Ranolazine 500mg ER Tablet","Ranolazine 1000mg ER Tablet",
  "Trimetazidine 35mg MR Tablet",
  "Ticagrelor 60mg Tablet","Ticagrelor 90mg Tablet",
  "Prasugrel 5mg Tablet","Prasugrel 10mg Tablet",
  "Rivaroxaban 2.5mg Tablet","Rivaroxaban 10mg Tablet","Rivaroxaban 15mg Tablet","Rivaroxaban 20mg Tablet",
  "Apixaban 2.5mg Tablet","Apixaban 5mg Tablet",
  "Dabigatran 75mg Capsule","Dabigatran 110mg Capsule","Dabigatran 150mg Capsule",
  "Edoxaban 30mg Tablet","Edoxaban 60mg Tablet",
  "Digoxin 0.0625mg Tablet","Digoxin 0.125mg Tablet","Digoxin 0.25mg Tablet",
  "Spironolactone 25mg Tablet","Spironolactone 50mg Tablet","Spironolactone 100mg Tablet",
  "Eplerenone 25mg Tablet","Eplerenone 50mg Tablet",
  "Tolvaptan 15mg Tablet","Tolvaptan 30mg Tablet",
  "Empagliflozin 10mg Tablet","Empagliflozin 25mg Tablet",
  "Dapagliflozin 5mg Tablet","Dapagliflozin 10mg Tablet",
  "Vericiguat 2.5mg Tablet",
  // Diabetes Additional
  "Sitagliptin 25mg Tablet","Sitagliptin 50mg Tablet","Sitagliptin 100mg Tablet",
  "Vildagliptin 50mg Tablet","Saxagliptin 2.5mg Tablet","Saxagliptin 5mg Tablet",
  "Linagliptin 2.5mg Tablet","Linagliptin 5mg Tablet",
  "Alogliptin 12.5mg Tablet","Alogliptin 25mg Tablet",
  "Liraglutide 0.6mg/1.2mg/1.8mg Pen Injection",
  "Semaglutide 0.25mg/0.5mg/1mg Pen Injection",
  "Dulaglutide 0.75mg Pen Injection","Dulaglutide 1.5mg Pen Injection",
  "Exenatide 5mcg Pen Injection","Exenatide 10mcg Pen Injection",
  "Pioglitazone 7.5mg Tablet","Pioglitazone 15mg Tablet","Pioglitazone 30mg Tablet",
  "Acarbose 25mg Tablet","Acarbose 50mg Tablet","Acarbose 100mg Tablet",
  "Metformin + Sitagliptin 500/50mg Tablet",
  "Metformin + Vildagliptin 500/50mg Tablet",
  "Metformin + Glimepiride 500/1mg Tablet","Metformin + Glimepiride 500/2mg Tablet",
  "Metformin + Empagliflozin 500/10mg Tablet",
  "Metformin + Dapagliflozin 500/5mg Tablet",
  // Respiratory Additional
  "Salmeterol + Fluticasone 25/50mcg Inhaler",
  "Salmeterol + Fluticasone 25/125mcg Inhaler",
  "Salmeterol + Fluticasone 25/250mcg Inhaler",
  "Formoterol + Budesonide 6/200mcg Inhaler",
  "Formoterol + Budesonide 12/400mcg Inhaler",
  "Vilanterol + Fluticasone Furoate 22/92mcg Inhaler",
  "Tiotropium 18mcg Handihaler","Tiotropium 2.5mcg Respimat",
  "Umeclidinium 62.5mcg Inhaler","Glycopyrronium 50mcg Inhaler",
  "Aclidinium 400mcg Inhaler",
  "Indacaterol 150mcg Capsule Inhaler","Olodaterol 2.5mcg Respimat",
  "Roflumilast 250mcg Tablet","Roflumilast 500mcg Tablet",
  "N-Acetylcysteine 600mg Effervescent Tablet",
  "Carbocisteine 375mg Capsule","Erdosteine 300mg Capsule",
  // Gynaecology Additional
  "Mifepristone 200mg Tablet","Misoprostol 200mcg Tablet",
  "Letrozole 2.5mg Tablet","Clomiphene 50mg Tablet","Clomiphene 100mg Tablet",
  "Dydrogesterone 10mg Tablet","Micronised Progesterone 100mg Capsule",
  "Levonorgestrel 1.5mg Tablet (Emergency Contraceptive)",
  "Combined Oral Contraceptive Pill (Ethinyl Estradiol + Levonorgestrel)",
  "Norethisterone 5mg Tablet","Medroxyprogesterone 10mg Tablet",
  "Tranexamic Acid 250mg Tablet","Tranexamic Acid 500mg Tablet",
  "Mefenamic Acid + Tranexamic Acid Tablet",
  "Danazol 100mg Capsule","Danazol 200mg Capsule",
  "Raloxifene 60mg Tablet","Bazedoxifene 20mg Tablet",
  "Conjugated Estrogens 0.625mg Tablet","Estradiol Valerate 2mg Tablet",
  "Tibolone 2.5mg Tablet",
  "Clindamycin 2% Vaginal Cream","Metronidazole 0.75% Vaginal Gel",
  "Clotrimazole 100mg Vaginal Tablet","Clotrimazole 500mg Vaginal Tablet",
  "Boric Acid 600mg Vaginal Capsule","Miconazole 200mg Vaginal Suppository",
  // Dental / ENT Additional
  "Chlorhexidine 0.2% Mouthwash","Chlorhexidine 0.12% Mouthwash",
  "Benzydamine 0.15% Mouthwash / Gargle","Povidone Iodine 1% Gargle",
  "Lidocaine 2% Viscous Solution","Benzocaine 7.5% Oral Gel",
  "Clove Oil (Eugenol) Dental","Zinc Oxide Eugenol Cement",
  "Betadine Throat Lozenges","Strepsils Lozenges","Difflam Spray",
  "Xylometazoline + Ipratropium Nasal Spray",
  "Fexofenadine + Pseudoephedrine Tablet",
  // Gastroenterology Additional
  "Mesalazine 400mg Tablet","Mesalazine 800mg Tablet","Mesalazine 1g Suppository",
  "Olsalazine 250mg Capsule","Balsalazide 750mg Capsule",
  "Azathioprine 25mg Tablet","Azathioprine 50mg Tablet",
  "Mercaptopurine 50mg Tablet",
  "Vedolizumab 300mg Infusion","Ustekinumab 45mg Injection (Crohn's)",
  "Infliximab 100mg Infusion (IBD)","Adalimumab 40mg Injection (IBD)",
  "Pancreatin (Creon) 10000 IU Capsule","Pancreatin 25000 IU Capsule",
  "Domperidone + PPI Capsule","Itopride 50mg Tablet","Mosapride 5mg Tablet",
  "Prucalopride 1mg Tablet","Prucalopride 2mg Tablet",
  "Naloxegol 12.5mg Tablet","Methylnaltrexone 8mg Injection",
  "Bisacodyl 5mg Tablet","Bisacodyl 10mg Suppository",
  "Glycerine Suppository Adult","Glycerine Suppository Paediatric",
  "Hyoscine Butylbromide 10mg Tablet","Dicyclomine 20mg Tablet",
  "Trimebutine 100mg Tablet","Trimebutine 200mg Tablet",
  "Dimethicone 40mg Drops","Simethicone 80mg Tablet",
  // Nephrology
  "Sevelamer 400mg Tablet","Sevelamer 800mg Tablet",
  "Calcium Carbonate 500mg Tablet (Phosphate Binder)",
  "Lanthanum Carbonate 500mg Tablet",
  "Calcium Acetate 667mg Tablet",
  "Ferric Citrate 210mg Tablet",
  "Sodium Bicarbonate 500mg Tablet","Sodium Bicarbonate 650mg Tablet",
  "Patiromer 8.4g Sachet","Sodium Zirconium Cyclosilicate 10g Sachet",
  // Haematology
  "Hydroxyurea 500mg Capsule","Hydroxyurea 1g Tablet",
  "Deferasirox 125mg Tablet","Deferasirox 250mg Tablet","Deferasirox 500mg Tablet",
  "Deferiprone 500mg Tablet","Deferoxamine 500mg Injection",
  "Eltrombopag 25mg Tablet","Eltrombopag 50mg Tablet",
  "Romiplostim 250mcg Injection",
  "Prednisolone 10mg Tablet (ITP)",
  "Intravenous Immunoglobulin (IVIG) 5g","IVIG 10g","IVIG 20g",
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

    // ── Lab Test Hindi Purpose Map ──
    const LAB_PURPOSE_MAP: Record<string, string> = {
      // Haematology
      "CBC": "खून की पूरी जाँच — खून की कमी, इन्फेक्शन और प्लेटलेट देखने के लिए",
      "HB": "खून में हीमोग्लोबिन की मात्रा जाँचने के लिए (खून की कमी)",
      "WBCDIFF": "सफेद रक्त कोशिकाओं की गिनती — इन्फेक्शन या एलर्जी देखने के लिए",
      "PLT": "प्लेटलेट की गिनती — खून जमने की क्षमता जाँचने के लिए",
      "ESR": "शरीर में सूजन और इन्फेक्शन की जाँच के लिए",
      "PBS": "खून की कोशिकाओं का सूक्ष्मदर्शी से परीक्षण",
      "RETIC": "नई लाल रक्त कोशिकाएं बनने की जाँच",
      "PCV": "खून में लाल कोशिकाओं का प्रतिशत",
      "BLOODGRP": "खून का ग्रुप और Rh टाइप जाँचने के लिए",
      "G6PD": "G6PD एन्ज़ाइम की कमी जाँचने के लिए",
      "HBEP": "सिकल सेल और थैलेसीमिया की जाँच के लिए",
      // Biochemistry
      "RBS": "अभी के समय शुगर (blood sugar) की जाँच",
      "FBS": "खाली पेट शुगर की जाँच (8 घंटे उपवास के बाद)",
      "PPBS": "खाने के 2 घंटे बाद शुगर की जाँच",
      "HBA1C": "पिछले 3 महीने की औसत शुगर जाँचने के लिए",
      "OGTT": "डायबिटीज़ और गर्भकालीन शुगर की जाँच",
      "ELEC": "खून में सोडियम, पोटेशियम और क्लोराइड की जाँच",
      "NA": "खून में नमक (सोडियम) की मात्रा जाँचने के लिए",
      "K": "खून में पोटेशियम की मात्रा — दिल और किडनी के लिए ज़रूरी",
      "CA": "खून में कैल्शियम की मात्रा — हड्डी और नसों के लिए",
      "MG": "खून में मैग्नीशियम की मात्रा",
      "PHOS": "खून में फॉस्फोरस की मात्रा",
      "UA": "यूरिक एसिड की जाँच — गाउट (gout) की जाँच के लिए",
      "IRON": "खून में आयरन की मात्रा — खून की कमी जाँचने के लिए",
      "TIBC": "आयरन ले जाने की क्षमता जाँचने के लिए",
      "FERR": "शरीर में जमा आयरन की मात्रा जाँचने के लिए",
      "B12": "विटामिन B12 की कमी जाँचने के लिए — नसों और खून के लिए ज़रूरी",
      "VITD": "विटामिन डी की कमी जाँचने के लिए — हड्डियों के लिए ज़रूरी",
      "FOLATE": "फोलिक एसिड की कमी जाँचने के लिए",
      "ABG": "खून में ऑक्सीजन और CO2 की मात्रा — साँस की गंभीर बीमारी में",
      "AMYL": "अग्नाशय (pancreas) की सूजन जाँचने के लिए",
      "LIPASE": "अग्नाशय की बीमारी जाँचने के लिए",
      // Liver
      "LFT": "लिवर (जिगर) की पूरी जाँच",
      "SGOT": "लिवर और दिल की मांसपेशियों की जाँच",
      "SGPT": "लिवर की जाँच — यह बढ़ा हो तो लिवर में सूजन है",
      "TBIL": "पीलिया (jaundice) की जाँच — खून में पित्त की मात्रा",
      "DBIL": "पित्त नली की रुकावट जाँचने के लिए",
      "ALP": "हड्डी और लिवर की बीमारी जाँचने के लिए",
      "GGT": "लिवर की बीमारी और शराब के प्रभाव जाँचने के लिए",
      "ALB": "लिवर की कार्यक्षमता और पोषण जाँचने के लिए",
      // Renal
      "RFT": "किडनी (गुर्दे) की पूरी जाँच",
      "CREAT": "किडनी की कार्यक्षमता जाँचने के लिए",
      "BUN": "किडनी द्वारा यूरिया फिल्टर करने की क्षमता",
      "EGFR": "किडनी कितनी अच्छी तरह काम कर रही है — यह नंबर जाँचता है",
      "U24P": "24 घंटे के पेशाब में प्रोटीन — किडनी की बीमारी जाँचने के लिए",
      "ACR": "किडनी की बारीक नसों की जाँच (मधुमेह में ज़रूरी)",
      // Lipid
      "LIPID": "कोलेस्ट्रॉल की पूरी जाँच — दिल की बीमारी का खतरा जाँचने के लिए",
      "TC": "कुल कोलेस्ट्रॉल की मात्रा",
      "HDL": "अच्छा कोलेस्ट्रॉल — यह ज़्यादा होना अच्छा है",
      "LDL": "बुरा कोलेस्ट्रॉल — यह कम होना अच्छा है",
      "TG": "ट्राइग्लिसराइड (चर्बी) — दिल की बीमारी का खतरा जाँचने के लिए",
      "VLDL": "बहुत कम घनत्व वाला कोलेस्ट्रॉल",
      // Coagulation
      "PT_INR": "खून जमने में लगने वाला समय — वार्फरिन लेने वालों के लिए ज़रूरी",
      "INR": "खून जमने की जाँच — warfarin की मात्रा सही है या नहीं",
      "APTT": "खून जमने की क्षमता जाँचने के लिए",
      "DDIMER": "खून के थक्के (clot) की जाँच — DVT और PE संदेह में",
      "FIB": "फाइब्रिनोजेन — खून जमाने वाला प्रोटीन",
      "BT": "खून बंद होने में लगने वाला समय",
      // Thyroid/Endocrine
      "TSH": "थायरॉइड ग्रंथि की जाँच — TSH बढ़ा हो तो थायरॉइड कम काम कर रहा है",
      "T3": "थायरॉइड हार्मोन T3 की मात्रा",
      "T4": "थायरॉइड हार्मोन T4 की मात्रा",
      "FT3": "मुक्त थायरॉइड हार्मोन T3",
      "FT4": "मुक्त थायरॉइड हार्मोन T4",
      "ANTITPO": "थायरॉइड पर हमला करने वाली एंटीबॉडी — ऑटोइम्यून थायरॉइड की जाँच",
      "PTH": "पैराथायरॉइड हार्मोन — कैल्शियम नियंत्रण की जाँच",
      "CORT": "कॉर्टिसोल हार्मोन — अधिवृक्क ग्रंथि की जाँच",
      "FSH": "महिलाओं में अंडाशय और पुरुषों में शुक्राणु की जाँच",
      "LH": "प्रजनन हार्मोन LH की जाँच",
      "PRL": "प्रोलैक्टिन हार्मोन — स्तन से दूध और मासिक धर्म की जाँच",
      "E2": "महिला हार्मोन एस्ट्रोजन की जाँच",
      "PROG": "प्रोजेस्टेरोन हार्मोन की जाँच",
      "TESTO": "पुरुष हार्मोन टेस्टोस्टेरोन की जाँच",
      "AMH": "अंडाशय में बचे अंडों की संख्या जाँचने के लिए (प्रजनन जाँच)",
      "INSF": "इंसुलिन की मात्रा — इंसुलिन प्रतिरोध जाँचने के लिए",
      "HOMA": "इंसुलिन प्रतिरोध (insulin resistance) की जाँच",
      // Cardiology
      "TROPI": "दिल के दौरे (heart attack) की जाँच — सीने में दर्द होने पर",
      "TROPT": "दिल के दौरे की जाँच (Troponin T)",
      "CKMB": "दिल की मांसपेशियों की क्षति जाँचने के लिए",
      "CPK": "मांसपेशियों की क्षति जाँचने के लिए",
      "BNP": "दिल की विफलता (heart failure) जाँचने के लिए",
      "NTPROBNP": "दिल की विफलता की जाँच (NT-proBNP)",
      "HSCRP": "दिल की बीमारी का खतरा जाँचने के लिए",
      "LDH": "मांसपेशियों और लिवर की क्षति जाँचने के लिए",
      // Serology
      "CRP": "शरीर में सूजन और इन्फेक्शन जाँचने के लिए",
      "RAF": "रूमेटाइड आर्थराइटिस (गठिया) जाँचने के लिए",
      "ASO": "गले के स्ट्रेप्टोकोकल इन्फेक्शन की जाँच — बुखार और जोड़ों के दर्द में",
      "WIDAL": "टाइफाइड बुखार की जाँच",
      "DENGNS1": "डेंगू बुखार की जाँच (NS1 एंटीजन)",
      "DENGIGG": "पुराने डेंगू इन्फेक्शन की जाँच",
      "DENGIGM": "नए डेंगू इन्फेक्शन की जाँच",
      "DENGCOMBO": "डेंगू की पूरी जाँच (NS1 + IgG + IgM)",
      "MAL": "मलेरिया की जाँच (RDT)",
      "MPSMEAR": "मलेरिया की पक्की जाँच (खून की स्लाइड)",
      "HBSAG": "हेपेटाइटिस बी (पीलिया) की जाँच",
      "HCV": "हेपेटाइटिस सी की जाँच",
      "HBVDNA": "हेपेटाइटिस बी वायरस की मात्रा जाँचने के लिए",
      "HCVRNA": "हेपेटाइटिस सी वायरस की मात्रा जाँचने के लिए",
      "HIV": "HIV/AIDS की जाँच",
      "HIVVL": "HIV वायरस की मात्रा जाँचने के लिए",
      "CD4": "HIV में रोग प्रतिरोधक क्षमता जाँचने के लिए",
      "VDRL": "सिफलिस (यौन रोग) की जाँच",
      "COVIDRAT": "कोविड-19 की त्वरित जाँच (Rapid Antigen Test)",
      "COVIDPCR": "कोविड-19 की पक्की जाँच (RT-PCR)",
      "HPYLST": "पेट में H. pylori बैक्टीरिया की जाँच (मल से)",
      "HPYLUBT": "पेट में H. pylori की जाँच (सांस परीक्षण)",
      "LEPTO": "लेप्टोस्पायरोसिस (बाढ़ के बाद बुखार) की जाँच",
      "SCRUB": "स्क्रब टाइफस (कीड़े के काटने से बुखार) की जाँच",
      "CHIK": "चिकनगुनिया की जाँच",
      // Autoimmune
      "ANA": "ऑटोइम्यून बीमारी (SLE/lupus) की जाँच",
      "DSDNA": "SLE (Lupus) की पक्की जाँच",
      "ACCP": "रूमेटाइड आर्थराइटिस की विशेष जाँच",
      "ANCA": "रक्त वाहिनियों की सूजन जाँचने के लिए",
      "C3": "रोग प्रतिरोधक प्रणाली की जाँच (Complement C3)",
      "C4": "रोग प्रतिरोधक प्रणाली की जाँच (Complement C4)",
      "APLA": "खून के थक्के और गर्भपात के कारण जाँचने के लिए",
      "IGE": "एलर्जी की जाँच (कुल IgE)",
      "TTGA": "सीलिएक रोग (गेहूँ से एलर्जी) की जाँच",
      "GADA": "Type 1 Diabetes की जाँच",
      // Urine/Stool
      "URINE": "पेशाब की पूरी जाँच — किडनी, मूत्र नली और शुगर जाँचने के लिए",
      "URINECS": "पेशाब में इन्फेक्शन और सही दवाई जाँचने के लिए",
      "UPT": "गर्भावस्था जाँचने के लिए (pregnancy test)",
      "UMICRO": "किडनी की बारीक क्षति जाँचने के लिए (diabetics में ज़रूरी)",
      "UDRUG": "शरीर में नशीले पदार्थ जाँचने के लिए",
      "STOOL": "पेट में कीड़े, इन्फेक्शन और पाचन जाँचने के लिए",
      "STOOLCS": "पेट के इन्फेक्शन की दवाई जाँचने के लिए",
      "FOB": "मल में छुपा खून जाँचने के लिए (आँत के कैंसर की स्क्रीनिंग)",
      "STOOLOP": "पेट में परजीवी (worms/amoeba) जाँचने के लिए",
      "STOOLCAL": "आँत की सूजन जाँचने के लिए (Crohn's/UC)",
      "CDIFF": "दस्त में Clostridium difficile बैक्टीरिया जाँचने के लिए",
      // Microbiology
      "BLOODCS": "खून के गंभीर इन्फेक्शन की जाँच और सही दवाई ढूंढने के लिए",
      "SPUTCS": "बलगम के इन्फेक्शन की जाँच",
      "SPUTAFB": "TB (तपेदिक/क्षयरोग) की जाँच",
      "GENEX": "TB की तेज़ और पक्की जाँच (GeneXpert)",
      "MANTOUX": "TB का पुराना इन्फेक्शन जाँचने के लिए (skin test)",
      "QFTB": "TB की आधुनिक जाँच (रक्त परीक्षण)",
      "THROATCS": "गले के इन्फेक्शन की जाँच",
      "WOUNDCS": "घाव के इन्फेक्शन की जाँच",
      "KOH": "त्वचा के फंगल इन्फेक्शन की जाँच",
      "CSFCS": "दिमाग की झिल्ली के इन्फेक्शन (meningitis) की जाँच",
      "MRSA": "दवा-प्रतिरोधी बैक्टीरिया MRSA की जाँच",
      // Tumour Markers
      "PSA": "प्रोस्टेट कैंसर की जाँच (पुरुषों में)",
      "CA125": "अंडाशय (ovarian) कैंसर की जाँच",
      "CA199": "अग्नाशय (pancreatic) कैंसर की जाँच",
      "CA153": "स्तन (breast) कैंसर की जाँच",
      "CEA": "बड़ी आँत और फेफड़े के कैंसर की जाँच",
      "AFP": "लिवर कैंसर और कुछ जन्मजात बीमारियों की जाँच",
      "BHCG": "गर्भावस्था और कुछ ट्यूमर की जाँच",
      "NSE": "फेफड़े के small cell कैंसर की जाँच",
      "CYFRA": "फेफड़े के squamous cell कैंसर की जाँच",
      "SPEP": "खून में असामान्य प्रोटीन जाँचने के लिए (myeloma की जाँच)",
      "B2MG": "मल्टीपल मायलोमा और लिम्फोमा की जाँच",
      // Radiology
      "CXR": "छाती का X-ray — फेफड़े, दिल और हड्डी देखने के लिए",
      "XRAYABD": "पेट का X-ray — आँत की रुकावट या पथरी देखने के लिए",
      "USGABD": "पेट का अल्ट्रासाउंड — लिवर, किडनी, पित्ताशय देखने के लिए",
      "USGPELV": "पेल्विस का अल्ट्रासाउंड — गर्भाशय और अंडाशय देखने के लिए",
      "USGKUB": "किडनी और मूत्र नली का अल्ट्रासाउंड — पथरी देखने के लिए",
      "USGNECK": "गर्दन का अल्ट्रासाउंड — थायरॉइड ग्रंथि देखने के लिए",
      "USGOBS": "गर्भावस्था का अल्ट्रासाउंड — बच्चे की वृद्धि देखने के लिए",
      "HRCT": "फेफड़ों की विस्तृत CT — COVID, TB, ILD जाँचने के लिए",
      "CTHP": "दिमाग का CT — चोट, स्ट्रोक देखने के लिए",
      "CTABDP": "पेट का CT — ट्यूमर और अंगों की विस्तृत जाँच",
      "CTPA": "फेफड़े की नसों में थक्का (PE) जाँचने के लिए",
      "MRIBRAIN": "दिमाग का MRI — स्ट्रोक, ट्यूमर, MS देखने के लिए",
      "MRISPINE": "रीढ़ की हड्डी का MRI — slip disc, दबाव जाँचने के लिए",
      "DEXA": "हड्डियों का घनत्व — ऑस्टियोपोरोसिस जाँचने के लिए",
      "MAMMO": "स्तन कैंसर की स्क्रीनिंग (mammography)",
      "PETCT": "कैंसर फैलाव जाँचने के लिए (PET-CT scan)",
      // ECG/Cardiology Procedures
      "ECG": "दिल की विद्युत गतिविधि जाँचने के लिए — दिल के दौरे और धड़कन की अनियमितता",
      "ECHO": "दिल का अल्ट्रासाउंड — वाल्व और दिल की पंपिंग जाँचने के लिए",
      "TMT": "कसरत के दौरान दिल की जाँच — एनजाइना देखने के लिए",
      "HOLTER": "24 घंटे दिल की निगरानी — अनियमित धड़कन जाँचने के लिए",
      "ABPM": "24 घंटे BP की निगरानी — BP का सही माप",
      // Pulmonology
      "PFT": "साँस की क्षमता जाँचने के लिए — दमा और COPD की जाँच",
      "SPO2": "खून में ऑक्सीजन की मात्रा जाँचने के लिए",
      "PSG": "नींद की जाँच — खर्राटे और sleep apnea देखने के लिए",
      // Gastroenterology
      "OGD": "पेट और आँत की एंडोस्कोपी — अल्सर और कैंसर देखने के लिए",
      "COLON": "बड़ी आँत की जाँच (colonoscopy) — कैंसर स्क्रीनिंग",
      "MRCP": "पित्त नली और अग्नाशय की MRI जाँच",
      // Neurology
      "EEG": "दिमाग की विद्युत गतिविधि — मिर्गी (epilepsy) जाँचने के लिए",
      "NCS": "नसों की गति जाँचने के लिए — neuropathy और carpal tunnel",
      "EMG": "मांसपेशियों की विद्युत गतिविधि जाँचने के लिए",
      // Gynaecology
      "BHCG_G": "गर्भावस्था पक्की करने के लिए (रक्त HCG)",
      "PAPSMEAR": "गर्भाशय ग्रीवा के कैंसर की स्क्रीनिंग",
      "HPVDNA": "गर्भाशय ग्रीवा के कैंसर का वायरस जाँचने के लिए",
      "SEMEN": "पुरुष बाँझपन की जाँच — शुक्राणु की संख्या और गुणवत्ता",
      "TORCH": "गर्भावस्था में संक्रमण की जाँच (Toxoplasma, Rubella, CMV, HSV)",
      "NTSCAN": "गर्भ में Down Syndrome का खतरा जाँचने के लिए",
      "ANOMALY": "गर्भ में बच्चे की सामान्य वृद्धि और अंगों की जाँच",
      "GCT": "गर्भावस्था में शुगर की जाँच",
      "OGTTG": "गर्भावस्था में मधुमेह (gestational diabetes) की जाँच",
      // Paediatric
      "NEONSCR": "नवजात शिशु की थायरॉइड और अन्य जाँच",
      "BONEAGE": "बच्चे की हड्डी की उम्र जाँचने के लिए — लंबाई रुकने पर",
      "LEAD": "खून में सीसा (lead) की मात्रा जाँचने के लिए",
      // Others
      "FNAC": "गाँठ या ट्यूमर की बारीक सुई से जाँच",
      "BIOPSY": "ऊतक की जाँच — कैंसर की पुष्टि के लिए",
      "IHC": "कैंसर के प्रकार की विस्तृत जाँच",
      "FLOWCYT": "खून के कैंसर (leukaemia/lymphoma) की विस्तृत जाँच",
      "UROFLOW": "पेशाब की धार और प्रोस्टेट जाँचने के लिए",
      "AUDIO": "सुनने की क्षमता जाँचने के लिए",
      "IOP": "आँख का दबाव — काला मोतिया (glaucoma) जाँचने के लिए",
      "FUNDO": "आँख के पर्दे की जाँच — मधुमेह और BP का आँख पर असर",
      "SPT": "एलर्जी परीक्षण — त्वचा पर एलर्जी जाँचने के लिए",
      "TDM": "दवाई का स्तर खून में जाँचने के लिए",
    };

    function getLabPurpose(code: string, name: string): string {
      return LAB_PURPOSE_MAP[code] || "";
    }

    w.document.write(`<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"/><title>Lab Request - ${order.patient_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'DM Sans',sans-serif;padding:28px;color:#1a1a2e;font-size:13px;background:white}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f4c81;padding-bottom:14px;margin-bottom:18px}
      .hosp-name{font-size:20px;font-weight:800;color:#0f4c81}
      .hosp-sub{font-size:11px;color:#666;margin-top:3px}
      .lab-title{font-size:15px;font-weight:700;color:#b91c1c;border:2px solid #b91c1c;padding:4px 14px;border-radius:6px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fbff;padding:14px;border-radius:8px;margin-bottom:16px;border:1px solid #d1e3f8}
      .info-item label{font-size:9px;color:#888;font-weight:700;text-transform:uppercase;display:block;margin-bottom:2px}
      .info-item span{font-size:14px;font-weight:600;color:#1a1a2e}
      .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;padding:5px 10px;border-radius:5px}
      .stat-section .section-title{background:#fef2f2;color:#b91c1c}
      .urgent-section .section-title{background:#fffbeb;color:#b45309}
      .routine-section .section-title{background:#f0fdf4;color:#15803d}
      .test-row{padding:8px 12px;border-radius:7px;margin-bottom:5px;border:1px solid #e8edf3;background:white}
      .test-top{display:flex;align-items:center;gap:8px}
      .checkbox{width:14px;height:14px;border:2px solid #aaa;border-radius:3px;display:inline-block;flex-shrink:0}
      .test-name{font-weight:700;font-size:13px;color:#1a1a2e;flex:1}
      .test-code{font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 6px;border-radius:4px}
      .test-purpose{font-family:'Noto Sans Devanagari',sans-serif;font-size:11px;color:#0f4c81;margin-top:4px;margin-left:22px;background:#f0f7ff;padding:3px 8px;border-radius:4px;border-left:2px solid #bfdbfe}
      .test-notes{font-size:10px;color:#666;font-style:italic;margin-top:2px;margin-left:22px}
      .patient-hindi{font-family:'Noto Sans Devanagari',sans-serif;background:#fffbf0;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#555}
      .patient-hindi strong{color:#b45309}
      .footer{margin-top:20px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#999}
      .sign-box{border-top:1px solid #333;width:180px;text-align:center;padding-top:6px;font-size:11px;color:#555}
      @media print{body{padding:14px}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="hosp-name">${hospitalConfig.name}</div>
        <div class="hosp-sub">${hospitalConfig.address}, ${hospitalConfig.city} · ${hospitalConfig.phone}</div>
      </div>
      <div class="lab-title">🔬 LAB REQUEST FORM</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><label>Patient Name / मरीज़ का नाम</label><span>${order.patient_name}</span></div>
      <div class="info-item"><label>Order Date / तारीख</label><span>${order.ordered_at.split("T")[0]}</span></div>
      <div class="info-item"><label>Ordered By / डॉक्टर</label><span>${hospitalConfig.doctorName}</span></div>
      <div class="info-item"><label>Diagnosis / बीमारी</label><span>${order.diagnosis || "—"}</span></div>
    </div>

    <div class="patient-hindi">
      🏥 <strong>मरीज़ के लिए:</strong> नीचे दी गई जाँचें करवानी हैं। हर जाँच के सामने उसका कारण लिखा है ताकि आप समझ सकें।
    </div>

    ${statTests.length ? `<div class="stat-section" style="margin-bottom:14px">
      <div class="section-title">🚨 STAT — तुरंत करें (Process Immediately)</div>
      ${statTests.map(t => `<div class="test-row">
        <div class="test-top"><span class="checkbox"></span><span class="test-name">${t.name}</span><span class="test-code">${t.code}</span></div>
        ${getLabPurpose(t.code, t.name) ? `<div class="test-purpose">💡 ${getLabPurpose(t.code, t.name)}</div>` : ""}
        ${t.notes ? `<div class="test-notes">📝 ${t.notes}</div>` : ""}
      </div>`).join("")}
    </div>` : ""}

    ${urgentTests.length ? `<div class="urgent-section" style="margin-bottom:14px">
      <div class="section-title">⚡ URGENT — जल्दी करें</div>
      ${urgentTests.map(t => `<div class="test-row">
        <div class="test-top"><span class="checkbox"></span><span class="test-name">${t.name}</span><span class="test-code">${t.code}</span></div>
        ${getLabPurpose(t.code, t.name) ? `<div class="test-purpose">💡 ${getLabPurpose(t.code, t.name)}</div>` : ""}
        ${t.notes ? `<div class="test-notes">📝 ${t.notes}</div>` : ""}
      </div>`).join("")}
    </div>` : ""}

    ${routineTests.length ? `<div class="routine-section" style="margin-bottom:14px">
      <div class="section-title">✓ ROUTINE — सामान्य जाँचें</div>
      ${routineTests.map(t => `<div class="test-row">
        <div class="test-top"><span class="checkbox"></span><span class="test-name">${t.name}</span><span class="test-code">${t.code}</span></div>
        ${getLabPurpose(t.code, t.name) ? `<div class="test-purpose">💡 ${getLabPurpose(t.code, t.name)}</div>` : ""}
        ${t.notes ? `<div class="test-notes">📝 ${t.notes}</div>` : ""}
      </div>`).join("")}
    </div>` : ""}

    <div class="footer">
      <div>Lab Order ID: LAB-${order.id.slice(0,8).toUpperCase()}<br/><span style="font-family:'Noto Sans Devanagari',sans-serif;font-size:10px;color:#bbb">यह कंप्यूटर द्वारा बनाई गई जाँच पर्ची है</span></div>
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
    const w = window.open("", "_blank", "width=860,height=1000");
    if (!w) return;
    const medicines = p.medicine.split("\n");
    const dosages = (p.dosage || "").split("\n");
    const durations = (p.duration || "").split("\n");
    const routes = (p.route || "").split("\n");
    const instructions = (p.instructions || "").split("\n");

    // Get follow-up date from clinic_followups localStorage
    let followUpDate = p.followup || "";
    let followUpReason = "";
    try {
      const fuList = JSON.parse(localStorage.getItem("clinic_followups") || "[]");
      const linked = fuList.find((f: any) =>
        f.prescriptionId === p.id || f.patientId === p.patient_id
      );
      if (linked) { followUpDate = linked.dueDate; followUpReason = linked.reason || ""; }
    } catch {}

    // Hindi translations for common dosage patterns
    function hindiDosage(dosage: string): string {
      if (!dosage || dosage === "—") return "—";
      return dosage
        .replace(/1-0-1/gi, "सुबह १ · दोपहर — · रात १")
        .replace(/1-1-1/gi, "सुबह १ · दोपहर १ · रात १")
        .replace(/0-0-1/gi, "सुबह — · दोपहर — · रात १")
        .replace(/1-0-0/gi, "सुबह १ · दोपहर — · रात —")
        .replace(/0-1-0/gi, "सुबह — · दोपहर १ · रात —")
        .replace(/once daily/gi, "दिन में एक बार")
        .replace(/twice daily/gi, "दिन में दो बार")
        .replace(/thrice daily/gi, "दिन में तीन बार")
        .replace(/sos/gi, "जरूरत पड़ने पर")
        .replace(/at night/gi, "रात को सोते समय")
        .replace(/before food/gi, "खाने से पहले")
        .replace(/after food/gi, "खाने के बाद")
        .replace(/with food/gi, "खाने के साथ");
    }

    function hindiDuration(dur: string): string {
      if (!dur || dur === "—") return "—";
      return dur
        .replace(/(\d+)\s*days?/gi, (_, n) => `${n} दिन`)
        .replace(/(\d+)\s*weeks?/gi, (_, n) => `${n} हफ्ते`)
        .replace(/(\d+)\s*months?/gi, (_, n) => `${n} महीने`)
        .replace(/ongoing/gi, "जारी रखें")
        .replace(/as directed/gi, "डॉक्टर के अनुसार");
    }

    function hindiRoute(route: string): string {
      const map: Record<string, string> = {
        "oral": "मुँह से", "topical": "त्वचा पर लगाएं", "injection": "इंजेक्शन",
        "inhalation": "सांस द्वारा", "eye drops": "आँख में डालें", "ear drops": "कान में डालें",
        "nasal drops": "नाक में डालें", "sublingual": "जीभ के नीचे",
      };
      return map[route.toLowerCase()] || route;
    }

    // ── Medicine purpose in Hindi ──────────────────────
    // keywords (lowercase) → Hindi purpose string
    const MED_PURPOSE: Array<{ keywords: string[]; purpose: string }> = [
      // Pain & Fever
      { keywords: ["paracetamol","crocin","dolo","calpol","p-500","pyrigesic","fepanil"],
        purpose: "बुखार और दर्द कम करने के लिए" },
      { keywords: ["ibuprofen","brufen","advil","nurofen"],
        purpose: "दर्द, सूजन और बुखार कम करने के लिए" },
      { keywords: ["diclofenac","voveran","voltaren","diclac"],
        purpose: "जोड़ों का दर्द और सूजन कम करने के लिए" },
      { keywords: ["aceclofenac","aceclo","hifenac","zerodol"],
        purpose: "दर्द और सूजन कम करने के लिए" },
      { keywords: ["combiflam"],
        purpose: "बुखार, दर्द और सूजन कम करने के लिए" },
      { keywords: ["tramadol","ultram","tramazac"],
        purpose: "तेज दर्द कम करने के लिए" },
      // Antibiotics
      { keywords: ["amoxicillin","mox","novamox","amoxil"],
        purpose: "बैक्टीरिया से होने वाले संक्रमण (इन्फेक्शन) के इलाज के लिए" },
      { keywords: ["amoxiclav","augmentin","clavam","co-amoxiclav"],
        purpose: "बैक्टीरियल इन्फेक्शन — गले, कान, फेफड़े या पेशाब की नली के लिए" },
      { keywords: ["azithromycin","azee","zithromax","azithral"],
        purpose: "बैक्टीरियल इन्फेक्शन — श्वास नली, गले या छाती के लिए" },
      { keywords: ["ciprofloxacin","ciplox","cifran","cipro"],
        purpose: "पेशाब, पेट या अन्य बैक्टीरियल इन्फेक्शन के लिए" },
      { keywords: ["levofloxacin","levoflox","levox","tavanic"],
        purpose: "फेफड़े, पेशाब या त्वचा के इन्फेक्शन के लिए" },
      { keywords: ["metronidazole","flagyl","metrogyl","metro"],
        purpose: "पेट के इन्फेक्शन और कीड़ों (अमीबा/giardia) के लिए" },
      { keywords: ["doxycycline","doxy","doxt","doxylin"],
        purpose: "बैक्टीरियल और कुछ वायरल इन्फेक्शन के लिए" },
      { keywords: ["cefixime","suprax","taxim","cefix"],
        purpose: "गले, कान, पेशाब या श्वास नली के इन्फेक्शन के लिए" },
      { keywords: ["ceftriaxone","monocef","rocephin"],
        purpose: "गंभीर बैक्टीरियल इन्फेक्शन के लिए (इंजेक्शन)" },
      { keywords: ["nitrofurantoin","macrobid","nitrofur"],
        purpose: "पेशाब की नली के इन्फेक्शन (UTI) के लिए" },
      // Stomach / GI
      { keywords: ["omeprazole","omez","prilosec","ocid"],
        purpose: "पेट की जलन, एसिडिटी और अल्सर के लिए" },
      { keywords: ["pantoprazole","pan","pantop","protonix","pantocid"],
        purpose: "एसिडिटी, पेट की जलन और अल्सर के लिए" },
      { keywords: ["ranitidine","rantac","zantac","aciloc"],
        purpose: "एसिडिटी और पेट की जलन कम करने के लिए" },
      { keywords: ["domperidone","domstal","motilium","vomitas"],
        purpose: "उल्टी और जी मिचलाने से राहत के लिए" },
      { keywords: ["ondansetron","emeset","zofran","vomceran"],
        purpose: "उल्टी रोकने के लिए" },
      { keywords: ["metoclopramide","reglan","perinorm"],
        purpose: "उल्टी और पेट की गड़बड़ी के लिए" },
      { keywords: ["loperamide","imodium","eldoper"],
        purpose: "दस्त (डायरिया) रोकने के लिए" },
      { keywords: ["ors","electral","pedialyte","electrolyte"],
        purpose: "दस्त में शरीर का पानी और नमक पूरा करने के लिए" },
      { keywords: ["lactulose","duphalac","lacson"],
        purpose: "कब्ज़ (constipation) दूर करने के लिए" },
      // Blood Pressure
      { keywords: ["amlodipine","amlip","amlong","norvasc","stamlo"],
        purpose: "ब्लड प्रेशर (BP) कम करने के लिए — रोज़ लें, बीच में बंद न करें" },
      { keywords: ["enalapril","enaril","envas","vasotec"],
        purpose: "ब्लड प्रेशर और दिल की बीमारी के लिए" },
      { keywords: ["ramipril","ramace","cardace","tritace"],
        purpose: "ब्लड प्रेशर और किडनी की सुरक्षा के लिए" },
      { keywords: ["losartan","losar","cozaar","losacar"],
        purpose: "ब्लड प्रेशर कम करने के लिए" },
      { keywords: ["telmisartan","telma","micardis","telday"],
        purpose: "ब्लड प्रेशर कम करने के लिए — रोज़ लें" },
      { keywords: ["metoprolol","betaloc","metolar","lopressor"],
        purpose: "ब्लड प्रेशर और दिल की धड़कन नियंत्रित करने के लिए" },
      { keywords: ["atenolol","tenormin","aten"],
        purpose: "ब्लड प्रेशर और तेज़ धड़कन के लिए" },
      { keywords: ["furosemide","lasix","frusemide"],
        purpose: "शरीर का अतिरिक्त पानी (सूजन) निकालने के लिए" },
      // Diabetes
      { keywords: ["metformin","glycomet","glucophage","bigomet"],
        purpose: "शुगर (डायबिटीज़) को नियंत्रित करने के लिए — खाने के साथ लें" },
      { keywords: ["glimepiride","amaryl","glimisave","glimpid"],
        purpose: "शुगर (blood glucose) कम करने के लिए — खाने से पहले लें" },
      { keywords: ["glipizide","minodiab","glucotrol"],
        purpose: "शुगर कम करने के लिए" },
      { keywords: ["sitagliptin","januvia","istavel","zita"],
        purpose: "शुगर को नियंत्रित करने के लिए (DPP-4 inhibitor)" },
      { keywords: ["insulin","insugen","huminsulin","lantus"],
        purpose: "शुगर को नियंत्रित करने के लिए (इंसुलिन इंजेक्शन)" },
      // Thyroid
      { keywords: ["levothyroxine","thyroxine","thyronorm","eltroxin"],
        purpose: "थायरॉइड हार्मोन की कमी पूरी करने के लिए — खाली पेट लें" },
      // Allergy / Cold
      { keywords: ["cetirizine","zyrtec","cetrizine","okacet"],
        purpose: "एलर्जी, खुजली, छींक और नाक बहने के लिए" },
      { keywords: ["loratadine","claritin","lorfast","loratin"],
        purpose: "एलर्जी और छींक के लिए — नींद नहीं लाती" },
      { keywords: ["montelukast","singulair","montair","telekast"],
        purpose: "एलर्जी और दमे (अस्थमा) की रोकथाम के लिए" },
      { keywords: ["phenylephrine","phenylephr","nasivion"],
        purpose: "बंद नाक खोलने के लिए" },
      { keywords: ["benadryl","diphenhydramine","chlorphen"],
        purpose: "एलर्जी, खाँसी और नींद न आने पर" },
      // Cough
      { keywords: ["dextromethorphan","dextro","alex","benylin"],
        purpose: "सूखी खाँसी (dry cough) कम करने के लिए" },
      { keywords: ["ambroxol","mucosolvan","ambrodil","ambrolite"],
        purpose: "बलगम (phlegm) पतला करके खाँसी में राहत के लिए" },
      { keywords: ["salbutamol","ventolin","asthalin","levolin"],
        purpose: "दमे (अस्थमा) और साँस फूलने पर — ज़रूरत पर लें" },
      { keywords: ["budesonide","pulmicort","budecort","foracort"],
        purpose: "दमे और साँस नली की सूजन रोकने के लिए (इन्हेलर)" },
      // Vitamins / Supplements
      { keywords: ["vitamin d","cholecalciferol","calcirol","d3"],
        purpose: "विटामिन डी की कमी पूरी करने के लिए — हड्डियों और रोग प्रतिरोधक क्षमता के लिए" },
      { keywords: ["calcium","calcitriol","shelcal","calcitas"],
        purpose: "हड्डियाँ मज़बूत करने और कैल्शियम की कमी के लिए" },
      { keywords: ["vitamin b12","cobalamin","mecobalamin","methycobal","b12"],
        purpose: "खून और नसों के लिए विटामिन B12 की कमी पूरी करने के लिए" },
      { keywords: ["folic acid","folate","folvite","folinic"],
        purpose: "खून बनाने और गर्भावस्था में बच्चे के विकास के लिए" },
      { keywords: ["ferrous","iron","livogen","ferium","fersolate"],
        purpose: "खून की कमी (anaemia/anemia) दूर करने के लिए" },
      { keywords: ["zinc","zincovit","zinconia"],
        purpose: "रोग प्रतिरोधक क्षमता और घाव भरने के लिए" },
      { keywords: ["multivitamin","supradyn","becosules","revital"],
        purpose: "शरीर की पोषण की कमी पूरी करने के लिए" },
      // Cholesterol
      { keywords: ["atorvastatin","atorva","lipitor","atorlip","aztor"],
        purpose: "कोलेस्ट्रॉल कम करने और दिल की बीमारी से बचाव के लिए — रात को लें" },
      { keywords: ["rosuvastatin","rozavel","crestor","rosuvas"],
        purpose: "कोलेस्ट्रॉल कम करने के लिए" },
      { keywords: ["simvastatin","zocor","simcard","simvatin"],
        purpose: "कोलेस्ट्रॉल और ट्राइग्लिसराइड कम करने के लिए" },
      // Heart / Blood thinners
      { keywords: ["aspirin","ecosprin","disprin","loprin"],
        purpose: "खून पतला करने और दिल के दौरे से बचाव के लिए — खाने के बाद लें" },
      { keywords: ["clopidogrel","plavix","clopilet","plagril"],
        purpose: "खून के थक्के बनने से रोकने के लिए — दिल या नस की बीमारी में" },
      { keywords: ["warfarin","coumadin","warf"],
        purpose: "खून के थक्के (clot) बनने से रोकने के लिए — नियमित जाँच ज़रूरी" },
      { keywords: ["digoxin","lanoxin","digitalis"],
        purpose: "दिल की धड़कन सामान्य रखने के लिए" },
      // Pain / Neuro
      { keywords: ["pregabalin","lyrica","pregalin","pregabid"],
        purpose: "नसों के दर्द और जलन के लिए" },
      { keywords: ["gabapentin","neurontin","gabantin"],
        purpose: "नसों के दर्द और दौरों के लिए" },
      { keywords: ["amitriptyline","elavil","amitril","tryptomer"],
        purpose: "नसों के दर्द, नींद न आना और अवसाद के लिए" },
      // Steroids
      { keywords: ["prednisolone","wysolone","deltacortril","omnacortil"],
        purpose: "सूजन, एलर्जी और प्रतिरोधक प्रतिक्रिया कम करने के लिए — डॉक्टर की सलाह से लें, अचानक बंद न करें" },
      { keywords: ["dexamethasone","dexona","decadron","dexacort"],
        purpose: "गंभीर सूजन और एलर्जी के लिए" },
      // Skin
      { keywords: ["clotrimazole","canesten","candid","clotrim"],
        purpose: "फंगल इन्फेक्शन (दाद, खाज) के लिए — त्वचा पर लगाएं" },
      { keywords: ["mupirocin","bactroban","mupicin"],
        purpose: "त्वचा के बैक्टीरियल इन्फेक्शन के लिए — घाव पर लगाएं" },
      { keywords: ["hydrocortisone","hydrocort","locoid"],
        purpose: "खुजली और त्वचा की सूजन के लिए — प्रभावित जगह पर लगाएं" },
      // Urology
      { keywords: ["tamsulosin","urimax","flomax","veltam"],
        purpose: "पेशाब करने में तकलीफ (prostate) के लिए — रात को लें" },
      // Antifungal
      { keywords: ["fluconazole","flucos","forcan","syscan"],
        purpose: "फंगल इन्फेक्शन (candida) के लिए" },
      { keywords: ["itraconazole","itrasys","canditral","sporanox"],
        purpose: "फंगल इन्फेक्शन (दाद, नाखून) के लिए — खाने के साथ लें" },

      // ── Creams / Ointments / Gels ──
      { keywords: ["clotrimazole cream","clotrimazole 1%","miconazole cream","luliconazole","sertaconazole","ciclopirox","amorolfine","whitfield"],
        purpose: "दाद, खाज, फंगल इन्फेक्शन पर लगाने के लिए — प्रभावित जगह पर लगाएं" },
      { keywords: ["ketoconazole cream","ketoconazole shampoo"],
        purpose: "दाद, डैंड्रफ और फंगल इन्फेक्शन के लिए" },
      { keywords: ["terbinafine cream","terbinafine 1%"],
        purpose: "दाद और फंगल इन्फेक्शन के लिए — प्रभावित जगह पर लगाएं" },
      { keywords: ["hydrocortisone cream","hydrocortisone ointment"],
        purpose: "खुजली, लालिमा और त्वचा की सूजन कम करने के लिए" },
      { keywords: ["betamethasone cream","betamethasone ointment","betamethasone 0.05","betamethasone 0.1"],
        purpose: "त्वचा की सूजन, खुजली और एलर्जी के लिए — डॉक्टर की सलाह से लगाएं" },
      { keywords: ["clobetasol","dermovate"],
        purpose: "गंभीर त्वचा रोग और सूजन के लिए — थोड़ी मात्रा में लगाएं" },
      { keywords: ["mometasone cream","mometasone ointment"],
        purpose: "एग्ज़िमा, सोरायसिस और त्वचा की सूजन के लिए" },
      { keywords: ["mupirocin","bactroban","mupicin"],
        purpose: "घाव या त्वचा के बैक्टीरियल इन्फेक्शन के लिए — घाव पर लगाएं" },
      { keywords: ["fusidic acid cream","fusidic acid ointment"],
        purpose: "त्वचा के बैक्टीरियल इन्फेक्शन के लिए" },
      { keywords: ["silver sulfadiazine","ssd cream"],
        purpose: "जलने के घाव और त्वचा के गंभीर इन्फेक्शन के लिए" },
      { keywords: ["adapalene","differin"],
        purpose: "मुँहासे (acne) के इलाज के लिए — रात को सोने से पहले लगाएं" },
      { keywords: ["benzoyl peroxide","panoxyl"],
        purpose: "मुँहासे (pimples) के बैक्टीरिया मारने के लिए" },
      { keywords: ["tretinoin cream","tretinoin 0.025","tretinoin 0.05","tretinoin 0.1"],
        purpose: "मुँहासे, झुर्रियाँ और त्वचा की रंगत सुधारने के लिए — रात को लगाएं" },
      { keywords: ["azelaic acid"],
        purpose: "मुँहासे और चेहरे की असमान रंगत के लिए" },
      { keywords: ["clindamycin gel","clindamycin lotion","clindamycin 1%"],
        purpose: "मुँहासे के इन्फेक्शन के लिए" },
      { keywords: ["permethrin cream","permethrin 5%"],
        purpose: "खाज (scabies) और जूँ के इलाज के लिए" },
      { keywords: ["benzyl benzoate"],
        purpose: "खाज (scabies) के इलाज के लिए — पूरे शरीर पर लगाएं" },
      { keywords: ["diclofenac gel","diclofenac 1% gel","ketoprofen gel","piroxicam gel","ibuprofen gel"],
        purpose: "जोड़ों के दर्द और मांसपेशियों के दर्द के लिए — दर्द वाली जगह पर लगाएं" },
      { keywords: ["methyl salicylate","volini","moov","iodex","himcocid"],
        purpose: "मांसपेशियों के दर्द और ऐंठन के लिए — मालिश करें" },
      { keywords: ["capsaicin cream","capsaicin 0.025","capsaicin 0.075"],
        purpose: "नसों के दर्द और जोड़ों के पुराने दर्द के लिए" },
      { keywords: ["lidocaine gel","lignocaine gel","emla cream","xylocaine gel"],
        purpose: "दर्द कम करने (सुन्न करने) के लिए — प्रभावित जगह पर लगाएं" },
      { keywords: ["acyclovir cream","acyclovir 5%"],
        purpose: "हर्पीज़ और मुँह के छाले के लिए — जल्दी लगाना शुरू करें" },
      { keywords: ["minoxidil 2%","minoxidil 5%","minoxidil solution"],
        purpose: "बालों का झड़ना कम करने और नए बाल उगाने के लिए — सिर पर लगाएं" },
      { keywords: ["hydroquinone cream","kojic acid cream","alpha arbutin"],
        purpose: "चेहरे के काले धब्बे और असमान रंगत के लिए" },
      { keywords: ["calamine lotion","calamine"],
        purpose: "खुजली, कीड़े के काटने और त्वचा की जलन के लिए" },
      { keywords: ["urea cream","urea 10%","urea 20%"],
        purpose: "रूखी और फटी त्वचा को नरम करने के लिए" },
      { keywords: ["lactic acid lotion","lactic acid 12%"],
        purpose: "रूखी त्वचा और एग्ज़िमा के लिए — स्नान के बाद लगाएं" },
      { keywords: ["petroleum jelly","white soft paraffin","vaseline"],
        purpose: "रूखी त्वचा, फटे होंठ और फटी एड़ियों के लिए" },
      { keywords: ["salicylic acid 6%","salicylic acid ointment"],
        purpose: "मस्सा (wart), कॉर्न और मोटी त्वचा हटाने के लिए" },
      { keywords: ["imiquimod cream","imiquimod 5%"],
        purpose: "मस्सा (genital warts) और त्वचा के कुछ कैंसर के लिए" },
      { keywords: ["sunscreen spf","sunscreen lotion","zinc oxide sunscreen"],
        purpose: "धूप से त्वचा की सुरक्षा के लिए — बाहर जाने से 20 मिनट पहले लगाएं" },
      { keywords: ["povidone iodine ointment","betadine ointment"],
        purpose: "घाव साफ करने और इन्फेक्शन रोकने के लिए" },

      // ── Ear / Eye / Nasal Drops ──
      { keywords: ["ciprofloxacin ear drops","ofloxacin ear drops","gentamicin ear drops"],
        purpose: "कान के इन्फेक्शन और दर्द के लिए — कान में डालें" },
      { keywords: ["clotrimazole ear drops","acetic acid ear drops"],
        purpose: "कान के फंगल इन्फेक्शन के लिए" },
      { keywords: ["xylometazoline","otrivin","nasivion","oxymetazoline"],
        purpose: "बंद नाक और जुकाम में राहत के लिए — 3 दिन से ज्यादा इस्तेमाल न करें" },
      { keywords: ["budesonide nasal","fluticasone nasal","mometasone nasal","triamcinolone nasal"],
        purpose: "एलर्जिक राइनाइटिस और बंद नाक के लिए — नाक में स्प्रे करें" },
      { keywords: ["saline nasal drops","saline nasal spray"],
        purpose: "बंद नाक साफ करने और नाक नम रखने के लिए — पूरी तरह सुरक्षित" },
      { keywords: ["tobramycin eye","gentamicin eye","moxifloxacin eye","ofloxacin eye drops","ciprofloxacin eye"],
        purpose: "आँख के बैक्टीरियल इन्फेक्शन के लिए — आँख में डालें" },
      { keywords: ["prednisolone eye","dexamethasone eye drops"],
        purpose: "आँख की सूजन और लालिमा के लिए" },
      { keywords: ["ketorolac eye","diclofenac eye drops"],
        purpose: "आँख के दर्द और ऑपरेशन के बाद सूजन के लिए" },
      { keywords: ["timolol eye","latanoprost","bimatoprost","brimonidine","dorzolamide"],
        purpose: "काला मोतिया (glaucoma) में आँख का दबाव कम करने के लिए — रोज़ लें" },
      { keywords: ["carboxymethylcellulose","hyaluronic acid eye","lubricant eye"],
        purpose: "आँखें सूखने पर (dry eyes) राहत के लिए" },

      // ── Syrups / Suspensions ──
      { keywords: ["ambroxol syrup","ambroxol 15mg","ambroxol 30mg","bromhexine syrup"],
        purpose: "छाती में जमे बलगम को पतला करने और खाँसी में राहत के लिए" },
      { keywords: ["dextromethorphan syrup","dextromethorphan 10mg","codeine linctus","pholcodine"],
        purpose: "सूखी खाँसी बंद करने के लिए" },
      { keywords: ["salbutamol syrup","salbutamol 2mg","terbutaline syrup","levosalbutamol"],
        purpose: "दमे (अस्थमा) और साँस की तकलीफ में राहत के लिए" },
      { keywords: ["theophylline syrup","aminophylline syrup"],
        purpose: "साँस की नली खोलने और दमे में राहत के लिए" },
      { keywords: ["montelukast granules","montelukast syrup"],
        purpose: "एलर्जी और दमे की रोकथाम के लिए — रात को लें" },
      { keywords: ["domperidone syrup","domperidone drops","domperidone 5mg"],
        purpose: "उल्टी रोकने और पेट की गड़बड़ी के लिए" },
      { keywords: ["ondansetron syrup","ondansetron 4mg syrup"],
        purpose: "उल्टी बंद करने के लिए" },
      { keywords: ["lactulose syrup","lactulose 10g"],
        purpose: "कब्ज़ दूर करने के लिए — असर 24-48 घंटे में दिखता है" },
      { keywords: ["oral rehydration","ors","electral"],
        purpose: "दस्त में शरीर का पानी और नमक पूरा करने के लिए — हर पतले दस्त के बाद दें" },
      { keywords: ["simethicone drops","gripe water","dimethicone drops"],
        purpose: "शिशु के पेट में गैस और दर्द के लिए" },
      { keywords: ["cetirizine syrup","levocetirizine syrup","loratadine syrup","desloratadine syrup"],
        purpose: "एलर्जी, खुजली, छींक और नाक बहने के लिए" },
      { keywords: ["chlorpheniramine syrup","diphenhydramine syrup","promethazine syrup"],
        purpose: "एलर्जी और खाँसी के लिए — नींद आ सकती है" },
      { keywords: ["ferrous sulphate syrup","iron polymaltose syrup","iron drops","ferrous ascorbate syrup"],
        purpose: "खून की कमी (anaemia) दूर करने के लिए — खाने के बाद दें" },
      { keywords: ["vitamin d drops","vitamin d 400iu","cholecalciferol drops"],
        purpose: "विटामिन डी की कमी पूरी करने के लिए — हड्डियाँ मज़बूत करता है" },
      { keywords: ["calcium syrup","calcium gluconate syrup","calcium vitamin d syrup"],
        purpose: "हड्डियाँ मज़बूत करने के लिए" },
      { keywords: ["multivitamin syrup","vitamin b complex syrup","lysine syrup"],
        purpose: "शरीर की पोषण की कमी और भूख बढ़ाने के लिए" },
      { keywords: ["zinc sulphate syrup","zinc syrup","zinc drops"],
        purpose: "दस्त में जल्दी ठीक होने और रोग प्रतिरोधक क्षमता के लिए" },
      { keywords: ["phenobarbitone syrup","phenytoin suspension","carbamazepine suspension","sodium valproate syrup","levetiracetam solution"],
        purpose: "दौरे (epilepsy/seizure) रोकने के लिए — नियमित रूप से लें, अचानक बंद न करें" },
      { keywords: ["budesonide respule","ipratropium nebule","salbutamol nebule","levosalbutamol respule"],
        purpose: "नेबुलाइज़र से साँस लेने के लिए — दमे और साँस की तकलीफ में" },

      // ── Injections ──
      { keywords: ["ceftriaxone injection","ceftriaxone 1g","ceftriaxone 2g"],
        purpose: "गंभीर बैक्टीरियल इन्फेक्शन के लिए (नस में या माँसपेशी में इंजेक्शन)" },
      { keywords: ["meropenem injection","imipenem injection","ertapenem"],
        purpose: "बहुत गंभीर और दवा-प्रतिरोधी इन्फेक्शन के लिए" },
      { keywords: ["vancomycin injection"],
        purpose: "MRSA और गंभीर बैक्टीरियल इन्फेक्शन के लिए" },
      { keywords: ["amikacin injection","gentamicin injection","tobramycin injection"],
        purpose: "गंभीर बैक्टीरियल इन्फेक्शन के लिए (इंजेक्शन)" },
      { keywords: ["metronidazole infusion","metronidazole 500mg injection"],
        purpose: "पेट के गंभीर इन्फेक्शन के लिए (नस में दवाई)" },
      { keywords: ["fluconazole infusion","amphotericin","caspofungin","voriconazole injection"],
        purpose: "गंभीर फंगल इन्फेक्शन के लिए" },
      { keywords: ["acyclovir injection","acyclovir 500mg"],
        purpose: "गंभीर हर्पीज़ वायरस इन्फेक्शन के लिए" },
      { keywords: ["diclofenac injection","ketorolac injection","tramadol injection","morphine injection","pethidine injection","fentanyl injection"],
        purpose: "तेज़ दर्द से तुरंत राहत के लिए (इंजेक्शन)" },
      { keywords: ["paracetamol infusion","paracetamol 1g infusion"],
        purpose: "बुखार और दर्द के लिए (नस में दवाई)" },
      { keywords: ["ondansetron injection","metoclopramide injection","granisetron injection"],
        purpose: "उल्टी रोकने के लिए (इंजेक्शन)" },
      { keywords: ["dexamethasone injection","hydrocortisone injection","methylprednisolone injection"],
        purpose: "गंभीर एलर्जी, सूजन और दमे के दौरे में (इंजेक्शन)" },
      { keywords: ["triamcinolone injection","betamethasone injection"],
        purpose: "जोड़ों की सूजन और एलर्जी के लिए (इंजेक्शन)" },
      { keywords: ["dopamine injection","noradrenaline injection","adrenaline injection"],
        purpose: "ब्लड प्रेशर बेहद कम होने पर (आईसीयू में उपयोग)" },
      { keywords: ["heparin injection","enoxaparin injection","enoxaparin 40mg","enoxaparin 60mg"],
        purpose: "खून के थक्के (clot) बनने से रोकने और DVT/PE के इलाज के लिए (इंजेक्शन)" },
      { keywords: ["furosemide injection","lasix injection"],
        purpose: "शरीर की सूजन और अतिरिक्त पानी निकालने के लिए (इंजेक्शन)" },
      { keywords: ["vitamin b12 injection","methylcobalamin injection","thiamine injection"],
        purpose: "विटामिन की गंभीर कमी पूरी करने के लिए (इंजेक्शन)" },
      { keywords: ["iron sucrose injection","ferric carboxymaltose injection","iron dextran"],
        purpose: "खून की कमी (anaemia) में आयरन की जल्दी पूर्ति के लिए (नस में इंजेक्शन)" },
      { keywords: ["magnesium sulphate injection","mgso4 injection"],
        purpose: "एक्लेम्पसिया (गर्भावस्था में दौरे) और मैग्नीशियम की कमी के लिए" },
      { keywords: ["calcium gluconate injection"],
        purpose: "कैल्शियम की कमी और हृदय की समस्या में (इंजेक्शन)" },
      { keywords: ["insulin regular injection","insulin glargine","insulin aspart","insulin lispro","insulin detemir"],
        purpose: "शुगर (डायबिटीज़) नियंत्रित करने के लिए (इंसुलिन इंजेक्शन)" },
      { keywords: ["glucagon injection"],
        purpose: "शुगर बेहद कम (hypoglycaemia) होने पर तुरंत लेने के लिए" },
      { keywords: ["oxytocin injection","methylergometrine injection"],
        purpose: "प्रसव में मदद और प्रसव के बाद खून बंद करने के लिए" },
      { keywords: ["liraglutide pen","semaglutide pen","dulaglutide pen","exenatide pen"],
        purpose: "शुगर (Type 2 Diabetes) नियंत्रित करने और वज़न कम करने के लिए (पेन इंजेक्शन)" },
      { keywords: ["zoledronic acid injection","pamidronate injection","denosumab injection"],
        purpose: "हड्डियाँ मज़बूत करने और ऑस्टियोपोरोसिस के इलाज के लिए (इंजेक्शन)" },
      { keywords: ["teriparatide injection"],
        purpose: "गंभीर ऑस्टियोपोरोसिस में हड्डी बनाने के लिए (रोज़ इंजेक्शन)" },
      { keywords: ["progesterone injection","anti-d injection"],
        purpose: "गर्भावस्था में हार्मोन की कमी पूरी करने के लिए" },

      // ── Psychiatric / Neurological ──
      { keywords: ["sertraline","zoloft","serta"],
        purpose: "अवसाद (depression), चिंता और OCD के लिए — असर 2-4 हफ्ते में" },
      { keywords: ["escitalopram","lexapro","cipralex","nexito"],
        purpose: "अवसाद और चिंता (anxiety) के लिए" },
      { keywords: ["fluoxetine","prozac","fludep","oleanz"],
        purpose: "अवसाद, OCD और bulimia के लिए" },
      { keywords: ["venlafaxine","effexor","venlift"],
        purpose: "अवसाद, चिंता और नसों के दर्द के लिए" },
      { keywords: ["duloxetine","cymbalta","duvanta"],
        purpose: "अवसाद, नसों के दर्द और fibromyalgia के लिए" },
      { keywords: ["quetiapine","seroquel","quetiapine fumarate"],
        purpose: "सिज़ोफ्रेनिया, बाइपोलर और नींद न आने के लिए" },
      { keywords: ["olanzapine","zyprexa","oleanz"],
        purpose: "सिज़ोफ्रेनिया और बाइपोलर डिसऑर्डर के लिए" },
      { keywords: ["risperidone","risperdal","sizodon"],
        purpose: "सिज़ोफ्रेनिया और व्यवहार सम्बन्धी समस्याओं के लिए" },
      { keywords: ["aripiprazole","abilify","arip"],
        purpose: "सिज़ोफ्रेनिया और अवसाद के लिए" },
      { keywords: ["lithium carbonate","lithosun","licab"],
        purpose: "बाइपोलर डिसऑर्डर में मूड स्थिर करने के लिए — नियमित जाँच ज़रूरी" },
      { keywords: ["clonazepam","rivotril","lonazep"],
        purpose: "दौरे, घबराहट और नींद न आने के लिए" },
      { keywords: ["diazepam","valium","calmpose"],
        purpose: "घबराहट, मांसपेशियों की ऐंठन और दौरे के लिए" },
      { keywords: ["alprazolam","xanax","alprax"],
        purpose: "घबराहट और पैनिक अटैक के लिए — आदत पड़ सकती है, लंबे समय न लें" },
      { keywords: ["zolpidem","ambien","nitrazepam"],
        purpose: "नींद न आने (insomnia) के लिए — सिर्फ सोने से पहले लें" },
      { keywords: ["melatonin"],
        purpose: "नींद का समय ठीक करने के लिए — सोने से 30 मिनट पहले लें" },
      { keywords: ["pregabalin","lyrica","pregalin"],
        purpose: "नसों के दर्द, जलन, दमे और फाइब्रोमायल्जिया के लिए" },
      { keywords: ["gabapentin","neurontin","gabantin"],
        purpose: "नसों के दर्द और दौरों के लिए" },
      { keywords: ["amitriptyline","tryptomer","elavil"],
        purpose: "नसों का दर्द, नींद न आना, माइग्रेन और अवसाद के लिए — रात को लें" },

      // ── Urology / Prostate ──
      { keywords: ["tamsulosin","urimax","flomax","veltam"],
        purpose: "पेशाब करने में तकलीफ (prostate की वजह से) के लिए — रात को लें" },
      { keywords: ["solifenacin","mirabegron","oxybutynin","tolterodine"],
        purpose: "पेशाब बार-बार आने और रुकने में तकलीफ के लिए" },
      { keywords: ["sildenafil","viagra","suhagra","manforce"],
        purpose: "यौन दुर्बलता (erectile dysfunction) के लिए — सम्बन्ध बनाने से 1 घंटे पहले लें" },
      { keywords: ["tadalafil","cialis","tadaga"],
        purpose: "यौन दुर्बलता और prostate की तकलीफ के लिए" },
      { keywords: ["dutasteride","avodart"],
        purpose: "बढ़े हुए प्रोस्टेट को छोटा करने के लिए" },
      { keywords: ["phenazopyridine","pyridium"],
        purpose: "पेशाब में जलन और दर्द से तुरंत राहत के लिए" },

      // ── Liver / GI Additional ──
      { keywords: ["ursodeoxycholic acid","udca","urso","ursocol"],
        purpose: "पित्त की पथरी घोलने और लिवर की बीमारी में लिवर बचाने के लिए" },
      { keywords: ["silymarin","legalon","silybon","livolin"],
        purpose: "लिवर की सुरक्षा और लिवर की सूजन कम करने के लिए" },
      { keywords: ["rifaximin"],
        purpose: "लिवर की बीमारी में पेट के बैक्टीरिया नियंत्रित करने के लिए" },
      { keywords: ["itopride","mosapride","trimebutine"],
        purpose: "पेट धीरे खाली होने और पेट भरा-भरा लगने की समस्या के लिए" },
      { keywords: ["prucalopride"],
        purpose: "गंभीर कब्ज़ के लिए" },
      { keywords: ["mesalazine","mesalamine","olsalazine","balsalazide"],
        purpose: "अल्सरेटिव कोलाइटिस और आँत की सूजन के लिए" },
      { keywords: ["pancreatin","creon","pankreoflat"],
        purpose: "अग्नाशय (pancreas) की कमज़ोरी में पाचन सुधारने के लिए — खाने के साथ लें" },
      { keywords: ["bisacodyl tablet","bisacodyl suppository","glycerine suppository"],
        purpose: "कब्ज़ दूर करने के लिए — 6-8 घंटे में असर" },
      { keywords: ["hyoscine butylbromide","buscopan","dicyclomine"],
        purpose: "पेट में ऐंठन और दर्द के लिए" },

      // ── Bone / Rheumatology ──
      { keywords: ["alendronate","fosamax","alenost"],
        purpose: "हड्डियाँ कमज़ोर होने (osteoporosis) से बचाने के लिए — हफ्ते में एक बार खाली पेट लें" },
      { keywords: ["risedronate","actonel"],
        purpose: "हड्डियों का घनत्व बढ़ाने के लिए — हफ्ते में एक बार" },
      { keywords: ["strontium ranelate"],
        purpose: "ऑस्टियोपोरोसिस में हड्डी बनाने और टूटने से बचाने के लिए" },
      { keywords: ["hydroxychloroquine","plaquenil","hcqs"],
        purpose: "गठिया (RA), SLE और मलेरिया के लिए — असर 3-6 महीने में दिखता है" },
      { keywords: ["sulfasalazine","salazopyrin"],
        purpose: "रूमेटाइड आर्थराइटिस और अल्सरेटिव कोलाइटिस के लिए" },
      { keywords: ["leflunomide","arava"],
        purpose: "रूमेटाइड आर्थराइटिस की सूजन और दर्द के लिए" },
      { keywords: ["colchicine"],
        purpose: "गाउट (gout) के दर्द और सूजन के लिए — हमले के शुरू में लें" },
      { keywords: ["allopurinol","zyloric","lopurin"],
        purpose: "यूरिक एसिड कम करने और गाउट की रोकथाम के लिए — रोज़ लें" },
      { keywords: ["febuxostat","febuget","uriconorm"],
        purpose: "यूरिक एसिड कम करने के लिए" },
      { keywords: ["methotrexate 2.5mg","methotrexate 7.5mg","methotrexate 10mg"],
        purpose: "रूमेटाइड आर्थराइटिस, सोरायसिस और कुछ कैंसर के लिए — हफ्ते में एक बार लें" },

      // ── Cardiology Additional ──
      { keywords: ["ticagrelor","brilinta"],
        purpose: "खून के थक्के बनने से रोकने और दिल के दौरे के बाद के लिए" },
      { keywords: ["rivaroxaban","xarelto"],
        purpose: "खून पतला करने और clot बनने से रोकने के लिए" },
      { keywords: ["apixaban","eliquis"],
        purpose: "खून के थक्के और AF में stroke से बचाव के लिए" },
      { keywords: ["dabigatran","pradaxa"],
        purpose: "खून पतला करने और AF में stroke से बचाव के लिए" },
      { keywords: ["spironolactone","aldactone"],
        purpose: "शरीर की सूजन, हृदय विफलता और बढ़े हुए BP के लिए" },
      { keywords: ["eplerenone","inspra"],
        purpose: "हृदय विफलता और बढ़े हुए BP के लिए" },
      { keywords: ["ivabradine","coralan"],
        purpose: "दिल की तेज़ धड़कन कम करने के लिए" },
      { keywords: ["empagliflozin","jardiance"],
        purpose: "शुगर नियंत्रित करने और हृदय एवं किडनी की सुरक्षा के लिए" },
      { keywords: ["dapagliflozin","farxiga","forxiga"],
        purpose: "शुगर नियंत्रित करने, हृदय और किडनी की रक्षा के लिए" },
      { keywords: ["trimetazidine","vastarel"],
        purpose: "एनजाइना (सीने का दर्द) कम करने के लिए" },
      { keywords: ["ranolazine","ranexa"],
        purpose: "पुराने एनजाइना में राहत के लिए" },

      // ── Gynaecology ──
      { keywords: ["mifepristone","misoprostol","mifegest"],
        purpose: "गर्भावस्था समाप्त करने के लिए (डॉक्टर की देखरेख में)" },
      { keywords: ["letrozole","femara"],
        purpose: "अंडे बनाने में मदद और स्तन कैंसर के लिए" },
      { keywords: ["clomiphene","clomid","siphene"],
        purpose: "बाँझपन में अंडे बनाने के लिए" },
      { keywords: ["dydrogesterone","duphaston"],
        purpose: "गर्भपात रोकने और मासिक धर्म की अनियमितता के लिए" },
      { keywords: ["micronised progesterone","utrogestan","susten"],
        purpose: "गर्भावस्था बचाने और हार्मोन की कमी के लिए" },
      { keywords: ["levonorgestrel 1.5mg","ipill","norlevo","plan b"],
        purpose: "आपातकालीन गर्भनिरोधक — सम्बन्ध के 72 घंटे के अंदर लें" },
      { keywords: ["tranexamic acid","cyklokapron","pause"],
        purpose: "अत्यधिक मासिक रक्तस्राव और खून बंद करने के लिए" },
      { keywords: ["danazol"],
        purpose: "एंडोमेट्रियोसिस और फाइब्रॉएड के लिए" },
      { keywords: ["raloxifene","evista"],
        purpose: "ऑस्टियोपोरोसिस और स्तन कैंसर से बचाव के लिए (menopause के बाद)" },
      { keywords: ["clindamycin vaginal","metronidazole vaginal gel","clotrimazole vaginal","miconazole vaginal"],
        purpose: "योनि के इन्फेक्शन के लिए — अंदर लगाएं या डालें" },

      // ── Dental / ENT ──
      { keywords: ["chlorhexidine mouthwash","benzydamine mouthwash","betadine gargle","povidone iodine gargle"],
        purpose: "मुँह और गले के इन्फेक्शन, दाँत दर्द और मुँह की सफाई के लिए — कुल्ला करें" },
      { keywords: ["benzocaine gel","lidocaine oral gel","lignocaine 2% viscous"],
        purpose: "मुँह के छाले और दाँत दर्द में सुन्न करने के लिए — लगाएं" },
      { keywords: ["strepsils","difflam spray","throat lozenge"],
        purpose: "गले में दर्द और खराश के लिए" },

      // ── Suppositories / Rectal ──
      { keywords: ["glycerin suppository","glycerine suppository","glycerol suppository"],
        purpose: "कब्ज़ दूर करने के लिए — मलद्वार (गुदा) में डालें, 15-30 मिनट में काम करता है" },
      { keywords: ["bisacodyl suppository"],
        purpose: "कब्ज़ दूर करने के लिए — मलद्वार में डालें" },
      { keywords: ["diclofenac suppository","indomethacin suppository","paracetamol suppository"],
        purpose: "दर्द और बुखार के लिए — मलद्वार में डालें (जब मुँह से न ले सकें)" },
      { keywords: ["mesalazine suppository","mesalamine suppository"],
        purpose: "आँत की सूजन (ulcerative colitis) के लिए — मलद्वार में डालें" },
      { keywords: ["proctosedyl","xylocaine jelly","lignocaine suppository"],
        purpose: "बवासीर (piles) के दर्द और जलन के लिए" },

      // ── Patches / Transdermal ──
      { keywords: ["transdermal patch","fentanyl patch","buprenorphine patch","nitroglycerin patch"],
        purpose: "त्वचा पर चिपकाने वाली दवाई — दर्द या दिल की बीमारी के लिए" },
      { keywords: ["nicotine patch","nicotine gum"],
        purpose: "धूम्रपान छोड़ने में मदद के लिए" },
      { keywords: ["estradiol patch","oestrogen patch"],
        purpose: "मेनोपॉज़ के लक्षण कम करने के लिए — त्वचा पर चिपकाएं" },
      { keywords: ["diclofenac patch","voltaren patch"],
        purpose: "जोड़ों के दर्द के लिए — दर्द वाली जगह पर चिपकाएं" },

      // ── Lozenges / Sachets / Powders ──
      { keywords: ["ors sachet","electral sachet","electrolyte sachet"],
        purpose: "दस्त में पानी और नमक की कमी पूरी करने के लिए — हर पतले दस्त के बाद 1 गिलास पिएं" },
      { keywords: ["l-ornithine l-aspartate sachet","lola sachet"],
        purpose: "लिवर की बीमारी में अमोनिया कम करने के लिए" },
      { keywords: ["cholestyramine sachet","bile acid sequestrant"],
        purpose: "कोलेस्ट्रॉल और पित्त अम्ल कम करने के लिए" },
      { keywords: ["acetylcysteine 200mg sachet","nac sachet","n-acetylcysteine sachet"],
        purpose: "बलगम पतला करने और लिवर की सुरक्षा के लिए" },
      { keywords: ["montelukast 4mg granules","montelukast granules"],
        purpose: "एलर्जी और दमे की रोकथाम के लिए — दूध या खाने में मिलाकर दें" },
      { keywords: ["protein powder","whey protein","soy protein"],
        purpose: "कमज़ोरी दूर करने और माँसपेशियाँ बनाने के लिए" },
      { keywords: ["strontium ranelate sachet"],
        purpose: "हड्डियाँ मज़बूत करने के लिए — सोने से पहले दूध में मिलाकर लें" },

      // ── Inhalers ──
      { keywords: ["salbutamol inhaler","ventolin inhaler","asthalin inhaler"],
        purpose: "दमे के दौरे में साँस की नली खोलने के लिए — जरूरत पड़ने पर लें (Reliever)" },
      { keywords: ["salmeterol fluticasone","seretide","advair","combitide"],
        purpose: "दमे और COPD में साँस की नली खोलने और सूजन रोकने के लिए (Combination Inhaler)" },
      { keywords: ["formoterol budesonide","symbicort","foracort"],
        purpose: "दमे और COPD में साँस की तकलीफ कम करने के लिए (Combination Inhaler)" },
      { keywords: ["tiotropium","spiriva","tiova"],
        purpose: "COPD में साँस की नली को 24 घंटे खुला रखने के लिए — एक बार रोज़ लें" },
      { keywords: ["fluticasone inhaler","beclomethasone inhaler","budesonide inhaler"],
        purpose: "दमे में सूजन रोकने के लिए (Controller Inhaler) — रोज़ लें, दौरे में नहीं" },

      // ── Nasal / Throat Sprays ──
      { keywords: ["budesonide nasal spray","fluticasone nasal spray","mometasone nasal spray"],
        purpose: "नाक की एलर्जी और सूजन के लिए — रोज़ सुबह नाक में स्प्रे करें" },
      { keywords: ["oxymetazoline nasal","xylometazoline nasal"],
        purpose: "बंद नाक खोलने के लिए — 3 दिन से ज्यादा इस्तेमाल न करें" },
      { keywords: ["saline nasal"],
        purpose: "नाक साफ करने के लिए — पूरी तरह सुरक्षित, बार-बार इस्तेमाल कर सकते हैं" },

      // ── Oral Solutions / Liquids ──
      { keywords: ["sucralfate suspension","sucralfate syrup"],
        purpose: "पेट और आँत के अल्सर पर सुरक्षा परत बनाने के लिए — खाने से 1 घंटे पहले लें" },
      { keywords: ["antacid syrup","antacid gel","magaldrate","aluminium hydroxide syrup"],
        purpose: "एसिडिटी और पेट की जलन से तुरंत राहत के लिए — खाने के बाद लें" },
      { keywords: ["phosphate binder","sevelamer","calcium carbonate tablet","lanthanum"],
        purpose: "किडनी की बीमारी में फॉस्फेट कम करने के लिए — खाने के साथ लें" },
      { keywords: ["sodium bicarbonate tablet","soda bicarb tablet"],
        purpose: "एसिडोसिस और पेट की अम्लता कम करने के लिए" },

      // ── Vaccines ──
      { keywords: ["hepatitis b vaccine","hbv vaccine","engerix","recombivax"],
        purpose: "हेपेटाइटिस बी (पीलिया) से बचाव के लिए (टीका)" },
      { keywords: ["influenza vaccine","flu vaccine","fluvax"],
        purpose: "इन्फ्लुएंज़ा (फ्लू) से बचाव के लिए (टीका) — साल में एक बार" },
      { keywords: ["covid vaccine","covaxin","covishield","corbevax"],
        purpose: "कोविड-19 से बचाव के लिए (टीका)" },
      { keywords: ["typhoid vaccine","typbar","typherix"],
        purpose: "टाइफाइड बुखार से बचाव के लिए (टीका)" },
      { keywords: ["rabies vaccine","rabipur","verorab"],
        purpose: "रेबीज़ (कुत्ते के काटने) से बचाव के लिए (टीका)" },
      { keywords: ["tetanus vaccine","tt injection","tetanus toxoid"],
        purpose: "टिटनेस से बचाव के लिए (टीका) — घाव लगने पर ज़रूर लें" },
      { keywords: ["pneumococcal vaccine","prevenar","pneumovax"],
        purpose: "निमोनिया और मेनिनजाइटिस से बचाव के लिए (टीका)" },
      { keywords: ["hpv vaccine","gardasil","cervarix"],
        purpose: "गर्भाशय ग्रीवा के कैंसर से बचाव के लिए (टीका)" },
      { keywords: ["varicella vaccine","chickenpox vaccine","varivax"],
        purpose: "चिकनपॉक्स (छोटी माता) से बचाव के लिए (टीका)" },
    ];


    function hindiMedicinePurpose(medName: string): string {
      if (!medName) return "";
      const lower = medName.toLowerCase();
      for (const entry of MED_PURPOSE) {
        if (entry.keywords.some(kw => lower.includes(kw))) {
          return entry.purpose;
        }
      }
      return "";
    }

    function fDateHindi(dateStr: string): string {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const months = ["जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    function fDateEng(dateStr: string): string {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    }

    const printDate = new Date(p.created_at || Date.now());

    w.document.write(`<!DOCTYPE html><html lang="hi"><head>
    <meta charset="utf-8"/>
    <title>Prescription - ${patientName}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'DM Sans',sans-serif;color:#1a1a2e;font-size:13px;line-height:1.6;background:white}
      .page{padding:40px 48px;max-width:800px;margin:0 auto}

      /* Header */
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #0f4c81;margin-bottom:22px}
      .clinic-name{font-family:'DM Serif Display',serif;font-size:24px;color:#0f4c81}
      .clinic-sub{font-size:11px;color:#888;margin-top:4px;line-height:1.9}
      .doctor-block{text-align:right;font-size:12px;color:#666;line-height:1.9}
      .doctor-name{font-weight:700;color:#1a1a2e;font-size:14px}

      /* Patient info box */
      .patient-box{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;background:#f8fbff;padding:16px 20px;border-radius:10px;margin-bottom:20px;border:1px solid #e0eaf6}
      .box-full{grid-column:1/-1}
      .lbl-en{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;font-weight:700}
      .lbl-hi{font-size:10px;color:#999;font-family:'Noto Sans Devanagari',sans-serif}
      .val-en{font-size:13px;font-weight:600;color:#1a1a2e;margin:2px 0}
      .val-hi{font-size:12px;color:#555;font-family:'Noto Sans Devanagari',sans-serif}

      /* Section title */
      .sec-title{font-family:'DM Serif Display',serif;font-size:17px;color:#0f4c81;margin-bottom:12px;display:flex;align-items:center;gap:8px}
      .sec-title::after{content:'';flex:1;height:1px;background:#e2e8f0;margin-left:8px}
      .sec-title-hi{font-size:13px;color:#6b8cba;font-family:'Noto Sans Devanagari',sans-serif;font-weight:600}

      /* Medicine table */
      .med-table{width:100%;border-collapse:collapse;margin-bottom:20px}
      .med-table th{padding:8px 10px;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#999;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700}
      .med-table th .th-hi{display:block;font-family:'Noto Sans Devanagari',sans-serif;font-size:9px;text-transform:none;letter-spacing:0;color:#bbb;font-weight:500}
      .med-row td{padding:10px 10px;border-bottom:1px dashed #f0f0f0;vertical-align:top}
      .med-num{width:26px;height:26px;background:#0f4c81;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
      .med-en{font-weight:700;font-size:14px;color:#1a1a2e}
      .med-hi{font-family:'Noto Sans Devanagari',sans-serif;font-size:11px;color:#888;margin-top:2px}
      .cell-en{font-size:12px;font-weight:600;color:#1a1a2e}
      .cell-hi{font-family:'Noto Sans Devanagari',sans-serif;font-size:11px;color:#666;margin-top:2px}

      /* Divider between English and Hindi sections */
      .bilingual-divider{border:none;border-top:2px dashed #e2e8f0;margin:24px 0}

      /* Hindi patient section */
      .hindi-section{background:#fffbf0;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:20px}
      .hindi-section-title{font-family:'Noto Sans Devanagari',sans-serif;font-size:15px;font-weight:700;color:#b45309;margin-bottom:10px}
      .hindi-para{font-family:'Noto Sans Devanagari',sans-serif;font-size:13px;color:#444;line-height:2;margin-bottom:8px}
      .hindi-med-row{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #fde68a}
      .hindi-bullet{width:22px;height:22px;background:#b45309;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;margin-top:2px;font-family:'DM Sans',sans-serif}
      .hindi-med-name{font-family:'Noto Sans Devanagari',sans-serif;font-size:13px;font-weight:700;color:#1a1a2e}
      .hindi-med-detail{font-family:'Noto Sans Devanagari',sans-serif;font-size:12px;color:#555;margin-top:2px;line-height:1.8}

      /* Follow-up box */
      .followup-box{background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px}
      .followup-icon{font-size:22px;flex-shrink:0}
      .followup-en{font-size:13px;font-weight:700;color:#065f46;margin-bottom:3px}
      .followup-hi{font-family:'Noto Sans Devanagari',sans-serif;font-size:13px;color:#166534;font-weight:600}
      .followup-reason{font-size:11px;color:#16a34a;margin-top:3px}
      .followup-reason-hi{font-family:'Noto Sans Devanagari',sans-serif;font-size:11px;color:#15803d}

      /* Notes */
      .notes-en{padding:12px 16px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;font-size:12px;color:#555;margin-bottom:8px}
      .notes-hi{padding:12px 16px;background:#fef9c3;border-left:3px solid #eab308;border-radius:0 8px 8px 0;font-family:'Noto Sans Devanagari',sans-serif;font-size:12px;color:#555}

      /* Footer */
      .footer{margin-top:36px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end}
      .footer-note{font-size:10px;color:#aaa;line-height:1.9}
      .footer-note-hi{font-family:'Noto Sans Devanagari',sans-serif;font-size:10px;color:#ccc}
      .sign-area{text-align:right}
      .sign-line{width:160px;border-top:1px solid #333;margin-bottom:5px;margin-left:auto}
      .sign-name{font-size:12px;font-weight:700;color:#1a1a2e}
      .sign-deg{font-size:11px;color:#888}

      @media print{
        body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .page{padding:24px 32px}
      }
    </style></head><body>
    <div class="page">

      <!-- HEADER -->
      <div class="header">
        <div>
          <div class="clinic-name">${hospitalConfig.name}</div>
          <div class="clinic-sub">${hospitalConfig.address}, ${hospitalConfig.city}, ${hospitalConfig.state}<br/>Phone: ${hospitalConfig.phone} &nbsp;|&nbsp; ${hospitalConfig.email}</div>
        </div>
        <div class="doctor-block">
          <div class="doctor-name">${hospitalConfig.doctorName}</div>
          <div>${hospitalConfig.doctorDegree}</div>
          <div>${hospitalConfig.department}</div>
          <div>Reg. No: MCI-XXXXX</div>
        </div>
      </div>

      <!-- PATIENT INFO -->
      <div class="patient-box">
        <div>
          <div class="lbl-en">Patient Name</div>
          <div class="lbl-hi">मरीज़ का नाम</div>
          <div class="val-en">${patientName}</div>
        </div>
        <div>
          <div class="lbl-en">Date</div>
          <div class="lbl-hi">तारीख</div>
          <div class="val-en">${fDateEng(printDate.toISOString())}</div>
          <div class="val-hi">${fDateHindi(printDate.toISOString())}</div>
        </div>
        <div>
          <div class="lbl-en">Prescription ID</div>
          <div class="lbl-hi">पर्ची नंबर</div>
          <div class="val-en" style="font-family:monospace;font-size:12px">RX-${(p.id || "").slice(0,8).toUpperCase()}</div>
        </div>
        ${p.diagnosis ? `
        <div class="box-full">
          <div class="lbl-en">Diagnosis / Chief Complaint</div>
          <div class="lbl-hi">बीमारी / मुख्य शिकायत</div>
          <div class="val-en">${p.diagnosis}</div>
        </div>` : ""}
      </div>

      <!-- ══ ENGLISH SECTION ══ -->
      <div class="sec-title">℞ &nbsp;Prescribed Medications</div>
      <table class="med-table">
        <thead>
          <tr>
            <th style="width:36px">#</th>
            <th>Medicine<span class="th-hi">दवाई</span></th>
            <th>Dosage<span class="th-hi">मात्रा</span></th>
            <th>Duration<span class="th-hi">कितने दिन</span></th>
            <th>Route<span class="th-hi">कैसे लें</span></th>
          </tr>
        </thead>
        <tbody>
          ${medicines.map((m: string, i: number) => `
          <tr class="med-row">
            <td><div class="med-num">${i+1}</div></td>
            <td><div class="med-en">${m}</div>
              ${`<div class="med-hi">${hindiMedicinePurpose(m) || ""}</div>`}
            </td>
            <td>
              <div class="cell-en">${dosages[i] || "—"}</div>
              <div class="cell-hi">${hindiDosage(dosages[i] || "")}</div>
            </td>
            <td>
              <div class="cell-en">${durations[i] || "—"}</div>
              <div class="cell-hi">${hindiDuration(durations[i] || "")}</div>
            </td>
            <td>
              <div class="cell-en">${routes[i] || "Oral"}</div>
              <div class="cell-hi">${hindiRoute(routes[i] || "Oral")}</div>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>

      ${p.notes ? `
      <div class="notes-en"><strong>Instructions:</strong> ${p.notes}</div>` : ""}

      <!-- FOLLOW-UP BOX -->
      ${followUpDate ? `
      <div class="followup-box">
        <div class="followup-icon">📅</div>
        <div>
          <div class="followup-en">Follow-up Date: <strong>${fDateEng(followUpDate)}</strong></div>
          <div class="followup-hi">अगली जाँच की तारीख: <strong>${fDateHindi(followUpDate)}</strong></div>
          ${followUpReason ? `<div class="followup-reason">Reason: ${followUpReason}</div>
          <div class="followup-reason-hi">कारण: ${followUpReason}</div>` : ""}
        </div>
      </div>` : ""}

      <hr class="bilingual-divider"/>

      <!-- ══ HINDI PATIENT SECTION ══ -->
      <div class="hindi-section">
        <div class="hindi-section-title">🏥 मरीज़ के लिए निर्देश (हिंदी में)</div>

        <div class="hindi-para">
          <strong>मरीज़:</strong> ${patientName} &nbsp;|&nbsp;
          <strong>तारीख:</strong> ${fDateHindi(printDate.toISOString())}
          ${p.diagnosis ? `<br/><strong>बीमारी:</strong> ${p.diagnosis}` : ""}
        </div>

        <div style="margin-bottom:8px;font-family:'Noto Sans Devanagari',sans-serif;font-size:12px;color:#b45309;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">
          💊 दवाइयाँ और उनका तरीका:
        </div>

        ${medicines.map((m: string, i: number) => `
        <div class="hindi-med-row">
          <div class="hindi-bullet">${i+1}</div>
          <div>
            <div class="hindi-med-name">${m}</div>
            <div class="hindi-med-detail">
              ${hindiMedicinePurpose(m) ? `<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:1px 8px;border-radius:5px;font-size:11px;font-weight:600;margin-bottom:4px;font-family:'Noto Sans Devanagari',sans-serif;">💊 ${hindiMedicinePurpose(m)}</span><br/>` : ""}
              ${dosages[i] && dosages[i] !== "—" ? `<strong>कब लें:</strong> ${hindiDosage(dosages[i])}` : ""}
              ${durations[i] && durations[i] !== "—" ? `&nbsp;·&nbsp; <strong>कितने दिन:</strong> ${hindiDuration(durations[i])}` : ""}
              ${routes[i] ? `&nbsp;·&nbsp; <strong>तरीका:</strong> ${hindiRoute(routes[i])}` : ""}
            </div>
          </div>
        </div>`).join("")}

        ${p.notes ? `
        <div style="margin-top:12px">
          <div style="font-family:'Noto Sans Devanagari',sans-serif;font-size:12px;color:#b45309;font-weight:700;margin-bottom:4px">⚠ विशेष निर्देश:</div>
          <div class="notes-hi">${p.notes}</div>
        </div>` : ""}

        ${followUpDate ? `
        <div style="margin-top:14px;background:#f0fdf4;border-radius:8px;padding:12px 14px;border:1px solid #86efac">
          <div style="font-family:'Noto Sans Devanagari',sans-serif;font-size:13px;font-weight:700;color:#065f46">
            📅 अगली जाँच: <strong>${fDateHindi(followUpDate)}</strong>
          </div>
          ${followUpReason ? `<div style="font-family:'Noto Sans Devanagari',sans-serif;font-size:12px;color:#16a34a;margin-top:3px">कारण: ${followUpReason}</div>` : ""}
          <div style="font-family:'Noto Sans Devanagari',sans-serif;font-size:11px;color:#888;margin-top:4px">
            कृपया इस तारीख को डॉक्टर के पास ज़रूर आएं।
          </div>
        </div>` : ""}
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div>
          <div class="footer-note">
            This is a computer-generated prescription.<br/>
            Valid for 30 days from date of issue.<br/>
            ${hospitalConfig.name} &bull; ${hospitalConfig.appName}
          </div>
          <div class="footer-note-hi">यह पर्ची कंप्यूटर द्वारा बनाई गई है।</div>
        </div>
        <div class="sign-area">
          <div class="sign-line"></div>
          <div class="sign-name">${hospitalConfig.doctorName}</div>
          <div class="sign-deg">${hospitalConfig.doctorDegree}</div>
        </div>
      </div>

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
                      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                        <button className="action-btn view-btn-sm" onClick={()=>setViewPrescription(p)}>👁 View</button>
                        <button className="action-btn print-btn-sm" onClick={()=>handlePrint(p)}>🖨 Print</button>
                        <button className="action-btn" onClick={()=>{
                          const name = p.patients?.name || patients.find((pat:any)=>pat.id===p.patient_id)?.name || "Patient";
                          const phone = patients.find((pat:any)=>pat.id===p.patient_id)?.phone || "";
                          const meds = (p.medicine||"").split("\n");
                          const dosages = (p.dosage||"").split("\n");
                          const durations = (p.duration||"").split("\n");
                          const date = (p.created_at||"").split("T")[0];
                          let msg = `🏥 *${hospitalConfig.name}*\n`;
                          msg += `👨‍⚕️ ${hospitalConfig.doctorName} (${hospitalConfig.doctorDegree})\n`;
                          msg += `📅 Date: ${date}\n`;
                          msg += `━━━━━━━━━━━━━━━━\n`;
                          msg += `👤 *Patient:* ${name}\n`;
                          if (p.diagnosis) msg += `🩺 *Diagnosis:* ${p.diagnosis}\n`;
                          msg += `\n💊 *Medicines:*\n`;
                          meds.forEach((m:string, i:number) => {
                            if (!m.trim()) return;
                            msg += `${i+1}. *${m}*\n`;
                            if (dosages[i]) msg += `   • Dosage: ${dosages[i]}\n`;
                            if (durations[i]) msg += `   • Duration: ${durations[i]}\n`;
                          });
                          if (p.notes) msg += `\n📋 *Instructions:* ${p.notes}\n`;
                          try {
                            const fuList = JSON.parse(localStorage.getItem("clinic_followups")||"[]");
                            const fu = fuList.find((f:any)=>f.patientId===p.patient_id);
                            if (fu?.dueDate) msg += `\n📅 *Follow-up:* ${fu.dueDate}\n`;
                          } catch {}
                          msg += `\n━━━━━━━━━━━━━━━━\n`;
                          msg += `_${hospitalConfig.name} · ${hospitalConfig.phone}_`;
                          const encoded = encodeURIComponent(msg);
                          const waUrl = phone
                            ? `whatsapp://send?phone=91${phone.replace(/\D/g,"")}&text=${encoded}`
                            : `whatsapp://send?text=${encoded}`;
                          window.location.href = waUrl;
                        }} style={{ background:"#25D366", color:"white", border:"none", padding:"6px 12px", borderRadius:"7px", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>
                          📲 WA
                        </button>
                        <button className="action-btn del-btn-sm" onClick={()=>deletePrescription(p.id)}>✕</button>
                      </div>
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