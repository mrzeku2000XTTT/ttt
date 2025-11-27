import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Comprehensive global job list (500+ occupations)
const WORLD_JOBS = [
  // Technology & IT
  "Software Engineer", "Web Developer", "Mobile App Developer", "Data Scientist", "AI/ML Engineer", "DevOps Engineer", "Cloud Architect", "Database Administrator", "Network Engineer", "Cybersecurity Analyst", "IT Support Specialist", "Systems Administrator", "QA Engineer", "Game Developer", "UI/UX Designer", "Product Manager", "Scrum Master", "Technical Writer", "Blockchain Developer", "Full Stack Developer", "Frontend Developer", "Backend Developer", "Solutions Architect", "Site Reliability Engineer", "Platform Engineer", "Security Engineer", "Penetration Tester", "Data Engineer", "Business Intelligence Analyst", "IT Consultant",
  
  // Healthcare & Medical
  "Doctor", "Nurse", "Surgeon", "Dentist", "Pharmacist", "Physical Therapist", "Occupational Therapist", "Medical Assistant", "Radiologist", "Anesthesiologist", "Pediatrician", "Cardiologist", "Dermatologist", "Psychiatrist", "Psychologist", "Paramedic", "Emergency Medical Technician", "Medical Laboratory Technician", "Radiologic Technologist", "Respiratory Therapist", "Speech Therapist", "Dietitian", "Nutritionist", "Optometrist", "Ophthalmologist", "Veterinarian", "Veterinary Technician", "Chiropractor", "Acupuncturist", "Midwife", "Home Health Aide", "Nursing Assistant", "Phlebotomist", "Medical Coder", "Health Information Technician",
  
  // Education & Training
  "Teacher", "Professor", "Principal", "School Counselor", "Special Education Teacher", "ESL Teacher", "Teaching Assistant", "Tutor", "Education Administrator", "Curriculum Developer", "Instructional Designer", "Academic Advisor", "Librarian", "Library Assistant", "Early Childhood Educator", "Preschool Teacher", "Substitute Teacher", "Online Instructor", "Corporate Trainer", "Driving Instructor", "Music Teacher", "Art Teacher", "Physical Education Teacher", "Career Counselor", "Education Consultant",
  
  // Business & Finance
  "Accountant", "Financial Analyst", "Investment Banker", "Stock Broker", "Financial Advisor", "Tax Consultant", "Auditor", "Bookkeeper", "Payroll Specialist", "Budget Analyst", "Credit Analyst", "Loan Officer", "Insurance Agent", "Insurance Underwriter", "Actuary", "Economist", "Market Research Analyst", "Business Analyst", "Management Consultant", "Business Development Manager", "Sales Manager", "Account Manager", "Customer Success Manager", "Operations Manager", "Supply Chain Manager", "Procurement Specialist", "Project Manager", "Real Estate Agent", "Real Estate Appraiser", "Property Manager", "Stockbroker", "Cryptocurrency Trader", "Investment Analyst", "Risk Analyst", "Compliance Officer",
  
  // Engineering & Architecture
  "Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "Chemical Engineer", "Aerospace Engineer", "Biomedical Engineer", "Environmental Engineer", "Industrial Engineer", "Structural Engineer", "Petroleum Engineer", "Mining Engineer", "Nuclear Engineer", "Marine Engineer", "Automotive Engineer", "Robotics Engineer", "Manufacturing Engineer", "Quality Engineer", "Safety Engineer", "Architect", "Landscape Architect", "Urban Planner", "Interior Designer", "CAD Technician", "Surveyor", "Construction Manager", "Project Engineer",
  
  // Creative & Media
  "Graphic Designer", "Art Director", "Copywriter", "Content Writer", "Technical Writer", "Editor", "Journalist", "Reporter", "News Anchor", "Photographer", "Videographer", "Film Director", "Video Editor", "Sound Engineer", "Music Producer", "Musician", "Singer", "Actor", "Voice Actor", "Animator", "3D Modeler", "Illustrator", "Fashion Designer", "Textile Designer", "Product Designer", "Industrial Designer", "Web Designer", "Motion Graphics Designer", "Creative Director", "Brand Manager", "Social Media Manager", "Content Creator", "Influencer", "Podcaster", "Radio Host", "Screenwriter", "Author", "Blogger", "YouTuber", "Twitch Streamer",
  
  // Sales & Marketing
  "Sales Representative", "Sales Executive", "Account Executive", "Business Development Representative", "Inside Sales Representative", "Outside Sales Representative", "Retail Sales Associate", "Sales Manager", "Regional Sales Manager", "Marketing Manager", "Digital Marketing Specialist", "SEO Specialist", "SEM Specialist", "Email Marketing Specialist", "Marketing Coordinator", "Brand Strategist", "Public Relations Specialist", "Communications Manager", "Advertising Manager", "Media Planner", "Market Researcher", "Customer Service Representative", "Call Center Agent", "Customer Support Specialist", "Technical Support Specialist",
  
  // Hospitality & Tourism
  "Hotel Manager", "Hotel Receptionist", "Concierge", "Restaurant Manager", "Chef", "Sous Chef", "Cook", "Line Cook", "Pastry Chef", "Baker", "Bartender", "Barista", "Waiter", "Waitress", "Server", "Host", "Hostess", "Food Service Worker", "Catering Manager", "Event Planner", "Wedding Planner", "Travel Agent", "Tour Guide", "Flight Attendant", "Pilot", "Co-Pilot", "Air Traffic Controller", "Hotel Housekeeper", "Sommelier", "Food Critic",
  
  // Manufacturing & Production
  "Factory Worker", "Assembly Line Worker", "Production Manager", "Quality Control Inspector", "Machine Operator", "CNC Operator", "Forklift Operator", "Warehouse Worker", "Inventory Specialist", "Shipping Clerk", "Receiving Clerk", "Production Planner", "Manufacturing Technician", "Maintenance Technician", "Industrial Mechanic", "Electrician", "Welder", "Machinist", "Tool and Die Maker", "Millwright",
  
  // Transportation & Logistics
  "Truck Driver", "Delivery Driver", "Bus Driver", "Taxi Driver", "Uber Driver", "Lyft Driver", "Train Conductor", "Train Engineer", "Ship Captain", "Sailor", "Merchant Marine", "Logistics Coordinator", "Supply Chain Analyst", "Transportation Manager", "Dispatcher", "Freight Broker", "Cargo Handler", "Aircraft Mechanic", "Automotive Mechanic", "Diesel Mechanic", "Motorcycle Mechanic", "Bicycle Mechanic",
  
  // Construction & Trades
  "Construction Worker", "Carpenter", "Plumber", "Electrician", "HVAC Technician", "Roofer", "Mason", "Bricklayer", "Concrete Worker", "Drywall Installer", "Painter", "Flooring Installer", "Tile Setter", "Glazier", "Ironworker", "Pipefitter", "Sheet Metal Worker", "Insulation Worker", "Heavy Equipment Operator", "Crane Operator", "Excavator Operator", "Demolition Worker", "Construction Foreman", "General Contractor", "Home Inspector", "Landscape Contractor",
  
  // Retail & Customer Service
  "Retail Manager", "Store Manager", "Assistant Manager", "Cashier", "Retail Sales Associate", "Stock Clerk", "Merchandiser", "Visual Merchandiser", "Loss Prevention Specialist", "Customer Service Manager", "Customer Service Representative", "Receptionist", "Administrative Assistant", "Office Manager", "Executive Assistant", "Secretary", "Data Entry Clerk", "File Clerk",
  
  // Legal & Government
  "Lawyer", "Attorney", "Paralegal", "Legal Assistant", "Judge", "Magistrate", "Court Reporter", "Bailiff", "Legal Secretary", "Patent Attorney", "Corporate Lawyer", "Criminal Defense Lawyer", "Prosecutor", "Public Defender", "Immigration Lawyer", "Family Lawyer", "Tax Lawyer", "Politician", "Government Official", "City Planner", "Policy Analyst", "Diplomat", "Ambassador", "Foreign Service Officer", "Intelligence Analyst", "FBI Agent", "CIA Agent", "Police Officer", "Detective", "Sheriff", "State Trooper", "Border Patrol Agent", "Customs Officer", "Immigration Officer", "Correctional Officer", "Probation Officer", "Parole Officer", "Firefighter", "Fire Chief", "Fire Inspector",
  
  // Science & Research
  "Scientist", "Research Scientist", "Chemist", "Physicist", "Biologist", "Microbiologist", "Biochemist", "Molecular Biologist", "Geneticist", "Botanist", "Zoologist", "Marine Biologist", "Environmental Scientist", "Geologist", "Meteorologist", "Astronomer", "Astrophysicist", "Materials Scientist", "Food Scientist", "Forensic Scientist", "Lab Technician", "Research Assistant", "Clinical Research Coordinator",
  
  // Agriculture & Environment
  "Farmer", "Agricultural Engineer", "Agricultural Inspector", "Farm Manager", "Ranch Hand", "Livestock Farmer", "Dairy Farmer", "Crop Farmer", "Horticulturist", "Forester", "Park Ranger", "Wildlife Biologist", "Conservation Scientist", "Environmental Consultant", "Sustainability Coordinator", "Recycling Coordinator", "Waste Management Specialist", "Fisherman", "Aquaculture Farmer", "Beekeeper", "Agricultural Technician", "Soil Scientist", "Animal Breeder", "Veterinary Assistant",
  
  // Arts & Entertainment
  "Artist", "Painter", "Sculptor", "Potter", "Printmaker", "Art Instructor", "Art Gallery Curator", "Museum Curator", "Archivist", "Comedian", "Magician", "Dancer", "Choreographer", "Theater Director", "Stage Manager", "Costume Designer", "Set Designer", "Makeup Artist", "Hair Stylist", "Fashion Stylist", "Model", "Fashion Model", "Fitness Model", "Hand Model", "Stunt Performer", "Circus Performer", "Street Performer", "DJ", "Music Composer", "Orchestra Conductor", "Piano Tuner",
  
  // Sports & Fitness
  "Professional Athlete", "Sports Coach", "Personal Trainer", "Fitness Instructor", "Yoga Instructor", "Pilates Instructor", "Zumba Instructor", "Martial Arts Instructor", "Boxing Coach", "Swimming Coach", "Tennis Coach", "Golf Instructor", "Athletic Trainer", "Sports Physical Therapist", "Sports Nutritionist", "Sports Psychologist", "Sports Agent", "Sports Journalist", "Sports Commentator", "Referee", "Umpire", "Gym Manager", "Fitness Club Owner",
  
  // Social Services & Community
  "Social Worker", "Case Manager", "Community Organizer", "Nonprofit Manager", "Fundraiser", "Grant Writer", "Volunteer Coordinator", "Youth Worker", "Child Welfare Worker", "School Social Worker", "Mental Health Counselor", "Substance Abuse Counselor", "Marriage and Family Therapist", "Career Counselor", "Rehabilitation Counselor", "Geriatric Care Manager", "Victim Advocate", "Homeless Outreach Worker", "Disaster Relief Coordinator",
  
  // Skilled Trades & Services
  "Auto Body Technician", "Auto Detailer", "Car Salesperson", "Locksmith", "Gunsmith", "Watch Repairer", "Jeweler", "Tailor", "Seamstress", "Dry Cleaner", "Shoe Repairer", "Upholsterer", "Furniture Maker", "Cabinetmaker", "Blacksmith", "Glass Blower", "Tattoo Artist", "Piercing Artist", "Barber", "Hairdresser", "Beautician", "Esthetician", "Nail Technician", "Massage Therapist", "Spa Manager", "Pet Groomer", "Dog Trainer", "Animal Control Officer",
  
  // Food & Beverage
  "Food Scientist", "Food Safety Inspector", "Restaurant Owner", "Fast Food Worker", "Dishwasher", "Prep Cook", "Butcher", "Fishmonger", "Cheese Maker", "Chocolatier", "Ice Cream Maker", "Brewer", "Winemaker", "Distiller", "Coffee Roaster", "Tea Specialist", "Food Truck Operator", "Catering Chef", "Private Chef", "Personal Chef", "Nutritional Consultant", "Menu Planner",
  
  // Security & Safety
  "Security Guard", "Bodyguard", "Private Investigator", "Security Consultant", "Loss Prevention Officer", "Campus Security Officer", "Security Systems Installer", "CCTV Operator", "Armed Security Officer", "Event Security", "Mall Security", "Airport Security", "Bouncer", "Security Analyst",
  
  // Cleaning & Maintenance
  "Janitor", "Custodian", "Cleaner", "Housekeeper", "Maid", "Window Cleaner", "Carpet Cleaner", "Building Superintendent", "Facilities Manager", "Groundskeeper", "Gardener", "Landscaper", "Tree Trimmer", "Pest Control Worker", "Exterminator", "Pool Cleaner", "Chimney Sweep",
  
  // Energy & Utilities
  "Power Plant Operator", "Electrical Power Line Installer", "Utility Worker", "Gas Plant Operator", "Water Treatment Plant Operator", "Wastewater Treatment Operator", "Solar Panel Installer", "Wind Turbine Technician", "Energy Auditor", "Meter Reader", "Lineman", "Substation Technician",
  
  // Communication & Media
  "Telecommunications Specialist", "Broadcast Technician", "Audio Technician", "Camera Operator", "Lighting Technician", "Production Assistant", "Script Supervisor", "Post-Production Supervisor", "Colorist", "VFX Artist", "Media Buyer", "Media Planner", "Traffic Manager",
  
  // Personal Services
  "Life Coach", "Personal Shopper", "Image Consultant", "Wedding Coordinator", "Party Planner", "Personal Assistant", "Virtual Assistant", "Concierge", "Butler", "Housekeeper", "Nanny", "Babysitter", "Elder Care Provider", "Companion", "Dog Walker", "Pet Sitter", "House Sitter",
  
  // Retail Specialized
  "Florist", "Antique Dealer", "Art Dealer", "Auctioneer", "Pawnbroker", "Coin Dealer", "Stamp Dealer", "Book Dealer", "Music Store Manager", "Sporting Goods Salesperson", "Electronics Salesperson", "Furniture Salesperson", "Car Salesperson", "Real Estate Salesperson", "Insurance Salesperson", "Pharmaceutical Sales Representative", "Medical Equipment Sales", "Telemarketer",
  
  // Manufacturing Specialized
  "Textile Worker", "Garment Worker", "Leather Worker", "Shoe Maker", "Glassmaker", "Ceramicist", "Potter", "Mold Maker", "Pattern Maker", "Foundry Worker", "Metal Fabricator", "Plastic Fabricator", "Paper Mill Worker", "Printing Press Operator", "Bookbinder", "Engraver", "Etcher",
  
  // Maritime & Fishing
  "Commercial Fisherman", "Fish Processor", "Oyster Farmer", "Crab Fisherman", "Lobster Fisherman", "Tuna Fisherman", "Shrimp Farmer", "Harbor Master", "Dock Worker", "Longshoreman", "Stevedore", "Ship Engineer", "Naval Architect", "Boat Builder", "Marina Manager", "Lighthouse Keeper", "Coast Guard", "Marine Surveyor",
  
  // Aviation
  "Commercial Pilot", "Private Pilot", "Helicopter Pilot", "Drone Pilot", "Flight Engineer", "Flight Instructor", "Aircraft Inspector", "Aviation Mechanic", "Avionics Technician", "Airport Manager", "Ramp Agent", "Baggage Handler", "Ticket Agent", "Gate Agent", "Sky Marshal",
  
  // Automotive
  "Auto Mechanic", "Diesel Mechanic", "Transmission Specialist", "Brake Specialist", "Muffler Installer", "Tire Technician", "Alignment Technician", "Car Inspector", "Automotive Engineer", "Race Car Driver", "Race Car Mechanic", "Car Designer", "Automotive Test Driver",
  
  // Advertising & PR
  "Advertising Executive", "Copywriter", "Art Director", "Creative Director", "Media Buyer", "Account Planner", "Brand Manager", "PR Manager", "Communications Director", "Spokesperson", "Press Secretary", "Event Coordinator",
  
  // Non-Profit & Charity
  "Nonprofit Director", "Program Coordinator", "Outreach Coordinator", "Development Director", "Major Gifts Officer", "Planned Giving Officer", "Volunteer Manager", "Grant Administrator", "Impact Evaluator", "Community Liaison",
  
  // Religious & Spiritual
  "Priest", "Pastor", "Minister", "Rabbi", "Imam", "Monk", "Nun", "Youth Pastor", "Chaplain", "Religious Educator", "Missionary", "Theologian", "Pastoral Counselor",
  
  // Military & Defense
  "Soldier", "Army Officer", "Navy Officer", "Air Force Officer", "Marine", "Military Analyst", "Military Engineer", "Combat Medic", "Military Police", "Drill Sergeant", "Military Recruiter", "Veteran Affairs Counselor", "Defense Contractor",
  
  // Mining & Extraction
  "Miner", "Underground Miner", "Surface Miner", "Coal Miner", "Gold Miner", "Diamond Miner", "Oil Rig Worker", "Drilling Engineer", "Petroleum Technician", "Mining Engineer", "Quarry Worker", "Blaster", "Excavation Worker",
  
  // Textiles & Fashion
  "Fashion Buyer", "Fashion Merchandiser", "Fashion Consultant", "Pattern Maker", "Sewing Machine Operator", "Textile Designer", "Fabric Cutter", "Quality Control Inspector (Textiles)", "Fashion Photographer", "Runway Model", "Fashion Blogger",
  
  // Food Production
  "Food Production Worker", "Meat Packer", "Fruit Picker", "Harvest Worker", "Cannery Worker", "Food Processing Worker", "Slaughterhouse Worker", "Grain Inspector", "Food Chemist", "Flavor Developer", "Recipe Developer", "Test Kitchen Cook",
  
  // Hospitality Services
  "Valet Parking Attendant", "Bellhop", "Porter", "Room Service Attendant", "Laundry Attendant", "Spa Attendant", "Pool Attendant", "Beach Attendant", "Cloakroom Attendant", "Casino Dealer", "Casino Manager", "Gaming Supervisor", "Slot Technician",
  
  // Entertainment & Recreation
  "Amusement Park Attendant", "Ride Operator", "Lifeguard", "Ski Instructor", "Snowboard Instructor", "Surf Instructor", "Scuba Diving Instructor", "Rock Climbing Instructor", "Camp Counselor", "Recreation Director", "Activities Coordinator", "Cruise Ship Entertainer", "Theme Park Character",
  
  // Postal & Delivery
  "Postal Worker", "Mail Carrier", "Postal Clerk", "Package Sorter", "Courier", "Bike Messenger", "Delivery Driver", "Parcel Delivery Driver", "Express Courier",
  
  // Telecommunications
  "Cell Tower Technician", "Cable Installer", "Satellite Technician", "Telephone Operator", "Call Center Supervisor", "Network Technician", "Fiber Optic Technician",
  
  // Funeral Services
  "Funeral Director", "Mortician", "Embalmer", "Crematorium Operator", "Cemetery Groundskeeper", "Grave Digger", "Memorial Counselor",
  
  // Jewelry & Precious Metals
  "Goldsmith", "Silversmith", "Diamond Cutter", "Gemologist", "Jewelry Designer", "Jewelry Appraiser", "Watch Maker", "Engraver",
  
  // Other Professional Services
  "Translator", "Interpreter", "Court Interpreter", "Sign Language Interpreter", "Transcriptionist", "Medical Transcriptionist", "Voice Over Artist", "Auctioneer", "Appraiser", "Home Stager", "Feng Shui Consultant", "Professional Organizer", "Closet Organizer", "Moving Company Worker", "Junk Removal Worker", "Handyman", "General Laborer", "Day Laborer",
  
  // Emerging & Gig Economy
  "Freelancer", "Consultant", "Independent Contractor", "Gig Worker", "TaskRabbit Worker", "Instacart Shopper", "DoorDash Driver", "Grubhub Driver", "Postmates Driver", "Amazon Flex Driver", "Airbnb Host", "Online Seller", "eBay Seller", "Etsy Seller", "Dropshipper", "Affiliate Marketer", "Online Coach", "Virtual Tutor", "Remote Worker", "Digital Nomad", "Crypto Miner", "NFT Artist", "Blockchain Consultant", "Smart Contract Developer", "DAO Contributor",
  
  // Miscellaneous
  "Astrologer", "Fortune Teller", "Tarot Reader", "Psychic", "Hypnotherapist", "Sleep Consultant", "Professional Cuddler", "Professional Sleeper", "Mystery Shopper", "Product Tester", "Taste Tester", "Beer Tester", "Ice Cream Taster", "Mattress Tester", "Water Slide Tester", "Toy Tester", "Video Game Tester", "Bug Bounty Hunter", "Ethical Hacker", "Professional Gamer", "eSports Player", "Chess Player", "Professional Poker Player", "Professional Gambler", "Prop Maker", "Special Effects Technician", "Pyrotechnician", "Balloon Artist", "Face Painter", "Caricature Artist", "Street Artist", "Graffiti Artist", "Muralist", "Sign Painter", "Billboard Installer",
  
  // Unconventional
  "Snake Milker", "Iceberg Mover", "Professional Mourner", "Golf Ball Diver", "Crime Scene Cleaner", "Hazmat Cleaner", "Odor Tester", "Ostrich Babysitter", "Panda Nanny", "Dog Food Tester", "Bingo Manager", "Parking Enforcement Officer", "Meter Maid", "Train Pusher", "Line Stander", "Professional Bridesmaid", "Professional Best Man", "Netflix Tagger", "Waterslide Tester", "Lego Builder", "Voice Dubbing Artist"
].sort();

