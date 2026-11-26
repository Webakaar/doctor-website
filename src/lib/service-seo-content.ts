import type { Service } from "@/types/hospital";

export interface ServiceProcedureItem {
  name: string;
  description: string;
}

export interface ServiceFaqItem {
  question: string;
  answer: string;
}

export interface ServiceSeoContent {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  heroBadge: string;
  overviewParagraphs: string[];
  conditionsTreated: string[];
  procedures: ServiceProcedureItem[];
  whenToVisitSymptoms: string[];
  preparationChecklist: string[];
  consultationSteps: {
    step: string;
    title: string;
    description: string;
  }[];
  faqs: ServiceFaqItem[];
}

const SERVICE_CONTENT_MAP: Record<string, ServiceSeoContent> = {
  cardiology: {
    seoTitle:
      "Cardiology & Heart Care in Mumbai | Best Cardiologists & Cardiac Screening | AuraCare",
    seoDescription:
      "Consult senior cardiologists at AuraCare Hospital for preventive heart screening, 2D Echo, ECG, hypertension, arrhythmia, and coronary care. Book online with instant confirmation.",
    keywords: [
      "cardiology hospital",
      "best cardiologist near me",
      "heart specialist consultation",
      "2D echo and ECG test",
      "hypertension treatment",
      "preventive cardiac checkup"
    ],
    heroBadge: "Cardiac Sciences & Preventive Heart Clinic",
    overviewParagraphs: [
      "Cardiovascular health requires proactive monitoring, accurate non-invasive diagnostics, and individualized medical guidance. At AuraCare Multispeciality Hospital, our Cardiology & Heart Care department delivers comprehensive outpatient cardiac consultations for patients managing high blood pressure, cholesterol imbalances, palpitations, chest discomfort, and long-term coronary risk.",
      "Rather than rushing through symptoms, our senior cardiologists review your complete medical history, lifestyle factors, family history, and prior reports alongside on-site 12-lead ECG, 2D Echocardiography, and ambulatory rhythm assessments. Every patient leaves with an actionable, easy-to-follow care plan covering medication precision, heart-healthy nutrition, and safe physical activity.",
      "For individuals over age 35 or those living with diabetes, thyroid imbalance, or workplace stress, our Preventive Heart Clinic identifies subtle cardiovascular markers early—helping protect long-term heart function before urgent complications arise."
    ],
    conditionsTreated: [
      "Hypertension (High Blood Pressure) & Resistant BP",
      "Coronary Artery Disease & Angina Evaluation",
      "Cardiac Arrhythmias, Palpitations & Atrial Fibrillation",
      "Dyslipidaemia (High Cholesterol & Triglycerides)",
      "Heart Failure Management & Post-Discharge Follow-Up",
      "Valvular Heart Conditions & Congenital Murmurs",
      "Diabetic Cardiovascular Risk & Metabolic Syndrome",
      "Pre-Operative Cardiac Fitness & Clearance"
    ],
    procedures: [
      {
        name: "12-Lead Electrocardiogram (ECG)",
        description:
          "Rapid electrical rhythm evaluation to detect conduction changes, ischaemia, and irregular heartbeats."
      },
      {
        name: "2D Echocardiography & Colour Doppler",
        description:
          "High-resolution ultrasound imaging to assess heart chamber size, pumping efficiency (ejection fraction), and valve function."
      },
      {
        name: "Treadmill Stress Testing (TMT)",
        description:
          "Supervised exercise tolerance testing to evaluate coronary blood flow under controlled physical exertion."
      },
      {
        name: "24-Hour Holter Rhythm Monitoring",
        description:
          "Continuous portable ECG recording for patients experiencing intermittent dizziness, skipped beats, or unexplained palpitations."
      },
      {
        name: "Ambulatory Blood Pressure Monitoring",
        description:
          "Day-and-night BP profiling to distinguish white-coat hypertension from sustained blood pressure elevation."
      },
      {
        name: "Preventive Cardiac Risk Assessment",
        description:
          "Structured evaluation combining lipid subfractions, hs-CRP, ECG, and lifestyle risk scoring."
      }
    ],
    whenToVisitSymptoms: [
      "Recurring chest tightness, pressure, or discomfort during exertion",
      "Unexplained shortness of breath while climbing stairs or lying flat",
      "Frequent fluttering, racing pulse, or skipped heartbeats",
      "Persistently elevated home blood pressure readings above 130/80 mmHg",
      "Dizziness, light-headedness, or swelling around the ankles",
      "Family history of early heart disease or diabetes requiring preventive screening"
    ],
    preparationChecklist: [
      "Carry prior ECGs, 2D Echo reports, lipid panels, and current blood pressure logs",
      "Bring a complete list of daily medications, dosages, and supplements",
      "Wear comfortable two-piece clothing if an ECG or Echo assessment is advised",
      "Note down triggers such as stress, caffeine, or exertion linked to symptoms"
    ],
    consultationSteps: [
      {
        step: "01",
        title: "Medical & Risk History Review",
        description:
          "Detailed review of symptoms, blood pressure trends, family history, and existing prescriptions."
      },
      {
        step: "02",
        title: "Clinical Cardiac Examination",
        description:
          "Thorough vitals check, heart auscultation, peripheral pulse assessment, and baseline ECG if needed."
      },
      {
        step: "03",
        title: "Targeted Diagnostic Testing",
        description:
          "Only evidence-backed tests such as 2D Echo, TMT, or blood biomarkers are recommended."
      },
      {
        step: "04",
        title: "Personalised Heart Care Plan",
        description:
          "Clear medication schedule, target BP/cholesterol goals, nutrition advice, and follow-up timeline."
      }
    ],
    faqs: [
      {
        question: "When should I book a preventive cardiology check-up?",
        answer:
          "Adults aged 35 and older—or earlier if you have high blood pressure, diabetes, elevated cholesterol, high stress, or a family history of heart disease—benefit from an annual preventive cardiac screening."
      },
      {
        question: "What reports should I bring to my first cardiology appointment?",
        answer:
          "Bring any recent blood tests (lipid profile, HbA1c, kidney function), past ECG or 2D Echo reports, and a written list of all current medications."
      },
      {
        question: "Are 2D Echo and ECG available in coordination with the OPD visit?",
        answer:
          "Yes, baseline 12-lead ECG and 2D Echocardiography diagnostics are integrated with our Cardiology outpatient clinic for timely clinical correlation."
      },
      {
        question: "Can I book an online consultation slot for hypertension follow-up?",
        answer:
          "Yes. Select Cardiology on our Book Doctor page, pick your preferred cardiologist and time slot, and confirm your appointment online with instant Razorpay verification."
      },
      {
        question: "Is chest pain always treated via OPD booking?",
        answer:
          "No. Severe, sudden chest pain, sweating, or breathlessness requires immediate emergency care. Call our 24x7 emergency helpline or visit Casualty directly."
      }
    ]
  },

  orthopedics: {
    seoTitle:
      "Orthopedics & Joint Care | Bone, Spine & Sports Injury Specialists | AuraCare",
    seoDescription:
      "Book appointments with orthopedic surgeons at AuraCare Hospital for knee pain, arthritis, sports injuries, spine care, and joint replacement guidance.",
    keywords: [
      "orthopedic doctor",
      "knee pain specialist",
      "joint replacement consultation",
      "sports injury clinic",
      "back pain and spine specialist",
      "arthritis care hospital"
    ],
    heroBadge: "Musculoskeletal, Spine & Joint Care",
    overviewParagraphs: [
      "Mobility shapes everyday independence. At AuraCare Multispeciality Hospital, our Orthopedics & Joint Care department treats acute injuries, chronic joint degeneration, ligament tears, and spine discomfort using conservative, rehabilitation-first protocols whenever possible and surgical precision when indicated.",
      "Whether you are an athlete recovering from an ACL or rotator cuff strain, an office professional dealing with cervical or lumbar disc pain, or an older adult evaluating knee osteoarthritis options, our orthopedic specialists pair physical biomechanics exams with digital imaging to pinpoint the root cause.",
      "Every treatment roadmap integrates targeted physiotherapy, posture ergonomics, bone density optimization, and clear discussions around minimally invasive arthroscopy or joint replacement timelines—empowering you to regain pain-free movement safely."
    ],
    conditionsTreated: [
      "Knee Osteoarthritis & Cartilage Wear",
      "ACL, Meniscus & Sports Ligament Injuries",
      "Lower Back Pain, Sciatica & Lumbar Disc Prolapse",
      "Neck Stiffness & Cervical Spondylosis",
      "Shoulder Frozen Joint, Impingement & Rotator Cuff Tears",
      "Acute Fractures, Sprains & Dislocation Follow-Up",
      "Osteoporosis & Bone Mineral Density Loss",
      "Carpal Tunnel Syndrome & Tendonitis"
    ],
    procedures: [
      {
        name: "Joint Pain & Gait Biomechanics Assessment",
        description:
          "Hands-on orthopedic evaluation of joint stability, range of motion, alignment, and muscle balance."
      },
      {
        name: "Digital X-Ray & Imaging Correlation",
        description:
          "Rapid radiographic evaluation of fractures, joint space narrowing, and spinal alignment."
      },
      {
        name: "Arthroscopy & Sports Rehab Planning",
        description:
          "Minimally invasive ligament repair counselling paired with milestone-based sports physiotherapy."
      },
      {
        name: "Total & Partial Joint Replacement Counselling",
        description:
          "Transparent evaluation of knee and hip replacement candidacy, implant longevity, and recovery timelines."
      },
      {
        name: "Intra-Articular & Soft Tissue Relief Protocols",
        description:
          "Targeted outpatient joint injections and conservative anti-inflammatory plans where clinically appropriate."
      },
      {
        name: "Post-Fracture Casting & Recovery Review",
        description:
          "Structured union checks and progressive mobilisation schedules after trauma or surgery."
      }
    ],
    whenToVisitSymptoms: [
      "Persistent knee, hip, or shoulder pain lasting more than 2 weeks",
      "Joint locking, instability, or feeling like your knee may 'give way'",
      "Radiating back or neck pain accompanied by tingling or numbness",
      "Swelling, stiffness, or reduced range of motion in the mornings",
      "Pain after a fall, sports twist, or lifting injury",
      "Difficulty walking short distances or climbing stairs comfortably"
    ],
    preparationChecklist: [
      "Bring prior X-rays, MRI scans (films or CDs/reports), and bone density tests",
      "Wear loose, comfortable clothing so knees, shoulders, or spine can be examined easily",
      "Note which movements worsen or relieve your discomfort",
      "List any pain medications or physiotherapy sessions tried recently"
    ],
    consultationSteps: [
      {
        step: "01",
        title: "Injury & Mobility History",
        description:
          "Discussion of pain onset, activity level, prior scans, and daily functional goals."
      },
      {
        step: "02",
        title: "Physical Orthopedic Exam",
        description:
          "Focused range-of-motion, ligament stability, and nerve root screening tests."
      },
      {
        step: "03",
        title: "Imaging & Root-Cause Clarity",
        description:
          "Review of X-ray or MRI findings in plain language so you understand what is happening."
      },
      {
        step: "04",
        title: "Recovery & Rehab Plan",
        description:
          "Structured physiotherapy, ergonomic adjustments, bracing, or surgical guidance if required."
      }
    ],
    faqs: [
      {
        question: "Do all orthopedic consultations lead to surgery?",
        answer:
          "No. Over 80% of musculoskeletal conditions improve with targeted physiotherapy, posture correction, activity modification, and medical management. Surgery is advised only when conservative care is insufficient."
      },
      {
        question: "Should I get an X-ray or MRI before booking my appointment?",
        answer:
          "You do not need scans beforehand—your orthopedic doctor will examine you first and order imaging only if clinically necessary. If you already have recent X-rays or MRIs, bring them along."
      },
      {
        question: "How soon can I book for a sports knee or ankle twist?",
        answer:
          "You can check real-time slots on our Book Doctor page for today or tomorrow. Early evaluation helps protect ligaments and prevents chronic instability."
      },
      {
        question: "Does the hospital support post-operative physiotherapy guidance?",
        answer:
          "Yes, our Orthopedic & Rehab Unit provides structured post-injury and post-joint-replacement physiotherapy protocols."
      },
      {
        question: "Can I get a second opinion on knee replacement?",
        answer:
          "Yes, Dr. Rohan Kulkarni regularly provides second-opinion consultations reviewing prior X-rays and non-surgical vs surgical options."
      }
    ]
  },

  pediatrics: {
    seoTitle:
      "Pediatrics & Child Care Clinic | Newborn Check-Ups & Vaccinations | AuraCare",
    seoDescription:
      "Trusted pediatricians at AuraCare Hospital for newborn care, childhood immunisations, growth monitoring, nutrition, and acute child illness consultations.",
    keywords: [
      "pediatrician near me",
      "child specialist hospital",
      "baby vaccination clinic",
      "newborn checkup doctor",
      "child fever and cough specialist",
      "adolescent wellness clinic"
    ],
    heroBadge: "Newborn, Child & Adolescent Health",
    overviewParagraphs: [
      "Children need gentle clinical expertise tailored to every stage of growth—from the first days after birth through school age and adolescence. AuraCare's Pediatrics & Child Care department offers calm, child-friendly outpatient suites designed to put both young patients and parents at ease.",
      "Led by experienced pediatric and neonatology specialists, our clinic oversees routine developmental milestone checks, IAP/WHO immunisation schedules, feeding and nutrition counselling, and prompt evaluation of childhood fevers, respiratory infections, allergies, and tummy troubles.",
      "With strict time-slot scheduling and zero waiting-room chaos, families receive unhurried consultations where every parent question—from sleep routines and teething to immunity and growth percentiles—is answered clearly."
    ],
    conditionsTreated: [
      "Newborn Jaundice, Feeding & Weight Gain Checks",
      "Routine Childhood Immunisations & Catch-Up Vaccines",
      "Paediatric Fever, Viral Infections & Earaches",
      "Childhood Cough, Wheezing, Bronchiolitis & Asthma",
      "Allergies, Eczema & Seasonal Rashes",
      "Digestive Concerns, Colic & Nutritional Deficiencies",
      "Growth Percentile & Developmental Milestone Delays",
      "Adolescent Health, Puberty & School Wellness"
    ],
    procedures: [
      {
        name: "Well-Baby & Growth Monitoring",
        description:
          "Accurate height, weight, and head circumference plotting against standard WHO/IAP growth charts."
      },
      {
        name: "Complete Paediatric Immunisation Clinic",
        description:
          "Cold-chain-verified routine and optional vaccines with digital vaccination schedule tracking."
      },
      {
        name: "Neonatal Post-Discharge Review",
        description:
          "Gentle newborn examinations covering latching support, umbilical care, and sleep safety."
      },
      {
        name: "Paediatric Respiratory & Nebulisation Care",
        description:
          "Evidence-based airway evaluation for croup, wheezing episodes, and recurrent allergies."
      },
      {
        name: "Developmental & School Readiness Screening",
        description:
          "Structured assessment of speech, motor skills, social engagement, and vision/hearing cues."
      },
      {
        name: "Child Nutrition & Immunity Counselling",
        description:
          "Practical complementary feeding, iron/Vitamin D guidance, and picky-eater strategies."
      }
    ],
    whenToVisitSymptoms: [
      "Scheduled newborn check-ups or due childhood vaccinations",
      "Fever lasting more than 48 hours or accompanied by lethargy",
      "Fast breathing, noisy wheezing, or persistent night cough",
      "Poor feeding, repeated vomiting, or signs of dehydration",
      "Concerns about speech milestones, appetite, or slow weight gain",
      "Recurrent skin rashes, ear pulling, or seasonal allergies"
    ],
    preparationChecklist: [
      "Bring your child's immunisation card and past growth chart records",
      "Note down exact weight-based doses of any fever or cough syrup already given",
      "Carry a comfort toy or blanket and spare diapers/feeds for infants",
      "Write down questions about diet, sleep, or milestones ahead of the visit"
    ],
    consultationSteps: [
      {
        step: "01",
        title: "Calm Child-Friendly Check-In",
        description:
          "Dedicated paediatric waiting space with prompt slot entry to minimise stress for little ones."
      },
      {
        step: "02",
        title: "Growth & Vitals Assessment",
        description:
          "Gentle measurement of temperature, weight, height, and oxygen saturation."
      },
      {
        step: "03",
        title: "Thorough Paediatric Consultation",
        description:
          "Complete physical exam and unhurried discussion of symptoms, nutrition, or vaccination due dates."
      },
      {
        step: "04",
        title: "Clear Parent Care Sheet",
        description:
          "Exact weight-calculated dosing, red-flag watch signs, and next scheduled vaccine reminder."
      }
    ],
    faqs: [
      {
        question: "Do you maintain cold-chain standards for childhood vaccines?",
        answer:
          "Yes, all paediatric vaccines are stored in temperature-monitored medical refrigeration and administered with strict safety verification."
      },
      {
        question: "What should I bring for a vaccination visit?",
        answer:
          "Please bring your child's immunisation record book or previous vaccine dates so our paediatrician can verify due and catch-up doses accurately."
      },
      {
        question: "How long is a typical paediatric consultation slot?",
        answer:
          "Standard paediatric appointments are 30 minutes long, giving parents ample time to discuss symptoms, feeding, and developmental milestones."
      },
      {
        question: "Can I book same-day or next-day slots when my child has a fever?",
        answer:
          "Yes. Our live slot explorer displays real-time openings for Dr. Kavya Nair so you can reserve the earliest available slot online."
      },
      {
        question: "Does the clinic advise on complementary feeding and toddler nutrition?",
        answer:
          "Yes, practical age-appropriate nutrition and picky-eater counselling are core parts of our well-baby and child wellness visits."
      }
    ]
  },

  neurology: {
    seoTitle:
      "Neurology & Brain Care | Migraine, Epilepsy & Stroke Recovery Specialists | AuraCare",
    seoDescription:
      "Consult expert neurologists at AuraCare Hospital for chronic migraines, seizures, vertigo, neuropathy, memory concerns, and stroke rehabilitation. Book online.",
    keywords: [
      "neurologist near me",
      "migraine specialist doctor",
      "epilepsy and seizure clinic",
      "nerve pain neuropathy doctor",
      "vertigo and dizziness specialist",
      "stroke recovery neurology"
    ],
    heroBadge: "Neurosciences, Spine & Nerve Clinic",
    overviewParagraphs: [
      "Neurological symptoms such as recurring migraines, tingling limbs, dizziness, or memory changes can disrupt work and family life if left uninvestigated. AuraCare's Neurology & Brain Care department offers thorough clinical evaluations grounded in modern neuro-diagnostics.",
      "Our specialist neurologists take detailed symptom timelines and perform structured cranial nerve, motor, sensory, and balance examinations to differentiate benign headaches or peripheral nerve compression from deeper vascular or seizure disorders.",
      "By combining targeted EEG, nerve conduction studies, and multidisciplinary neuro-rehabilitation planning, we deliver clear diagnoses and personalised preventive therapies designed for sustained neurological comfort."
    ],
    conditionsTreated: [
      "Migraine, Tension Headaches & Cluster Headaches",
      "Epilepsy, Seizure Disorders & Blackout Evaluation",
      "Post-Stroke Recovery & Secondary Stroke Prevention",
      "Peripheral Neuropathy, Tingling & Diabetic Nerve Pain",
      "Vertigo, Balance Disorders & BPPV",
      "Tremors, Parkinsonism & Movement Disorders",
      "Cervical / Lumbar Radiculopathy & Sciatica",
      "Memory Loss, Sleep Disturbances & Cognitive Screening"
    ],
    procedures: [
      {
        name: "Comprehensive Neurological Examination",
        description:
          "Systematic assessment of cognition, cranial nerves, reflexes, coordination, and sensory pathways."
      },
      {
        name: "Electroencephalogram (EEG) Correlation",
        description:
          "Brainwave evaluation to investigate seizures, fainting spells, and unexplained episodes."
      },
      {
        name: "Nerve Conduction & EMG Guidance",
        description:
          "Targeted electrodiagnostic testing for carpal tunnel syndrome, sciatica, and diabetic neuropathy."
      },
      {
        name: "Migraine Trigger & Preventive Mapping",
        description:
          "Structured headache diary analysis pairing acute relief with preventive lifestyle and medical therapy."
      },
      {
        name: "Vertigo & Vestibular Manoeuvres",
        description:
          "Diagnostic positioning checks and rehabilitative exercises for inner-ear vs central dizziness."
      },
      {
        name: "Post-Stroke Rehabilitation Planning",
        description:
          "Coordinated blood-pressure, antiplatelet, physiotherapy, and speech-recovery follow-up."
      }
    ],
    whenToVisitSymptoms: [
      "Frequent or severe headaches affecting work, sleep, or vision",
      "Any episode of unexplained blackout, seizure, or sudden confusion",
      "Persistent numbness, burning, or pins-and-needles in hands or feet",
      "Spinning dizziness (vertigo) or sudden loss of balance while walking",
      "New hand tremors, muscle weakness, or slowing of everyday movements",
      "Follow-up care after a TIA or stroke to prevent recurrence"
    ],
    preparationChecklist: [
      "Bring any Brain/Spine MRI or CT films and written radiology reports",
      "Maintain a brief 1-week headache or episode diary noting frequency and duration",
      "Ask a family member to accompany you if evaluating blackouts, seizures, or memory",
      "Carry a list of all current painkillers, migraine tablets, or nerve supplements"
    ],
    consultationSteps: [
      {
        step: "01",
        title: "Detailed Symptom Timeline",
        description:
          "Careful review of onset, triggers, aura symptoms, and family neurological history."
      },
      {
        step: "02",
        title: "Structured Neuro Exam",
        description:
          "Clinical testing of balance, vision fields, reflexes, strength, and nerve sensation."
      },
      {
        step: "03",
        title: "Targeted Neuro-Imaging / EEG",
        description:
          "Ordering MRI, EEG, or nerve studies only when needed to confirm the diagnosis."
      },
      {
        step: "04",
        title: "Long-Term Control & Rehab",
        description:
          "Balanced preventive therapy, trigger control, and scheduled follow-up milestones."
      }
    ],
    faqs: [
      {
        question: "When should a headache be evaluated by a neurologist?",
        answer:
          "If headaches occur more than 4 days a month, worsen steadily, wake you from sleep, cause visual aura, or require frequent painkillers, a specialist neurology visit is recommended."
      },
      {
        question: "Can diabetic foot numbness or burning be treated?",
        answer:
          "Yes. Early evaluation identifies peripheral neuropathy, optimises vitamin/metabolic balance, and provides targeted nerve-calming therapies to protect foot sensation."
      },
      {
        question: "Should someone accompany a patient for a seizure or memory evaluation?",
        answer:
          "Yes, having an eyewitness who saw the episode or changes in memory helps the neurologist make a far more accurate assessment."
      },
      {
        question: "What if I notice sudden facial drooping, arm weakness, or slurred speech?",
        answer:
          "Those are emergency stroke signs requiring immediate hospital Casualty care—do not wait for an outpatient slot. Call our 24x7 emergency helpline right away."
      },
      {
        question: "Can I book follow-up migraine visits online?",
        answer:
          "Yes, select Neurology on our Book Doctor page to pick a convenient slot with Dr. Ananya Sharma."
      }
    ]
  },

  dermatology: {
    seoTitle:
      "Dermatology & Skin Care | Eczema, Acne, Hair Loss & Allergy Doctors | AuraCare",
    seoDescription:
      "Consult medical dermatologists at AuraCare Hospital for acne, eczema, psoriasis, hair fall, skin allergies, fungal infections, and mole screening.",
    keywords: [
      "dermatologist near me",
      "skin specialist hospital",
      "acne and scar treatment doctor",
      "hair fall dermatologist",
      "eczema and psoriasis clinic",
      "skin allergy specialist"
    ],
    heroBadge: "Clinical Dermatology, Hair & Allergy Care",
    overviewParagraphs: [
      "Healthy skin, hair, and nails often mirror internal immune, hormonal, and environmental balance. AuraCare's Dermatology & Skin Care department focuses on evidence-based clinical dermatology—diagnosing persistent rashes, acne, pigment shifts, hair thinning, and skin allergies safely without gimmicks.",
      "Our qualified MD dermatologists examine skin lesions with clinical dermoscopy, identify hidden allergic or fungal triggers, and avoid unnecessary steroid overuse. Every regimen is tailored to Indian skin types, climate humidity, and your daily routine.",
      "Whether managing childhood atopic eczema, adult hormonal acne, chronic psoriasis, or sudden hair shedding, patients receive clear, step-by-step topical and medical guidance backed by measurable follow-up milestones."
    ],
    conditionsTreated: [
      "Acne Vulgaris, Hormonal Breakouts & Post-Acne Marks",
      "Atopic Eczema, Contact Dermatitis & Chronic Itching",
      "Psoriasis & Chronic Scaling Skin Conditions",
      "Hair Fall, Telogen Effluvium, Alopecia & Dandruff",
      "Fungal, Bacterial & Viral Skin/Nail Infections",
      "Urticaria (Hives) & Recurrent Skin Allergies",
      "Melasma, Pigmentation & Sun Damage Protection",
      "Mole Screening & Benign Skin Growth Evaluation"
    ],
    procedures: [
      {
        name: "Clinical Dermoscopy Evaluation",
        description:
          "Magnified polarised skin inspection to evaluate pigmented moles, scalp follicles, and chronic lesions accurately."
      },
      {
        name: "Allergy & Trigger Identification",
        description:
          "Structured assessment of skincare products, occupational exposures, and dietary or environmental triggers."
      },
      {
        name: "Medical Acne & Scar Protocol",
        description:
          "Dermatologist-prescribed retinoids, targeted antimicrobials, and barrier-friendly skincare routines."
      },
      {
        name: "Scalp & Hair Density Assessment",
        description:
          "Root-cause evaluation checking nutritional ferritin, thyroid/hormonal links, and scalp health."
      },
      {
        name: "Paediatric Skin Care Consultations",
        description:
          "Gentle, steroid-sparing management for infant cradle cap, diaper rashes, and childhood eczema."
      },
      {
        name: "Chronic Psoriasis & Nail Care",
        description:
          "Long-term flare control and targeted nail dystrophy management."
      }
    ],
    whenToVisitSymptoms: [
      "Acne causing deep nodules, pain, or dark post-inflammatory marks",
      "Itchy, red, or scaly patches not resolving within 1–2 weeks",
      "Sudden increase in daily hair shedding or patchy scalp thinning",
      "Recurring hives (urticaria) or unexplained skin swelling",
      "A mole or skin spot that changes in size, border, or colour",
      "Stubborn nail discolouration, thickening, or brittle nails"
    ],
    preparationChecklist: [
      "Bring photos of past skin flares if the rash comes and goes",
      "Carry your current face washes, creams, sunscreens, or hair serums (or take photos of labels)",
      "Arrive with a clean, makeup-free face if consulting for facial skin concerns",
      "Avoid applying heavy hair oil on the day of a scalp evaluation"
    ],
    consultationSteps: [
      {
        step: "01",
        title: "Skin & Routine History",
        description:
          "Review of flare duration, skincare products used, and any prior medicated creams."
      },
      {
        step: "02",
        title: "Visual & Dermoscopic Exam",
        description:
          "Close clinical examination of skin, scalp, or nails under proper medical lighting."
      },
      {
        step: "03",
        title: "Targeted Root-Cause Checks",
        description:
          "Ordering blood work (such as ferritin, Vitamin D, or thyroid) only when relevant."
      },
      {
        step: "04",
        title: "Simplified Daily Regimen",
        description:
          "A clear AM/PM skincare or hair protocol designed for comfort and lasting results."
      }
    ],
    faqs: [
      {
        question: "Why should I see a clinical dermatologist instead of using over-the-counter creams?",
        answer:
          "Many over-the-counter fairness or itch creams contain hidden potent steroids that thin the skin and worsen fungal infections or pigmentation. A dermatologist prescribes safe, targeted treatment."
      },
      {
        question: "How long does acne or hair fall treatment take to show results?",
        answer:
          "Skin cell turnover and hair growth cycles take time—initial calming is often seen in 3–4 weeks, with fuller clinical improvement over 8–12 weeks."
      },
      {
        question: "Should I bring my current skincare products to the visit?",
        answer:
          "Yes! Bringing your products or clear photos of their ingredient labels helps Dr. Meera Iyer spot pore-clogging or irritating ingredients immediately."
      },
      {
        question: "Do you treat childhood rashes and eczema?",
        answer:
          "Yes, our dermatology clinic provides gentle, child-safe skin protocols for infants, children, and teens."
      },
      {
        question: "Can I book a 20-minute dermatology consultation online?",
        answer:
          "Yes. Choose Dermatology on our Book Doctor page, select an open slot, and receive instant confirmation."
      }
    ]
  },

  "general-medicine": {
    seoTitle:
      "General & Internal Medicine | Physicians, Diabetes & Preventive Health | AuraCare",
    seoDescription:
      "Book appointments with senior internal medicine physicians at AuraCare Hospital for fever, diabetes, thyroid care, fatigue, and comprehensive adult health checks.",
    keywords: [
      "general physician near me",
      "internal medicine doctor",
      "diabetes and thyroid specialist",
      "viral fever doctor",
      "annual health checkup physician",
      "adult primary care hospital"
    ],
    heroBadge: "Adult Primary Care, Diabetes & Metabolic Clinic",
    overviewParagraphs: [
      "Internal Medicine is the cornerstone of comprehensive adult healthcare. At AuraCare Multispeciality Hospital, our General & Internal Medicine physicians serve as your trusted first point of contact for acute illnesses, lingering fatigue, complex multi-system symptoms, and lifelong chronic condition management.",
      "Our senior physicians specialize in coordinating care for Type 2 diabetes, thyroid disorders, hypertension, respiratory infections, digestive upsets, and micronutrient deficiencies—ensuring your medications work harmoniously without unnecessary polypharmacy.",
      "Whether you need prompt diagnosis for a seasonal fever, structured metabolic control to bring HbA1c back into target range, or an annual preventive health review with coordinated specialist referrals, our team delivers thorough, patient-centred care."
    ],
    conditionsTreated: [
      "Type 1 & Type 2 Diabetes & Prediabetes Care",
      "Hypothyroidism, Hyperthyroidism & Metabolic Imbalances",
      "Acute Fevers, Dengue, Typhoid & Viral Infections",
      "Respiratory Infections, Bronchitis & Sinusitis",
      "Chronic Fatigue, Anaemia & Vitamin D / B12 Deficiencies",
      "Acid Reflux, Gastritis & Digestive Discomfort",
      "Hypertension & Combined Metabolic Risk",
      "Annual Adult Preventive Health Evaluations"
    ],
    procedures: [
      {
        name: "Comprehensive Adult Physical Evaluation",
        description:
          "Full-system medical assessment checking vitals, respiratory, abdominal, and metabolic health."
      },
      {
        name: "Diabetes & HbA1c Optimisation Clinic",
        description:
          "Structured blood sugar trend review, nutrition coaching, and organ-protective medication tuning."
      },
      {
        name: "Fever & Infection Diagnostic Workup",
        description:
          "Rational lab testing to pinpoint bacterial, viral, or vector-borne fevers rapidly."
      },
      {
        name: "Thyroid & Hormonal Screening",
        description:
          "Careful TSH/T3/T4 monitoring and dosage titration for steady energy and weight balance."
      },
      {
        name: "Executive Preventive Health Review",
        description:
          "Integrated review of CBC, liver, kidney, lipid, and diabetes panels with actionable wellness goals."
      },
      {
        name: "Adult Immunisation & Travel Health",
        description:
          "Guidance on annual influenza, pneumococcal, hepatitis, and adult booster vaccines."
      }
    ],
    whenToVisitSymptoms: [
      "Fever lasting more than 2 days, body aches, or persistent chills",
      "Unexplained fatigue, hair thinning, weight shifts, or daytime sluggishness",
      "Fasting blood sugar readings above 110 mg/dL or elevated HbA1c",
      "Ongoing acidity, bloating, or changes in appetite",
      "Sore throat, persistent cough, or breathlessness after a cold",
      "Due for an annual health screening or medication review"
    ],
    preparationChecklist: [
      "Bring blood glucose logs, home BP readings, and recent annual lab panels",
      "Carry all regular prescription strips or a clear list of supplements",
      "Note down how long symptoms have lasted and any recent travel",
      "Fast only if your physician specifically schedules a fasting blood test afterwards"
    ],
    consultationSteps: [
      {
        step: "01",
        title: "Holistic Health Review",
        description:
          "Review of acute symptoms, chronic conditions, sleep, stress, and current medications."
      },
      {
        step: "02",
        title: "Complete Vitals & Exam",
        description:
          "Blood pressure, pulse, oxygen level, chest auscultation, and targeted physical checks."
      },
      {
        step: "03",
        title: "Focused Lab Guidance",
        description:
          "Advising only essential diagnostic panels without redundant testing."
      },
      {
        step: "04",
        title: "Coordinated Wellness Plan",
        description:
          "Clear prescriptions, lifestyle steps, and direct specialist coordination if required."
      }
    ],
    faqs: [
      {
        question: "When should I consult a General Physician first instead of a super-specialist?",
        answer:
          "Whenever you have fever, fatigue, multiple overlapping symptoms, diabetes/thyroid control needs, or are unsure which department fits best, an Internal Medicine physician provides the ideal comprehensive evaluation."
      },
      {
        question: "Can Dr. Vikram Rao manage diabetes and blood pressure together?",
        answer:
          "Yes. Managing diabetes, cholesterol, and hypertension together ensures medications complement each other while protecting kidney and heart health."
      },
      {
        question: "Are Sunday morning physician slots available?",
        answer:
          "Yes! Dr. Vikram Rao offers Sunday morning OPD slots (9:30 AM – 1:00 PM) in addition to Monday–Saturday hours."
      },
      {
        question: "Can I bring outside lab reports for review?",
        answer:
          "Yes, bring any recent blood or imaging reports from NABL-certified labs for interpretation and treatment planning."
      },
      {
        question: "How quickly is an appointment confirmed?",
        answer:
          "Online bookings confirm immediately upon Razorpay verification, and you receive your booking reference by Email, SMS, and WhatsApp."
      }
    ]
  }
};

