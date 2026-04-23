import {
  IconRecycle,
  IconUsers,
  IconShirt,
  IconDeviceLaptop,
  IconHome,
  IconBook,
  IconSoup,
  IconRobot,
} from "@tabler/icons-react";

export const productCategories = [
  {
    name: "Used & Resale",
    icon: IconRecycle,
    subcategories: [
      "Electronics (Used)",
      "Furniture & Home (Used)",
      "Clothing (Used)",
      "Appliances (Used)",
      "Books (Used)",
      "Office Equipment (Used)",
      "Miscellaneous Items",
    ],
  },

  {
    name: "Electronics",
    icon: IconDeviceLaptop,
    subcategories: [
      "Mobile Phones",
      "Laptops & Computers",
      "Accessories",
      "Gaming",
      "Wearables",
      "Home Electronics",
    ],
  },

  {
    name: "Home & Living",
    icon: IconHome,
    subcategories: [
      "Furniture",
      "Home Decor",
      "Kitchen & Dining",
      "Bedding",
      "Lighting",
      "Storage & Organization",
    ],
  },

  {
    name: "Fashion",
    icon: IconShirt,
    subcategories: [
      "Men’s Clothing",
      "Women’s Clothing",
      "Kids Clothing",
      "Shoes",
      "Bags",
      "Accessories",
    ],
  },

  {
    name: "Food & Grocery",
    icon: IconSoup,
    subcategories: [
      "Groceries",
      "Snacks",
      "Beverages",
      "Organic Food",
      "Packaged Food",
      "Fresh Produce",
    ],
  },

  {
    name: "Local & Community Products",
    icon: IconUsers,
    subcategories: [
      "Food & Grocery",
      "Traditional Clothing & Textiles",
      "Handmade & Handicrafts",
      "Cultural Art & Decor",
      "Natural & Health Products",
      "Local Farm Produce",
      "Homemade Products",
    ],
  },

  {
    name: "Books & Learning",
    icon: IconBook,
    subcategories: [
      "Academic Books",
      "Fiction",
      "Non-fiction",
      "Children’s Books",
      "Study Materials",
      "Religious Books",
    ],
  },

  {
    name: "Toys & Games",
    icon: IconRobot,
    subcategories: [
      "Educational Toys",
      "Board Games",
      "Puzzles",
      "Action Figures",
      "Kids Toys",
    ],
  },
];
