import bcrypt from "bcryptjs";
import type {
  DoctorSchedule,
  HospitalDatabase,
  Service,
  Doctor
} from "@/types/hospital";

export function createSeedDatabase(): HospitalDatabase {
  const now = new Date().toISOString();
  const demoPasswordHash = bcrypt.hashSync("Demo@1234", 10);

  const adminId = "11111111-1111-4111-8111-111111111101";
  const docProfile1 = "11111111-1111-4111-8111-111111111103";
  const docProfile2 = "11111111-1111-4111-8111-111111111104";

  const services: Service[] = [
    {
      id: "22222222-2222-4222-8222-222222222201",
      slug: "cardiology",
      name: "Cardiology & Heart Care",
      category: "Cardiac Sciences",
      shortDescription:
        "Preventive cardiac screening, echocardiography, hypertension care, and interventional cardiology.",
      fullDescription:
        "Our Cardiology department combines evidence-based diagnostics—including 12-lead ECG, 2D Echocardiography, treadmill stress testing, and Holter monitoring—with personalised treatment plans for coronary artery disease, arrhythmias, and preventive heart health.",
      iconName: "HeartPulse",
      imageUrl: "/images/services/cardiology.jpg",
      isPublished: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "22222222-2222-4222-8222-222222222202",
      slug: "orthopedics",
      name: "Orthopedics & Joint Care",
      category: "Musculoskeletal",
      shortDescription:
        "Sports injury management, arthritis care, spine evaluation, and joint replacement guidance.",
      fullDescription:
        "From acute fracture care and sports ligament rehabilitation to minimally invasive arthroscopy and total joint replacement consultations, our orthopedic team restores mobility safely and comfortably.",
      iconName: "Bone",
      imageUrl: "/images/services/orthopedics.jpg",
      isPublished: true,
      displayOrder: 2,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "22222222-2222-4222-8222-222222222203",
      slug: "pediatrics",
      name: "Pediatrics & Child Care",
      category: "Child Health",
      shortDescription:
        "Newborn check-ups, childhood immunisations, growth monitoring, and acute paediatric care.",
      fullDescription:
        "Compassionate care for infants, children, and adolescents covering routine developmental milestones, vaccination schedules, nutritional counselling, and respiratory or seasonal illness management.",
      iconName: "Baby",
      imageUrl: "/images/services/pediatrics.jpg",
      isPublished: true,
      displayOrder: 3,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "22222222-2222-4222-8222-222222222204",
      slug: "neurology",
      name: "Neurology & Brain Care",
      category: "Neurosciences",
      shortDescription:
        "Comprehensive evaluation for migraine, epilepsy, stroke recovery, and nerve disorders.",
      fullDescription:
        "Specialised neurological consultations supported by EEG, nerve conduction studies, and multidisciplinary neuro-rehabilitation protocols for headaches, movement disorders, and cerebrovascular conditions.",
      iconName: "Brain",
      imageUrl: "/images/services/neurology.svg",
      isPublished: true,
      displayOrder: 4,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "22222222-2222-4222-8222-222222222205",
      slug: "dermatology",
      name: "Dermatology & Skin Care",
      category: "Clinical Dermatology",
      shortDescription:
        "Medical dermatology for eczema, acne, hair disorders, allergies, and skin screening.",
      fullDescription:
        "Evidence-based diagnosis and treatment for chronic skin conditions, paediatric dermatology, dermoscopy mole checks, and hair-loss evaluation in a clinical hospital setting.",
      iconName: "Sparkles",
      imageUrl: "/images/services/dermatology.jpg",
      isPublished: true,
      displayOrder: 5,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "22222222-2222-4222-8222-222222222206",
      slug: "general-medicine",
      name: "General & Internal Medicine",
      category: "Primary Care",
      shortDescription:
        "Adult primary care, diabetes and thyroid management, fever evaluation, and annual health checks.",
      fullDescription:
        "First-line physician care for acute infections, metabolic conditions such as diabetes and dyslipidaemia, preventive health check-ups, and coordinated referrals across hospital specialities.",
      iconName: "Stethoscope",
      imageUrl: "/images/services/general-medicine.jpg",
      isPublished: true,
      displayOrder: 6,
      createdAt: now,
      updatedAt: now
    }
  ];

  const doctors: Doctor[] = [
    {
      id: "33333333-3333-4333-8333-333333333301",
      profileId: docProfile1,
      slug: "dr-arjun-mehta",
      fullName: "Dr. Arjun Mehta",
      photoUrl: "/images/doctors/dr-arjun.jpg",
      qualification: "MBBS, MD (Medicine), DM (Cardiology)",
      experienceYears: 14,
      specialty: "Senior Consultant Cardiologist",
      biography:
        "Dr. Arjun Mehta specialises in preventive cardiology, heart failure management, and non-invasive cardiac imaging. He leads AuraCare's Preventive Heart Clinic with a focus on clear patient communication.",
      consultationFee: 900,
      slotDurationMins: 30,
      serviceIds: [services[0].id, services[5].id],
      isActive: true,
      isVisible: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      profileId: docProfile2,
      slug: "dr-kavya-nair",
      fullName: "Dr. Kavya Nair",
      photoUrl: "/images/doctors/dr-meera.jpg",
      qualification: "MBBS, MD (Pediatrics), Fellowship in Neonatology",
      experienceYears: 11,
      specialty: "Consultant Pediatrician",
      biography:
        "Dr. Kavya Nair brings over a decade of experience in newborn care, childhood immunisations, and adolescent wellness, helping parents navigate every stage of growth with confidence.",
      consultationFee: 700,
      slotDurationMins: 30,
      serviceIds: [services[2].id],
      isActive: true,
      isVisible: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      slug: "dr-rohan-kulkarni",
      fullName: "Dr. Rohan Kulkarni",
      photoUrl: "/images/doctors/dr-rohan.jpg",
      qualification: "MBBS, MS (Orthopedics), FIJR",
      experienceYears: 13,
      specialty: "Orthopedic & Joint Replacement Surgeon",
      biography:
        "Dr. Rohan Kulkarni focuses on arthroscopic sports injury repair, osteoarthritis management, and minimally invasive knee and hip replacement rehabilitation.",
      consultationFee: 850,
      slotDurationMins: 30,
      serviceIds: [services[1].id],
      isActive: true,
      isVisible: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "33333333-3333-4333-8333-333333333304",
      slug: "dr-ananya-sharma",
      fullName: "Dr. Ananya Sharma",
      photoUrl: "/images/hero-doctor.jpg",
      qualification: "MBBS, MD (Medicine), DM (Neurology)",
      experienceYears: 10,
      specialty: "Consultant Neurologist",
      biography:
        "Dr. Ananya Sharma treats chronic migraine, epilepsy, peripheral neuropathy, and post-stroke recovery with structured, patient-centred care pathways.",
      consultationFee: 950,
      slotDurationMins: 30,
      serviceIds: [services[3].id],
      isActive: true,
      isVisible: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "33333333-3333-4333-8333-333333333305",
      slug: "dr-meera-iyer",
      fullName: "Dr. Meera Iyer",
      photoUrl: "/images/doctors/dr-meera.jpg",
      qualification: "MBBS, MD (Dermatology, Venereology & Leprology)",
      experienceYears: 9,
      specialty: "Consultant Dermatologist",
      biography:
        "Dr. Meera Iyer provides clinical care for inflammatory skin disorders, allergy testing, acne scarring protocols, and early skin lesion screening.",
      consultationFee: 650,
      slotDurationMins: 20,
      serviceIds: [services[4].id],
      isActive: true,
      isVisible: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "33333333-3333-4333-8333-333333333306",
      slug: "dr-vikram-rao",
      fullName: "Dr. Vikram Rao",
      photoUrl: "/images/doctors/dr-arjun.jpg",
      qualification: "MBBS, MD (Internal Medicine)",
      experienceYears: 16,
      specialty: "Senior Physician & Diabetologist",
      biography:
        "Dr. Vikram Rao leads comprehensive adult internal medicine, chronic diabetes and thyroid clinics, and coordinated multi-specialty preventive evaluations.",
      consultationFee: 600,
      slotDurationMins: 20,
      serviceIds: [services[5].id, services[0].id],
      isActive: true,
      isVisible: true,
      createdAt: now,
      updatedAt: now
    }
  ];

  // Build Mon-Sat schedules for all doctors (plus Sunday morning for Dr. Vikram Rao)
  const doctorSchedules: DoctorSchedule[] = [];
  doctors.forEach((doc, idx) => {
    for (let day = 0; day <= 6; day++) {
      const isSunday = day === 0;
      const available = isSunday ? idx === 5 : true;
      doctorSchedules.push({
        id: `44444444-4444-4444-8444-44444444${String(idx + 1).padStart(2, "0")}${day}0`,
        doctorId: doc.id,
        dayOfWeek: day,
        startTime: isSunday ? "09:30" : "09:00",
        endTime: isSunday ? "13:00" : day === 6 ? "14:00" : "17:30",
        breakStart: isSunday || day === 6 ? undefined : "13:00",
        breakEnd: isSunday || day === 6 ? undefined : "14:00",
        slotDurationMins: doc.slotDurationMins,
        isAvailable: available
      });
    }
  });

  return {
    profiles: [
      {
        id: adminId,
        email: "admin@auracare.example",
        fullName: "Hospital Administrator",
        phone: "+91 98200 11001",
        role: "super_admin",
        permissions: {
          view_dashboard: true,
          manage_doctors: true,
          manage_services: true,
          manage_appointments: true,
          manage_queue: true,
          manage_patients: true,
          manage_payments: true,
          manage_notifications: true,
          manage_website: true
        },
        passwordHash: demoPasswordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: docProfile1,
        email: "dr.arjun@auracare.example",
        fullName: "Dr. Arjun Mehta",
        phone: "+91 98200 11003",
        role: "doctor",
        permissions: {},
        passwordHash: demoPasswordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: docProfile2,
        email: "dr.kavya@auracare.example",
        fullName: "Dr. Kavya Nair",
        phone: "+91 98200 11004",
        role: "doctor",
        permissions: {},
        passwordHash: demoPasswordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "11111111-1111-4111-8111-111111111105",
        email: "reception@auracare.example",
        fullName: "OPD Reception Desk",
        phone: "+91 98200 11005",
        role: "reception",
        permissions: { manage_queue: true, manage_appointments: true },
        passwordHash: demoPasswordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    services,
    doctors,
    doctorSchedules,
    blockedSlots: [],
    queueStates: [],
    appointments: [],
    appointmentStatusHistory: [],
    payments: [],
    notificationLogs: [],
    enquiries: [],
    coupons: [],
    websiteSettings: {
      id: "default",
      hospitalName: "AuraCare Multispeciality Hospital",
      tagline: "Compassionate Clinical Excellence, Every Single Visit",
      logoUrl: "",
      phone: "+91 22 4890 3200",
      emergencyPhone: "+91 22 4890 9911",
      email: "care@auracarehospital.example",
      address: "42 Marine Drive Healthcare Boulevard, Mumbai 400020",
      workingHours: "OPD: Mon–Sat 8:30 AM – 8:00 PM | 24×7 Emergency & Trauma Care",
      mapLink: "https://maps.google.com/?q=Marine+Drive+Mumbai",
      heroTitle: "Trusted Specialists. Effortless Doctor Appointments.",
      heroSubtitle:
        "Explore verified hospital specialities, view real-time doctor slot availability, and book your consultation online with instant confirmation.",
      heroCtaText: "Book Doctor",
      aboutIntro:
        "AuraCare Multispeciality Hospital delivers ethical, evidence-based medical care across six core specialities under one roof. Designed around patient comfort and transparent clinical guidance, our facility brings senior specialists, modern diagnostics, and streamlined digital booking together.",
      aboutMission:
        "To provide accessible, accurate, and compassionate healthcare where every patient receives unhurried attention and clear clinical guidance.",
      aboutVision:
        "To set the regional benchmark for patient-first hospital care combining clinical rigour with seamless digital access.",
      aboutPhilosophy:
        "We believe healthcare works best when clinical decisions are transparent, appointments respect your time, and specialists collaborate closely across departments.",
      aboutFacilities:
        "Equipped with modular consultation suites, 2D Echo & digital diagnostic imaging, dedicated paediatric care wing, physiotherapy unit, and 24×7 emergency triage.",
      certifications: [
        "NABH Accredited Patient Safety Standards",
        "ISO 9001:2015 Clinical Quality Systems",
        "NABL Certified Diagnostic Partner Network"
      ],
      whyChooseUs: [
        {
          title: "Verified Senior Specialists",
          description: "Board-certified doctors across Cardiology, Orthopedics, Pediatrics, Neurology, Dermatology & Internal Medicine.",
          icon: "ShieldCheck"
        },
        {
          title: "Live OPD Queue & Window Booking",
          description: "Morning & evening booking windows with 15-minute internal capacity planning and real-time queue token tracking.",
          icon: "CalendarCheck"
        },
        {
          title: "Transparent Fees & Razorpay",
          description: "Upfront consultation fees with server-verified online payments and instant booking receipts.",
          icon: "CreditCard"
        },
        {
          title: "Instant Multi-Channel Alerts",
          description: "Booking confirmations and updates dispatched via Email, SMS (MSG91), and WhatsApp.",
          icon: "BellRing"
        }
      ],
      facilitiesHighlights: [
        {
          title: "Cardiac & Diagnostic Suite",
          description: "12-lead ECG, 2D Echocardiography, and ambulatory monitoring integrated with Cardiology OPD.",
          badge: "Diagnostics"
        },
        {
          title: "Child-Friendly Paediatric Wing",
          description: "Dedicated waiting zone, vaccination clinic, and gentle nursing support for families.",
          badge: "Pediatrics"
        },
        {
          title: "Orthopedic & Rehab Unit",
          description: "Digital X-ray support and structured physiotherapy guidance for faster joint recovery.",
          badge: "Rehabilitation"
        },
        {
          title: "24×7 Emergency Triage",
          description: "Round-the-clock emergency medical officers and rapid specialist on-call coverage.",
          badge: "24×7 Care"
        }
      ],
      testimonials: [
        {
          id: "t1",
          patientName: "Rohan S.",
          department: "Cardiology",
          quote:
            "Booking Dr. Arjun Mehta online took less than two minutes, and I received my confirmation on WhatsApp and email immediately.",
          rating: 5,
          approved: true
        },
        {
          id: "t2",
          patientName: "Meenakshi R.",
          department: "Pediatrics",
          quote:
            "Dr. Kavya Nair takes the time to explain every milestone and vaccination clearly. Zero waiting room chaos thanks to strict time slots.",
          rating: 5,
          approved: true
        },
        {
          id: "t3",
          patientName: "Sandeep V.",
          department: "Orthopedics",
          quote:
            "Transparent consultation fees and very organised front-desk support from check-in to follow-up.",
          rating: 5,
          approved: true
        },
        {
          id: "t4",
          patientName: "Anjali K.",
          department: "Neurology",
          quote:
            "Dr. Ananya Sharma listened patiently to my migraine history and laid out a clear recovery plan without rushing.",
          rating: 5,
          approved: true
        },
        {
          id: "t5",
          patientName: "Farhan M.",
          department: "Dermatology",
          quote:
            "Seamless Razorpay checkout, live slot selection, and spotless clinical suites. Easily the best hospital experience.",
          rating: 5,
          approved: true
        },
        {
          id: "t6",
          patientName: "Priya N.",
          department: "Internal Medicine",
          quote:
            "Received my appointment reminder on SMS and WhatsApp on time, and Dr. Vikram Rao reviewed every lab report thoroughly.",
          rating: 5,
          approved: true
        }
      ],
      socialLinks: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
        youtube: "https://youtube.com"
      },
      footerText:
        "© 2026 AuraCare Multispeciality Hospital. Dedicated to safe, ethical, and patient-first healthcare.",
      seoSettings: {
        homeTitle: "AuraCare Multispeciality Hospital | Book Doctor Appointments Online",
        homeDescription:
          "Book appointments online with senior specialists in Cardiology, Orthopedics, Pediatrics, Neurology, Dermatology, and Internal Medicine.",
        aboutTitle: "About AuraCare Hospital | Clinical Excellence & Facilities",
        servicesTitle: "Medical Services & Specialities | AuraCare Hospital",
        doctorsTitle: "Our Doctors & Specialists | AuraCare Hospital",
        contactTitle: "Contact & Emergency Info | AuraCare Hospital"
      },
      bookingSettings: {
        bookingFlowOrder: "service_first",
        paymentMandatoryForConfirmation: true,
        requireManualApproval: false,
        slotHoldMinutes: 10,
        queueMinutesPerPatient: 15,
        queueBufferMinutes: 15,
        cancellationWindowHours: 4,
        refundEligibleWithinWindow: true,
        advanceBookingDays: 30
      },
      notificationSettings: {
        emailEnabled: true,
        smtpHost: "",
        smtpPort: 465,
        smtpUser: "",
        smtpPass: "",
        senderName: "BookMyDoc India",
        senderEmail: "",
        smsEnabled: true,
        msg91AuthKey: "",
        msg91SenderId: "AURACR",
        msg91SmsTemplateId: "",
        whatsappEnabled: true,
        whatsappProvider: "msg91",
        whatsappApiKey: "",
        whatsappIntegratedNumber: "",
        whatsappTemplateConfirmed: "appointment_confirmed_v1",
        whatsappTemplateCancelled: "appointment_cancelled_v1",
        whatsappVariableMapping: "1:patientName,2:bookingRef,3:doctorName,4:date,5:time",
        events: {
          bookingReceived: { email: true, sms: true, whatsapp: true, adminAlert: true },
          paymentSuccessful: { email: true, sms: false, whatsapp: true, adminAlert: false },
          appointmentConfirmed: { email: true, sms: true, whatsapp: true, adminAlert: true },
          appointmentCancelled: { email: true, sms: true, whatsapp: true, adminAlert: true },
          appointmentReminder: { email: true, sms: true, whatsapp: false, adminAlert: false }
        }
      },
      updatedAt: now
    },
    passwordResetTokens: []
  };
}