export function getServiceSeoContent(service: Service): ServiceSeoContent {
  const existing = SERVICE_CONTENT_MAP[service.slug];
  if (existing) return existing;

  return {
    seoTitle: `${service.name} | ${service.category} Specialists | AuraCare Hospital`,
    seoDescription: `${service.shortDescription} Book a verified specialist consultation online at AuraCare Multispeciality Hospital.`,
    keywords: [
      service.name.toLowerCase(),
      service.category.toLowerCase(),
      "hospital consultation",
      "book doctor online"
    ],
    heroBadge: service.category,
    overviewParagraphs: [
      service.fullDescription,
      `At AuraCare Multispeciality Hospital, our ${service.name} team focuses on clear clinical communication, evidence-based diagnostics, and coordinated outpatient follow-up tailored to each patient.`
    ],
    conditionsTreated: [
      `Acute and chronic ${service.category.toLowerCase()} concerns`,
      "Preventive specialist evaluations & screenings",
      "Diagnostic report interpretation & second opinions",
      "Post-treatment recovery & follow-up planning"
    ],
    procedures: [
      {
        name: "Specialist Outpatient Consultation",
        description:
          "Comprehensive symptom review, physical exam, and personalised care roadmap."
      },
      {
        name: "Diagnostic & Lab Coordination",
        description:
          "Targeted investigations aligned with clinical guidelines."
      },
      {
        name: "Follow-Up & Preventive Care",
        description:
          "Structured review milestones with automated appointment reminders."
      }
    ],
    whenToVisitSymptoms: [
      "Persistent or recurring symptoms affecting daily comfort",
      "Need for specialist confirmation or second medical opinion",
      "Preventive screening or routine scheduled follow-up"
    ],
    preparationChecklist: [
      "Bring any recent diagnostic reports, scans, or lab panels",
      "Carry a complete list of current medications and allergies",
      "Write down key questions to discuss during your consultation"
    ],
    consultationSteps: [
      {
        step: "01",
        title: "Symptom & History Review",
        description: "Thorough review of medical background and prior reports."
      },
      {
        step: "02",
        title: "Clinical Examination",
        description: "Focused specialist evaluation in a private OPD suite."
      },
      {
        step: "03",
        title: "Diagnostic Clarity",
        description: "Targeted test guidance only when clinically indicated."
      },
      {
        step: "04",
        title: "Personalised Care Plan",
        description: "Clear prescriptions, lifestyle guidance, and follow-up dates."
      }
    ],
    faqs: [
      {
        question: `How do I book an appointment for ${service.name}?`,
        answer:
          "Click 'Book Doctor', select your specialist, choose an available date and time slot, and confirm securely online with Razorpay."
      },
      {
        question: "What should I carry to my consultation?",
        answer:
          "Please carry any relevant prior medical reports, lab results, and your current medication list."
      },
      {
        question: "Can I cancel or reschedule if my plans change?",
        answer:
          "Yes, patients can cancel eligible bookings from their Patient Dashboard within the hospital's cancellation policy window."
      }
    ]
  };
}
