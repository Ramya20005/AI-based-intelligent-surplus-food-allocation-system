export type Language = 'en' | 'ta';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.howItWorks': 'How It Works',
    'nav.impact': 'Impact',
    'nav.contact': 'Contact',
    'nav.signup': 'Sign Up',
    'nav.login': 'Login',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',

    // Hero
    'hero.title': 'Reduce Food Waste.',
    'hero.titleHighlight': 'Feed Lives.',
    'hero.subtitle': 'AI-powered safe surplus food redistribution platform connecting donors with NGOs to ensure no meal goes to waste.',
    'hero.donate': 'Donate Food',
    'hero.request': 'Request Food',

    // About
    'about.title': 'About Our Mission',
    'about.subtitle': 'Bridging the gap between surplus and need',
    'about.description': 'Our AI-Based Intelligent Surplus Food Allocation System uses cutting-edge artificial intelligence to analyze donated food safety, assess risk levels, and intelligently match surplus food with the communities that need it most. We partner with restaurants, hotels, caterers, and individuals to redistribute safe, quality food to NGOs and shelters.',
    'about.vision': 'Our Vision',
    'about.visionText': 'A world where no edible food goes to waste while people go hungry.',
    'about.mission': 'Our Mission',
    'about.missionText': 'To leverage AI technology for smart, safe, and efficient food redistribution.',

    // How It Works
    'how.title': 'How It Works',
    'how.subtitle': 'Simple steps to make a difference',
    'how.step1.title': 'Food Donation',
    'how.step1.desc': 'Donors submit surplus food details through our easy-to-use platform.',
    'how.step2.title': 'AI Analysis',
    'how.step2.desc': 'Our AI engine analyzes food type, preparation time, and freshness.',
    'how.step3.title': 'Risk Scoring',
    'how.step3.desc': 'Each item receives a safety score and risk classification.',
    'how.step4.title': 'Smart Allocation',
    'how.step4.desc': 'Safe food is matched with nearby NGOs based on needs and capacity.',
    'how.step5.title': 'Distribution',
    'how.step5.desc': 'NGOs collect and distribute food to communities in need.',

    // Impact
    'impact.title': 'Our Impact',
    'impact.subtitle': 'Making a measurable difference',
    'impact.meals': 'Meals Saved',
    'impact.donors': 'Active Donors',
    'impact.ngos': 'NGOs Connected',
    'impact.waste': 'Tons Waste Reduced',

    // Contact
    'contact.title': 'Get In Touch',
    'contact.subtitle': 'Have questions? We\'d love to hear from you.',
    'contact.name': 'Full Name',
    'contact.email': 'Email Address',
    'contact.message': 'Your Message',
    'contact.send': 'Send Message',
    'contact.success': 'Thank you! Your message has been sent successfully.',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Create Account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.role': 'I am a...',
    'auth.donor': 'Donor',
    'auth.ngo': 'NGO',
    'auth.admin': 'Admin',
    'auth.hasAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",

    // Dashboard
    'dash.addFood': 'Add Food',
    'dash.myDonations': 'My Donations',
    'dash.feedback': 'Feedback',
    'dash.profile': 'Profile',
    'dash.welcome': 'Welcome',
    'dash.overview': 'Dashboard Overview',

    // Food Form
    'food.category': 'Food Category',
    'food.name': 'Food Name',
    'food.quantity': 'Quantity (servings)',
    'food.prepTime': 'Preparation Time',
    'food.freshness': 'Freshness Duration (hours)',
    'food.location': 'Pickup Location',
    'food.submit': 'Submit for AI Analysis',
    'food.veg': 'Vegetarian',
    'food.nonveg': 'Non-Vegetarian',
    'food.dairy': 'Dairy',
    'food.bakery': 'Bakery',
    'food.fruits': 'Fruits & Vegetables',

    // AI Result
    'ai.result': 'AI Analysis Result',
    'ai.safe': 'SAFE',
    'ai.moderate': 'MODERATE RISK',
    'ai.unsafe': 'UNSAFE',
    'ai.riskScore': 'Risk Score',
    'ai.safeTime': 'Remaining Safe Time',
    'ai.suitableFor': 'Suitable For',
    'ai.notRecommended': 'Not Recommended For',
    'ai.explanation': 'Analysis',
    'ai.analyzing': 'AI is analyzing your food...',

    // NGO
    'ngo.available': 'Available Food',
    'ngo.apply': 'Apply Now',
    'ngo.locked': 'LOCKED',
    'ngo.applied': 'Applied Successfully',

    // Admin
    'admin.title': 'Admin Dashboard',
    'admin.foodList': 'Food Allocations',
    'admin.download': 'Download Report',
    'admin.riskScore': 'Risk Score',
    'admin.lockedBy': 'Locked By',
    'admin.lockTime': 'Lock Time',
    'admin.status': 'Status',

    // Feedback
    'feedback.title': 'Share Your Feedback',
    'feedback.rating': 'Rating',
    'feedback.comment': 'Your Comments',
    'feedback.submit': 'Submit Feedback',
    'feedback.success': 'Thank you for your feedback!',

    // Footer
    'footer.tagline': 'AI-powered surplus food redistribution for a hunger-free world.',
    'footer.quickLinks': 'Quick Links',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.rights': 'All rights reserved.',
  },
  ta: {
    // Nav
    'nav.home': 'முகப்பு',
    'nav.about': 'பற்றி',
    'nav.howItWorks': 'எப்படி செயல்படுகிறது',
    'nav.impact': 'தாக்கம்',
    'nav.contact': 'தொடர்பு',
    'nav.signup': 'பதிவு',
    'nav.login': 'உள்நுழை',
    'nav.dashboard': 'டாஷ்போர்ட்',
    'nav.profile': 'சுயவிவரம்',
    'nav.logout': 'வெளியேறு',

    // Hero
    'hero.title': 'உணவு வீணாவதை குறைக்கவும்.',
    'hero.titleHighlight': 'உயிர்களை ஊட்டுங்கள்.',
    'hero.subtitle': 'AI-இயக்கப்படும் பாதுகாப்பான உபரி உணவு மறுபகிர்வு தளம், நன்கொடையாளர்களை NGO-களுடன் இணைக்கிறது.',
    'hero.donate': 'உணவை நன்கொடை செய்',
    'hero.request': 'உணவை கோரு',

    // About
    'about.title': 'எங்கள் நோக்கம் பற்றி',
    'about.subtitle': 'உபரிக்கும் தேவைக்கும் இடையே பாலம்',
    'about.description': 'எங்கள் AI அடிப்படையிலான நுண்ணறிவு உபரி உணவு ஒதுக்கீட்டு அமைப்பு நன்கொடை உணவு பாதுகாப்பை பகுப்பாய்வு செய்ய, ஆபத்து நிலைகளை மதிப்பிட, மற்றும் உபரி உணவை அதிகம் தேவைப்படும் சமூகங்களுக்கு புத்திசாலித்தனமாக பொருத்த அதிநவீன செயற்கை நுண்ணறிவைப் பயன்படுத்துகிறது.',
    'about.vision': 'எங்கள் பார்வை',
    'about.visionText': 'மக்கள் பசியோடு இருக்கும்போது எந்த உண்ணக்கூடிய உணவும் வீணாகாத உலகம்.',
    'about.mission': 'எங்கள் பணி',
    'about.missionText': 'புத்திசாலி, பாதுகாப்பான மற்றும் திறமையான உணவு மறுபகிர்வுக்கு AI தொழில்நுட்பத்தை பயன்படுத்துதல்.',

    // How It Works
    'how.title': 'எப்படி செயல்படுகிறது',
    'how.subtitle': 'மாற்றத்தை ஏற்படுத்த எளிய படிகள்',
    'how.step1.title': 'உணவு நன்கொடை',
    'how.step1.desc': 'நன்கொடையாளர்கள் எங்கள் தளம் மூலம் உபரி உணவு விவரங்களை சமர்ப்பிக்கின்றனர்.',
    'how.step2.title': 'AI பகுப்பாய்வு',
    'how.step2.desc': 'எங்கள் AI இயந்திரம் உணவு வகை, தயாரிப்பு நேரம், புத்துணர்ச்சி ஆகியவற்றை பகுப்பாய்வு செய்கிறது.',
    'how.step3.title': 'ஆபத்து மதிப்பீடு',
    'how.step3.desc': 'ஒவ்வொரு பொருளும் பாதுகாப்பு மதிப்பெண் மற்றும் ஆபத்து வகைப்பாடு பெறுகிறது.',
    'how.step4.title': 'புத்திசாலி ஒதுக்கீடு',
    'how.step4.desc': 'பாதுகாப்பான உணவு அருகிலுள்ள NGO-களுடன் தேவைகளின் அடிப்படையில் பொருத்தப்படுகிறது.',
    'how.step5.title': 'விநியோகம்',
    'how.step5.desc': 'NGO-கள் உணவை சேகரித்து சமூகங்களுக்கு விநியோகிக்கின்றன.',

    // Impact
    'impact.title': 'எங்கள் தாக்கம்',
    'impact.subtitle': 'அளவிடக்கூடிய மாற்றத்தை ஏற்படுத்துதல்',
    'impact.meals': 'சேமிக்கப்பட்ட உணவுகள்',
    'impact.donors': 'செயலில் உள்ள நன்கொடையாளர்கள்',
    'impact.ngos': 'இணைக்கப்பட்ட NGO-கள்',
    'impact.waste': 'டன் வீணாவது குறைக்கப்பட்டது',

    // Contact
    'contact.title': 'தொடர்பு கொள்ளுங்கள்',
    'contact.subtitle': 'கேள்விகள் உள்ளதா? உங்களிடமிருந்து கேட்க விரும்புகிறோம்.',
    'contact.name': 'முழு பெயர்',
    'contact.email': 'மின்னஞ்சல்',
    'contact.message': 'உங்கள் செய்தி',
    'contact.send': 'செய்தி அனுப்பு',
    'contact.success': 'நன்றி! உங்கள் செய்தி வெற்றிகரமாக அனுப்பப்பட்டது.',

    // Auth
    'auth.login': 'உள்நுழை',
    'auth.register': 'கணக்கு உருவாக்கு',
    'auth.email': 'மின்னஞ்சல்',
    'auth.password': 'கடவுச்சொல்',
    'auth.name': 'முழு பெயர்',
    'auth.role': 'நான் ஒரு...',
    'auth.donor': 'நன்கொடையாளர்',
    'auth.ngo': 'NGO',
    'auth.admin': 'நிர்வாகி',
    'auth.hasAccount': 'ஏற்கனவே கணக்கு உள்ளதா?',
    'auth.noAccount': 'கணக்கு இல்லையா?',

    // Dashboard
    'dash.addFood': 'உணவு சேர்',
    'dash.myDonations': 'என் நன்கொடைகள்',
    'dash.feedback': 'கருத்து',
    'dash.profile': 'சுயவிவரம்',
    'dash.welcome': 'வரவேற்பு',
    'dash.overview': 'டாஷ்போர்ட் கண்ணோட்டம்',

    // Food Form
    'food.category': 'உணவு வகை',
    'food.name': 'உணவு பெயர்',
    'food.quantity': 'அளவு (பரிமாறல்)',
    'food.prepTime': 'தயாரிப்பு நேரம்',
    'food.freshness': 'புத்துணர்ச்சி காலம் (மணி)',
    'food.location': 'எடுக்கும் இடம்',
    'food.submit': 'AI பகுப்பாய்வுக்கு சமர்ப்பி',
    'food.veg': 'சைவம்',
    'food.nonveg': 'அசைவம்',
    'food.dairy': 'பால் பொருட்கள்',
    'food.bakery': 'பேக்கரி',
    'food.fruits': 'பழங்கள் & காய்கறிகள்',

    // AI Result
    'ai.result': 'AI பகுப்பாய்வு முடிவு',
    'ai.safe': 'பாதுகாப்பானது',
    'ai.moderate': 'மிதமான ஆபத்து',
    'ai.unsafe': 'பாதுகாப்பற்றது',
    'ai.riskScore': 'ஆபத்து மதிப்பெண்',
    'ai.safeTime': 'மீதமுள்ள பாதுகாப்பு நேரம்',
    'ai.suitableFor': 'பொருத்தமானது',
    'ai.notRecommended': 'பரிந்துரைக்கப்படவில்லை',
    'ai.explanation': 'பகுப்பாய்வு',
    'ai.analyzing': 'AI உங்கள் உணவை பகுப்பாய்வு செய்கிறது...',

    // NGO
    'ngo.available': 'கிடைக்கும் உணவு',
    'ngo.apply': 'இப்போது விண்ணப்பி',
    'ngo.locked': 'பூட்டப்பட்டது',
    'ngo.applied': 'வெற்றிகரமாக விண்ணப்பிக்கப்பட்டது',

    // Admin
    'admin.title': 'நிர்வாக டாஷ்போர்ட்',
    'admin.foodList': 'உணவு ஒதுக்கீடுகள்',
    'admin.download': 'அறிக்கை பதிவிறக்கம்',
    'admin.riskScore': 'ஆபத்து மதிப்பெண்',
    'admin.lockedBy': 'பூட்டியவர்',
    'admin.lockTime': 'பூட்டிய நேரம்',
    'admin.status': 'நிலை',

    // Feedback
    'feedback.title': 'உங்கள் கருத்தை பகிரவும்',
    'feedback.rating': 'மதிப்பீடு',
    'feedback.comment': 'உங்கள் கருத்துகள்',
    'feedback.submit': 'கருத்து சமர்ப்பி',
    'feedback.success': 'உங்கள் கருத்துக்கு நன்றி!',

    // Footer
    'footer.tagline': 'பசியற்ற உலகிற்கான AI-இயக்கப்படும் உபரி உணவு மறுபகிர்வு.',
    'footer.quickLinks': 'விரைவு இணைப்புகள்',
    'footer.legal': 'சட்டம்',
    'footer.privacy': 'தனியுரிமை கொள்கை',
    'footer.terms': 'சேவை விதிமுறைகள்',
    'footer.rights': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  },
};
