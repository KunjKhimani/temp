// // Image imports - Assuming these paths are correct relative to this file's location
// // Create placeholder imports for new images if you don't have them yet.
import CleaningImage from "../assets/images/category/cleaning.jpg";
import PaintingImage from "../assets/images/category/painting.jpg";
import RiderImage from "../assets/images/category/driving.jpg";
import HelperImage from "../assets/images/category/helper.jpg"; // Used for Companion Care
import ProductsImage from "../assets/images/category/products.jpg";
import ITImage from "../assets/images/category/it.jpg"; // Generic IT, can be used for multiple tech/creative
import BusinessImage from "../assets/images/category/business.jpg";

// // Conceptual new image imports (replace with actual paths when available)
// import MovingImage from "../assets/images/category/moving.jpg"; // Placeholder
// import DigitalMarketingImage from "../assets/images/category/digitalmarketing.jpg"; // Placeholder
// import ProgrammingTechImage from "../assets/images/category/programmingtech.jpg"; // Placeholder
// import AIServicesImage from "../assets/images/category/aiservices.jpg"; // Placeholder
// import PersonalDevelopmentImage from "../assets/images/category/personaldevelopment.jpg"; // Placeholder
// import InstallationMountingImage from "../assets/images/category/installationmounting.jpg"; // Placeholder
// import WritingTranslationImage from "../assets/images/category/writingtranslation.jpg"; // Placeholder
// import VideoAnimationImage from "../assets/images/category/videoanimation.jpg"; // Placeholder
// import MusicAudioImage from "../assets/images/category/musicaudio.jpg"; // Placeholder
// import FinanceImage from "../assets/images/category/finance.jpg"; // Placeholder
// import PhotographyImage from "../assets/images/category/photography.jpg"; // Placeholder
// import OtherImage from "../assets/images/category/other.jpg"; // Placeholder
// import HandymanImage from "../assets/images/category/handyman.jpg"; // Placeholder
// import ConsultingImage from "../assets/images/category/consulting.jpg"; // Placeholder
// import FurnitureAssemblyImage from "../assets/images/category/furnitureassembly.jpg"; // Placeholder

export const categoryExplanations = [
  {
    name: "Companion Care",
    description:
      "Dedicated and compassionate care services to support daily living, wellness, and companionship for your loved ones.",
    image: HelperImage,
    link: "/category/Companion%20Care",
  },
  {
    name: "Ride Services",
    description:
      "Reliable and diverse transportation options, from medical transport and assisted rides to shuttle and executive car services.",
    image: RiderImage,
    link: "/category/Ride%20Services",
  },
  {
    name: "Products",
    description:
      "Discover a curated selection of quality products, including clothing, electronics, detergents, and more to meet your needs.",
    image: ProductsImage,
    link: "/category/Products",
  },
  {
    name: "Cleaning",
    description:
      "Professional cleaning for homes and businesses. Deep cleaning, janitorial services, window washing, and specialty cleanup.",
    image: CleaningImage,
    link: "/category/Cleaning",
  },
  {
    name: "Painting",
    description:
      "Transform your spaces with expert painting. Interior, exterior, commercial, and residential painting, plus wallpaper and cabinet services.",
    image: PaintingImage,
    link: "/category/Painting",
  },
  {
    name: "Graphics & Design",
    description:
      "Creative design solutions from logos and branding to web design, illustrations, 3D modeling, and AI-generated art.",
    image: ITImage, // Using generic IT image, consider a specific design image
    link: "/category/Graphics%20&%20Design",
  },
  {
    name: "Moving Services",
    description:
      "Stress-free moving solutions including assistance, furniture relocation, packing, junk hauling, and specialized transport.",
    //image: MovingImage,
    link: "/category/Moving%20Services",
  },
  {
    name: "Digital Marketing",
    description:
      "Boost your online presence with SEO, SEM, social media campaigns, content marketing, and e-commerce strategies.",
    image: ITImage,
    link: "/category/Digital%20Marketing",
  },
  {
    name: "Installation & Mounting",
    description:
      "Professional installation and mounting services for security cameras, TVs, smart home devices, shelving, and more.",
    //image: InstallationMountingImage,
    link: "/category/Installation%&%20Mounting",
  },
  {
    name: "Writing & Translation",
    description:
      "Expert writing and translation services for articles, blogs, resumes, creative content, technical documents, and more.",
    //image: WritingTranslationImage,
    link: "/category/Writing%20&%20Translation",
  },
  {
    name: "Video & Animation",
    description:
      "Engaging video and animation services including explainers, editing, short ads, animated GIFs, logo animation, and 3D animation.",
    image: ITImage,
    link: "/category/Video%20&%20Animation",
  },
  {
    name: "Programming & Tech",
    description:
      "Expert development services for websites, mobile apps, e-commerce platforms, games, and IT support.",
    image: ITImage,
    link: "/category/Programming%20&%20Tech",
  },
  {
    name: "Music & Audio",
    description:
      "Professional music and audio services including voice overs, mixing, mastering, podcast editing, sound design, and audiobook production.",
    //image: MusicAudioImage,
    link: "/category/Music%20&%20Audio",
  },
  {
    name: "Business",
    description:
      "Comprehensive support for your venture: business strategy, HR, financial advisory, accounting, and legal guidance.",
    image: BusinessImage,
    link: "/category/Business",
  },
  {
    name: "Furniture/Equipment Assembly",
    description:
      "Efficient assembly services for all types of furniture and equipment, including beds, desks, cabinets, exercise gear, and appliances.",
    //image: FurnitureAssemblyImage,
    link: "/category/Furniture%20or%20Equipment%20Assembly",
  },
  {
    name: "AI Services",
    description:
      "Leverage artificial intelligence with custom AI app development, model refinement, data science, AI art, and strategic advisory.",
    image: ITImage,
    link: "/category/AI%20Services",
  },
  {
    name: "Finance",
    description:
      "Expert financial services including investments, reporting, bookkeeping, payroll, accounting, tax services, and financial planning.",
    //image: FinanceImage,
    link: "/category/Finance",
  },
  {
    name: "Photography",
    description:
      "Professional photography services for products, fashion, real estate, events, and image editing and restoration.",
    //image: PhotographyImage,
    link: "/category/Photography",
  },
  {
    name: "Other",
    description: "A variety of other services to meet your unique needs.",
    //image: OtherImage,
    link: "/category/Other",
  },
  {
    name: "Handyman",
    description:
      "Skilled handyman services for repairs, assembly, installation, mounting, and general home maintenance tasks.",
    //image: HandymanImage,
    link: "/category/Handyman",
  },
  {
    name: "Personal Development & Growth",
    description:
      "Unlock your potential with tutoring, language instruction, life coaching, career advising, fitness training, and wellness programs.",
    //image: PersonalDevelopmentImage,
    link: "/category/Personal%20Development%20&%20Growth",
  },
  {
    name: "Consulting",
    description:
      "Expert consulting services across various domains including business, IT, marketing, data, coaching, and mentorship.",
    //image: ConsultingImage,
    link: "/category/Consulting",
  },
];
