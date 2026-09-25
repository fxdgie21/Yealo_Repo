export type Language = 'en' | 'tl';

export interface Translations {
  nav: {
    services: string;
    products: string;
    reviews: string;
    contacts: string;
    cart: string;
    orderNow: string;
    trackOrders: string;
    language: string;
  };
  hero: {
    badge: string;
    tagline1: string;
    tagline2: string;
    subtitle: string;
    orderNowBtn: string;
    viewProductsBtn: string;
    roPureBadge: string;
    foodGradeBadge: string;
    dailyDelivery: string;
  };
  about: {
    badge: string;
    title: string;
    tagline: string;
    storyTitle: string;
    storyP1: string;
    storyP2: string;
    missionTitle: string;
    missionDesc: string;
    visionTitle: string;
    visionDesc: string;
    roTitle: string;
    roSubtitle: string;
    stages: {
      stage: string;
      title: string;
      desc: string;
    }[];
  };
  products: {
    badge: string;
    title: string;
    subtitle: string;
    viewDetails: string;
    orderNow: string;
    selectSize: string;
    bag1kg: string;
    bag5kg: string;
    bag10kg: string;
    inStock: string;
    tempLabel: string;
    meltLabel: string;
    bestForLabel: string;
    packagingLabel: string;
    quickOrderSuccess: string;
  };
  services: {
    badge: string;
    title: string;
    subtitle: string;
    requestQuoteBtn: string;
    pureTitle: string;
    pureDesc: string;
    pureBadge: string;
    deliveryTitle: string;
    deliveryDesc: string;
    deliveryBadge: string;
    priceTitle: string;
    priceDesc: string;
    priceBadge: string;
  };
  stats: {
    years: string;
    yearsSub: string;
    customers: string;
    customersSub: string;
    support: string;
    supportSub: string;
    quality: string;
    qualitySub: string;
  };
  reviews: {
    badge: string;
    title: string;
    subtitle: string;
    overallRating: string;
    fiveStarStandard: string;
    serviceMetric: string;
    hygieneMetric: string;
    commMetric: string;
    deliveryMetric: string;
    leaveReviewBtn: string;
    verifiedBuyer: string;
    modalTitle: string;
    nameLabel: string;
    roleLabel: string;
    ratingLabel: string;
    productLabel: string;
    commentLabel: string;
    submitBtn: string;
    cancelBtn: string;
  };
  contact: {
    badge: string;
    title: string;
    subtitle: string;
    visitUs: string;
    hubName: string;
    hubDesc: string;
    phoneUs: string;
    callDesc: string;
    hours: string;
    hoursDesc: string;
    formTitle: string;
    formSubtitle: string;
    fullName: string;
    phone: string;
    email: string;
    subject: string;
    message: string;
    sendBtn: string;
    sending: string;
    successMsg: string;
  };
  location: {
    badge: string;
    title: string;
    subtitle: string;
    distHub: string;
    distHubDesc: string;
    hoursTitle: string;
    hoursValue: string;
    hoursDesc: string;
    viewMapBtn: string;
    callBtn: string;
    routeTagTitle: string;
    routeTagDesc: string;
  };
  orderModal: {
    modalTitle: string;
    step1Title: string;
    step2Title: string;
    step1Desc: string;
    step2Desc: string;
    chooseProduct: string;
    chooseSize: string;
    quantity: string;
    pricingSummary: string;
    unitPrice: string;
    subtotal: string;
    deliveryFee: string;
    freeDelivery: string;
    totalAmount: string;
    nextStepBtn: string;
    prevStepBtn: string;
    confirmOrderBtn: string;
    processing: string;
    customerName: string;
    phoneNumber: string;
    deliveryAddress: string;
    deliveryDate: string;
    deliveryTime: string;
    notes: string;
    codNotice: string;
  };
  recentOrders: {
    title: string;
    noOrders: string;
    noOrdersDesc: string;
    orderNow: string;
    clearHistory: string;
    newOrder: string;
    scheduled: string;
    totalCod: string;
  };
  footer: {
    tagline: string;
    visitUsTitle: string;
    visitUsText: string;
    contactUsTitle: string;
    callUsTitle: string;
    rights: string;
    servingNote: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      services: 'SERVICES',
      products: 'PRODUCTS',
      reviews: 'REVIEWS',
      contacts: 'CONTACTS',
      cart: 'Orders',
      orderNow: 'Order Now',
      trackOrders: 'Track Orders',
      language: 'Language',
    },
    hero: {
      badge: 'Science City of Muñoz & San Jose City',
      tagline1: 'Fresh Ice. Fair Price.',
      tagline2: 'Reliable Delivery.',
      subtitle:
        'Food-grade Tube & Cube Ice purified through state-of-the-art 5-Stage Reverse Osmosis. Prompt daily deliveries directly to your doorstep, café, or restaurant.',
      orderNowBtn: 'Order Fresh Ice Now',
      viewProductsBtn: 'Explore Products',
      roPureBadge: '5-Stage RO Pure',
      foodGradeBadge: '100% Food Grade',
      dailyDelivery: 'Express Delivery Route',
    },
    about: {
      badge: 'Our Commitment to Quality',
      title: 'About Us',
      tagline: 'Delivering Crystal Clear Ice Since Day One',
      storyTitle: 'The Yealo Story',
      storyP1:
        'Established in Nueva Ecija, Yealo Ice was founded on a singular commitment: to provide households, restaurants, convenience stores, and beverage bars with absolute ice purity.',
      storyP2:
        'By investing in commercial 5-Stage Reverse Osmosis technology, stainless production pipelines, and direct cold delivery fleets, we eliminate foul odor, minerals, and cloudy sediment.',
      missionTitle: 'Our Mission',
      missionDesc:
        'To produce the cleanest, safest, and slowest-melting edible ice while providing unmatched on-time doorstep delivery across Muñoz and San Jose City.',
      visionTitle: 'Our Vision',
      visionDesc:
        'To be Nueva Ecija’s most trusted commercial ice provider, recognized for unwavering hygiene standards, customer integrity, and reliable service.',
      roTitle: 'The 5-Stage Reverse Osmosis Journey',
      roSubtitle: 'How municipal water is transformed into diamond-pure food-grade ice',
      stages: [
        {
          stage: 'Stage 1',
          title: 'Sediment Pre-Filter',
          desc: 'Traps micro-particles, sand, silt, rust, and suspended solids as small as 5 microns.',
        },
        {
          stage: 'Stage 2',
          title: 'Activated Carbon Block',
          desc: 'Adsorbs chlorine, organic compounds, unpleasant odors, and off-flavors from water.',
        },
        {
          stage: 'Stage 3',
          title: 'Fine Micron Filtration',
          desc: 'Refines water clarity and protects the delicate RO membrane from micro-particulates.',
        },
        {
          stage: 'Stage 4',
          title: 'High-Pressure RO Membrane',
          desc: 'Pressurizes water through 0.0001-micron pores, removing 99.9% of dissolved solids & bacteria.',
        },
        {
          stage: 'Stage 5',
          title: 'Post Carbon Polishing & UV',
          desc: 'Final taste polish delivering crisp, refreshing water ready for freezing into crystal cubes & tubes.',
        },
      ],
    },
    products: {
      badge: 'Product Lineup',
      title: 'Our Products',
      subtitle:
        'Strictly produced from 5-Stage Reverse Osmosis water in heavy-gauge hygienic food-grade bags.',
      viewDetails: 'Full Specs',
      orderNow: 'Order Now',
      selectSize: 'Select Size:',
      bag1kg: '1kg Personal Bag',
      bag5kg: '5kg Standard Bag',
      bag10kg: '10kg Commercial Sack',
      inStock: 'In Stock',
      tempLabel: 'Freezing Temp',
      meltLabel: 'Melt Rate',
      bestForLabel: 'Best For',
      packagingLabel: 'Packaging',
      quickOrderSuccess: 'Quick order created!',
    },
    services: {
      badge: 'Why Customers Love Yealo',
      title: 'Our Core Services',
      subtitle: 'Engineered for cafés, restaurants, milk tea stores, events, and family homes.',
      requestQuoteBtn: 'Request Inquiry / Bulk Quote',
      pureTitle: 'Pure & Safe Ice',
      pureDesc:
        'Every single ice cube and tube is frozen using 5-Stage Reverse Osmosis purified water, strictly meeting food-grade hygiene standards with zero sediment and no aftertaste.',
      pureBadge: '100% Food-Grade RO',
      deliveryTitle: 'Fast Reliable Delivery',
      deliveryDesc:
        'Equipped with specialized refrigerated delivery routes servicing Muñoz and San Jose City. Order online or via call and receive your ice cold, intact, and right on schedule.',
      deliveryBadge: 'Muñoz & San Jose City',
      priceTitle: 'Affordable Wholesale & Retail',
      priceDesc:
        'Competitive and transparent pricing from 1kg retail packs to 10kg commercial sacks, with customized volume discount pricing for regular business partners.',
      priceBadge: 'From ₱15 / Bag',
    },
    stats: {
      years: 'Years of Service',
      yearsSub: 'Established purity standard',
      customers: 'Happy Clients',
      customersSub: 'Cafés, restos & households',
      support: 'Customer Support',
      supportSub: 'Fast dispatch hotline',
      quality: 'Quality Assured',
      qualitySub: 'Food-grade certified RO ice',
    },
    reviews: {
      badge: 'Customer Satisfaction',
      title: 'Client Reviews',
      subtitle: 'Hear from café owners, restaurateurs, caterers, and homeowners across Nueva Ecija.',
      overallRating: '5.0 Out of 5.0',
      fiveStarStandard: 'Verified Customer Experience',
      serviceMetric: 'Service & Prompt Dispatch',
      hygieneMetric: 'Hygiene & Purity Standards',
      commMetric: 'Communication & Reliability',
      deliveryMetric: 'Delivery Speed & Ice Integrity',
      leaveReviewBtn: 'Write a Review',
      verifiedBuyer: 'Verified Partner',
      modalTitle: 'Share Your Yealo Experience',
      nameLabel: 'Your Name or Business Name',
      roleLabel: 'Role / Business Type (e.g. Café Owner)',
      ratingLabel: 'Star Rating',
      productLabel: 'Product Purchased',
      commentLabel: 'Your Review & Feedback',
      submitBtn: 'Submit Review',
      cancelBtn: 'Cancel',
    },
    contact: {
      badge: 'Get in Touch',
      title: 'Contact Us',
      subtitle: 'Need immediate ice delivery, bulk wholesale pricing, or daily café scheduling?',
      visitUs: 'VISIT US',
      hubName: 'San Jose, Philippines, 3121',
      hubDesc: 'San Jose City & Muñoz Delivery Hub, Nueva Ecija',
      phoneUs: 'CALL US',
      callDesc: 'Hotline & Fast Dispatch',
      hours: 'OPERATING HOURS',
      hoursDesc: '6:00 AM – 8:00 PM Daily',
      formTitle: 'Send a Direct Inquiry',
      formSubtitle: 'Fill out the form below and our team will get in touch immediately.',
      fullName: 'Full Name / Business Name',
      phone: 'Mobile Phone Number',
      email: 'Email Address',
      subject: 'Inquiry Subject',
      message: 'Your Message or Delivery Instructions',
      sendBtn: 'Send Message',
      sending: 'Sending...',
      successMsg: 'Message sent successfully! We will contact you shortly.',
    },
    location: {
      badge: 'Coverage & Pickups',
      title: 'Service Hubs',
      subtitle:
        'Yealo serves San Jose City, the Science City of Muñoz, and surrounding areas with prompt daily ice routes and easy direct plant pickups.',
      distHub: 'Distribution Hub',
      distHubDesc: 'San Jose, Philippines, 3121 • Prompt refrigerated delivery directly to your store or home',
      hoursTitle: 'Operating Hours',
      hoursValue: '6:00 AM – 8:00 PM Daily',
      hoursDesc: 'Walk-in pickup & express delivery available all week',
      viewMapBtn: 'View Map',
      callBtn: 'Call Hotline',
      routeTagTitle: 'San Jose & Muñoz Delivery Route',
      routeTagDesc: 'San Jose, Philippines, 3121 Active Dispatch',
    },
    orderModal: {
      modalTitle: 'Order Yealo Ice',
      step1Title: 'Select Ice & Quantity',
      step2Title: 'Delivery & Contact',
      step1Desc: 'Choose between Tube Ice and Cube Ice and package size',
      step2Desc: 'Where should our delivery rider bring your fresh ice?',
      chooseProduct: '1. Select Product',
      chooseSize: '2. Select Bag Size',
      quantity: '3. Quantity (Bags)',
      pricingSummary: 'Pricing Breakdown',
      unitPrice: 'Unit Price',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      freeDelivery: 'FREE (Muñoz & San Jose City)',
      totalAmount: 'Total Amount (COD)',
      nextStepBtn: 'Proceed to Delivery Info',
      prevStepBtn: 'Back to Products',
      confirmOrderBtn: 'Place Order Now',
      processing: 'Confirming Order...',
      customerName: 'Full Name or Business Name *',
      phoneNumber: 'Mobile Phone (for rider updates) *',
      deliveryAddress: 'Complete Delivery Address & Landmark *',
      deliveryDate: 'Delivery Date *',
      deliveryTime: 'Preferred Time Window *',
      notes: 'Special Instructions for the Rider',
      codNotice: 'Payment is Cash on Delivery (COD) or GCash upon rider arrival.',
    },
    recentOrders: {
      title: 'Your Yealo Orders',
      noOrders: 'No orders placed yet',
      noOrdersDesc: 'Place an order for Tube Ice or Cube Ice to track dispatch details here.',
      orderNow: 'Order Now',
      clearHistory: 'Clear History',
      newOrder: '+ New Order',
      scheduled: 'Scheduled for',
      totalCod: 'Total (COD)',
    },
    footer: {
      tagline:
        'Pure, clean, and slow-melting 5-Stage Reverse Osmosis ice for homes, restaurants, cafés, and convenience stores.',
      visitUsTitle: 'VISIT US',
      visitUsText: 'San Jose, Philippines, 3121',
      contactUsTitle: 'CONTACT US',
      callUsTitle: 'CALL US',
      rights: 'All rights reserved. Pure Food-Grade Ice.',
      servingNote: 'Serving San Jose City (3121) and Science City of Muñoz, Nueva Ecija.',
    },
  },
  tl: {
    nav: {
      services: 'SERVICES',
      products: 'PRODUCTS',
      reviews: 'REVIEWS',
      contacts: 'CONTACT',
      cart: 'Orders',
      orderNow: 'Order Na',
      trackOrders: 'Track Orders',
      language: 'Language',
    },
    hero: {
      badge: 'Science City of Muñoz & San Jose City',
      tagline1: 'Fresh Ice. Presyong Tapat.',
      tagline2: 'Reliable Delivery.',
      subtitle:
        'Food-grade Tube & Cube Ice na dumaan sa 5-Stage Reverse Osmosis. Mabilis ang daily delivery diretso sa inyong bahay, café, o restaurant.',
      orderNowBtn: 'Order na ng Fresh Ice',
      viewProductsBtn: 'Tingnan ang Products',
      roPureBadge: '5-Stage RO Pure',
      foodGradeBadge: '100% Food-Grade Safe',
      dailyDelivery: 'Daily Delivery Route',
    },
    about: {
      badge: 'Quality Promise',
      title: 'About Us',
      tagline: 'Nagde-deliver ng Crystal-Clear & Pure Ice mula Day 1',
      storyTitle: 'Kuwento ng Yealo',
      storyP1:
        'Nagsimula ang Yealo Ice sa Nueva Ecija na may simpleng goal: magbigay sa mga bahay, restaurants, milk tea shops, at sari-sari stores ng yelo na talagang malinis, crystal-clear, at safe inumin.',
      storyP2:
        'Sa tulong ng commercial 5-Stage Reverse Osmosis system, stainless food-grade pipes, at malinis na delivery, siguradong walang amoy, walang lumalabong latak, at mabagal matunaw.',
      missionTitle: 'Aming Mission',
      missionDesc:
        'Gumawa ng pinakamalinis, pinaka-safe, at slow-melting ice habang nagbibigay ng maaasahan at on-time delivery sa buong Muñoz at San Jose City.',
      visionTitle: 'Aming Vision',
      visionDesc:
        'Maging top-of-mind ice brand sa Nueva Ecija, kilala sa supreme cleanliness, tapat na presyo, at maaasahang serbisyo.',
      roTitle: 'Ang 5-Stage Reverse Osmosis Process',
      roSubtitle: 'Paano nagiging kasing-linaw ng crystal at 100% safe ang yelo ng Yealo',
      stages: [
        {
          stage: 'Stage 1',
          title: 'Sediment Pre-Filter',
          desc: 'Sinasala ang mga micro-particles, buhangin, kalawang, at dumi hanggang 5 microns.',
        },
        {
          stage: 'Stage 2',
          title: 'Activated Carbon Block',
          desc: 'Tinatanggal ang chlorine, organic compounds, at anumang bad odor o lasa sa tubig.',
        },
        {
          stage: 'Stage 3',
          title: 'Fine Micron Filtration',
          desc: 'Pinapakinis at pinapalinaw ang tubig para maingatan ang RO membrane mula sa pinong dumi.',
        },
        {
          stage: 'Stage 4',
          title: 'High-Pressure RO Membrane',
          desc: 'Pinadadaan sa 0.0001-micron pores para tanggalin ang 99.9% ng dissolved impurities at bacteria.',
        },
        {
          stage: 'Stage 5',
          title: 'Post Carbon Polish & UV',
          desc: 'Final polish para presko, malutong, at crystal-clear ang bawat tube at cube ice.',
        },
      ],
    },
    products: {
      badge: 'Product Catalog',
      title: 'Aming Products',
      subtitle:
        'Made with 5-Stage Reverse Osmosis purified water sa matitibay at hygienic food-grade bags.',
      viewDetails: 'View Details',
      orderNow: 'Order Na',
      selectSize: 'Piliin ang Bag Size:',
      bag1kg: '1kg Personal Bag',
      bag5kg: '5kg Standard Bag',
      bag10kg: '10kg Commercial Sack',
      inStock: 'In Stock / Available',
      tempLabel: 'Temperature',
      meltLabel: 'Melt Rate',
      bestForLabel: 'Best Para Sa',
      packagingLabel: 'Packaging',
      quickOrderSuccess: 'Na-add na sa order!',
    },
    services: {
      badge: 'Bakit Love ng Customers ang Yealo',
      title: 'Core Services',
      subtitle: 'Perfect para sa mga cafés, restaurants, milk tea shops, handaan, at everyday home use.',
      requestQuoteBtn: 'Hingi ng Bulk Quote / Pricing',
      pureTitle: 'Pure & Food-Grade Ice',
      pureDesc:
        'Bawat cube at tube ice ay gawa sa 5-Stage Reverse Osmosis water. Safe inumin, walang cloudiness, at walang kakaibang aftertaste.',
      pureBadge: '100% Food-Grade RO',
      deliveryTitle: 'Mabilis & On-Time Delivery',
      deliveryDesc:
        'May dedicated refrigerated delivery routes sa Muñoz at San Jose City. Mag-order online o tumawag, darating ang yelo nang buo at malamig.',
      deliveryBadge: 'Muñoz & San Jose City',
      priceTitle: 'Affordable Prices (Retail & Bulk)',
      priceDesc:
        'Tapat at sulit ang presyo mula 1kg bag hanggang 10kg commercial sacks, may special discount para sa mga business partner.',
      priceBadge: 'Starts at ₱15 / Bag',
    },
    stats: {
      years: 'Years of Service',
      yearsSub: 'Subok na sa kalinisan at tiwala',
      customers: 'Happy Customers',
      customersSub: 'Cafés, kainan, at households',
      support: 'Customer Support',
      supportSub: 'Mabilis na dispatch hotline',
      quality: 'Quality Guaranteed',
      qualitySub: 'Certified food-grade RO ice',
    },
    reviews: {
      badge: 'Customer Feedback',
      title: 'Reviews ng mga Suki',
      subtitle: 'Basahin ang feedback ng café owners, kainan, caterers, at suki sa Nueva Ecija.',
      overallRating: '5.0 out of 5.0 Rating',
      fiveStarStandard: 'Verified Suki Feedback',
      serviceMetric: 'Mabilis at Maagang Dispatch',
      hygieneMetric: 'Kalinisan at Ice Purity',
      commMetric: 'Customer Care at Updates',
      deliveryMetric: 'Bilis ng Pagdating (Hindi Tunaw)',
      leaveReviewBtn: 'Mag-iwan ng Review',
      verifiedBuyer: 'Verified Suki',
      modalTitle: 'I-share ang Inyong Yealo Experience',
      nameLabel: 'Name o Business Name',
      roleLabel: 'Type ng Business / Role (hal. Café Owner, Muñoz)',
      ratingLabel: 'Rating (Stars)',
      productLabel: 'Nabiling Product',
      commentLabel: 'Inyong Review at Komento',
      submitBtn: 'Submit Review',
      cancelBtn: 'Cancel',
    },
    contact: {
      badge: 'Makipag-ugnayan',
      title: 'Contact Us',
      subtitle: 'Need mo ba ng bulk order, regular café supply, o rush ice delivery?',
      visitUs: 'BISITAHIN KAMI',
      hubName: 'San Jose, Philippines, 3121',
      hubDesc: 'San Jose City & Muñoz Delivery Hub, Nueva Ecija',
      phoneUs: 'TAWAGAN KAMI',
      callDesc: 'Hotline & Direct Dispatch',
      hours: 'OPERATING HOURS',
      hoursDesc: '6:00 AM – 8:00 PM Araw-araw',
      formTitle: 'Send Us a Message',
      formSubtitle: 'Fill out ang form sa ibaba at magre-reply agad ang aming dispatch team.',
      fullName: 'Full Name o Business Name',
      phone: 'Cellphone Number',
      email: 'Email Address',
      subject: 'Subject ng Mensahe',
      message: 'Message o Delivery Instructions',
      sendBtn: 'Send Message',
      sending: 'Nagse-send...',
      successMsg: 'Na-send na ang message! Makikipag-ugnayan agad kami sa inyo.',
    },
    location: {
      badge: 'Coverage & Pickups',
      title: 'Service Hubs',
      subtitle:
        'Naglilingkod ang Yealo sa San Jose City, Science City of Muñoz, at mga karatig-bayan via prompt daily delivery routes at direct plant pickups.',
      distHub: 'Distribution Hub',
      distHubDesc: 'San Jose, Philippines, 3121 • Mabilis na refrigerated delivery diretso sa inyong tindahan o bahay',
      hoursTitle: 'Operating Hours',
      hoursValue: '6:00 AM – 8:00 PM Daily',
      hoursDesc: 'Open for walk-in pickup at express delivery buong linggo',
      viewMapBtn: 'Buksan ang Mapa',
      callBtn: 'Tawagan ang Hotline',
      routeTagTitle: 'San Jose & Muñoz Delivery Route',
      routeTagDesc: 'San Jose, Philippines, 3121 Active Dispatch',
    },
    orderModal: {
      modalTitle: 'Order Yealo Ice',
      step1Title: 'Piliin ang Ice & Quantity',
      step2Title: 'Delivery & Contact Details',
      step1Desc: 'Pumili sa Tube Ice at Cube Ice at tamang bag size',
      step2Desc: 'Saan ihahatid ng rider ang inyong fresh ice?',
      chooseProduct: '1. Pumili ng Product',
      chooseSize: '2. Pumili ng Bag Size',
      quantity: '3. Dami (Bags)',
      pricingSummary: 'Price Breakdown',
      unitPrice: 'Presyo Bawat Bag',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      freeDelivery: 'FREE (San Jose & Muñoz kapag ₱300+)',
      totalAmount: 'Total Babayaran (COD)',
      nextStepBtn: 'Proceed sa Delivery Info',
      prevStepBtn: 'Back sa Products',
      confirmOrderBtn: 'Confirm Order Na',
      processing: 'Pinoproseso ang Order...',
      customerName: 'Full Name o Business Name *',
      phoneNumber: 'Cellphone Number (para sa rider) *',
      deliveryAddress: 'Delivery Address & Landmark *',
      deliveryDate: 'Delivery Date *',
      deliveryTime: 'Preferred Delivery Time *',
      notes: 'Special Instructions para kay Rider',
      codNotice: 'Cash on Delivery (COD) o GCash pagdating ni Kuya Rider.',
    },
    recentOrders: {
      title: 'Inyong Yealo Orders',
      noOrders: 'Wala pang orders',
      noOrdersDesc: 'Mag-order ng Tube Ice o Cube Ice para makita ang live dispatch details dito.',
      orderNow: 'Order Na',
      clearHistory: 'Clear History',
      newOrder: '+ Bagong Order',
      scheduled: 'Naka-schedule sa',
      totalCod: 'Total (COD)',
    },
    footer: {
      tagline:
        'Pure, crystal-clear, at slow-melting 5-Stage Reverse Osmosis ice para sa mga bahay, restaurants, cafés, at sari-sari stores.',
      visitUsTitle: 'BISITAHIN KAMI',
      visitUsText: 'San Jose, Philippines, 3121',
      contactUsTitle: 'CONTACT US',
      callUsTitle: 'TAWAGAN KAMI',
      rights: 'All rights reserved. Pure Food-Grade Ice.',
      servingNote: 'Proudly serving San Jose City (3121) and Science City of Muñoz, Nueva Ecija.',
    },
  },
};