export default function JobSelector({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [filteredJobs, setFilteredJobs] = useState(WORLD_JOBS);
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setSearchQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = WORLD_JOBS.filter(job => 
        job.toLowerCase().includes(query)
      ).slice(0, 50);
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(WORLD_JOBS.slice(0, 50));
    }
  }, [searchQuery]);

  const handleSelect = (job) => {
    setSearchQuery(job);
    onChange(job);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    onChange("");
    setIsOpen(true);
  };

  return (
    <div ref={selectorRef} className="relative">
      <div className="relative">
        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for your job (e.g., Software Engineer, Teacher, Chef...)"
          className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
          disabled={disabled}
        />
        {searchQuery && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && !disabled && filteredJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-black border border-white/20 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50 backdrop-blur-xl"
          >
            <div className="p-2">
              {filteredJobs.map((job, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(job)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <span className="text-white text-sm">{job}</span>
                  </div>
                  {searchQuery === job && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                </button>
              ))}
            </div>

            {filteredJobs.length === 0 && searchQuery && (
              <div className="p-6 text-center text-gray-400 text-sm">
                No jobs found matching "{searchQuery}"
              </div>
            )}

            {filteredJobs.length === 50 && (
              <div className="p-2 border-t border-white/10 text-center text-xs text-gray-500">
                Showing first 50 results • Keep typing to narrow down
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}