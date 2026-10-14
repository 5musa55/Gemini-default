export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  university: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type ListingStatus = "active" | "reserved" | "sold";

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
};

export type ListingWithProfile = Listing & {
  profiles?: Profile | null;
};

export const CATEGORIES = [
  "Všechny kategorie",
  "Učebnice a skripta",
  "Elektronika",
  "Bydlení a nábytek",
  "Oblečení a doplňky",
  "Sport a volný čas",
  "Ostatní",
] as const;

export type Category = (typeof CATEGORIES)[number];
