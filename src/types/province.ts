/**
 * Province — Vietnamese provinces/cities for the map.
 * Maps to DB `province` table + /provinces API.
 */
export interface Province {
  id: string;
  name: string;
  code: string;
  hasProject: boolean;
  centerCount: number;
}
