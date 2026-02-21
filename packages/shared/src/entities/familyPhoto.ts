export interface FamilyPhoto {
  id: number;
  family_id: number;
  uploaded_by: number;
  image_data: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}
