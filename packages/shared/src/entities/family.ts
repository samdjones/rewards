import type { FamilyRole } from '../enums.js';

export interface Family {
  id: number;
  name: string;
  invite_code: string;
  profile_image: string | null;
  holiday_mode: number;
  weather_location: string | null;
  slideshow_mode: string;
  slideshow_interval: number;
  slideshow_include_avatars: number;
  bus_stop_atco_code: string | null;
  bus_route_filter: string | null;
  created_at: string;
}

export interface FamilyMember {
  id: number;
  family_id: number;
  user_id: number;
  role: FamilyRole;
  joined_at: string;
}
